import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CalendarEvent, UserStats } from '../types';

interface AnalyticsDashboardProps {
  events: CalendarEvent[];
  stats: UserStats;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ events, stats }) => {
  const priorityData = [
    { name: 'High', value: events.filter(e => e.priority === 'high').length, color: '#f43f5e' },
    { name: 'Medium', value: events.filter(e => e.priority === 'medium').length, color: '#818cf8' },
    { name: 'Low', value: events.filter(e => e.priority === 'low').length, color: '#2dd4bf' },
  ];

  const completionData = [
    { name: 'Done', value: events.filter(e => e.isCompleted).length },
    { name: 'Todo', value: events.filter(e => !e.isCompleted).length },
  ];

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-input border border-muted p-2 rounded-lg shadow-xl">
          <p className="text-[10px] font-mono uppercase tracking-widest text-dim mb-1">{payload[0].name}</p>
          <p className="text-sm font-bold text-base">{payload[0].value} Tasks</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="theme-card">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-base">Analytics</h3>
          <p className="text-[10px] font-mono tracking-widest text-dim uppercase">Performance metrics</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-input border border-muted p-4 rounded-2xl">
          <p className="text-[10px] font-mono text-dim uppercase tracking-widest mb-1">Level</p>
          <p className="text-2xl font-black text-indigo-400">{stats.level}</p>
        </div>
        <div className="bg-input border border-muted p-4 rounded-2xl">
          <p className="text-[10px] font-mono text-dim uppercase tracking-widest mb-1">Total XP</p>
          <p className="text-2xl font-black">{stats.xp}</p>
        </div>
        <div className="bg-input border border-muted p-4 rounded-2xl">
          <p className="text-[10px] font-mono text-dim uppercase tracking-widest mb-1">Completed</p>
          <p className="text-2xl font-black text-emerald-400">{stats.totalTasksCompleted}</p>
        </div>
        <div className="bg-input border border-muted p-4 rounded-2xl">
          <p className="text-[10px] font-mono text-dim uppercase tracking-widest mb-1">Efficiency</p>
          <p className="text-2xl font-black">
            {events.length > 0 ? Math.round((events.filter(e => e.isCompleted).length / events.length) * 100) : 0}%
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="h-64 flex flex-col">
           <p className="text-[10px] font-mono text-dim mb-4 uppercase tracking-widest">Priority Weight</p>
           <div className="flex-1 min-h-0">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie 
                    data={priorityData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60}
                    outerRadius={80} 
                    paddingAngle={5}
                    stroke="none"
                  >
                    {priorityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                 </Pie>
                 <Tooltip content={<CustomTooltip />} />
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="flex justify-center gap-4 mt-2">
              {priorityData.map((p) => (
                <div key={p.name} className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-[9px] font-mono text-dim uppercase tracking-tighter">{p.name}</span>
                </div>
              ))}
           </div>
        </div>

        <div className="h-64 flex flex-col">
           <p className="text-[10px] font-mono text-dim mb-4 uppercase tracking-widest">Completion Rate</p>
           <div className="flex-1 min-h-0">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={completionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                 <XAxis 
                    dataKey="name" 
                    stroke="#334155" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#64748b' }}
                  />
                 <YAxis 
                    stroke="#334155" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#64748b' }}
                  />
                 <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
                 <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
