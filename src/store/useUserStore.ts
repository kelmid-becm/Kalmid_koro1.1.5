/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { create } from 'zustand';
import { db } from '../services/db';
import { UserStats } from '../types';

interface UserStore {
  stats: UserStats;
  fetchStats: () => Promise<void>;
  addXp: (amount: number) => Promise<void>;
  incrementTasks: (priority: 'low' | 'medium' | 'high') => Promise<void>;
  checkDailyProgress: (habits: import('../types').Habit[]) => Promise<{ penalized: boolean; message?: string }>;
}

const DEFAULT_STATS: UserStats = {
  id: 'current-user',
  xp: 0,
  level: 1,
  totalTasksCompleted: 0,
  activeStreaks: 0,
  lastActiveDate: new Date().toISOString().split('T')[0]
};

export const useUserStore = create<UserStore>((set, get) => ({
  stats: DEFAULT_STATS,
  fetchStats: async () => {
    let stats = await db.userStats.get('current-user');
    if (!stats) {
      stats = DEFAULT_STATS;
      await db.userStats.put(stats);
    }
    set({ stats });
  },
  addXp: async (amount: number) => {
    const { stats } = get();
    const newXp = stats.xp + amount;
    const nextLevelThreshold = stats.level * 100;
    
    let newLevel = stats.level;
    let finalXp = newXp;
    
    if (finalXp >= nextLevelThreshold) {
      newLevel += 1;
      finalXp -= nextLevelThreshold;
    }
    
    const updatedStats = { ...stats, xp: finalXp, level: newLevel };
    await db.userStats.update('current-user', updatedStats);
    set({ stats: updatedStats });
  },
  incrementTasks: async (priority: 'low' | 'medium' | 'high') => {
    const { stats } = get();
    const updatedStats = { ...stats, totalTasksCompleted: stats.totalTasksCompleted + 1 };
    await db.userStats.update('current-user', updatedStats);
    set({ stats: updatedStats });
    
    // Tiered XP reward: High=20, Medium=10, Low=5
    const xpReward = priority === 'high' ? 20 : priority === 'medium' ? 10 : 5;
    get().addXp(xpReward);
  },
  checkDailyProgress: async (habits: import('../types').Habit[]) => {
    const { stats } = get();
    const today = new Date().toISOString().split('T')[0];
    
    if (stats.lastActiveDate === today) return { penalized: false };

    // Check if any habits were due yesterday but not completed
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    let penaltyMessage = '';
    let shouldPenalize = false;

    if (habits.length > 0) {
      const incompleteHabits = habits.filter(h => !h.history.includes(yesterdayStr));
      if (incompleteHabits.length > 0) {
        shouldPenalize = true;
        penaltyMessage = `سيدي، لقد تم خصم 15 XP لأنك لم تنجز عاداتك بالأمس: ${incompleteHabits.map(h => h.name).join('، ')}.`;
      }
    }

    const updatedStats = { 
      ...stats, 
      lastActiveDate: today,
      xp: shouldPenalize ? Math.max(0, stats.xp - 15) : stats.xp
    };

    await db.userStats.update('current-user', updatedStats);
    set({ stats: updatedStats });

    return { penalized: shouldPenalize, message: penaltyMessage };
  }
}));
