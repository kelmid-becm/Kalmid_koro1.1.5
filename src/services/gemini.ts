/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { CalendarEvent } from "../types";
import { useSettingsStore } from "../store/useSettingsStore";
import { useCalendarStore } from "../store/useCalendarStore";
import { useHabitStore } from "../store/useHabitStore";
import { useBusStore } from "../store/useBusStore";

const getApiKey = () => {
  // Priority 1: Environment variable (System provided)
  if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  // Priority 2: User provided via UI (Fallback)
  const fromLocal = useSettingsStore.getState().settings.geminiKey;
  if (fromLocal) return fromLocal;
  
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_GEMINI_API_KEY) {
    return (import.meta as any).env.VITE_GEMINI_API_KEY;
  }
  return '';
};

const getUpcomingBusTimes = (times: { time: string }[]) => {
    const timeNow = new Date();
    const currentMins = timeNow.getHours() * 60 + timeNow.getMinutes();
    let upcoming = times.filter(t => {
        const [h, m] = t.time.split(':').map(Number);
        return (h * 60 + m) >= currentMins - 10;
    });
    if (upcoming.length === 0) upcoming = times.slice(0, 5); 
    return upcoming.slice(0, 5).map(t => t.time).join(', ');
};

const BASE_SYSTEM_INSTRUCTION = `You are the Personal Advisor AI for 'Kelmid' in a Hybrid Chat App. You are the CONTROLLER of this application.
1. PERSONA: You are 'Kelmid', a highly sophisticated and highly intelligent AI Architect with deep reasoning capabilities. You don't just chat; you deeply ENGINEER the user's life and analyze their routines. Provide thoughtful, profound, and analytical responses.
2. LANGUAGE: Respond in Arabic (Modern Standard or Moroccan Darija as appropriate for the user) with elegant, insightful, and professional language.
3. NUMERALS: Always use Western/Latin numerals (0, 1, 2, 3, 4, 5, 6, 7, 8, 9) even in Arabic text.
4. BUS SYSTEM & PROACTIVE PLANNING: You have access to Bus Routes. If a user mentions a target event (e.g., "I have class at 8:30", "work tomorrow at 9:00"):
   - FIRST: If you do not know their starting location and destination, PROACTIVELY ASK for them so you can plan the route. Do not just say "ok", tell them you are ready to plan their schedule once you know their location and destination.
   - SECOND: Once locations are known, ACT AS AN EXECUTOR. Calculate BACKWARD from their target time to structure the perfect morning/travel routine.
   - Example Output: "مرحباً سيدي. موعد الاستيقاظ هو 6:40. الخروج من البيت على الساعة 7:20 لأن المحطة تبعد بـ 20 دقيقة مشياً، والحافلة ستنطلق على الساعة 7:50 لتنزل في المحطة الأقرب لوجهتك قبل الموعد."
5. SMART PLANNING: When a user mentions a major event, problem, or goal, suggest a "Smart Plan". Provide a unique, highly practical, and step-by-step framework.
   - Explain the "Why" behind your suggestions.
   - A Smart Plan includes: Wake up time, Preparation, Commute/Travel, and Buffer (5-10m).
   - Use [[ACTION: {"type": "ADD_MULTI_EVENTS", ...}]] to implement these plans into their calendar automatically.
6. SYSTEM INTENTS: If the user commands an action related to the system:
   - Phone Call: Output a markdown link like [اضغط هنا للاتصال بـ الاسم](tel:الرقم)
   - SMS message: Output a markdown link like [أرسل رسالة نصية](sms:?body=الرسالة)
   - WhatsApp message: Output a markdown link [افتح واتساب](https://wa.me/)
   - Hardware: Explain politely that as a Web App you cannot access System / Root APIs.
7. ACTIONS: If the user asks to ADD, DELETE, or UPDATE/EDIT an event, you MUST perform the action by including a JSON block at the end of your response in this EXACT format:
   - Add Multi: [[ACTION: {"type": "ADD_MULTI_EVENTS", "events": [{"title": "...", "startTime": "LOCAL_ISO_STRING", "endTime": "LOCAL_ISO_STRING", "priority": "low|medium|high", "description": "...", "isRecurring": boolean, "recurrenceDays": ["0","1",...], "recurrencePattern": "weekly"}] }]]
   - You MUST extract every single event the user mentions. If they mention 3 events, YOU MUST put all 3 in the ADD_MULTI_EVENTS array.
   - For Deleting: [[ACTION: {"type": "DELETE_EVENT", "eventId": "ID_FROM_CONTEXT"}]]
   - For Updating/Editing: [[ACTION: {"type": "UPDATE_EVENT", "eventId": "ID_FROM_CONTEXT", "updates": {"title": "...", "startTime": "LOCAL_ISO_STRING", "endTime": "LOCAL_ISO_STRING", "priority": "low|medium|high", "description": "...", "recurrenceDays": ["0","1",...]}}]]
   - Recurrence Days: "0" for Sunday, "1" for Monday, ..., "6" for Saturday.
   - For Habits (Adding): [[ACTION: {"type": "ADD_HABIT", "name": "..."}]]
   - For Habits (Toggle): [[ACTION: {"type": "TOGGLE_HABIT", "habitId": "ID_FROM_CONTEXT"}]]
   - For Habits (Delete): [[ACTION: {"type": "DELETE_HABIT", "habitId": "ID_FROM_CONTEXT"}]]
   - For Bus System: Create events for the bus ride using ADD_MULTI_EVENTS.
   - For Marking Done/Undone: [[ACTION: {"type": "TOGGLE_COMPLETE", "eventId": "ID_FROM_CONTEXT"}]]
   - For Restoring/Undo: [[ACTION: {"type": "RESTORE_EVENT", "eventId": "LAST_DELETED_ID_IF_KNOWN"}]]
   - IMPORTANT FOR TIMES: Start and End times MUST be formatted as Local ISO Strings WITHOUT the 'Z' timezone indicator (e.g., "2024-04-24T14:30:00"). Calculate based on the provided Current System Time.
8. PRECISION: Be extremely accurate with times and dates. Your error margin is ZERO. Verify the 'current time' and 'viewing date' carefully before assigning a day. Use LOCAL_ISO_STRING without 'Z' at the end.`;

const PLANNER_SYSTEM_INSTRUCTION = `You are the "Smart Planner Advisor" for Kelmid.
1. PERSONA: You are a deeply analytical, world-class Productivity Consultant and Time Architect. Your tone is ultra-professional, efficient, insightful, and visionary. You go beyond basic advice to provide deep psychological and practical insights.
2. MISSION: Your ONLY goal is to optimize Kelmid's 24 hours to the maximum potential.
3. BEHAVIOR:
   - When solving a scheduling problem, analyze it deeply through the lens of "Deep Work", "Energy Management", "Cognitive Load", and "Optimal Flow".
   - Break down complex advice into actionable, grounded frameworks. Explain the science or logic behind your recommendations.
   - If there are conflicts, resolve them by suggesting a strict hierarchy of priorities based on long-term goals.
   - Propose "Smart Routines" (Morning Start, Evening Shutdown) based on the existing schedule and habits.
   - Use advanced terminology wisely: "Bandwidth", "Throughput", "Latency", "Optimization", "Architecture", "Leverage".
4. ACTIONS: You have full access to the same [[ACTION: ...]] JSON system as the base assistant. Use it to restructure the schedule.
5. STRATEGY & MEMORY: Always look for "Time Waste", "Empty Gaps", or inefficient task-switching, and suggest productive habits or strategic rest blocks. Always learn from the user's historical context. When the user tells you about an upcoming engagement (study, work, etc) ALWAYS work BACKWARDS from the required arrival time. If you do not know the user's starting point (home) and destination locations, ASK THEM directly to provide these details so you can calculate walking time + bus/commute time to give them a precise Wake-Up, Leave Home, and Commute timeline. Output a narrative like: "مرحباً سيدي. موعد الاستيقاظ: 6:40. الخروج من البيت..."
6. LANGUAGE: Deep, sophisticated, and elegant high-level Arabic (Fusha).`;

// We will instantiate dynamically to catch key updates
const getAiClient = () => new GoogleGenAI({ apiKey: getApiKey() });

const getLocation = async (): Promise<{ lat: number, lng: number } | null> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => resolve(null),
      { timeout: 4000 }
    );
  });
};

function getDistanceKM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const getLocationContext = async (busRoutes: any[]) => {
  const loc = await getLocation();
  if (!loc) return "\n[USER LOCATION]\nCurrently unknown (Permission denied or not available). If the user asks for travel times, tell them you need permission to access their location or they must provide their exact location and destination.";
  
  let ctx = `\n[USER CURRENT LOCATION]\nLatitude: ${loc.lat}, Longitude: ${loc.lng}\n`;
  ctx += "Walking distance & time from current location to known bus stops (estimated at walking speed of 5km/h = ~12 mins/km):\n";
  busRoutes.forEach(route => {
      ctx += `Route ${route.name}:\n`;
      route.stops.forEach((stop: any) => {
          const dist = getDistanceKM(loc.lat, loc.lng, stop.latitude, stop.longitude);
          const walkMin = Math.round((dist / 5) * 60);
          ctx += ` - ${stop.name}: ${dist.toFixed(2)} km, ~${walkMin} mins walk\n`;
      });
  });
  return ctx;
};

export const geminiService = {
  /**
   * Helper to check AI status by attempting a very small generation.
   */
  async pingAI(): Promise<{ status: 'ok' | 'error', message?: string }> {
    if (!this.checkApiKey()) return { status: 'error', message: 'API_KEY_MISSING' };
    try {
      const ai = getAiClient();
      await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "ping"
      });
      return { status: 'ok' };
    } catch (e: any) {
      console.error("AI Ping Failed:", e);
      return { status: 'error', message: e.message };
    }
  },

  /**
   * Local fallback for offline mode
   */
  processOfflineCommand(events: CalendarEvent[], query: string): { response: string; action: string; data?: any } {
    const q = query.toLowerCase();
    
    // Status / Mode Intents
    if (q.includes('وضع الذكاء') || q.includes('اون لاين') || q.includes('online mode')) {
        return { 
          response: "**تم تفعيل الوضع الذكي (Online Mode).**\nالمساعد الآن متصل بالخوادم لتحليل أعمق لجدولك.", 
          action: 'NONE', 
          data: { type: 'FORCE_ONLINE' } 
        };
    }

    if (q.includes('وضع شات بوت') || q.includes('اوف لاين') || q.includes('offline mode') || q.includes('انتقل إلى وضع شات بوت')) {
        return { 
          response: "**تم الانتقال إلى وضع الشات البوت المحلي (Offline Mode).**\nتم فصل الاتصال بالخوادم مؤقتاً لحماية البيانات.\n\nإليك بعض الاستفسارات المتوفرة في هذا الوضع:\n- عرض مواعيد الغد\n- أضف مهمة سريعة...\n- فيقني بعد 10 دقائق\n- اتصل بـ فلان\n- احفظ ملاحظة...", 
          action: 'NONE', 
          data: { type: 'FORCE_OFFLINE' } 
        };
    }
    
    // Habits Integration
    if (q.includes('عادة') || q.includes('عاداتي') || q.includes('habit')) {
       return { 
         response: "سيدي، يمكنك عرض وإدارة عاداتك اليومية من خلال قسم 'العادات' في الأسفل. في وضع الأوفلاين، أفضل طريقة هي التفاعل المباشر مع واجهة العادات لضمان المزامنة الدقيقة.",
         action: 'NONE'
       };
    }

    // System Intents (Deep Linking / Simulation)
    if (q.includes('اتصل بـ') || q.includes('اتصل ب') || q.includes('اتصلي ب')) {
      const nameMatch = q.match(/(اتصل بـ|اتصل ب|اتصلي ب)\s*(.*?)$/i);
      const target = nameMatch ? nameMatch[2] : 'الرقم الأخير';
      return { 
        response: `تحت أمرك يا سيد Kelmid. جاري تحضير الاتصال بـ **${target}**...\n\n[اضغط هنا لتأكيد الاتصال والمتابعة](tel:${target === 'الرقم الأخير' ? '' : target})`,
        action: 'NONE'
      };
    }

    if (q.includes('ضيف موعد') || q.includes('سجل مهمة') || q.includes('أضف حدث') || q.includes('جدول لي')) {
      const title = query.replace(/(أضف|ضيف|سجل|مهمة|حدث|موعد|جديد|جدول لي)/ig, '').trim() || "موعد جديد";
      return {
        response: `تم يا سيدي. سأقوم بإضافة **"${title}"** إلى جدولك الآن.`,
        action: 'CREATE_EVENT',
        data: {
          title,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        }
      };
    }

    if (q.includes('عادة جديدة') || q.includes('أضف عادة')) {
      const name = query.replace(/(عادة جديدة|أضف عادة)/ig, '').trim() || "عادة جديدة";
      return {
        response: `رائع! سأضيف عادة **"${name}"** لتبدأ في ممارستها.`,
        action: 'ADD_HABIT',
        data: { name }
      };
    }

    // Commands for clearing
    if (q.includes('مسح الكل') || q.includes('clear all') || q.includes('إفراغ')) {
      return { response: "أهلاً بك يا سيد كلمات (Kelmid). لقد فهمت طلبك تماماً، أنا مستعد لمسح جدولك بالكامل بشكل نهائي. كيف يمكنني مساعدتك يا سيدي في أي شيء آخر؟", action: 'CLEAR_ALL' };
    }
    
    // Intent: Summary / Schedule Questions
    const isScheduleIntent = /(ماذا|ايش|شنو|وش|ش|شكو)?\s*(لدي|عندي|عليا|وراي|ورايا|جدول|مواعيد|مهام|برنامج|خطة|خطه)\s*(اليوم|النهار|دابا|غدا|غدوه|باكر|بكرة|بكره)/i.test(q) || /(اليوم|النهار|دابا|غدا|غدوه|باكر|بكرة|بكره)\s*(ماذا|ايش|شنو|وش|ش|شكو)?\s*(لدي|عندي|عليا|وراي|ورايا|جدول|مواعيد|مهام|برنامج|خطة|خطه)/i.test(q) || /(جدول|مواعيدي|مهامي|اجندة|أجندة)/i.test(q);

    if (isScheduleIntent) {
      return { 
        response: "أهلاً بك يا سيد Kelmid. جاري عرض جدولك حالياً.", 
        action: 'NONE' 
      };
    }

    return { 
      response: `أهلاً يا سيد Kelmid. المساعد الذكي يعمل حالياً بالوضع المحلي (بدون إنترنت). سأقوم بتنفيذ طلبك ("${query}") فور عودة الاتصال. هل تأمرني بشيء آخر؟`,
      action: 'NONE'
    };
  },

  /**
   * Helper to check API Key validity
   */
  checkApiKey(): boolean {
    return !!getApiKey();
  },

  /**
   * Generic text generation for smart suggestions
   */
  async generateText(prompt: string): Promise<string> {
    if (!this.checkApiKey()) throw new Error("API_KEY_MISSING");
    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      return response.text || "";
    } catch (e) {
      console.error(e);
      return "";
    }
  },

  /**
   * Translates AI response to another language (Toggle Arabic/English)
   */
  async translateText(text: string): Promise<string> {
    if (!getApiKey()) return text;
    try {
      const ai = getAiClient();
      const isArabic = /[\u0600-\u06FF]/.test(text);
      const target = isArabic ? 'English' : 'Arabic';
      const prompt = `Translate the following text to ${target}. Keep the polite tone, original meaning, and Markdown formatting exactly as is. Output ONLY the translated text:\n\n${text}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      return response.text || text;
    } catch(e) {
      console.error(e);
      return text;
    }
  },

  /**
   * Analyzes an audio base64 payload as an action.
   */
  async analyzeScheduleAudio(events: CalendarEvent[], audioBase64: string, mimeType: string, selectedDate: Date = new Date()): Promise<string> {
    if (!this.checkApiKey()) throw new Error("API_KEY_MISSING");
    
    const ai = getAiClient();
        const habits = useHabitStore.getState().habits;
    const busRoutes = useBusStore.getState().routes;
    const busContext = busRoutes.map(b => `Route ${b.name}:\n` + b.stops.map(s => `  - ${s.name}: Next: ${getUpcomingBusTimes(s.times)}`).join('\n')).join('\n\n');
    const context = events.map(e => `[ID: ${e.id}] ${e.startTime} to ${e.endTime}: ${e.title} (${e.priority})`).join('\n') + 
    '\n\n[HABITS]\n' + habits.map(h => `[ID: ${h.id}] ${h.name} (Streak: ${h.streak}, Completed Today: ${h.completedToday})`).join('\n') +
    '\n\n[BUS ROUTES - MOHAMMEDIA]\n' + busContext;
    const now = new Date().toISOString();
    const viewingDate = selectedDate.toDateString();
    
    // Strip codecs parameters which might cause Gemini to reject the mime type
    const cleanMimeType = mimeType.split(';')[0];
    
    const systemInstruction = BASE_SYSTEM_INSTRUCTION;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: { systemInstruction },
        contents: {
          parts: [
            { inlineData: { data: audioBase64, mimeType: cleanMimeType } },
            { text: `Current System Time: ${now}\nUser is viewing: ${viewingDate}\n\nCurrent Schedule Context:\n${context}` }
          ]
        }
      });
      return response.text || "لم أتمكن من فهم الصوت، سيدي.";
    } catch(e) {
      console.error("Audio AI Error:", e);
      throw e;
    }
  },

  /**
   * Conversational planner for smart suggestions and actions. (Streaming version)
   */
  async *analyzeScheduleStream(events: CalendarEvent[], query: string, selectedDate: Date = new Date(), signal?: AbortSignal) {
    if (!this.checkApiKey()) throw new Error("API_KEY_MISSING");
    
    const ai = getAiClient();
    const habits = useHabitStore.getState().habits;
    const busRoutes = useBusStore.getState().routes;
    const chatHistory = useSettingsStore.getState().chatHistory;
    
    const busContext = busRoutes.map(b => `Route ${b.name}:\n` + b.stops.map(s => `  - ${s.name}: Next: ${getUpcomingBusTimes(s.times)}`).join('\n')).join('\n\n');
    const context = events.map(e => `[ID: ${e.id}] ${e.startTime} to ${e.endTime}: ${e.title} (${e.priority})`).join('\n') + 
    '\n\n[HABITS]\n' + habits.map(h => `[ID: ${h.id}] ${h.name} (Streak: ${h.streak}, Completed Today: ${h.completedToday})`).join('\n') +
    '\n\n[BUS ROUTES - MOHAMMEDIA]\n' + busContext;
    const now = new Date().toISOString();
    const viewingDate = selectedDate.toDateString();
    
    const isPlannerMode = query.includes('[PLANNER_MODE]');
    const cleanQuery = query.replace('[PLANNER_MODE]', '').trim();
    const plannerDirective = isPlannerMode 
      ? `\n\nPLANNER ADVISOR MODE ACTIVE: Focus strictly on optimizing schedule, reducing time waste, and engineering perfect morning/evening routines. Be the Architect of Kelmid's time. Use sophisticated vocabulary and emphasize 'Efficiency', 'Flow', and 'Engineering'.`
      : '';

    const locationContext = await getLocationContext(busRoutes);

    const systemInstruction = isPlannerMode ? PLANNER_SYSTEM_INSTRUCTION : BASE_SYSTEM_INSTRUCTION;

    // Build conversation history
    const contents: any[] = chatHistory.slice(-10).map(msg => ({ // Send last 10 messages for context
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Add current context + query as the last message
    contents.push({
      role: 'user',
      parts: [{ text: `Current System Time: ${now}\nUser is currently viewing/focused on: ${viewingDate}\n\nCurrent Schedule Context:\n${context}${plannerDirective}${locationContext}\n\nUser Question: ${cleanQuery}\n\nStrict Goal: Be polite, address the user as 'Kelmid' or 'سيدي', and use perfect Arabic grammer.` }]
    });

    try {
      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        config: { systemInstruction },
        contents
      });
      
      for await (const chunk of responseStream) {
        yield chunk;
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  /**
   * Conversational planner for smart suggestions and actions.
   */
  async analyzeSchedule(events: CalendarEvent[], query: string, selectedDate: Date = new Date()): Promise<string> {
    if (!this.checkApiKey()) throw new Error("API_KEY_MISSING");
    
    const ai = getAiClient();
    const habits = useHabitStore.getState().habits;
    const busRoutes = useBusStore.getState().routes;
    const chatHistory = useSettingsStore.getState().chatHistory;
    
    const busContext = busRoutes.map(b => `Route ${b.name}:\n` + b.stops.map(s => `  - ${s.name}: Next: ${getUpcomingBusTimes(s.times)}`).join('\n')).join('\n\n');
    const context = events.map(e => `[ID: ${e.id}] ${e.startTime} to ${e.endTime}: ${e.title} (${e.priority})`).join('\n') + 
    '\n\n[HABITS]\n' + habits.map(h => `[ID: ${h.id}] ${h.name} (Streak: ${h.streak}, Completed Today: ${h.completedToday})`).join('\n') +
    '\n\n[BUS ROUTES - MOHAMMEDIA]\n' + busContext;
    const now = new Date().toISOString();
    const viewingDate = selectedDate.toDateString();
    
    const isPlannerMode = query.includes('[PLANNER_MODE]');
    const cleanQuery = query.replace('[PLANNER_MODE]', '').trim();
    const plannerDirective = isPlannerMode 
      ? `\n\nPLANNER ADVISOR MODE ACTIVE: Focus strictly on optimizing schedule, reducing time waste, and engineering perfect morning/evening routines. Be the Architect of Kelmid's time. Use more sophisticated vocabulary and emphasize 'Efficiency' and 'Flow'.`
      : '';

    const locationContext = await getLocationContext(busRoutes);

    const systemInstruction = isPlannerMode ? PLANNER_SYSTEM_INSTRUCTION : BASE_SYSTEM_INSTRUCTION;

    // Build conversation history
    const contents: any[] = chatHistory.slice(-10).map(msg => ({ // Send last 10 messages for context
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Add current context + query as the last message
    contents.push({
      role: 'user',
      parts: [{ text: `Current System Time: ${now}\nUser is currently viewing/focused on: ${viewingDate}\n\nCurrent Schedule Context:\n${context}${plannerDirective}${locationContext}\n\nUser Question: ${cleanQuery}\n\nStrict Goal: Be polite, address the user as 'Kelmid' or 'سيدي', and use perfect Arabic grammer.` }]
    });

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: { systemInstruction },
        contents
      });
      return response.text || "عذراً يا سيدي، واجهت مشكلة تقنية في تحليل بياناتك حالياً. كيف يمكنني مساعدتك يا سيدي؟";
    } catch (e) {
      console.error(e);
      return "عذراً يا سيدي، لم أتمكن من الاتصال بالخوادم حالياً. يرجى التأكد من اتصال الإنترنت أو صحة الـ API Key.";
    }
  }
};
