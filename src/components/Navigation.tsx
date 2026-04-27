import React from 'react';
import { 
  Home, 
  Calendar, 
  MessageSquare, 
  Flame, 
  Settings, 
  Trash2, 
  Menu,
  Sparkles,
  BarChart3,
  X,
  Plus,
  Bus,
  Activity,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewMode } from '../types';
import { AppTranslations } from '../locales/translations';

interface NavigationProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setIsTrashOpen: (open: boolean) => void;
  setIsAddEventOpen: (open: boolean) => void;
  setIsAnalyticsOpen: (open: boolean) => void;
  isOnline: boolean;
  t: AppTranslations;
  language: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  viewMode,
  setViewMode,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  setIsSettingsOpen,
  setIsTrashOpen,
  setIsAddEventOpen,
  setIsAnalyticsOpen,
  isOnline,
  t,
  language
}) => {
  const isRtl = language === 'ar';

  const menuItems = [
    { id: 'today' as ViewMode, icon: Home, label: t.dashboard, subLabel: t.today },
    { id: 'chat' as ViewMode, icon: MessageSquare, label: 'AI Chat', subLabel: 'Assistant' },
    { id: 'ai-dashboard' as ViewMode, icon: Activity, label: 'Analytics', subLabel: 'AI Usage' },
    { id: 'ai-settings' as ViewMode, icon: Settings, label: 'AI Setup', subLabel: 'BYOK Config' },
    { id: 'calendar' as ViewMode, icon: Calendar, label: t.timeline, subLabel: t.weeklySchedule },
    { id: 'habits' as ViewMode, icon: Flame, label: t.progress, subLabel: t.habits },
    { id: 'bus' as ViewMode, icon: Bus, label: t.busSystem, subLabel: t.busSubLabel },
  ];

  const mobileNavItems = menuItems.filter(item => !['bus', 'ai-dashboard', 'ai-settings'].includes(item.id));
  const leftItems = mobileNavItems.slice(0, 2);
  const rightItems = mobileNavItems.slice(2);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-80 border-r p-8 h-screen sticky top-0 z-[110]" style={{ backgroundColor: 'var(--color-sidebar)', borderColor: 'var(--color-border-muted)' }}>
        <div className="flex items-center gap-4 mb-16 px-2">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter" style={{ color: 'var(--color-base)' }}>Kelmid</h1>
            <p className="text-[10px] font-mono uppercase tracking-widest leading-none" style={{ color: 'var(--color-dim)' }}>Intelligence Engine</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setViewMode(item.id)}
              className={`sidebar-item w-full flex items-center gap-4 ${viewMode === item.id ? 'sidebar-item-active' : ''}`}
            >
              <div className={`p-2 rounded-xl transition-colors ${viewMode === item.id ? 'bg-white/20' : 'bg-surface border border-muted group-hover:text-[var(--color-base)]'}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-start leading-none gap-1">
                <span className="text-sm font-bold">{item.label}</span>
                <span className="text-[9px] font-mono opacity-40 uppercase tracking-wider">{item.subLabel}</span>
              </div>
            </button>
          ))}

          {/* Local Assistant Mode */}
          <button
            onClick={() => {
              setViewMode('local-assistant' as any);
              setIsMobileSidebarOpen(false);
            }}
            className={`sidebar-item w-full flex items-center gap-4 ${viewMode === ('local-assistant' as any) ? 'sidebar-item-active' : ''}`}
          >
            <div className={`p-2 rounded-xl border group-hover:text-[var(--color-base)] ${viewMode === ('local-assistant' as any) ? 'bg-white/20 border-white/40' : 'bg-surface border border-muted'}`}>
              <Brain className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex flex-col items-start leading-none gap-1">
               <span className="text-sm font-bold">{t.offlineAdvisor}</span>
               <span className="text-[9px] font-mono opacity-40 uppercase tracking-wider">{t.offlineToggle}</span>
            </div>
          </button>

          <button
            onClick={() => setIsAnalyticsOpen(true)}
            className={`sidebar-item w-full flex items-center gap-4`}
          >
            <div className={`p-2 rounded-xl border group-hover:text-[var(--color-base)]`} style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-muted)' }}>
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="flex flex-col items-start leading-none gap-1">
              <span className="text-sm font-bold">{t.insights}</span>
              <span className="text-[9px] font-mono opacity-40 uppercase tracking-wider">{t.analytics}</span>
            </div>
          </button>
        </nav>

        <div className="pt-8 mt-8 border-t space-y-2" style={{ borderColor: 'var(--color-border-muted)', opacity: 0.5 }}>
          <button onClick={() => setIsTrashOpen(true)} className="sidebar-item w-full flex items-center gap-4 hover:text-rose-400">
            <div className="p-2 rounded-xl border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-muted)' }}>
              <Trash2 className="w-5 h-5" />
            </div>
            <span>{t.trash}</span>
          </button>
          <button onClick={() => setIsSettingsOpen(true)} className="sidebar-item w-full flex items-center gap-4">
            <div className="p-2 rounded-xl border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-muted)' }}>
              <Settings className="w-5 h-5" />
            </div>
            <span>{t.settings}</span>
          </button>

          <div className="pt-6 mt-4 flex flex-col gap-4 px-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase" style={{ color: 'var(--color-dim)' }}>{t.onlineStatus}</span>
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
            </div>
            {/* Sync Logic for Hybrid Mode */}
            {!isOnline && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                   <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">{t.offlineMode}</p>
                   <p className="text-[9px] text-dim">{t.pendingCommandsDesc || "Your commands are safe and will sync once back online."}</p>
                </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Drawer (Overlay) */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[500] lg:hidden"
            />
            <motion.div 
              initial={{ x: isRtl ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? '100%' : '-100%' }}
              className={`fixed top-0 bottom-0 ${isRtl ? 'right-0' : 'left-0'} w-[85%] max-w-xs z-[510] lg:hidden shadow-3xl flex flex-col p-6 overflow-hidden`}
              style={{ backgroundColor: '#0f111a' }}
            >
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-xl font-bold text-white">Kelmid</h1>
                </div>
                <button onClick={() => setIsMobileSidebarOpen(false)} className="p-2 text-dim hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setViewMode(item.id);
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all ${viewMode === item.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-dim hover:bg-white/5 hover:text-white'}`}
                  >
                    <div className={`p-2 rounded-xl transition-colors ${viewMode === item.id ? 'bg-white/20' : 'bg-white/5 border border-white/5'}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col items-start leading-none gap-1">
                      <span className="text-sm font-bold">{item.label}</span>
                      <span className="text-[9px] opacity-40 uppercase tracking-widest">{item.subLabel}</span>
                    </div>
                  </button>
                ))}

                <div className="h-px bg-white/5 my-4" />

                <button
                  onClick={() => {
                    setIsAnalyticsOpen(true);
                    setIsMobileSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-4 p-3 rounded-2xl text-dim hover:bg-white/5 hover:text-white transition-all"
                >
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col items-start leading-none gap-1">
                    <span className="text-sm font-bold">{t.insights}</span>
                    <span className="text-[9px] opacity-40 uppercase tracking-widest">{t.analytics}</span>
                  </div>
                </button>
              </div>

              <div className="pt-6 mt-auto border-t border-white/5 space-y-2">
                <button 
                  onClick={() => {
                    setIsTrashOpen(true);
                    setIsMobileSidebarOpen(false);
                  }} 
                  className="w-full flex items-center gap-4 p-3 rounded-2xl text-dim hover:text-rose-400 hover:bg-rose-500/5 transition-all"
                >
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold">{t.trash}</span>
                </button>
                <button 
                  onClick={() => {
                    setIsSettingsOpen(true);
                    setIsMobileSidebarOpen(false);
                  }} 
                  className="w-full flex items-center gap-4 p-3 rounded-2xl text-dim hover:text-primary hover:bg-primary/5 transition-all"
                >
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <Settings className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold">{t.settings}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-6 left-6 right-6 z-[200] flex items-center gap-1 p-1.5 bg-surface/80 backdrop-blur-2xl border border-muted rounded-2xl shadow-2xl safe-p-bottom glass">
        {leftItems.map((item) => (
          <button 
            key={`mobile-nav-${item.id}`}
            onClick={() => setViewMode(item.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all duration-300 ${viewMode === item.id ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-dim hover:text-[var(--color-base)]'}`}
          >
            <item.icon className={`w-5 h-5 transition-transform ${viewMode === item.id ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider leading-none">{item.label}</span>
          </button>
        ))}
        
        <button 
          onClick={() => setIsAddEventOpen(true)}
          className="w-14 flex flex-col items-center justify-center py-2 text-primary active:scale-90 transition-transform bg-primary/10 rounded-xl border border-primary/20"
        >
          <Plus className="w-6 h-6" />
        </button>

        {rightItems.map((item) => (
          <button 
            key={`mobile-nav-${item.id}`}
            onClick={() => setViewMode(item.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all duration-300 ${viewMode === item.id ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-dim hover:text-[var(--color-base)]'}`}
          >
            <item.icon className={`w-5 h-5 transition-transform ${viewMode === item.id ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider leading-none">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
};
