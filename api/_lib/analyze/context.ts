import type { GoogleGenAI } from '@google/genai';

// Everything a task handler needs from api/analyze.ts once the request has
// passed auth, rate limiting, idempotency and the quota gate.
export interface TaskContext {
  res: any;
  body: any;
  ai: GoogleGenAI;
  task: any;
  mode: any;
  language: string;
  image: any;
  originalItems: any;
  childAge: any;
  childEnglishLevel: any;
  parentEnglishLevel: any;
  userData: any;
  userRef: any;
  userSnap: any;
  realUserPlan: string;
  today: string;
  isNewDay: boolean;
  isNewGenerateDay: boolean;
  decodedToken: any;
  ipString: string;
  firebaseAdminAvailable: boolean;
  metered: boolean;
  reserve: (field: string, max: number, floor: number) => Promise<boolean>;
  cacheKey: string;
}
