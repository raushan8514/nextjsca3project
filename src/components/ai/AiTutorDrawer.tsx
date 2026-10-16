import React, { useState } from 'react';
import { Sparkles, Send, X, Bot, User, BookOpen, MessageSquare, Compass, Shield } from 'lucide-react';
import { api } from '../../lib/api';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface AiTutorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeLanguage?: string;
}

export const AiTutorDrawer: React.FC<AiTutorDrawerProps> = ({
  isOpen,
  onClose,
  activeLanguage = 'English'
}) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      text: `Hello! I am your LingoPro AI Language Companion. Ask me to explain grammar rules, break down idioms, test your vocabulary, or generate sample sentences in ${activeLanguage}.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (customPrompt?: string) => {
    const promptToSend = customPrompt || input;
    if (!promptToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setIsLoading(true);

    try {
      const res = await api.askAiTutor({
        prompt: promptToSend,
        contextLanguage: activeLanguage,
        mode: 'tutor'
      });

      const assistantMsg: Message = {
        id: `msg_${Date.now() + 1}`,
        sender: 'assistant',
        text: res.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `msg_err_${Date.now()}`,
        sender: 'assistant',
        text: 'The AI assistant is temporarily unreachable. Please verify network connectivity or check back in a moment.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    `Explain the difference between 'ser' and 'estar' in Spanish`,
    `How do I formulate polite meeting objections in English?`,
    `Provide 3 examples using the German modal verb 'müssen'`,
    `Explain the French passé composé vs imparfait rule`
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white shadow-2xl border-l border-slate-200 flex flex-col">
      {/* Header */}
      <div className="p-4 bg-purple-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-700 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold leading-tight">LingoPro AI Companion</h3>
            <p className="text-[10px] text-purple-200">Powered by Gemini 3.8 Flash</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-purple-200 hover:text-white rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Prompts Carousel */}
      <div className="p-3 bg-purple-50/60 border-b border-purple-100 flex gap-1.5 overflow-x-auto text-[11px]">
        {quickPrompts.slice(0, 2).map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSend(qp)}
            className="whitespace-nowrap px-2.5 py-1 bg-white hover:bg-purple-100 border border-purple-200 rounded-md text-purple-900 transition-colors shrink-0"
          >
            {qp.slice(0, 30)}...
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-purple-700 text-white rounded-br-none'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs whitespace-pre-line'
              }`}
            >
              {m.text}
            </div>
            <span className="text-[9px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-50 p-3 rounded-xl border border-purple-100 max-w-[85%]">
            <div className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <span>AI Tutor analyzing response...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask a grammar, vocab, or phrase question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-600"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 bg-purple-700 text-white rounded-xl hover:bg-purple-800 disabled:opacity-40 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-slate-400 mt-2 text-center">
          Educational guidance only; formal certifications require proctored exams.
        </p>
      </div>
    </div>
  );
};
