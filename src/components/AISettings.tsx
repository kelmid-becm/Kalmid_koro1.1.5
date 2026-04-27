import React, { useState, useEffect } from 'react';
import { Shield, Key, Cpu, Activity, Save, AlertCircle, CheckCircle2, Globe, Server, UserCheck, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../services/db';
import { AssistantSettings, Provider, ProviderConfig } from '../types';
import { translations, Language } from '../locales/translations';
import { useSettingsStore } from '../store/useSettingsStore';
import { encrypt } from '../services/securityService';

export const AISettings: React.FC = () => {
    const { settings: globalSettings } = useSettingsStore();
    const language = globalSettings.language as Language;
    const [settings, setSettings] = useState<AssistantSettings | null>(null);
    const [rawKeys, setRawKeys] = useState<Record<Provider, string>>({
        gemini: '', openai: '', deepseek: '', local: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const load = async () => {
            const saved = await db.assistantSettings.get('settings');
            const initial: AssistantSettings = {
                id: 'settings',
                autoRouting: true,
                providers: {
                    gemini: { id: 'gemini', enabled: false, model: 'gemini-3-flash-preview' },
                    openai: { id: 'openai', enabled: false, model: 'gpt-4o' },
                    deepseek: { id: 'deepseek', enabled: false, model: 'deepseek-chat' },
                    local: { id: 'local', enabled: false, model: 'llama3', baseUrl: 'http://localhost:11434' }
                }
            };

            if (saved) {
                // Merge to prevent TypeError when old settings miss new providers
                setSettings({
                    ...initial,
                    ...saved,
                    providers: {
                        ...initial.providers,
                        ...(saved.providers || {})
                    }
                });
            } else {
                setSettings(initial);
            }
        };
        load();
    }, []);

    const validateKey = async (provider: Provider, key: string): Promise<boolean> => {
        if (provider === 'local') return true;
        
        if (provider === 'gemini') {
            try {
                const { GoogleGenAI } = await import('@google/genai');
                const ai = new GoogleGenAI({ apiKey: key });
                await ai.models.generateContent({
                    model: "gemini-3-flash-preview",
                    contents: "ping"
                });
                return true;
            } catch (e) {
                console.error("Gemini validation failed client-side:", e);
                return false;
            }
        }

        if (provider === 'openai') {
            try {
                const res = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                    body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{role: 'user', content: 'ping'}], max_tokens: 5 })
                });
                return res.ok;
            } catch (e) {
                console.warn("OpenAI fetch failed, allowing key save:", e);
                return true; // allow save anyway if CORS/network blocks it
            }
        }
        
        if (provider === 'deepseek') {
            try {
                const res = await fetch('https://api.deepseek.com/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                    body: JSON.stringify({ model: 'deepseek-chat', messages: [{role: 'user', content: 'ping'}], max_tokens: 5 })
                });
                return res.ok;
            } catch (e) {
                console.warn("Deepseek fetch failed, allowing key save:", e);
                return true;
            }
        }

        try {
            const { API_URL } = await import('../config/api');
            const response = await fetch(`${API_URL}/api/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: 'ping',
                    complexity: 'simple',
                    settings: {
                        ...settings,
                        providers: {
                            ...(settings?.providers || {}),
                            [provider]: { ...(settings?.providers?.[provider] || {}), apiKey: await encrypt(key), enabled: true }
                        }
                    }
                })
            });
            
            const data = await response.json();
            if (response.ok && data.response) return true;
            return false;
        } catch (e) {
            return false;
        }
    };

    const handleSave = async () => {
        if (!settings) return;
        setIsSaving(true);
        setMsg(null);

        try {
            const encryptedProviders = { ...settings.providers };
            const providersToValidate = (['openai', 'gemini', 'deepseek'] as Provider[]).filter(p => rawKeys[p]);

            for (const pid of providersToValidate) {
                const isValid = await validateKey(pid, rawKeys[pid]);
                if (!isValid) {
                    if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
                    const errorMsg = (translations[language]?.invalidApiKey || 'Invalid API key for {provider}.').replace('{provider}', pid);
                    setMsg({ type: 'error', text: errorMsg });
                    setRawKeys(prev => ({ ...prev, [pid]: '' }));
                    setIsSaving(false);
                    return;
                }
                encryptedProviders[pid].apiKey = await encrypt(rawKeys[pid]);
                encryptedProviders[pid].enabled = true;
            }
            
            const settingsToSave = { ...settings, providers: encryptedProviders };
            await db.assistantSettings.put(settingsToSave);
            setSettings(settingsToSave);
            setMsg({ type: 'success', text: 'Settings encrypted and saved securely.' });
            setRawKeys({ gemini: '', openai: '', deepseek: '', local: '' });
            setTimeout(() => setMsg(null), 3000);
        } catch (e) {
            console.error(e);
            setMsg({ type: 'error', text: 'Failed to encrypt/save settings.' });
        } finally {
            setIsSaving(false);
        }
    };

    const updateProvider = (id: Provider, updates: Partial<ProviderConfig>) => {
        if (!settings) return;
        setSettings({
            ...settings,
            providers: {
                ...settings.providers,
                [id]: { ...settings.providers[id], ...updates }
            }
        });
    };

    if (!settings) return null;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8 pb-20">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--color-base)' }}>AI Platform Settings</h1>
                    <p className="text-sm" style={{ color: 'var(--color-dim)' }}>Configure your API keys and provider preferences (BYOK).</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                >
                    {isSaving ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>
            </header>

            {msg && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl flex items-center gap-3 border ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}
                >
                    {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="text-sm font-medium">{msg.text}</span>
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* General config */}
                <div className="p-6 rounded-2xl border transition-all" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-muted)' }}>
                    <div className="flex items-center gap-3 mb-2">
                        <Cpu className="w-5 h-5 text-primary" />
                        <h2 className="font-bold" style={{ color: 'var(--color-base)' }}>Routing Strategy</h2>
                    </div>
                    <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl transition-colors hover:bg-primary/5" style={{ backgroundColor: 'var(--color-main)' }}>
                        <div>
                            <span className="text-sm font-bold block" style={{ color: 'var(--color-base)' }}>Smart Auto-Routing</span>
                            <span className="text-xs" style={{ color: 'var(--color-dim)' }}>AI chooses models based on task.</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.autoRouting}
                            onChange={(e) => setSettings({ ...settings, autoRouting: e.target.checked })}
                            className="w-5 h-5 accent-primary"
                        />
                    </label>
                </div>

                {/* System Capabilities */}
                <div className="p-6 rounded-2xl border transition-all" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-muted)' }}>
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck className="w-5 h-5 text-indigo-400" />
                        <h2 className="font-bold" style={{ color: 'var(--color-base)' }}>System Capabilities</h2>
                    </div>
                    <div className="space-y-2">
                         <button 
                           onClick={() => {
                             // This is a trick to trigger the global App's permission modal
                             // By resetting onboardingShown in local store it won't work immediately 
                             // unless we have a shared way. But we can just use the native prompts here.
                             if ('geolocation' in navigator) navigator.geolocation.getCurrentPosition(() => {}, () => {});
                             if ('Notification' in window) Notification.requestPermission();
                           }}
                           className="w-full text-left p-4 rounded-xl transition-colors hover:bg-indigo-500/10 flex items-center justify-between group" 
                           style={{ backgroundColor: 'var(--color-main)' }}
                         >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="text-sm font-bold block" style={{ color: 'var(--color-base)' }}>Request Permissions</span>
                                    <span className="text-[10px] uppercase tracking-wider text-dim">Location, Audio, Notify</span>
                                </div>
                            </div>
                            <Activity className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                         </button>
                    </div>
                </div>

                {/* Local AI */}
                <div className="p-6 rounded-2xl border transition-all" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-muted)' }}>
                    <div className="flex items-center gap-3 mb-2">
                        <Server className="w-5 h-5 text-primary" />
                        <h2 className="font-bold" style={{ color: 'var(--color-base)' }}>Local AI (Ollama)</h2>
                    </div>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <input
                                type="text"
                                placeholder="Endpoint URL (e.g. http://localhost:11434)"
                                value={settings.providers.local.baseUrl || ''}
                                onChange={(e) => updateProvider('local', { baseUrl: e.target.value })}
                                className="theme-input w-full"
                            />
                            <p className="text-[10px] flex items-center gap-1 opacity-60" style={{ color: 'var(--color-dim)' }}>
                                <AlertCircle className="w-3 h-3" />
                                {translations[language]?.localAIHint || 'Requires Ollama running on same network.'}
                            </p>
                        </div>
                        <label className="flex items-center gap-3 p-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.providers.local.enabled}
                                onChange={(e) => updateProvider('local', { enabled: e.target.checked })}
                                className="w-4 h-4 accent-primary"
                            />
                            <span className="text-sm font-medium" style={{ color: 'var(--color-dim)' }}>Enable as Failover</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-primary" />
                    <h2 className="font-bold text-lg" style={{ color: 'var(--color-base)' }}>Provider Credentials</h2>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                    {(['openai', 'gemini', 'deepseek'] as Provider[]).map((pid) => (
                        <div key={pid} className="p-5 rounded-2xl border flex flex-col md:flex-row md:items-center gap-4 transition-all" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-muted)' }}>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold capitalize" style={{ color: 'var(--color-base)' }}>{pid}</h3>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono uppercase border" style={{ backgroundColor: 'var(--color-main)', color: 'var(--color-dim)', borderColor: 'var(--color-border-muted)' }}>
                                        {settings.providers[pid].model}
                                    </span>
                                </div>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-dim)' }} />
                                    <input
                                        type="password"
                                        placeholder={`Enter ${pid} API Key`}
                                        value={rawKeys[pid]}
                                        onChange={(e) => setRawKeys({ ...rawKeys, [pid]: e.target.value })}
                                        className="theme-input w-full pl-10"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-4 min-w-[120px] justify-between">
                                <div className="flex flex-col items-end">
                                    <span className="text-xs font-medium" style={{ color: 'var(--color-dim)' }}>Status</span>
                                    <span className={`text-[10px] font-bold uppercase ${settings.providers[pid].enabled ? 'text-emerald-500' : 'opacity-40'}`} style={{ color: settings.providers[pid].enabled ? undefined : 'var(--color-dim)' }}>
                                        {settings.providers[pid].enabled ? 'Active' : 'Missing Key'}
                                    </span>
                                </div>
                                <div className={`w-3 h-3 rounded-full transition-all ${settings.providers[pid].enabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'border border-muted opacity-20'}`} style={{ backgroundColor: settings.providers[pid].enabled ? undefined : 'var(--color-dim)' }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <footer className="p-6 rounded-2xl border flex items-start gap-3 bg-primary/5 border-primary/20">
                <Globe className="w-5 h-5 text-primary shrink-0" />
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-dim)' }}>
                    <strong style={{ color: 'var(--color-base)' }}>Zero-Trust Note:</strong> Your API keys are encrypted client-side before storage. We do not store plain-text credentials. Ensure your Ollama service is accessible.
                </p>
            </footer>
        </div>
    );
};
