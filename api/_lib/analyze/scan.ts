import { HarmCategory, HarmBlockThreshold } from '@google/genai';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../firebaseAdmin.js';
import { logUsage } from './gemini.js';
import { SYSTEM_PROMPT, CONSOLIDATED_SCHEMA, verifyKeyGrounding } from './scanPrompt.js';
import type { TaskContext } from './context.js';

// Worksheet scan: grade the photo, grounded in the class answer key for enrolled students.
export async function handleScan(ctx: TaskContext): Promise<any> {
  const {
    res,
    ai,
    task,
    language,
    image,
    childAge,
    childEnglishLevel,
    parentEnglishLevel,
    userData,
    userRef,
    userSnap,
    realUserPlan,
    today,
    isNewDay,
    firebaseAdminAvailable,
    cacheKey,
    decodedToken,
  } = ctx;
  if (!image || typeof image !== 'string')
    return res.status(400).json({ error: 'INVALID_IMAGE_DATA' });

  let curriculumContext = '';
  let answerKey: { questionText?: string; answer?: string }[] = [];
  // Set when the scan should be copied to the class for the teacher dashboard.
  let classScanTarget: string | null = null;

  if (
    userData?.schoolId &&
    userData?.classId &&
    userData?.classStatus === 'active' &&
    firebaseAdminAvailable
  ) {
    try {
      const db = adminDb;

      // 1. Fetch the active class document to get the current activeWeekNumber
      const classRef = db.collection('classes').doc(userData.classId);
      const classSnap = await classRef.get();

      if (classSnap.exists) {
        classScanTarget = userData.classId;
        const classData = classSnap.data();
        const activeWeek = classData?.activeWeekNumber;

        if (activeWeek !== undefined && activeWeek !== null) {
          // 2. Fetch this week's curriculum doc, plus last week's for its
          // answer key: the director advances the week by hand, so a child
          // finishing last week's sheet, or a week change before the new key
          // is loaded, still grades against a real key.
          const weekDoc = async (week: number) => {
            let snap = await db
              .collection('curriculums')
              .doc(`${userData.classId}_week_${week}`)
              .get();
            if (!snap.exists) {
              snap = await db
                .collection('curriculums')
                .doc(`${userData.schoolId}_${userData.classId}_W${week}`)
                .get();
            }
            return snap.exists ? snap.data() : undefined;
          };
          const week = Number(activeWeek);
          const [currentWeek, previousWeek] = await Promise.all([
            weekDoc(week),
            week > 1 ? weekDoc(week - 1) : Promise.resolve(undefined),
          ]);

          if (currentWeek || previousWeek) {
            const curriculumData = currentWeek;
            const rawVocab = curriculumData?.vocabWords || curriculumData?.vocabList || [];
            const passage = curriculumData?.passage || '';
            const rawPhonics = curriculumData?.phonicsRules || [];
            // Literal question/answer pairs from a teacher's worksheet scan
            // (TeacherPage.tsx's curriculumAnswerKey) — previously extracted
            // by the AI at upload time and discarded; grading only ever had
            // vocab/phonics/passage as loose context, never a ground-truth
            // answer to check against directly.
            // This week's entries win over last week's for the same question.
            const seenQuestions = new Set<string>();
            const rawAnswerKey = [currentWeek?.answerKey, previousWeek?.answerKey]
              .flatMap((key) => (Array.isArray(key) ? key : []))
              .filter((a: any) => {
                const q = String(a?.questionText || '');
                if (seenQuestions.has(q)) return false;
                seenQuestions.add(q);
                return true;
              });

            const vocab = Array.isArray(rawVocab)
              ? rawVocab
              : typeof rawVocab === 'string'
                ? (rawVocab as string).split(',').map((s) => s.trim())
                : [];
            const phonics = Array.isArray(rawPhonics)
              ? rawPhonics
              : typeof rawPhonics === 'string'
                ? (rawPhonics as string).split(',').map((s) => s.trim())
                : [];
            // AI-inferred entries the teacher hasn't confirmed aren't a key.
            answerKey = rawAnswerKey.filter(
              (a: any) => a?.questionText && a?.answer && a?.inferred !== true
            );
            const answerKeyLines = answerKey.map((a: any) => `- "${a.questionText}" → ${a.answer}`);

            curriculumContext = `\n\nB2B SCHOOL & CURRICULUM CONTEXT:
The student belongs to the partner school "${userData.schoolName || userData.schoolId}" and is enrolled in the class "${classData?.name || 'Active Class'}".
This week's active learning curriculum details (Week ${activeWeek}):
- Target Vocabulary Words: [${vocab.join(', ')}]
- Target Phonics Rules/Sounds: [${phonics.join(', ')}]
${passage ? `- Reference Reading Passage:\n"""\n${passage}\n"""` : ''}
${answerKeyLines.length > 0 ? `- Known Answer Key for this week's and last week's worksheets (question → correct answer, from the teacher's own upload):\n${answerKeyLines.join('\n')}` : ''}

CRITICAL OCR & SPELLING GRADING INSTRUCTIONS:
1. Use the vocabulary list, phonics rules, and reading passage above to guide your OCR analysis of handwritten responses. If the student's handwriting closely resembles a target vocabulary word (allowing for minor spelling mistakes or malformed characters), match it.
2. Cross-reference answers with the provided reading passage to evaluate reading comprehension accuracy.
${answerKeyLines.length > 0 ? "2a. ANSWER KEY PRIORITY: If a question on the scanned worksheet matches (or closely matches) one of the questions in the Known Answer Key above, use that key's answer as ground truth instead of inferring the correct answer yourself — the teacher already confirmed it — and set graded_against_key to true for that item. Only fall back to your own judgment for questions not covered by the key." : ''}
3. BLANK / UNANSWERED WORKSHEET DETECTION: If the scanned image contains no handwritten student responses in the designated answer areas (i.e., an unattempted or blank worksheet page), do NOT score it as 100% correct or 0 mistakes. Mark unanswered items clearly so that scanning a blank sheet does not pollute the teacher's error-tracking statistics.
4. ENCOURAGING RESCAN PROMPT FOR MOMS: If any student mistakes are found, include a warm, encouraging Korean rescan callout encouraging mom to have the child fix the answer on the paper and rescan: "아이가 틀린 단어를 종이에 다시 고쳐 쓴 뒤 2차 재도전 스캔을 올려주시면 바로 2차 채점 및 완벽 마스터로 업데이트됩니다!";`;
          }
        }
      }
    } catch (err: any) {
      console.warn(
        '⚠️ [api/analyze.ts] Failed to query curriculum context from Firestore:',
        err.message
      );
    }
  }

  const performAnalysis = async (useThinking: boolean) => {
    let currentSystemPrompt = SYSTEM_PROMPT;
    if (curriculumContext) {
      currentSystemPrompt += curriculumContext;
    }
    if (childAge && childEnglishLevel) {
      currentSystemPrompt += `\n\nCRITICAL CONTEXT: The student is ${childAge} years old and has an English experience level of "${childEnglishLevel}". Strictly tailor your teaching scripts, vocabulary, and pedagogy to match this child's development stage. Use simpler terms and explanations for younger or beginner students.`;
    }
    if (parentEnglishLevel) {
      currentSystemPrompt += `\nAdditionally, the PARENT's English level is "${parentEnglishLevel}". Tailor the complexity of the korean_guide and english_guide to suit the parent's understanding.`;
    }

    if (language === 'ko') {
      currentSystemPrompt += `\n\nPRIMARY LANGUAGE: Korean. You must focus your pedagogical explanations and overviews in Korean. Provide rich, detailed Korean guides (korean_guide, teaching_script_ko). The English fields can be brief literal translations.`;
    } else {
      currentSystemPrompt += `\n\nPRIMARY LANGUAGE: English. You must focus your pedagogical explanations exclusively in English. Write the 'overview_ko' field entirely in English. Provide rich, detailed English guides (english_guide, teaching_script_en), while the Korean fields can be brief literal translations.`;
    }

    const configOpts: any = {
      systemInstruction: currentSystemPrompt,
      responseMimeType: 'application/json',
      responseSchema: CONSOLIDATED_SCHEMA as any,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    };

    // Determine model based on the SECURE pass tier
    let currentModel = 'gemini-2.5-flash'; // Verified working stable model

    if (useThinking && realUserPlan === 'pro') {
      currentModel = 'gemini-2.5-pro';
      configOpts.thinkingConfig = { thinkingBudget: 2048 };
    }

    return ai.models.generateContent({
      model: currentModel,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: image } },
            {
              text: "Analyze this worksheet for summary and answer key. IMPORTANT: All 'correct_answer' fields must be the FULL text of the answer, including choice letters (e.g. 'A. Text content'). NEVER provide just a letter.",
            },
          ],
        },
      ],
      config: configOpts,
    });
  };

  let result;
  try {
    // Fast pass: flash with no thinking budget, for speed.
    const fastResponse = await performAnalysis(false);
    logUsage('analyze:fast', fastResponse);
    let resultText = fastResponse.text || '{}';
    resultText = resultText.replace(/```json\n?|```/g, '').trim();
    result = JSON.parse(resultText);

    // If the fast pass mysteriously finds 0 questions on a Pro plan, treat it as a false-negative and trigger fallback.
    if (realUserPlan === 'pro' && (!result.items || result.items.length === 0)) {
      throw new Error('TriggerFallback');
    }
  } catch (e: any) {
    // A rate-limited/overloaded Gemini API used to trigger an immediate
    // second call here for pro users — doubling load against an API
    // that's already struggling, right when it's least likely to help.
    // Let a transient failure propagate straight to the outer catch
    // (which now returns a distinct AI_TEMPORARILY_UNAVAILABLE) instead.
    const errText = `${e?.status || ''} ${e?.message || ''}`;
    const isTransient = /429|503|RESOURCE_EXHAUSTED|UNAVAILABLE|overloaded/i.test(errText);
    if (realUserPlan === 'pro' && !isTransient) {
      console.log(
        '[Backend] Fast pass failed or found 0 questions. Falling back to gemini-2.5-pro with a 2048-token thinking budget...'
      );
      const fallbackResponse = await performAnalysis(true);
      logUsage('analyze:thinking_fallback', fallbackResponse);
      let resultText = fallbackResponse.text || '{}';
      resultText = resultText.replace(/```json\n?|```/g, '').trim();
      result = JSON.parse(resultText);
    } else {
      throw e;
    }
  }

  // Update the database securely on success
  if (userSnap && userSnap.exists && realUserPlan !== 'pro') {
    try {
      if (!['generate', 'refine'].includes(task)) {
        await userRef.update({
          scansUsedToday: isNewDay ? 1 : FieldValue.increment(1),
          lastScanDate: today,
        });
      }
    } catch (e) {
      console.warn('Could not update limits locally.', e);
    }
  }

  const finalItems = verifyKeyGrounding(result.items || [], answerKey);

  // Copy the result to the class so the teacher dashboard sees it. Written
  // here rather than by the client so the score can't be edited on the way
  // and a failed write shows up in server logs instead of a console.warn.
  if (classScanTarget && decodedToken?.uid) {
    const mistakes = finalItems.filter((item: any) => item.is_correct === false);
    const id = `scan_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;
    try {
      await adminDb
        .collection('classes')
        .doc(classScanTarget)
        .collection('studentScans')
        .doc(id)
        .set({
          id,
          classId: classScanTarget,
          studentUid: decodedToken.uid,
          studentName:
            userData?.studentName || userData?.name || (language === 'ko' ? '학생' : 'Student'),
          scannedAt: new Date().toISOString(),
          titleEn: result.worksheet_summary?.title_en || 'Worksheet Scan',
          titleKo: result.worksheet_summary?.title_ko || '워크시트 분석',
          totalItems: finalItems.length,
          correctCount: finalItems.length - mistakes.length,
          mistakeCount: mistakes.length,
          keyGradedCount: finalItems.filter((item: any) => item.graded_against_key).length,
          totalScore: Math.round(
            ((finalItems.length - mistakes.length) / Math.max(1, finalItems.length)) * 100
          ),
          redBorderedMistakes: mistakes.map((item: any) => ({
            id: item.id,
            type: item.type || 'other',
            question_text: item.question_text || '',
            correct_answer: item.correct_answer || '',
            student_response: item.student_response || '',
            korean_guide: item.korean_guide || '',
            teaching_script_ko: item.teaching_script_ko || '',
            graded_against_key: item.graded_against_key,
          })),
          hasHandwriting: result.worksheet_summary?.has_handwriting || false,
          isLegible: result.worksheet_summary?.is_handwriting_legible !== false,
        });
    } catch (err: any) {
      console.error('[scan] Failed to copy scan to class', classScanTarget, err?.message);
    }
  }

  // --- WRITE TO DETERMINISTIC IMAGE CACHE ---
  if (cacheKey && firebaseAdminAvailable) {
    try {
      const db = adminDb;
      await db
        .collection('image_analyses_cache')
        .doc(cacheKey)
        .set({
          response: {
            worksheet_summary: result.worksheet_summary,
            items: finalItems,
          },
          createdAt: FieldValue.serverTimestamp(),
          // Children's homework analysis shouldn't be kept indefinitely —
          // a Firestore TTL policy on expiresAt deletes it after 30 days.
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
      console.log(`[cache] Successfully cached analysis for key: ${cacheKey}`);
    } catch (cacheWriteErr) {
      console.warn('⚠️ [cache] Failed to write analysis to cache:', cacheWriteErr);
    }
  }

  return res.status(200).json({
    worksheet_summary: result.worksheet_summary,
    items: finalItems,
  });
}
