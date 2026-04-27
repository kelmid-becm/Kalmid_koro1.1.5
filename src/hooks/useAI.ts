/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { getDecryptedGeminiKey } from '../services/apiKeyManager';

export interface AICommand {
  action: 'add' | 'delete' | 'update' | 'query' | 'unknown';
  title?: string;
  time?: string; // HH:MM
  date?: string; // YYYY-MM-DD
  priority?: 'low' | 'medium' | 'high';
  description?: string;
}

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Parses user input into a structured command WITHOUT executing it.
   */
  const parseCommand = async (userInput: string, today: string): Promise<AICommand> => {
    setLoading(true);
    setError(null);

    const prompt = `
      You are a command parser for a planner app.
      Your task is to parse the following user input: "${userInput}"
      Today is ${today}.
      If "today" is mentioned, use ${today}.
      If "tomorrow" is mentioned, calculate the date for tomorrow based on today.
      If "next week" is mentioned, calculate the date for 7 days from today.
      Return ONLY a JSON object with this structure (no markdown):
      {
        "action": "add" | "delete" | "update" | "query" | "unknown",
        "title": string | undefined,
        "time": "HH:MM" | undefined,
        "date": "YYYY-MM-DD" | undefined,
        "priority": "low" | "medium" | "high" | undefined,
        "description": string | undefined
      }
      If the action is unclear, set action to "unknown".
      Extract time in HH:MM format if mentioned (e.g. 13:30).
      Extract date in YYYY-MM-DD format if mentioned.
    `;

    try {
      const { API_URL } = await import('../config/api');
      const res = await fetch(`${API_URL}/api/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const responseText = data.response || '';

      // If the response is already an object (from the server logic)
      if (typeof responseText === 'object') {
          return {
              action: (responseText.action?.toLowerCase() || 'unknown') as any,
              title: responseText.data?.title,
              time: responseText.data?.time,
              date: responseText.data?.date,
              priority: responseText.data?.priority,
              description: responseText.data?.message || responseText.data?.description
          };
      }

      // Basic sanitization of raw response if it's text
      const jsonStr = typeof responseText === 'string' 
        ? responseText.replace(/```json/g, '').replace(/```/g, '').trim()
        : JSON.stringify(responseText);
        
      return JSON.parse(jsonStr) as AICommand;
    } catch (err: unknown) {
      console.warn("AI Backend Parsing Error, falling back to client-side:", err);
      // Fallback to purely client-side parsing if backend fails (e.g. in exported APK)
      try {
        const apiKey = await getDecryptedGeminiKey();
        if (apiKey) {
           const { GoogleGenAI } = await import("@google/genai");
           const ai = new GoogleGenAI({ apiKey });
           const response = await ai.models.generateContent({
               model: "gemini-3.1-pro-preview",
               contents: prompt
           });
           const text = response.text || "";
           const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
           return JSON.parse(jsonStr) as AICommand;
        }
      } catch (clientErr) {
         console.error("Client side fallback parsing failed:", clientErr);
      }
      
      setError(err instanceof Error ? err.message : 'An error occurred while communicating with the AI service.');
      return { action: 'unknown' };
    } finally {
      setLoading(false);
    }
  };

  return {
    parseCommand,
    loading,
    error,
  };
}
