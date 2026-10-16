import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, ShieldCheck, AlertCircle } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalMode, closeAuthModal, login, register, openAuthModal } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(authModalMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync mode when modal opens
  React.useEffect(() => {
    setMode(authModalMode);
    setErrorMessage(null);
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await login(demoEmail, demoPass);
    } catch (err: any) {
      setErrorMessage(err.message || 'Quick login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-purple-700 text-white flex items-center justify-center font-bold text-sm">
              L
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              {mode === 'login' ? 'Sign In to LingoPro' : 'Create Free Student Account'}
            </h3>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              {mode === 'register' && (
                <p className="text-[10px] text-slate-400 mt-1">Must be at least 6 characters long.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-colors shadow-sm disabled:opacity-50 mt-2"
            >
              {isSubmitting
                ? 'Validating credentials...'
                : mode === 'login'
                ? 'Sign In'
                : 'Create Student Account'}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="text-center pt-4 border-t border-slate-100 mt-5">
            {mode === 'login' ? (
              <p className="text-xs text-slate-600">
                New to LingoPro?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-purple-700 font-semibold hover:underline"
                >
                  Create an account free
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-purple-700 font-semibold hover:underline"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>

          {/* Quick Demo Fill Buttons for Presentations */}
          <div className="mt-5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">
              Demonstration Accounts (Instant Fill)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('student@lingopro.edu', 'Student@LingoPro2026!')}
                className="py-1.5 px-2 bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-700 font-medium rounded-lg border border-slate-200 text-center transition-colors"
              >
                Demo Student
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@lingopro.edu', 'Admin@LingoPro2026!')}
                className="py-1.5 px-2 bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 font-medium rounded-lg border border-slate-200 text-center transition-colors"
              >
                Administrator
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
