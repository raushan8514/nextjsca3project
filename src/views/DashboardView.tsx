import React, { useState, useEffect } from 'react';
import { DashboardStats, Course, Certificate } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Flame,
  Zap,
  BookOpen,
  Award,
  CreditCard,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Video,
  Radio
} from 'lucide-react';

interface DashboardViewProps {
  onSelectCourse: (courseId: string) => void;
  onOpenCertModal: (cert: Certificate) => void;
  onNavigateToCourses: () => void;
  onOpenSubscriptions: () => void;
  onNavigateToLiveClasses?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectCourse,
  onOpenCertModal,
  onNavigateToCourses,
  onOpenSubscriptions,
  onNavigateToLiveClasses
}) => {
  const { user, subscription } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">Calculating authoritative student metrics from server...</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-700 block mb-1">
            Student Overview
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {stats.user.name.split(' ')[0]}!
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain your daily streak to build long-term conversational fluency.
          </p>
        </div>

        {/* Quick KPI Strip */}
        <div className="flex items-center gap-6 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <p className="font-bold text-slate-900 tabular-nums">{stats.user.streak_days} Days</p>
              <p className="text-[10px] text-slate-400">Daily Streak</p>
            </div>
          </div>

          <div className="w-px h-8 bg-slate-200" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Zap className="w-4 h-4 fill-purple-600 text-purple-600" />
            </div>
            <div>
              <p className="font-bold text-slate-900 tabular-nums">{stats.user.xp} XP</p>
              <p className="text-[10px] text-slate-400">Total Reward</p>
            </div>
          </div>

          <div className="w-px h-8 bg-slate-200" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900 tabular-nums">{stats.completedLessonsCount}</p>
              <p className="text-[10px] text-slate-400">Completed Units</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column (Courses & Activity) / Right Column (6-Skill Radar & Achievements) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Live Online Classroom Banner */}
          {onNavigateToLiveClasses && (
            <div className="p-5 bg-gradient-to-r from-slate-900 to-purple-950 rounded-2xl border border-slate-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Live Virtual Classroom
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">Join Daily Native Speaker Seminars</h3>
                <p className="text-xs text-slate-300">
                  Practice conversational cadence in real-time with peers and certified language coaches.
                </p>
              </div>

              <button
                onClick={onNavigateToLiveClasses}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
              >
                <Video className="w-3.5 h-3.5" />
                <span>View Live Schedule</span>
              </button>
            </div>
          )}

          {/* Active Enrollments */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Enrolled Courses</h3>
              <button
                onClick={onNavigateToCourses}
                className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1"
              >
                <span>Browse catalog</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {stats.enrollments.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-800 mb-1">No Active Enrollments Yet</p>
                <p className="text-xs text-slate-500 mb-4">
                  Select a starter course in English, Spanish, French, or German to begin.
                </p>
                <button
                  onClick={onNavigateToCourses}
                  className="px-4 py-2 text-xs font-semibold text-white bg-purple-700 rounded-lg hover:bg-purple-800"
                >
                  Explore Free Courses
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.enrollments.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => onSelectCourse(course.id)}
                    className="bg-white rounded-xl border border-slate-200 p-5 hover:border-purple-300 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                        <img
                          src={course.image_url}
                          alt={course.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-0.5">
                          <span className="font-semibold text-purple-700">{course.language}</span>
                          <span>·</span>
                          <span>Level {course.cefr_level}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {course.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="text-xs font-bold text-purple-700 tabular-nums">
                          {course.progress_percent || 0}%
                        </span>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-purple-700"
                            style={{ width: `${course.progress_percent || 0}%` }}
                          />
                        </div>
                      </div>
                      <span className="px-3 py-1.5 text-xs font-semibold bg-purple-50 text-purple-700 rounded-lg group-hover:bg-purple-100">
                        Continue →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Earned Certificates */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">Earned Credentials</h3>
            {stats.certificates.length === 0 ? (
              <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-6 text-center text-xs text-slate-500">
                <Award className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                <p className="font-semibold text-slate-700">No certificates issued yet</p>
                <p className="text-[11px] mt-0.5">Complete all lessons in a course and pass the final assessment at 70%+ to unlock official credentials.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stats.certificates.map((cert) => (
                  <div
                    key={cert.id}
                    onClick={() => onOpenCertModal(cert)}
                    className="p-4 bg-white rounded-xl border border-purple-200 hover:border-purple-400 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{cert.course_title}</h4>
                        <p className="text-[10px] text-slate-400 font-mono">{cert.id} · {cert.final_score}% Grade</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-purple-700">View & Print →</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent XP Ledger History */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Authoritative XP Reward Ledger
            </h4>
            <div className="divide-y divide-slate-100 text-xs">
              {stats.recentXp.map((entry) => (
                <div key={entry.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-purple-600" />
                    <span className="text-slate-800 font-medium">{entry.reason}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                    <span className="font-bold text-purple-700 tabular-nums">+{entry.amount} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): 6-Skill Radar & Gamification Badges */}
        <div className="lg:col-span-4 space-y-6">
          {/* 6-Skill Competency Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">6-Skill Competency</h3>
              <span className="text-[10px] uppercase font-bold text-slate-400">Calibrated</span>
            </div>

            <div className="space-y-3.5">
              {stats.skills.map((s) => (
                <div key={s.skill}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{s.skill}</span>
                    <span className="font-bold text-purple-700 tabular-nums">{s.score}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-700 transition-all duration-500"
                      style={{ width: `${s.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Unlocked Achievements */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Achievements</h3>
              <span className="text-xs text-slate-500 tabular-nums">
                {stats.achievements.unlockedCount} / {stats.achievements.totalCount}
              </span>
            </div>

            <div className="space-y-3">
              {stats.achievements.unlocked.map((ach) => (
                <div key={ach.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                    ★
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">{ach.title}</h5>
                    <p className="text-[11px] text-slate-500 leading-tight">{ach.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Plan Status Card */}
          <div className="p-5 bg-purple-900 text-white rounded-xl border border-purple-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                Subscription Status
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-purple-800 text-purple-200 rounded">
                {subscription?.plan_name || 'Free Starter'}
              </span>
            </div>
            <p className="text-xs text-purple-200 mb-4">
              {subscription?.status === 'free'
                ? 'Unlock speaking audio checks, professional courses, and official credentials.'
                : 'Pro Scholar entitlements active. Full 6-modality access enabled.'}
            </p>
            <button
              onClick={onOpenSubscriptions}
              className="w-full py-2 text-xs font-bold bg-white text-purple-950 hover:bg-purple-50 rounded-lg transition-colors"
            >
              Manage Subscription Plans
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
