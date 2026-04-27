import { AppTranslations } from '../locales/translations';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Languages, Moon, Sun, Wallpaper, BrainCircuit } from 'lucide-react';
import { Language } from '../locales/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  t: AppTranslations;
  backgroundImage: string | null;
  setBackgroundImage: (img: string | null) => void;
  geminiKey: string;
  setGeminiKey: (key: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  language, 
  setLanguage, 
  isDarkMode, 
  toggleDarkMode, 
  t, 
  backgroundImage,
  setBackgroundImage,
  geminiKey,
  setGeminiKey
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-sm theme-card overflow-hidden"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="p-6 border-b border-muted flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-tighter">{t.appSettingsTitle}</h3>
              <button onClick={onClose} className="p-2 hover:bg-zinc-800/10 rounded-full transition-colors">
                <X className="w-5 h-5 text-dim" />
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-dim opacity-50">
                  <Languages className="w-3 h-3" /> {t.languageMatrix}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ar', 'fr', 'en'] as const).map(lang => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${language === lang ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'border-muted text-dim hover:bg-white/5'}`}
                    >
                      {lang}
                    </button>
                   ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-muted glass">
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-dim opacity-50">
                    {isDarkMode ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />} {t.visualTheme}
                  </label>
                  <p className="text-xs font-bold">{isDarkMode ? t.nightMode : t.dayMode}</p>
                </div>
                <button 
                  onClick={toggleDarkMode}
                  className={`w-12 h-6 rounded-full transition-all relative ${isDarkMode ? 'bg-primary' : 'bg-muted'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm ${isDarkMode ? (language === 'ar' ? 'right-7' : 'left-7') : (language === 'ar' ? 'right-1' : 'left-1')}`} />
                </button>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-dim opacity-50">
                   <BrainCircuit className="w-3 h-3" /> {language === 'ar' ? 'مفتاح الذكاء الإصطناعي' : 'Gemini AI Engine Key'}
                </label>
                <div className="relative">
                  <input 
                    type="password"
                    placeholder="AI_STUDIO_KEY_..."
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    className="w-full theme-input"
                  />
                  {!geminiKey && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                       <span className="text-[10px] text-amber-500/50 uppercase font-mono">{language === 'ar' ? 'تلقائي' : 'Auto'}</span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-dim leading-relaxed italic">
                   {language === 'ar' 
                    ? 'اتركه فارغاً إن كنت تستخدم المفتاح الإفتراضي.' 
                    : 'Leave empty to use default key.'}
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-dim opacity-50">
                   <Wallpaper className="w-3 h-3" /> {t.environmentalBackground}
                </label>
                <div className="grid grid-cols-2 gap-3">
                   <button 
                    onClick={() => setBackgroundImage(null)}
                    className={`py-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${!backgroundImage ? 'border-primary text-primary bg-primary/5' : 'border-muted text-dim hover:bg-white/5'}`}
                   >
                     {t.clearTheme}
                   </button>
                   <button 
                    onClick={() => setBackgroundImage('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&q=80')}
                    className={`py-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${backgroundImage ? 'border-primary text-primary bg-primary/5' : 'border-muted text-dim hover:bg-white/5'}`}
                   >
                     {t.cosmos}
                   </button>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-muted/30">
                <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-dim opacity-50">
                   {language === 'ar' ? 'الأذونات الخاصة' : 'Permissions'}
                </label>
                <div className="grid grid-cols-1 gap-2">
                   <button 
                    onClick={async () => {
                        if ('geolocation' in navigator) {
                            try {
                                await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));
                                alert(language === 'ar' ? 'تم الوصول للموقع بنجاح' : 'Location access granted');
                            } catch (e) {
                                alert(language === 'ar' ? 'تم رفض إذن الموقع، يرجى تفعيله من إعدادات المتصفح' : 'Location access denied or blocked. Please enable in browser settings.');
                            }
                        }
                    }}
                    className={`py-2 px-3 rounded-xl border text-[11px] font-bold transition-all border-muted text-dim hover:bg-white/5 flex items-center justify-between`}
                   >
                     <span>{language === 'ar' ? 'طلب إذن تحديد الموقع (تأكد من سماح المتصفح)' : 'Request Location (Ensure browser allows)'}</span>
                   </button>
                   <button 
                    onClick={async () => {
                        if (typeof Notification !== 'undefined') {
                            const permission = await Notification.requestPermission();
                            if (permission === 'granted') {
                                alert(language === 'ar' ? 'تم تفعيل الإشعارات' : 'Notifications granted');
                            } else {
                                alert(language === 'ar' ? 'تم رفض إذن الإشعارات، يرجى تفعيله من إعدادات المتصفح' : 'Notification permission denied. Please enable in browser settings.');
                            }
                        }
                    }}
                    className={`py-2 px-3 rounded-xl border text-[11px] font-bold transition-all border-muted text-dim hover:bg-white/5 flex items-center justify-between`}
                   >
                     <span>{language === 'ar' ? 'طلب إذن الإشعارات (تأكد من سماح المتصفح)' : 'Request Notifications (Ensure browser allows)'}</span>
                   </button>
                </div>
              </div>
            </div>
            <div className="p-6 bg-surface/50 border-t border-muted">
               <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center gap-4 glass">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <BrainCircuit className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-base">{t.neuralCore}</h4>
                    <p className="text-[10px] text-dim font-mono tracking-tighter">v2.5.0 • {t.enterpriseEdition}</p>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;
