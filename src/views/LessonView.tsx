import React, { useState, useEffect } from 'react';
import { Lesson, LessonActivity, ModalityType } from '../types';
import { api } from '../lib/api';
import { ReadingExercise } from '../components/modalities/ReadingExercise';
import { ListeningExercise } from '../components/modalities/ListeningExercise';
import { VideoExercise } from '../components/modalities/VideoExercise';
import { SpeakingExercise } from '../components/modalities/SpeakingExercise';
import { WritingExercise } from '../components/modalities/WritingExercise';
import { GrammarVocabExercise } from '../components/modalities/GrammarVocabExercise';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  Headphones,
  Video,
  Mic,
  PenTool,
  Layers,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Award
} from 'lucide-react';

interface LessonViewProps {
  lessonId: string;
  onBack: () => void;
  onLessonCompleted?: () => void;
  onSelectCourse?: (courseId: string) => void;
}

export const LessonView: React.FC<LessonViewProps> = ({
  lessonId,
  onBack,
  onLessonCompleted,
  onSelectCourse
}) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [activities, setActivities] = useState<LessonActivity[]>([]);
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [courseId, setCourseId] = useState<string>('');
  const [currentModality, setCurrentModality] = useState<ModalityType>('reading');
  const [completedModalities, setCompletedModalities] = useState<Record<string, boolean>>({});
  const [isLessonFinished, setIsLessonFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [xpEarned, setXpEarned] = useState<number>(0);

  const fetchLesson = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getLesson(lessonId);
      setLesson(data.lesson);
      setActivities(data.activities);
      setCourseTitle(data.courseTitle);
      setCourseId(data.courseId);

      if (data.progress && data.progress.status === 'completed') {
        setIsLessonFinished(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load lesson');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLesson();
  }, [lessonId]);

  const handleModalityComplete = async (modality: ModalityType) => {
    setCompletedModalities((prev) => ({ ...prev, [modality]: true }));

    // Check if all modalities are completed or this completes the lesson
    const modalityList: ModalityType[] = ['reading', 'listening', 'video', 'speaking', 'writing', 'grammar_vocab'];
    const nextIdx = modalityList.indexOf(modality) + 1;

    if (nextIdx < modalityList.length) {
      setCurrentModality(modalityList[nextIdx]);
    } else {
      // Final modality complete -> record lesson completion on server
      try {
        const res = await api.completeLesson(lessonId);
        setXpEarned(res.xpAwarded || 25);
        setIsLessonFinished(true);
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 }
        });
        if (onLessonCompleted) onLessonCompleted();
      } catch (err: any) {
        console.error('Failed to sync lesson progress:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">Loading interactive 6-modality lesson...</p>
      </div>
    );
  }

  if (errorMsg || !lesson) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-sm font-semibold text-slate-800 mb-2">Access Notice</p>
        <p className="text-xs text-slate-500 mb-6">{errorMsg || 'Lesson not found'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
        >
          Return to Course
        </button>
      </div>
    );
  }

  const modalitiesConfig = [
    { type: 'reading' as ModalityType, label: 'Reading', icon: BookOpen },
    { type: 'listening' as ModalityType, label: 'Listening', icon: Headphones },
    { type: 'video' as ModalityType, label: 'Video', icon: Video },
    { type: 'speaking' as ModalityType, label: 'Speaking', icon: Mic },
    { type: 'writing' as ModalityType, label: 'Writing', icon: PenTool },
    { type: 'grammar_vocab' as ModalityType, label: 'Grammar', icon: Layers }
  ];

  // Find current activity for the selected modality
  const currentActivity = activities.find((a) => a.modality === currentModality);
  const fallbackContent = {
    passage: "Mastering practical language patterns requires immersive, focused repetition in authentic scenarios.",
    audioScript: "Welcome to this listening comprehension module. Focus on fluid intonation.",
    summary: "Visual demonstration of cultural conversational norms.",
    targetPhrase: "I am learning with LingoPro.",
    rule: "Consistency in grammatical agreement.",
    examples: [{ en: "Sample sentence", es: "Oración de ejemplo" }]
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-purple-700 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{courseTitle || 'Back to Course'}</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {lesson.title}
          </h1>
        </div>

        {isLessonFinished && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
            <span>Lesson Completed · +{xpEarned || 25} XP Awarded</span>
          </div>
        )}
      </div>

      {/* Modality Selector Bar */}
      <div className="flex items-center gap-1 overflow-x-auto p-1.5 bg-slate-100 rounded-xl">
        {modalitiesConfig.map((mod) => {
          const Icon = mod.icon;
          const isActive = currentModality === mod.type;
          const isDone = completedModalities[mod.type];
          return (
            <button
              key={mod.type}
              onClick={() => setCurrentModality(mod.type)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                isActive
                  ? 'bg-white text-purple-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-purple-700' : 'text-slate-500'}`} />
              <span>{mod.label}</span>
              {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-600 ml-0.5" />}
            </button>
          );
        })}
      </div>

      {/* Active Modality Workspace */}
      <div className="pt-2">
        {currentModality === 'reading' && (
          <ReadingExercise
            content={currentActivity?.content || fallbackContent}
            onComplete={() => handleModalityComplete('reading')}
            isCompleted={completedModalities['reading']}
          />
        )}

        {currentModality === 'listening' && (
          <ListeningExercise
            content={currentActivity?.content || fallbackContent}
            onComplete={() => handleModalityComplete('listening')}
            isCompleted={completedModalities['listening']}
          />
        )}

        {currentModality === 'video' && (
          <VideoExercise
            content={currentActivity?.content || fallbackContent}
            onComplete={() => handleModalityComplete('video')}
            isCompleted={completedModalities['video']}
          />
        )}

        {currentModality === 'speaking' && (
          <SpeakingExercise
            lessonId={lesson.id}
            content={currentActivity?.content || fallbackContent}
            onComplete={() => handleModalityComplete('speaking')}
            isCompleted={completedModalities['speaking']}
          />
        )}

        {currentModality === 'writing' && (
          <WritingExercise
            lessonId={lesson.id}
            content={currentActivity?.content || fallbackContent}
            onComplete={() => handleModalityComplete('writing')}
            isCompleted={completedModalities['writing']}
          />
        )}

        {currentModality === 'grammar_vocab' && (
          <GrammarVocabExercise
            content={currentActivity?.content || fallbackContent}
            onComplete={() => handleModalityComplete('grammar_vocab')}
            isCompleted={completedModalities['grammar_vocab']}
          />
        )}
      </div>

      {/* Lesson Complete Banner */}
      {isLessonFinished && (
        <div className="p-6 bg-purple-50/70 border border-purple-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-700 text-white flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Great Work! Lesson Accomplished</h4>
              <p className="text-xs text-slate-500">All modalities completed and progress stored on server.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="px-4 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Back to Syllabus
            </button>
            {onSelectCourse && (
              <button
                onClick={() => onSelectCourse(courseId)}
                className="px-4 py-2 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-lg transition-colors shadow-sm"
              >
                Next Lesson →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
