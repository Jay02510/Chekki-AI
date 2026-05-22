
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
  question_text: string;
  correct_answer: string;
  korean_guide: string;
  english_guide?: string;
  teaching_script_ko: string; // Standardized
  teaching_script_en?: string;
  handwriting_tip_ko?: string;
  confidence_score?: number;
  group_id?: string;
  bounding_box?: BoundingBox;
  custom_coords?: { top: number; left: number };
  student_response?: string;
  is_correct?: boolean;
}

export interface UserProfile {
  uid?: string;
  name: string;
  email: string;
  plan: 'free' | 'pro';
  scansUsedToday: number;
  lastScanDate: string;
  maxScansPerDay: number;
  questionsUsedToday: number;
  maxQuestionsPerDay: number;
  lastQuestionDate: string;
  subscriptionStartedAt?: string | null;
  nextBillingDate?: string | null;
  isCanceled?: boolean;
  schoolId?: string | null;
  schoolName?: string | null;
  subscriptionPlatform?: SubscriptionPlatform;
  childAge?: string;
  childEnglishLevel?: string;
  parentEnglishLevel?: string;
}

// --- Subscription System ---
export type SubscriptionStatus = 'active' | 'expired' | 'none' | 'cancelled';
export type SubscriptionPlatform = 'apple' | 'google' | 'android' | 'web' | 'school_code' | 'admin_upgrade' | 'none';

export interface SubscriptionRecord {
  user_id: string;
  subscription_status: SubscriptionStatus;
  subscription_platform: SubscriptionPlatform;
  subscription_expiry_date: string | null;
  subscription_start_date?: string | null;
  apple_receipt?: string | null;
  apple_original_transaction_id?: string | null;
  apple_product_id?: string | null;
  google_purchase_token?: string | null;
  web_subscription_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface WorksheetSummary {
  title_en: string;
  title_ko: string;
  overview_ko: string;
  overview_en?: string;
  total_score?: number;
  worksheet_type?: string;
}

export interface WorksheetAnalysis {
  worksheet_summary?: WorksheetSummary;
  content_safety_check?: string;
  items?: WorksheetItem[];
  error?: string;
  message_ko?: string;
}

export type AppView = 'onboarding' | 'camera' | 'analyzing' | 'workspace';
export type WorkspaceMode = 'overlay' | 'split';
// Define LegalType here to be accessible throughout the app
export type LegalType = 'privacy' | 'terms' | 'refund' | 'youth' | 'support';

export interface AnalysisState {
  status: 'idle' | 'analyzing' | 'complete' | 'error';
  data: WorksheetAnalysis | null;
  originalImage: string | null;
  errorMessage: string | null;
  showReward?: boolean;
  isSummaryLoaded?: boolean;
  isItemsLoaded?: boolean;
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