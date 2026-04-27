import { AppTranslations } from '../locales/translations';
import React, { useState, useEffect, useCallback } from 'react';
import { Bus, Clock, MapPin, Navigation, ChevronLeft, ChevronRight, Home, ShieldAlert, Timer, Sparkles, LocateFixed, Calendar as CalendarIcon, Star, Bell, BellRing, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../services/db';
import { BusRoute, BusStop, UserSettings } from '../types';
import { geminiService } from '../services/gemini';
import { useBusStore } from '../store/useBusStore';
import { getPrediction, processFeedback } from '../services/reliabilityService';

const HAVERSINE_R = 6371e3; // Earth radius in meters

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const q1 = lat1 * Math.PI / 180;
  const q2 = lat2 * Math.PI / 180;
  const dq = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dq / 2) * Math.sin(dq / 2) +
            Math.cos(q1) * Math.cos(q2) *
            Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return HAVERSINE_R * c;
};

export const BusSchedule = ({ t, language }: { t: AppTranslations, language: string }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { routes, fetchRoutes, syncWithOnline } = useBusStore();
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [selectedStopId, setSelectedStopId] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [nearestOption, setNearestOption] = useState<{ stop: BusStop, route: BusRoute, time: string, distance: number } | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const [predictions, setPredictions] = useState<Record<string, { status: string, message?: string }>>({});
  const [reminders, setReminders] = useState<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    const loadPredictions = async () => {
        const route = routes.find(r => r.id === selectedRouteId);
        const stop = route?.stops.find(s => s.id === selectedStopId);
        if (!stop) return;
        
        const newPredictions: Record<string, { status: string, message?: string }> = {};
        for (const timeEntry of stop.times) {
            const pred = await getPrediction(selectedRouteId, timeEntry.time);
            newPredictions[timeEntry.time] = pred;
        }
        setPredictions(newPredictions);
    }
    loadPredictions();
  }, [selectedRouteId, selectedStopId, routes]);

  const handleFeedback = async (routeId: string, stopId: string, tripTime: string, type: 'LATE' | 'NEVER') => {
      await processFeedback({
          id: Math.random().toString(36).substring(7),
          routeId,
          stopId,
          tripTime,
          reportType: type,
          reportDate: new Date().toISOString().split('T')[0],
          reportTime: new Date().toISOString(),
      });
      alert('تم إرسال بلاغك!');
  };

  const toggleFavorite = async (routeId: string, stopId: string) => {
    if (!userSettings) return;
    const favKey = `${routeId}:${stopId}`;
    const favs = userSettings.favoriteStops || [];
    let newFavs;
    if (favs.includes(favKey)) {
        newFavs = favs.filter(f => f !== favKey);
    } else {
        newFavs = [...favs, favKey];
    }
    const updated = { ...userSettings, favoriteStops: newFavs };
    await db.userSettings.put(updated);
    setUserSettings(updated);
  };

  const setReminder = (timeStr: string, minutesBefore: number = 5) => {
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
        return;
    }
    
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            const now = new Date();
            const nowRounded = new Date(now);
            nowRounded.setSeconds(0,0);
            
            const [h, m] = timeStr.split(':').map(Number);
            const target = new Date(nowRounded);
            target.setHours(h, m, 0, 0);
            
            const msUntilBus = target.getTime() - now.getTime();
            const msUntilAlert = msUntilBus - (minutesBefore * 60000);
            
            if (msUntilAlert > 0) {
                const timerId = setTimeout(() => {
                    new Notification("Bus Schedule Alert", {
                        body: `Your bus is arriving at ${timeStr} (in ~${minutesBefore} minutes)!`
                    });
                    setReminders(prev => {
                        const next = {...prev};
                        delete next[timeStr];
                        return next;
                    });
                }, msUntilAlert);
                
                setReminders(prev => ({...prev, [timeStr]: timerId}));
                alert(`Reminder set for ${minutesBefore} minutes before ${timeStr}`);
            } else {
                alert("It's too late to set a reminder for this bus!");
            }
        }
    });
  };
  
  // Update routes selection defaults
  useEffect(() => {
    if (routes.length > 0 && !selectedRouteId) {
        // Default to a favorite if available
        if (userSettings?.favoriteStops && userSettings.favoriteStops.length > 0) {
           const [rId, sId] = userSettings.favoriteStops[0].split(':');
           if (routes.find(r => r.id === rId)) {
               setSelectedRouteId(rId);
               setSelectedStopId(sId);
               return;
           }
        }
        setSelectedRouteId(routes[0].id);
        setSelectedStopId(routes[0].stops[0].id);
    }
  }, [routes, selectedRouteId, userSettings]);

  // Update timer every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => setLastUpdated(new Date()), 5000);
    return () => clearInterval(timer);
  }, []);

  // Initialize DB and Load Data
  useEffect(() => {
    fetchRoutes();
    
    const loadSettings = async () => {
      const settings = await db.userSettings.get('main');
      if (settings) {
        setUserSettings(settings);
      } else {
        const initialSettings: UserSettings = { id: 'main', language: language as any, theme: 'dark' };
        await db.userSettings.put(initialSettings);
        setUserSettings(initialSettings);
      }
    };
    loadSettings();
  }, [fetchRoutes, language]);

  const handleSync = async () => {
    setIsSyncing(true);
    await syncWithOnline();
    setIsSyncing(false);
  };

  const detectLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
      },
      (err) => {
        console.error(err);
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const calculateNearest = useCallback(() => {
    if (!userLocation || routes.length === 0) return;

    let best: { stop: BusStop, route: BusRoute, time: string, distance: number } | null = null;
    let minDistance = Infinity;

    const nowRounded = new Date();
    nowRounded.setSeconds(0, 0);

    routes.forEach(route => {
      route.stops.forEach(stop => {
        const dist = calculateDistance(userLocation.lat, userLocation.lng, stop.latitude, stop.longitude);
        
        // Find next available bus at this stop using actual time diffs
        let nextTimeObj = null;
        let minTimeDiff = Infinity;

        for (const t of stop.times) {
          if (t.status === 'cancelled') continue;
          const [h, m] = t.time.split(':').map(Number);
          const target = new Date(nowRounded);
          target.setHours(h, m, 0, 0);
          
          if (t.status === 'delayed' && t.delayMinutes) {
              target.setMinutes(target.getMinutes() + t.delayMinutes);
          }
          
          let diffMinutes = Math.round((target.getTime() - nowRounded.getTime()) / 60000);
          
          // Handle wrap around if target is past midnight
          if (diffMinutes < -12 * 60) {
             diffMinutes += 24 * 60; 
          }
          
          if (diffMinutes >= 0 && diffMinutes < minTimeDiff) {
              minTimeDiff = diffMinutes;
              nextTimeObj = t;
          }
        }
        
        if (nextTimeObj && dist < minDistance) {
          minDistance = dist;
          best = { stop, route, time: nextTimeObj.time, distance: dist };
        }
      });
    });

    setNearestOption(best);
  }, [userLocation, routes]);

  useEffect(() => {
    calculateNearest();
  }, [calculateNearest]);

  const getAiSuggestion = async () => {
    if (!nearestOption) return;
    try {
      const prompt = `Based on current time ${new Date().toLocaleTimeString()} and nearest bus at ${nearestOption.time} from stop ${nearestOption.stop.name}, give a short smart travel advice in ${language}. Just one sentence.`;
      const suggestion = await geminiService.generateText(prompt);
      setAiSuggestion(suggestion);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (nearestOption) getAiSuggestion();
  }, [nearestOption]);

  const formatDateLabel = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const afterTomorrow = new Date(today);
    afterTomorrow.setDate(today.getDate() + 2);

    if (date.toDateString() === today.toDateString()) return t.today;
    if (date.toDateString() === tomorrow.toDateString()) return t.tomorrow;
    if (date.toDateString() === afterTomorrow.toDateString()) return t.afterTomorrow;
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : language, { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const saveHome = async () => {
    if (!userLocation) return;
    const updated = { ...userSettings!, homeLocation: { lat: userLocation.lat, lng: userLocation.lng } };
    await db.userSettings.put(updated);
    setUserSettings(updated as UserSettings);
  };

  const getCountdown = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const target = new Date();
    target.setHours(h, m, 0);
    const diff = target.getTime() - new Date().getTime();
    if (diff < 0) return null;
    const mins = Math.floor(diff / 60000);
    return mins;
  };

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    }
  }, []);

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--color-main)', color: 'var(--color-base)' }}>
      {isOffline && (
        <div className="bg-amber-500/20 text-amber-500 p-2 text-center text-xs font-bold flex justify-center items-center gap-2">
          <span>⚠️</span> 
          System is running in Offline Mode. Cached schedules are shown.
        </div>
      )}
      {/* Date Navigation Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border-muted)' }}>
        <button onClick={() => changeDate(-1)} className="p-2 transition-colors rounded-full" style={{ backgroundColor: 'var(--color-surface)' }}>
          <ChevronLeft className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
        </button>
        <div className="text-center">
          <h2 className="font-bold text-lg">{formatDateLabel(selectedDate)}</h2>
          <p className="text-[10px] font-mono opacity-50 uppercase tracking-wider" style={{ color: 'var(--color-dim)' }}>{selectedDate.toLocaleDateString(language === 'ar' ? 'ar-EG' : language, { weekday: 'long' })}</p>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={handleSync} 
                disabled={isSyncing || !navigator.onLine}
                className={`p-2 transition-all rounded-full ${isSyncing ? 'animate-spin' : ''} ${!navigator.onLine ? 'opacity-30' : 'hover:bg-primary/10'}`}
                style={{ backgroundColor: 'var(--color-surface)' }}
            >
                <RefreshCcw className="w-5 h-5 text-primary" />
            </button>
            <button onClick={() => changeDate(1)} className="p-2 transition-colors rounded-full" style={{ backgroundColor: 'var(--color-surface)' }}>
                <ChevronRight className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {/* Offline Status */}
        {!navigator.onLine && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500 text-xs font-mono"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{t.offlineMode} - {t.activeLocalCache}</span>
          </motion.div>
        )}

        <div className="flex items-center justify-center -mt-2 mb-2">
            <span className="text-[10px] font-mono tracking-widest text-primary/80 uppercase px-3 py-1 bg-primary/10 rounded-full flex items-center gap-1.5 border border-primary/20 shadow-sm shadow-primary/5">
                <Bus className="w-3 h-3" />
                {navigator.onLine ? 'Live Data' : 'Offline Data'}
            </span>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
              <div className="flex-[1.5] flex items-center px-4 py-3 rounded-[24px] gap-2 border transition-colors relative bg-surface/5 border-border-muted overflow-hidden">
                <Bus className="w-5 h-5 text-primary shrink-0 relative z-10" />
                <div className="flex flex-col flex-1 pl-1 relative z-10">
                  <span className="text-[9px] font-bold tracking-widest text-dim uppercase">رقم الخط</span>
                  <select 
                    className="w-full bg-transparent text-sm font-bold outline-none cursor-pointer" 
                    style={{ color: 'var(--color-base)' }}
                    value={selectedRouteId.split('-')[0] || ''} 
                    onChange={(e) => {
                        const line = e.target.value;
                        const newRouteId = `${line}-outbound`;
                        const route = routes.find(r => r.id === newRouteId) || routes.find(r => r.id.startsWith(`${line}-`));
                        if (route) {
                            setSelectedRouteId(route.id);
                            setSelectedStopId(route.stops[0].id);
                        }
                    }}
                  >
                    {Array.from(new Set(routes.map(r => r.id.split('-')[0]))).map(line => 
                      <option key={line} value={line} className="bg-[var(--color-main)]">{line}</option>
                    )}
                  </select>
                </div>
              </div>
              
              <div className="flex-[2.5] flex items-center px-4 py-3 rounded-[24px] gap-2 border transition-colors relative bg-surface/5 border-border-muted overflow-hidden">
                <Navigation className="w-4 h-4 text-emerald-400 shrink-0 relative z-10" />
                <div className="flex flex-col flex-1 pl-1 relative z-10">
                  <span className="text-[9px] font-bold tracking-widest text-dim uppercase">الإتجاه</span>
                  <select 
                    className="w-full bg-transparent text-xs font-medium outline-none cursor-pointer truncate" 
                    style={{ color: 'var(--color-base)' }}
                    value={selectedRouteId} 
                    onChange={(e) => {
                        const newRouteId = e.target.value;
                        const route = routes.find(r => r.id === newRouteId);
                        if (route) {
                            setSelectedRouteId(newRouteId);
                            setSelectedStopId(route.stops[0].id);
                        }
                    }}
                  >
                    {routes.filter(r => r.id.startsWith((selectedRouteId.split('-')[0] || '') + '-')).map(r => {
                       const dirName = r.name.replace(/^L\d+: /, '');
                       return <option key={r.id} value={r.id} className="bg-[var(--color-main)]">{dirName}</option>;
                    })}
                  </select>
                </div>
              </div>
          </div>
          
          <div className="flex-1 flex items-center px-4 py-3 rounded-[24px] gap-2 border transition-colors relative bg-surface/5 border-border-muted overflow-hidden">
            <MapPin className="w-5 h-5 text-indigo-400 shrink-0 relative z-10" />
            <div className="flex flex-col flex-1 pl-1 relative z-10">
              <span className="text-[9px] font-bold tracking-widest text-dim uppercase">المحطة</span>
              <select 
                className="w-full bg-transparent text-sm font-medium outline-none cursor-pointer" 
                style={{ color: 'var(--color-base)' }}
                value={selectedStopId} 
                onChange={(e) => setSelectedStopId(e.target.value)}
              >
                {routes.find(r => r.id === selectedRouteId)?.stops.map(s => <option key={s.id} value={s.id} className="bg-[var(--color-main)]">{s.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* All Routes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-sm uppercase tracking-widest opacity-50 flex items-center gap-2">
               <CalendarIcon className="w-4 h-4" />
               {t.busSchedule}
            </h3>
          </div>
          
          {routes.filter(r => r.id === selectedRouteId).map(route => {
            const stop = route.stops.find(s => s.id === selectedStopId) || route.stops[0];
            const isFav = userSettings?.favoriteStops?.includes(`${route.id}:${stop.id}`);
            const dist = userLocation ? calculateDistance(userLocation.lat, userLocation.lng, stop.latitude, stop.longitude) : null;
            return (
            <motion.div 
              key={route.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="theme-card relative group overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20 font-bold">{t.activeStatus}</span>
                    <span className="font-bold text-sm tracking-tight">{stop.name}</span>
                    <button onClick={() => toggleFavorite(route.id, stop.id)} className="p-1.5 bg-zinc-800/50 hover:bg-zinc-700 rounded-full transition-colors">
                        <Star className={`w-4 h-4 ${isFav ? 'text-amber-400 fill-amber-400' : 'text-zinc-500'}`} />
                    </button>
                  </div>
                  {dist !== null && (
                    <span className="text-xs text-zinc-500 font-mono">
                      {dist < 1 ? `${Math.round(dist * 1000)}m away` : `${dist.toFixed(1)}km away`}
                    </span>
                  )}
                </div>
                <div className="p-2 bg-indigo-500/10 rounded-xl">
                   <Bus className="w-4 h-4 text-indigo-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Time Grid */}
                <div className="grid grid-cols-1 gap-3">
                    {(() => {
                        const now = new Date();
                        const currentHM = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                        const allTimes = stop.times || [];
                        
                        // normalize current time to zero seconds for precise minute calculation
                        const nowRounded = new Date(now);
                        nowRounded.setSeconds(0, 0);

                        const expandedTimes = [];
                        for (const dayOffset of [-1, 0, 1]) {
                            for (const t of allTimes) {
                                const [h, m] = t.time.split(':').map(Number);
                                const targetTime = new Date(nowRounded);
                                targetTime.setDate(targetTime.getDate() + dayOffset);
                                targetTime.setHours(h, m, 0, 0);
                                
                                if (t.status === 'delayed' && t.delayMinutes) {
                                    targetTime.setMinutes(targetTime.getMinutes() + t.delayMinutes);
                                }
                                
                                const diffMinutes = Math.round((targetTime.getTime() - nowRounded.getTime()) / 60000);
                                
                                const nowDay = new Date(nowRounded.getFullYear(), nowRounded.getMonth(), nowRounded.getDate()).getTime();
                                const targetDay = new Date(targetTime.getFullYear(), targetTime.getMonth(), targetTime.getDate()).getTime();
                                const dayDiff = Math.round((targetDay - nowDay) / 86400000);

                                expandedTimes.push({
                                    original: t,
                                    targetTime,
                                    diffMinutes,
                                    isNextDay: dayDiff > 0,
                                    isPreviousDay: dayDiff < 0
                                });
                            }
                        }

                        expandedTimes.sort((a, b) => a.diffMinutes - b.diffMinutes);

                        // Don't count cancelled buses as "Passed" since they didn't pass
                        const passedTimes = expandedTimes.filter(t => t.diffMinutes < 0 && t.original.status !== 'cancelled');
                        const upcomingTimes = expandedTimes.filter(t => t.diffMinutes >= 0);
                        
                        const lastPassed = passedTimes.length > 0 ? passedTimes[passedTimes.length - 1] : null;
                        const nextUpcoming = upcomingTimes.slice(0, 5);

                        return (
                            <>
                                {lastPassed && (() => {
                                    const diffMinutes = Math.abs(lastPassed.diffMinutes);
                                    let passedDisplay = '';
                                    if (lastPassed.isPreviousDay || diffMinutes > 60) {
                                        passedDisplay = lastPassed.isPreviousDay ? `الأمس ${lastPassed.original.time}` : lastPassed.original.time;
                                    } else {
                                        passedDisplay = diffMinutes === 0 ? 'الآن' : `${diffMinutes} دقيقة مضت`;
                                    }
                                    
                                    return (
                                        <div className="p-3 bg-zinc-900/50 border border-zinc-700/50 rounded-xl flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <Clock className="w-4 h-4 text-zinc-500" />
                                                <span className="text-xs font-bold text-zinc-500">السابق:</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex gap-1">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleFeedback(route.id, stop.id, lastPassed.original.time, 'LATE'); }}
                                                        className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 hover:bg-amber-500/20"
                                                    >
                                                        متأخر؟
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleFeedback(route.id, stop.id, lastPassed.original.time, 'NEVER'); }}
                                                        className="text-[9px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20 hover:bg-red-500/20"
                                                    >
                                                        لم يصل؟
                                                    </button>
                                                </div>
                                                <span className="text-sm font-mono tracking-tighter text-zinc-400">
                                                    {passedDisplay}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })()}
                                {nextUpcoming.map((item, idx) => {
                                    const diffMinutes = item.diffMinutes;
                                    const isCancelled = item.original.status === 'cancelled';
                                    const isDelayed = item.original.status === 'delayed';
                                    const timeDisplay = item.isNextDay ? `غداً ${item.original.time}` : item.original.time;
                                    const isPulsing = idx === 0 && diffMinutes <= 10 && !isCancelled;
                                    
                                    let rowClass = 'bg-zinc-800/30 border-zinc-700/30';
                                    if (idx === 0) {
                                        rowClass = isPulsing 
                                            ? 'bg-emerald-900/40 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-pulse' 
                                            : 'bg-indigo-900/20 border-indigo-500/30';
                                    }

                                    return (
                                        <div key={`upcoming-${idx}`} className={`p-3 border rounded-xl flex items-center justify-between gap-3 ${rowClass}`}>
                                            <div className="flex items-center gap-3">
                                                <Clock className={`w-4 h-4 ${idx === 0 ? (isPulsing ? 'text-emerald-400' : 'text-indigo-400') : 'text-zinc-500'}`} />
                                                <span className={`text-xs font-bold ${idx === 0 ? (isPulsing ? 'text-emerald-300' : 'text-indigo-200') : 'text-zinc-500'}`}>
                                                    {idx === 0 ? 'القادم:' : 'التالي:'}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center gap-3 text-right">
                                                {idx === 0 && !isCancelled && diffMinutes > 5 && (
                                                    <button 
                                                        onClick={() => setReminder(item.original.time)}
                                                        className={`p-1.5 rounded-full ${reminders[item.original.time] ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'}`}
                                                    >
                                                        {reminders[item.original.time] ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                                                    </button>
                                                )}
                                                
                                            {/* Feedback buttons */}
                                                {!isCancelled && idx === 0 && (
                                                    <div className="flex gap-1">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleFeedback(route.id, stop.id, item.original.time, 'LATE'); }}
                                                            className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 hover:bg-amber-500/20"
                                                        >
                                                            متأخر؟
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleFeedback(route.id, stop.id, item.original.time, 'NEVER'); }}
                                                            className="text-[9px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20 hover:bg-red-500/20"
                                                        >
                                                            لم يصل؟
                                                        </button>
                                                    </div>
                                                )}

                                                {isCancelled ? (
                                                    <span className="text-xs font-bold text-red-500">ملغاة</span>
                                                ) : (
                                                    <span className="text-sm font-mono tracking-tighter flex items-center gap-2">
                                                        {diffMinutes > 60 ? timeDisplay : (diffMinutes === 0 ? 'الآن' : `بعد ${diffMinutes} د`) }
                                                        {isDelayed && <span className="text-[10px] text-amber-500">+{item.original.delayMinutes}د</span>}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* All Stops in route */}
                                <div className="mt-4 p-3 bg-zinc-800/20 rounded-xl">
                                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">المسار:</span>
                                  <div className="text-xs text-zinc-300 space-y-1">
                                    {route.stops.map((s, sIdx) => (
                                        <div key={s.id} className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${s.id === selectedStopId ? 'bg-indigo-500' : 'bg-zinc-600'}`}/>
                                            <span className={s.id === selectedStopId ? 'text-indigo-400 font-bold' : ''}>{s.name}</span>
                                        </div>
                                    ))}
                                  </div>
                                </div>
                            </>
                        )
                    })()}
                </div>
              </div>
            </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
