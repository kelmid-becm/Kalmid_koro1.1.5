import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface RobotAvatarProps {
  isSpeaking: boolean;
  isThinking: boolean;
  isListening: boolean;
  isSilent?: boolean;
  mood: 'neutral' | 'happy' | 'thinking' | 'surprised';
}

export const RobotAvatar: React.FC<RobotAvatarProps> = ({ isSpeaking, isThinking, isListening, isSilent, mood }) => {
  // Determine dominant state
  let currentMood = mood;
  if (isSilent) currentMood = 'neutral';
  if (isListening) currentMood = 'surprised'; // Wide eyes when listening
  if (isThinking) currentMood = 'thinking';
  if (isSpeaking) currentMood = 'happy';

  if (isSilent) {
    return (
      <div className="relative flex flex-col items-center justify-center">
        {/* Background Sleep Glow */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full blur-xl bg-slate-500/20 z-0"
        />

        {/* Sleeping Ball */}
        <motion.div
           animate={{
             y: [-2, 2, -2],
             scale: [1, 1.02, 1],
           }}
           transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
           className="relative z-10 w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full border-2 border-slate-500/30 flex flex-col items-center justify-center shadow-2xl p-2 overflow-hidden"
        >
          {/* Closed Eyes */}
          <div className="flex gap-4 mt-1">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                 <div className="w-4 h-[2px] bg-slate-500 rounded-full opacity-60" />
              </div>
            ))}
          </div>

          {/* ZZZ Particles */}
          <div className="absolute top-2 right-4">
             <motion.span
               animate={{ y: [-5, -20], x: [0, 10], opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
               transition={{ repeat: Infinity, duration: 3, delay: 0 }}
               className="text-slate-400 font-mono text-[10px] absolute"
             >Z</motion.span>
             <motion.span
               animate={{ y: [-5, -25], x: [5, 15], opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
               transition={{ repeat: Infinity, duration: 3, delay: 1 }}
               className="text-slate-400 font-mono text-[12px] absolute ml-2"
             >Z</motion.span>
          </div>
          
          {/* Pulse Core */}
          <motion.div 
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="w-2 h-2 rounded-full bg-slate-500/40 mt-4 shadow-[0_0_8px_rgba(100,116,139,0.3)]"
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Background Anime Aura Glow */}
      <motion.div
        animate={{
          scale: isSpeaking || isListening ? [1, 1.2, 1] : 1,
          opacity: isSpeaking || isListening ? [0.3, 0.6, 0.3] : 0.2,
          rotate: isThinking ? [0, 180, 360] : 0,
        }}
        transition={{ 
          scale: { repeat: Infinity, duration: 2, ease: "easeInOut" },
          opacity: { repeat: Infinity, duration: 2, ease: "easeInOut" },
          rotate: { repeat: Infinity, duration: 10, ease: "linear" }
        }}
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full blur-xl mix-blend-screen transition-colors duration-1000 z-0 ${
          isListening ? 'bg-rose-500' : isThinking ? 'bg-emerald-500' : 'bg-primary'
        }`}
      />

      {/* Robot Head */}
      <motion.div
        animate={{
          y: isSpeaking ? [-2, 2, -2] : [-1, 1, -1],
          rotate: isThinking ? [-3, 3, -3] : (isListening ? [-1, 1, -1] : 0),
        }}
        transition={{ repeat: Infinity, duration: isSpeaking ? 1 : (isThinking ? 3 : 4), ease: "easeInOut" }}
        className="relative z-10 w-24 h-24 bg-gradient-to-b from-surface to-surface/80 rounded-[40px] border-2 border-primary/20 flex flex-col items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.2)] p-2 group overflow-hidden backdrop-blur-md"
      >
        {/* Anime Hair/Antenna highlights */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-primary/30 rounded-full blur-[2px]" />
        
        {/* Screen / Face Area */}
        <div className="relative w-full h-full bg-[#0a0a0f] rounded-[32px] flex flex-col items-center justify-center overflow-hidden border-2 border-white/5 shadow-inner">
          
          {/* Facial Features Container */}
          <motion.div 
            animate={{ 
              y: isSpeaking ? -2 : 0,
              scale: isListening ? 1.05 : 1
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex flex-col items-center gap-1.5 mt-2"
          >
            {/* Eyes */}
            <div className="flex gap-5 items-center justify-center relative">
              {/* Left Eye */}
              <Eye type="left" mood={currentMood} isBlinking={!isThinking && !isListening} color={isListening ? '#f43f5e' : (isThinking ? '#10b981' : '#6366f1')} />
              
              {/* Right Eye */}
              <Eye type="right" mood={currentMood} isBlinking={!isThinking && !isListening} color={isListening ? '#f43f5e' : (isThinking ? '#10b981' : '#6366f1')} />

              {/* Anime Blush (Cheeks) */}
              <AnimatePresence>
                {(currentMood === 'happy' || isSpeaking) && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 0.6, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="absolute -bottom-2 -left-2 w-4 h-2 bg-pink-500 rounded-full blur-[3px]"
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 0.6, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="absolute -bottom-2 -right-2 w-4 h-2 bg-pink-500 rounded-full blur-[3px]"
                    />
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Mouth */}
            <Mouth isSpeaking={isSpeaking} mood={currentMood} color={isListening ? '#f43f5e' : '#6366f1'} />
          </motion.div>

          {/* Screen scanline effect */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none opacity-50" />
        </div>
      </motion.div>

      {/* Robot Body */}
      <motion.div
        animate={{
          y: isSpeaking ? [-1, 1, -1] : [-0.5, 0.5, -0.5],
        }}
        transition={{ repeat: Infinity, duration: isSpeaking ? 1 : 4, ease: "easeInOut", delay: 0.2 }}
        className="relative z-0 -mt-3 w-14 h-12 bg-gradient-to-b from-surface to-[#0f172a] rounded-b-3xl rounded-t-xl border-x-2 border-b-2 border-primary/20 flex justify-center shadow-lg pt-4"
      >
        {/* Core/Heart */}
        <motion.div 
          animate={{
            scale: currentMood === 'happy' ? [1, 1.2, 1] : 1,
          }}
          transition={{ repeat: Infinity, duration: 1 }}
          className={`w-3 h-3 rounded-full mt-1 ${isListening ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : (isThinking ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-primary shadow-[0_0_10px_#6366f1]')}`}
        />

        {/* Left Arm */}
        <motion.div
          animate={{
            rotate: isSpeaking ? [0, -20, 0] : (currentMood === 'happy' ? [0, -130, -110, -130, 0] : [0, -5, 0]),
            transformOrigin: 'top right'
          }}
          transition={{ repeat: Infinity, duration: isSpeaking ? 0.5 : (currentMood === 'happy' ? 2 : 4) }}
          className="absolute top-2 -left-3 w-3 h-8 bg-surface rounded-full border-2 border-primary/20 scale-x-[-1]"
        />

        {/* Right Arm */}
        <motion.div
          animate={{
            rotate: currentMood === 'happy' ? [0, 130, 110, 130, 0] : (isThinking ? [0, -45, 0] : [0, 5, 0]),
            transformOrigin: 'top left'
          }}
          transition={{ repeat: Infinity, duration: currentMood === 'happy' ? 2 : (isThinking ? 3 : 4), delay: 0.1 }}
          className="absolute top-2 -right-3 w-3 h-8 bg-surface rounded-full border-2 border-primary/20"
        />
      </motion.div>

      {/* Signal Rings for Listening */}
      {isListening && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-rose-500/40 rounded-full z-0 pointer-events-none"
        />
      )}
    </div>
  );
};

// --- Subcomponents for Facial Features ---

const Eye = ({ type, mood, isBlinking, color }: { type: 'left' | 'right', mood: string, isBlinking: boolean, color: string }) => {
  // Blinking animation for normal state
  const blinkAnim: any = isBlinking ? {
    scaleY: [1, 1, 1, 1, 1, 1, 0.1, 1, 1, 1, 1, 0.1, 1, 1, 1, 1, 1, 1, 1, 1], // Random-looking blinking pattern
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut" }
  } : { scaleY: 1 };

  // Thinking eyes (><)
  if (mood === 'thinking') {
    return (
      <motion.div
        animate={{ rotate: type === 'left' ? [45, 55, 45] : [-45, -55, -45] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="w-4 h-1.5 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
      />
    );
  }

  // Happy eyes (U U upside down)
  if (mood === 'happy') {
    return (
      <div 
        className="w-4 h-4 rounded-t-full border-t-[3px] border-l-[3px] border-r-[3px] border-b-0"
        style={{ borderColor: color, filter: `drop-shadow(0 0 4px ${color})`, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
      />
    );
  }

  // Surprised / Listening eyes (O O)
  if (mood === 'surprised') {
    return (
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 1 }}
        className="w-4 h-5 rounded-full border-[3px]"
        style={{ borderColor: color, backgroundColor: 'transparent', boxShadow: `0 0 8px ${color}, inset 0 0 4px ${color}` }}
      />
    );
  }

  // Default neutral/blinking eyes
  return (
    <motion.div
      animate={blinkAnim}
      className="w-3.5 h-4 rounded-full"
      style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}` }}
    >
      {/* Eye shine reflection */}
      <div className="absolute top-[2px] right-[2px] w-1.5 h-1.5 bg-white rounded-full opacity-80" />
    </motion.div>
  );
};

const Mouth = ({ isSpeaking, mood, color }: { isSpeaking: boolean, mood: string, color: string }) => {
  if (isSpeaking) {
    // Dynamic speaking mouth (waveform or open mouth)
    return (
      <div className="flex gap-1 items-center mt-1 h-3">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              height: [3, 8 + Math.random() * 4, 3],
            }}
            transition={{ repeat: Infinity, duration: 0.2 + i * 0.05, ease: "easeInOut" }}
            className="w-1.5 rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
          />
        ))}
      </div>
    );
  }

  if (mood === 'thinking') {
    // Zigzag mouth or small line
    return (
      <motion.div 
        animate={{ width: [10, 14, 10], x: [-2, 2, -2] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="w-3 h-1 rounded-full mt-2" 
        style={{ backgroundColor: color, opacity: 0.6 }} 
      />
    );
  }

  if (mood === 'happy') {
    // Smile
    return (
      <div className="w-5 h-2.5 mt-1 border-b-[2.5px] border-l-[2.5px] border-r-[2.5px] rounded-b-full border-transparent"
           style={{ borderBottomColor: color, borderLeftColor: color, borderRightColor: color, filter: `drop-shadow(0 0 2px ${color})` }} />
    );
  }

  if (mood === 'surprised') {
    // Little 'o'
    return (
      <div className="w-2.5 h-2.5 rounded-full border-2 mt-1"
           style={{ borderColor: color, opacity: 0.8 }} />
    );
  }

  // Neutral - small dot or line
  return (
    <div className="w-2 h-1 rounded-full mt-2" style={{ backgroundColor: color, opacity: 0.5 }} />
  );
};

