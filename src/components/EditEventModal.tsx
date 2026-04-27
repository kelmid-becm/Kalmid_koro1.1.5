import { AppTranslations } from '../locales/translations';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Bell, Trash2, AlarmClock } from 'lucide-react';
import { CalendarEvent } from '../types';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (event: CalendarEvent) => void;
  event: CalendarEvent;
  t: AppTranslations;
  language: string;
}

const EditEventModal: React.FC<EditEventModalProps> = ({ isOpen, onClose, onUpdate, event, t, language }) => {
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description || '');
  const [date, setDate] = useState(event.date);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(event.priority);
  const [enableAlarm, setEnableAlarm] = useState(event.enableAlarm || false);
  const [enableReminder, setEnableReminder] = useState(event.enableReminder || true);
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>(event.recurrenceDays || []);

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

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setDate(event.date);
      setPriority(event.priority);
      setEnableAlarm(event.enableAlarm || false);
      setEnableReminder(event.enableReminder || true);
      setRecurrenceDays(event.recurrenceDays || []);
      
      const parseTime = (timeStr: string, dateStr: string) => {
        if (timeStr.includes('T')) return new Date(timeStr);
        return new Date(`${dateStr}T${timeStr}:00`);
      };

      const s = parseTime(event.startTime, event.date);
      const e = parseTime(event.endTime, event.date);

      if (!isNaN(s.getTime())) {
        const h = s.getHours().toString().padStart(2, '0');
        const m = s.getMinutes().toString().padStart(2, '0');
        setStartTime(`${h}:${m}`);
      } else {
        setStartTime(event.startTime);
      }
      
      if (!isNaN(e.getTime())) {
        const h = e.getHours().toString().padStart(2, '0');
        const m = e.getMinutes().toString().padStart(2, '0');
        setEndTime(`${h}:${m}`);
      } else {
        setEndTime(event.endTime);
      }
    }
  }, [event]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateStr = date;
    
    onUpdate({
      ...event,
      title,
      description,
      date: dateStr,
      startTime: `${dateStr}T${startTime}:00`,
      endTime: `${dateStr}T${endTime}:00`,
      priority,
      enableAlarm,
      enableReminder,
      isRecurring: recurrenceDays.length > 0,
      recurrenceDays: recurrenceDays.length > 0 ? recurrenceDays : undefined,
      recurrencePattern: recurrenceDays.length > 0 ? 'weekly' : 'none'
    });
    
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
              <h3 className="text-xl font-bold">{t.editAppointment}</h3>
              <button onClick={onClose} className="p-2 hover:bg-zinc-800/10 rounded-full transition-colors">
                <X className="w-5 h-5 text-dim" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-dim mb-2.5">{t.eventTitleLabel}</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
                {t.commitChanges}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditEventModal;
