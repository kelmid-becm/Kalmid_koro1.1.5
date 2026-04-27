/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CalendarEvent } from '../types';
import { db } from './db';

let _eventCache: CalendarEvent[] = [];

// Initialize cache
db.events.toArray().then(events => { _eventCache = events; });

export const storage = {
  // Sync version for backward compatibility
  getEvents: (): CalendarEvent[] => _eventCache,

  // Async loader/refresher
  refreshEvents: async (): Promise<CalendarEvent[]> => {
    _eventCache = await db.events.toArray();
    return _eventCache;
  },

  getAllEvents: async (): Promise<CalendarEvent[]> => {
    return await storage.refreshEvents();
  },

  saveEvent: async (event: CalendarEvent): Promise<void> => {
    await db.events.put(event);
    await storage.refreshEvents();
  },

  deleteEvent: async (id: string): Promise<void> => {
    const event = await db.events.get(id);
    if (!event) return; // Do nothing if the event doesn't exist
    await db.events.delete(id);
    await storage.refreshEvents();
  },

  // Added back for backward compatibility
  updateEvent: async (id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> => {
    const event = await db.events.get(id);
    if (!event) return null;
    const updated = { ...event, ...updates };
    await db.events.put(updated);
    await storage.refreshEvents();
    return updated;
  },

  toggleComplete: async (id: string): Promise<CalendarEvent | null> => {
    const event = await db.events.get(id);
    if (!event) return null;
    const updated = { ...event, isCompleted: !event.isCompleted };
    await db.events.put(updated);
    await storage.refreshEvents();
    return updated;
  },

  getTrash: (): CalendarEvent[] => [],
  restoreEvent: async (_id: string) => {},
  deleteFromTrash: async (_id: string) => {},
  emptyTrash: () => {},
  
  clearAll: async () => {
    await db.events.clear();
    await storage.refreshEvents();
  },
  
  clearDay: async (dateString: string) => {
    const events = await storage.getAllEvents();
    const toDelete = events.filter(e => e.date === dateString);
    for (const e of toDelete) {
        await db.events.delete(e.id);
    }
    await storage.refreshEvents();
  },

  getHabits: async (): Promise<import('../types').Habit[]> => {
    return await db.habits.toArray();
  },

  getBackground: (): string | null => localStorage.getItem('kelmid_bg'),
  setBackground: (img: string | null) => {
    if (img) localStorage.setItem('kelmid_bg', img);
    else localStorage.removeItem('kelmid_bg');
  },

  getLanguage: (): import('../locales/translations').Language => 
    (localStorage.getItem('kelmid_lang') as any) || 'ar',
  setLanguage: (lang: string) => localStorage.setItem('kelmid_lang', lang),

  getTheme: (): string => localStorage.getItem('kelmid_theme') || 'dark',
  setTheme: (theme: string) => localStorage.setItem('kelmid_theme', theme),

  getGeminiKey: (): string => localStorage.getItem('kelmid_gemini_key') || '',
  setGeminiKey: (key: string) => localStorage.setItem('kelmid_gemini_key', key),

  getSilentMode: (): boolean => localStorage.getItem('kelmid_silent_mode') === 'true',
  setSilentMode: (silent: boolean) => localStorage.setItem('kelmid_silent_mode', String(silent)),
  
  getChatHistory: (): import('../types').ChatMessage[] => {
    const saved = localStorage.getItem('kelmid_chat_history');
    return saved ? JSON.parse(saved) : [];
  },
  saveChatHistory: (history: import('../types').ChatMessage[]) => {
    localStorage.setItem('kelmid_chat_history', JSON.stringify(history.slice(-50)));
  },
  clearChatHistory: () => localStorage.removeItem('kelmid_chat_history'),
  
  getPendingCommands: (): string[] => {
    const saved = localStorage.getItem('kelmid_pending_commands');
    return saved ? JSON.parse(saved) : [];
  },
  addPendingCommand: (cmd: string) => {
    const cmds = storage.getPendingCommands();
    localStorage.setItem('kelmid_pending_commands', JSON.stringify([...cmds, cmd]));
  },
  clearPendingCommands: () => localStorage.removeItem('kelmid_pending_commands'),

  getBusRoutes: async (): Promise<import('../types').BusRoute[]> => {
    return await db.busRoutes.toArray();
  },
};
