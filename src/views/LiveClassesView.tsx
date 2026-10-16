import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { LiveClass, Course } from '../types';
import {
  Video,
  Calendar,
  Clock,
  Users,
  Radio,
  Plus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Crown,
  Search,
  Filter,
  Trash2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface LiveClassesViewProps {
  onJoinClass: (classId: string) => void;
  onOpenSubscriptions: () => void;
}

export const LiveClassesView: React.FC<LiveClassesViewProps> = ({ onJoinClass, onOpenSubscriptions }) => {
  const { user, isAdmin, openAuthModal } = useAuth();
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'live' | 'upcoming' | 'registered'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Schedule modal state for admins
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);
  const [newClassForm, setNewClassForm] = useState({
    title: '',
    description: '',
    course_id: '',
    scheduled_at: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    duration_minutes: 45,
    max_capacity: 25
  });

  const loadClasses = async () => {
    setIsLoading(true);
    try {
      const res = await api.getLiveClasses();
      setClasses(res.classes);

      const courseRes = await api.getCourses();
      setCourses(courseRes.courses);
      if (courseRes.courses.length > 0 && !newClassForm.course_id) {
        setNewClassForm((prev) => ({ ...prev, course_id: courseRes.courses[0].id }));
      }
    } catch (err) {
      console.error('Failed to load live classes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, [user]);

  const handleRegisterToggle = async (liveClass: LiveClass) => {
    if (!user) {
      openAuthModal();
      return;
    }

    try {
      if (liveClass.is_registered) {
        await api.unregisterFromLiveClass(liveClass.id);
      } else {
        await api.registerForLiveClass(liveClass.id);
      }
      await loadClasses();
    } catch (err: any) {
      alert(err.message || 'Failed to update registration status.');
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassForm.title.trim() || !newClassForm.scheduled_at) {
      alert('Title and scheduled date/time are required.');
      return;
    }

    setIsSubmittingSchedule(true);
    try {
      await api.scheduleLiveClass({
        title: newClassForm.title.trim(),
        description: newClassForm.description.trim(),
        course_id: newClassForm.course_id || undefined,
        scheduled_at: new Date(newClassForm.scheduled_at).toISOString(),
        duration_minutes: Number(newClassForm.duration_minutes),
        max_capacity: Number(newClassForm.max_capacity)
      });
      setIsScheduleModalOpen(false);
      setNewClassForm({
        title: '',
        description: '',
        course_id: courses[0]?.id || '',
        scheduled_at: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
        duration_minutes: 45,
        max_capacity: 25
      });
      await loadClasses();
    } catch (err: any) {
      alert(err.message || 'Failed to schedule live class.');
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Are you sure you want to cancel and delete this scheduled live class?')) return;
    try {
      await api.deleteLiveClass(classId);
      await loadClasses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete class.');
    }
  };

  const filteredClasses = classes.filter((c) => {
    if (filterTab === 'live' && c.status !== 'live') return false;
    if (filterTab === 'upcoming' && c.status !== 'scheduled') return false;
    if (filterTab === 'registered' && !c.is_registered) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchDesc = (c.description || '').toLowerCase().includes(q);
      const matchInstructor = (c.instructor_name || '').toLowerCase().includes(q);
      const matchCourse = (c.course_title || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchInstructor && !matchCourse) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
      {/* 1. HERO HEADER */}
      <div className="relative rounded-3xl bg-linear-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-8 sm:p-12 overflow-hidden border border-slate-800 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Interactive Live Language Seminars</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Live Classroom Sessions
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Practice conversational fluency in real-time with certified native instructors and fellow global scholars.
            Features WebRTC audio/video, interactive whiteboard, live pronunciation drills, and automatic CEFR attendance tracking.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule New Session</span>
              </button>
            )}

            <button
              onClick={onOpenSubscriptions}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-100 font-semibold text-xs border border-white/20 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Unlimited Classroom Access with Pro</span>
            </button>
          </div>
        </div>

        {/* Decorative Grid Accent */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      </div>

      {/* 2. CONTROLS: FILTERS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-medium">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              filterTab === 'all' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Sessions ({classes.length})
          </button>
          <button
            onClick={() => setFilterTab('live')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              filterTab === 'live' ? 'bg-white text-emerald-800 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Now ({classes.filter((c) => c.status === 'live').length})</span>
          </button>
          <button
            onClick={() => setFilterTab('upcoming')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              filterTab === 'upcoming' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upcoming ({classes.filter((c) => c.status === 'scheduled').length})
          </button>
          {user && (
            <button
              onClick={() => setFilterTab('registered')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                filterTab === 'registered' ? 'bg-white text-purple-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Registered ({classes.filter((c) => c.is_registered).length})
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search classes or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
          />
        </div>
      </div>

      {/* 3. CLASS SESSIONS GRID */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Retrieving live seminar schedules...</p>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
          <Video className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900 mb-1">No Classrooms Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            {filterTab === 'live'
              ? 'There are currently no active live seminars in progress. Check upcoming sessions below.'
              : filterTab === 'registered'
              ? "You haven't registered for any upcoming live sessions yet."
              : 'No scheduled sessions match your filter criteria.'}
          </p>
          {isAdmin && (
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors"
            >
              Schedule First Session
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((item) => {
            const scheduledDate = new Date(item.scheduled_at);
            const isLive = item.status === 'live';
            const isCompleted = item.status === 'completed';
            const isCancelled = item.status === 'cancelled';
            const canJoin = isLive || isAdmin || item.is_registered;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden ${
                  isLive
                    ? 'border-emerald-400 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header Banner */}
                <div className="p-5 pb-0">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {/* Status Badge */}
                    {isLive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>LIVE NOW</span>
                      </span>
                    ) : isCompleted ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                        Completed
                      </span>
                    ) : isCancelled ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-semibold">
                        Cancelled
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">
                        Scheduled
                      </span>
                    )}

                    {item.course_language && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-purple-50 text-purple-700 border border-purple-200">
                        {item.course_language}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 tracking-tight mb-2 line-clamp-1">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                    {item.description || 'Interactive speaking drills and language practice.'}
                  </p>

                  {/* Metadata Chips */}
                  <div className="space-y-2 py-3 border-y border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{scheduledDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      <span className="text-slate-300">·</span>
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({item.duration_minutes}m)</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          <strong className="text-slate-900">{item.registered_count || 0}</strong> / {item.max_capacity} Enrolled
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Instructor: {item.instructor_name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteClass(item.id)}
                      title="Delete class"
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    {/* Register button for scheduled classes */}
                    {!isCompleted && !isCancelled && !isLive && (
                      <button
                        onClick={() => handleRegisterToggle(item)}
                        disabled={!item.is_registered && item.is_full}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          item.is_registered
                            ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                            : item.is_full
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-2xs'
                        }`}
                      >
                        {item.is_registered ? 'Registered ✓' : item.is_full ? 'Full' : 'Register'}
                      </button>
                    )}

                    {/* Join Classroom Button */}
                    {!isCompleted && !isCancelled && (
                      <button
                        onClick={() => onJoinClass(item.id)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                          isLive
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse'
                            : 'bg-purple-700 hover:bg-purple-800 text-white'
                        }`}
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>{isLive ? 'Join Live Now' : 'Enter Room'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. SCHEDULE CLASS MODAL (Admin only) */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-purple-700">
                <Video className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Schedule Live Seminar</h3>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Session Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master French Subjunctive in Dialogue"
                  value={newClassForm.title}
                  onChange={(e) => setNewClassForm({ ...newClassForm, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Associated Course</label>
                <select
                  value={newClassForm.course_id}
                  onChange={(e) => setNewClassForm({ ...newClassForm, course_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                >
                  <option value="">General Language Seminar (No specific course)</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.language} · {c.cefr_level})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newClassForm.scheduled_at}
                    onChange={(e) => setNewClassForm({ ...newClassForm, scheduled_at: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={15}
                    max={180}
                    step={15}
                    value={newClassForm.duration_minutes}
                    onChange={(e) => setNewClassForm({ ...newClassForm, duration_minutes: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Max Capacity (Students)</label>
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={newClassForm.max_capacity}
                  onChange={(e) => setNewClassForm({ ...newClassForm, max_capacity: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description & Learning Goals</label>
                <textarea
                  rows={3}
                  placeholder="Outline key conversation topics, pronunciation drills, and target vocabulary..."
                  value={newClassForm.description}
                  onChange={(e) => setNewClassForm({ ...newClassForm, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSchedule}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isSubmittingSchedule ? 'Scheduling...' : 'Schedule Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
