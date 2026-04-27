import { AppTranslations } from '../locales/translations';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Bell, AlertCircle, AlarmClock } from 'lucide-react';
import { CalendarEvent } from '../types';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (event: Omit<CalendarEvent, 'id'>) => void;
  t: AppTranslations;
  language: string;
  initialDate?: Date;
}

const AddEventModal: React.FC<AddEventModalProps> = ({ isOpen, onClose, onAdd, t, language, initialDate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState(initialDate ? getLocalDateString(initialDate) : getLocalDateString(new Date()));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [enableAlarm, setEnableAlarm] = useState(false);
  const [enableReminder, setEnableReminder] = useState(true);
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>([]);

  useEffect(() => {
    if (initialDate) {
      setDate(getLocalDateString(initialDate));
    }
  }, [initialDate, isOpen]);

  const daysOfWeek = [
    { key: '0', label: t.sun },
    { key: '1', label: t.mon },
    { key: '2', label: t.tue },
    { key: '3', label: t.wed },
    { key: '4', label: t.thu },
    { key: '5', label: t.fri },
    { key: '6', label: t.sat },
  ];

  const toggleDay = (dayKey: string) => {
    setRecurrenceDays(prev => 
      prev.includes(dayKey) ? prev.filter(d => d !== dayKey) : [...prev, dayKey]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateStr = date;
    
    onAdd({
      title,
      description,
      date: dateStr,
      startTime: `${dateStr}T${startTime}:00`,
      endTime: `${dateStr}T${endTime}:00`,
      priority,
      enableAlarm,
      enableReminder,
      type: 'personal',
      isCompleted: false,
      isRecurring: recurrenceDays.length > 0,
      recurrenceDays: recurrenceDays.length > 0 ? recurrenceDays : undefined,
      recurrencePattern: recurrenceDays.length > 0 ? 'weekly' : 'none'
    });
    
    setTitle('');
    setDescription('');
    setRecurrenceDays([]);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md theme-card overflow-hidden"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="p-6 border-b border-muted flex items-center justify-between">
              <h3 className="text-xl font-bold">{t.addAppointment}</h3>
              <button onClick={onClose} className="p-2 hover:bg-zinc-800/10 rounded-full transition-colors">
                <X className="w-5 h-5 text-dim" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-dim mb-2.5">{t.eventTitle}</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="..."
                  className="w-full theme-input"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-dim mb-2.5">{t.selectDate}</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full theme-input pl-10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-dim mb-2.5">{t.eventStartLabel}</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
                    <input 
                      type="time" 
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full theme-input pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-dim mb-2.5">{t.eventEndLabel}</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
                    <input 
                      type="time" 
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full theme-input pl-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-dim mb-2.5">{t.customDays} ({t.recurrence})</label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map(day => (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => toggleDay(day.key)}
                      className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all border ${recurrenceDays.includes(day.key) ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-surface border-muted text-dim hover:border-dim'}`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-dim mb-2.5">{t.eventPriorityLabel}</label>
                <div className="flex gap-2 p-1.5 bg-surface border border-muted rounded-xl">
                  {(['low', 'medium', 'high'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider ${priority === p ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-dim hover:bg-white/5'}`}
                    >
                      {t[p]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-muted glass">
                 <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${enableAlarm ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-white/5 text-dim border border-white/5'}`}>
                      <AlarmClock className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold tracking-tight">{t.activateAlarm}</span>
                 </div>
                 <button 
                  type="button"
                  onClick={() => setEnableAlarm(!enableAlarm)}
                  className={`w-11 h-6 rounded-full transition-all relative ${enableAlarm ? 'bg-primary' : 'bg-muted'}`}
                 >
                    <div className={`w-4.5 h-4.5 bg-white rounded-full absolute top-0.75 transition-all shadow-sm ${enableAlarm ? (language === 'ar' ? 'right-5.75' : 'left-5.75') : (language === 'ar' ? 'right-0.75' : 'left-0.75')}`} />
                 </button>
              </div>

              <button type="submit" className="btn-primary w-full py-4 mt-2 font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-primary/20">
                <Calendar className="w-4 h-4" />
                {t.createEvent}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddEventModal;
