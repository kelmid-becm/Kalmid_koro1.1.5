/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { CalendarEvent } from "../types";
import { getDecryptedGeminiKey } from "./apiKeyManager";

const getAiClient = async () => new GoogleGenAI({ apiKey: await getDecryptedGeminiKey() });

export const imageAIService = {
  /**
   * Analyzes an image of a schedule and extracts events, 
   * returning them for user confirmation.
   */
  async extractScheduleFromImage(base64Data: string, mimeType: string): Promise<Partial<CalendarEvent>[]> {
    const apiKey = await getDecryptedGeminiKey();
    if (!apiKey) throw new Error("API_KEY_MISSING");
    
    const ai = await getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: `System: You are an ultra-precise OCR and context analysis engine for 'Kelmid'.

Task: Extract events from this image. It might be a messy handwritten note, a formal table, or a casual scene with time elements.

Strict Rules:
1. DEEP REASONING: If handwriting is messy, use contextual clues to guess the correct words and times.
2. TIME ACCURACY: Convert all times to 24-hour HH:mm exactly. If you see '2:30 PM', it MUST be '14:30'.
3. DAY DETECTION: Identify days (الأحد, Monday, etc.) and append them logically to the title or description if needed.
4. MISSING DATA: If end time is missing, assume 1 hour duration.
5. NO SAVING: Just return the structured data.
6. OUTPUT: Return valid JSON array only.` }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Full event name as written" },
              startTime: { type: Type.STRING, description: "Start time normalized to HH:mm" },
              endTime: { type: Type.STRING, description: "End time normalized to HH:mm" },
              description: { type: Type.STRING, description: "Any extra info like room number or day" },
              priority: { type: Type.STRING, enum: ["low", "medium", "high"] }
            },
            required: ["title", "startTime", "endTime"]
          }
        }
      }
    });

    try {
      const text = response.text || '[]';
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse Gemini response", e);
      return [];
    }
  }
};
