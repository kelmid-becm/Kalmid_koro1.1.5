/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { db } from '../services/db';
import { CalendarEvent } from '../types';

interface CalendarStore {
  events: CalendarEvent[];
  trash: CalendarEvent[];
  loading: boolean;
  
  loadEvents: () => Promise<void>;
  addEvent: (title: string, date: string, startTime: string, endTime: string, priority: 'low' | 'medium' | 'high') => Promise<CalendarEvent>;
  addRawEvent: (event: CalendarEvent) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  restoreEvent: (id: string) => Promise<void>;
  deleteFromTrash: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  clearAll: () => Promise<void>;
  clearDay: (dateString: string) => Promise<void>;
  validateTime: (time: string) => boolean;
}

const validateTime = (time: string) => {
  if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) return true;
  const isoRegex = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?.*$/;
  if (isoRegex.test(time)) return true;
  const d = new Date(time);
  return !isNaN(d.getTime());
};

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  events: [],
  trash: [],
  loading: true,

  validateTime,

  loadEvents: async () => {
    set({ loading: true });
    const events = await db.events.toArray();
    const trash = await db.trashEvents.toArray();
    set({ events, trash, loading: false });
  },

  addEvent: async (title, date, startTime, endTime, priority) => {
    if (!validateTime(startTime) || !validateTime(endTime)) {
      throw new Error('Invalid time format. Please use HH:MM.');
    }

    const finalStartTime = startTime.includes('T') ? startTime : `${date}T${startTime}:00`;
    const finalEndTime = endTime.includes('T') ? endTime : `${date}T${endTime}:00`;

    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title,
      date,
      startTime: finalStartTime,
      endTime: finalEndTime,
      priority,
      type: 'personal',
      isCompleted: false,
    };

    await db.events.put(newEvent);
    set(state => ({ events: [...state.events, newEvent] }));
    return newEvent;
  },

  addRawEvent: async (event: CalendarEvent) => {
    await db.events.put(event);
    set(state => ({ events: [...state.events, event] }));
  },

  deleteEvent: async (id: string) => {
    const event = await db.events.get(id);
    if (!event) return;
    await db.events.delete(id);
    await db.trashEvents.put(event);
    set(state => ({
      events: state.events.filter(e => e.id !== id),
      trash: [...state.trash, event]
    }));
  },

  updateEvent: async (id: string, updates: Partial<CalendarEvent>) => {
    const event = await db.events.get(id);
    if (!event) return;
    const updated = { ...event, ...updates };
    await db.events.put(updated);
    set(state => ({ events: state.events.map(e => e.id === id ? updated : e) }));
  },

  toggleComplete: async (id: string) => {
    const event = await db.events.get(id);
    if (!event) return;
    const updated = { ...event, isCompleted: !event.isCompleted };
    await db.events.put(updated);
    set(state => ({ events: state.events.map(e => e.id === id ? updated : e) }));
  },

  restoreEvent: async (id: string) => {
    const event = await db.trashEvents.get(id);
    if (!event) return;
    await db.trashEvents.delete(id);
    await db.events.put(event);
    set(state => ({
      trash: state.trash.filter(e => e.id !== id),
      events: [...state.events, event]
    }));
  },

  deleteFromTrash: async (id: string) => {
    await db.trashEvents.delete(id);
    set(state => ({ trash: state.trash.filter(e => e.id !== id) }));
  },

  emptyTrash: async () => {
    await db.trashEvents.clear();
    set({ trash: [] });
  },

  clearAll: async () => {
    await db.events.clear();
    set({ events: [] });
  },

  clearDay: async (dateString: string) => {
    const { events } = get();
    const toDelete = events.filter(e => e.date === dateString);
    for (const e of toDelete) {
      await db.events.delete(e.id);
      await db.trashEvents.put(e);
    }
    set(state => ({ 
      events: state.events.filter(e => e.date !== dateString),
      trash: [...state.trash, ...toDelete]
    }));
  }
}));
