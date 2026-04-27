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
                model: "gemini-3-flash-preview",
                contents: contextStr + "\n\nUser Request: " + prompt + "\n\nInstructions: You are a smart assistant. You CAN see the user's schedule (Events) and Habits. Answer questions about them or execute actions. Return ONLY raw JSON in this format: {\"action\": \"CREATE_EVENT\" | \"ADD_MULTI_EVENTS\" | \"DELETE_EVENT\" | \"UPDATE_EVENT\" | \"ADD_HABIT\" | \"TOGGLE_HABIT\" | \"DELETE_HABIT\" | \"TOGGLE_COMPLETE\" | \"GET_BUS_SCHEDULE\" | \"NONE\", \"data\": {\"message\": \"Your verbal response to the user\", \"title\": \"...\", \"date\": \"YYYY-MM-DD\", \"time\": \"HH:MM\", \"events\": [{\"title\":\"...\", \"startTime\":\"YYYY-MM-DDTHH:MM\", \"endTime\":\"YYYY-MM-DDTHH:MM\", \"priority\": \"medium\"}], \"eventId\": \"...\", \"updates\": {}, \"name\": \"...\", \"habitId\": \"...\"}}",
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
