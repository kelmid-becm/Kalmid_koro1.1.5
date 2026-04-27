import { AppTranslations } from './locales/translations';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { DateTimePicker } from './components/DateTimePicker';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { HabitTracker } from './components/HabitTracker';
import { AIChat } from './components/AIChat';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { FloatingCompanion } from './components/FloatingCompanion';
import { WeatherWidget } from './components/WeatherWidget';
import { useCalendar } from './hooks/useCalendar';
import { useAI } from './hooks/useAI';
import { useNotifications } from './hooks/useNotifications';
import { useUserStore } from './store/useUserStore';
import { imageAIService } from './services/imageAIService';
import { AIAssistant } from './components/AIAssistant';
import { OfflineAdvisor } from './components/OfflineAdvisor';
import { AISettings } from './components/AISettings';
import { AIDashboard } from './components/AIDashboard';
import { speechService } from './services/speechService';
import { 
  Calendar as CalendarIcon,
  CalendarDays,
  MessageSquare, 
  Image as ImageIcon,
  Wallpaper,
  Plus, 
  Send,
  Trash2, 
  BellRing,
  Clock, 
  ChevronLeft, 
  ChevronRight,
  BrainCircuit,
  Brain,
  Activity,
  Flame,
  AlertCircle,
  FileText,
  Volume2,
  VolumeX,
  Languages,
  X,
  StopCircle,
  Maximize,
  Minimize,
  ShieldCheck,
  Bell,
  MapPin,
  Mic,
  MicOff,
  Book,
  GraduationCap,
  Dumbbell,
  Coffee,
  Utensils,
  Briefcase,
  Users,
  Video,
  Stethoscope,
  ShoppingCart,
  Music,
  Plane,
  Heart,
  Paperclip,
  Settings,
  AlarmClock,
  Timer,
  BarChart3,
  Hourglass,
  Check,
  Sparkles,
  Home,
  Calendar,
  Bus,
  Target,
  Menu
} from 'lucide-react';
import { getSmartIcon } from './services/icons';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarEvent, ViewMode, ChatMessage, Habit, UserStats } from './types';
import { useSettingsStore } from './store/useSettingsStore';
import { useBusStore } from './store/useBusStore';
import { useCalendarStore } from './store/useCalendarStore';
import { useHabitStore } from './store/useHabitStore';
import { db } from './services/db';
import { geminiService } from './services/gemini';
import { translations, Language } from './locales/translations';
import AnalyticsModal from './components/AnalyticsModal';
import ChatHistoryModal from './components/ChatHistoryModal';
import MissedEventModal from './components/MissedEventModal';
import WeeklyViewModal from './components/WeeklyViewModal';
import AddEventModal from './components/AddEventModal';
import EditEventModal from './components/EditEventModal';
import SettingsModal from './components/SettingsModal';
import TrashModal from './components/TrashModal';
import ProgressBar from './components/ProgressBar';
import { BusSchedule } from './components/BusSchedule';

import { EventCard } from './components/EventCard';
import { LevelBadge } from './components/LevelBadge';
import { Navigation } from './components/Navigation';

const App = () => {
  const { events, trash: trashEvents, loading, addEvent, addRawEvent, deleteEvent, updateEvent, toggleComplete, restoreEvent, deleteFromTrash, emptyTrash, clearAll, clearDay, loadEvents } = useCalendar();
  const { habits, addHabit, toggleHabit, deleteHabit } = useHabitStore();
  const { settings, chatHistory, initialized, init, updateSettings, addChatMessage, updateChatMessage, clearChatHistory, addPendingCommand, clearPendingCommands } = useSettingsStore();

  useEffect(() => {
    init();
    useBusStore.getState().fetchRoutes();
  }, [init]);
  const { parseCommand } = useAI();
  const { triggerNotification, scheduleReminder, requestPermission } = useNotifications();
  
  // Clean up remaining setEvents usage if any.
  // The goal is to route ALL event modifications through the hook.
  
  const language = settings.language as Language;
  const setLanguage = (lang: Language) => updateSettings({ language: lang });
  const thinkingAbortControllerRef = useRef<AbortController | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('today');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chatQuery, setChatQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [activeUiRoom, setActiveUiRoom] = useState<'assistant' | 'planner'>('assistant');
    const [isListening, setIsListening] = useState(false);
  const [isWeeklyViewOpen, setIsWeeklyViewOpen] = useState(false);
  const [missedEventToHandle, setMissedEventToHandle] = useState<CalendarEvent | null>(null);
  const [isSettingsOpenState, setIsSettingsOpenState] = useState(false);
  const isSettingsOpen = !settings.onboardingShown || isSettingsOpenState;
  const setIsSettingsOpen = (v: boolean) => {
    if (!v) updateSettings({ onboardingShown: true });
    setIsSettingsOpenState(v);
  };
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [forcedOffline, setForcedOffline] = useState(false);
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voiceMode = settings.voiceMode;
  const constraintsRef = useRef(null);
  const toggleVoiceMode = () => updateSettings({ voiceMode: !voiceMode });

  useEffect(() => {
    if (aiResponse && voiceMode) {
      setIsSpeaking(true);
      speechService.speak(aiResponse, language === 'ar' ? 'ar-SA' : (language === 'fr' ? 'fr-FR' : 'en-US'), () => {
        setIsSpeaking(false);
      });
    }
  }, [aiResponse, voiceMode, language]);
  
  const [isFullChatOpen, setIsFullChatOpen] = useState(false);
  const [isAIChatExpanded, setIsAIChatExpanded] = useState(false);
  const [isAIChatFloatingOpen, setIsAIChatFloatingOpen] = useState(false); // Track floating chat state
  const [isHabitsOpen, setIsHabitsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [chatView, setChatView] = useState<'chat' | 'habits'>('chat');
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const backgroundImage = settings.background;
  const setBackgroundImage = (bg: string | null) => updateSettings({ background: bg });
  const pendingCommands = settings.pendingCommands;
  const setPendingCommands = (cmds: string[]) => updateSettings({ pendingCommands: cmds });
  const [activeAlarm, setActiveAlarm] = useState<CalendarEvent | null>(null);
  const [globalNow, setGlobalNow] = useState(new Date());
  const [isKeepScreenOn, setIsKeepScreenOn] = useState(false);
  const isSilentMode = settings.silentMode;
  const setIsSilentMode = (silentMode: boolean) => updateSettings({ silentMode });
  const isDarkMode = settings.theme !== 'light';
  const setIsDarkMode = (dark: boolean) => updateSettings({ theme: dark ? 'dark' : 'light' });
  const [wakeLock, setWakeLock] = useState<any>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() => {
    if (typeof Notification === 'undefined') return 'denied';
    return Notification.permission;
  });

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.targetTouches[0].clientX > window.innerWidth - 50) {
      touchStartX.current = e.targetTouches[0].clientX;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const absDistance = Math.abs(distance);
    
    // Minimum distance for a swipe to trigger
    if (absDistance < 100) return;

    // Swipe Left (distance > 0) -> Open
    // Swipe Right (distance < 0) -> Close
    if (distance > 50) setIsMobileSidebarOpen(true);
    else if (distance < -50) setIsMobileSidebarOpen(false);
    
    touchStartX.current = null;
    touchEndX.current = null;
  };
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    const timer = setInterval(() => setGlobalNow(new Date()), 1000);
    // Poll notification permission
    const notifTimer = setInterval(() => {
      if (typeof Notification !== 'undefined') {
        setNotifPermission(Notification.permission);
      }
    }, 2000);
    return () => {
      clearInterval(timer);
      clearInterval(notifTimer);
    };
  }, []);

  // --- Screen Wake Lock Logic ---
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (isKeepScreenOn && wakeLock !== null && document.visibilityState === 'visible') {
        try {
          const wl = await (navigator as any).wakeLock.request('screen');
          setWakeLock(wl);
        } catch (err) {
          console.error("Wake Lock re-request failed", err);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isKeepScreenOn, wakeLock]);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '' });

  const showAlert = (title: string, message: string) => {
    setAlertData({ title, message });
    setIsAlertOpen(true);
  };

  const toggleWakeLock = async () => {
    if (isKeepScreenOn) {
      if (wakeLock) {
        try {
          await wakeLock.release();
        } catch (e) {
          console.error("Release failed", e);
        }
        setWakeLock(null);
      }
      setIsKeepScreenOn(false);
    } else {
      try {
        if ('wakeLock' in navigator) {
          const wl = await (navigator as any).wakeLock.request('screen');
          setWakeLock(wl);
          setIsKeepScreenOn(true);
        } else {
          showAlert(t.confirmDialog, t.wakeLockNotSupported);
        }
      } catch (err: any) {
        console.error("Wake Lock failed", err);
        // Special handling for permission policy errors in iframes
        if (err.name === 'NotAllowedError' || err.message.includes('disallowed by permissions policy')) {
          setIsKeepScreenOn(false);
          // Show a more helpful message for iframe environments
          showAlert(t.confirmDialog, t.wakeLockIframe || "Keep Screen On requires opening the app in a new tab due to security policies.");
        } else {
          showAlert(t.confirmDialog, t.wakeLockError + err.message);
        }
      }
    }
  };

  const effectiveOnline = isOnline && !forcedOffline;
  
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const wakeWordRecognitionRef = useRef<any>(null);

  // Form state for adding event
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    details: '',
    date: new Date().toISOString().slice(0, 10),
    startTime: '',
    endTime: '',
    priority: 'medium' as const,
    type: 'personal' as const,
    enableReminder: false,
    enableAlarm: false,
  });

  const [permissionStates, setPermissionStates] = useState({ notif: false, loc: false, mic: false });
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStates(s => ({ ...s, notif: Notification.permission === 'granted' }));
    }
    navigator.permissions?.query({ name: 'geolocation' }).then(res => {
      setPermissionStates(s => ({ ...s, loc: res.state === 'granted' }));
    });
    navigator.permissions?.query({ name: 'microphone' as any }).then(res => {
      setPermissionStates(s => ({ ...s, mic: res.state === 'granted' }));
    });
  }, [showPermissionsModal]);

  const t = translations[language];
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
  };
  
  useEffect(() => {
    
  }, [language]);

  useEffect(() => {
    
  }, [isSilentMode]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.remove('light');
    } else {
      root.classList.add('light');
    }
  }, [isDarkMode]);

  // Handle document direction (RTL/LTR)
  useEffect(() => {
    document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
        
    const savedKey = settings.geminiKey;
    if (savedKey) setGeminiKeyInput(savedKey);
    else updateSettings({ onboardingShown: true });

    if (!settings.onboardingShown) {
        setShowPermissionsModal(true);
    }
    
    const handleOnline = () => {
      setIsOnline(true);
      setAiResponse(t.aiWelcomeBack);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setAiResponse(t.aiOfflineWarn);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    // Initialize Audio for Alarms
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/995/995-preview.mp3');
    audioRef.current.loop = true;

    // Heartbeat check every 30s to ensure isOnline is accurate
    const heartbeat = setInterval(() => {
      const current = navigator.onLine;
      if (current !== isOnline) {
        setIsOnline(current);
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(heartbeat);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []); // Only run once on mount

      // Alarm Monitoring Effect
  useEffect(() => {
    const alarmChecker = setInterval(() => {
      const now = new Date();
      const currentEvents = useCalendarStore.getState().events;
      
      // Check for alarms
      const fireableAlarm = currentEvents.find(event => {
        if (!event.enableAlarm || event.alarmFired || event.isCompleted) return false;
        
        const targetTime = event.snoozeTime ? new Date(event.snoozeTime) : new Date(event.startTime);
        // Fire if we are within the same minute
        return now.getTime() >= targetTime.getTime() && (now.getTime() - targetTime.getTime() < 60000);
      });

      // Check for high-priority reminders (30 mins before)
      const fireableReminder = currentEvents.find(event => {
        if (event.isCompleted || event.reminded || event.priority !== 'high') return false;
        const startTime = new Date(event.startTime);
        const diff = startTime.getTime() - now.getTime();
        // Fire if we are within the 30-31 minute window
        return diff > 0 && diff <= 30 * 60 * 1000 && diff > 29 * 60 * 1000;
      });

      if (fireableAlarm && !activeAlarm) {
        setActiveAlarm(fireableAlarm);
        if (audioRef.current && !isSilentMode) {
          audioRef.current.play().catch(e => console.log('Audio play failed:', e));
        }
        
        // Notification
        if (Notification.permission === 'granted') {
          new Notification(t.alarmTitle, {
            body: fireableAlarm.title,
            icon: '/app-icon.png',
            tag: 'kelmid-alarm',
            requireInteraction: true
          });
        }
      } else if (fireableReminder) {
         // High priority reminder
         if (Notification.permission === 'granted') {
           new Notification(t.importantEventTitle, {
             body: `${t.importantEventBody} ${fireableReminder.title}`,
             icon: '/app-icon.png',
             tag: `reminder-${fireableReminder.id}`,
             requireInteraction: true
           });
         }
         // Mark as reminded to prevent re-firing
         addRawEvent({ ...fireableReminder, reminded: true });
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(alarmChecker);
  }, [activeAlarm, t.alarmTitle]);

  const handleRequestPermission = async () => {
    if (typeof Notification === 'undefined') return;
    
    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      if (permission === 'granted') {
          new Notification(t.appName, {
            body: t.notifActivatedBody,
            icon: "/app-icon.png"
          });
      }
    } catch (e) {
      console.error("Notification request failed", e);
      // Fallback for older browsers
      Notification.requestPermission((permission) => {
        setNotifPermission(permission);
      });
    }
  };

  const handleStopAlarm = () => {
    if (activeAlarm) {
      updateEvent(activeAlarm.id, { alarmFired: true, snoozeTime: undefined });
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setActiveAlarm(null);
    }
  };

  const handleFileImport = async (file: File) => {
    setIsAiLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const extracted = await imageAIService.extractScheduleFromImage(base64, file.type);
        
        const newEvents: CalendarEvent[] = extracted.map(item => {
          const id = crypto.randomUUID();
          let startStr = item.startTime || '09:00';
          let endStr = item.endTime || '10:00';

          const newEvt: CalendarEvent = {
            id,
            title: item.title || t.ocrDefaultTitle,
            description: item.description || '',
            details: '',
            date: new Date().toISOString().slice(0, 10),
            startTime: startStr,
            endTime: endStr,
            priority: (item.priority as any) || 'medium',
            type: 'personal',
            enableReminder: true,
            enableAlarm: false,
            isCompleted: false
          };
          addRawEvent(newEvt);
          return newEvt;
        });
        
        setAiResponse(t.ocrSuccess.replace('{count}', newEvents.length.toString()));
      } catch (e) {
        setAiResponse(t.ocrError);
      } finally {
        setIsAiLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSnooze = (minutes: number) => {
    if (activeAlarm) {
      handleSnoozeForEvent(activeAlarm.id, minutes);
    }
  };

  const handleSnoozeForEvent = (eventId: string, minutes: number) => {
    const snoozeUntil = new Date(Date.now() + minutes * 60000).toISOString();
    const updatedEvents = events.map(e => 
      e.id === eventId ? { ...e, snoozeTime: snoozeUntil, alarmFired: false } : e
    );
    const eventToSave = updatedEvents.find(e => e.id === eventId);
    if (eventToSave) addRawEvent(eventToSave);

    if (audioRef.current && activeAlarm?.id === eventId) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setActiveAlarm(null);
    }
  };

  // Global Alarm function
  const playAlarm = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const beep = (time: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, time);
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        osc.start(time);
        osc.stop(time + 0.2);
      };
      beep(ctx.currentTime);
      beep(ctx.currentTime + 0.3);
      beep(ctx.currentTime + 0.6);
      beep(ctx.currentTime + 1.2);
      beep(ctx.currentTime + 1.5);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    // Auto-sync pending commands when coming back online
    if (effectiveOnline && pendingCommands.length > 0) {
      const syncCommands = async () => {
        setAiResponse(t.syncingCommands.replace("{count}", pendingCommands.length.toString()));
        const commandsToSync = [...pendingCommands];
        clearPendingCommands();
        setPendingCommands([]);
        
        for (const cmd of commandsToSync) {
          await handleAskAi(cmd);
          // Small delay between syncs to not overwhelm
          await new Promise(r => setTimeout(r, 1000));
        }
      };
      // Short delay to let the UI breathe
      setTimeout(syncCommands, 2000);
    }
  }, [isOnline, forcedOffline]); // Re-run when status changes

  // Alarm loop
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      let hasUpdates = false;

      const updated = events.map(evt => {
        if (!evt.isCompleted && evt.enableReminder && !evt.reminded) {
          const eventStart = new Date(evt.startTime).getTime();
          const timeToStart = eventStart - now;
          
          // Trigger if: 
          // 1. It's within 15 minutes in the future
          // 2. Or it started less than 5 minutes ago (and we haven't reminded yet)
          const shouldRemind = (timeToStart > 0 && timeToStart <= 15 * 60 * 1000) || 
                             (timeToStart <= 0 && timeToStart >= -5 * 60 * 1000);

          if (shouldRemind) {
            hasUpdates = true;
            if ("Notification" in window && Notification.permission === "granted") {
              const notification = new Notification("Kelmid Smart Planner", {
                body: t.reminderBody.replace("{title}", evt.title).replace("{time}", new Date(evt.startTime).toLocaleTimeString(language === "ar" ? "ar-u-nu-latn" : "en-US", {hour:"2-digit", minute:"2-digit"})),
                icon: "/app-icon.png",
                badge: "/app-icon.png",
              } as any);
              notification.onclick = () => {
                window.focus();
                notification.close();
              };
            }
            playAlarm();
            return { ...evt, reminded: true };
          }
        }

        // Check for missed events (past end time by 5 mins and not completed)
        if (!evt.isCompleted && !evt.missedReminderFired) {
          const eventEnd = new Date(evt.endTime).getTime();
          if (now > eventEnd + 5 * 60 * 1000) { 
             hasUpdates = true;
             if (!missedEventToHandle) {
               setMissedEventToHandle(evt);
             }
             return { ...evt, missedReminderFired: true };
          }
        }
        return evt;
      });

      if (hasUpdates) {
        // Important: save to storage as well
        
      }
    }, 10000); // Check every 10s

    return () => clearInterval(interval);
  }, [events]);

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAiLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      updateSettings({ background: base64 });
      setBackgroundImage(base64);
      setIsAiLoading(false);
    };
    reader.readAsDataURL(file);
  };

  // --- Voice Wake Word ("وا خونا") logic ---
  useEffect(() => {
    if (!isWakeWordActive) {
      if (wakeWordRecognitionRef.current) {
        wakeWordRecognitionRef.current.stop();
        wakeWordRecognitionRef.current = null;
      }
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = language === 'fr' ? 'fr-FR' : language === 'en' ? 'en-US' : 'ar-SA';
    
    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.trim().toLowerCase();
        // If wake word is detected
        if (transcript.includes('يا اخونا') || transcript.includes('خونا') || transcript.includes('واخونا') || transcript.includes('يا خونا')) {
          playAlarm(); // Slight beep to acknowledge
          // Stop background listener temporarily so it doesn't conflict with main mic
          wakeWordRecognitionRef.current?.stop();
          startListening();
        }
      }
    };

    recognition.onerror = () => {
      // Ignore errors in passive mode
    };
    
    // Auto restart if it stops unexpectedly
    recognition.onend = () => {
       if (isWakeWordActive) recognition.start();
    };

    recognition.start();
    wakeWordRecognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [isWakeWordActive]);
  
  // --- End Voice logic ---

  useEffect(() => {
    if (isTrashOpen) {
          }
  }, [isTrashOpen, events]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime) return;
    
    // Request notification permission if needed
    if ((newEvent.enableReminder || newEvent.enableAlarm) && Notification.permission !== 'granted') {
      await requestPermission();
      setNotifPermission(Notification.permission);
    }
    
    const startTimeStr = new Date(newEvent.startTime).toISOString();
    const endTimeStr = new Date(newEvent.endTime).toISOString();
    const datePart = startTimeStr.split('T')[0];
    const startPart = startTimeStr.split('T')[1].substring(0,5);
    const endPart = endTimeStr.split('T')[1].substring(0,5);

    await addEvent(newEvent.title, datePart, startPart, endPart, newEvent.priority);
    setIsAddEventOpen(false);
    setNewEvent({ title: '', description: '', details: '', date: new Date().toISOString().slice(0, 10), startTime: '', endTime: '', priority: 'medium', type: 'personal', enableReminder: false, enableAlarm: false });
    setAiResponse(t.eventAddedAnalyze);
  };

  const handleDeleteEvent = async (id: string) => {
    await deleteEvent(id);
    setAiResponse(t.eventTrashed);
  };

  const { stats, addXp, incrementTasks, fetchStats } = useUserStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleToggleComplete = async (id: string) => {
    const event = events.find(e => e.id === id);
    if (!event) return;
    const wasCompleted = event.isCompleted;
    await toggleComplete(id);
    if (!wasCompleted) {
      incrementTasks(event.priority); // Tiered XP: High=20, Medium=10, Low=5
    }
  };

  useEffect(() => {
    const runDailyCheck = async () => {
      const habitsData = await db.habits.toArray();
      const result = await useUserStore.getState().checkDailyProgress(habitsData);
      
      if (result.penalized && result.message) {
        setAiResponse(result.message);
        triggerNotification(t.appName, result.message, 'penalty');
      }
    };

    if (!loading && events.length >= 0) {
      runDailyCheck();
    }
  }, [loading]);

  const handleUpdateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    const existing = events.find(e => e.id === id);
    if (!existing) return;

    // Standardize dates if they were changed in the input (could be local string YYYY-MM-DDTHH:mm)
    const formattedUpdates = { ...updates };
    if (updates.startTime) formattedUpdates.startTime = new Date(updates.startTime).toISOString();
    if (updates.endTime) formattedUpdates.endTime = new Date(updates.endTime).toISOString();

    // Logic for resetting flags
    const isTimeChanged = formattedUpdates.startTime && formattedUpdates.startTime !== existing.startTime;
    const isReminderToggled = formattedUpdates.enableReminder !== undefined && formattedUpdates.enableReminder !== existing.enableReminder;
    const isAlarmToggled = formattedUpdates.enableAlarm !== undefined && formattedUpdates.enableAlarm !== existing.enableAlarm;

    const finalUpdates = {
      ...formattedUpdates,
      reminded: (isTimeChanged || isReminderToggled) ? false : existing.reminded,
      alarmFired: (isTimeChanged || isAlarmToggled) ? false : existing.alarmFired,
      snoozeTime: isTimeChanged ? undefined : existing.snoozeTime
    };

    await updateEvent(id, finalUpdates);
    setIsEditEventOpen(false);
    setEditingEvent(null);
    setAiResponse(t.eventUpdatedAI);
  };

  const handleRestoreEvent = async (id: string) => {
    await restoreEvent(id);
        setAiResponse(t.eventRestoredAI);
  };

  const handlePermanentDelete = (id: string) => {
    setConfirmation({
      isOpen: true,
      title: t.deletePermanent,
      message: t.deletePermWarning,
      onConfirm: () => {
        deleteFromTrash(id);
                setConfirmation(null);
      }
    });
  };

  const handleEmptyTrash = () => {
    setConfirmation({
      isOpen: true,
      title: t.emptyTrash,
      message: t.emptyTrashWarning,
      onConfirm: () => {
        emptyTrash();
                setConfirmation(null);
      }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAiLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const extracted = await imageAIService.extractScheduleFromImage(base64, file.type);
        
        const newEvents: CalendarEvent[] = extracted.map(item => {
          const id = crypto.randomUUID();
          // Smarter time handling with normalization
          let startStr = item.startTime || '09:00';
          let endStr = item.endTime || '10:00';
          
          // Helper to sanitize HH:mm
          const sanitizeTime = (t: string) => {
            const match = t.match(/(\d{1,2})[:.](\d{2})/);
            if (match) {
              return `${match[1].padStart(2, '0')}:${match[2]}`;
            }
            return t.length === 5 ? t : "09:00";
          };

          const today = selectedDate.toISOString().split('T')[0];
          
          return {
            id,
            title: item.title || t.ocrDefaultTitle,
            description: item.description,
            date: today,
            startTime: sanitizeTime(startStr),
            endTime: sanitizeTime(endStr),
            priority: (item.priority as any) || 'medium',
            type: 'academic' as const
          };
        });

        // Save all at once
        newEvents.forEach(e => addRawEvent(e));
      } catch (error) {
        console.error("OCR Failed", error);
        setAiResponse(t.ocrError);
      } finally {
        setIsAiLoading(false);
        setIsUploadOpen(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const appendToHistory = (role: 'user'|'assistant', content: string, status?: 'sending' | 'sent' | 'pending' | 'error') => {
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date().toISOString(),
      status: status || (role === 'assistant' ? 'sent' : 'sent')
    };
    addChatMessage(newMessage);
    if (role === 'assistant') {
      setAiResponse(content);
    }
    return newMessage.id;
  };

  const handleAIAction = async (fullResponse: string) => {
    let finalResponse = fullResponse;
    const actionRegex = /\[\[ACTION: (.*?)\]\]/g;
    let match;
    
    while ((match = actionRegex.exec(fullResponse)) !== null) {
      try {
        const actionData = JSON.parse(match[1]);
        if (actionData.type === 'ADD_MULTI_EVENTS') {
          actionData.events.forEach((evt: Partial<CalendarEvent>) => {
             const defaultDate = new Date().toISOString().split('T')[0];
             const finalDate = evt.date || defaultDate;
             const finalTime = evt.startTime || '12:00';
             const finalEndTime = evt.endTime || '13:00';
             const event: CalendarEvent = { 
               title: 'AI Scheduled Event',
               date: finalDate,
               startTime: finalTime.includes('T') ? finalTime : `${finalDate}T${finalTime}:00`,
               endTime: finalEndTime.includes('T') ? finalEndTime : `${finalDate}T${finalEndTime}:00`,
               priority: evt.priority || 'medium',
               ...evt, 
               id: crypto.randomUUID(), 
               type: 'personal' 
             } as CalendarEvent;
             
             // Ensure ...evt doesn't overwrite our formatted times
             if (evt.startTime && !evt.startTime.includes('T')) event.startTime = `${finalDate}T${evt.startTime}:00`;
             if (evt.endTime && !evt.endTime.includes('T')) event.endTime = `${finalDate}T${evt.endTime}:00`;

             addRawEvent(event);
          });
        } else if (actionData.type === 'FORCE_ONLINE') {
          setForcedOffline(false);
          setIsOnline(true);
        } else if (actionData.type === 'FORCE_OFFLINE') {
          setForcedOffline(true);
          setIsOnline(false);
        } else if (actionData.type === 'ADD_EVENT') {
          const defaultDate = new Date().toISOString().split('T')[0];
          const finalDate = actionData.event.date || defaultDate;
          const finalTime = actionData.event.startTime || '12:00';
          const finalEndTime = actionData.event.endTime || '13:00';
          const event: CalendarEvent = { 
            title: 'AI Event',
            date: finalDate,
            startTime: finalTime.includes('T') ? finalTime : `${finalDate}T${finalTime}:00`,
            endTime: finalEndTime.includes('T') ? finalEndTime : `${finalDate}T${finalEndTime}:00`,
            priority: actionData.event.priority || 'medium',
            ...actionData.event, 
            id: crypto.randomUUID(), 
            type: 'personal' 
          } as CalendarEvent;

          // Ensure ...actionData.event doesn't overwrite formatting
          if (actionData.event.startTime && !actionData.event.startTime.includes('T')) event.startTime = `${finalDate}T${actionData.event.startTime}:00`;
          if (actionData.event.endTime && !actionData.event.endTime.includes('T')) event.endTime = `${finalDate}T${actionData.event.endTime}:00`;

          addRawEvent(event);
        } else if (actionData.type === 'ADD_HABIT') {
          addHabit(actionData.name);
        } else if (actionData.type === 'TOGGLE_HABIT') {
          toggleHabit(actionData.habitId);
        } else if (actionData.type === 'DELETE_HABIT') {
          deleteHabit(actionData.habitId);
        } else if (actionData.type === 'DELETE_EVENT') {
          deleteEvent(actionData.eventId);
        } else if (actionData.type === 'TOGGLE_COMPLETE') {
          handleToggleComplete(actionData.eventId);
        } else if (actionData.type === 'UPDATE_EVENT') {
          handleUpdateEvent(actionData.eventId, actionData.updates);
        } else if (actionData.type === 'RESTORE_EVENT') {
          const trash = useCalendarStore.getState().trash;
          const idToRestore = actionData.eventId || (trash.length > 0 ? trash[trash.length - 1].id : null);
          if (idToRestore) handleRestoreEvent(idToRestore);
        }
      } catch (e) {
        console.error("Failed to execute AI action", e);
      }
    }
    
    return finalResponse.replace(/\[\[ACTION: .*?\]\]/g, '').trim();
  };

  const executeAction = async (action: string, data: any) => {
    try {
      switch (action) {
        case 'CREATE_EVENT':
          if (data.title && data.date && data.time) {
            await addEvent(data.title, data.date, data.time, data.time, 'medium');
          }
          break;
        case 'ADD_HABIT':
          if (data.name) {
            await addHabit(data.name);
          }
          break;
        case 'GET_BUS_SCHEDULE':
          setViewMode('bus');
          break;
        case 'CLEAR_ALL':
          setConfirmation({
            isOpen: true,
            title: t.clearAll,
            message: t.clearAllConfirm,
            onConfirm: async () => {
              await clearAll();
              setConfirmation(null);
            }
          });
          break;
        case 'FORCE_ONLINE':
          setForcedOffline(false);
          break;
        case 'FORCE_OFFLINE':
          setForcedOffline(true);
          break;
      }
    } catch (e) {
      console.error("Execute Action Error:", e);
    }
  };

  const handleAskAi = async (overrideQuery?: string) => {
    if (thinkingAbortControllerRef.current) {
      thinkingAbortControllerRef.current.abort();
    }
    thinkingAbortControllerRef.current = new AbortController();
    const signal = thinkingAbortControllerRef.current.signal;

    const activeQuery = overrideQuery || chatQuery;
    if (!activeQuery.trim()) return;
    
    if (!overrideQuery) setChatQuery('');

    const userMsgId = crypto.randomUUID();
    addChatMessage({
      id: userMsgId,
      role: 'user',
      content: activeQuery,
      timestamp: new Date().toISOString(),
      status: 'sending'
    });

    const aiMsgId = crypto.randomUUID();
    addChatMessage({
      id: aiMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      status: 'sending'
    });

    setIsAiLoading(true);

    try {
      const isActuallyOnline = navigator.onLine; // Real check
      
      if (isActuallyOnline && effectiveOnline && !forcedOffline && !activeQuery.startsWith('[LOCAL]')) {
        // Preference: Call Gemini directly from frontend to comply with gemini-api skill
        const { geminiClient } = await import('./services/geminiClient');
        const { action, data: actionData } = await geminiClient.processCommand(activeQuery, { events, habits }, signal);
        
        const message = actionData.message || (action !== 'NONE' ? `Executing ${action}...` : "Understood.");
        
        updateChatMessage(userMsgId, { status: 'sent' });
        updateChatMessage(aiMsgId, { content: message, status: 'sent' });
        setAiResponse(message);

        if (action !== 'NONE') {
          await executeAction(action, actionData);
        }
      } else {
        // HYBRID FALLBACK: Offline logic
        const { response, action, data } = geminiService.processOfflineCommand(events, activeQuery.replace('[LOCAL]', ''));
        
        updateChatMessage(userMsgId, { status: 'sent' });
        updateChatMessage(aiMsgId, { content: response, status: 'sent' });
        setAiResponse(response);

        if (action !== 'NONE' || (data && data.type)) {
          await executeAction(action === 'NONE' ? data.type : action, data);
        }

        // Cache for sync if needed
        if (!isActuallyOnline) {
            addPendingCommand(activeQuery);
        }
      }
    } catch (error: any) {
      console.error("AI Error:", error);
      
      // AUTO-FALLBACK TO LOCAL ON FAILURE
      console.log("Falling back to local assistant due to remote error...");
      const { response, action, data } = geminiService.processOfflineCommand(events, activeQuery);
      
      updateChatMessage(userMsgId, { status: 'sent' });
      updateChatMessage(aiMsgId, { content: response + "\n\n*(Used Local Assistant due to network issue)*", status: 'sent' });
      setAiResponse(response);

      if (action !== 'NONE' || (data && data.type)) {
        await executeAction(action === 'NONE' ? data.type : action, data);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const changeDate = (days: number) => {
    setSelectedDate(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + days);
      return next;
    });
  };

  const isEventOnDate = (event: CalendarEvent, targetDate: Date) => {
    const eventDate = new Date(event.startTime);
    if (eventDate.toDateString() === targetDate.toDateString()) return true;

    if (event.isRecurring && event.recurrenceDays) {
      const dayOfWeek = targetDate.getDay().toString();
      const originalDateObj = new Date(event.date + "T00:00:00");
      originalDateObj.setHours(0, 0, 0, 0);
      const compareDateObj = new Date(targetDate);
      compareDateObj.setHours(0, 0, 0, 0);

      return event.recurrenceDays.includes(dayOfWeek) && compareDateObj >= originalDateObj;
    }
    return false;
  };

  const next7DaysEvents = events.filter(e => {
    const curr = new Date(selectedDate).setHours(0, 0, 0, 0);
    const nextWeek = curr + 7 * 24 * 60 * 60 * 1000;
    
    // Check each day in next 7 days
    for (let i = 0; i < 7; i++) {
        const d = new Date(curr + i * 24 * 60 * 60 * 1000);
        if (isEventOnDate(e, d)) return true;
    }
    return false;
  }).sort((a, b) => {
    const weight = { high: 0, medium: 1, low: 2 };
    const getTime = (evt: CalendarEvent) => {
      const d = new Date(evt.startTime);
      return d.getHours() * 60 + d.getMinutes();
    };
    const timeA = getTime(a);
    const timeB = getTime(b);
    if (timeA === timeB) {
       return weight[a.priority as keyof typeof weight] - weight[b.priority as keyof typeof weight];
    }
    return timeA - timeB;
  });

  const getNextEvent = () => {
    const nowMs = globalNow.getTime();
    
    // Check next 24 hours for events (including recurring)
    const upcoming: CalendarEvent[] = [];
    for(let i = 0; i <= 1; i++) {
      const d = new Date(globalNow);
      d.setDate(d.getDate() + i);
      const onThisDay = events.filter(e => isEventOnDate(e, d));
      onThisDay.forEach(e => {
        const startTime = new Date(e.startTime);
        const occurTime = new Date(d);
        occurTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
        if (occurTime.getTime() > nowMs && !e.isCompleted) {
           upcoming.push(e);
        }
      });
    }
    
    return upcoming.sort((a, b) => {
      const getOccurTime = (evt: CalendarEvent) => {
        const startTime = new Date(evt.startTime);
        const now = new Date();
        const t1 = new Date(now);
        t1.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
        if (t1.getTime() > nowMs) return t1.getTime();
        t1.setDate(t1.getDate() + 1);
        return t1.getTime();
      };
      return getOccurTime(a) - getOccurTime(b);
    })[0] || null;
  };

  const nextEvent = getNextEvent();

  const getHeroCountdown = (targetEvent: CalendarEvent) => {
    const startTime = new Date(targetEvent.startTime);
    const now = new Date();
    const occurTime = new Date(now);
    occurTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    if (occurTime.getTime() < now.getTime()) {
      occurTime.setDate(occurTime.getDate() + 1);
    }

    const diff = occurTime.getTime() - globalNow.getTime();
    if (diff < 0) return "00:00:00";
    const s = Math.floor((diff / 1000) % 60);
    const m = Math.floor((diff / 60000) % 60);
    const h = Math.floor((diff / 3600000) % 24);
    const d = Math.floor(diff / 86400000);

    const parts = [];
    if (d > 0) parts.push(`${d}${t.unitDay}`);
    parts.push(h.toString().padStart(2, '0'));
    parts.push(m.toString().padStart(2, '0'));
    parts.push(s.toString().padStart(2, '0'));
    return parts.join(':');
  };

  const handleClearDay = () => {
    setConfirmation({
      isOpen: true,
      title: t.clearDay,
      message: t.clearDayConfirm,
      onConfirm: async () => {
        const dayStr = selectedDate.toDateString();
        await clearDay(dayStr);
        setAiResponse(t.dayClearedAI);
        setConfirmation(null);
      }
    });
  };

  const handleClearAll = () => {
    setConfirmation({
      isOpen: true,
      title: t.clearAll,
      message: t.clearAllConfirm,
      onConfirm: async () => {
        await clearAll();
        setAiResponse(t.allClearedAI2);
        setConfirmation(null);
      }
    });
  };

  const getDateLabel = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t.today;
    if (diffDays === 1) return t.tomorrow;
    if (diffDays === -1) return t.yesterday;
    if (diffDays === 2) return t.in2Days;
    if (diffDays === -2) return t.daysAgo2;
    
    if (diffDays > 2) return t.inDays.replace("{days}", diffDays.toString());
    if (diffDays < -2) return t.daysAgo.replace("{days}", Math.abs(diffDays).toString());
    
    return t.today;
  };

  const handleSpeak = (text: string) => {
    if (isSilentMode) return; 
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }
      
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const isArabic = /[\u0600-\u06FF]/.test(text);
      utterance.lang = isArabic ? 'ar-SA' : language === 'fr' ? 'fr-FR' : 'en-US';
      utterance.rate = 0.9;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } else {
      showAlert(t.confirmDialog, t.speechNotSupported);
    }
  };

  const handleTranslate = async () => {
    if (!aiResponse) return;
    setIsAiLoading(true);
    try {
      const translated = await geminiService.translateText(aiResponse);
      setAiResponse(translated);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const processAudioAction = async (blob: Blob) => {
    if (!isOnline) {
      setAiResponse(t.voiceRequiresInternet);
      return;
    }
    setIsAiLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        try {
          const base64data = (reader.result as string).split(',')[1];
          const currentEvents = useCalendarStore.getState().events;
          const res = await geminiService.analyzeScheduleAudio(currentEvents, base64data, blob.type, selectedDate);
          
          let finalResponse = res;
          finalResponse = await handleAIAction(res);
          setAiResponse(finalResponse);
        } catch (e: any) {
          console.error("Audio Processing API Error:", e);
          if (e.message === 'API_KEY_MISSING') {
            setAiResponse(t.noApiKeyAIVoice);
          } else {
            setAiResponse(t.voiceError);
          }
        } finally {
          setIsAiLoading(false);
        }
      };
    } catch (e) {
      setIsAiLoading(false);
      setAiResponse(t.micDisabled);
    }
  };

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    clearTimeout(silenceTimerRef.current as NodeJS.Timeout);
    setIsListening(false);
  };

  const startListening = () => {
    stopListening();
    setIsListening(true);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showAlert(t.confirmDialog, t.voiceNotSupportedBrowser);
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === 'fr' ? 'fr-FR' : language === 'en' ? 'en-US' : 'ar-MA';
    
    recognition.onresult = (event: any) => {
        clearTimeout(silenceTimerRef.current as NodeJS.Timeout);
        silenceTimerRef.current = setTimeout(stopListening, 8000); 

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        if (interimTranscript) {
            setChatQuery(interimTranscript);
        }

        if (finalTranscript.trim()) {
            setChatQuery(finalTranscript);
            handleAskAi(finalTranscript);
            stopListening();
        }
    };

    recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error === 'no-speech' || event.error === 'network') {
             setTimeout(() => {
                if (isListening) startListening();
             }, 1000);
        } else {
            stopListening();
        }
    };

    try {
        recognition.start();
        recognitionRef.current = recognition;
        silenceTimerRef.current = setTimeout(stopListening, 10000);
    } catch (e) {
        console.error("Recognition start failed", e);
        setIsListening(false);
    }
  };

  const filteredEvents = events.filter(e => isEventOnDate(e, selectedDate))
    .sort((a, b) => {
        const getTime = (evt: CalendarEvent) => {
            const d = new Date(evt.startTime);
            return d.getHours() * 60 + d.getMinutes();
        };
        return getTime(a) - getTime(b);
    });

  const heroCountdownText = nextEvent ? getHeroCountdown(nextEvent) : "00:00:00";

  return (
    <div 
      ref={constraintsRef}
      className={`min-h-screen flex flex-col lg:flex-row transition-all duration-700 font-sans ${isDarkMode ? 'bg-main text-base' : 'light bg-main text-base'}`} 
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Dynamic Background */}
      {backgroundImage && (
        <div 
          className="fixed inset-0 z-0 opacity-10 pointer-events-none transition-opacity duration-1000 grayscale select-none"
          style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} 
        />
      )}

      <Navigation 
        viewMode={viewMode}
        setViewMode={setViewMode}
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        setIsTrashOpen={setIsTrashOpen}
        setIsAddEventOpen={setIsAddEventOpen}
        setIsAnalyticsOpen={setIsAnalyticsOpen}
        isOnline={isOnline}
        t={t}
        language={language}
      />

      {/* Main Experience Area */}
      <main className="flex-1 relative z-10 flex flex-col p-4 sm:p-8 lg:p-10 max-h-screen overflow-y-auto no-scrollbar pb-24 lg:pb-10" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="lg:hidden flex items-center justify-between mb-6">
          <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2 bg-surface border border-muted rounded-xl cursor-pointer transition-transform active:scale-95">
            <Menu className="w-6 h-6 text-dim" />
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight">Kelmid</h1>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <AnimatePresence mode="wait">
          {viewMode === 'today' && (
            <motion.div 
              key="today-agenda"
              className="flex flex-col gap-8 max-w-[1400px] pb-32 lg:pb-0"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="px-2 py-1 bg-primary/10 border border-primary/20 rounded-lg text-[10px] font-mono text-primary uppercase tracking-widest leading-none">
                      {t.focusMode}
                    </div>
                  </div>
                  <h2 className="text-5xl sm:text-7xl font-black tracking-tighter uppercase">{getDateLabel(selectedDate)}</h2>
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-mono text-dim tracking-[0.2em] uppercase pt-1">
                      {selectedDate.toLocaleDateString(language === 'ar' ? 'ar-u-nu-latn' : t.localeCode, { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                    <div className="h-px w-8 bg-muted md:hidden" />
                    <LevelBadge stats={stats} t={t} />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-1 bg-surface border border-muted rounded-2xl shadow-inner">
                  <button onClick={() => changeDate(-1)} className="p-3 text-dim hover:text-[var(--color-base)] hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all">
                    <ChevronLeft className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
                  </button>
                  <button 
                    onClick={() => setSelectedDate(new Date())}
                    className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95 text-xs uppercase tracking-widest"
                  >
                    {t.today}
                  </button>
                  <button onClick={() => changeDate(1)} className="p-3 text-dim hover:text-[var(--color-base)] hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-all">
                    <ChevronRight className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </header>

              {/* Advanced Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Hero Feature: Next Imminent Event */}
                <AnimatePresence>
                  {nextEvent && (
                    <motion.div 
                      key="hero-pulse"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="md:col-span-12 relative overflow-hidden theme-card bg-primary/5 border-primary/30 p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl shadow-primary/5 group"
                    >
                      <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                        <Sparkles className="w-64 h-64" />
                      </div>
                      
                      <div className="flex-shrink-0 relative">
                        <div className="w-32 h-32 rounded-full border-4 border-primary/20 flex items-center justify-center bg-primary/5 backdrop-blur-xl relative z-10">
                          <div className="text-center">
                            <span className="block text-[10px] font-mono text-primary uppercase tracking-widest mb-1">{t.imminent}</span>
                            <span className="font-digital text-2xl font-bold tracking-tighter">
                              {getHeroCountdown(nextEvent).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())}
                            </span>
                          </div>
                        </div>
                        {/* Pulse effect */}
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute inset-0 bg-primary/20 rounded-full"
                        />
                      </div>

                      <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                           <span className="text-[10px] font-mono text-dim uppercase tracking-[0.3em] font-bold">{t.nextAppointment}</span>
                        </div>
                        <h3 className="text-3xl md:text-4xl font-black tracking-tight mb-2 uppercase">{nextEvent.title}</h3>
                        <p className="text-dim text-sm max-w-lg mx-auto md:mx-0">
                          {nextEvent.description || (language === 'ar' ? 'سيدي، لديك موعد قادم قمت بجدولته مسبقاً.' : 'Sir, you have an upcoming appointment scheduled.')}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 w-full md:w-auto">
                        <button 
                          onClick={() => handleToggleComplete(nextEvent.id)}
                          className="btn-primary w-full md:w-auto flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" /> {t.markComplete}
                        </button>
                        <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-dim pt-2 uppercase">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(nextEvent.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {nextEvent.priority}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Column 1: Intelligence (3/12) */}
                <div className="md:col-span-12 lg:col-span-3 flex flex-col gap-6 order-2 lg:order-1">
                  <WeatherWidget language={language} t={t} />
                  
                  {/* Dedicated Next Appointment Card (Replacement for Home/Bus) */}
                  {nextEvent ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="theme-card bg-primary/5 border-primary/30 p-6 relative overflow-hidden group shadow-xl shadow-primary/10"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover:scale-125 transition-transform duration-700">
                        <Timer className="w-16 h-16 text-primary" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          <span className="text-[10px] font-mono text-primary uppercase tracking-widest font-black">{t.nextAppointment}</span>
                        </div>
                        <h4 className="text-xl font-black tracking-tight mb-4 uppercase line-clamp-2">{nextEvent.title}</h4>
                        <div className="flex flex-col gap-1">
                          <div className="text-3xl font-digital text-primary tracking-wider">
                            {getHeroCountdown(nextEvent)}
                          </div>
                          <span className="text-[9px] font-mono text-dim uppercase tracking-widest leading-none">{t.remainingTime}</span>
                        </div>
                        <button 
                          onClick={() => handleToggleComplete(nextEvent.id)}
                          className="mt-6 w-full py-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                        >
                          {t.markComplete}
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="theme-card border-dashed p-8 text-center bg-surface/30">
                       <Sparkles className="w-8 h-8 text-dim mx-auto mb-3 opacity-20" />
                       <p className="text-[10px] font-mono text-dim uppercase tracking-widest">{t.noEventsScheduled}</p>
                    </div>
                  )}

                  <HabitTracker t={t} language={language} />
                </div>

                {/* Column 2: The Core Agenda (6/12) */}
                <div className="md:col-span-12 lg:col-span-6 space-y-6 order-1 lg:order-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <h3 className="font-bold text-xl tracking-tight leading-none">{t.appointmentsToday}</h3>
                      <span className="bg-surface border border-muted px-2 py-0.5 rounded-lg font-mono text-[9px] text-dim">{filteredEvents.length}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setIsAddEventOpen(true)} className="p-2.5 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-110 transition-all active:rotate-90">
                        <Plus className="w-5 h-5" />
                      </button>
                      <button onClick={handleClearDay} className="p-2.5 bg-surface border border-muted text-dim hover:text-rose-500 rounded-xl transition-all">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {filteredEvents.length === 0 ? (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="theme-card py-24 flex flex-col items-center justify-center text-center border-dashed group cursor-pointer"
                          onClick={() => setIsAddEventOpen(true)}
                        >
                          <CalendarDays className="w-16 h-16 mb-4 text-dim opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-500" />
                          <p className="text-sm font-medium text-dim tracking-tight">{t.noEventsScheduled}</p>
                          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-dim/60 mt-2">{t.initializeDay}</p>
                        </motion.div>
                      ) : (
                        filteredEvents.map(event => (
                          <EventCard 
                            key={event.id}
                            event={event}
                            now={globalNow}
                            onDelete={handleDeleteEvent}
                            onToggleComplete={handleToggleComplete}
                            onEdit={(e) => { setEditingEvent(e); setIsEditEventOpen(true); }}
                            onImageUpload={handleFileImport}
                            t={t}
                          />
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Column 3: Bus & Utilities (3/12) */}
                <div className="md:col-span-12 lg:col-span-3 flex flex-col gap-6 order-3">
                  <BusSchedule t={t} language={language} />

                  <div className="theme-card p-5 bg-emerald-500/5 border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <h4 className="font-bold text-sm tracking-tight">{t.efficiency}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-input p-4 rounded-xl border border-muted">
                        <span className="text-[9px] font-mono text-dim uppercase block mb-1">{t.efficiency}</span>
                        <span className="text-2xl font-black">
                          {filteredEvents.length > 0 ? Math.round((filteredEvents.filter(e => e.isCompleted).length / filteredEvents.length) * 100) : 0}
                          <span className="text-sm opacity-30">%</span>
                        </span>
                      </div>
                      <div className="bg-input p-4 rounded-xl border border-muted">
                        <span className="text-[9px] font-mono text-dim uppercase block mb-1">{t.streak}</span>
                        <span className="text-2xl font-black text-emerald-400">{stats.activeStreaks || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {viewMode === 'calendar' && (
            <motion.div 
               key="timeline-experience"
               className="flex flex-col gap-10 max-w-[1200px]"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
            >
              <header>
                 <h2 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase mb-2">{t.calendar || 'Timeline'}</h2>
                 <p className="text-sm font-mono text-dim tracking-[0.2em] uppercase">{t.viewModeDesc || '7-Day Strategic Mapping'}</p>
              </header>

              <div className="theme-card p-0 overflow-hidden divide-y divide-muted border-muted">
                <div className="p-8 bg-surface/50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                        <CalendarDays className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg leading-tight">{t.weeklyStrategy}</h3>
                        <p className="text-[10px] font-mono text-dim uppercase tracking-widest">{next7DaysEvents.length} {t.tasksScheduled}</p>
                      </div>
                   </div>
                   <button onClick={() => setIsAnalyticsOpen(true)} className="btn-secondary py-2.5 flex items-center justify-center gap-2 text-xs">
                     <BarChart3 className="w-4 h-4" /> {t.fullAnalytics}
                   </button>
                </div>
                
                <div className="p-2 sm:p-8">
                  {next7DaysEvents.length > 0 ? (
                    <div className="overflow-x-auto no-scrollbar">
                      <table className="w-full text-left" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                        <thead>
                          <tr className="text-[10px] font-mono uppercase tracking-[0.3em] text-dim/50 border-b border-muted">
                            <th className="pb-6 font-normal">{t.temporalFrame}</th>
                            <th className="pb-6 font-normal">{t.taskEssence}</th>
                            <th className="pb-6 font-normal">{t.weight}</th>
                            <th className="pb-6 font-normal text-right">{t.integrity}</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-muted/30">
                          {next7DaysEvents.map((event) => (
                            <tr key={event.id} className="group hover:bg-white/5 transition-all">
                              <td className="py-6 whitespace-nowrap pr-8">
                                <div className="flex flex-col">
                                  <span className="font-bold text-base">{new Date(event.startTime).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' })}</span>
                                  <span className="text-[10px] font-mono text-dim uppercase tracking-widest">{new Date(event.startTime).toLocaleDateString('en-US', { weekday: 'short' })} • {new Date(event.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </td>
                              <td className="py-6 pr-8">
                                <div className="flex items-center gap-4">
                                  <div className="p-2 bg-input rounded-xl text-dim group-hover:text-indigo-400 transition-colors">
                                    {getSmartIcon(event.title)}
                                  </div>
                                  <span className={event.isCompleted ? 'line-through opacity-30 italic' : 'text-base font-semibold'}>{event.title}</span>
                                </div>
                              </td>
                              <td className="py-6 pr-8">
                                <span className={`text-[8px] font-mono px-2 py-0.5 rounded border uppercase tracking-widest border-muted ${
                                  event.priority === 'high' ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' : 
                                  event.priority === 'medium' ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' : 
                                  'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
                                }`}>
                                  {event.priority}
                                </span>
                              </td>
                              <td className="py-6 text-right">
                                <div className={`w-3 h-3 rounded-full inline-block transition-all shadow-[0_0_10px_transparent] ${event.isCompleted ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-amber-500/20 border border-amber-500/40 animate-pulse'}`} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-32 flex flex-col items-center justify-center text-center opacity-20">
                      <CalendarDays className="w-20 h-20 mb-6" />
                      <p className="text-xl font-bold uppercase tracking-widest">{t.temporalVoid}</p>
                      <p className="text-[10px] font-mono mt-2 tracking-[0.3em]">{t.noAgendaPeriod}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {viewMode === 'chat' && (
            <motion.div 
               key="chat-interface"
               className="flex flex-col gap-10 max-w-[1000px] h-full flex-1"
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 1.02 }}
            >
              <AIAssistant />
            </motion.div>
          )}

          {viewMode === ('local-assistant' as any) && (
             <motion.div
               key="local-assistant"
               className="h-full flex-1"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
             >
               <OfflineAdvisor 
                 onChat={handleAskAi}
                 isAiLoading={isAiLoading}
                 aiResponse={aiResponse}
                 t={t}
                 language={language}
               />
             </motion.div>
          )}

          {viewMode === 'ai-dashboard' && (
            <motion.div 
               key="ai-dashboard"
               className="h-full"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
            >
              <AIDashboard />
            </motion.div>
          )}

          {viewMode === 'ai-settings' && (
            <motion.div 
               key="ai-settings"
               className="h-full"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
            >
              <AISettings />
            </motion.div>
          )}

          {viewMode === 'bus' && (
            <motion.div 
               key="bus-interface"
               className="flex flex-col gap-10 max-w-[1400px] h-full"
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 1.02 }}
            >
              <BusSchedule t={t} language={language} />
            </motion.div>
          )}

          {viewMode === 'habits' && (
            <motion.div 
               key="habits-master"
               className="flex flex-col gap-10 max-w-[1000px]"
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 1.02 }}
            >
              <header>
                 <h2 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase mb-2">{t.habits || 'Progress'}</h2>
                 <p className="text-sm font-mono text-dim tracking-[0.2em] uppercase">{t.consistencyEngine}</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="md:col-span-2">
                   <HabitTracker t={t} language={language} />
                 </div>
                 <div className="space-y-6">
                    <div className="theme-card bg-surface/50 border-muted">
                       <h4 className="font-bold text-sm tracking-tight mb-4 uppercase font-mono text-dim opacity-50">{t.masteryStats}</h4>
                       <div className="space-y-4">
                           {(() => {
                             const totalCompletions = habits.reduce((sum, h) => sum + h.history.length, 0);
                             const activeStreaksCount = habits.filter(h => h.streak > 0).length;
                             
                             const today = new Date();
                             let possibleCompletions = habits.length * 7;
                             let actualCompletions = 0;
                             const last7Days = Array.from({length: 7}, (_, i) => {
                               const d = new Date(today);
                               d.setDate(d.getDate() - i);
                               return d.toISOString().split('T')[0];
                             });

                             habits.forEach(h => {
                               last7Days.forEach(day => {
                                  if (h.history.includes(day)) actualCompletions++;
                               });
                             });
                             
                             const consistencyPercent = possibleCompletions > 0 
                               ? Math.round((actualCompletions / possibleCompletions) * 100) 
                               : 0;

                             return (
                               <>
                                 <div className="flex justify-between items-center">
                                   <span className="text-xs text-dim">{t.totalVolume}</span>
                                   <span className="text-sm font-bold">{totalCompletions} {t.units}</span>
                                 </div>
                                 <div className="flex justify-between items-center">
                                   <span className="text-xs text-dim">{t.activeStreaks}</span>
                                   <span className="text-sm font-bold text-amber-500">x{activeStreaksCount} {t.activeStatus}</span>
                                 </div>
                                 <div className="flex justify-between items-center">
                                   <span className="text-xs text-dim">{t.consistency}</span>
                                   <span className="text-sm font-bold text-indigo-400">{consistencyPercent}%</span>
                                 </div>
                               </>
                             );
                           })()}
                       </div>
                    </div>
                    <div className="theme-card bg-indigo-600 p-6 text-white border-none shadow-2xl shadow-indigo-900/30">
                       <Sparkles className="w-8 h-8 mb-4 opacity-50" />
                       <h4 className="text-xl font-black tracking-tight mb-2 leading-none uppercase">{t.strategicAdvice}</h4>
                       <p className="text-xs opacity-70 leading-relaxed italic">{t.strategicQuote}</p>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {isUploadOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="theme-card p-8 max-w-sm w-full text-center"
            >
               <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Activity className="w-8 h-8 text-indigo-400" />
               </div>
               <h3 className="text-xl font-bold mb-2">{t.knowledgeUpload}</h3>
               <p className="text-dim text-sm mb-6">{t.knowledgeUploadDesc}</p>
               <button onClick={() => setIsUploadOpen(false)} className="btn-primary w-full py-3">{t.close}</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modals */}







      <ProgressBar isLoading={isAiLoading} />

      <AnalyticsModal 
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        events={events}
        stats={stats}
        t={t}
        language={language}
      />

      <ChatHistoryModal 
        isOpen={isFullChatOpen}
        onClose={() => setIsFullChatOpen(false)}
        chatHistory={chatHistory}
        chatQuery={chatQuery}
        setChatQuery={setChatQuery}
        handleAskAi={handleAskAi}
        isAiLoading={isAiLoading}
        startListening={startListening}
        isListening={isListening}
        effectiveOnline={effectiveOnline}
        t={t}
        language={language}
        onClear={() => {
          clearChatHistory();
                  }}
      />

      <MissedEventModal 
        event={missedEventToHandle}
        onClose={() => setMissedEventToHandle(null)}
        onConfirm={(id) => {
          handleToggleComplete(id.toString());
          setMissedEventToHandle(null);
        }}
        onSnooze={(id) => {
          handleSnoozeForEvent(id.toString(), 15);
          setMissedEventToHandle(null);
        }}
        t={t}
        language={language}
      />

      <WeeklyViewModal 
        isOpen={isWeeklyViewOpen}
        onClose={() => setIsWeeklyViewOpen(false)}
        next7DaysEvents={next7DaysEvents}
        t={t}
        language={language}
      />

      <ConfirmationDialog
        isOpen={isAlertOpen}
        title={alertData.title}
        message={alertData.message}
        onConfirm={() => setIsAlertOpen(false)}
        onCancel={() => setIsAlertOpen(false)}
        confirmText={t.understoodThanks || 'OK'}
        cancelText="" // Hide cancel for pure alerts
      />

      <ConfirmationDialog
        isOpen={!!confirmation?.isOpen}
        title={confirmation?.title || ''}
        message={confirmation?.message || ''}
        onConfirm={confirmation?.onConfirm || (() => {})}
        onCancel={() => setConfirmation(null)}
        confirmText={t.confirmDialog}
        cancelText={t.cancelDialog}
      />

      <AnimatePresence>
        {activeAlarm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center bg-indigo-950/95 backdrop-blur-3xl p-6"
          >
            <div className="w-full max-w-[360px] flex flex-col items-center text-center">
               <motion.div 
                 animate={{ scale: [1, 1.15, 1], rotate: [0, 8, -8, 0] }}
                 transition={{ repeat: Infinity, duration: 1.5 }}
                 className="w-32 h-32 bg-indigo-500/20 rounded-full flex items-center justify-center mb-10 border-4 border-indigo-400 shadow-[0_0_60px_rgba(129,140,248,0.6)]"
               >
                 <AlarmClock className="w-16 h-16 text-indigo-400" />
               </motion.div>
               <h2 className="text-4xl font-extrabold text-white mb-3 tracking-tight">{activeAlarm.title}</h2>
               <p className="text-indigo-200/60 font-mono mb-12 uppercase tracking-widest text-xs flex items-center gap-2">
                 <Clock className="w-4 h-4" /> {new Date(activeAlarm.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
               </p>
               <div className="grid grid-cols-1 w-full gap-5">
                  <button onClick={handleStopAlarm} className="w-full py-6 bg-rose-600 hover:bg-rose-700 text-white rounded-[2rem] font-black text-xl shadow-2xl transition-all active:scale-95">
                    <X className="w-6 h-6 inline mr-2" /> {t.stopAlarm}
                  </button>
                  <div className="grid grid-cols-3 gap-3">
                     {[5, 10, 30].map(mins => (
                       <button 
                         key={`alarm-snz-${activeAlarm.id}-${mins}`}
                         onClick={() => handleSnooze(mins)}
                         className="py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all flex flex-col items-center justify-center gap-1 active:scale-90"
                       >
                         <Timer className="w-4 h-4 text-indigo-400" />
                         <span className="text-[10px] font-bold uppercase">{mins}m</span>
                       </button>
                     ))}
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {viewMode !== 'chat' && (
        <>
          <FloatingCompanion 
            effectiveOnline={effectiveOnline}
            events={events}
            habits={habits}
            language={language}
            onChat={(msg) => { handleAskAi(msg); setChatQuery(''); }}
            aiResponse={aiResponse}
            isAiLoading={isAiLoading}
          />
          <AIChat 
            t={t}
            aiResponse={aiResponse}
            chatQuery={chatQuery}
            setChatQuery={setChatQuery}
            handleAskAi={handleAskAi}
            isAiLoading={isAiLoading}
            startListening={startListening}
            isListening={isListening}
            effectiveOnline={effectiveOnline}
            language={language}
            voiceMode={settings.voiceMode}
            toggleVoiceMode={() => updateSettings({ voiceMode: !settings.voiceMode })}
            isSpeaking={isSpeaking}
            activeRoom={activeUiRoom}
            onRoomChange={setActiveUiRoom}
          />

          {/* Quick Access Floating Icons removed as per user request */}
        </>
      )}
      {viewMode !== 'chat' && (
        <div className="fixed bottom-6 right-6 z-[200]">
          {/* AIChat's floating button component is typically handled by its own internal state, but here we can hide it */}
          {/* Instead of modifying AIChat again, we wrapper it or control it */}
        </div>
      )}
      {/* 
        NOTE: AIChat itself manages its button. 
        Need to ensure AIChat prop `isFullPage` correctly hides its button.
      */}
      <AddEventModal 
        isOpen={isAddEventOpen} 
        onClose={() => setIsAddEventOpen(false)} 
        onAdd={async (evt) => {
          await addRawEvent({ ...evt, id: Date.now().toString() } as CalendarEvent);
          setIsAddEventOpen(false);
          setAiResponse(t.eventAddedAnalyze);
        }}
        t={t}
        language={language}
        initialDate={selectedDate}
      />

      <AnimatePresence>
        {showPermissionsModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-2xl"
              onClick={() => {
                setShowPermissionsModal(false);
                updateSettings({ onboardingShown: true });
              }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1, y: -20 }}
              className="bg-surface border border-muted w-full max-w-xl rounded-3xl shadow-3xl p-8 relative flex flex-col gap-6 overflow-hidden"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-emerald-500" />
              
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-black tracking-tight mb-2">
                    {language === 'ar' ? 'تحسين تجربتك' : 'Elevate Your Experience'}
                  </h2>
                  <p className="text-dim text-sm leading-relaxed">
                    {language === 'ar' 
                      ? 'يحتاج Kelmid إلى بعض الأذونات ليعمل بأفضل شكل ممكن. يمكنك دائماً تغييرها لاحقاً.' 
                      : 'Kelmid requires specific permissions to perform at its peak. You can always adjust these later.'}
                  </p>
                </div>
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shrink-0">
                  <ShieldCheck className="w-7 h-7 text-primary" />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                   <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                      <Bell className="w-5 h-5" />
                   </div>
                   <div className="flex-1">
                      <p className="font-bold text-sm">{language === 'ar' ? 'التنبيهات' : 'Notifications'}</p>
                      <p className="text-xs text-dim text-right ml-0 mr-0">{language === 'ar' ? 'للحصول على تذكيرات ذكية بالمهام والفعاليات.' : 'Get smart reminders for tasks and events.'}</p>
                   </div>
                   <button 
                     onClick={async () => {
                       if ('Notification' in window) {
                           try {
                             const res = await Notification.requestPermission();
                             if (res === 'granted') {
                               setPermissionStates(s => ({ ...s, notif: true }));
                             } else {
                               showAlert(t.confirmDialog, language === 'ar' ? 'تم رفض إذن الإشعارات من النظام. يرجى تفعيله من إعدادات المتصفح/التطبيق.' : 'Notification permission was denied. Please enable it in your browser/app settings.');
                             }
                           } catch (e) {
                             showAlert(t.confirmDialog, language === 'ar' ? 'حدث خطأ أثناء طلب الإذن.' : 'An error occurred while requesting permission.');
                           }
                       } else {
                           showAlert(t.confirmDialog, language === 'ar' ? 'الإشعارات غير مدعومة في هذا المتصفح الداخلي (WebView). إذا كنت تستخدم تطبيقًا محولاً، يرجى فتح الموقع من متصفح Chrome الأصلي وإضافته للشاشة الرئيسية لتعمل الإشعارات.' : 'Notifications are not supported in this internal browser (WebView). Open the app in Google Chrome and add it to your homescreen.');
                       }
                     }}
                     className={`px-4 py-2 ${permissionStates.notif ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'} text-xs font-bold rounded-lg transition-colors border border-emerald-500/20 cursor-pointer`}
                   >
                     {permissionStates.notif ? (language === 'ar' ? 'تم التفعيل' : 'Granted') : (language === 'ar' ? 'تفعيل' : 'Grant')}
                   </button>
                </div>
 

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                   <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 text-blue-400">
                      <MapPin className="w-5 h-5" />
                   </div>
                   <div className="flex-1">
                      <p className="font-bold text-sm">{language === 'ar' ? 'الموقع' : 'Location'}</p>
                      <p className="text-xs text-dim">{language === 'ar' ? 'لتوفير معلومات دقيقة عن طقس منطقتك والحافلات.' : 'For localized weather and transit intelligence.'}</p>
                   </div>
                   <button 
                     onClick={() => {
                       if ('geolocation' in navigator) {
                         navigator.geolocation.getCurrentPosition(() => {
                            setPermissionStates(s => ({ ...s, loc: true }));
                         }, (error) => {
                            let msg = language === 'ar' ? 'فشل تحديد الموقع. يرجى تفعيله من إعدادات المتصفح/النظام.' : 'Location failed. Please enable it in your browser/system settings.';
                            if (error.code === 1) msg = language === 'ar' ? 'تم رفض إذن الموقع. يجب تفعيل الإذن من إعدادات الموبايل لهذا التطبيق.' : 'Location permission denied. You must grant the permission in your mobile settings for this app.';
                            alert(msg);
                         }, { enableHighAccuracy: false, timeout: 10000 });
                       } else {
                         alert(language === 'ar' ? 'الموقع الجغرافي غير مدعوم في هذا المتصفح. إذا كنت داخل تطبيق (WebView) يجب على مطور التطبيق منح الصلاحية.' : 'Geolocation is not supported in this browser. If you are inside an app (WebView), the app developer must grant the permission.');
                       }
                     }}
                     className={`px-4 py-2 ${permissionStates.loc ? 'bg-blue-500 text-white' : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400'} text-xs font-bold rounded-lg transition-colors border border-blue-500/20 cursor-pointer`}
                   >
                     {permissionStates.loc ? (language === 'ar' ? 'تم التفعيل' : 'Granted') : (language === 'ar' ? 'تفعيل' : 'Grant')}
                   </button>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                   <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20 text-amber-400">
                      <Mic className="w-5 h-5" />
                   </div>
                   <div className="flex-1">
                      <p className="font-bold text-sm">{language === 'ar' ? 'الميكروفون' : 'Microphone'}</p>
                      <p className="text-xs text-dim text-right ml-0 mr-0">{language === 'ar' ? 'للتحدث مع المساعد الصوتي ALMO.' : 'Voice interactions with ALMO assistant.'}</p>
                   </div>
                   <button 
                     onClick={async () => {
                       try {
                         await navigator.mediaDevices.getUserMedia({ audio: true });
                         setPermissionStates(s => ({ ...s, mic: true }));
                       } catch(e){
                         showAlert(t.confirmDialog, language === 'ar' ? 'فشل معالجة الميكروفون. يرجى التحقق من إعدادات الموبايل.' : 'Microphone failed. Please check mobile settings.');
                       }
                     }}
                     className={`px-4 py-2 ${permissionStates.mic ? 'bg-amber-500 text-white' : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400'} text-xs font-bold rounded-lg transition-colors border border-amber-500/20 cursor-pointer`}
                   >
                     {permissionStates.mic ? (language === 'ar' ? 'تم التفعيل' : 'Granted') : (language === 'ar' ? 'تفعيل' : 'Grant')}
                   </button>
                </div>
              </div>

              <button 
                onClick={() => {
                  setShowPermissionsModal(false);
                  updateSettings({ onboardingShown: true });
                }}
                className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {language === 'ar' ? 'المتابعة كالمحترفين' : 'Continue Like a Pro'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {editingEvent && (
        <EditEventModal 
          isOpen={isEditEventOpen}
          onClose={() => { setIsEditEventOpen(false); setEditingEvent(null); }}
          onUpdate={(updatedEvt) => handleUpdateEvent(updatedEvt.id, updatedEvt)}
          event={editingEvent}
          t={t}
          language={language}
        />
      )}

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          updateSettings({ onboardingShown: true });
        }}
        language={language}
        setLanguage={setLanguage}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        t={t}
        backgroundImage={backgroundImage}
        setBackgroundImage={(img) => {
          setBackgroundImage(img);
          updateSettings({ background: img });
        }}
        geminiKey={geminiKeyInput}
        setGeminiKey={(key) => {
          setGeminiKeyInput(key);
          updateSettings({ geminiKey: key });
        }}
      />

      <TrashModal 
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
        trashEvents={trashEvents}
        onRestore={(evt) => handleRestoreEvent(evt.id)}
        onPermanentDelete={handlePermanentDelete}
        onEmptyTrash={handleEmptyTrash}
        t={t}
        language={language}
      />
    </div>
  );
};

export default App;
