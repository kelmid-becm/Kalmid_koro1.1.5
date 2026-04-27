import { AppTranslations } from '../locales/translations';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Send, Mic, MicOff, VolumeX, Hourglass, AlertCircle, Calendar as CalendarIcon, Trash2, BarChart3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, CalendarEvent } from '../types';

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatHistory: ChatMessage[];
  chatQuery: string;
  setChatQuery: (val: string) => void;
  handleAskAi: (q?: string) => void;
  isAiLoading: boolean;
  effectiveOnline: boolean;
  startListening: () => void;
  isListening: boolean;
  t: AppTranslations;
  language: string;
  onClear: () => void;
  isDarkMode?: boolean;
  onOpenAnalytics?: () => void;
}

const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({ 
  isOpen, 
  onClose, 
  chatHistory, 
  chatQuery, 
  setChatQuery, 
  handleAskAi, 
  isAiLoading, 
  effectiveOnline, 
  startListening, 
  isListening, 
  t, 
  language, 
  onClear,
  isDarkMode = true,
  onOpenAnalytics
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-[400px] border rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh] transition-colors"
            style={{ backgroundColor: 'var(--color-main)', borderColor: 'var(--color-border-muted)' }}
          >
            <div className="p-4 border-b flex items-center justify-between transition-colors" dir={language === 'ar' ? 'rtl' : 'ltr'} style={{ backgroundColor: 'color-mix(in oklab, var(--color-surface), transparent 50%)', borderColor: 'var(--color-border-muted)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30 text-indigo-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold tracking-tight" style={{ color: 'var(--color-base)' }}>{t.smartChatHistory}</h3>
                  <p className="text-[10px] font-mono tracking-widest" style={{ color: 'var(--color-dim)' }}>{effectiveOnline ? t.aiConnected : t.offlineMemory}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-zinc-500 hover:text-indigo-400 rounded-full hover:bg-zinc-800/20 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div id="chat-history-container" className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              {chatHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-600 opacity-50">
                   <MessageSquare className="w-12 h-12 mb-4" />
                   <p className="font-mono text-sm uppercase">{t.noPreviousChats}</p>
                </div>
              ) : (
                chatHistory.map((msg, index) => (
                  <div key={`${msg.id}-full-${index}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-4 transition-colors ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tl-sm' : 'border rounded-tr-sm'}`} style={msg.role === 'assistant' ? { backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-muted)', color: 'var(--color-base)' } : {}}>
                       {msg.role === 'assistant' ? (
                         <div className={`prose prose-sm max-w-none ${isDarkMode ? 'prose-invert' : 'prose-zinc'}`}>
                           <ReactMarkdown>
                             {msg.content}
                           </ReactMarkdown>
                         </div>
                       ) : (
                         <p className="whitespace-pre-line text-sm leading-relaxed">{msg.content}</p>
                       )}
                       <div className="flex items-center justify-between mt-2 gap-2">
                         <span className={`text-[9px] block opacity-50 ${msg.role === 'user' ? 'text-indigo-200' : 'text-zinc-500'}`}>
                           {new Date(msg.timestamp).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {hour:'2-digit', minute:'2-digit'})}
                         </span>
                         {msg.status && msg.status !== 'sent' && (
                           <div className="flex items-center gap-1">
                             {msg.status === 'sending' && <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" />}
                             {msg.status === 'pending' && <Hourglass className="w-2.5 h-2.5 text-indigo-400 opacity-70" />}
                             {msg.status === 'error' && <AlertCircle className="w-2.5 h-2.5 text-rose-400" />}
                             <span className="text-[8px] font-mono uppercase opacity-70">{msg.status}</span>
                           </div>
                         )}
                       </div>
                    </div>
                  </div>
                ))
              )}
              {isAiLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl p-4 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tr-sm">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                       <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                       <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t transition-colors" dir={language === 'ar' ? 'rtl' : 'ltr'} style={{ backgroundColor: 'color-mix(in oklab, var(--color-surface), transparent 50%)', borderColor: 'var(--color-border-muted)' }}>
              <div className="flex items-center gap-2 relative">
                 <input
                   type="text"
                   value={chatQuery}
                   onChange={(e) => setChatQuery(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
                   placeholder={t.chatHistoryPlaceholder}
                   className="w-full theme-input px-4 py-3 placeholder:text-zinc-600 focus:outline-none transition-colors border text-sm"
                 />
                 <button 
                   disabled={isAiLoading || !chatQuery.trim()}
                   onClick={() => handleAskAi()}
                   className="absolute left-2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 transition-colors"
                 >
                   <Send className="w-4 h-4" />
                 </button>
                 {effectiveOnline ? (
                    <button 
                      onClick={startListening}
                      className={`absolute left-12 p-2 rounded-lg transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'text-zinc-500 hover:text-indigo-400'}`}
                    >
                       {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                 ) : (
                    <div className="absolute left-12 p-2">
                      <VolumeX className="w-4 h-4 text-rose-500 opacity-50" />
                    </div>
                 )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ChatHistoryModal;
