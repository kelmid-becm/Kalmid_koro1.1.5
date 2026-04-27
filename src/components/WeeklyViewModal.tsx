import { AppTranslations } from '../locales/translations';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarDays } from 'lucide-react';
import { CalendarEvent } from '../types';
import { getSmartIcon } from '../services/icons';

interface WeeklyViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  next7DaysEvents: CalendarEvent[];
  t: AppTranslations;
  language: string;
}

const WeeklyViewModal: React.FC<WeeklyViewModalProps> = ({ isOpen, onClose, next7DaysEvents, t, language }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="border rounded-2xl shadow-2xl w-full max-w-[500px] max-h-[85vh] flex flex-col overflow-hidden transition-colors"
            style={{ backgroundColor: 'var(--color-main)', borderColor: 'var(--color-border-muted)' }}
          >
            <div className="flex items-center justify-between p-6 border-b transition-colors" dir={language === 'ar' ? 'rtl' : 'ltr'} style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-muted)' }}>
              <div className="flex items-center gap-3">
                <CalendarDays className="w-6 h-6 text-indigo-400" />
                <div>
                  <h3 className="text-lg font-bold transition-colors" style={{ color: 'var(--color-base)' }}>{t.weeklySchedule}</h3>
                  <p className="text-xs font-mono transition-colors" style={{ color: 'var(--color-dim)' }}>{t.orderedByTime}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-zinc-500 hover:text-indigo-400 rounded-full hover:bg-zinc-800/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              {next7DaysEvents.length > 0 ? (
                <div className="space-y-4">
                  {next7DaysEvents.map((event) => (
                    <div key={event.id} className="p-4 border rounded-xl flex items-center justify-between group transition-all hover:border-indigo-500/30" style={{ borderColor: 'var(--color-border-muted)', backgroundColor: 'var(--color-surface)' }}>
                       <div className="flex items-center gap-4">
                          <div className="text-center w-12 shrink-0 flex flex-col items-center">
                             <p className="text-[10px] font-mono text-dim uppercase tracking-tighter tracking-[0.1em]">{new Date(event.startTime).toLocaleDateString(language === 'ar' ? 'ar' : 'en', {weekday: 'short'})}</p>
                             <p className="text-xl font-black">{new Date(event.startTime).getDate()}</p>
                             <div className="mt-1 text-indigo-400/50 group-hover:text-indigo-400 transition-colors">
                               {getSmartIcon(event.title)}
                             </div>
                          </div>
                          <div>
                             <h4 className={`font-bold text-sm tracking-tight uppercase ${event.isCompleted ? 'line-through text-dim opacity-50' : ''}`}>{event.title}</h4>
                             <p className="text-[10px] font-mono text-dim flex items-center gap-1">
                               <div className={`w-1 h-1 rounded-full ${event.priority === 'high' ? 'bg-rose-500 animate-pulse' : event.priority === 'medium' ? 'bg-amber-500' : 'bg-cyan-500'}`} />
                               {new Date(event.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                               <span className="opacity-50">/</span>
                               <span className="uppercase">{event.priority}</span>
                             </p>
                          </div>
                       </div>
                       <div className={`w-2 h-2 rounded-full ${event.priority === 'high' ? 'bg-rose-500' : event.priority === 'medium' ? 'bg-amber-500' : 'bg-cyan-500'}`} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 transition-colors" style={{ color: 'var(--color-dim)' }}>
                  <CalendarDays className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm">{t.noEventsScheduled}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WeeklyViewModal;
