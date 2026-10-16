import React, { useRef, useState } from 'react';
import { Video, Clock, CheckCircle2 } from 'lucide-react';

interface VideoContent {
  videoUrl?: string;
  summary: string;
  timestamps?: Array<{ time: string; note: string }>;
}

interface VideoExerciseProps {
  content: VideoContent;
  onComplete: () => void;
  isCompleted?: boolean;
}

export const VideoExercise: React.FC<VideoExerciseProps> = ({ content, onComplete, isCompleted }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [activeNote, setActiveNote] = useState<string | null>(null);

  const handleSeek = (timeStr: string) => {
    if (!videoRef.current) return;
    const parts = timeStr.split(':');
    const seconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    videoRef.current.currentTime = seconds;
    videoRef.current.play();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm">
          <Video className="w-4 h-4" />
          <span>Video Modality · Visual Lecture & Culture</span>
        </div>
        <span className="text-[11px] text-slate-400">Synchronized Cultural Lecture</span>
      </div>

      {/* Video Container */}
      <div className="mb-5 overflow-hidden rounded-xl bg-black aspect-video relative border border-slate-800">
        <video
          ref={videoRef}
          controls
          className="w-full h-full object-contain"
          src={content.videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4'}
        >
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Video Summary */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-5">
        <h4 className="text-xs font-semibold text-slate-800 mb-1">Lecture Overview</h4>
        <p className="text-xs text-slate-600 leading-relaxed">{content.summary}</p>
      </div>

      {/* Timestamps */}
      {content.timestamps && content.timestamps.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Timestamped Key Insights
          </h4>
          <div className="space-y-2">
            {content.timestamps.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-slate-800">{item.note}</span>
                </div>
                <button
                  onClick={() => handleSeek(item.time)}
                  className="px-2 py-1 bg-slate-100 hover:bg-purple-100 text-purple-700 font-mono text-[11px] rounded transition-colors"
                >
                  {item.time}
                </button>
              </div>
            ))}
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
          <span>{isCompleted ? 'Completed' : 'Mark Video Complete (+25 XP)'}</span>
        </button>
      </div>
    </div>
  );
};
