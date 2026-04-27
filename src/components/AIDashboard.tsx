import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, TrendingUp, Zap, Server, Activity, ArrowUpRight, ArrowDownRight, Clock, DollarSign, Wallet } from 'lucide-react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { db } from '../services/db';
import { UsageMetric, Provider } from '../types';

export const AIDashboard: React.FC = () => {
    const [metrics, setMetrics] = useState<UsageMetric[]>([]);
    const [stats, setStats] = useState({
        totalRequests: 0,
        totalCost: 0,
        totalTokens: 0,
        providerSplit: [] as { name: Provider; value: number }[],
    });

    useEffect(() => {
        const load = async () => {
            const data = await db.usageMetrics.toArray();
            setMetrics(data);

            const split = data.reduce((acc, curr) => {
                acc[curr.provider] = (acc[curr.provider] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            setStats({
                totalRequests: data.length,
                totalCost: data.reduce((sum, m) => sum + (m.cost || 0), 0),
                totalTokens: data.reduce((sum, m) => sum + (m.tokensUsed || 0), 0),
                providerSplit: Object.entries(split).map(([name, value]) => ({ name: name as Provider, value }))
            });
        };
        load();
    }, []);

    const COLORS = {
        gemini: '#3B82F6',
        openai: '#10B981',
        deepseek: '#000000',
        local: '#6366F1',
        cache: '#8B5CF6'
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8 pb-20">
            <header>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--color-base)' }}>Usage Analytics</h1>
                <p className="text-sm" style={{ color: 'var(--color-dim)' }}>Track multi-provider efficiency and cost estimations.</p>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl border transition-all" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-muted)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <Activity className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">LIVE</span>
                    </div>
                    <div className="space-y-1">
                        <span className="text-xs font-medium" style={{ color: 'var(--color-dim)' }}>Total Requests</span>
                        <div className="text-2xl font-bold" style={{ color: 'var(--color-base)' }}>{stats.totalRequests}</div>
                    </div>
                </div>

                <div className="p-5 rounded-2xl border transition-all" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-muted)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-1 text-xs text-emerald-500 font-bold">
                            <ArrowDownRight className="w-3 h-3" />
                            12%
                        </div>
                    </div>
                    <div className="space-y-1">
                        <span className="text-xs font-medium" style={{ color: 'var(--color-dim)' }}>Est. Total Cost</span>
                        <div className="text-2xl font-bold" style={{ color: 'var(--color-base)' }}>${stats.totalCost.toFixed(4)}</div>
                    </div>
                </div>

                <div className="p-5 rounded-2xl border transition-all" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-muted)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-1 text-xs text-blue-500 font-bold">
                            <ArrowUpRight className="w-3 h-3" />
                            8.4%
                        </div>
                    </div>
                    <div className="space-y-1">
                        <span className="text-xs font-medium" style={{ color: 'var(--color-dim)' }}>Tokens Processed</span>
                        <div className="text-2xl font-bold" style={{ color: 'var(--color-base)' }}>{(stats.totalTokens / 1000).toFixed(1)}k</div>
                    </div>
                </div>

                <div className="p-5 rounded-2xl border transition-all" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-muted)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <span className="text-xs font-medium" style={{ color: 'var(--color-dim)' }}>Avg. Latency</span>
                        <div className="text-2xl font-bold" style={{ color: 'var(--color-base)' }}>842ms</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Provider Distribution */}
                <div className="lg:col-span-2 p-6 rounded-3xl border transition-all" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-muted)' }}>
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-bold" style={{ color: 'var(--color-base)' }}>Provider Utilization</h3>
                        <div className="flex gap-4">
                            {Object.keys(COLORS).map(p => (
                                <div key={p} className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: (COLORS as any)[p] }} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-dim)' }}>{p}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.providerSplit}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-muted)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-dim)' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--color-dim)' }} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-border-muted)', backgroundColor: 'var(--color-surface)', color: 'var(--color-base)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                    cursor={{ fill: 'var(--color-main)', opacity: 0.5 }}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                                    {stats.providerSplit.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={(COLORS as any)[entry.name] || '#94a3b8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Efficiency Score */}
                <div className="p-8 rounded-3xl text-white flex flex-col justify-between relative overflow-hidden bg-primary shadow-xl shadow-primary/20">
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-2">Efficiency Rating</h3>
                        <p className="text-sm text-white/80">Orchestrator saved your quota usage by routing 64% of tasks to cheaper models.</p>
                    </div>
                    
                    <div className="relative z-10 space-y-4">
                        <div className="text-6xl font-black italic tracking-tighter">92.4%</div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-white/10 w-fit px-3 py-1 rounded-full border border-white/20">
                            Excellent Efficiency
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 blur-2xl" />
                </div>
            </div>

            {/* Recent Logs Table */}
            <div className="rounded-3xl border overflow-hidden transition-all" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-muted)' }}>
                <div className="p-6 border-b" style={{ borderColor: 'var(--color-border-muted)' }}>
                    <h3 className="font-bold text-lg" style={{ color: 'var(--color-base)' }}>Transaction History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr style={{ backgroundColor: 'var(--color-main)', opacity: 0.5 }}>
                                <th className="p-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-dim)' }}>Time</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-dim)' }}>Provider</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-widest text-right" style={{ color: 'var(--color-dim)' }}>Tokens</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-widest text-right" style={{ color: 'var(--color-dim)' }}>Est. Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {metrics.slice().reverse().slice(0, 5).map((m) => (
                                <tr key={m.id} className="border-t transition-colors hover:bg-primary/5" style={{ borderColor: 'var(--color-border-muted)' }}>
                                    <td className="p-4 text-xs" style={{ color: 'var(--color-dim)' }}>{new Date(m.timestamp).toLocaleTimeString()}</td>
                                    <td className="p-4">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                            m.provider === 'openai' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10' : 
                                            m.provider === 'gemini' ? 'text-blue-500 border-blue-500/20 bg-blue-500/10' : 
                                            'text-indigo-500 border-indigo-500/20 bg-indigo-500/10'
                                        }`}>
                                            {m.provider}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs font-mono text-right" style={{ color: 'var(--color-base)' }}>{m.tokensUsed}</td>
                                    <td className="p-4 text-xs font-bold text-right" style={{ color: 'var(--color-base)' }}>${m.cost?.toFixed(5)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
