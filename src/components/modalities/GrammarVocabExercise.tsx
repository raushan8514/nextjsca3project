import React, { useState } from 'react';
import { Layers, CheckCircle2, RotateCw } from 'lucide-react';

interface GrammarContent {
  rule: string;
  examples?: Array<{ en: string; es?: string }>;
  flashcards?: Array<{ term: string; def: string }>;
}

interface GrammarVocabExerciseProps {
  content: GrammarContent;
  onComplete: () => void;
  isCompleted?: boolean;
}

export const GrammarVocabExercise: React.FC<GrammarVocabExerciseProps> = ({
  content,
  onComplete,
  isCompleted
}) => {
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  const toggleCard = (index: number) => {
    setFlippedCards((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm">
          <Layers className="w-4 h-4" />
          <span>Grammar & Vocabulary · Structural Mastery</span>
        </div>
        <span className="text-[11px] text-slate-400">Rules & Flashcard Memory</span>
      </div>

      {/* Grammar Rule Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
          Grammar Principle
        </h4>
        <p className="text-sm font-semibold text-slate-900 mb-3">{content.rule}</p>

        {content.examples && content.examples.length > 0 && (
          <div className="space-y-1.5 pt-3 border-t border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Contextual Examples
            </span>
            {content.examples.map((ex, i) => (
              <div key={i} className="text-xs flex items-center justify-between text-slate-700 bg-white px-3 py-2 rounded border border-slate-200">
                <span className="font-medium text-slate-900">{ex.en}</span>
                {ex.es && <span className="text-slate-500 italic">{ex.es}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Flashcards */}
      {content.flashcards && content.flashcards.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Active Recall Flashcards (Click to Flip)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {content.flashcards.map((card, i) => {
              const isFlipped = flippedCards[i];
              return (
                <div
                  key={i}
                  onClick={() => toggleCard(i)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 min-h-28 flex flex-col justify-between ${
                    isFlipped
                      ? 'bg-purple-50/80 border-purple-300 text-purple-950'
                      : 'bg-white border-slate-200 hover:border-purple-300 text-slate-800 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>{isFlipped ? 'Definition' : 'Term'}</span>
                    <RotateCw className="w-3 h-3 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-center my-auto">
                    {isFlipped ? card.def : card.term}
                  </p>
                  <span className="text-[10px] text-center text-slate-400">
                    {isFlipped ? 'Click to show term' : 'Click to reveal definition'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Footer */}
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
          <span>{isCompleted ? 'Completed' : 'Mark Grammar Complete (+25 XP)'}</span>
        </button>
      </div>
    </div>
  );
};
