/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { getDecryptedGeminiKey } from "./apiKeyManager";

let aiClient: GoogleGenAI | null = null;
let lastUsedKey: string | null = null;

export const getGeminiClient = async () => {
    const apiKey = await getDecryptedGeminiKey();
    if (!aiClient || apiKey !== lastUsedKey) {
        if (!apiKey) {
            console.warn("GEMINI_API_KEY is not defined in the environment.");
        }
        aiClient = new GoogleGenAI({ apiKey });
        lastUsedKey = apiKey;
    }
    return aiClient;
};

export const geminiClient = {
    async processCommand(prompt: string, context: { events: any[], habits: any[] }, signal?: AbortSignal) {
        const ai = await getGeminiClient();
        
        const contextStr = `
Current Context:
Events: ${JSON.stringify(context.events)}
Habits: ${JSON.stringify(context.habits)}
Current Time: ${new Date().toLocaleString()}
`;

        try {
            const response = await ai.models.generateContent({ 
                model: "gemini-3.1-pro-preview",
                contents: contextStr + "\n\nUser Request: " + prompt + "\n\nInstructions: You are the 'Kelmid Intelligence Engine'. You speak the user's language (Arabic if Arabic, etc.). You MUST return a JSON object. You can perform actions on the user's schedule. Return ONLY the JSON object in this format: {\"action\": \"CREATE_EVENT\" | \"ADD_MULTI_EVENTS\" | \"DELETE_EVENT\" | \"UPDATE_EVENT\" | \"ADD_HABIT\" | \"TOGGLE_HABIT\" | \"DELETE_HABIT\" | \"TOGGLE_COMPLETE\" | \"GET_BUS_SCHEDULE\" | \"NONE\", \"data\": {\"message\": \"Your friendly response in the user's language\", \"title\": \"...\", \"date\": \"YYYY-MM-DD\", \"time\": \"HH:MM\", \"events\": [{\"title\":\"...\", \"startTime\":\"YYYY-MM-DDTHH:MM\", \"endTime\":\"YYYY-MM-DDTHH:MM\", \"priority\": \"medium\"}], \"eventId\": \"...\", \"updates\": {}, \"name\": \"...\", \"habitId\": \"...\"}}",
                config: {
                    responseMimeType: "application/json"
                }
            });

            const text = response.text || "";
            const jsonResponse = JSON.parse(text);
            return { action: jsonResponse.action, data: jsonResponse.data };
        } catch (error: any) {
            console.error("Gemini Client Error:", error);
            throw error;
        }
    }
};
