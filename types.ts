
export enum ItemType {
  FILL_IN = 'fill_in',
  MATCHING = 'matching',
  COLORING = 'coloring',
  TRACING = 'tracing',
  MCQ = 'mcq',
  OTHER = 'other'
}

export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface WorksheetItem {
  id: number;
  type: ItemType | string;
  location_hint: string;
  bounding_box?: BoundingBox; 
  question_text: string;
  correct_answer: string;
  korean_guide: string;
  english_guide?: string;
  teaching_tip_ko: string;
  teaching_script_ko?: string;
  teaching_tip_en?: string;
  handwriting_tip_ko?: string;
  confidence_score: number;
  group_id?: string;
}

export interface WorksheetSummary {
  title_en: string;
  title_ko: string;
  overview_ko: string;
  overview_en?: string;
  total_score?: number;
}

export interface WorksheetAnalysis {
  worksheet_summary?: WorksheetSummary;
  content_safety_check?: string;
  items?: WorksheetItem[];
  error?: string;
  message_ko?: string;
}

export interface UserProfile {
  uid?: string;
  name: string;
  email: string;
  photoUrl?: string;
  plan: 'free' | 'pro';
  scansUsedToday: number;
  lastScanDate: string;
  maxScansPerDay: number;
  totalStamps?: number;
  subscriptionStartedAt?: string;
  nextBillingDate?: string;
  isCanceled?: boolean;
  referredBy?: string;
  referralCount?: number;
}

export type AppView = 'onboarding' | 'camera' | 'analyzing' | 'workspace';
export type WorkspaceMode = 'overlay' | 'split';

export interface AnalysisState {
  status: 'idle' | 'analyzing' | 'complete' | 'error';
  data: WorksheetAnalysis | null;
  originalImage: string | null; 
  errorMessage: string | null;
  showReward?: boolean;
  isSummaryLoaded?: boolean; // New: track partial loading
  isItemsLoaded?: boolean;    // New: track partial loading
}

export interface CommunityPost {
  id: string;
  author: string;
  avatar: string;
  timeAgo: string;
  content: string;
  likes: number;
  comments: number;
  tag?: string;
}
