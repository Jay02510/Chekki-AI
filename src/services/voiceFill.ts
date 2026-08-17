import { auth } from '../../services/database';

export interface VoiceFillTurn {
  role: 'user' | 'model';
  text: string;
}

export interface VoiceFillFields {
  lessonTopic?: string;
  textbook?: string;
  energyLevel?: string;
  activities?: string[];
  generalComments?: string;
}

export interface VoiceFillException {
  studentName: string;
  details: string;
  category: 'praise' | 'attention';
}

export interface VoiceFillResponse {
  transcript: string;
  updatedFields: VoiceFillFields;
  newExceptions?: VoiceFillException[];
  missingRequired: string[];
  nextQuestion: string;
  assistantReplyForHistory: string;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip the "data:audio/webm;base64," prefix — backend expects raw base64.
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function callVoiceLogFill(
  audioBlob: Blob,
  history: VoiceFillTurn[],
  currentFields: VoiceFillFields,
  language: 'ko' | 'en' = 'ko',
  phase: 'general' | 'exceptions' = 'general'
): Promise<VoiceFillResponse> {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error('Not authenticated');

  const audio = await blobToBase64(audioBlob);

  // Without this, a stalled network leaves the mic button's spinner running
  // indefinitely with no way out short of a page reload.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  let response: Response;
  try {
    response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      signal: controller.signal,
      body: JSON.stringify({
        task: 'voice_log_fill',
        audio,
        mimeType: audioBlob.type || 'audio/webm',
        history,
        currentFields,
        language,
        phase,
      }),
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`voice_log_fill failed: ${response.status}`);
  }
  return response.json();
}
