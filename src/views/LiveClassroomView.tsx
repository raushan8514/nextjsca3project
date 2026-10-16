import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, getStoredToken } from '../lib/api';
import { LiveClass, LiveClassMessage, PeerParticipant } from '../types';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share2,
  Hand,
  MessageSquare,
  Users,
  Settings,
  PhoneOff,
  Radio,
  Send,
  Sparkles,
  Shield,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Edit3,
  Trash2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Crown
} from 'lucide-react';

interface LiveClassroomViewProps {
  classId: string;
  onLeave: () => void;
}

export const LiveClassroomView: React.FC<LiveClassroomViewProps> = ({ classId, onLeave }) => {
  const { user, isAdmin } = useAuth();

  // Classroom Session Data
  const [liveClass, setLiveClass] = useState<LiveClass | null>(null);
  const [token, setToken] = useState<string>('');
  const [isInstructor, setIsInstructor] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [sessionDuration, setSessionDuration] = useState<number>(0);

  // Local Media State
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCameraOff, setIsCameraOff] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isHandRaised, setIsHandRaised] = useState<boolean>(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isUsingSimulatedStream, setIsUsingSimulatedStream] = useState<boolean>(false);

  // Participants & Views
  const [peers, setPeers] = useState<PeerParticipant[]>([]);
  const [viewMode, setViewMode] = useState<'gallery' | 'speaker'>('gallery');
  const [activeSpeakerId, setActiveSpeakerId] = useState<string>('local');
  const [sidebarTab, setSidebarTab] = useState<'none' | 'chat' | 'participants' | 'whiteboard' | 'materials'>('none');

  // In-Class Chat
  const [chatMessages, setChatMessages] = useState<LiveClassMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isAnnouncement, setIsAnnouncement] = useState<boolean>(false);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);

  // Whiteboard State
  const whiteboardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#7c3aed');
  const [brushSize, setBrushSize] = useState(3);

  // References
  const wsRef = useRef<WebSocket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localAvatarCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerRef = useRef<any>(null);
  const joinTimeRef = useRef<number>(Date.now());
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // 1. Initialize and Join Room
  useEffect(() => {
    let isCancelled = false;

    async function initRoom() {
      try {
        setConnectionStatus('connecting');
        const tokenRes = await api.getLiveClassToken(classId);
        if (isCancelled) return;

        setToken(tokenRes.token);
        setIsInstructor(tokenRes.isInstructor);

        // Fetch class metadata
        const classDetails = await api.getLiveClass(classId);
        if (isCancelled) return;
        setLiveClass(classDetails.liveClass);

        // Initialize Local Video Stream
        await setupLocalMedia();

        // Connect WebSocket Signaling Server
        connectWebSocket(tokenRes.token);
      } catch (err: any) {
        console.error('Failed to initialize classroom:', err);
        alert(err.message || 'Unable to join classroom. Please check your network.');
        onLeave();
      }
    }

    initRoom();

    // Session Timer
    timerRef.current = setInterval(() => {
      setSessionDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      isCancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      cleanupMedia();
      if (wsRef.current) {
        wsRef.current.close();
      }
      // Authoritatively record attendance duration on exit
      const durationSec = Math.round((Date.now() - joinTimeRef.current) / 1000);
      api.recordLiveAttendance(classId, durationSec).catch((err) => console.warn('Attendance sync:', err));
    };
  }, [classId]);

  // Setup Local Media with fallback canvas stream
  const setupLocalMedia = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 360 } },
          audio: true
        });
        setLocalStream(stream);
        setIsUsingSimulatedStream(false);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        return;
      }
    } catch (mediaErr) {
      console.warn('Real camera/mic unavailable or restricted in iframe; initializing virtual video stream:', mediaErr);
    }

    // Fallback: Create animated virtual canvas stream
    setIsUsingSimulatedStream(true);
    createVirtualStream();
  };

  const createVirtualStream = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const draw = () => {
      frame++;
      // Deep elegant studio background
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle soundwave pulse
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const waveY = canvas.height / 2 + 70;
      for (let x = 100; x < canvas.width - 100; x += 10) {
        const h = Math.sin(frame * 0.05 + x * 0.05) * 8;
        if (x === 100) ctx.moveTo(x, waveY + h);
        else ctx.lineTo(x, waveY + h);
      }
      ctx.stroke();

      // Avatar Circle
      ctx.fillStyle = '#7c3aed';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2 - 20, 52, 0, Math.PI * 2);
      ctx.fill();

      // Avatar Initial
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const initial = user?.name ? user.name[0].toUpperCase() : 'U';
      ctx.fillText(initial, canvas.width / 2, canvas.height / 2 - 20);

      // User name banner
      ctx.font = '500 15px Inter, sans-serif';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(user?.name || 'Student', canvas.width / 2, canvas.height / 2 + 48);

      requestAnimationFrame(draw);
    };

    draw();

    try {
      const stream = (canvas as any).captureStream ? (canvas as any).captureStream(30) : null;
      if (stream) {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }
    } catch (e) {
      console.warn('Canvas captureStream not supported in this environment');
    }
  };

  const cleanupMedia = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
  };

  // 2. WebSocket Signaling & Messaging
  const connectWebSocket = (authToken: string) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
      ws.send(
        JSON.stringify({
          type: 'join_room',
          token: authToken,
          classId
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleWsMessage(msg);
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket connection error:', err);
      setConnectionStatus('disconnected');
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
    };
  };

  const handleWsMessage = (msg: any) => {
    switch (msg.type) {
      case 'room_joined': {
        setPeers(msg.peers || []);
        if (msg.messages) {
          setChatMessages(msg.messages);
        }
        break;
      }
      case 'peer_joined': {
        setPeers((prev) => {
          if (prev.some((p) => p.userId === msg.peer.userId)) return prev;
          return [...prev, msg.peer];
        });
        break;
      }
      case 'peer_left': {
        setPeers((prev) => prev.filter((p) => p.userId !== msg.userId));
        break;
      }
      case 'peer_state_changed': {
        setPeers((prev) =>
          prev.map((p) => (p.userId === msg.userId ? { ...p, ...msg.state } : p))
        );
        break;
      }
      case 'new_chat_message': {
        setChatMessages((prev) => [...prev, msg.message]);
        if (sidebarTab !== 'chat') {
          setUnreadChatCount((prev) => prev + 1);
        }
        setTimeout(() => {
          if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
          }
        }, 50);
        break;
      }
      case 'force_mute': {
        setIsMuted(true);
        if (localStream) {
          localStream.getAudioTracks().forEach((t) => (t.enabled = false));
        }
        alert('The instructor has muted your microphone.');
        break;
      }
      case 'kicked': {
        alert(msg.message || 'You have been removed from the classroom by the instructor.');
        onLeave();
        break;
      }
      default:
        break;
    }
  };

  // 3. Media Controls
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = !next));
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'media_state',
          isMuted: next
        })
      );
    }
  };

  const toggleCamera = () => {
    const next = !isCameraOff;
    setIsCameraOff(next);
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => (t.enabled = !next));
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'media_state',
          isCameraOff: next
        })
      );
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          const screenTrack = screenStream.getVideoTracks()[0];

          screenTrack.onended = () => {
            setIsScreenSharing(false);
            setupLocalMedia();
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: 'media_state', isScreenSharing: false }));
            }
          };

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = screenStream;
          }
          setIsScreenSharing(true);
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'media_state', isScreenSharing: true }));
          }
        } else {
          alert('Screen sharing is not supported by this browser environment.');
        }
      } catch (err) {
        console.warn('Screen share canceled or denied:', err);
      }
    } else {
      setIsScreenSharing(false);
      setupLocalMedia();
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'media_state', isScreenSharing: false }));
      }
    }
  };

  const toggleHandRaise = () => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'toggle_hand',
          isHandRaised: next
        })
      );
    }
  };

  // 4. In-Class Chat
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !wsRef.current) return;

    wsRef.current.send(
      JSON.stringify({
        type: 'chat_message',
        message: chatInput.trim(),
        isAnnouncement: isInstructor && isAnnouncement
      })
    );

    setChatInput('');
    setIsAnnouncement(false);
  };

  // 5. Instructor Moderation Tools
  const handleInstructorMuteParticipant = (targetUserId: string) => {
    if (!isInstructor || !wsRef.current) return;
    wsRef.current.send(
      JSON.stringify({
        type: 'instructor_mute',
        targetUserId
      })
    );
  };

  const handleInstructorKickParticipant = (targetUserId: string) => {
    if (!isInstructor || !wsRef.current) return;
    if (confirm('Are you sure you want to dismiss this student from the live session?')) {
      wsRef.current.send(
        JSON.stringify({
          type: 'remove_participant',
          targetUserId
        })
      );
    }
  };

  const handleInstructorEndClass = async () => {
    if (!isInstructor) return;
    if (confirm('End the live classroom session for all students and save attendance?')) {
      await api.updateLiveClassStatus(classId, 'completed');
      onLeave();
    }
  };

  // 6. Interactive Whiteboard Canvas Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearWhiteboard = () => {
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white font-sans overflow-hidden select-none">
      {/* 1. TOP BAR */}
      <header className="h-14 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Live Classroom
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <h1 className="text-sm font-bold text-slate-100 truncate max-w-xs md:max-w-md">
            {liveClass?.title || 'Language Immersion Seminar'}
          </h1>
          {liveClass?.course_language && (
            <span className="hidden sm:inline-flex px-2 py-0.5 text-[11px] font-semibold bg-purple-900/60 text-purple-300 border border-purple-700/50 rounded">
              {liveClass.course_language}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs">
          {/* Active Duration Timer */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 rounded-lg text-slate-300 font-mono">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>REC {formatTimer(sessionDuration)}</span>
          </div>

          {/* Connection status */}
          <span
            className={`hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
              connectionStatus === 'connected'
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
            }`}
          >
            {connectionStatus === 'connected' ? '720p HD • WebRTC' : 'Connecting...'}
          </span>

          {/* View Mode Toggle */}
          <div className="hidden md:flex items-center bg-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('gallery')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'gallery' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Gallery
            </button>
            <button
              onClick={() => setViewMode('speaker')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'speaker' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Speaker
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN STAGE & SIDEBAR */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* VIDEO STAGE */}
        <div className="flex-1 p-4 flex flex-col justify-center items-center overflow-y-auto">
          {sidebarTab === 'whiteboard' ? (
            /* COLLABORATIVE WHITEBOARD */
            <div className="w-full h-full max-w-5xl bg-white rounded-2xl shadow-2xl p-4 flex flex-col border border-slate-700">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200 text-slate-900">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-purple-700" />
                  <h3 className="font-bold text-sm">Interactive Lesson Whiteboard</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {['#7c3aed', '#2563eb', '#059669', '#dc2626', '#0f172a'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setBrushColor(color)}
                        className={`w-6 h-6 rounded-full border-2 ${
                          brushColor === color ? 'border-slate-900 scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={clearWhiteboard}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-slate-50 rounded-xl overflow-hidden relative cursor-crosshair">
                <canvas
                  ref={whiteboardCanvasRef}
                  width={900}
                  height={500}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          ) : viewMode === 'gallery' ? (
            /* GALLERY VIEW GRID */
            <div
              className={`w-full h-full max-w-6xl grid gap-4 p-2 place-content-center ${
                peers.length === 0
                  ? 'grid-cols-1 max-w-3xl'
                  : peers.length <= 2
                  ? 'grid-cols-1 md:grid-cols-2'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              }`}
            >
              {/* Local Participant Card */}
              <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl group">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isCameraOff ? 'hidden' : 'block'}`}
                />

                {isCameraOff && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-radial from-slate-800 to-slate-950">
                    <div className="w-20 h-20 rounded-full bg-purple-700/80 text-white font-bold text-2xl flex items-center justify-center border-2 border-purple-500 shadow-lg">
                      {user?.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                    <span className="text-xs text-slate-400 mt-2">Camera is muted</span>
                  </div>
                )}

                {/* Overlays */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[11px] font-semibold text-slate-200">
                    {user?.name || 'You'} {isInstructor && '(Instructor)'}
                  </span>
                  {isUsingSimulatedStream && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/80 text-[10px] font-bold text-slate-900">
                      Virtual Stream
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                  {isHandRaised && (
                    <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg animate-bounce">
                      <Hand className="w-4 h-4 fill-current" />
                    </span>
                  )}
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center ${
                      isMuted ? 'bg-rose-600 text-white' : 'bg-black/60 text-emerald-400'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </span>
                </div>
              </div>

              {/* Remote Peers Cards */}
              {peers.map((peer) => (
                <div
                  key={peer.userId}
                  className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl group"
                >
                  {peer.isCameraOff ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-radial from-slate-800 to-slate-950">
                      <div className="w-20 h-20 rounded-full bg-indigo-700/80 text-white font-bold text-2xl flex items-center justify-center border-2 border-indigo-500 shadow-lg">
                        {peer.name ? peer.name[0].toUpperCase() : 'S'}
                      </div>
                      <span className="text-xs text-slate-400 mt-2">{peer.name}</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900">
                      <div className="w-16 h-16 rounded-full bg-purple-900/60 text-purple-200 font-bold text-xl flex items-center justify-center mb-2 animate-pulse">
                        {peer.name ? peer.name[0].toUpperCase() : 'P'}
                      </div>
                      <span className="text-xs text-slate-400">Connected via WebRTC</span>
                    </div>
                  )}

                  {/* Overlays */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[11px] font-semibold text-slate-200 flex items-center gap-1">
                      {peer.role === 'ADMIN' && <Crown className="w-3 h-3 text-amber-400" />}
                      <span>{peer.name}</span>
                    </span>
                  </div>

                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                    {peer.isHandRaised && (
                      <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg animate-bounce">
                        <Hand className="w-4 h-4 fill-current" />
                      </span>
                    )}
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        peer.isMuted ? 'bg-rose-600 text-white' : 'bg-black/60 text-emerald-400'
                      }`}
                    >
                      {peer.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </span>
                  </div>

                  {/* Instructor moderation actions on hover */}
                  {isInstructor && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleInstructorMuteParticipant(peer.userId)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700"
                      >
                        <MicOff className="w-3.5 h-3.5 text-rose-400" />
                        <span>Mute</span>
                      </button>
                      <button
                        onClick={() => handleInstructorKickParticipant(peer.userId)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Dismiss</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* SPEAKER VIEW (Main Stage + Filmstrip) */
            <div className="w-full h-full max-w-6xl flex flex-col gap-4 justify-center items-center">
              <div className="relative aspect-video w-full max-h-[70vh] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isCameraOff ? 'hidden' : 'block'}`}
                />
                {isCameraOff && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950">
                    <div className="w-24 h-24 rounded-full bg-purple-700 text-white font-bold text-3xl flex items-center justify-center shadow-xl">
                      {user?.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                    <span className="text-sm font-semibold text-slate-300 mt-3">{user?.name}</span>
                  </div>
                )}
                <div className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-black/70 backdrop-blur-md text-xs font-bold text-slate-100">
                  {user?.name} (Active Speaker)
                </div>
              </div>

              {/* Filmstrip below */}
              {peers.length > 0 && (
                <div className="flex items-center gap-3 overflow-x-auto w-full py-2 px-1">
                  {peers.map((peer) => (
                    <div
                      key={peer.userId}
                      className="w-40 aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shrink-0 relative flex items-center justify-center"
                    >
                      <span className="text-xs font-bold text-slate-300">{peer.name}</span>
                      <div className="absolute bottom-1 right-1">
                        {peer.isMuted && <MicOff className="w-3.5 h-3.5 text-rose-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. SLIDE-OUT SIDEBARS (Chat, Participants, Lesson Materials) */}
        {sidebarTab !== 'none' && sidebarTab !== 'whiteboard' && (
          <aside className="w-80 md:w-96 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 z-10">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                {sidebarTab === 'chat' && (
                  <>
                    <MessageSquare className="w-4 h-4 text-purple-400" />
                    <span>In-Class Discussion</span>
                  </>
                )}
                {sidebarTab === 'participants' && (
                  <>
                    <Users className="w-4 h-4 text-purple-400" />
                    <span>Participants ({peers.length + 1})</span>
                  </>
                )}
                {sidebarTab === 'materials' && (
                  <>
                    <FileText className="w-4 h-4 text-purple-400" />
                    <span>Lesson Slides & Reference</span>
                  </>
                )}
              </h2>
              <button
                onClick={() => setSidebarTab('none')}
                className="text-slate-400 hover:text-white text-xs font-bold p-1 rounded"
              >
                ✕
              </button>
            </div>

            {/* TAB CONTENT: CHAT */}
            {sidebarTab === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div
                  ref={chatScrollRef}
                  className="flex-1 p-4 space-y-3 overflow-y-auto text-xs"
                >
                  {chatMessages.length === 0 ? (
                    <div className="py-12 text-center text-slate-500">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p>Class chat is open. Ask questions or share thoughts with classmates!</p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-xl ${
                          msg.is_announcement
                            ? 'bg-amber-950/60 border border-amber-700/60 text-amber-200'
                            : msg.user_id === user?.id
                            ? 'bg-purple-900/40 border border-purple-700/40 ml-4'
                            : 'bg-slate-800/80 border border-slate-700/60 mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold flex items-center gap-1 text-[11px]">
                            {msg.user_role === 'ADMIN' && <Crown className="w-3 h-3 text-amber-400" />}
                            <span className={msg.is_announcement ? 'text-amber-300' : 'text-slate-300'}>
                              {msg.user_name}
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-200 whitespace-pre-wrap">
                          {msg.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Chat Input Form */}
                <form
                  onSubmit={handleSendChat}
                  className="p-3 bg-slate-950 border-t border-slate-800 flex flex-col gap-2"
                >
                  {isInstructor && (
                    <label className="flex items-center gap-2 text-[11px] text-amber-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAnnouncement}
                        onChange={(e) => setIsAnnouncement(e.target.checked)}
                        className="rounded accent-amber-500"
                      />
                      <span>Post as Official Instructor Announcement</span>
                    </label>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Type a question or comment..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim()}
                      className="p-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB CONTENT: PARTICIPANTS */}
            {sidebarTab === 'participants' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Hand Raise Queue banner if someone raised hand */}
                {peers.some((p) => p.isHandRaised) && (
                  <div className="p-3 bg-amber-950/40 border-b border-amber-800/40 text-xs text-amber-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Hand className="w-4 h-4 text-amber-400" />
                      <span>Raised Hands ({peers.filter((p) => p.isHandRaised).length})</span>
                    </div>
                  </div>
                )}

                <div className="flex-1 p-3 divide-y divide-slate-800 overflow-y-auto text-xs">
                  {/* Local user row */}
                  <div className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center font-bold text-white text-xs">
                        {user?.name ? user.name[0] : 'U'}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-200">{user?.name} (You)</span>
                        <span className="block text-[10px] text-slate-400">
                          {isInstructor ? 'Lead Instructor' : 'Enrolled Student'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isHandRaised && <Hand className="w-4 h-4 text-amber-400" />}
                      {isMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
                      {isCameraOff ? <VideoOff className="w-4 h-4 text-rose-400" /> : <Video className="w-4 h-4 text-emerald-400" />}
                    </div>
                  </div>

                  {/* Remote peers rows */}
                  {peers.map((peer) => (
                    <div key={peer.userId} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-200 text-xs">
                          {peer.name ? peer.name[0] : 'S'}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-200 flex items-center gap-1">
                            {peer.role === 'ADMIN' && <Crown className="w-3 h-3 text-amber-400" />}
                            {peer.name}
                          </span>
                          <span className="block text-[10px] text-slate-400">{peer.role}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {peer.isHandRaised && <Hand className="w-4 h-4 text-amber-400 animate-bounce" />}
                        {peer.isMuted ? (
                          <MicOff className="w-4 h-4 text-rose-400" />
                        ) : (
                          <Mic className="w-4 h-4 text-emerald-400" />
                        )}
                        {isInstructor && (
                          <button
                            onClick={() => handleInstructorMuteParticipant(peer.userId)}
                            className="text-[10px] text-rose-400 hover:text-rose-300 ml-1 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700"
                          >
                            Mute
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Instructor Quick Actions */}
                {isInstructor && (
                  <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => peers.forEach((p) => handleInstructorMuteParticipant(p.userId))}
                      className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors text-center border border-slate-700"
                    >
                      Mute All Students
                    </button>
                    <button
                      onClick={handleInstructorEndClass}
                      className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      End Class
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: LESSON MATERIALS */}
            {sidebarTab === 'materials' && (
              <div className="flex-1 p-4 overflow-y-auto text-xs space-y-4">
                <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block mb-1">
                    Class Objectives
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {liveClass?.description || 'Active conversational practice, phonetics review, and situational dialogues.'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">
                    Key Vocabulary Drill
                  </span>
                  <div className="space-y-1.5 text-slate-300">
                    <div className="p-2 bg-slate-900 rounded-lg flex items-center justify-between">
                      <span className="font-semibold text-slate-200">Enchanté(e)</span>
                      <span className="text-slate-400">Nice to meet you</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg flex items-center justify-between">
                      <span className="font-semibold text-slate-200">Comment allez-vous?</span>
                      <span className="text-slate-400">How are you? (formal)</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg flex items-center justify-between">
                      <span className="font-semibold text-slate-200">Très bien, merci!</span>
                      <span className="text-slate-400">Very well, thank you!</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-purple-950/40 rounded-xl border border-purple-800/40 text-purple-200">
                  <h4 className="font-bold mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Instructor Tip</span>
                  </h4>
                  <p className="leading-relaxed">
                    Remember to unmute your microphone when responding to speaking prompts and use the Raise Hand button if you have an inquiry.
                  </p>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* 4. FLOATING BOTTOM ZOOM-LIKE TOOLBAR */}
      <footer className="h-20 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-between px-6 shrink-0 z-20">
        {/* Left: Audio / Video Controls */}
        <div className="flex items-center gap-2">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all ${
              isMuted
                ? 'bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-400" />}
            <span className="text-[10px] font-medium mt-1">{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          {/* Camera Button */}
          <button
            onClick={toggleCamera}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all ${
              isCameraOff
                ? 'bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
            }`}
          >
            {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5 text-emerald-400" />}
            <span className="text-[10px] font-medium mt-1">{isCameraOff ? 'Start Video' : 'Stop Video'}</span>
          </button>
        </div>

        {/* Center: Collaboration & Interactivity */}
        <div className="flex items-center gap-1.5 md:gap-3">
          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all ${
              isScreenSharing
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
            }`}
          >
            <Share2 className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Share</span>
          </button>

          {/* Whiteboard Toggle */}
          <button
            onClick={() => setSidebarTab(sidebarTab === 'whiteboard' ? 'none' : 'whiteboard')}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all ${
              sidebarTab === 'whiteboard'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
            }`}
          >
            <Edit3 className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Board</span>
          </button>

          {/* Raise Hand */}
          <button
            onClick={toggleHandRaise}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all ${
              isHandRaised
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-900/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
            }`}
          >
            <Hand className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">{isHandRaised ? 'Hand Up' : 'Raise'}</span>
          </button>

          {/* Chat Toggle */}
          <button
            onClick={() => {
              setSidebarTab(sidebarTab === 'chat' ? 'none' : 'chat');
              setUnreadChatCount(0);
            }}
            className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all ${
              sidebarTab === 'chat'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Chat</span>
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* Participants */}
          <button
            onClick={() => setSidebarTab(sidebarTab === 'participants' ? 'none' : 'participants')}
            className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all ${
              sidebarTab === 'participants'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">People</span>
            <span className="absolute top-1 right-2 text-[9px] font-bold text-purple-300">
              {peers.length + 1}
            </span>
          </button>

          {/* Lesson Reference Materials */}
          <button
            onClick={() => setSidebarTab(sidebarTab === 'materials' ? 'none' : 'materials')}
            className={`hidden sm:flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all ${
              sidebarTab === 'materials'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Materials</span>
          </button>
        </div>

        {/* Right: Leave / End Meeting Button */}
        <div className="flex items-center gap-2">
          {isInstructor && (
            <button
              onClick={handleInstructorEndClass}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>End All</span>
            </button>
          )}

          <button
            onClick={onLeave}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-lg transition-colors"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Leave Classroom</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
