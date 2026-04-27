import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Sparkles, Send, Bot, Shield, Zap } from 'lucide-react';
import { RobotAvatar } from './RobotAvatar';
import ReactMarkdown from 'react-markdown';

interface OfflineAdvisorProps {
  onChat: (msg: string) => void;
  isAiLoading: boolean;
  aiResponse?: string | null;
  t: any;
  language: string;
}

export const OfflineAdvisor: React.FC<OfflineAdvisorProps> = ({ onChat, isAiLoading, aiResponse, t, language }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isAiLoading) return;
    onChat(`[LOCAL] ${input.trim()}`);
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8 max-w-2xl mx-auto h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 mb-4">
          <Brain className="w-12 h-12 text-indigo-400" />
        </div>
        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-br from-indigo-400 to-primary bg-clip-text text-transparent">
          {t.offlineAdvisor}
        </h1>
        <p className="text-dim max-w-md mx-auto leading-relaxed">
          {t.offlineWelcome || "I am your local intelligence engine. I work without internet."}
        </p>
      </motion.div>

      <div className="w-full max-w-lg relative flex flex-col items-center">
        <RobotAvatar 
          isThinking={isAiLoading} 
          isSpeaking={!!aiResponse && !isAiLoading}
          isListening={false}
          mood={isAiLoading ? 'thinking' : 'neutral'} 
        />
        
        <AnimatePresence>
          {aiResponse && !isAiLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="mt-6 p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 w-full backdrop-blur-md"
            >
              <div className="markdown-body text-sm md:text-base text-indigo-100" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <ReactMarkdown>{aiResponse}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form 
        onSubmit={handleSubmit}
        className="w-full max-w-xl relative group mt-auto md:mt-0"
      >
        <div className="absolute inset-0 bg-indigo-500/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-3xl" />
        <div className="relative flex items-center bg-surface/50 backdrop-blur-xl border-2 border-muted rounded-3xl p-2 px-4 shadow-2xl focus-within:border-indigo-500/50 transition-all">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={language === 'ar' ? 'اطلب أي شيء من المساعد المحلي...' : 'Ask the Local Assistant anything...'}
            className="flex-1 bg-transparent py-4 px-2 focus:outline-none text-lg placeholder-dim"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isAiLoading}
            className={`p-4 rounded-2xl shadow-lg transition-all active:scale-95 ${language === 'ar' ? 'mr-2' : 'ml-2'} bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white`}
          >
            <Send className={`w-6 h-6 ${language === 'ar' ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        <div className="flex justify-center gap-6 mt-8 pb-4 md:pb-0">
            <div className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-widest text-dim">
                <Shield className="w-3 h-3 text-emerald-400" /> {t.privacyFirst || "Privacy First"}
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-widest text-dim">
                <Zap className="w-3 h-3 text-amber-400" /> {t.zeroLatency || "Zero Latency"}
            </div>
        </div>
      </form>
    </div>
  );
};
