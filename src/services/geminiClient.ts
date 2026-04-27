/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { useSettingsStore } from "../store/useSettingsStore";

// Standard client-side initialization following gemini-api skill
const getApiKey = () => {
  // Priority 1: Environment variable (System provided)
  if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
      return process.env.GEMINI_API_KEY;
  }
  // Priority 2: User provided via UI (Fallback)
  const fromLocal = useSettingsStore.getState().settings.geminiKey;
  if (fromLocal) return fromLocal;

  return '';
};

let aiClient: GoogleGenAI | null = null;

export const getGeminiClient = () => {
    if (!aiClient) {
        const apiKey = getApiKey();
        if (!apiKey) {
            console.warn("GEMINI_API_KEY is not defined in the environment.");
        }
        aiClient = new GoogleGenAI({ apiKey });
    }
    return aiClient;
};

export const geminiClient = {
    async processCommand(prompt: string, context: { events: any[], habits: any[] }, signal?: AbortSignal) {
        const ai = getGeminiClient();
        
        const contextStr = `
Current Context:
Events: ${JSON.stringify(context.events)}
Habits: ${JSON.stringify(context.habits)}
Current Time: ${new Date().toLocaleString()}
`;

        try {
            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: contextStr + "\n\nUser Request: " + prompt + "\n\nInstructions: You are a smart assistant. You CAN see the user's current schedule provided in the context. Answer their questions about their schedule or execute actions. Return ONLY raw JSON in this format: {\"action\": \"CREATE_EVENT\" | \"ADD_HABIT\" | \"GET_BUS_SCHEDULE\" | \"NONE\", \"data\": {\"message\": \"Your verbal response to the user\", ...}}",
            });

            const text = response.text || "";
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            
            try {
                const jsonResponse = JSON.parse(jsonStr);
                return { action: jsonResponse.action, data: jsonResponse.data };
            } catch (e) {
                return { action: "NONE", data: { message: text } };
            }
        } catch (error: any) {
            console.error("Gemini Client Error:", error);
            throw error;
        }
    }
};
