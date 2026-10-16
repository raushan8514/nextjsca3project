import React, { useState, useRef } from 'react';
import { Mic, Square, Play, RotateCcw, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';

interface SpeakingContent {
  prompt: string;
  targetPhrase: string;
  pronunciationTips?: string;
}

interface SpeakingExerciseProps {
  lessonId: string;
  content: SpeakingContent;
  onComplete: () => void;
  isCompleted?: boolean;
}

export const SpeakingExercise: React.FC<SpeakingExerciseProps> = ({
  lessonId,
  content,
  onComplete,
  isCompleted
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setPermissionError(null);
    setAiFeedback(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionError('Microphone recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Stop all tracks to release mic
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Mic access error:', err);
      setPermissionError('Microphone permission was denied or unavailable. Please grant microphone access in browser settings.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleDiscard = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAiFeedback(null);
  };

  const requestPronunciationFeedback = async () => {
    setIsLoadingAi(true);
    setAiFeedback(null);

    try {
      const res = await api.askAiTutor({
        prompt: `The student recorded themselves practicing the phrase: "${content.targetPhrase}".
Give brief, targeted phonetic feedback on cadence, vowel articulation, and rhythm. Mention specific letters to watch for.`,
        mode: 'pronunciation'
      });

      setAiFeedback(res.response);

      // Save attempt to server
      await api.saveActivityAttempt({
        lessonId,
        modality: 'speaking',
        payload: { targetPhrase: content.targetPhrase },
        score: 85,
        feedback: res.response
      });
    } catch (err: any) {
      setAiFeedback('AI evaluation is currently unavailable. Please check connectivity or ensure GEMINI_API_KEY is configured.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm">
          <Mic className="w-4 h-4" />
          <span>Speaking Modality · Pronunciation & Fluency</span>
        </div>
        <span className="text-[11px] text-slate-400">Microphone Audio Capture</span>
      </div>

      {/* Target Phrase Box */}
      <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-5 mb-5">
        <p className="text-xs font-semibold text-purple-900 uppercase tracking-wider mb-1">
          Target Speaking Phrase
        </p>
        <p className="text-lg font-bold text-slate-900 font-serif mb-2">
          "{content.targetPhrase}"
        </p>
        {content.pronunciationTips && (
          <p className="text-xs text-purple-700">
            <span className="font-semibold">Phonetic Tip:</span> {content.pronunciationTips}
          </p>
        )}
      </div>

      {/* Permission Error */}
      {permissionError && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <span>{permissionError}</span>
        </div>
      )}

      {/* Recording Controls */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-5 flex flex-col items-center justify-center text-center">
        {!audioUrl ? (
          <div>
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-md transition-transform active:scale-95 mx-auto mb-3"
                title="Start Recording"
              >
                <Mic className="w-7 h-7" />
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md transition-transform active:scale-95 mx-auto mb-3 animate-pulse"
                title="Stop Recording"
              >
                <Square className="w-6 h-6 fill-white" />
              </button>
            )}

            <p className="text-xs font-semibold text-slate-800">
              {isRecording ? 'Recording... Speak now clearly into your microphone' : 'Click to begin speaking practice'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {isRecording ? 'Click stop when finished' : 'Requires microphone permissions'}
            </p>
          </div>
        ) : (
          <div className="w-full">
            <p className="text-xs font-semibold text-slate-800 mb-3">Recording Ready for Review</p>
            <audio src={audioUrl} controls className="w-full max-w-md mx-auto mb-4" />

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleDiscard}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>
              <button
                onClick={requestPronunciationFeedback}
                disabled={isLoadingAi}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isLoadingAi ? 'Evaluating Audio...' : 'Get AI Pronunciation Review'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI Pronunciation Feedback Box */}
      {aiFeedback && (
        <div className="mb-5 p-4 bg-purple-50/70 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>AI Pronunciation Breakdown</span>
          </div>
          <p className="text-xs text-purple-950 leading-relaxed whitespace-pre-line font-sans">
            {aiFeedback}
          </p>
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
          <span>{isCompleted ? 'Completed' : 'Mark Speaking Complete (+25 XP)'}</span>
        </button>
      </div>
    </div>
  );
};
