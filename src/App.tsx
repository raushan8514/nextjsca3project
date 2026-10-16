import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingView } from './views/LandingView';
import { CoursesView } from './views/CoursesView';
import { CourseDetailView } from './views/CourseDetailView';
import { LessonView } from './views/LessonView';
import { DashboardView } from './views/DashboardView';
import { SubscriptionsView } from './views/SubscriptionsView';
import { VerifyView } from './views/VerifyView';
import { AdminView } from './views/AdminView';
import { LiveClassesView } from './views/LiveClassesView';
import { LiveClassroomView } from './views/LiveClassroomView';
import { AuthModal } from './views/AuthModal';
import { QuizPlayer } from './components/quiz/QuizPlayer';
import { CertificateModal } from './components/certificate/CertificateModal';
import { AiTutorDrawer } from './components/ai/AiTutorDrawer';
import { Course, Certificate } from './types';
import { api } from './lib/api';

function MainApp() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<string>('landing');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('crs_eng_a1');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('les_eng_a1_1');
  const [selectedQuizId, setSelectedQuizId] = useState<string>('quiz_crs_eng_a1_final');
  const [activeLiveClassId, setActiveLiveClassId] = useState<string>('cls_fr_conv_1');
  const [verifyCertId, setVerifyCertId] = useState<string>('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [viewingCert, setViewingCert] = useState<Certificate | null>(null);
  const [isAiTutorOpen, setIsAiTutorOpen] = useState(false);

  // Load starter courses
  const loadCourses = async () => {
    try {
      const res = await api.getCourses();
      setCourses(res.courses);
    } catch (err) {
      console.error('Failed to load courses on launch:', err);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [user]);

  // Handle URL hash routing if present
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash.startsWith('verify=')) {
      const id = hash.replace('verify=', '');
      setVerifyCertId(id);
      setCurrentView('verify');
    }
  }, []);

  const handleNavigate = (view: string, param?: string) => {
    if (view === 'verify' && param) {
      setVerifyCertId(param);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setCurrentView('course-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setCurrentView('lesson');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenQuiz = (quizId: string) => {
    setSelectedQuizId(quizId);
    setCurrentView('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClaimCertificate = async (courseId: string) => {
    try {
      const res = await api.claimCertificate(courseId);
      setViewingCert(res.certificate);
      await loadCourses();
    } catch (err: any) {
      alert(err.message || 'Eligibility check failed on server.');
    }
  };

  // If in live classroom, render full-viewport Zoom-like immersive stage
  if (currentView === 'live-classroom' && activeLiveClassId) {
    return (
      <LiveClassroomView
        classId={activeLiveClassId}
        onLeave={() => {
          setCurrentView('live-classes');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-purple-100 selection:text-purple-900">
      {/* Top Bar Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAiTutor={() => setIsAiTutorOpen(true)}
      />

      {/* Main Viewport */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingView
            courses={courses}
            onNavigate={handleNavigate}
            onSelectCourse={handleSelectCourse}
          />
        )}

        {currentView === 'courses' && (
          <CoursesView
            onSelectCourse={handleSelectCourse}
            onOpenSubscriptions={() => handleNavigate('subscriptions')}
          />
        )}

        {currentView === 'live-classes' && (
          <LiveClassesView
            onJoinClass={(classId) => {
              setActiveLiveClassId(classId);
              setCurrentView('live-classroom');
            }}
            onOpenSubscriptions={() => handleNavigate('subscriptions')}
          />
        )}

        {currentView === 'course-detail' && (
          <CourseDetailView
            courseId={selectedCourseId}
            onBack={() => handleNavigate('courses')}
            onSelectLesson={handleSelectLesson}
            onOpenQuiz={handleOpenQuiz}
            onClaimCertificate={handleClaimCertificate}
            onOpenSubscriptions={() => handleNavigate('subscriptions')}
          />
        )}

        {currentView === 'lesson' && (
          <LessonView
            lessonId={selectedLessonId}
            onBack={() => handleNavigate('course-detail')}
            onLessonCompleted={loadCourses}
            onSelectCourse={handleSelectCourse}
          />
        )}

        {currentView === 'quiz' && (
          <div className="max-w-3xl mx-auto px-6 py-12">
            <QuizPlayer
              quizId={selectedQuizId}
              courseId={selectedCourseId}
              onClose={() => handleNavigate('course-detail')}
              onClaimCertificate={handleClaimCertificate}
            />
          </div>
        )}

        {currentView === 'dashboard' && (
          <DashboardView
            onSelectCourse={handleSelectCourse}
            onOpenCertModal={(cert) => setViewingCert(cert)}
            onNavigateToCourses={() => handleNavigate('courses')}
            onOpenSubscriptions={() => handleNavigate('subscriptions')}
            onNavigateToLiveClasses={() => handleNavigate('live-classes')}
          />
        )}

        {currentView === 'subscriptions' && <SubscriptionsView />}

        {currentView === 'verify' && <VerifyView initialCertId={verifyCertId} />}

        {currentView === 'admin' && <AdminView />}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Auth Modal */}
      <AuthModal />

      {/* Certificate Display & Printable Modal */}
      {viewingCert && (
        <CertificateModal
          certificate={viewingCert}
          onClose={() => setViewingCert(null)}
          onNavigateToVerify={(id) => {
            setViewingCert(null);
            handleNavigate('verify', id);
          }}
        />
      )}

      {/* Gemini AI Companion Drawer */}
      <AiTutorDrawer
        isOpen={isAiTutorOpen}
        onClose={() => setIsAiTutorOpen(false)}
        activeLanguage={
          courses.find((c) => c.id === selectedCourseId)?.language || 'English'
        }
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
