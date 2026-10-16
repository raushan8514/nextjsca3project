import React, { useState, useEffect, useRef } from 'react';
import { Headphones, Play, Pause, RotateCcw, FileText, CheckCircle2 } from 'lucide-react';

interface ListeningContent {
  audioScript: string;
  playbackUrl?: string;
  speedOptions?: number[];
  transcript?: string;
  checkQuestion?: string;
  checkOptions?: string[];
  correctOption?: string;
}

interface ListeningExerciseProps {
  content: ListeningContent;
  onComplete: () => void;
  isCompleted?: boolean;
}

export const ListeningExercise: React.FC<ListeningExerciseProps> = ({ content, onComplete, isCompleted }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlay = () => {
    if (!window.speechSynthesis) {
      alert('Speech synthesis is not supported on this device/browser.');
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(content.audioScript);
    utterance.rate = playbackSpeed;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    utteranceRef.current = utterance;

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handleReplay = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setTimeout(() => {
      handlePlay();
    }, 100);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (isPlaying && utteranceRef.current) {
      handleReplay();
    }
  };

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    if (content.correctOption) {
      if (option === content.correctOption) {
        setFeedback('Correct! You understood the key audio detail.');
      } else {
        setFeedback(`Incorrect. The correct answer was "${content.correctOption}". Listen again.`);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm">
          <Headphones className="w-4 h-4" />
          <span>Listening Modality · Aural Comprehension</span>
        </div>
        <span className="text-[11px] text-slate-400">
          Browser Speech Synthesis Engine (Aural Fallback)
        </span>
      </div>

      {/* Audio Player Controls */}
      <div className="bg-slate-900 text-white rounded-xl p-6 mb-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlay}
              className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition-transform active:scale-95 shadow-md"
              title={isPlaying ? 'Pause Audio' : 'Play Audio'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
            </button>
            <button
              onClick={handleReplay}
              className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Replay from start"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <div className="text-xs">
              <p className="font-semibold text-slate-200">
                {isPlaying ? 'Playing Audio Passage...' : 'Ready to Listen'}
              </p>
              <p className="text-[11px] text-slate-400">Paced for active listening comprehension</p>
            </div>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-800 rounded-lg">
            {[0.75, 1.0, 1.25].map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  playbackSpeed === speed
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Audio Waveform visualization */}
        <div className="mt-4 flex items-center justify-center gap-1 h-6">
          {[40, 70, 30, 90, 60, 45, 80, 25, 60, 100, 50, 75, 30, 85, 40].map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-200 ${
                isPlaying ? 'bg-purple-400 animate-pulse' : 'bg-slate-700'
              }`}
              style={{ height: isPlaying ? `${h}%` : '20%' }}
            />
          ))}
        </div>
      </div>

      {/* Transcript Toggler */}
      <div className="mb-6">
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-purple-700 transition-colors mb-2"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{showTranscript ? 'Hide Written Transcript' : 'Reveal Written Transcript'}</span>
        </button>

        {showTranscript && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-700 font-mono whitespace-pre-wrap">
            {content.transcript || content.audioScript}
          </div>
        )}
      </div>

      {/* Comprehension Question */}
      {content.checkQuestion && content.checkOptions && (
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs font-semibold text-slate-800 mb-3">{content.checkQuestion}</p>
          <div className="space-y-2">
            {content.checkOptions.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleOptionSelect(opt)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition-colors ${
                  selectedOption === opt
                    ? 'bg-purple-50 border-purple-500 font-semibold text-purple-900'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {feedback && (
            <p className={`mt-3 text-xs font-medium ${feedback.startsWith('Correct') ? 'text-emerald-700' : 'text-amber-700'}`}>
              {feedback}
            </p>
          )}
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
          <span>{isCompleted ? 'Completed' : 'Mark Listening Complete (+25 XP)'}</span>
        </button>
      </div>
    </div>
  );
};
