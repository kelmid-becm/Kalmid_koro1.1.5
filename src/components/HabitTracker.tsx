import { AppTranslations } from '../locales/translations';
import React, { useEffect, useState } from 'react';
import * as Lucide from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useHabitStore } from '../store/useHabitStore';
import { Habit } from '../types';
import { Language } from '../locales/translations';

interface HabitTrackerProps {
  t: AppTranslations;
  language: Language;
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({ t, language }) => {
  const { habits, fetchHabits, toggleHabit, addHabit, updateHabit, deleteHabit } = useHabitStore();
  const [newHabitName, setNewHabitName] = useState('');
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  useEffect(() => {
    fetchHabits();
    
    // Listen for custom event from App.tsx to open manager
    const handleOpenManager = () => setIsManagerOpen(true);
    window.addEventListener('open-habits-manager', handleOpenManager);
    return () => window.removeEventListener('open-habits-manager', handleOpenManager);
  }, [fetchHabits]);

  const handleAddHabit = async () => {
    if (!newHabitName.trim()) {
        return;
    }
    try {
        await addHabit(newHabitName);
        setNewHabitName('');
    } catch (error) {
        console.error("Failed to add habit:", error);
    }
  };

  const daysOfWeekAr = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
  const daysOfWeekEn = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const daysOfWeekFr = ['Sam', 'Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];
  
  const daysOfWeek = language === 'ar' ? daysOfWeekAr : language === 'fr' ? daysOfWeekFr : daysOfWeekEn;

  const completedCount = habits.filter(h => h.completedToday).length;
  const totalCount = habits.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Helpers to get a nice icon based on habit name
  const getHabitIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('قراءة') || lower.includes('read') || lower.includes('lir')) return <Lucide.BookOpen className="w-5 h-5" />;
    if (lower.includes('رياضة') || lower.includes('تمرين') || lower.includes('gym') || lower.includes('sport')) return <Lucide.Dumbbell className="w-5 h-5" />;
    if (lower.includes('ماء') || lower.includes('water') || lower.includes('eau')) return <Lucide.Droplets className="w-5 h-5" />;
    if (lower.includes('تعلم') || lower.includes('مهارة') || lower.includes('learn') || lower.includes('appren')) return <Lucide.PencilRuler className="w-5 h-5" />;
    if (lower.includes('تأمل') || lower.includes('صلاة') || lower.includes('meditat') || lower.includes('prière')) return <Lucide.PersonStanding className="w-5 h-5" />;
    if (lower.includes('نوم') || lower.includes('sleep') || lower.includes('مبكر') || lower.includes('dormir')) return <Lucide.Moon className="w-5 h-5" />;
    if (lower.includes('أكل') || lower.includes('طعام') || lower.includes('diet') || lower.includes('mang')) return <Lucide.Utensils className="w-5 h-5" />;
    return <Lucide.Activity className="w-5 h-5" />;
  };

  return (
    <>
      <div className="theme-card relative overflow-hidden">
         <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-indigo-500/10 rounded-xl">
                  <Lucide.Target className="w-4 h-4 text-indigo-400" />
               </div>
               <h3 className="font-bold tracking-tight text-sm">{t.dayProgress}</h3>
            </div>
            <button onClick={() => setIsManagerOpen(true)} className="p-2 transition-colors rounded-full" style={{ color: 'var(--color-dim)' }}>
              <Lucide.ChevronLeft className={`w-4 h-4 ${language === 'ar' ? '' : 'rotate-180'}`} />
            </button>
         </div>
         
         <div className="flex items-center gap-8 mb-8">
            <div className="relative w-24 h-24 flex items-center justify-center">
               <svg className="w-full h-full -rotate-90">
                 <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" style={{ color: 'var(--color-input)' }} />
                 <circle 
                   cx="48" 
                   cy="48" 
                   r="40" 
                   stroke="currentColor" 
                   strokeWidth="8" 
                   fill="transparent" 
                   className="text-indigo-500 transition-all duration-1000" 
                   strokeDasharray={2 * Math.PI * 40}
                   strokeDashoffset={2 * Math.PI * 40 * (1 - progressPercent / 100)}
                   strokeLinecap="round"
                 />
               </svg>
               <div className="absolute flex flex-col items-center">
                  <span className="text-xl font-bold leading-none">{progressPercent}%</span>
               </div>
            </div>

            <div className="flex-1 space-y-1">
               <div className="flex items-center justify-between">
                  <span className="text-xs font-medium opacity-60 font-sans">{t.completedFraction}</span>
                  <span className="text-xs font-bold font-mono">{completedCount} / {totalCount}</span>
               </div>
               <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-input)' }}>
                  <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
               </div>
               <p className="text-[10px] opacity-40 pt-1">
                  {habits.length === 0 ? t.noHabitsAdded : (language === 'ar' ? "توجد عادات قيد المتابعة" : "Active habits tracking")}
               </p>
            </div>
         </div>

         <button 
           onClick={() => setIsManagerOpen(true)}
           className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-indigo-900/30 transition-all"
         >
           <Lucide.Plus className="w-4 h-4" />
           {language === 'ar' ? 'إضافة عادة' : t.addHabitLabel}
         </button>
      </div>

      {/* Manager Modal */}
      {isManagerOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100]" onClick={() => setIsManagerOpen(false)} dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="p-6 rounded-3xl border w-full max-w-[320px] max-h-[90vh] overflow-y-auto custom-scrollbar" style={{ backgroundColor: 'var(--color-sidebar)', borderColor: 'var(--color-border-muted)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--color-base)' }}><Lucide.Flame className="w-6 h-6 text-emerald-500" /> {t.manageHabits}</h3>
               <button onClick={() => setIsManagerOpen(false)} className="p-2 transition-colors rounded-full" style={{ backgroundColor: 'var(--color-input)', color: 'var(--color-dim)' }}>
                  <Lucide.X className="w-5 h-5"/>
               </button>
            </div>
            
            <div className="flex gap-2 mb-8">
              <input 
                value={newHabitName}
                onChange={e => setNewHabitName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddHabit()}
                placeholder={t.addHabitExample}
                className="flex-1 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none border transition-colors"
                style={{ backgroundColor: 'var(--color-input)', borderColor: 'var(--color-border-muted)', color: 'var(--color-base)' }}
              />
              <button onClick={handleAddHabit} className="bg-indigo-600 p-3 rounded-xl hover:bg-indigo-500 transition-all text-white shadow-lg shadow-indigo-600/20">
                <Lucide.Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {habits.map((h, hIdx) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0,
                      scale: h.completedToday ? 0.98 : 1,
                    }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={`habit-card-${h.id}-${hIdx}`} 
                    className={`flex flex-col p-4 rounded-2xl border gap-3 transition-all duration-500 ${h.completedToday ? 'shadow-inner' : 'shadow-sm'}`}
                    style={{ 
                      backgroundColor: h.completedToday ? 'var(--color-surface)' : 'var(--color-input)', 
                      borderColor: 'var(--color-border-muted)',
                      opacity: h.completedToday ? 0.8 : 1
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <button 
                           onClick={() => toggleHabit(h.id)} 
                           className={`p-2 rounded-xl transition-all relative ${h.completedToday ? 'text-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20' : 'bg-surface hover:text-indigo-400 opacity-60 hover:opacity-100'}`} 
                           style={{ color: h.completedToday ? undefined : 'var(--color-dim)' }}
                         >
                          <AnimatePresence mode="wait">
                            {h.completedToday ? (
                              <motion.div
                                key="checked"
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 45 }}
                              >
                                <Lucide.CheckCircle2 className="w-5 h-5" />
                              </motion.div>
                            ) : (
                              <motion.div
                                key="unchecked"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                              >
                                <Lucide.Circle className="w-5 h-5" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                         </button>
                         <span className={`transition-all duration-500 ${h.completedToday ? 'line-through font-medium opacity-40 translate-x-1' : 'font-medium'}`} style={{ color: 'var(--color-base)' }}>
                           {h.name}
                         </span>
                      </div>
                      <div className="flex items-center gap-2">
                          <motion.div 
                            animate={h.completedToday ? { scale: [1, 1.2, 1] } : {}}
                            className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2 py-1 rounded-lg border border-amber-500/20"
                          >
                             <Lucide.Flame className="w-3.5 h-3.5" />
                             <span className="font-mono font-bold text-xs">{h.streak}</span>
                          </motion.div>
                          <button onClick={() => setEditingHabit(h)} className="p-2 transition-colors rounded-xl bg-surface" style={{ color: 'var(--color-dim)' }}><Lucide.Edit2 className="w-4 h-4"/></button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal (nested) */}
      {editingHabit && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[110]" onClick={() => setEditingHabit(null)} dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="p-6 rounded-3xl border w-full max-w-sm space-y-5" style={{ backgroundColor: 'var(--color-sidebar)', borderColor: 'var(--color-border-muted)' }} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold" style={{ color: 'var(--color-base)' }}>{t.editHabit}</h3>
            <input 
                value={editingHabit.name}
                onChange={e => setEditingHabit({...editingHabit, name: e.target.value})}
                className="w-full rounded-xl p-3 border focus:outline-none focus:border-indigo-500 transition-colors"
                style={{ backgroundColor: 'var(--color-input)', borderColor: 'var(--color-border-muted)', color: 'var(--color-base)' }}
            />
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map((day, ix) => {
                const realDayId = daysOfWeekAr[ix]; 
                const isActive = editingHabit.recurrenceDays.includes(day) || editingHabit.recurrenceDays.includes(realDayId);
                return (
                <button
                    key={day}
                    onClick={() => setEditingHabit({
                       ...editingHabit, 
                       recurrenceDays: isActive
                         ? editingHabit.recurrenceDays.filter(d => d !== day && d !== realDayId) 
                         : [...editingHabit.recurrenceDays, day]
                    })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${isActive ? 'bg-indigo-600 text-white' : ''}`}
                    style={{ backgroundColor: isActive ? undefined : 'var(--color-input)', color: isActive ? undefined : 'var(--color-dim)', borderColor: 'var(--color-border-muted)' }}
                >
                  {day}
                </button>
              )})}
            </div>
            <div className="flex gap-2 pt-2">
                <button onClick={async () => { await updateHabit(editingHabit); setEditingHabit(null); }} className="flex-1 bg-indigo-600 py-3 rounded-xl text-white font-medium hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20">{t.saveChanges}</button>
                <button onClick={async () => { await deleteHabit(editingHabit.id); setEditingHabit(null); }} className="p-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 transition-colors"><Lucide.Trash2 className="w-5 h-5"/></button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
