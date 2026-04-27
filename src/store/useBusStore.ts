import { create } from 'zustand';
import { db } from '../services/db';
import { BusRoute, BusStop } from '../types';

interface BusStore {
  routes: BusRoute[];
  fetchRoutes: () => Promise<void>;
  syncWithOnline: () => Promise<void>;
  addRoute: (route: BusRoute) => Promise<void>;
}

export const useBusStore = create<BusStore>((set) => ({
  routes: [],
  fetchRoutes: async () => {
    let routes = await db.busRoutes.toArray();
    
    // Use a version identifier to force sync when data structure changes
    const DATA_VERSION = 'V7_FINAL_SYNC_FIX'; 
    const currentVersion = localStorage.getItem('BUS_DATA_VERSION');
    
    if (routes.length === 0 || currentVersion !== DATA_VERSION) {
      try {
        const { getOfflineRoutes } = await import('../services/scheduleGenerator');
        const defaultRoutes = getOfflineRoutes();
        
        await db.busRoutes.clear();
        for (const r of defaultRoutes) {
          await db.busRoutes.put(r);
        }
        localStorage.setItem('BUS_DATA_VERSION', DATA_VERSION);
        routes = defaultRoutes;
      } catch (e) {
        console.error("Generator failed", e);
      }
    }
    set({ routes });
  },
  syncWithOnline: async () => {
    // Simulated online sync
    try {
      const { getOfflineRoutes } = await import('../services/scheduleGenerator');
      const latestData = getOfflineRoutes();
      await db.busRoutes.clear();
      for (const r of latestData) {
        await db.busRoutes.put(r);
      }
      set({ routes: latestData });
    } catch (e) {
      console.error("Sync failed", e);
    }
  },
  addRoute: async (route) => {
    await db.busRoutes.put(route);
    set(state => ({ routes: [...state.routes, route] }));
  }
}));
