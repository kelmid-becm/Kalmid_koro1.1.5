import "dotenv/config";
import express from "express";
import path from "path";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import type { Provider, AssistantSettings, TaskComplexity, RouteRequest } from "./src/types.ts";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { routeRequest } from "./src/services/aiRouter.ts";

async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // Configure AI Rate Limiter (Max 50 requests per 15 minutes per IP)
  const aiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 50, 
    message: { error: "Too many requests, please try again later." },
  });

  // API Routes
  app.get("/api/status", (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ status: "error", message: "API Key missing" });
    }
    // Simple ping to AI if needed, or just return ok based on presence
    res.json({ status: "ok" });
  });

  app.post("/api/ai", aiRateLimiter, async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "AI configuration error." });
      }

      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const result = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt + "\n\nReturn ONLY raw JSON in this format: {\"action\": \"CREATE_EVENT\" | \"ADD_HABIT\" | \"GET_BUS_SCHEDULE\" | \"NONE\", \"data\": {...}}"
      });

      const text = result.text || "";
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      try {
        const jsonResponse = JSON.parse(jsonStr);
        res.json({ response: jsonResponse });
      } catch (e) {
        res.json({ response: { action: "NONE", data: { message: text } } });
      }
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: "An error occurred while communicating with the AI service." });
    }
  });

  // Helper: Decrypt Key (AES-GCM)
  const getDecryptedKey = (encryptedHex?: string) => {
    if (!encryptedHex) return null;
    try {
      const INTERNAL_SECRET = 'kelmid-ai-vault-2026';
      const keyBuffer = Buffer.from(INTERNAL_SECRET.padEnd(32, '0'), 'utf8');
      
      const combined = Buffer.from(encryptedHex, 'hex');
      const iv = combined.slice(0, 12);
      const authTag = combined.slice(combined.length - 16);
      const encrypted = combined.slice(12, combined.length - 16);
      
      const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (e) {
      // Fallback to legacy base64 if it's not hex
      try {
        return Buffer.from(encryptedHex, 'base64').toString('utf8');
      } catch (e2) {
        console.error("Key decryption failed:", e);
        return null;
      }
    }
  };

  // Caching Layer (Simple Memory Cache)
  const aiCache = new Map<string, { response: string, timestamp: number }>();
  const CACHE_TTL = 1000 * 60 * 60; // 1 hour

  // Helper: Secure Cache Key (Simple Hash)
  const getCacheKey = (complexity: string, prompt: string) => {
    return crypto.createHash('sha256').update(`${complexity}:${prompt}`).digest('hex');
  };

  // AI Assistant Routes
  app.post("/api/ai/chat", async (req, res) => {
    const { prompt, complexity, settings } = req.body;
    
    if (!settings) return res.status(400).json({ error: "Settings required" });

    // Check Cache
    const cacheKey = getCacheKey(complexity, prompt);
    const cached = aiCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log("[Cache] Hit for prompt:", prompt.substring(0, 30));
      return res.json({ provider: 'cache', response: cached.response });
    }

    try {
      // 1. Initial Routing Selection
      const primaryProvider = await routeRequest({ prompt, complexity, settings });
      
      // 2. Fallback Chain: Strict Order (OpenAI -> Gemini -> Deepseek -> Local)
      const fallbackOrder: Provider[] = ['openai', 'gemini', 'deepseek', 'local'];
      const providersToTry: Provider[] = [
        primaryProvider,
        ...fallbackOrder.filter(p => p !== primaryProvider)
      ];

      let lastError = "";
      
      for (const provider of providersToTry) {
        const config = settings.providers[provider];
        if (!config || !config.enabled) continue;
        
        // Critical: Skip if secondary and no API key (except local)
        if (provider !== 'local' && !config.apiKey) {
            console.log(`[Failover] Skipping ${provider} due to missing API key`);
            continue;
        }

        try {
          const startTime = Date.now();
          let aiResponse = "";
          
          if (provider === 'gemini' && config.apiKey) {
            console.log(`[Orchestrator] Trying Gemini (Primary: ${provider === primaryProvider})`);
            const key = getDecryptedKey(config.apiKey);
            if (!key) throw new Error("Key decryption failed");
            const genAI = new GoogleGenAI({ apiKey: key });
            const result = await genAI.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: prompt
            });
            aiResponse = result.text || "";
          } 
          else if (provider === 'openai' && config.apiKey) {
            console.log(`[Orchestrator] Trying OpenAI (Primary: ${provider === primaryProvider})`);
            const key = getDecryptedKey(config.apiKey);
            if (!key) throw new Error("Key decryption failed");
            const openai = new OpenAI({ apiKey: key });
            const completion = await openai.chat.completions.create({
              model: config.model || 'gpt-4o',
              messages: [{ role: "user", content: prompt }],
            });
            aiResponse = completion.choices[0].message.content || "";
          }
          else if (provider === 'deepseek' && config.apiKey) {
            console.log(`[Orchestrator] Trying Deepseek (Primary: ${provider === primaryProvider})`);
            const key = getDecryptedKey(config.apiKey);
            if (!key) throw new Error("Key decryption failed");
            
            const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
              },
              body: JSON.stringify({
                model: config.model || 'deepseek-chat',
                messages: [{ role: 'user', content: prompt }],
                stream: false
              }),
              signal: AbortSignal.timeout(30000)
            }).then(r => r.json()).catch(() => null);

            if (deepseekResponse && deepseekResponse.choices && deepseekResponse.choices[0]) {
              aiResponse = deepseekResponse.choices[0].message.content;
            } else {
                throw new Error(deepseekResponse?.error?.message || "Deepseek API failure");
            }
          }
          else if (provider === 'local') {
            console.log(`[Orchestrator] Trying Local AI (Primary: ${provider === primaryProvider})`);
            // Local AI validation for SSRF protection
            if (!config.baseUrl?.startsWith('http://') && !config.baseUrl?.startsWith('https://')) continue;
            if (config.baseUrl?.includes('169.254.169.254') || config.baseUrl?.includes('metadata.google')) continue; 
            
            const localResponse = await fetch(`${config.baseUrl}/api/generate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ model: config.model, prompt, stream: false }),
              signal: AbortSignal.timeout(10000) 
            }).then(r => r.json()).catch(() => null);
            
            if (localResponse && localResponse.response) aiResponse = localResponse.response;
            else throw new Error("Local AI (Ollama) unreachable or returned empty");
          }

          if (aiResponse) {
            const duration = Date.now() - startTime;
            console.log(`[Orchestrator] Success with ${provider} in ${duration}ms`);
            // Update Cache
            aiCache.set(cacheKey, { response: aiResponse, timestamp: Date.now() });
            return res.json({ provider, response: aiResponse });
          }
        } catch (err: any) {
          console.error(`[Failover] ${provider} failed: ${err.message}`);
          lastError = `${provider}: ${err.message}`;
        }
      }

      res.status(500).json({ error: lastError || "All providers failed or none enabled." });
    } catch (error) {
      console.error("Orchestration error:", error);
      res.status(500).json({ error: "Internal orchestration failure" });
    }
  });


  // ... rest of the file

  // Mock-cached data in memory
  let busScheduleCache: any = null;

  function generateTimes(startTimeMinutes: number, endTimeMinutes: number, interval: number, stopIndex: number, totalStops: number, totalTripDuration: number) {
      const times = [];
      const stopOffset = Math.round((stopIndex / (totalStops - 1)) * totalTripDuration);
      
      const currentDay = new Date().getDay();

      for (let time = startTimeMinutes; time <= endTimeMinutes; time += interval) {
          const stopTime = time + stopOffset;
          const h = (Math.floor(stopTime / 60)) % 24;
          const m = stopTime % 60;
          const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          
          const timeInMinutes = h * 60 + m;
          const isMorningRush = timeInMinutes >= 7 * 60 + 30 && timeInMinutes <= 9 * 60 + 30;
          const isEveningRush = timeInMinutes >= 17 * 60 && timeInMinutes <= 19 * 60 + 30;
          
          let status = 'onTime';
          let delayMinutes = 0;
          
          // Deterministic traffic model based on time, stop index, and day of week
          const stabilityHash = (timeInMinutes * 13 + stopIndex * 7 + currentDay * 11) % 100;
          if (isMorningRush || isEveningRush) {
              if (stabilityHash > 95) {
                  status = 'cancelled';
              } else if (stabilityHash > 75) {
                  status = 'delayed';
                  delayMinutes = 5 + (stabilityHash % 15); // 5 to 19 min delay
              }
          } else {
              if (stabilityHash > 98) {
                  status = 'cancelled';
              } else if (stabilityHash > 88) {
                  status = 'delayed';
                  delayMinutes = 2 + (stabilityHash % 10); // 2 to 11 min delay
              }
          }

          times.push({ time: timeString, status, delayMinutes });
      }
      return times;
  }

  function generateRoute(id: string, name: string, stopNames: string[]) {
      const startTime = 6 * 60 + 10; // 06:10
      const endTime = 20 * 60 + 10; // 20:10
      const interval = 15; // 15 mins
      const tripDuration = 33; // 33 mins
      
      return {
          id,
          name,
          stops: stopNames.map((stopName, idx) => {
              // Interpolate coordinates linearly for deterministic realistic map data
              const progress = idx / Math.max(1, stopNames.length - 1);
              const lat = id.includes('outbound') 
                  ? 33.550 + (0.143 * progress)  // Nahda -> Port
                  : 33.693 - (0.143 * progress); // Port -> Nahda
              const lng = id.includes('outbound')
                  ? -7.600 + (0.218 * progress)
                  : -7.382 - (0.218 * progress);

              return {
                  id: `${id}-s${idx + 1}`,
                  name: stopName,
                  latitude: Number(lat.toFixed(4)),
                  longitude: Number(lng.toFixed(4)),
                  times: generateTimes(startTime, endTime, interval, idx, stopNames.length, tripDuration)
              };
          })
      };
  }

  const nahdaToPortStops = [
      "Nahda", "Riad Salam", "Mosquée Riad Salam", "Salam", "Groupe Scolaire Rodin", "Msalla Mohammedia", 
      "Résidence El Horria", "Rachidia", "Centre de Santé Riad", "Collège Yacoub El Mansour", "Lydec Alia", 
      "Société Seita", "Pharmacie El Fath", "Mosquée Mali", "Gare routière", "El Matahine", "Clinique Fédala", 
      "Pharmacie de l’Avenue", "District Provincial", "Parc de Mohammedia", "Port"
  ];

  function updateScheduleCache() {
      busScheduleCache = [
          generateRoute('906-outbound', 'L906: Nahda → Port', nahdaToPortStops),
          generateRoute('906-inbound', 'L906: Port → Nahda', [...nahdaToPortStops].reverse())
      ];
      console.log(`[${new Date().toISOString()}] Bus schedule regenerated with traffic predictions.`);
  }

  // Initial fetch
  updateScheduleCache();

  // Regenerate schedules every 10 minutes to simulate live data changes
  setInterval(updateScheduleCache, 10 * 60 * 1000);

  // API route
  app.get("/api/bus-schedule", (req, res) => {
    res.json(busScheduleCache);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
