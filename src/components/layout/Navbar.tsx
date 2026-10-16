import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Shield, User as UserIcon, LogOut, Award, Flame } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenAiTutor: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenAiTutor }) => {
  const { user, isAdmin, openAuthModal, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onNavigate('landing')}
          className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-purple-700 transition-colors flex items-center gap-2"
        >
          <span className="w-8 h-8 rounded-lg bg-purple-700 text-white flex items-center justify-center font-extrabold text-base shadow-sm">
            L
          </span>
          <span>LingoPro</span>
        </button>

        {/* Zone 2: 4-5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            onClick={() => onNavigate('courses')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentView === 'courses' ? 'text-purple-700 font-semibold' : 'hover:text-slate-900'
            }`}
          >
            Courses
          </button>
          <button
            onClick={() => onNavigate('live-classes')}
            className={`whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
              currentView === 'live-classes' ? 'text-purple-700 font-semibold' : 'hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Classes</span>
          </button>
          <button
            onClick={() => onNavigate('subscriptions')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentView === 'subscriptions' ? 'text-purple-700 font-semibold' : 'hover:text-slate-900'
            }`}
          >
            Pricing & Plans
          </button>
          <button
            onClick={() => onNavigate('verify')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              currentView === 'verify' ? 'text-purple-700 font-semibold' : 'hover:text-slate-900'
            }`}
          >
            Verify Credential
          </button>
          {user && (
            <button
              onClick={() => onNavigate('dashboard')}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                currentView === 'dashboard' ? 'text-purple-700 font-semibold' : 'hover:text-slate-900'
              }`}
            >
              My Dashboard
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className={`whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors ${
                currentView === 'admin' ? 'text-purple-700 font-semibold' : 'text-amber-700 hover:text-amber-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </button>
          )}
        </nav>

        {/* Zone 3: 1 primary action area */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenAiTutor}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
            title="Open Gemini AI Language Tutor"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>AI Tutor</span>
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600">
                <span className="flex items-center gap-1 text-amber-600 font-medium">
                  <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span className="tabular-nums">{user.streak_days}d streak</span>
                </span>
                <span className="text-slate-300">|</span>
                <span className="font-semibold text-purple-700 tabular-nums">{user.xp} XP</span>
              </div>

              <button
                onClick={() => onNavigate('dashboard')}
                className="px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-600" />
                <span className="max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
              </button>

              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('login')}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="px-4 py-2 text-xs font-semibold text-white bg-purple-700 rounded-lg hover:bg-purple-800 transition-colors shadow-sm whitespace-nowrap"
              >
                Start Learning Free
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
