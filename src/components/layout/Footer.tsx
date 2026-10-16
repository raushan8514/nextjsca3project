import React from 'react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 px-6 border-t border-slate-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-md bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
              L
            </span>
            <span className="text-white font-bold text-lg tracking-tight">LingoPro</span>
          </div>
          <p className="text-sm leading-relaxed text-slate-400 max-w-xs">
            Learn Languages. Track Progress. Prove Your Skills. A production-grade EdTech platform designed for measurable CEFR linguistic fluency.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
            Languages & CEFR
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <button onClick={() => onNavigate('courses')} className="hover:text-white transition-colors">
                English Foundations (A1)
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('courses')} className="hover:text-white transition-colors">
                Professional English (B1)
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('courses')} className="hover:text-white transition-colors">
                Conversational Spanish (A2)
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('courses')} className="hover:text-white transition-colors">
                French Foundations (A1)
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('courses')} className="hover:text-white transition-colors">
                Career German (B1)
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
            Academic Credentialing
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <button onClick={() => onNavigate('verify')} className="hover:text-white transition-colors">
                Public Certificate Registry
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('subscriptions')} className="hover:text-white transition-colors">
                Student & Scholar Plans
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('courses')} className="hover:text-white transition-colors">
                Assessment Rubrics & Passing Rules
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
            Capstone Information
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            Built as a comprehensive full-stack university CA-3 demonstration with persistent SQLite, server-side grading, test-mode payment verification, and Google Gemini AI assistance.
          </p>
          <div className="text-xs text-slate-500">
            Node.js 22 · Express · React 19 · SQLite
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800 text-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
        <div>
          © 2026 LingoPro EdTech Platform. All rights reserved.
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => onNavigate('verify')} className="hover:text-slate-300 transition-colors">
            Verify a Certificate
          </button>
          <button onClick={() => onNavigate('subscriptions')} className="hover:text-slate-300 transition-colors">
            Pricing
          </button>
          <button onClick={() => onNavigate('courses')} className="hover:text-slate-300 transition-colors">
            All Courses
          </button>
        </div>
      </div>
    </footer>
  );
};
