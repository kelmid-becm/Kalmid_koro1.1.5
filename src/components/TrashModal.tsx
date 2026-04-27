import { AppTranslations } from '../locales/translations';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, RotateCcw, Trash } from 'lucide-react';
import { CalendarEvent } from '../types';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  trashEvents: CalendarEvent[];
  onRestore: (event: CalendarEvent) => void;
  onPermanentDelete: (id: string) => void;
  onEmptyTrash: () => void;
  t: AppTranslations;
  language: string;
}

const TrashModal: React.FC<TrashModalProps> = ({ 
  isOpen, 
  onClose, 
  trashEvents, 
  onRestore, 
  onPermanentDelete, 
  onEmptyTrash, 
  t, 
  language 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg theme-card overflow-hidden"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="p-6 border-b border-muted flex items-center justify-between bg-surface/50">
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-rose-500" />
                <h3 className="text-xl font-bold uppercase tracking-tighter">{t.trashTitle}</h3>
              </div>
              <div className="flex gap-2">
                {trashEvents.length > 0 && (
                  <button 
                    onClick={onEmptyTrash}
                    className="px-4 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                  >
                    {t.trashEmptyAction}
                  </button>
                )}
                <button onClick={onClose} className="p-2 hover:bg-zinc-800/10 rounded-full transition-colors">
                  <X className="w-5 h-5 text-dim" />
                </button>
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {trashEvents.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center opacity-20">
                  <Trash className="w-16 h-16 mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest">{t.archiveEmpty}</p>
                </div>
              ) : (
                trashEvents.map(event => (
                  <div key={event.id} className="p-4 border border-muted rounded-2xl flex items-center justify-between bg-input transition-all hover:border-indigo-500/30">
                    <div className="flex flex-col gap-1">
                      <h4 className="font-bold text-sm leading-tight text-dim/80">{event.title}</h4>
                      <p className="text-[10px] font-mono text-dim/40 uppercase tracking-widest">
                        {event.date} • {event.priority} Priority
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onRestore(event)}
                        className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                        title="Restore"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onPermanentDelete(event.id)}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Permanent Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TrashModal;
