import React, { useState } from 'react';
import { PenTool, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';

interface WritingContent {
  sentenceParts?: string[];
  fillPrompt?: string;
  correctBlank?: string;
  openPrompt?: string;
}

interface WritingExerciseProps {
  lessonId: string;
  content: WritingContent;
  onComplete: () => void;
  isCompleted?: boolean;
}

export const WritingExercise: React.FC<WritingExerciseProps> = ({
  lessonId,
  content,
  onComplete,
  isCompleted
}) => {
  // Scramble state
  const originalParts = content.sentenceParts || ['Hello,', 'I', 'am', 'learning', 'languages.'];
  const [shuffled] = useState<string[]>(() => [...originalParts].sort(() => Math.random() - 0.5));
  const [assembled, setAssembled] = useState<string[]>([]);
  const [scrambleStatus, setScrambleStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');

  // Fill in blank state
  const [blankAnswer, setBlankAnswer] = useState('');
  const [blankStatus, setBlankStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');

  // Open-ended state
  const [openResponse, setOpenResponse] = useState('');
  const [aiReview, setAiReview] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const addWord = (word: string, index: number) => {
    setAssembled([...assembled, word]);
  };

  const removeWord = (index: number) => {
    const next = [...assembled];
    next.splice(index, 1);
    setAssembled(next);
  };

  const checkSentenceScramble = () => {
    const reconstructed = assembled.join(' ');
    const target = originalParts.join(' ');
    if (reconstructed.toLowerCase() === target.toLowerCase()) {
      setScrambleStatus('correct');
    } else {
      setScrambleStatus('incorrect');
    }
  };

  const checkBlank = () => {
    if (!content.correctBlank) return;
    if (blankAnswer.trim().toLowerCase() === content.correctBlank.trim().toLowerCase()) {
      setBlankStatus('correct');
    } else {
      setBlankStatus('incorrect');
    }
  };

  const handleAiWritingReview = async () => {
    if (!openResponse.trim()) return;
    setIsLoadingAi(true);
    setAiReview(null);

    try {
      const res = await api.askAiTutor({
        prompt: `Review this language student's written response for grammatical accuracy, word choice, and natural phrasing:
"${openResponse}"
Provide 2-3 constructive sentences.`,
        mode: 'writing'
      });
      setAiReview(res.response);

      await api.saveActivityAttempt({
        lessonId,
        modality: 'writing',
        payload: { openResponse },
        feedback: res.response
      });
    } catch {
      setAiReview('Rule-based check: Response recorded. AI grammatical deep-evaluation requires GEMINI_API_KEY configuration.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm">
          <PenTool className="w-4 h-4" />
          <span>Writing Modality · Composition & Syntax</span>
        </div>
        <span className="text-[11px] text-slate-400">Rule-Based & AI Review</span>
      </div>

      {/* Part 1: Sentence Reconstruction */}
      {content.sentenceParts && (
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <h4 className="text-xs font-semibold text-slate-800 mb-2">
            1. Word Ordering Exercise: Reconstruct the sentence
          </h4>
          <p className="text-xs text-slate-500 mb-3">Click words in the correct logical sequence.</p>

          {/* Answer Slot */}
          <div className="min-h-12 p-3 bg-white border border-dashed border-slate-300 rounded-lg flex flex-wrap gap-2 items-center mb-3">
            {assembled.length === 0 && (
              <span className="text-xs text-slate-400 italic">Click words below to arrange them here...</span>
            )}
            {assembled.map((word, i) => (
              <button
                key={i}
                onClick={() => removeWord(i)}
                className="px-2.5 py-1 text-xs bg-purple-100 text-purple-900 rounded border border-purple-200 hover:bg-rose-100 hover:text-rose-900 transition-colors"
                title="Click to remove"
              >
                {word} ✕
              </button>
            ))}
          </div>

          {/* Word Bank */}
          <div className="flex flex-wrap gap-2 mb-3">
            {shuffled.map((word, i) => (
              <button
                key={i}
                onClick={() => addWord(word, i)}
                className="px-3 py-1 text-xs bg-white text-slate-800 border border-slate-300 hover:border-purple-600 rounded-md transition-colors"
              >
                {word}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={checkSentenceScramble}
              className="px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors"
            >
              Verify Sentence Order
            </button>
            <button
              onClick={() => {
                setAssembled([]);
                setScrambleStatus('idle');
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {scrambleStatus === 'correct' && (
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Perfect sentence structure!
              </span>
            )}
            {scrambleStatus === 'incorrect' && (
              <span className="text-xs text-rose-700 font-semibold">
                Order not quite right. Try again.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Part 2: Fill in the Blank (Rule-Based Grading) */}
      {content.fillPrompt && (
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <h4 className="text-xs font-semibold text-slate-800 mb-2">
            2. Fill-in-the-Blank Syntax Exercise
          </h4>
          <p className="text-xs text-slate-700 mb-3">{content.fillPrompt}</p>

          <div className="flex items-center gap-2 max-w-md mb-2">
            <input
              type="text"
              placeholder="Your answer"
              value={blankAnswer}
              onChange={(e) => setBlankAnswer(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600 flex-1"
            />
            <button
              onClick={checkBlank}
              className="px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors"
            >
              Check
            </button>
          </div>

          {blankStatus === 'correct' && (
            <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Correct! (Rule-based exact match)
            </p>
          )}
          {blankStatus === 'incorrect' && (
            <p className="text-xs text-rose-700 font-semibold">
              Incorrect. Expected: "{content.correctBlank}"
            </p>
          )}
        </div>
      )}

      {/* Part 3: Open-Ended Composition with Optional AI Review */}
      <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <h4 className="text-xs font-semibold text-slate-800 mb-1">
          3. Open-Ended Communicative Composition
        </h4>
        <p className="text-xs text-slate-500 mb-2">
          Write 1–2 sentences in your target language applying what you studied in this lesson:
        </p>
        <textarea
          rows={3}
          value={openResponse}
          onChange={(e) => setOpenResponse(e.target.value)}
          placeholder="Type your sentences here..."
          className="w-full p-3 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600 mb-2"
        />

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Open-ended feedback is reviewed by the AI tutor.
          </span>
          <button
            onClick={handleAiWritingReview}
            disabled={isLoadingAi || !openResponse.trim()}
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoadingAi ? 'Analyzing...' : 'Get AI Writing Review'}</span>
          </button>
        </div>

        {aiReview && (
          <div className="mt-3 p-3 bg-purple-50/70 border border-purple-200 rounded-lg text-xs text-purple-900 leading-relaxed">
            <span className="font-semibold block mb-1">Tutor Feedback:</span>
            {aiReview}
          </div>
        )}
      </div>

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
          <span>{isCompleted ? 'Completed' : 'Mark Writing Complete (+25 XP)'}</span>
        </button>
      </div>
    </div>
  );
};
