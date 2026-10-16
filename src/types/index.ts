export type Role = 'USER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  streak_days: number;
  xp: number;
  avatar_url?: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  plan_name: string;
  status: 'free' | 'active' | 'pro' | 'premium' | 'cancelled' | 'expired';
  price_inr?: number;
  starts_at?: string;
  ends_at?: string;
  features?: string[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price_inr: number;
  currency: string;
  billing_cycle: string;
  features: string[];
  is_active: number;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  language: string;
  cefr_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  image_url: string;
  is_premium: boolean;
  learning_outcomes: string[];
  created_at: string;
  is_enrolled?: boolean;
  total_lessons?: number;
  completed_lessons?: number;
  progress_percent?: number;
}

export type ModalityType = 'reading' | 'listening' | 'video' | 'speaking' | 'writing' | 'grammar_vocab';

export interface LessonActivity {
  id: string;
  modality: ModalityType;
  title: string;
  content: any;
  order_index: number;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  summary: string;
  order_index: number;
  duration_minutes: number;
  is_free_preview: boolean;
  modalities: ModalityType[];
  status?: 'not_started' | 'in_progress' | 'completed';
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  type: 'single_choice' | 'multi_choice' | 'fill_blank';
  options: string[];
  order_index: number;
}

export interface Quiz {
  id: string;
  course_id: string;
  title: string;
  description: string;
  passing_score: number;
  is_final_assessment: boolean;
  total_questions: number;
}

export interface QuizSubmissionReview {
  questionId: string;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizResult {
  score: number;
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
  passingThreshold: number;
  xpAwarded: number;
  reviews: QuizSubmissionReview[];
  message: string;
}

export interface Certificate {
  id: string;
  user_id?: string;
  course_id?: string;
  recipient_name: string;
  course_title: string;
  issue_date: string;
  final_score: number;
  is_revoked?: boolean;
  revoked_reason?: string;
  revoked_at?: string;
}

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  unlocked_at?: string;
}

export interface SkillScore {
  skill: string;
  score: number;
}

export interface DashboardStats {
  user: User;
  completedLessonsCount: number;
  enrollments: Array<Course & { enrolled_at: string }>;
  skills: SkillScore[];
  achievements: {
    unlocked: Achievement[];
    totalCount: number;
    unlockedCount: number;
  };
  certificates: Certificate[];
  recentXp: Array<{
    id: string;
    amount: number;
    reason: string;
    created_at: string;
  }>;
}

export interface LiveClass {
  id: string;
  title: string;
  description: string;
  course_id?: string;
  course_title?: string;
  course_language?: string;
  lesson_id?: string;
  instructor_id: string;
  instructor_name: string;
  scheduled_at: string;
  duration_minutes: number;
  max_capacity: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  room_name: string;
  recording_url?: string;
  created_at: string;
  registered_count?: number;
  is_registered?: boolean;
  is_full?: boolean;
}

export interface LiveClassMessage {
  id: string;
  class_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  message: string;
  is_announcement: number;
  created_at: string;
}

export interface LiveClassAttendance {
  id: string;
  class_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  joined_at: string;
  left_at?: string;
  duration_seconds: number;
}

export interface PeerParticipant {
  userId: string;
  name: string;
  role: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isHandRaised: boolean;
  isScreenSharing: boolean;
  stream?: MediaStream | null;
}

