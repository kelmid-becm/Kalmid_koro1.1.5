import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, Settings, Activity, Trash2, ChevronRight, Zap, Brain, Shield, Volume2, VolumeX, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { db } from '../services/db';
import { ChatMessage, AssistantSettings, Provider } from '../types';
import { useSettingsStore } from '../store/useSettingsStore';
import { speechService } from '../services/speechService';

export const AIAssistant: React.FC = () => {
    const { settings: globalSettings, updateSettings } = useSettingsStore();
    const language = globalSettings.language;
    const voiceMode = globalSettings.voiceMode;
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [settings, setSettings] = useState<AssistantSettings | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.role === 'assistant' && voiceMode) {
            setIsSpeaking(true);
            speechService.speak(lastMsg.content, language === 'ar' ? 'ar-SA' : (language === 'fr' ? 'fr-FR' : 'en-US'), () => {
                setIsSpeaking(false);
            });
        }

        return () => {
            speechService.stopSpeaking();
        };
    }, [messages, voiceMode, language]);

    useEffect(() => {
        const load = async () => {
            const history = await db.chatHistory.toArray();
            setMessages(history.slice(-50));
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
            
            if (!saved) {
                // Initialize default state but don't save to DB yet (BYOK requirement)
                setSettings(initial);
            } else {
                setSettings({
                    ...initial,
                    ...saved,
                    providers: {
                        ...initial.providers,
                        ...(saved.providers || {})
                    }
                });
            }
        };
        load();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const hasActiveProvider = settings && Object.values(settings.providers).some(p => p.enabled);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        
        if (!hasActiveProvider) {
            const warningMsg: ChatMessage = {
                id: Date.now().toString(),
                role: 'assistant',
                content: '⚠️ **Configuration Required**: No AI providers are enabled. Please go to **Settings** and add your API keys to start chatting.',
                provider: 'local',
                timestamp: new Date().toISOString(),
                status: 'error'
            };
            setMessages(prev => [...prev, warningMsg]);
            setInput('');
            return;
        }

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            provider: 'local', // Default, router handles it
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Predict complexity (very basic client-side intent detection)
            const isComplex = input.length > 100 || input.includes('code') || input.includes('reason');
            
            const { API_URL } = await import('../config/api');
            const response = await fetch(`${API_URL}/api/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    prompt: input, 
                    complexity: isComplex ? 'complex' : 'simple',
                    settings: settings 
                })
            });

            const data = await response.json();
            
            if (data.error) throw new Error(data.error);

            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response,
                provider: data.provider,
                timestamp: new Date().toISOString(),
                status: 'sent'
            };

            await db.chatHistory.add(aiMsg);
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error(error);
            const errMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an orchestration error. Please check your API keys in settings.',
                provider: 'local',
                timestamp: new Date().toISOString(),
                status: 'error'
            };
            setMessages(prev => [...prev, errMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearHistory = async () => {
        await db.chatHistory.clear();
        setMessages([]);
    };

    return (
        <div className="flex flex-col h-[600px] lg:h-[calc(100vh-120px)] w-full max-w-4xl mx-auto rounded-3xl border transition-all overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-muted)' }}>
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between" style={{ backgroundColor: 'var(--color-main)', opacity: 0.8, borderColor: 'var(--color-border-muted)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-bold leading-tight" style={{ color: 'var(--color-base)' }}>Multi-AI Assistant</h2>
                        <div className="flex items-center gap-2">
                             <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-dim)' }}>
                                    {settings?.autoRouting ? 'Smart Routing Enabled' : 'Manual Mode'}
                                </span>
                            </div>
                            <button 
                                onClick={() => updateSettings({ voiceMode: !voiceMode })} 
                                className={`p-1 rounded-md transition-all ${voiceMode ? 'text-emerald-500 bg-emerald-500/10' : 'text-dim hover:text-primary'}`}
                                title={voiceMode ? "Disable Voice Chat" : "Enable Voice Chat"}
                            >
                                {voiceMode ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    </div>
                </div>
                <button
                    onClick={clearHistory}
                    className="p-2 transition-colors hover:text-rose-500"
                    style={{ color: 'var(--color-dim)' }}
                    title="Clear History"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>

            {/* Messages */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
            >
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-8 px-8 py-12">
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', damping: 15 }}
                          className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-2xl relative group"
                        >
                            <div className="absolute inset-0 bg-primary/10 rounded-[2.5rem] blur-2xl group-hover:bg-primary/20 transition-all" />
                            <Bot className="w-12 h-12 text-primary relative z-10" />
                            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-emerald-400 animate-pulse" />
                        </motion.div>
                        <div className="max-w-sm">
                            <h3 className="text-2xl font-black tracking-tight mb-2" style={{ color: 'var(--color-base)' }}>Kelmid Intelligence</h3>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-dim)' }}>
                                Your orchestrated multi-AI environment. Connect Gemini, OpenAI, or Local Llama to begin your cognitive journey.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                            <button onClick={() => setInput('Explain adaptive reasoning systems')} className="p-4 text-xs font-medium border rounded-2xl transition-all hover:bg-primary/5 hover:border-primary/30 text-left flex items-start gap-3 group" style={{ color: 'var(--color-base)', borderColor: 'var(--color-border-muted)', backgroundColor: 'var(--color-main)' }}>
                                <Brain className="w-4 h-4 text-primary shrink-0 transition-transform group-hover:scale-110" />
                                <span>Explain adaptive reasoning systems</span>
                            </button>
                            <button onClick={() => setInput('Draft a professional email for a project kick-off')} className="p-4 text-xs font-medium border rounded-2xl transition-all hover:bg-primary/5 hover:border-primary/30 text-left flex items-start gap-3 group" style={{ color: 'var(--color-base)', borderColor: 'var(--color-border-muted)', backgroundColor: 'var(--color-main)' }}>
                                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0 transition-transform group-hover:scale-110" />
                                <span>Draft a professional email for project...</span>
                            </button>
                        </div>
                    </div>
                )}

                <AnimatePresence>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-primary/10 text-primary' : 'bg-primary/20 text-primary'}`}>
                                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                            </div>
                            <div className={`max-w-[85%] space-y-1 ${msg.role === 'user' ? 'items-end' : ''}`}>
                                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                                    msg.role === 'user' 
                                        ? 'bg-primary text-white rounded-tr-none' 
                                        : msg.status === 'error' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'rounded-tl-none border'
                                }`} style={msg.role !== 'user' && msg.status !== 'error' ? { backgroundColor: 'var(--color-main)', color: 'var(--color-base)', borderColor: 'var(--color-border-muted)' } : {}}>
                                    <div className="markdown-body prose prose-sm prose-invert max-w-none">
                                        <ReactMarkdown>
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                                {msg.role === 'assistant' && msg.provider && (
                                    <div className="flex items-center gap-2 px-1">
                                        <span className={`text-[9px] font-bold uppercase tracking-widest ${
                                            msg.provider === 'openai' ? 'text-emerald-500' : 
                                            msg.provider === 'gemini' ? 'text-blue-500' : 
                                            msg.provider === 'deepseek' ? 'text-amber-500' : ''
                                        }`} style={!['openai', 'gemini', 'deepseek'].includes(msg.provider) ? { color: 'var(--color-dim)' } : {}}>
                                            via {msg.provider}
                                        </span>
                                        {msg.provider !== 'local' && <Zap className="w-2.5 h-2.5" style={{ color: 'var(--color-dim)' }} />}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                
                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center animate-pulse">
                            <Activity className="w-4 h-4" />
                        </div>
                        <div className="rounded-2xl rounded-tl-none p-4 w-12 flex justify-center border" style={{ backgroundColor: 'var(--color-main)', borderColor: 'var(--color-border-muted)' }}>
                            <span className="flex gap-1">
                                <span className="w-1 h-1 bg-primary/40 rounded-full animate-bounce" />
                                <span className="w-1 h-1 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <span className="w-1 h-1 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 border-t" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-muted)' }}>
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Message AI Assistant..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        className="theme-input flex-1 pr-12"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 disabled:shadow-none"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <div className="mt-3 flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-[10px] font-medium" style={{ color: 'var(--color-dim)' }}>
                            <Brain className="w-3 h-3" />
                            <span>Adaptive Reasoning</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-medium" style={{ color: 'var(--color-dim)' }}>
                            <Shield className="w-3 h-3" />
                            <span>Encrypted BYOK</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
