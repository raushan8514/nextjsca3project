import React, { useState } from 'react';
import { BookOpen, Languages, HelpCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface ReadingContent {
  passage: string;
  translation?: string;
  vocabulary?: Array<{ word: string; meaning: string }>;
  questions?: Array<{ q: string; a: string }>;
}

interface ReadingExerciseProps {
  content: ReadingContent;
  onComplete: () => void;
  isCompleted?: boolean;
}

export const ReadingExercise: React.FC<ReadingExerciseProps> = ({ content, onComplete, isCompleted }) => {
  const [showTranslation, setShowTranslation] = useState(false);
  const [selectedWord, setSelectedWord] = useState<{ word: string; meaning: string } | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm">
          <BookOpen className="w-4 h-4" />
          <span>Reading Modality · Textual Analysis</span>
        </div>
        <button
          onClick={() => setShowTranslation(!showTranslation)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-purple-700 bg-slate-50 hover:bg-purple-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
        >
          <Languages className="w-3.5 h-3.5" />
          <span>{showTranslation ? 'Hide Translation' : 'Show Translation'}</span>
        </button>
      </div>

      {/* Main Passage */}
      <div className="bg-slate-50 rounded-xl p-6 mb-5 border border-slate-200/80">
        <p className="text-base sm:text-lg leading-relaxed text-slate-800 font-serif">
          {content.passage}
        </p>

        {showTranslation && content.translation && (
          <div className="mt-4 pt-4 border-t border-slate-200 text-sm text-slate-600 italic">
            <span className="font-semibold not-italic text-slate-700 mr-1">Translation:</span>
            {content.translation}
          </div>
        )}
      </div>

      {/* Interactive Vocabulary Glossary */}
      {content.vocabulary && content.vocabulary.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Target Vocabulary (Click term for definition)
          </h4>
          <div className="flex flex-wrap gap-2">
            {content.vocabulary.map((vocab, i) => (
              <button
                key={i}
                onClick={() => setSelectedWord(selectedWord?.word === vocab.word ? null : vocab)}
                className={`text-xs px-3 py-1.5 rounded-md transition-colors border ${
                  selectedWord?.word === vocab.word
                    ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
                }`}
              >
                {vocab.word}
              </button>
            ))}
          </div>

          {selectedWord && (
            <div className="mt-3 p-3 bg-purple-50/70 border border-purple-200 rounded-lg text-xs text-purple-900">
              <span className="font-bold">{selectedWord.word}</span>: {selectedWord.meaning}
            </div>
          )}
        </div>
      )}

      {/* Comprehension Check */}
      {content.questions && content.questions.length > 0 && (
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <button
            onClick={() => setShowQuestions(!showQuestions)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-700"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
              <span>Comprehension Check ({content.questions.length} questions)</span>
            </span>
            {showQuestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showQuestions && (
            <div className="mt-3 space-y-3 pt-3 border-t border-slate-200">
              {content.questions.map((q, idx) => (
                <div key={idx} className="text-xs">
                  <p className="font-medium text-slate-800 mb-1">{q.q}</p>
                  <input
                    type="text"
                    placeholder="Type your response..."
                    value={userAnswers[idx] || ''}
                    onChange={(e) => setUserAnswers({ ...userAnswers, [idx]: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                  {userAnswers[idx] && (
                    <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Suggested Model Answer: {q.a}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action footer */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onComplete}
          className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors ${
            isCompleted
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-purple-700 hover:bg-purple-800 text-white shadow-sm'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isCompleted ? 'Completed' : 'Mark Reading Complete (+25 XP)'}</span>
        </button>
      </div>
    </div>
  );
};
