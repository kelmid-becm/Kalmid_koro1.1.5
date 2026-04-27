/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from './db';
import { decrypt } from './securityService';
import { useSettingsStore } from '../store/useSettingsStore';

export const getDecryptedGeminiKey = async (): Promise<string> => {
  // Priority 1: Environment variable (System provided)
  if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  
  // Priority 2: Security Vault (Encrypted)
  try {
      const settings = await db.assistantSettings.get('settings');
      if (settings?.providers?.gemini?.enabled && settings.providers.gemini.apiKey) {
          const decrypted = await decrypt(settings.providers.gemini.apiKey);
          if (decrypted) return decrypted;
      }
  } catch (e) {
      console.error("Failed to read encrypted key from vault", e);
  }

  // Priority 3: Fallback standard local settings geminiKey
  const fromLocal = useSettingsStore.getState().settings.geminiKey;
  if (fromLocal) return fromLocal;

  // Priority 4: Vite ENV
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_GEMINI_API_KEY) {
    return (import.meta as any).env.VITE_GEMINI_API_KEY;
  }
  return '';
};
