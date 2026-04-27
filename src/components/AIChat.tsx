import { AppTranslations } from '../locales/translations';
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Sparkles, Mic, MicOff, Calendar as CalendarIcon, Clock, Activity, Target, MessageSquare, ChevronDown, ChevronUp, Bot, Layout, BrainCircuit, X, Sunrise, Zap, Volume2, VolumeX } from 'lucide-react';
import { ChatMessage } from '../types';
import { motion, AnimatePresence, useDragControls, useAnimation } from 'motion/react';
import { speechService } from '../services/speechService';

interface AIChatProps {
  t: AppTranslations;
  aiResponse: string | null;
  chatQuery: string;
  setChatQuery: (q: string) => void;
  handleAskAi: (q?: string) => void;
  isAiLoading: boolean;
  startListening: () => void;
  isListening: boolean;
  effectiveOnline: boolean;
  language: string;
  isFullPage?: boolean;
  voiceMode: boolean;
  toggleVoiceMode: () => void;
  isSpeaking: boolean;
  activeRoom?: 'assistant' | 'planner';
  onRoomChange?: (room: 'assistant' | 'planner') => void;
}

export const AIChat: React.FC<AIChatProps> = ({ 
  t, aiResponse, chatQuery, setChatQuery, 
  handleAskAi, isAiLoading, startListening, 
  isListening, effectiveOnline, language,
  isFullPage = false,
  voiceMode,
  toggleVoiceMode,
  isSpeaking,
  activeRoom: forcedRoom,
  onRoomChange
}) => {
  const [isOpen, setIsOpen] = useState(isFullPage);
  const [isMaximized, setIsMaximized] = useState(isFullPage);
  const [activeRoom, setActiveRoom] = useState<'assistant' | 'planner'>(forcedRoom || 'assistant');

  useEffect(() => {
    if (forcedRoom) {
      setActiveRoom(forcedRoom);
      if (!isOpen && !isFullPage) setIsOpen(true);
    }
  }, [forcedRoom]);

  const handleRoomChange = (room: 'assistant' | 'planner') => {
    setActiveRoom(room);
    if (onRoomChange) onRoomChange(room);
  };
  const [isDocked, setIsDocked] = useState(false);
  const [dockSide, setDockSide] = useState<'right' | 'left'>('right');
  const [apiStatus, setApiStatus] = useState<'ok' | 'error' | 'loading'>('loading');
  const dragControls = useDragControls();
  const buttonControls = useAnimation();
  const constraintsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    buttonControls.start({ x: 0, y: 0, opacity: 1, scale: 1 });
  }, []);

  const handleButtonDragEnd = (_: any, info: any) => {
    if (isMaximized || isFullPage) return;
    
    const screenWidth = window.innerWidth;
    const threshold = screenWidth / 2;
    
    if (info.point.x < threshold) {
      setDockSide('left');
      // Snap to left
      buttonControls.start({ 
        x: -screenWidth + (window.innerWidth < 1024 ? 80 : 120), 
        transition: { type: 'spring', stiffness: 300, damping: 30 } 
      });
    } else {
      setDockSide('right');
      // Snap to right
      buttonControls.start({ 
        x: 0, 
        transition: { type: 'spring', stiffness: 300, damping: 30 } 
      });
    }
  };

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { API_URL } = await import('../config/api');
        const res = await fetch(`${API_URL}/api/status`);
        const data = await res.json();
        setApiStatus(data.status);
      } catch (e) {
        setApiStatus('error');
      }
    };
    checkStatus();
  }, []);

  const toggleOpen = () => {
    if (isFullPage) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      // When opening, reset docking or apply specialized dock effect
      setIsDocked(true);
    }
  };

  const toggleMaximize = (e: React.MouseEvent) => {
    if (isFullPage) return;
    e.stopPropagation();
    setIsMaximized(!isMaximized);
  };

  const handleSend = (q?: string) => {
    const finalQuery = q || chatQuery;
    if (!finalQuery.trim()) return;
    
    if (activeRoom === 'planner') {
      handleAskAi(`[PLANNER_MODE] ${finalQuery}`);
    } else {
      handleAskAi(finalQuery);
    }
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }

    if (!isMaximized && !isOpen) setIsOpen(true);
  };

  return (
    <div ref={constraintsRef} className={isFullPage ? "w-full h-full flex flex-col pb-safe-bottom" : `fixed z-[1000] inset-0 pointer-events-none flex flex-col items-center justify-center p-4`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            drag={!isMaximized && !isFullPage}
            dragListener={false}
            dragControls={dragControls}
            dragMomentum={true}
            dragElastic={0.1}
            dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
            dragConstraints={constraintsRef}
            onDragEnd={() => setIsDocked(false)}
            initial={{ opacity: 0, scale: 0.9, y: 100 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              filter: 'blur(0px)',
              width: isFullPage ? '100%' : (isMaximized ? 'min(95dvw, 1200px)' : 'min(calc(100dvw - 48px), 420px)'),
              height: isFullPage ? '100%' : (isMaximized ? 'min(90dvh, 850px)' : (isDocked ? '550px' : 'auto')),
              maxHeight: isFullPage ? '100%' : '90dvh',
              x: (!isMaximized && !isFullPage && isDocked) ? (dockSide === 'right' ? (window.innerWidth / 2 - 200) : -(window.innerWidth / 2 - 200)) : undefined,
            }}
            exit={{ opacity: 0, scale: 0.8, y: 50, transition: { duration: 0.2 } }}
            className={`overflow-hidden rounded-[2.5rem] theme-card bg-[#0a0b14]/98 backdrop-blur-3xl border-muted p-0 shadow-[0_32px_128px_-12px_rgba(0,0,0,1)] flex flex-col border border-white/10 glass-dark pointer-events-auto ${isFullPage ? 'mb-0' : 'mb-4'}`}
            layout
          >
            {/* Header / Tabs - Only show if not full page */}
            {!isFullPage && (
              <div 
                className="flex divide-x divide-white/5 border-b border-white/5 cursor-move touch-none bg-white/[0.04] backdrop-blur-2xl"
                onPointerDown={(e) => dragControls.start(e)}
              >
                  <button 
                    onClick={() => handleRoomChange('assistant')}
                    className={`flex-1 py-5 flex flex-col items-center gap-1.5 transition-all relative ${activeRoom === 'assistant' ? 'text-primary' : 'text-dim hover:text-white'}`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-black tracking-[0.2em]">{t.aiAssistantTitle || 'Assistant'}</span>
                    {activeRoom === 'assistant' && (
                      <motion.div 
                        layoutId="activeTab" 
                        className="absolute bottom-0 left-6 right-6 h-1 bg-primary rounded-full shadow-[0_0_15px_var(--color-primary)]" 
                      />
                    )}
                  </button>
                  <button 
                    onClick={() => handleRoomChange('planner')}
                    className={`flex-1 py-5 flex flex-col items-center gap-1.5 transition-all relative ${activeRoom === 'planner' ? 'text-emerald-400' : 'text-dim hover:text-white'}`}
                  >
                    <BrainCircuit className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-black tracking-[0.2em]">{t.smartPlannerTitle}</span>
                    {activeRoom === 'planner' && (
                      <motion.div 
                        layoutId="activeTab" 
                        className="absolute bottom-0 left-6 right-6 h-1 bg-emerald-400 rounded-full shadow-[0_0_15px_#10b981]" 
                      />
                    )}
                  </button>
                <div className="flex">
                  <button 
                    onClick={toggleMaximize}
                    className="px-5 text-dim hover:text-white transition-all hover:bg-white/5 flex items-center"
                    title={isMaximized ? "Restore" : "Maximize"}
                  >
                    {isMaximized ? <Layout className="w-4 h-4 opacity-50" /> : <Layout className="w-4 h-4 rotate-90 opacity-50" />}
                  </button>
                  <button 
                    onClick={toggleOpen}
                    className="px-5 text-dim hover:text-rose-400 transition-all hover:bg-rose-500/5 flex items-center"
                  >
                    <X className="w-4 h-4 opacity-50" />
                  </button>
                </div>
              </div>
            )}

            {/* Body */}
            <div className={`p-6 flex flex-col ${isMaximized || isFullPage ? 'flex-1 overflow-hidden' : ''}`}>
              {!isFullPage && (
                  <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 ${activeRoom === 'planner' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-primary/10 border-primary/20 text-primary shadow-[0_0_20px_var(--primary-glow)]'}`}>
                           {activeRoom === 'planner' ? <BrainCircuit className="w-6 h-6 animate-pulse" /> : <Sparkles className="w-6 h-6 animate-pulse" />}
                        </div>
                        <div>
                          <h3 className="font-bold text-base tracking-tight text-white mb-0.5">
                            {activeRoom === 'planner' ? t.plannerAdvisor : (t.aiAssistantTitle || 'Kelmid AI')}
                          </h3>
                          <div className="flex items-center gap-2">
                             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/5">
                               <div className={`w-1.5 h-1.5 rounded-full ${apiStatus === 'ok' && effectiveOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                               <span className="text-[9px] uppercase font-bold tracking-widest text-dim">
                                 {apiStatus === 'ok' ? (effectiveOnline ? 'Optimized' : 'Offline') : 'System Error'}
                               </span>
                             </div>
                             <button 
                               onClick={(e) => { e.stopPropagation(); toggleVoiceMode(); }} 
                               className={`p-1.5 rounded-lg transition-all ${voiceMode ? 'text-primary bg-primary/10' : 'text-dim hover:text-primary hover:bg-primary/5'}`}
                             >
                               {voiceMode ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                             </button>
                          </div>
                        </div>
                      </div>
                  </div>
              )}

              <div 
                className={`text-sm leading-relaxed mb-6 font-medium min-h-[140px] flex-1 overflow-y-auto custom-scrollbar pr-2 overscroll-contain bg-white/[0.01] rounded-2xl p-4 border border-white/[0.02] shadow-inner`}
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                {isAiLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
                    <div className="relative">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary"
                      />
                      <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-pulse" />
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/70 animate-pulse">{t.thinking || 'Synchronizing...'}</span>
                  </div>
                ) : (
                  aiResponse ? (
                    <div className="markdown-body text-white/90 prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{aiResponse}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="p-4 flex flex-col items-center justify-center h-full gap-5 text-center opacity-80 group">
                      <div className={`w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110 duration-500 ${activeRoom === 'planner' ? 'text-emerald-400' : 'text-primary'}`}>
                         {activeRoom === 'planner' ? <BrainCircuit className="w-10 h-10" /> : <Bot className="w-10 h-10" />}
                      </div>
                      <p className="text-xs leading-relaxed max-w-[240px] font-medium text-dim">
                        {activeRoom === 'planner' 
                          ? t.plannerWelcome
                          : (t.aiWelcomeMessage || 'Assistant ready. How can I facilitate your productivity today?')}
                      </p>
                    </div>
                  )
                )}
              </div>

              <div className="mt-auto">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-4 scroll-smooth">
                  {activeRoom === 'planner' ? (
                    <>
                      <button 
                        onClick={() => handleSend(language === 'ar' ? 'اقترح علي خطة ذكية ليومي' : 'Suggest a smart plan for my day')}
                        className="shrink-0 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl text-[10px] font-bold hover:bg-emerald-500 hover:text-white transition-all uppercase tracking-widest text-emerald-400"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> {t.smartPlan}
                      </button>
                      <button 
                        onClick={() => handleSend(language === 'ar' ? 'هندسة روتين الصباح المثالي' : 'Engineer perfect morning routine')}
                        className="shrink-0 flex items-center gap-2 bg-surface border border-muted px-4 py-2.5 rounded-xl text-[10px] font-bold hover:bg-white/5 transition-all uppercase tracking-widest text-dim hover:text-[var(--color-base)]"
                      >
                        <Sunrise className="w-3.5 h-3.5 text-amber-400" /> {t.morningRoutine}
                      </button>
                      <button 
                        onClick={() => handleSend(language === 'ar' ? 'حلل ضياع الوقت في جدولي' : 'Analyze time waste in my schedule')}
                        className="shrink-0 flex items-center gap-2 bg-surface border border-muted px-4 py-2.5 rounded-xl text-[10px] font-bold hover:bg-white/5 transition-all uppercase tracking-widest text-dim hover:text-[var(--color-base)]"
                      >
                        <Activity className="w-3.5 h-3.5 text-rose-400" /> {t.timeAnalysis}
                      </button>
                      <button 
                        onClick={() => handleSend(language === 'ar' ? 'تحويل وقت الفراغ لمهام منتجة' : 'Convert gaps to deep work')}
                        className="shrink-0 flex items-center gap-2 bg-surface border border-muted px-4 py-2.5 rounded-xl text-[10px] font-bold hover:bg-white/5 transition-all uppercase tracking-widest text-dim hover:text-[var(--color-base)]"
                      >
                        <Zap className="w-3.5 h-3.5 text-blue-400" /> {t.bridgeGaps}
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleSend(t.cmdToday)}
                        className="shrink-0 flex items-center gap-2 bg-surface border border-muted px-4 py-2.5 rounded-xl text-[10px] font-bold hover:bg-white/5 transition-all uppercase tracking-widest text-dim hover:text-[var(--color-base)]"
                      >
                        <CalendarIcon className="w-3.5 h-3.5 text-primary" /> {t.appointmentsToday || "Today's Agenda"}
                      </button>
                      <button 
                        onClick={() => handleSend(t.cmdAdd)}
                        className="shrink-0 flex items-center gap-2 bg-surface border border-muted px-4 py-2.5 rounded-xl text-[10px] font-bold hover:bg-white/5 transition-all uppercase tracking-widest text-dim hover:text-[var(--color-base)]"
                      >
                        <Clock className="w-3.5 h-3.5 text-blue-400" /> {t.addEventAction || "Add Event"}
                      </button>
                      <button 
                        onClick={() => handleSend(t.cmdHabits)}
                        className="shrink-0 flex items-center gap-2 bg-surface border border-muted px-4 py-2.5 rounded-xl text-[10px] font-bold hover:bg-white/5 transition-all uppercase tracking-widest text-dim hover:text-[var(--color-base)]"
                      >
                        <Target className="w-3.5 h-3.5 text-emerald-400" /> {t.checkHabits || "Check Habits"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white/[0.03] rounded-[1.5rem] border border-white/10 p-1.5 group focus-within:border-primary/50 focus-within:bg-white/[0.05] transition-all duration-300">
                <button 
                  onClick={startListening} 
                  className={`p-3 rounded-2xl transition-all ${isListening ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse' : 'bg-white/5 text-dim hover:text-primary hover:bg-white/10'}`}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <input 
                  placeholder={activeRoom === 'planner' ? t.organizeTomorrow : (t.chatInputPlaceholder || "Facilitate productivity...")}
                  value={chatQuery}
                  onChange={e => setChatQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  className="flex-1 bg-transparent border-none text-base px-2 focus:outline-none placeholder:text-white/20 text-white"
                />
                <button 
                  onClick={() => handleSend()}
                  className={`p-3 rounded-2xl transition-all ${chatQuery.trim() ? (activeRoom === 'planner' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-primary text-white shadow-[0_0_20px_var(--primary-glow)]') : 'text-white/10'}`}
                  disabled={!chatQuery.trim() && !isAiLoading}
                >
                  <Send className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isFullPage && (
        <motion.button 
          drag
          dragConstraints={constraintsRef}
          dragElastic={0.2}
          dragMomentum={true}
          animate={buttonControls}
          onDragEnd={handleButtonDragEnd}
          whileHover={{ scale: 1.15, rotate: isOpen ? 90 : 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleOpen}
          className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-3xl transition-all duration-500 pointer-events-auto relative group fixed bottom-20 left-6 lg:bottom-12 lg:left-12 ${isOpen ? 'bg-[#0f111a] border border-white/10 text-primary' : 'bg-primary text-white shadow-[0_20px_40px_-10px_var(--primary-glow)] ring-4 ring-primary/10'}`}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-7 h-7" />}
          
          {/* Interaction Ripple Effect */}
          <span className="absolute inset-0 rounded-full bg-primary/20 group-hover:animate-ping pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {!isOpen && (
             <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary shadow-sm shadow-black/50"></span>
            </span>
          )}
        </motion.button>
      )}
    </div>
  );
};
