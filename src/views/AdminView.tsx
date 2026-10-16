import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Course, Lesson, Quiz, LiveClass } from '../types';
import {
  Shield,
  Users,
  BookOpen,
  Award,
  CreditCard,
  AlertTriangle,
  RotateCcw,
  Plus,
  CheckCircle2,
  FileText,
  Video,
  HelpCircle,
  Edit2,
  Trash2,
  Search,
  ArrowUp,
  ArrowDown,
  Eye,
  Archive,
  Layers,
  Clock,
  Sparkles,
  Crown
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'courses' | 'curriculum' | 'quizzes' | 'students' | 'live_classes' | 'certificates'
  >('overview');

  // Shared Data
  const [overview, setOverview] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [certList, setCertList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search queries
  const [courseSearch, setCourseSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  // Course Management Modals
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    slug: '',
    description: '',
    language: 'Spanish',
    cefr_level: 'B1',
    image_url: '/src/assets/images/hero_language_learner_1792167190387.jpg',
    is_premium: false,
    duration_hours: 15,
    price_inr: 0,
    status: 'published' as 'published' | 'draft' | 'archived',
    learning_outcomes: 'Conversational fluency, grammar mastery, situational vocabulary',
    prerequisites: 'Beginner A1 completion or basic familiarity'
  });

  // Curriculum & Lesson Builder State
  const [selectedCourseForLessons, setSelectedCourseForLessons] = useState<string>('');
  const [courseLessons, setCourseLessons] = useState<any[]>([]);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    summary: '',
    duration_minutes: 15,
    is_free_preview: false,
    status: 'published',
    objectives: 'Vocabulary retention, oral dialogue mastery'
  });

  // Modality Activities Editor Modal
  const [editingLessonActivities, setEditingLessonActivities] = useState<any | null>(null);
  const [activeModalityTab, setActiveModalityTab] = useState<
    'reading' | 'listening' | 'video' | 'speaking' | 'writing' | 'grammar_vocab'
  >('reading');
  const [modalitiesContent, setModalitiesContent] = useState<any>({
    reading: { passage: '', translation: '', vocabulary: [{ word: '', meaning: '' }] },
    listening: { audioScript: '', checkQuestion: '', correctOption: '', checkOptions: ['', ''] },
    video: { videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', summary: '', timestamps: [{ time: '0:05', note: '' }] },
    speaking: { prompt: '', targetPhrase: '', pronunciationTips: '' },
    writing: { fillPrompt: '', correctBlank: '', sentenceParts: ['', '', ''] },
    grammar_vocab: { rule: '', examples: [{ en: '' }], flashcards: [{ term: '', def: '' }] }
  });

  // Quiz & Assessment Builder State
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<any | null>(null);
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    course_id: '',
    passing_score: 70,
    is_final_assessment: false,
    time_limit_minutes: 20
  });

  // Quiz Questions Manager Modal
  const [managingQuizId, setManagingQuizId] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [questionForm, setQuestionForm] = useState({
    prompt: '',
    type: 'single_choice' as 'single_choice' | 'multi_choice' | 'fill_blank',
    optionsText: 'Option A\nOption B\nOption C\nOption D',
    correctAnswer: 'Option A',
    explanation: 'Pedagogical grammar or vocabulary rationale.',
    marks: 1
  });

  // Quiz Attempts Modal
  const [viewingQuizAttempts, setViewingQuizAttempts] = useState<any[] | null>(null);

  // Student Detail Inspection Modal
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any | null>(null);
  const [manualEnrollCourseId, setManualEnrollCourseId] = useState<string>('');

  // Certificate Revocation Modal State
  const [revokingCertId, setRevokingCertId] = useState<string | null>(null);
  const [revocationReason, setRevocationReason] = useState<string>('');
  const [isSubmittingRevoke, setIsSubmittingRevoke] = useState(false);

  // Load Administrative Data
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [ovData, cData, qData, sData, lData, certData] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminCourses(),
        api.getAdminQuizzes(),
        api.getAdminStudents(),
        api.getLiveClasses(),
        api.getAdminCertificates()
      ]);

      setOverview(ovData);
      setCourses(cData.courses);
      setQuizzes(qData.quizzes);
      setStudents(sData.students);
      setLiveClasses(lData.classes);
      setCertList(certData.certificates);

      if (cData.courses.length > 0 && !selectedCourseForLessons) {
        setSelectedCourseForLessons(cData.courses[0].id);
      }
    } catch (err) {
      console.error('Failed to load administrative console data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAllData();
    }
  }, [isAdmin]);

  // Load lessons when selected course changes
  useEffect(() => {
    if (selectedCourseForLessons) {
      loadCourseLessons(selectedCourseForLessons);
    }
  }, [selectedCourseForLessons]);

  const loadCourseLessons = async (courseId: string) => {
    try {
      const res = await api.getAdminLessons(courseId);
      setCourseLessons(res.lessons);
    } catch (err) {
      console.error('Failed to load course lessons:', err);
    }
  };

  // -------------------------------------------------------------
  // COURSE MANAGEMENT HANDLERS
  // -------------------------------------------------------------
  const handleOpenCourseModal = (course?: any) => {
    if (course) {
      setEditingCourse(course);
      setCourseForm({
        title: course.title,
        slug: course.slug,
        description: course.description,
        language: course.language,
        cefr_level: course.cefr_level,
        image_url: course.image_url,
        is_premium: Boolean(course.is_premium),
        duration_hours: course.duration_hours || 15,
        price_inr: course.price_inr || 0,
        status: course.status || 'published',
        learning_outcomes: Array.isArray(course.learning_outcomes)
          ? course.learning_outcomes.join(', ')
          : 'Conversational fluency, grammar mastery',
        prerequisites: Array.isArray(course.prerequisites)
          ? course.prerequisites.join(', ')
          : 'Basic familiarity'
      });
    } else {
      setEditingCourse(null);
      setCourseForm({
        title: '',
        slug: '',
        description: '',
        language: 'Spanish',
        cefr_level: 'B1',
        image_url: '/src/assets/images/hero_language_learner_1792167190387.jpg',
        is_premium: false,
        duration_hours: 15,
        price_inr: 0,
        status: 'published',
        learning_outcomes: 'Conversational fluency, grammar mastery, situational vocabulary',
        prerequisites: 'Beginner A1 completion'
      });
    }
    setIsCourseModalOpen(true);
  };

  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...courseForm,
        learning_outcomes: courseForm.learning_outcomes.split(',').map((s) => s.trim()).filter(Boolean),
        prerequisites: courseForm.prerequisites.split(',').map((s) => s.trim()).filter(Boolean),
        duration_hours: Number(courseForm.duration_hours),
        price_inr: Number(courseForm.price_inr)
      };

      if (editingCourse) {
        await api.updateCourse(editingCourse.id, payload);
      } else {
        await api.createCourse(payload);
      }
      setIsCourseModalOpen(false);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Course save failed.');
    }
  };

  const handleToggleCourseStatus = async (courseId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'published' ? 'draft' : 'published';
    try {
      await api.updateCourseStatus(courseId, nextStatus as any);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Status update failed.');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? If students are enrolled, it will be safely archived to protect learning records.')) return;
    try {
      const res = await api.deleteCourse(courseId);
      alert(res.message);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Course deletion failed.');
    }
  };

  // -------------------------------------------------------------
  // LESSON & CURRICULUM BUILDER HANDLERS
  // -------------------------------------------------------------
  const handleOpenLessonModal = (lesson?: any) => {
    if (lesson) {
      setEditingLesson(lesson);
      setLessonForm({
        title: lesson.title,
        summary: lesson.summary,
        duration_minutes: lesson.duration_minutes || 15,
        is_free_preview: Boolean(lesson.is_free_preview),
        status: lesson.status || 'published',
        objectives: Array.isArray(lesson.objectives)
          ? lesson.objectives.join(', ')
          : 'Vocabulary retention, oral dialogue mastery'
      });
    } else {
      setEditingLesson(null);
      setLessonForm({
        title: '',
        summary: '',
        duration_minutes: 15,
        is_free_preview: false,
        status: 'published',
        objectives: 'Contextual communication, structural fluency'
      });
    }
    setIsLessonModalOpen(true);
  };

  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForLessons) return;
    try {
      const payload = {
        ...lessonForm,
        duration_minutes: Number(lessonForm.duration_minutes),
        objectives: lessonForm.objectives.split(',').map((s) => s.trim()).filter(Boolean)
      };

      if (editingLesson) {
        await api.updateLesson(editingLesson.id, payload);
      } else {
        await api.createLesson(selectedCourseForLessons, payload);
      }
      setIsLessonModalOpen(false);
      await loadCourseLessons(selectedCourseForLessons);
    } catch (err: any) {
      alert(err.message || 'Failed to save lesson.');
    }
  };

  const handleReorderLesson = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= courseLessons.length) return;

    const newLessons = [...courseLessons];
    const temp = newLessons[index];
    newLessons[index] = newLessons[targetIndex];
    newLessons[targetIndex] = temp;

    setCourseLessons(newLessons);
    const orderedIds = newLessons.map((l) => l.id);

    try {
      await api.reorderLessons(selectedCourseForLessons, orderedIds);
    } catch (err) {
      console.error('Failed to reorder lessons:', err);
      await loadCourseLessons(selectedCourseForLessons);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson? All associated exercises will be removed.')) return;
    try {
      await api.deleteLesson(lessonId);
      await loadCourseLessons(selectedCourseForLessons);
    } catch (err: any) {
      alert(err.message || 'Failed to delete lesson.');
    }
  };

  // Open 6-Modality Activities Editor
  const handleOpenActivitiesEditor = async (lesson: any) => {
    try {
      const res = await api.getAdminLesson(lesson.id);
      setEditingLessonActivities(res.lesson);

      const parsedModalities: any = {
        reading: { passage: '', translation: '', vocabulary: [{ word: '', meaning: '' }] },
        listening: { audioScript: '', checkQuestion: '', correctOption: '', checkOptions: ['', ''] },
        video: { videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', summary: '', timestamps: [{ time: '0:05', note: '' }] },
        speaking: { prompt: '', targetPhrase: '', pronunciationTips: '' },
        writing: { fillPrompt: '', correctBlank: '', sentenceParts: ['', '', ''] },
        grammar_vocab: { rule: '', examples: [{ en: '' }], flashcards: [{ term: '', def: '' }] }
      };

      if (res.activities && Array.isArray(res.activities)) {
        res.activities.forEach((act: any) => {
          if (parsedModalities[act.modality]) {
            parsedModalities[act.modality] = act.content || parsedModalities[act.modality];
          }
        });
      }

      setModalitiesContent(parsedModalities);
      setActiveModalityTab('reading');
    } catch (err) {
      alert('Failed to load lesson activities.');
    }
  };

  const handleSaveActivities = async () => {
    if (!editingLessonActivities) return;
    try {
      const activitiesPayload = Object.keys(modalitiesContent).map((modalityKey, idx) => ({
        modality: modalityKey,
        title: `${modalityKey.toUpperCase()} - Practice`,
        content: modalitiesContent[modalityKey],
        order_index: idx + 1
      }));

      await api.updateLessonActivities(editingLessonActivities.id, activitiesPayload);
      alert('All 6 modalities updated successfully!');
      setEditingLessonActivities(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update activities.');
    }
  };

  // -------------------------------------------------------------
  // QUIZ & QUESTION BUILDER HANDLERS
  // -------------------------------------------------------------
  const handleOpenQuizModal = (quiz?: any) => {
    if (quiz) {
      setEditingQuiz(quiz);
      setQuizForm({
        title: quiz.title,
        description: quiz.description,
        course_id: quiz.course_id,
        passing_score: quiz.passing_score || 70,
        is_final_assessment: Boolean(quiz.is_final_assessment),
        time_limit_minutes: quiz.time_limit_minutes || 20
      });
    } else {
      setEditingQuiz(null);
      setQuizForm({
        title: '',
        description: 'Comprehensive CEFR skill assessment',
        course_id: courses[0]?.id || '',
        passing_score: 70,
        is_final_assessment: false,
        time_limit_minutes: 20
      });
    }
    setIsQuizModalOpen(true);
  };

  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...quizForm,
        passing_score: Number(quizForm.passing_score),
        time_limit_minutes: Number(quizForm.time_limit_minutes)
      };

      if (editingQuiz) {
        await api.updateQuiz(editingQuiz.id, payload);
      } else {
        await api.createQuiz(payload);
      }
      setIsQuizModalOpen(false);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Quiz save failed.');
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    try {
      await api.deleteQuiz(quizId);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Quiz deletion failed.');
    }
  };

  const handleManageQuizQuestions = async (quizId: string) => {
    try {
      const res = await api.getAdminQuiz(quizId);
      setManagingQuizId(quizId);
      setQuizQuestions(res.questions);
    } catch (err) {
      alert('Failed to load quiz questions.');
    }
  };

  const handleOpenQuestionModal = (q?: any) => {
    if (q) {
      setEditingQuestion(q);
      setQuestionForm({
        prompt: q.prompt,
        type: q.type || 'single_choice',
        optionsText: Array.isArray(q.options) ? q.options.join('\n') : '',
        correctAnswer: typeof q.correct_answer === 'string' ? q.correct_answer : JSON.stringify(q.correct_answer),
        explanation: q.explanation || '',
        marks: q.marks || 1
      });
    } else {
      setEditingQuestion(null);
      setQuestionForm({
        prompt: '',
        type: 'single_choice',
        optionsText: 'Option A\nOption B\nOption C\nOption D',
        correctAnswer: 'Option A',
        explanation: 'Objective grammatical rationale.',
        marks: 1
      });
    }
    setIsQuestionModalOpen(true);
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingQuizId) return;
    try {
      const optionsArray = questionForm.optionsText.split('\n').map((s) => s.trim()).filter(Boolean);
      const payload = {
        prompt: questionForm.prompt.trim(),
        type: questionForm.type,
        options: optionsArray,
        correct_answer: questionForm.correctAnswer.trim(),
        explanation: questionForm.explanation.trim(),
        marks: Number(questionForm.marks)
      };

      if (editingQuestion) {
        await api.updateQuizQuestion(editingQuestion.id, payload);
      } else {
        await api.addQuizQuestion(managingQuizId, payload);
      }
      setIsQuestionModalOpen(false);
      await handleManageQuizQuestions(managingQuizId);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to save question.');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.deleteQuizQuestion(questionId);
      if (managingQuizId) {
        await handleManageQuizQuestions(managingQuizId);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete question.');
    }
  };

  const handleViewQuizAttempts = async (quizId: string) => {
    try {
      const res = await api.getQuizAttempts(quizId);
      setViewingQuizAttempts(res.attempts);
    } catch (err) {
      alert('Failed to load quiz attempts.');
    }
  };

  // -------------------------------------------------------------
  // STUDENT & ENROLLMENT MANAGEMENT HANDLERS
  // -------------------------------------------------------------
  const handleInspectStudent = async (studentId: string) => {
    try {
      const data = await api.getAdminStudentDetails(studentId);
      setSelectedStudentDetail(data);
    } catch (err) {
      alert('Failed to load student details.');
    }
  };

  const handleManualEnroll = async () => {
    if (!selectedStudentDetail || !manualEnrollCourseId) return;
    try {
      await api.enrollStudentManually(selectedStudentDetail.student.id, manualEnrollCourseId);
      alert('Student enrolled successfully!');
      await handleInspectStudent(selectedStudentDetail.student.id);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Enrollment failed.');
    }
  };

  const handleRemoveEnrollment = async (courseId: string) => {
    if (!selectedStudentDetail) return;
    if (!confirm('Remove student enrollment from this course? Progress will be reset.')) return;
    try {
      await api.removeStudentEnrollment(selectedStudentDetail.student.id, courseId);
      await handleInspectStudent(selectedStudentDetail.student.id);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to remove enrollment.');
    }
  };

  const handleUpdateStudentRole = async (newRole: string) => {
    if (!selectedStudentDetail) return;
    try {
      await api.updateStudentStatus(selectedStudentDetail.student.id, { role: newRole });
      alert(`User role updated to ${newRole}`);
      await handleInspectStudent(selectedStudentDetail.student.id);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to update role.');
    }
  };

  // -------------------------------------------------------------
  // CERTIFICATE REVOCATION HANDLER
  // -------------------------------------------------------------
  const handleRevokeSubmit = async () => {
    if (!revokingCertId || !revocationReason.trim()) return;
    setIsSubmittingRevoke(true);
    try {
      await api.revokeCertificate({
        certId: revokingCertId,
        reason: revocationReason.trim()
      });
      setRevokingCertId(null);
      setRevocationReason('');
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Revocation failed.');
    } finally {
      setIsSubmittingRevoke(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <Shield className="w-12 h-12 text-rose-600 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 mb-1">Access Restricted</h2>
        <p className="text-xs text-slate-500 mb-4">
          This portal requires Administrator authorization. Please sign in with an administrator account (e.g. admin@lingopro.edu).
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* 1. TOP HEADER & NAVIGATION */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-700 block mb-1">
            Learning Management System & Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-7 h-7 text-purple-700" />
            <span>Administrator Console</span>
          </h1>
        </div>

        {/* Console Nav Tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'overview' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'courses' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Courses ({courses.length})
          </button>
          <button
            onClick={() => setActiveTab('curriculum')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'curriculum' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Curriculum Builder
          </button>
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'quizzes' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Quizzes ({quizzes.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'students' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Students ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('live_classes')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'live_classes' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Live Classes ({liveClasses.length})
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'certificates' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Credentials ({certList.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Querying authoritative database records...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW & AUDIT TRAIL */}
          {activeTab === 'overview' && overview && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Registered Students
                  </span>
                  <p className="text-2xl font-black text-slate-900 tabular-nums">
                    {overview.metrics.totalUsers}
                  </p>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Active Subscriptions
                  </span>
                  <p className="text-2xl font-black text-purple-700 tabular-nums">
                    {overview.metrics.activeSubs}
                  </p>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Verified Revenue
                  </span>
                  <p className="text-2xl font-black text-emerald-700 tabular-nums">
                    ₹{overview.metrics.revenueInr}
                  </p>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Course Enrollments
                  </span>
                  <p className="text-2xl font-black text-slate-900 tabular-nums">
                    {overview.metrics.totalEnrollments}
                  </p>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Credentials Issued
                  </span>
                  <p className="text-2xl font-black text-amber-600 tabular-nums">
                    {overview.metrics.totalCertificates}
                  </p>
                </div>
              </div>

              {/* Audit Log Stream */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-700" />
                  <span>Real-Time Authoritative Audit Trail</span>
                </h3>

                <div className="divide-y divide-slate-100 text-xs">
                  {overview.recentAudit.map((log: any) => (
                    <div key={log.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-purple-800 font-mono mr-2">{log.action}</span>
                        <span className="text-slate-500">
                          {log.resource_type} · {log.resource_id}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COURSE MANAGEMENT */}
          {activeTab === 'courses' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                </div>

                <button
                  onClick={() => handleOpenCourseModal()}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Course</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4">Course</th>
                      <th className="py-3.5 px-4">Language</th>
                      <th className="py-3.5 px-4">CEFR</th>
                      <th className="py-3.5 px-4">Lessons</th>
                      <th className="py-3.5 px-4">Enrollments</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {courses
                      .filter((c) => c.title.toLowerCase().includes(courseSearch.toLowerCase()))
                      .map((course) => (
                        <tr key={course.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{course.title}</span>
                            <span className="text-[11px] text-slate-400 font-mono">/{course.slug}</span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700">{course.language}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              {course.cefr_level}
                            </span>
                          </td>
                          <td className="py-3 px-4 tabular-nums font-semibold text-slate-700">
                            {course.lessons_count || 0}
                          </td>
                          <td className="py-3 px-4 tabular-nums font-semibold text-slate-700">
                            {course.enrollments_count || 0}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                course.status === 'published'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : course.status === 'archived'
                                  ? 'bg-slate-100 text-slate-600'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {course.status || 'published'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleToggleCourseStatus(course.id, course.status || 'published')}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium"
                              >
                                {course.status === 'published' ? 'Draft' : 'Publish'}
                              </button>
                              <button
                                onClick={() => handleOpenCourseModal(course)}
                                className="p-1.5 text-purple-700 hover:bg-purple-50 rounded"
                                title="Edit Course"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCourse(course.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                                title="Delete Course"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CURRICULUM & LESSON BUILDER */}
          {activeTab === 'curriculum' && (
            <div className="space-y-6">
              {/* Course Selector Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-xs font-bold text-slate-700 shrink-0">Selected Course:</span>
                  <select
                    value={selectedCourseForLessons}
                    onChange={(e) => setSelectedCourseForLessons(e.target.value)}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600 flex-1 sm:w-80"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.language} · {c.cefr_level})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => handleOpenLessonModal()}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Lesson to Course</span>
                </button>
              </div>

              {/* Lessons List with Modalities Editor & Reordering */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Curriculum Sequence & Six-Modality Content ({courseLessons.length} Lessons)
                  </h3>
                  <span className="text-xs text-slate-400">Reorder with Up/Down buttons</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {courseLessons.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      No lessons configured for this course yet. Click "Add Lesson" to begin.
                    </div>
                  ) : (
                    courseLessons.map((lesson, idx) => (
                      <div key={lesson.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Reordering Controls */}
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleReorderLesson(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 hover:bg-slate-200 disabled:opacity-20 rounded text-slate-600"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleReorderLesson(idx, 'down')}
                              disabled={idx === courseLessons.length - 1}
                              className="p-1 hover:bg-slate-200 disabled:opacity-20 rounded text-slate-600"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className="w-6 h-6 rounded-full bg-purple-50 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {lesson.order_index}
                          </span>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-sm truncate">{lesson.title}</h4>
                              {lesson.is_free_preview && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Free Preview
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 truncate">{lesson.summary}</p>
                          </div>
                        </div>

                        {/* Modalities Badges & Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleOpenActivitiesEditor(lesson)}
                            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Edit 6 Modalities</span>
                          </button>

                          <button
                            onClick={() => handleOpenLessonModal(lesson)}
                            className="p-1.5 text-slate-600 hover:text-purple-700 hover:bg-slate-100 rounded"
                            title="Edit Lesson Metadata"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete Lesson"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: QUIZ & ASSESSMENT BUILDER */}
          {activeTab === 'quizzes' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Configured Assessments & Knowledge Checks</h3>
                <button
                  onClick={() => handleOpenQuizModal()}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Assessment</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzes.map((quiz) => (
                  <div key={quiz.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                          {quiz.course_title || 'General'}
                        </span>
                        {quiz.is_final_assessment && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            <span>Certificate Final</span>
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm mb-1">{quiz.title}</h4>
                      <p className="text-xs text-slate-500 mb-4 line-clamp-2">{quiz.description}</p>

                      <div className="flex items-center justify-between text-xs text-slate-600 py-2 border-y border-slate-100 mb-4">
                        <span>Questions: <strong>{quiz.question_count || 0}</strong></span>
                        <span>Passing: <strong>{quiz.passing_score}%</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2">
                      <button
                        onClick={() => handleManageQuizQuestions(quiz.id)}
                        className="flex-1 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition-colors text-center"
                      >
                        Questions ({quiz.question_count || 0})
                      </button>
                      <button
                        onClick={() => handleViewQuizAttempts(quiz.id)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                        title="View Student Attempts"
                      >
                        Attempts
                      </button>
                      <button
                        onClick={() => handleOpenQuizModal(quiz)}
                        className="p-1.5 text-slate-600 hover:text-purple-700 rounded"
                        title="Edit Quiz Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                        title="Delete Quiz"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: STUDENT DIRECTORY & ENROLLMENT MANAGEMENT */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search students by name or email..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4">Student</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Streak & XP</th>
                      <th className="py-3.5 px-4">Courses</th>
                      <th className="py-3.5 px-4">Certificates</th>
                      <th className="py-3.5 px-4">Subscription</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students
                      .filter(
                        (s) =>
                          s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                          s.email.toLowerCase().includes(studentSearch.toLowerCase())
                      )
                      .map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{s.name}</span>
                            <span className="text-[11px] text-slate-500">{s.email}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                s.role === 'ADMIN' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {s.role}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-amber-700 font-bold mr-2">{s.streak_days}d</span>
                            <span className="text-purple-700 font-bold">{s.xp} XP</span>
                          </td>
                          <td className="py-3 px-4 tabular-nums font-semibold">{s.enrolled_count || 0}</td>
                          <td className="py-3 px-4 tabular-nums font-semibold">{s.certificates_count || 0}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 uppercase">
                              {s.subscription_status || 'free'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleInspectStudent(s.id)}
                              className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold transition-colors"
                            >
                              Inspect Details
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: LIVE CLASSES MANAGEMENT */}
          {activeTab === 'live_classes' && (
            <div className="space-y-6">
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-purple-950">Live Online Classroom Governance</h3>
                  <p className="text-xs text-purple-700">
                    Sessions use real-time WebRTC audio/video mesh, interactive whiteboard, live in-class chat, and automatic attendance logging.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4">Session Title</th>
                      <th className="py-3.5 px-4">Instructor</th>
                      <th className="py-3.5 px-4">Scheduled Date</th>
                      <th className="py-3.5 px-4">Duration</th>
                      <th className="py-3.5 px-4">Capacity</th>
                      <th className="py-3.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {liveClasses.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-bold text-slate-900">{item.title}</td>
                        <td className="py-3 px-4 text-slate-600">{item.instructor_name}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {new Date(item.scheduled_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-3 px-4 tabular-nums">{item.duration_minutes} min</td>
                        <td className="py-3 px-4 tabular-nums">
                          <strong>{item.registered_count || 0}</strong> / {item.max_capacity}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.status === 'live'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : item.status === 'completed'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {item.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: CERTIFICATES & REVOCATION */}
          {activeTab === 'certificates' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Issued Academic Credentials Registry
                </h3>
                <span className="text-xs text-slate-400">{certList.length} Logged in Authoritative Database</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4">Credential ID</th>
                      <th className="py-3.5 px-4">Recipient</th>
                      <th className="py-3.5 px-4">Course</th>
                      <th className="py-3.5 px-4">Score</th>
                      <th className="py-3.5 px-4">Date Issued</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Administrative Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {certList.map((cert) => (
                      <tr key={cert.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono font-bold text-purple-900">{cert.id}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{cert.recipient_name}</td>
                        <td className="py-3 px-4 text-slate-700">{cert.course_title}</td>
                        <td className="py-3 px-4 tabular-nums font-bold text-emerald-700">{cert.final_score}%</td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(cert.issue_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          {cert.is_revoked ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-800">
                              Revoked
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">
                              Valid
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {!cert.is_revoked && (
                            <button
                              onClick={() => {
                                setRevokingCertId(cert.id);
                                setRevocationReason('');
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors"
                            >
                              Revoke...
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODALS */}
      {/* ------------------------------------------------------------- */}

      {/* 1. COURSE CREATE/EDIT MODAL */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              {editingCourse ? 'Edit Course Details' : 'Create New Course'}
            </h3>
            <form onSubmit={handleCourseSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Language *</label>
                  <input
                    type="text"
                    required
                    value={courseForm.language}
                    onChange={(e) => setCourseForm({ ...courseForm, language: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">CEFR Level *</label>
                  <select
                    value={courseForm.cefr_level}
                    onChange={(e) => setCourseForm({ ...courseForm, cefr_level: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                  >
                    <option value="A1">A1 Beginner</option>
                    <option value="A2">A2 Elementary</option>
                    <option value="B1">B1 Intermediate</option>
                    <option value="B2">B2 Upper Intermediate</option>
                    <option value="C1">C1 Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description *</label>
                <textarea
                  rows={2}
                  required
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Duration (Hours)</label>
                  <input
                    type="number"
                    value={courseForm.duration_hours}
                    onChange={(e) => setCourseForm({ ...courseForm, duration_hours: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Publication Status</label>
                  <select
                    value={courseForm.status}
                    onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Learning Outcomes (comma-separated)</label>
                <input
                  type="text"
                  value={courseForm.learning_outcomes}
                  onChange={(e) => setCourseForm({ ...courseForm, learning_outcomes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg transition-colors"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. LESSON CREATE/EDIT MODAL */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              {editingLesson ? 'Edit Lesson Details' : 'Add New Lesson'}
            </h3>
            <form onSubmit={handleLessonSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Lesson Title *</label>
                <input
                  type="text"
                  required
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Lesson Summary</label>
                <textarea
                  rows={2}
                  value={lessonForm.summary}
                  onChange={(e) => setLessonForm({ ...lessonForm, summary: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={lessonForm.duration_minutes}
                    onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={lessonForm.is_free_preview}
                      onChange={(e) => setLessonForm({ ...lessonForm, is_free_preview: e.target.checked })}
                      className="rounded accent-purple-600"
                    />
                    <span>Allow Free Preview</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLessonModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg transition-colors"
                >
                  Save Lesson
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. SIX-MODALITY CONTENT BUILDER MODAL */}
      {editingLessonActivities && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-3xl w-full shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                  Six-Modality Curriculum Content Builder
                </span>
                <h3 className="text-base font-bold text-slate-900">{editingLessonActivities.title}</h3>
              </div>
              <button
                onClick={() => setEditingLessonActivities(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modality Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold mb-4 overflow-x-auto shrink-0">
              {(['reading', 'listening', 'video', 'speaking', 'writing', 'grammar_vocab'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setActiveModalityTab(m)}
                  className={`px-3 py-1.5 rounded-lg capitalize whitespace-nowrap transition-colors ${
                    activeModalityTab === m ? 'bg-white text-purple-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {m.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Active Modality Editor Fields */}
            <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
              {activeModalityTab === 'reading' && (
                <div className="space-y-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Reading Passage (Target Language)</label>
                    <textarea
                      rows={5}
                      value={modalitiesContent.reading?.passage || ''}
                      onChange={(e) =>
                        setModalitiesContent({
                          ...modalitiesContent,
                          reading: { ...modalitiesContent.reading, passage: e.target.value }
                        })
                      }
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">English Translation</label>
                    <textarea
                      rows={3}
                      value={modalitiesContent.reading?.translation || ''}
                      onChange={(e) =>
                        setModalitiesContent({
                          ...modalitiesContent,
                          reading: { ...modalitiesContent.reading, translation: e.target.value }
                        })
                      }
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                    />
                  </div>
                </div>
              )}

              {activeModalityTab === 'listening' && (
                <div className="space-y-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Audio Script / Speech Synthesis Text</label>
                    <textarea
                      rows={4}
                      value={modalitiesContent.listening?.audioScript || ''}
                      onChange={(e) =>
                        setModalitiesContent({
                          ...modalitiesContent,
                          listening: { ...modalitiesContent.listening, audioScript: e.target.value }
                        })
                      }
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Comprehension Question</label>
                    <input
                      type="text"
                      value={modalitiesContent.listening?.checkQuestion || ''}
                      onChange={(e) =>
                        setModalitiesContent({
                          ...modalitiesContent,
                          listening: { ...modalitiesContent.listening, checkQuestion: e.target.value }
                        })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Correct Answer</label>
                    <input
                      type="text"
                      value={modalitiesContent.listening?.correctOption || ''}
                      onChange={(e) =>
                        setModalitiesContent({
                          ...modalitiesContent,
                          listening: { ...modalitiesContent.listening, correctOption: e.target.value }
                        })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {activeModalityTab === 'video' && (
                <div className="space-y-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Video Resource URL (MP4 / WebM)</label>
                    <input
                      type="text"
                      value={modalitiesContent.video?.videoUrl || ''}
                      onChange={(e) =>
                        setModalitiesContent({
                          ...modalitiesContent,
                          video: { ...modalitiesContent.video, videoUrl: e.target.value }
                        })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Contextual Summary</label>
                    <textarea
                      rows={3}
                      value={modalitiesContent.video?.summary || ''}
                      onChange={(e) =>
                        setModalitiesContent({
                          ...modalitiesContent,
                          video: { ...modalitiesContent.video, summary: e.target.value }
                        })
                      }
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {activeModalityTab === 'speaking' && (
                <div className="space-y-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Speaking Prompt Instruction</label>
                    <input
                      type="text"
                      value={modalitiesContent.speaking?.prompt || ''}
                      onChange={(e) =>
                        setModalitiesContent({
                          ...modalitiesContent,
                          speaking: { ...modalitiesContent.speaking, prompt: e.target.value }
                        })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Target Phrase to Pronounce</label>
                    <input
                      type="text"
                      value={modalitiesContent.speaking?.targetPhrase || ''}
                      onChange={(e) =>
                        setModalitiesContent({
                          ...modalitiesContent,
                          speaking: { ...modalitiesContent.speaking, targetPhrase: e.target.value }
                        })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Pronunciation Tips</label>
                    <textarea
                      rows={2}
                      value={modalitiesContent.speaking?.pronunciationTips || ''}
                      onChange={(e) =>
                        setModalitiesContent({
                          ...modalitiesContent,
                          speaking: { ...modalitiesContent.speaking, pronunciationTips: e.target.value }
                        })
                      }
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {activeModalityTab === 'writing' && (
                <div className="space-y-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Fill-in-the-Blank Sentence Prompt</label>
                    <input
                      type="text"
                      value={modalitiesContent.writing?.fillPrompt || ''}
                      onChange={(e) =>
                        setModalitiesContent({
                          ...modalitiesContent,
                          writing: { ...modalitiesContent.writing, fillPrompt: e.target.value }
                        })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Correct Missing Word</label>
                    <input
                      type="text"
                      value={modalitiesContent.writing?.correctBlank || ''}
                      onChange={(e) =>
                        setModalitiesContent({
                          ...modalitiesContent,
                          writing: { ...modalitiesContent.writing, correctBlank: e.target.value }
                        })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {activeModalityTab === 'grammar_vocab' && (
                <div className="space-y-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Grammar Rule / Structural Pattern</label>
                    <textarea
                      rows={3}
                      value={modalitiesContent.grammar_vocab?.rule || ''}
                      onChange={(e) =>
                        setModalitiesContent({
                          ...modalitiesContent,
                          grammar_vocab: { ...modalitiesContent.grammar_vocab, rule: e.target.value }
                        })
                      }
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4 shrink-0">
              <button
                onClick={() => setEditingLessonActivities(null)}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveActivities}
                className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg transition-colors shadow-xs"
              >
                Save All Activities
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. QUIZ QUESTIONS MANAGER MODAL */}
      {managingQuizId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                  Assessment Question Bank
                </span>
                <h3 className="text-base font-bold text-slate-900">Quiz ID: {managingQuizId}</h3>
              </div>
              <button
                onClick={() => setManagingQuizId(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between mb-3 shrink-0">
              <span className="text-xs text-slate-500 font-medium">{quizQuestions.length} Questions Configured</span>
              <button
                onClick={() => handleOpenQuestionModal()}
                className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 text-xs">
              {quizQuestions.length === 0 ? (
                <div className="py-10 text-center text-slate-400">No questions added yet.</div>
              ) : (
                quizQuestions.map((q, idx) => (
                  <div key={q.id} className="py-3 flex items-start justify-between gap-3">
                    <div>
                      <span className="font-bold text-slate-900 block mb-1">
                        {idx + 1}. {q.prompt}
                      </span>
                      <div className="text-[11px] text-slate-500 space-y-0.5">
                        <div>
                          Options: <strong>{Array.isArray(q.options) ? q.options.join(' | ') : q.options}</strong>
                        </div>
                        <div className="text-emerald-700">
                          Correct: <strong>{q.correct_answer}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleOpenQuestionModal(q)}
                        className="p-1.5 text-slate-600 hover:text-purple-700 rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. QUESTION CREATE/EDIT MODAL */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
              {editingQuestion ? 'Edit Question' : 'Add Quiz Question'}
            </h3>
            <form onSubmit={handleQuestionSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Prompt / Question *</label>
                <textarea
                  rows={2}
                  required
                  value={questionForm.prompt}
                  onChange={(e) => setQuestionForm({ ...questionForm, prompt: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Answer Options (one per line) *</label>
                <textarea
                  rows={3}
                  required
                  value={questionForm.optionsText}
                  onChange={(e) => setQuestionForm({ ...questionForm, optionsText: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Correct Answer (exact string) *</label>
                <input
                  type="text"
                  required
                  value={questionForm.correctAnswer}
                  onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Explanation (shown after submission)</label>
                <textarea
                  rows={2}
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg transition-colors"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. STUDENT PROFILE INSPECTION MODAL */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                  Authoritative Student Profile
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedStudentDetail.student.name} ({selectedStudentDetail.student.email})
                </h3>
              </div>
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Role & Streak controls */}
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block mb-0.5">Account Role:</span>
                  <span className="font-bold text-slate-900">{selectedStudentDetail.student.role}</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedStudentDetail.student.role === 'USER' ? (
                    <button
                      onClick={() => handleUpdateStudentRole('ADMIN')}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg"
                    >
                      Promote to Admin
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStudentRole('USER')}
                      className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-lg"
                    >
                      Demote to Student
                    </button>
                  )}
                </div>
              </div>

              {/* Manual Course Enrollment */}
              <div className="p-3 bg-purple-50 rounded-xl space-y-2">
                <span className="font-bold text-purple-950 block">Administrative Course Enrollment</span>
                <div className="flex items-center gap-2">
                  <select
                    value={manualEnrollCourseId}
                    onChange={(e) => setManualEnrollCourseId(e.target.value)}
                    className="flex-1 p-2 bg-white border border-purple-200 rounded-lg"
                  >
                    <option value="">Select course to enroll...</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleManualEnroll}
                    disabled={!manualEnrollCourseId}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold rounded-lg"
                  >
                    Enroll
                  </button>
                </div>
              </div>

              {/* Course Enrollments List */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Active Enrollments ({selectedStudentDetail.enrollments.length})</h4>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  {selectedStudentDetail.enrollments.map((enr: any) => (
                    <div key={enr.id} className="p-3 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 block">{enr.course_title}</span>
                        <span className="text-[11px] text-slate-500">Progress: {enr.progress_percent}%</span>
                      </div>
                      <button
                        onClick={() => handleRemoveEnrollment(enr.course_id)}
                        className="text-rose-600 hover:text-rose-800 font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Attendance History */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Live Seminar Attendance History</h4>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  {selectedStudentDetail.attendance.length === 0 ? (
                    <div className="p-3 text-slate-400">No attendance logs found.</div>
                  ) : (
                    selectedStudentDetail.attendance.map((att: any) => (
                      <div key={att.id} className="p-2.5 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-800">{att.class_title}</span>
                          <span className="block text-[10px] text-slate-400">{new Date(att.joined_at).toLocaleString()}</span>
                        </div>
                        <span className="tabular-nums font-bold text-purple-700">
                          {Math.round(att.duration_seconds / 60)} min attended
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. REVOCATION MODAL */}
      {revokingCertId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2 text-rose-700 mb-3">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">Revoke Academic Credential</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              You are about to revoke certificate <strong className="font-mono text-slate-900">{revokingCertId}</strong>.
              This change takes effect immediately and updates public verification records.
            </p>

            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Reason for Revocation (Mandatory audit trail)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Academic integrity review, test invalidation..."
                value={revocationReason}
                onChange={(e) => setRevocationReason(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRevokingCertId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleRevokeSubmit}
                disabled={!revocationReason.trim() || isSubmittingRevoke}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50 transition-colors shadow-sm"
              >
                {isSubmittingRevoke ? 'Revoking...' : 'Confirm Revocation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
