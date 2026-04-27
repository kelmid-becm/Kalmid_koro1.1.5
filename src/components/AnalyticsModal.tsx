import { AppTranslations } from '../locales/translations';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import AnalyticsDashboard from './AnalyticsDashboard';
import { CalendarEvent, UserStats } from '../types';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  stats: UserStats;
  t: AppTranslations;
  language: string;
}

const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, onClose, events, stats, t, language }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
           <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-[500px] theme-card shadow-2xl overflow-hidden transition-colors"
          >
            <div className="p-4 border-b flex items-center justify-between transition-colors" dir={language === 'ar' ? 'rtl' : 'ltr'} style={{ borderColor: 'var(--color-border-muted)' }}>
              <h3 className="font-bold text-lg" style={{ color: 'var(--color-base)' }}>{t.analyticsMenu}</h3>
              <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 max-h-[80vh] overflow-y-auto no-scrollbar" style={{ backgroundColor: 'var(--color-surface)' }}>
              <AnalyticsDashboard events={events} stats={stats} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AnalyticsModal;
