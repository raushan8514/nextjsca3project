import React, { useState, useEffect } from 'react';
import { Quiz, QuizQuestion, QuizResult } from '../../types';
import { api } from '../../lib/api';
import confetti from 'canvas-confetti';
import { Award, AlertCircle, CheckCircle2, XCircle, ArrowRight, RotateCcw, ChevronRight } from 'lucide-react';

interface QuizPlayerProps {
  quizId: string;
  courseId?: string;
  onClose?: () => void;
  onClaimCertificate?: (courseId: string) => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({
  quizId,
  courseId,
  onClose,
  onClaimCertificate
}) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuiz = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getQuiz(quizId);
      setQuiz(data.quiz);
      setQuestions(data.questions);
    } catch (err: any) {
      setError(err.message || 'Failed to load quiz');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const handleSelectOption = (questionId: string, option: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: option
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.submitQuiz(quizId, selectedAnswers);
      setResult(res);
      if (res.passed) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to grade assessment on server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setResult(null);
    setSelectedAnswers({});
    setCurrentIndex(0);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">Retrieving official assessment criteria...</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-800 mb-2">Error Loading Assessment</p>
        <p className="text-xs text-slate-500 mb-4">{error || 'Quiz not found'}</p>
        <button
          onClick={fetchQuiz}
          className="px-4 py-2 text-xs font-semibold bg-purple-700 text-white rounded-lg hover:bg-purple-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  // --- REVIEW VIEW (AFTER SUBMISSION) ---
  if (result) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="text-center pb-6 border-b border-slate-100">
          <div
            className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-3 ${
              result.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}
          >
            {result.passed ? <Award className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-1">
            {result.passed ? 'Assessment Passed!' : 'Passing Threshold Not Met'}
          </h3>
          <p className="text-xs text-slate-500 mb-4">{result.message}</p>

          <div className="inline-flex items-center gap-6 px-6 py-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400">Your Score</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{result.score}%</p>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400">Passing Bar</p>
              <p className="text-2xl font-bold text-slate-500 tabular-nums">{result.passingThreshold}%</p>
            </div>
            {result.xpAwarded > 0 && (
              <>
                <div className="w-px h-8 bg-slate-200" />
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-400">XP Earned</p>
                  <p className="text-2xl font-bold text-purple-700 tabular-nums">+{result.xpAwarded}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Detailed Mistake Explanations */}
        <div className="my-6 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Server-Graded Feedback Breakdown
          </h4>
          {result.reviews.map((rev, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border text-xs leading-relaxed ${
                rev.isCorrect
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50/50 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="font-semibold text-slate-900">{rev.prompt}</p>
                {rev.isCorrect ? (
                  <span className="flex items-center gap-1 text-emerald-700 font-bold shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-700 font-bold shrink-0">
                    <XCircle className="w-3.5 h-3.5" /> Incorrect
                  </span>
                )}
              </div>

              <p className="text-slate-600 mb-1">
                Your Answer: <span className="font-medium text-slate-900">{rev.userAnswer}</span>
              </p>
              {!rev.isCorrect && (
                <p className="text-emerald-800 font-medium mb-1">
                  Correct Answer: <span>{rev.correctAnswer}</span>
                </p>
              )}
              <p className="text-slate-500 text-[11px] pt-1 border-t border-slate-200/60">
                <span className="font-semibold">Explanation:</span> {rev.explanation}
              </p>
            </div>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={handleRetake}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Assessment</span>
          </button>

          <div className="flex items-center gap-2">
            {result.passed && quiz.is_final_assessment && courseId && onClaimCertificate && (
              <button
                onClick={() => onClaimCertificate(courseId)}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Award className="w-4 h-4" />
                <span>Claim Official Certificate</span>
              </button>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
              >
                Back to Curriculum
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- ACTIVE QUESTIONS RUNNER VIEW ---
  const currentQ = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);
  const isLast = currentIndex === questions.length - 1;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
        <div>
          <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider block">
            {quiz.is_final_assessment ? 'Final Certification Examination' : 'Progress Assessment'}
          </span>
          <h3 className="text-base font-bold text-slate-900">{quiz.title}</h3>
        </div>
        <span className="text-xs font-semibold text-slate-500 tabular-nums">
          Question {currentIndex + 1} of {questions.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-100 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-purple-700 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Question Card */}
      {currentQ && (
        <div className="mb-8">
          <p className="text-base font-semibold text-slate-900 mb-4">
            {currentIndex + 1}. {currentQ.prompt}
          </p>

          <div className="space-y-2.5">
            {currentQ.options.map((opt, i) => {
              const isSelected = selectedAnswers[currentQ.id] === opt;
              return (
                <button
                  key={i}
                  onClick={() => handleSelectOption(currentQ.id, opt)}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-purple-50/80 border-purple-600 text-purple-950 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                        isSelected
                          ? 'bg-purple-700 border-purple-700 text-white'
                          : 'border-slate-300 text-slate-500'
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{opt}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation & Submission Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none"
        >
          Previous
        </button>

        {!isLast ? (
          <button
            onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span>Next Question</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || Object.keys(selectedAnswers).length === 0}
            className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Submitting to Server...' : 'Submit & Grade Assessment'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
