/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { create } from 'zustand';
import { db } from '../services/db';
import { Habit } from '../types';
import { useUserStore } from './useUserStore';

interface HabitStore {
  habits: Habit[];
  fetchHabits: () => Promise<void>;
  toggleHabit: (id: string) => Promise<void>;
  addHabit: (name: string) => Promise<void>;
  updateHabit: (habit: Habit) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
}

export const useHabitStore = create<HabitStore>((set) => ({
  habits: [],
  fetchHabits: async () => {
    const habits = await db.habits.toArray();
    set({ habits });
  },
  toggleHabit: async (id: string) => {
    const habit = await db.habits.get(id);
    if (!habit) return;

    const today = new Date().toISOString().split('T')[0];
    const isDone = habit.history.includes(today);
    const updatedHabit = {
        ...habit,
        completedToday: !isDone,
        streak: !isDone ? habit.streak + 1 : Math.max(0, habit.streak - 1),
        history: !isDone ? [...habit.history, today] : habit.history.filter(d => d !== today),
        lastCompleted: !isDone ? today : (habit.history.length > 1 ? habit.history[habit.history.length - 2] : undefined)
    };

    await db.habits.update(id, updatedHabit);
    set(state => ({
        habits: state.habits.map(h => h.id === id ? updatedHabit : h)
    }));
    
    // Reward XP on first completion today
    if (!isDone) {
      useUserStore.getState().addXp(15);
    }
  },
  addHabit: async (name: string) => {
    const newHabit: Habit = {
        id: crypto.randomUUID(),
        name,
        streak: 0,
        history: [],
        completedToday: false,
        recurrenceDays: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
    };
    try {
        await db.habits.put(newHabit);
        set(state => ({ habits: [...state.habits, newHabit] }));
    } catch (error) {
        console.error("Store: Failed to add habit to db:", error);
    }
  },
  updateHabit: async (habit: Habit) => {
    await db.habits.put(habit);
    set(state => ({
        habits: state.habits.map(h => h.id === habit.id ? habit : h)
    }));
  },
  deleteHabit: async (id: string) => {
    await db.habits.delete(id);
    set(state => ({
        habits: state.habits.filter(h => h.id !== id)
    }));
  }
}));
