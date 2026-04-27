import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { RobotAvatar } from './RobotAvatar';
import { CalendarEvent, Habit } from '../types';
import { translations, Language } from '../locales/translations';
import { Send, Sparkles, Moon, Sun, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface FloatingCompanionProps {
  effectiveOnline: boolean;
  events: CalendarEvent[];
  habits: Habit[];
  language: Language;
  onChat?: (msg: string) => void;
  aiResponse?: string | null;
  isAiLoading?: boolean;
}

export const FloatingCompanion: React.FC<FloatingCompanionProps> = ({ 
  effectiveOnline, 
  events, 
  habits, 
  language,
  onChat,
  aiResponse,
  isAiLoading
}) => {
  const [message, setMessage] = useState<string | null>(null);
  const [mood, setMood] = useState<'neutral' | 'happy' | 'thinking' | 'surprised'>('neutral');
  const [isVisible, setIsVisible] = useState(true); // Can be toggled if needed
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [isSilent, setIsSilent] = useState(false);
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [side, setSide] = useState<'right' | 'left'>('right');
  const controls = useAnimation();
  const constraintsRef = useRef<HTMLDivElement>(null);

  const t = translations[language];

  // Initialize controls
  useEffect(() => {
    controls.start({ opacity: 1, y: 0, scale: 1, rotate: 0 });
  }, []);

  // Random tips / offline logic
  useEffect(() => {
    if (isSilent) return; // No auto-messages in silent mode
    let interval: NodeJS.Timeout;

    const checkContext = () => {
      // Don't interrupt if user is interacting with it
      if (isInputOpen || isAiLoading) return;

      const now = new Date();
      let newMessage: string | null = null;
      let newMood: typeof mood = 'neutral';

      // Check upcoming events in the next 2 hours
      const upcoming = events.filter(e => {
        const evtTime = new Date(`${e.date}T${e.startTime}`);
        const diffHour = (evtTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        return diffHour > 0 && diffHour <= 2 && !e.isCompleted;
      });

      const completedHabits = habits.filter(h => h.completedToday);

      if (!effectiveOnline && completedHabits.length > 0 && Math.random() > 0.3) {
         // Priorities achievements when offline!
         newMessage = language === 'ar' ? `رغم انقطاع الإنترنت، أنا سعيد جداً لأنك أكملت ${completedHabits.length} من عاداتك! 🌟` : `Even offline, I'm so happy you completed ${completedHabits.length} habits! 🌟`;
         newMood = 'happy';
      } else if (!effectiveOnline && Math.random() > 0.5) {
        // Offline specifically
        const offlineChatsAr = ['أنا هنا معك، الإنترنت مقطوع لكننا مستمرون!', 'جاري العمل في الوضع غير المتصل...'];
        const offlineChatsEn = ["Offline, but I'm still here!", "Working locally..."];
        newMessage = language === 'ar' 
          ? offlineChatsAr[Math.floor(Math.random() * offlineChatsAr.length)]
          : offlineChatsEn[Math.floor(Math.random() * offlineChatsEn.length)];
        newMood = 'surprised';
      } else if (upcoming.length > 0 && Math.random() > 0.4) {
        newMessage = language === 'ar' ? `لا تنسى، "${upcoming[0].title}" قريباً!` : `Don't forget, "${upcoming[0].title}" soon!`;
        newMood = 'surprised';
      } else if (completedHabits.length > 0 && Math.random() > 0.4) {
        newMessage = language === 'ar' ? `أنت رائع! لقد أكملت ${completedHabits.length} من عاداتك! 🌟` : `Awesome! You've completed ${completedHabits.length} habits! 🌟`;
        newMood = 'happy';
      } else {
        // Just random chatter
        const randomChatsAr = ['كيف حالك اليوم؟', 'تذكر أن تأخذ استراحة.', 'أنا هنا لمساعدتك!'];
        const randomChatsEn = ["How are you today?", "Remember to take a break.", "I'm here to help!"];
        newMessage = language === 'ar' 
          ? randomChatsAr[Math.floor(Math.random() * randomChatsAr.length)]
          : randomChatsEn[Math.floor(Math.random() * randomChatsEn.length)];
        newMood = 'neutral';
      }

      setMessage(newMessage);
      setMood(newMood);

      // Hide message after 5-8 seconds
      setTimeout(() => {
        if (!isAiLoading && !isInputOpen) {
          setMessage(null);
          setMood('neutral');
        }
      }, 6000);
    };

    // Evaluate randomly every 45 seconds
    interval = setInterval(() => {
      if (!message && Math.random() > 0.5 && !isInputOpen) {
        checkContext();
      }
    }, 45000);

    // Run once on load if offline, just to show it works
    if (!effectiveOnline) {
      setTimeout(checkContext, 2000);
    } else {
      setTimeout(() => {
         setMessage(language === 'ar' ? 'أهلاً بك! أنا هنا لمساعدتك اليوم' : 'Hello! I am here to help you today');
         setMood('happy');
         setTimeout(() => {
            setMessage(null);
            setMood('neutral');
         }, 5000);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [effectiveOnline, events, habits, language, message, isInputOpen, isAiLoading]);

  // Sync global AI Response to the bubble
  useEffect(() => {
     if (aiResponse) {
        setMessage(aiResponse);
        setMood('happy');
        // keep it open for longer if it's an AI response
        const timer = setTimeout(() => {
           if (!isInputOpen) {
              setMessage(null);
              setMood('neutral');
           }
        }, 12000);
        return () => clearTimeout(timer);
     }
  }, [aiResponse, isInputOpen]);

  // Handle explicit AI Loading state
  useEffect(() => {
     if (isAiLoading) {
        setMood('thinking');
        setMessage(language === 'ar' ? 'أفكر في الأمر...' : 'Thinking...');
     }
  }, [isAiLoading, language]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onChat?.(inputText.trim());
    setInputText('');
    setIsInputOpen(false);
  };

  const handleDragEnd = (_: any, info: any) => {
    const screenWidth = window.innerWidth;
    const threshold = screenWidth / 2;
    
    // When released, determine which side to snap to
    if (info.point.x < threshold) {
      setSide('left');
      const offset = window.innerWidth < 1024 ? 60 : 100;
      controls.start({ 
        x: -screenWidth + offset,
        scale: 0.8, // Slightly smaller when docked
        transition: { type: 'spring', stiffness: 300, damping: 30 } 
      });
    } else {
      setSide('right');
      controls.start({ 
        x: 0,
        scale: 1, // Full size when on right
        transition: { type: 'spring', stiffness: 300, damping: 30 } 
      });
    }
  };

  const handleToggleInput = () => {
    if (isSilent) {
      setIsSilent(false);
      setMood('surprised');
      setMessage(language === 'ar' ? 'لقد عدت! كيف يمكنني مساعدتك؟' : 'I am back! How can I help?');
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    if (side === 'left') {
      // If it's on the left, first tap brings it back to full size/right
      setSide('right');
      controls.start({ 
        x: 0, 
        scale: 1,
        transition: { type: 'spring', stiffness: 300, damping: 30 } 
      });
      return;
    }

    if (isInputOpen) {
      setIsInputOpen(false);
    } else {
      setIsInputOpen(true);
      setMessage(null);
      setMood('neutral');
    }
  };

  if (!isVisible) return null;

  return (
    <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[300] p-6">
      <motion.div 
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.2}
        dragMomentum={true}
        animate={controls}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.15, cursor: 'grabbing', transition: { duration: 0.1 } }}
        initial={{ opacity: 0, y: 100, scale: 0.1, rotate: -20 }}
        className="fixed pointer-events-auto bottom-20 right-6 lg:bottom-12 lg:right-12"
      >
      <motion.div 
        animate={{ y: [-3, 3, -3] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 2 }}
        className="relative group cursor-grab active:cursor-grabbing flex flex-col items-center"
      >
        {/* Speech Bubble / Chat History */}
        <AnimatePresence>
          {(message || isInputOpen) && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.9 }}
              className={`absolute bottom-[100%] mb-4 w-64 p-4 bg-surface/95 border-2 border-primary/20 rounded-2xl shadow-xl backdrop-blur-xl text-sm pointer-events-auto ${language === 'ar' ? 'right-0 rounded-br-none' : 'left-0 rounded-bl-none'}`}
            >
              {message && !isInputOpen && (
                 <div className="text-base text-[var(--color-base)] max-h-48 overflow-y-auto custom-scrollbar markdown-body break-words">
                   <ReactMarkdown>{message}</ReactMarkdown>
                 </div>
              )}

              {isInputOpen && (
                 <div className="flex flex-col gap-2 relative z-50">
                   <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-dim uppercase tracking-wider">{language === 'ar' ? 'تحدث مع ALMO' : 'Chat with ALMO'}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsSilent(true);
                          setIsInputOpen(false);
                        }}
                        className="p-1.5 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 text-slate-500 transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight"
                      >
                         <Moon className="w-3 h-3" />
                         {language === 'ar' ? 'وضع هادئ' : 'Silent'}
                      </button>
                   </div>
                   <form onSubmit={handleSubmit} onPointerDownCapture={e => e.stopPropagation()}>
                    <input 
                      ref={inputRef}
                      type="text" 
                      autoFocus
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={language === 'ar' ? 'ماذا تفكر؟' : 'What\'s on your mind?'}
                      className="w-full bg-white/5 border border-primary/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/50 text-[var(--color-base)] placeholder-dim"
                    />
                    <button 
                      type="submit" 
                      className="absolute bottom-1 right-1 w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
                      disabled={!inputText.trim() || isAiLoading}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                   </form>
                 </div>
              )}

              {/* Tail */}
              <div className={`absolute -bottom-2 ${language === 'ar' ? 'right-6' : 'left-6'} w-4 h-4 bg-surface border-b-2 border-r-2 border-primary/20 transform rotate-45 pointer-events-none`} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Avatar itself scaled down a bit */}
        <motion.div 
           className="relative cursor-pointer hover:brightness-110 active:scale-95 transition-all"
           onTap={handleToggleInput}
        >
          <RobotAvatar 
            isSpeaking={!!message && !isInputOpen && !isAiLoading}
            isThinking={!!isAiLoading}
            isListening={isInputOpen} // Wide eyes when waiting for input!
            isSilent={isSilent}
            mood={mood}
          />
          <button 
             onPointerDown={(e) => { e.stopPropagation(); setIsVisible(false); }}
             className="absolute -top-2 -right-2 w-6 h-6 bg-surface border border-muted rounded-full flex items-center justify-center text-dim hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
             title="Dismiss ALMO"
          >
             <X className="w-4 h-4" />
          </button>
        </motion.div>

      </motion.div>
    </motion.div>
    </div>
  );
};
