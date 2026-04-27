export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: Provider;
  timestamp: string;
  status?: 'sending' | 'sent' | 'pending' | 'error';
}

export type RecurrencePattern = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Habit {
  id: string;
  name: string;
  streak: number;
  history: string[]; // ISO date strings
  completedToday: boolean;
  recurrenceDays: string[]; // e.g., ['Monday', 'Tuesday']
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  details?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  type: 'academic' | 'personal' | 'work' | 'reminder';
  priority: 'low' | 'medium' | 'high';
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
  recurrenceDays?: string[]; // e.g., ['0', '1'] for Sun, Mon
  isCompleted?: boolean;
  enableReminder?: boolean;
  reminded?: boolean;
  enableAlarm?: boolean;
  alarmFired?: boolean;
  snoozeTime?: string;
  missedReminderFired?: boolean;
}

export interface DaySchedule {
  date: string; // YYYY-MM-DD
  events: CalendarEvent[];
}

export interface AIAnalysis {
  summary: string;
  suggestions: string[];
  freeTimeSlots: { start: string; end: string }[];
}

export type TaskComplexity = 'simple' | 'complex' | 'coding' | 'reasoning' | 'creative';

export interface RouteRequest {
  prompt: string;
  complexity: TaskComplexity;
  settings: AssistantSettings;
}

export type Provider = 'gemini' | 'openai' | 'deepseek' | 'local';

export interface ProviderConfig {
  id: Provider;
  enabled: boolean;
  apiKey?: string; 
  model: string;
  baseUrl?: string;
}

export interface AssistantSettings {
  id: 'settings';
  providers: Record<Provider, ProviderConfig>;
  autoRouting: boolean;
}

export interface UsageMetric {
  id: string; // UUID
  provider: Provider;
  tokensUsed: number;
  cost: number;
  timestamp: string;
}

export type ViewMode = "day" | "week" | "month" | "today" | "calendar" | "habits" | "analytics" | "chat" | "bus" | "ai-dashboard" | "ai-settings" | "local-assistant";
export interface BusFeedback {
  id: string;
  routeId: string;
  stopId: string;
  tripTime: string;
  reportType: 'LATE' | 'NEVER';
  reportDate: string; // YYYY-MM-DD
  reportTime: string;
  delayMinutes?: number;
}

export interface TripReliability {
  id: string; // routeId-tripTime
  routeId: string;
  tripTime: string;
  totalReports: number;
  lateReports: number;
  neverReports: number;
  reliabilityScore: number;
}

export interface BusTime {
  time: string;
  status: 'onTime' | 'delayed' | 'cancelled';
  delayMinutes?: number;
  isNextDay?: boolean;
  isPreviousDay?: boolean;
}

export interface BusStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  times: BusTime[];
}

export interface BusRoute {
  id: string;
  name: string;
  stops: BusStop[];
}

export interface UserStats {
  id: string;
  xp: number;
  level: number;
  totalTasksCompleted: number;
  activeStreaks: number;
  lastActiveDate: string;
}

export interface UserSettings {
  id: string;
  homeLocation?: {
    lat: number;
    lng: number;
    address?: string;
  };
  favoriteStops?: string[]; // Array of `${routeId}-${stopId}`
  language: 'ar' | 'fr' | 'en';
  theme: 'light' | 'dark';
  geminiKey?: string;
}
