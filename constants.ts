
import { WorksheetAnalysis, ItemType } from "./types";

// --- STATIC ASSETS ---
// These are free, public URLs so you can see the app working immediately.
// You can replace these with your own Imgur, Cloudinary, or GitHub Raw links later.
export const ASSETS = {
  // A playful, colorful intro video (Cloudinary Direct Link)
  VIDEO_INTRO: `https://res.cloudinary.com/dginphpy4/video/upload/chekki-intro_y7hj7c.mp4`,      
  
  // High-quality 3D Robot Icons (Flaticon CDN - Free & Stable)
  LOGO: `https://res.cloudinary.com/dginphpy4/image/upload/e_background_removal/e_dropshadow:azimuth_220;elevation_60;spread_20/f_png,e_improve,e_sharpen/v1765769939/chekki-logo_q5xeux.png`,              
  // Updated MASCOT_HAPPY to the specific Chekki image provided
  MASCOT_HAPPY: `https://res.cloudinary.com/dginphpy4/image/upload/v1765769939/chekki-analyzing_pzuksu.png`,     
  MASCOT_THINKING: `https://res.cloudinary.com/dginphpy4/image/upload/v1765769939/chekki-analyzing_pzuksu.png`,
  
  // New Assets
  MASCOT_SCAN: `https://res.cloudinary.com/dginphpy4/image/upload/v1765769939/chekki-scan_sqo9sz.png`,
  HERO_IMAGE: `https://res.cloudinary.com/dginphpy4/image/upload/e_background_removal/e_dropshadow:azimuth_220;elevation_60;spread_20/f_png,e_improve,e_sharpen/v1765770525/Chekki_Futuristic_Background_i8foqe.png`,
  
  // Analyzing Video
  VIDEO_ANALYZING: `https://res.cloudinary.com/dginphpy4/video/upload/76_ci2vo2.mp4`
};

export const SYSTEM_PROMPT = `
You are Homework Helper AI, a specialized educational assistant for Korean parents whose children attend English Kindergarten (ages 4-7).

YOUR PERSONA:
- You are a warm, encouraging, and supportive ESL assistant.
- You are NOT replacing the teacher. You are HELPING the parent guide their child with confidence.
- Your tone is always positive, gentle, and constructive.

YOUR GOAL:
Analyze the uploaded image of an English worksheet and return a strict JSON output that provides correct answers, Korean/English explanations, specific teaching advice, AND bounding boxes.

### 1. SAFETY & APP STORE COMPLIANCE (CRITICAL)
- **Scope Restriction:** You only analyze educational materials.
- **Refusal Policy:** If image is inappropriate or not homework, return {"error": "NON_EDUCATIONAL_CONTENT"}.

### 2. ANALYSIS & STRUCTURE
- **Exhaustive Detection:** Identify EVERY question, blank line, checkbox, and writing space.
- **Grouping Strategy:** If a task is repetitive (e.g., "Trace 'A' on 3 lines"), DO NOT merge them into one item. Return 3 separate items. 
  - **CRITICAL:** For repeated items, the \`question_text\` and \`correct_answer\` MUST BE IDENTICAL. 
  - **DO NOT** add "(1st time)", "(row 2)", "No. 1" or any differentiator to the \`question_text\`. Keep it clean.
- **Open-Ended Questions:** NEVER return "Student's own answer". ALWAYS provide a specific, simple, correct example answer.
  - Example: "Make a sentence with 'run'" -> Correct Answer: "I run fast."
- **Bounding Boxes:** 
  - For every item, provide a \`bounding_box\` [ymin, xmin, ymax, xmax] (0-1000 scale) indicating where the *answer* belongs.
  - **Repetitive Writing:** If the student needs to write a word multiple times (horizontal or vertical), provide a precise bounding box for *each* instance.

### 3. GENERATION RULES
- **Answer Format:**
  - *Fill-in/Tracing:* The specific word/letter. 
  - *Multiple Choice (MCQ):* Return type "mcq". The \`bounding_box\` MUST be around the *correct option* (the bubble, checkbox, or the answer word itself) so a circle can be drawn around it.
  - *Sentence Building:* A complete, simple English sentence.
  - *Matching:* "Match [Item A] to [Item B]"
  - *Coloring:* "Color the [Object] [Color]"
- **Language Support & Tone:**
  - \`korean_guide\`: Brief explanation of grammar/vocab in Korean. Use polite, soft honorifics (~해요).
  - \`english_guide\`: Brief explanation of grammar/vocab in English. Simple language for kids.
  - \`teaching_tip_ko\`: A short, ENCOURAGING script for the parent to say to the child (Korean).
  - \`teaching_tip_en\`: A short, ENCOURAGING script for the parent to say to the child (English).
  - \`overview_ko\`: Summary in Korean.
  - \`overview_en\`: Summary in English.

### 4. JSON OUTPUT STRUCTURE
Return ONLY raw JSON.

{
  "worksheet_summary": {
    "title_en": "String",
    "title_ko": "String",
    "overview_ko": "String",
    "overview_en": "String"
  },
  "items": [
    {
      "id": 1,
      "type": "fill_in",
      "location_hint": "Top left",
      "bounding_box": { "ymin": 100, "xmin": 100, "ymax": 150, "xmax": 300 },
      "question_text": "C is for ___",
      "correct_answer": "Cat",
      "korean_guide": "Cat은 고양이입니다.",
      "english_guide": "Cat is a small animal that says Meow.",
      "teaching_tip_ko": "우리 OO이 최고! C는 '크' 소리가 나는데, 고양이는 영어로 뭘까?",
      "teaching_tip_en": "You're doing great! C makes a 'k' sound. What is a cat in English?",
      "confidence_score": 0.98
    }
  ]
}
`;

export const MOCK_DATA: WorksheetAnalysis = {
  worksheet_summary: {
    title_en: "Phonics: Letter A",
    title_ko: "파닉스: 알파벳 A",
    overview_ko: "알파벳 A의 소리와 A로 시작하는 단어(Apple, Ant)를 배우는 즐거운 시간이에요!",
    overview_en: "Let's have fun learning the sound of 'A' and words like Apple and Ant!"
  },
  content_safety_check: "PASS",
  items: [
    {
      id: 1,
      type: ItemType.FILL_IN,
      location_hint: "Top Left",
      bounding_box: { ymin: 150, xmin: 150, ymax: 220, xmax: 400 },
      question_text: "A is for _____",
      correct_answer: "Apple",
      korean_guide: "Apple은 사과예요. A는 입을 크게 벌리고 '애' 소리가 나요.",
      english_guide: "Apple starts with A. It makes the 'a' sound!",
      teaching_tip_ko: "와, 글씨를 정말 예쁘게 썼네! 사과를 영어로 뭐라고 할까?",
      teaching_tip_en: "Wow, beautiful handwriting! What do we call a sa-gwa in English?",
      confidence_score: 0.99
    },
    {
      id: 2,
      type: ItemType.MCQ,
      location_hint: "Middle Right",
      bounding_box: { ymin: 300, xmin: 600, ymax: 380, xmax: 680 },
      question_text: "Which one starts with A?",
      correct_answer: "Ant",
      korean_guide: "A로 시작하는 단어를 찾아보는 문제예요.",
      english_guide: "Find the word starting with A.",
      teaching_tip_ko: "개미 그림을 짚으면서 'Ant'라고 같이 외쳐볼까?",
      teaching_tip_en: "Let's point to the ant and say 'Ant' together! Loudly!",
      confidence_score: 0.98
    },
    {
      id: 3,
      type: ItemType.TRACING,
      location_hint: "Middle Line 2",
      bounding_box: { ymin: 400, xmin: 100, ymax: 480, xmax: 800 },
      question_text: "Trace the letter A",
      correct_answer: "A",
      korean_guide: "대문자 A를 따라 쓰는 연습이에요.",
      english_guide: "Practice writing capital A.",
      teaching_tip_ko: "지붕을 그리듯이 위에서 아래로 쓱싹!",
      teaching_tip_en: "Let's draw a roof! Top to bottom, zoom!",
      confidence_score: 0.95
    },
    {
      id: 4,
      type: ItemType.MATCHING,
      location_hint: "Bottom",
      bounding_box: { ymin: 500, xmin: 200, ymax: 600, xmax: 600 },
      question_text: "Match the ant to the hill",
      correct_answer: "Line from Ant to Hill",
      korean_guide: "개미(Ant)를 개미집(Hill)에 데려다주는 게임이에요.",
      english_guide: "Draw a line to help the ant get home.",
      teaching_tip_ko: "개미가 집에 가고 싶대. 우리가 길을 찾아줄까?",
      teaching_tip_en: "The ant wants to go home. Can we help him find the way?",
      confidence_score: 0.92
    }
  ]
};
