import { AppTranslations } from '../locales/translations';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Activity } from 'lucide-react';
import { CalendarEvent } from '../types';

interface MissedEventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
  onConfirm: (eventId: string) => void;
  onSnooze: (eventId: string) => void;
  t: AppTranslations;
  language: string;
}

const MissedEventModal: React.FC<MissedEventModalProps> = ({ event, onClose, onConfirm, onSnooze, t, language }) => {
  return (
    <AnimatePresence>
      {event && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-[320px] theme-card p-6 shadow-2xl overflow-hidden relative"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-white text-xl font-bold">{t.missedEventTitle}</h3>
            </div>
            <p className="text-dim text-sm mb-8 leading-relaxed">
              {t.missedEventMessage.replace('{title}', event.title)}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => onConfirm(event.id)}
                className="btn-primary w-full py-4 flex items-center justify-center gap-2"
              >
                <Activity className="w-4 h-4" /> {t.markAsCompleted}
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onSnooze(event.id)}
                  className="btn-secondary py-3 text-[10px] font-bold uppercase tracking-widest"
                >
                  {t.snooze15m}
                </button>
                <button
                  onClick={onClose}
                  className="py-3 bg-zinc-950 hover:bg-zinc-900 text-dim rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-muted transition-all"
                >
                  {t.ignore}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MissedEventModal;
