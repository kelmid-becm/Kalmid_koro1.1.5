import Dexie, { Table } from 'dexie';
import { CalendarEvent, ChatMessage, Habit, BusRoute, BusStop, UserSettings, UserStats, BusFeedback, TripReliability, AssistantSettings, UsageMetric } from '../types';

export class KelmidDatabase extends Dexie {
  events!: Table<CalendarEvent>;
  trashEvents!: Table<CalendarEvent>;
  chatHistory!: Table<ChatMessage>;
  habits!: Table<Habit>;
  busRoutes!: Table<BusRoute>;
  busStops!: Table<BusStop>;
  busFeedback!: Table<BusFeedback>;
  tripReliability!: Table<TripReliability>;
  userSettings!: Table<UserSettings>;
  userStats!: Table<UserStats>;
  assistantSettings!: Table<AssistantSettings>;
  usageMetrics!: Table<UsageMetric>;

  constructor() {
    super('KelmidDB');
    this.version(7).stores({
      events: 'id, title, startTime',
      trashEvents: 'id, title, startTime',
      chatHistory: 'id, timestamp',
      habits: 'id, name, streak',
      busRoutes: 'id, name',
      busStops: 'id, name',
      busFeedback: 'id, routeId, tripTime',
      tripReliability: 'id, routeId, tripTime',
      userSettings: 'id',
      userStats: 'id',
      assistantSettings: 'id',
      usageMetrics: 'id, provider, timestamp'
    });
  }
}

export const db = new KelmidDatabase();
