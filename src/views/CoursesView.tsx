import React, { useState, useEffect } from 'react';
import { Course } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, BookOpen, CheckCircle2, Lock, ArrowRight } from 'lucide-react';

interface CoursesViewProps {
  onSelectCourse: (courseId: string) => void;
  onOpenSubscriptions: () => void;
}

export const CoursesView: React.FC<CoursesViewProps> = ({
  onSelectCourse,
  onOpenSubscriptions
}) => {
  const { user, openAuthModal } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCourses({
        language: selectedLanguage,
        level: selectedLevel,
        search: searchQuery
      });
      setCourses(res.courses);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [selectedLanguage, selectedLevel]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCourses();
  };

  const languages = ['all', 'English', 'Spanish', 'French', 'German'];
  const levels = ['all', 'A1', 'A2', 'B1'];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Page Header */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-purple-700 block mb-1">
          Structured Curriculum
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Explore All CEFR Language Courses
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Progressively designed from everyday foundational dialogues to executive workplace fluency.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Language Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 rounded-lg">
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap capitalize ${
                selectedLanguage === lang
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lang === 'all' ? 'All Languages' : lang}
            </button>
          ))}
        </div>

        {/* Level and Search */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
            <span className="text-slate-400 px-2">Level:</span>
            {levels.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  selectedLevel === lvl
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lvl.toUpperCase()}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search curriculum..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600 w-40 sm:w-56"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </form>
        </div>
      </div>

      {/* Course Cards Grid */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading structured courses from persistent database...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-sm font-semibold text-slate-800 mb-1">No courses matched your filters</p>
          <p className="text-xs text-slate-500 mb-4">Try clearing your search query or language filter.</p>
          <button
            onClick={() => {
              setSelectedLanguage('all');
              setSelectedLevel('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 text-xs font-semibold bg-purple-700 text-white rounded-lg hover:bg-purple-800"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="aspect-16/9 overflow-hidden bg-slate-100 relative">
                  <img
                    src={course.image_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-white/90 text-slate-900 backdrop-blur-xs rounded shadow-xs">
                    {course.language} · Level {course.cefr_level}
                  </div>
                  {course.is_premium ? (
                    <div className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-950/90 text-amber-300 backdrop-blur-xs rounded flex items-center gap-1 shadow-xs">
                      <Lock className="w-3 h-3" />
                      <span>Pro Scholar</span>
                    </div>
                  ) : (
                    <div className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-700/90 text-white backdrop-blur-xs rounded shadow-xs">
                      Free Starter
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                    {course.description}
                  </p>

                  {/* Learning outcomes preview */}
                  <div className="space-y-1 mb-4 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                      Key Competencies
                    </span>
                    {course.learning_outcomes.slice(0, 2).map((outcome, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="truncate">{outcome}</span>
                      </div>
                    ))}
                  </div>

                  {/* Progress bar if enrolled */}
                  {course.is_enrolled && (
                    <div className="mb-4">
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>Progress</span>
                        <span className="font-semibold text-purple-700 tabular-nums">
                          {course.progress_percent || 0}% ({course.completed_lessons || 0}/{course.total_lessons || 5} lessons)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-700 transition-all duration-300"
                          style={{ width: `${course.progress_percent || 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Action */}
              <div className="p-5 pt-0">
                <button
                  onClick={() => onSelectCourse(course.id)}
                  className="w-full py-2.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>{course.is_enrolled ? 'Continue Course' : 'View Syllabus & Enroll'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
