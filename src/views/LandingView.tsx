import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Course } from '../types';
import {
  BookOpen,
  Headphones,
  Video,
  Mic,
  PenTool,
  Layers,
  Award,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

interface LandingViewProps {
  courses: Course[];
  onNavigate: (view: string, param?: string) => void;
  onSelectCourse: (courseId: string) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  courses,
  onNavigate,
  onSelectCourse
}) => {
  const { user, openAuthModal } = useAuth();

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section (Split Layout adhering to Education reference) */}
      <section className="max-w-7xl mx-auto px-6 pt-10 sm:pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-md border border-purple-200">
              <span className="w-2 h-2 rounded-full bg-purple-700" />
              <span>CEFR-Aligned Pedagogy · University Capstone Demonstration</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] [text-wrap:balance]">
              Learn Languages. Track Progress. <span className="text-purple-700">Prove Your Skills.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
              Master English, Spanish, French, and German through an integrated 6-modality practice engine. Earn verifiable academic certificates backed by persistent server-graded assessments.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              {user ? (
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="px-6 py-3 text-sm font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-all shadow-sm flex items-center gap-2"
                >
                  <span>Go to My Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => openAuthModal('register')}
                  className="px-6 py-3 text-sm font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-all shadow-sm flex items-center gap-2"
                >
                  <span>Start Learning Free</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => onNavigate('courses')}
                className="px-6 py-3 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors"
              >
                Explore Courses
              </button>

              <button
                onClick={() => onNavigate('live-classes')}
                className="px-5 py-3 text-sm font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Seminars</span>
              </button>
            </div>

            {/* Micro proof strip */}
            <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center gap-6 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero mock data · Persistent SQLite</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Hidden-key server grading</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600" />
                <span>Verifiable cryptographic IDs</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Asset */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-slate-100 aspect-4/3 lg:aspect-auto lg:h-[420px]">
              <img
                src="/src/assets/images/hero_language_learner_1792167190387.jpg"
                alt="Multilingual language learner studying with modern dashboard"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 text-white p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                <p className="text-xs font-semibold">CEFR A1 to B1 Structured Mastery</p>
                <p className="text-[11px] text-slate-200">Active listening, pronunciation recording, and formal writing</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6-Modality Engine Highlights */}
      <section className="bg-slate-900 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 block mb-2">
              Holistic Linguistic Competence
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white mb-3">
              The 6-Modality Learning Engine
            </h2>
            <p className="text-sm text-slate-400">
              Fluency requires engaging every cognitive pathway. LingoPro connects reading, listening, video, speaking, writing, and grammar into every lesson.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <div className="w-10 h-10 rounded-lg bg-purple-600/30 text-purple-400 flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">1. Reading Modality</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Authentic cultural passages with instant translation toggling, interactive vocabulary glossaries, and contextual comprehension checks.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <div className="w-10 h-10 rounded-lg bg-sky-600/30 text-sky-400 flex items-center justify-center mb-4">
                <Headphones className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">2. Listening Modality</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Playable audio synthesizers with variable playback speeds (0.75x to 1.25x), revealed transcripts, and aural comprehension drills.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <div className="w-10 h-10 rounded-lg bg-rose-600/30 text-rose-400 flex items-center justify-center mb-4">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">3. Video Modality</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Curated visual culture lectures with timestamped key insights and synchronized video comprehension evaluation.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <div className="w-10 h-10 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center mb-4">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">4. Speaking Modality</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                In-browser microphone recording with waveform playback, retake controls, and Gemini-powered phonetic pronunciation evaluation.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <div className="w-10 h-10 rounded-lg bg-amber-600/30 text-amber-400 flex items-center justify-center mb-4">
                <PenTool className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">5. Writing Modality</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sentence syntax reassembly, rule-based fill-in drills, and open-ended written composition reviewed by the AI tutor.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">6. Grammar & Vocab</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Systematic rule breakdowns with bilingual contextual examples and active recall flashcards with animated flip states.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses Grid */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-700 block mb-1">
              Curriculum Catalog
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Featured CEFR Courses
            </h2>
          </div>
          <button
            onClick={() => onNavigate('courses')}
            className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 transition-colors"
          >
            <span>View all courses</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.slice(0, 3).map((c) => (
            <div
              key={c.id}
              onClick={() => onSelectCourse(c.id)}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-purple-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="aspect-16/9 overflow-hidden bg-slate-100 relative">
                  <img
                    src={c.image_url}
                    alt={c.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  {c.is_premium ? (
                    <span className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-900/90 text-amber-300 backdrop-blur-xs rounded">
                      Pro Scholar
                    </span>
                  ) : (
                    <span className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-700/90 text-white backdrop-blur-xs rounded">
                      Free Starter
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <span className="font-semibold text-slate-700">{c.language}</span>
                    <span>·</span>
                    <span>Level {c.cefr_level}</span>
                    <span>·</span>
                    <span>{c.total_lessons || 5} Lessons</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                    {c.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                    {c.description}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between mt-2">
                <span className="text-xs font-semibold text-purple-700">Explore Curriculum →</span>
                {c.is_enrolled && (
                  <span className="text-[11px] font-semibold text-emerald-700">Enrolled ({c.progress_percent}%)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Verifiable Credentials Proof Section */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="bg-purple-900 text-white rounded-2xl p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-xl">
          <div className="lg:col-span-7 space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">
              Academic Rigor
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Earn Authoritative, Verifiable Certificates
            </h2>
            <p className="text-xs sm:text-sm text-purple-200 leading-relaxed">
              Every LingoPro certificate is cryptographically indexed on our server. Employers and institutions can independently verify credential validity via our public registry using the unique Certificate ID.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('verify')}
                className="px-5 py-2.5 text-xs font-bold bg-white text-purple-950 rounded-lg hover:bg-purple-50 transition-colors shadow-sm"
              >
                Open Verification Registry
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <div className="bg-white text-slate-900 p-6 rounded-xl border border-purple-200 shadow-2xl max-w-sm w-full text-center">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-2">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Sample Registry ID</h4>
              <p className="text-base font-bold font-mono text-purple-900 mb-2">LP-2026-ENG-4912</p>
              <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-left space-y-1">
                <p><strong>Student:</strong> Raushan Kumar</p>
                <p><strong>Course:</strong> English A1 Foundations</p>
                <p><strong>Final Exam:</strong> 95% Verified Grade</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-700 block mb-1">
            Predictable Pricing
          </span>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
            Subscription Options
          </h2>
          <p className="text-xs text-slate-600">
            Initial configurable test-mode rates with Razorpay sandbox integration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Free Starter</h3>
              <p className="text-xs text-slate-500 mb-4">Core foundations for beginners</p>
              <div className="mb-6">
                <span className="text-3xl font-extrabold text-slate-900">₹0</span>
                <span className="text-xs text-slate-500"> / forever</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Access Level A1 Courses</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Reading & Vocab Modalities</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Standard Lesson Quizzes</li>
              </ul>
            </div>
            <button
              onClick={() => openAuthModal('register')}
              className="w-full py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors"
            >
              Get Started Free
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl border-2 border-purple-600 shadow-md relative flex flex-col justify-between">
            <span className="absolute -top-3 right-4 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-700 text-white rounded">
              Recommended
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Pro Scholar</h3>
              <p className="text-xs text-slate-500 mb-4">Comprehensive language mastery</p>
              <div className="mb-6">
                <span className="text-3xl font-extrabold text-slate-900">₹299</span>
                <span className="text-xs text-slate-500"> / month</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> All 5 CEFR Courses (A1 to B1)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Full 6-Modality Speaking Engine</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verifiable Official Certificates</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> AI Language Tutor Companion</li>
              </ul>
            </div>
            <button
              onClick={() => onNavigate('subscriptions')}
              className="w-full py-2 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-lg transition-colors shadow-sm"
            >
              Upgrade to Pro (Test Sandbox)
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Global Career Pass</h3>
              <p className="text-xs text-slate-500 mb-4">Executive international fluency</p>
              <div className="mb-6">
                <span className="text-3xl font-extrabold text-slate-900">₹599</span>
                <span className="text-xs text-slate-500"> / month</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Everything in Pro Scholar</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Professional B1 Workplace Modules</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Unlimited AI Pronunciation Checks</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Direct LinkedIn Credential Badging</li>
              </ul>
            </div>
            <button
              onClick={() => onNavigate('subscriptions')}
              className="w-full py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors"
            >
              Select Career Pass
            </button>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="max-w-4xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900 mb-1">
              How are certificates awarded?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Certificates are not issued based on client self-reporting. To claim an official certificate, the server verifies that you have marked all 5 lessons completed and passed the comprehensive final course assessment with a score of at least 70%.
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900 mb-1">
              How does the 6-modality practice engine work?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every lesson includes six dedicated interactive modules: reading authentic text with vocabulary toggles, listening comprehension with speed controls, video lectures, microphone speaking practice with playback and AI feedback, writing syntax reassembly, and grammar rules with flashcards.
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900 mb-1">
              Is payment real or sandbox mode?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              The platform currently operates in Razorpay Test Sandbox mode. Orders and signatures are validated server-side without charging real currency.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
