import { AppTranslations } from '../locales/translations';
import React, { useState, useRef } from 'react';
import { Clock, Timer, AlarmClock, BellRing, Paperclip, Trash2, X, Target, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSmartIcon } from '../services/icons';
import { CalendarEvent } from '../types';

export interface EventCardProps {
  event: CalendarEvent;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onEdit: (event: CalendarEvent) => void;
  onSnooze?: (id: string, minutes: number) => void;
  onImageUpload?: (file: File) => void;
  t: AppTranslations;
  now: Date;
}

export const EventCard: React.FC<EventCardProps> = React.memo(({ 
  event, 
  onDelete, 
  onToggleComplete, 
  onEdit, 
  onSnooze, 
  onImageUpload, 
  t, 
  now 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowMenu(true);
    }, 600); // 600ms for long press
  };

  const handleEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const priorityColor = {
    low: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    high: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  }[event.priority];

  const priorityDot = {
    low: 'bg-cyan-400',
    medium: 'bg-amber-500',
    high: 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]',
  }[event.priority];

  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
  const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

  const smartIcon = getSmartIcon(event.title);

  const getCountdown = () => {
    if (event.isCompleted) return null;
    const diff = startTime.getTime() - now.getTime();
    if (diff < 0) {
      if (now.getTime() < endTime.getTime()) return <span className="text-indigo-400 font-bold animate-pulse inline-flex items-center gap-1"><Timer className="w-2.5 h-2.5" /> {t.ongoing}</span>;
      return null;
    }
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    const days = Math.floor(hrs / 24);
    const remainingHrs = hrs % 24;

    const icon = <Clock className="w-2.5 h-2.5 mr-1" />;

    if (days > 0) return <span className="inline-flex items-center">{icon} {t.startsIn} {days}{t.unitDay} {remainingHrs}{t.unitHour}</span>;
    if (hrs > 0) return <span className="inline-flex items-center">{icon} {t.startsIn} {hrs}{t.unitHour} {remainingMins}{t.unitMinute}</span>;
    return <span className="inline-flex items-center text-indigo-400 font-bold">{icon} {t.startsIn} {mins}{t.unitMinute}</span>;
  };

  const countdown = getCountdown();

  return (
    <div className="relative mb-4">
      <motion.div 
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          scale: event.isCompleted ? 0.98 : 1,
          filter: event.isCompleted ? 'grayscale(0.4) blur(0.1px)' : 'grayscale(0) blur(0px)'
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        exit={{ opacity: 0, scale: 0.95 }}
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
        onClick={() => {
          if (!showMenu) setIsExpanded(!isExpanded);
        }}
        className={`group relative flex flex-col gap-4 p-5 rounded-2xl cursor-pointer transition-all duration-500 ${isExpanded ? 'border-primary/50 shadow-xl shadow-primary/10 glass' : 'hover:border-[var(--color-border-active)]'} ${event.isCompleted ? 'shadow-inner' : 'shadow-sm'}`}
        style={{ 
          backgroundColor: event.isCompleted ? 'var(--color-input)' : 'var(--color-surface)', 
          borderColor: isExpanded ? 'var(--color-primary)' : (event.isCompleted ? 'transparent' : 'var(--color-border-muted)'),
          opacity: event.isCompleted ? 0.7 : 1,
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div className="flex items-start gap-4">
          <div className="mt-1 flex flex-col items-center gap-1.5">
            <div 
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-primary text-white shadow-lg shadow-primary/30 rotate-3' : 'bg-surface border border-muted group-hover:border-primary/30'}`}
            >
              {smartIcon}
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider font-bold" style={{ color: 'var(--color-dim)' }}>
              {startTime.toLocaleTimeString(t.localeCode, { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
          </div>
          
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${priorityDot}`} title={`Priority: ${event.priority}`} />
                  <h3 className={`font-sans font-bold text-sm tracking-tight transition-all duration-500 ease-in-out ${event.isCompleted ? 'line-through opacity-40 translate-x-1' : ''}`} style={{ color: 'var(--color-base)' }}>
                    {event.title}
                  </h3>
                  {event.isCompleted && (
                    <motion.div
                      initial={{ scale: 0, rotate: -45, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Check className="w-4 h-4 text-emerald-500 shadow-sm" />
                    </motion.div>
                  )}
              {countdown && (
                <span className="text-[9px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 uppercase tracking-wide">
                   {countdown}
                </span>
              )}
              <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase font-mono font-bold tracking-wide ${priorityColor}`}>
                {event.priority}
              </span>
              {event.enableAlarm && (
                <div className="flex items-center justify-center p-1 rounded-lg text-primary border border-primary/20" style={{ backgroundColor: 'var(--color-surface)' }} title={t.enableAlarm}>
                  <AlarmClock className="w-3.5 h-3.5 animate-pulse" />
                </div>
              )}
              {event.enableReminder && !event.enableAlarm && (
                <div className="flex items-center justify-center p-1 rounded-lg" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-dim)' }} title={t.notifGranted}>
                  <BellRing className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
            
            <AnimatePresence>
              {!isExpanded && event.description && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs line-clamp-1 leading-relaxed"
                  style={{ color: 'var(--color-dim)' }}
                >
                  {event.description}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-1">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => {
                e.stopPropagation();
                if (e.target.files && e.target.files[0] && onImageUpload) {
                  onImageUpload(e.target.files[0]);
                }
              }} 
            />
            <button
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              className="p-2 transition-all rounded-lg border border-transparent"
              style={{ backgroundColor: 'var(--color-input)', color: 'var(--color-dim)' }}
              title={t.uploadScheduleImage}
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(event.id); }}
              className="p-2 transition-all rounded-lg border border-transparent"
              style={{ backgroundColor: 'var(--color-input)', color: 'var(--color-dim)' }}
              title={t.deleteAppointment}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t pt-4 mt-2"
              style={{ borderColor: 'var(--color-border-muted)' }}
            >
              <div className="flex flex-col gap-4 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl border transition-colors" style={{ backgroundColor: 'var(--color-input)', borderColor: 'var(--color-border-muted)' }}>
                    <p className="text-[9px] uppercase font-mono tracking-widest mb-1" style={{ color: 'var(--color-dim)' }}>{t.busyPeriod}</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-base)' }}>
                      {startTime.toLocaleTimeString(t.localeCode, { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString(t.localeCode, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border transition-colors" style={{ backgroundColor: 'var(--color-input)', borderColor: 'var(--color-border-muted)' }}>
                    <p className="text-[9px] uppercase font-mono tracking-widest mb-1" style={{ color: 'var(--color-dim)' }}>{t.duration}</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
                      {durationHours > 0 && `${durationHours}${t.unitHour} `}{durationMinutes}{t.unitMinute}
                    </p>
                  </div>
                </div>
                {(event.description || event.details) && (
                  <div className="p-4 rounded-xl" style={{ backgroundColor: 'color-mix(in oklab, var(--color-input), transparent 30%)' }}>
                    <p className="text-[10px] uppercase font-mono tracking-widest mb-2" style={{ color: 'var(--color-dim)' }}>{t.detailsAndNotes}</p>
                    {event.description && <p className="text-xs leading-relaxed" style={{ color: 'var(--color-base)', opacity: 0.8 }}>{event.description}</p>}
                    {event.details && (
                       <p className="text-xs leading-relaxed mt-2" style={{ color: 'var(--color-base)', opacity: 0.8 }}>{event.details}</p>
                    )}
                  </div>
                )}

                {onSnooze && !event.isCompleted && (
                  <div className="mt-2 pt-4 border-t" style={{ borderColor: 'var(--color-border-muted)' }}>
                    <p className="text-[9px] uppercase font-mono tracking-widest mb-3" style={{ color: 'var(--color-dim)' }}>{t.snooze}</p>
                    <div className="grid grid-cols-3 gap-2">
                        {[5, 10, 30].map(mins => (
                          <button 
                            key={`event-snooze-${event.id}-${mins}`}
                            onClick={(e) => { e.stopPropagation(); onSnooze(event.id, mins); }}
                           className="py-2.5 rounded-xl border transition-all flex flex-col items-center justify-center gap-0.5"
                           style={{ backgroundColor: 'var(--color-input)', borderColor: 'var(--color-border-muted)', color: 'var(--color-dim)' }}
                         >
                           <Timer className="w-3.5 h-3.5 text-indigo-400" />
                           <span className="text-[9px] font-bold">{mins}{t.unitMinute}</span>
                         </button>
                       ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Long Press Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className={`absolute left-[10%] sm:left-1/2 -translate-x-[10%] sm:-translate-x-1/2 -top-12 z-50 flex items-center gap-2 p-1.5 border rounded-xl shadow-2xl`}
            style={{ backgroundColor: 'var(--color-sidebar)', borderColor: 'var(--color-border-muted)' }}
          >
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleComplete(event.id); setShowMenu(false); }}
              className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
            >
              {event.isCompleted ? t.unstrike : t.strikeThrough}
            </button>
            <div className="w-px h-4" style={{ backgroundColor: 'var(--color-border-muted)' }} />
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(event); setShowMenu(false); }}
              className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
            >
              {t.edit}
            </button>
            <div className="w-px h-4" style={{ backgroundColor: 'var(--color-border-muted)' }} />
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(event.id); setShowMenu(false); }}
              className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              {t.delete}
            </button>
            <div className="w-px h-4" style={{ backgroundColor: 'var(--color-border-muted)' }} />
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
              className="p-1.5 transition-colors"
              style={{ color: 'var(--color-dim)' }}
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
