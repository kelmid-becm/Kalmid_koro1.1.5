import { AppTranslations } from '../locales/translations';
import React from 'react';
import { motion } from 'motion/react';
import { UserStats } from '../types';

export const LevelBadge: React.FC<{ stats: UserStats, t: AppTranslations }> = React.memo(({ stats, t }) => {
  const nextLevelXp = stats.level * 100;
  const progress = (stats.xp / nextLevelXp) * 100;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <div className="bg-indigo-600 px-2 py-0.5 rounded-lg text-[10px] font-bold text-white shadow-lg shadow-indigo-600/30">
          LVL {stats.level}
        </div>
        <span className="text-[10px] font-mono text-dim uppercase tracking-widest">{stats.xp}/{nextLevelXp} XP</span>
      </div>
      <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_8px_rgba(129,140,248,0.5)]"
        />
      </div>
    </div>
  );
});
