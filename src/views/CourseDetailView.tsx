import React, { useState, useEffect } from 'react';
import { Course, Lesson } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Lock,
  Award,
  ArrowRight,
  Play,
  ArrowLeft,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface CourseDetailViewProps {
  courseId: string;
  onBack: () => void;
  onSelectLesson: (lessonId: string) => void;
  onOpenQuiz: (quizId: string) => void;
  onClaimCertificate: (courseId: string) => void;
  onOpenSubscriptions: () => void;
}

export const CourseDetailView: React.FC<CourseDetailViewProps> = ({
  courseId,
  onBack,
  onSelectLesson,
  onOpenQuiz,
  onClaimCertificate,
  onOpenSubscriptions
}) => {
  const { user, openAuthModal } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [certificate, setCertificate] = useState<any>(null);
  const [eligibility, setEligibility] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDetails = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getCourseDetails(courseId);
      setCourse(data.course);
      setLessons(data.lessons);
      setCertificate((data.course as any).certificate);

      if (user) {
        const elig = await api.checkCertificateEligibility(courseId).catch(() => null);
        setEligibility(elig);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load course details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [courseId, user]);

  const handleEnroll = async () => {
    if (!user) {
      openAuthModal('register');
      return;
    }

    setIsEnrolling(true);
    setErrorMsg(null);
    try {
      await api.enrollCourse(courseId);
      await fetchDetails();
    } catch (err: any) {
      if (err.message && err.message.includes('premium')) {
        setErrorMsg('This is a premium course. Please upgrade to Pro Scholar to enroll.');
      } else {
        setErrorMsg(err.message || 'Enrollment failed.');
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">Loading syllabus & curriculum details...</p>
      </div>
    );
  }

  if (errorMsg && !course) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-900 mb-1">Error Loading Course</h2>
        <p className="text-xs text-slate-500 mb-6">{errorMsg}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg"
        >
          Back to Courses
        </button>
      </div>
    );
  }

  if (!course) return null;

  const totalLessons = lessons.length;
  const completedCount = lessons.filter((l) => l.status === 'completed').length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const finalQuizId = `quiz_${course.id}_final`;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-purple-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Course Catalog</span>
      </button>

      {/* Hero Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-12">
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <span className="font-bold text-purple-700 uppercase tracking-wider">{course.language}</span>
              <span>·</span>
              <span>Level {course.cefr_level}</span>
              <span>·</span>
              <span>{totalLessons} Structured Lessons</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
              {course.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
              {course.description}
            </p>

            {/* Learning Outcomes */}
            <div className="space-y-1.5 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                What you will achieve:
              </h4>
              {course.learning_outcomes.map((outcome, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{outcome}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4">
            {course.is_enrolled ? (
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <button
                  onClick={() => {
                    const nextLesson = lessons.find((l) => l.status !== 'completed') || lessons[0];
                    if (nextLesson) onSelectLesson(nextLesson.id);
                  }}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-colors shadow-sm flex items-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{progressPercent === 100 ? 'Review Lessons' : 'Resume Learning'}</span>
                </button>
                <div className="text-xs text-slate-500">
                  <span className="font-bold text-purple-700 tabular-nums">{progressPercent}%</span> complete
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <button
                  onClick={handleEnroll}
                  disabled={isEnrolling}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <span>{isEnrolling ? 'Enrolling...' : 'Enroll in this Course'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                {course.is_premium && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Requires Pro Scholar subscription</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-5 bg-slate-100 relative min-h-60 md:min-h-full">
          <img
            src={course.image_url}
            alt={course.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-4 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={onOpenSubscriptions}
            className="px-3 py-1.5 font-bold bg-purple-700 text-white rounded-lg shrink-0"
          >
            Upgrade Plan
          </button>
        </div>
      )}

      {/* Curriculum Syllabus */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Curriculum Syllabus</h3>
          <span className="text-xs text-slate-500">{totalLessons} Structured Units</span>
        </div>

        <div className="space-y-3">
          {lessons.map((lesson, idx) => {
            const isCompleted = lesson.status === 'completed';
            return (
              <div
                key={lesson.id}
                onClick={() => onSelectLesson(lesson.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isCompleted
                    ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300'
                    : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {lesson.title}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-1">
                      {lesson.summary}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{lesson.duration_minutes} mins</span>
                      </span>
                      <span>·</span>
                      <span>6 Connected Modalities</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      isCompleted
                        ? 'text-emerald-700 bg-emerald-50'
                        : 'text-purple-700 bg-purple-50 group-hover:bg-purple-100'
                    }`}
                  >
                    {isCompleted ? 'Review Lesson' : 'Start Lesson →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Official Final Assessment & Certification Eligibility Card */}
      <div className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-purple-400 font-semibold uppercase tracking-wider">
              <Award className="w-4 h-4" />
              <span>Academic Certification Milestone</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              Official CEFR Final Assessment & Certificate
            </h3>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              To earn your verifiable credential, complete all {totalLessons} curriculum lessons and score at least 70% on the server-graded final examination.
            </p>

            {eligibility && (
              <div className="text-[11px] text-slate-400 flex flex-wrap gap-4 pt-1">
                <span>
                  Lessons: <strong className="text-white">{eligibility.requirements?.completedLessons}/{eligibility.requirements?.totalLessons}</strong>
                </span>
                <span>
                  Exam Passed: <strong className="text-white">{eligibility.requirements?.finalQuizPassed ? 'Yes' : 'Pending'}</strong>
                </span>
                {eligibility.requirements?.finalScore > 0 && (
                  <span>
                    Score: <strong className="text-emerald-400">{eligibility.requirements?.finalScore}%</strong>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onOpenQuiz(finalQuizId)}
              className="px-4 py-2 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors"
            >
              Take Final Exam
            </button>

            {eligibility?.eligible && !eligibility?.alreadyClaimed && (
              <button
                onClick={() => onClaimCertificate(course.id)}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Award className="w-4 h-4" />
                <span>Claim Official Certificate</span>
              </button>
            )}

            {certificate && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Certificate Claimed</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
