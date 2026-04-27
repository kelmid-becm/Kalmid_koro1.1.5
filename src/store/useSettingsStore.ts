/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { db } from '../services/db';
import { ChatMessage, UserSettings } from '../types';

export interface ExtendedUserSettings extends UserSettings {
  background: string | null;
  silentMode: boolean;
  onboardingShown: boolean;
  pendingCommands: string[];
  voiceMode: boolean;
}

interface SettingsStore {
  settings: ExtendedUserSettings;
  chatHistory: ChatMessage[];
  initialized: boolean;
  
  init: () => Promise<void>;
  updateSettings: (updates: Partial<ExtendedUserSettings>) => Promise<void>;
  
  addChatMessage: (msg: ChatMessage) => Promise<void>;
  updateChatMessage: (id: string, updates: Partial<ChatMessage>) => Promise<void>;
  clearChatHistory: () => Promise<void>;

  addPendingCommand: (cmd: string) => Promise<void>;
  clearPendingCommands: () => Promise<void>;
}

const DEFAULT_SETTINGS: ExtendedUserSettings = {
  id: 'main',
  language: 'ar',
  theme: 'dark',
  geminiKey: '',
  background: null,
  silentMode: false,
  onboardingShown: false,
  pendingCommands: [],
  voiceMode: false
};

// Fallback migration from localStorage if needed during init
const migrateFromLocalStorage = (settings: ExtendedUserSettings): ExtendedUserSettings => {
  let migrated = false;
  const migratedSettings = { ...settings };
  
  const lsTheme = localStorage.getItem('kelmid_theme');
  if (lsTheme && lsTheme !== settings.theme) { migratedSettings.theme = lsTheme as 'light'|'dark'; migrated = true; }
  
  const lsLang = localStorage.getItem('kelmid_lang');
  if (lsLang && lsLang !== settings.language) { migratedSettings.language = lsLang as 'en'|'fr'|'ar'; migrated = true; }
  
  const lsKey = localStorage.getItem('kelmid_gemini_key');
  if (lsKey && lsKey !== settings.geminiKey) { migratedSettings.geminiKey = lsKey; migrated = true; }
  
  const lsBg = localStorage.getItem('kelmid_bg');
  if (lsBg && lsBg !== settings.background) { migratedSettings.background = lsBg; migrated = true; }
  
  const lsSilent = localStorage.getItem('kelmid_silent_mode');
  if (lsSilent !== null && (lsSilent === 'true') !== settings.silentMode) { migratedSettings.silentMode = lsSilent === 'true'; migrated = true; }

  const lsOnboarding = localStorage.getItem('kelmid_onboarding_shown');
  if (lsOnboarding !== null && (lsOnboarding === 'true') !== settings.onboardingShown) { migratedSettings.onboardingShown = lsOnboarding === 'true'; migrated = true; }

  const lsPending = localStorage.getItem('kelmid_pending_commands');
  if (lsPending) {
     try {
       const parsed = JSON.parse(lsPending);
       if (parsed.length !== settings.pendingCommands.length) {
         migratedSettings.pendingCommands = parsed;
         migrated = true;
       }
     } catch(e){}
  }

  return migratedSettings;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  chatHistory: [],
  initialized: false,

  init: async () => {
    let settings = await db.userSettings.get('main') as ExtendedUserSettings | undefined;
    
    if (!settings) {
      settings = DEFAULT_SETTINGS;
      settings = migrateFromLocalStorage(settings);
      await db.userSettings.put(settings);
    } else {
      // One time migration check just in case
      if (localStorage.getItem('kelmid_onboarding_shown')) {
         const migrated = migrateFromLocalStorage(settings);
         if (JSON.stringify(migrated) !== JSON.stringify(settings)) {
           settings = migrated;
           await db.userSettings.put(settings);
         }
      }
    }

    // Also try to migrate chat history if it's empty
    let chatHistory = await db.chatHistory.toArray();
    if (chatHistory.length === 0) {
      const lsChat = localStorage.getItem('kelmid_chat_history');
      if (lsChat) {
         try {
           chatHistory = JSON.parse(lsChat);
           for (const msg of chatHistory) {
             await db.chatHistory.put(msg);
           }
         } catch(e) {}
      }
    }

    // Now clean up localStorage
    localStorage.removeItem('kelmid_theme');
    localStorage.removeItem('kelmid_lang');
    localStorage.removeItem('kelmid_gemini_key');
    localStorage.removeItem('kelmid_bg');
    localStorage.removeItem('kelmid_silent_mode');
    localStorage.removeItem('kelmid_onboarding_shown');
    localStorage.removeItem('kelmid_pending_commands');
    localStorage.removeItem('kelmid_chat_history');
    localStorage.removeItem('hasSeenSettings');
    localStorage.removeItem('smart_planner_events');

    set({ settings, chatHistory, initialized: true });
  },

  updateSettings: async (updates: Partial<ExtendedUserSettings>) => {
    const { settings } = get();
    const updated = { ...settings, ...updates };
    await db.userSettings.put(updated);
    set({ settings: updated });
  },

  addChatMessage: async (msg: ChatMessage) => {
    await db.chatHistory.put(msg);
    set(state => {
      const newHistory = [...state.chatHistory, msg];
      // Keep only last 50
      if (newHistory.length > 50) {
         const toRemove = newHistory[0];
         db.chatHistory.delete(toRemove.id);
         return { chatHistory: newHistory.slice(1) };
      }
      return { chatHistory: newHistory };
    });
  },

  updateChatMessage: async (id: string, updates: Partial<ChatMessage>) => {
     const { chatHistory } = get();
     const existing = chatHistory.find(m => m.id === id);
     if (!existing) return;
     const updated = { ...existing, ...updates };
     await db.chatHistory.put(updated);
     set({ chatHistory: chatHistory.map(m => m.id === id ? updated : m) });
  },

  clearChatHistory: async () => {
    await db.chatHistory.clear();
    set({ chatHistory: [] });
  },

  addPendingCommand: async (cmd: string) => {
    const { settings, updateSettings } = get();
    await updateSettings({ pendingCommands: [...settings.pendingCommands, cmd] });
  },

  clearPendingCommands: async () => {
    await get().updateSettings({ pendingCommands: [] });
  }
}));
