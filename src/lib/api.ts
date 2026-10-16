import {
  User,
  Subscription,
  SubscriptionPlan,
  Course,
  Lesson,
  LessonActivity,
  Quiz,
  QuizQuestion,
  QuizResult,
  Certificate,
  DashboardStats,
  LiveClass,
  LiveClassMessage
} from '../types';

const TOKEN_KEY = 'lingopro_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Authentication
  register: (payload: { name: string; email: string; password: string }) =>
    fetchApi<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  login: (payload: { email: string; password: string }) =>
    fetchApi<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getCurrentUser: () =>
    fetchApi<{ user: User; subscription: Subscription }>('/auth/me'),

  updateProfile: (payload: { name: string }) =>
    fetchApi<{ message: string; name: string }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  logout: () => fetchApi<{ message: string }>('/auth/logout', { method: 'POST' }),

  // Courses
  getCourses: (filters?: { language?: string; level?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.language) params.append('language', filters.language);
    if (filters?.level) params.append('level', filters.level);
    if (filters?.search) params.append('search', filters.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<{ courses: Course[] }>(`/courses${query}`);
  },

  getCourseDetails: (id: string) =>
    fetchApi<{ course: Course; lessons: Lesson[] }>(`/courses/${id}`),

  enrollCourse: (courseId: string) =>
    fetchApi<{ message: string; enrolled: boolean }>(`/courses/${courseId}/enroll`, {
      method: 'POST'
    }),

  // Lessons & Modalities
  getLesson: (lessonId: string) =>
    fetchApi<{
      lesson: Lesson;
      courseTitle: string;
      courseId: string;
      activities: LessonActivity[];
      progress: { status: string; completed_at?: string };
    }>(`/lessons/${lessonId}`),

  completeLesson: (lessonId: string) =>
    fetchApi<{ status: string; xpAwarded: number; message: string }>(`/lessons/${lessonId}/progress`, {
      method: 'POST'
    }),

  saveActivityAttempt: (payload: {
    lessonId: string;
    modality: string;
    payload: any;
    score?: number;
    feedback?: string;
  }) =>
    fetchApi<{ message: string }>('/activities/attempt', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Quizzes & Assessments
  getQuiz: (quizId: string) =>
    fetchApi<{ quiz: Quiz; questions: QuizQuestion[] }>(`/quizzes/${quizId}`),

  submitQuiz: (quizId: string, answers: Record<string, string>) =>
    fetchApi<QuizResult>(`/quizzes/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers })
    }),

  // Dashboard & Analytics
  getDashboardStats: () => fetchApi<DashboardStats>('/dashboard/stats'),

  // Subscriptions & Payments
  getPlans: () => fetchApi<{ plans: SubscriptionPlan[] }>('/plans'),

  getCurrentSubscription: () =>
    fetchApi<{ subscription: Subscription | null; payments: any[] }>('/subscriptions/current'),

  createPaymentOrder: (planId: string) =>
    fetchApi<{
      orderId: string;
      amount: number;
      amountInr: number;
      currency: string;
      planId: string;
      planName: string;
      keyId: string;
    }>('/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ planId })
    }),

  verifyPayment: (payload: {
    orderId: string;
    paymentId: string;
    signature?: string;
    planId: string;
  }) =>
    fetchApi<{ success: boolean; message: string; endsAt: string }>('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Certificates
  checkCertificateEligibility: (courseId: string) =>
    fetchApi<{
      eligible: boolean;
      alreadyClaimed: boolean;
      certificate?: Certificate;
      requirements?: {
        totalLessons: number;
        completedLessons: number;
        allLessonsDone: boolean;
        finalQuizPassed: boolean;
        finalScore: number;
      };
      message?: string;
    }>(`/certificates/eligible/${courseId}`),

  claimCertificate: (courseId: string) =>
    fetchApi<{ message: string; certificate: Certificate }>(`/certificates/claim/${courseId}`, {
      method: 'POST'
    }),

  verifyPublicCertificate: (certId: string) =>
    fetchApi<{
      valid: boolean;
      isRevoked?: boolean;
      certId?: string;
      recipientName?: string;
      courseTitle?: string;
      issueDate?: string;
      finalScore?: number;
      revokedReason?: string;
      message: string;
    }>(`/certificates/verify/${certId}`),

  // Administration - Overview & Auditing
  getAdminOverview: () =>
    fetchApi<{
      metrics: {
        totalUsers: number;
        activeSubs: number;
        revenueInr: number;
        totalEnrollments: number;
        totalCertificates: number;
      };
      recentUsers: any[];
      recentAudit: any[];
    }>('/admin/overview'),

  getAdminUsers: () => fetchApi<{ users: any[] }>('/admin/users'),

  getAdminCertificates: () => fetchApi<{ certificates: any[] }>('/admin/certificates'),

  revokeCertificate: (payload: { certId: string; reason: string }) =>
    fetchApi<{ message: string }>('/admin/certificates/revoke', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Admin CMS - Course Management
  getAdminCourses: () => fetchApi<{ courses: any[] }>('/admin/courses'),

  createCourse: (payload: any) =>
    fetchApi<{ message: string; id: string }>('/admin/courses', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateCourse: (id: string, payload: any) =>
    fetchApi<{ message: string }>(`/admin/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteCourse: (id: string, force?: boolean) =>
    fetchApi<{ message: string; archived?: boolean }>(`/admin/courses/${id}${force ? '?force=true' : ''}`, {
      method: 'DELETE'
    }),

  updateCourseStatus: (id: string, status: 'published' | 'draft' | 'archived') =>
    fetchApi<{ message: string }>(`/admin/courses/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  // Admin CMS - Lesson & Modality Builder
  getAdminLessons: (courseId: string) =>
    fetchApi<{ lessons: any[] }>(`/admin/courses/${courseId}/lessons`),

  getAdminLesson: (id: string) =>
    fetchApi<{ lesson: any; activities: any[] }>(`/admin/lessons/${id}`),

  createLesson: (courseId: string, payload: any) =>
    fetchApi<{ message: string; lessonId: string }>(`/admin/courses/${courseId}/lessons`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateLesson: (id: string, payload: any) =>
    fetchApi<{ message: string }>(`/admin/lessons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteLesson: (id: string) =>
    fetchApi<{ message: string }>(`/admin/lessons/${id}`, {
      method: 'DELETE'
    }),

  reorderLessons: (courseId: string, orderedLessonIds: string[]) =>
    fetchApi<{ message: string }>(`/admin/courses/${courseId}/lessons/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ orderedLessonIds })
    }),

  updateLessonActivities: (id: string, activities: any[]) =>
    fetchApi<{ message: string }>(`/admin/lessons/${id}/activities`, {
      method: 'PUT',
      body: JSON.stringify({ activities })
    }),

  // Admin CMS - Quiz & Assessment Builder
  getAdminQuizzes: () => fetchApi<{ quizzes: any[] }>('/admin/quizzes'),

  getAdminQuiz: (id: string) =>
    fetchApi<{ quiz: any; questions: any[] }>(`/admin/quizzes/${id}`),

  createQuiz: (payload: any) =>
    fetchApi<{ message: string; quizId: string }>('/admin/quizzes', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateQuiz: (id: string, payload: any) =>
    fetchApi<{ message: string }>(`/admin/quizzes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteQuiz: (id: string) =>
    fetchApi<{ message: string }>(`/admin/quizzes/${id}`, {
      method: 'DELETE'
    }),

  addQuizQuestion: (quizId: string, payload: any) =>
    fetchApi<{ message: string; id: string }>(`/admin/quizzes/${quizId}/questions`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateQuizQuestion: (questionId: string, payload: any) =>
    fetchApi<{ message: string }>(`/admin/questions/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteQuizQuestion: (questionId: string) =>
    fetchApi<{ message: string }>(`/admin/questions/${questionId}`, {
      method: 'DELETE'
    }),

  getQuizAttempts: (quizId: string) =>
    fetchApi<{ attempts: any[] }>(`/admin/quizzes/${quizId}/attempts`),

  // Admin CMS - Student & Enrollment Management
  getAdminStudents: () => fetchApi<{ students: any[] }>('/admin/students'),

  getAdminStudentDetails: (id: string) =>
    fetchApi<{
      student: any;
      enrollments: any[];
      certificates: any[];
      quizAttempts: any[];
      attendance: any[];
    }>(`/admin/students/${id}`),

  enrollStudentManually: (studentId: string, courseId: string) =>
    fetchApi<{ message: string }>(`/admin/students/${studentId}/enroll`, {
      method: 'POST',
      body: JSON.stringify({ courseId })
    }),

  removeStudentEnrollment: (studentId: string, courseId: string) =>
    fetchApi<{ message: string }>(`/admin/students/${studentId}/enroll/${courseId}`, {
      method: 'DELETE'
    }),

  updateStudentStatus: (studentId: string, payload: { role?: string; streak_days?: number }) =>
    fetchApi<{ message: string }>(`/admin/students/${studentId}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  // Module 2: Live Online Classroom
  getLiveClasses: () => fetchApi<{ classes: LiveClass[] }>('/live-classes'),

  getLiveClass: (id: string) =>
    fetchApi<{ liveClass: LiveClass; registrations: any[]; attendance: any[] }>(`/live-classes/${id}`),

  scheduleLiveClass: (payload: {
    title: string;
    description?: string;
    course_id?: string;
    lesson_id?: string;
    scheduled_at: string;
    duration_minutes?: number;
    max_capacity?: number;
    room_name?: string;
  }) =>
    fetchApi<{ message: string; classId: string }>('/live-classes', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateLiveClass: (id: string, payload: any) =>
    fetchApi<{ message: string }>(`/live-classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  updateLiveClassStatus: (id: string, status: 'scheduled' | 'live' | 'completed' | 'cancelled') =>
    fetchApi<{ message: string }>(`/live-classes/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  deleteLiveClass: (id: string) =>
    fetchApi<{ message: string }>(`/live-classes/${id}`, {
      method: 'DELETE'
    }),

  registerForLiveClass: (id: string) =>
    fetchApi<{ message: string }>(`/live-classes/${id}/register`, {
      method: 'POST'
    }),

  unregisterFromLiveClass: (id: string) =>
    fetchApi<{ message: string }>(`/live-classes/${id}/register`, {
      method: 'DELETE'
    }),

  getLiveClassToken: (id: string) =>
    fetchApi<{
      token: string;
      roomName: string;
      classTitle: string;
      isInstructor: boolean;
      connectionMode: 'livekit' | 'webrtc_mesh';
      livekitUrl?: string | null;
    }>(`/live-classes/${id}/token`),

  recordLiveAttendance: (id: string, durationSeconds: number) =>
    fetchApi<{ message: string }>(`/live-classes/${id}/attendance`, {
      method: 'POST',
      body: JSON.stringify({ durationSeconds })
    }),

  getLiveClassMessages: (id: string) =>
    fetchApi<{ messages: LiveClassMessage[] }>(`/live-classes/${id}/messages`),

  // AI Language Tutor
  askAiTutor: (payload: { prompt: string; contextLanguage?: string; mode?: string }) =>
    fetchApi<{ response: string; provider: string }>('/ai/assist', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
};
