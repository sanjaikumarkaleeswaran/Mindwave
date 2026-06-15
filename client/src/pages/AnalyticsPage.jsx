import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart2, TrendingUp, Calendar, Zap, Target, PieChart as PieChartIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import api from '../lib/axios';
import clsx from 'clsx';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6'];

export default function AnalyticsPage() {
    const [timeRange, setTimeRange] = useState('week'); // 'week', 'month', 'year', 'all'

    const { data: habits = [], isLoading: hLoad } = useQuery({
        queryKey: ['habits'],
        queryFn: async () => (await api.get('/habits')).data
    });

    const { data: goals = [], isLoading: gLoad } = useQuery({
        queryKey: ['goals'],
        queryFn: async () => (await api.get('/goals')).data
    });

    const { data: expenses = [], isLoading: eLoad } = useQuery({
        queryKey: ['expenses'],
        queryFn: async () => (await api.get('/expenses/all')).data
    });

    const isLoading = hLoad || gLoad || eLoad;

    // Derived Data for Visualizations
    const { habitStats, goalStats, expenseStats } = useMemo(() => {
        if (isLoading) return { habitStats: [], goalStats: [], expenseStats: [] };

        const today = new Date();
        today.setHours(23, 59, 59, 999);

        // 1. Habit Completion Over Time
        let habitStatsMap = [];
        
        if (timeRange === 'week') {
            habitStatsMap = Array.from({ length: 7 }).map((_, i) => {
                const d = new Date(today);
                d.setDate(today.getDate() - (6 - i));
                return {
                    name: d.toLocaleString('default', { weekday: 'short' }),
                    completions: 0,
                    dateString: d.toDateString()
                };
            });
        } else if (timeRange === 'month') {
            habitStatsMap = Array.from({ length: 30 }).map((_, i) => {
                const d = new Date(today);
                d.setDate(today.getDate() - (29 - i));
                return {
                    name: `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`,
                    completions: 0,
                    dateString: d.toDateString()
                };
            });
        } else {
            const monthsCount = timeRange === 'all' ? 24 : 12;
            habitStatsMap = Array.from({ length: monthsCount }).map((_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - ((monthsCount - 1) - i));
                return {
                    name: `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear().toString().slice(2)}`,
                    completions: 0,
                    year: d.getFullYear(),
                    month: d.getMonth()
                };
            });
        }

        habits.forEach(habit => {
            habit.history?.forEach(record => {
                const date = new Date(record.date);
                if (timeRange === 'week' || timeRange === 'month') {
                    const stat = habitStatsMap.find(m => m.dateString === date.toDateString());
                    if (stat) stat.completions += 1;
                } else {
                    const stat = habitStatsMap.find(m => m.month === date.getMonth() && m.year === date.getFullYear());
                    if (stat) stat.completions += 1;
                }
            });
        });

        // 2. Goals by Category
        const goalCategoryMap = {};
        goals.forEach(g => {
            goalCategoryMap[g.category] = (goalCategoryMap[g.category] || 0) + 1;
        });
        const goalStats = Object.keys(goalCategoryMap).map(k => ({ name: k, value: goalCategoryMap[k] }));

        // 3. Expenses vs Income
        let expenseTrendMap = {};
        
        if (timeRange === 'week') {
            expenseTrendMap = Array.from({ length: 7 }).map((_, i) => {
                const d = new Date(today);
                d.setDate(today.getDate() - (6 - i));
                return { name: d.toLocaleString('default', { weekday: 'short' }), income: 0, expense: 0, dateString: d.toDateString() };
            });
        } else if (timeRange === 'month') {
            expenseTrendMap = Array.from({ length: 30 }).map((_, i) => {
                const d = new Date(today);
                d.setDate(today.getDate() - (29 - i));
                return { name: `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`, income: 0, expense: 0, dateString: d.toDateString() };
            });
        } else {
            const monthsCount = timeRange === 'all' ? 24 : 12;
            expenseTrendMap = Array.from({ length: monthsCount }).map((_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - ((monthsCount - 1) - i));
                return { name: `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear().toString().slice(2)}`, income: 0, expense: 0, year: d.getFullYear(), month: d.getMonth() };
            });
        }

        expenses.forEach(tx => {
            const date = new Date(tx.date);
            let stat;
            if (timeRange === 'week' || timeRange === 'month') {
                stat = expenseTrendMap.find(m => m.dateString === date.toDateString());
            } else {
                stat = expenseTrendMap.find(m => m.month === date.getMonth() && m.year === date.getFullYear());
            }

            if (stat) {
                if (tx.type === 'income') stat.income += tx.amount;
                else stat.expense += tx.amount;
            }
        });

        return { habitStats: habitStatsMap, goalStats, expenseStats: expenseTrendMap };
    }, [habits, goals, expenses, isLoading, timeRange]);

    if (isLoading) {
        return (
            <div className="p-6 md:p-10 flex items-center justify-center h-full text-zinc-500 flex-col gap-4">
                <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <span className="text-sm font-semibold uppercase tracking-widest">Crunching Numbers...</span>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-24 md:pb-10">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                        {timeRange === 'week' ? 'Weekly Analysis' : timeRange === 'month' ? 'Monthly Review' : timeRange === 'all' ? 'All-Time Analytics' : 'Year in Review'}
                    </h1>
                    <p className="text-zinc-400">Deep-dive insights into your habits, goals, and finances.</p>
                </div>
                <div className="flex bg-zinc-900/50 p-1.5 rounded-xl border border-white/5 w-fit">
                    {['week', 'month', 'year', 'all'].map(t => (
                        <button
                            key={t}
                            onClick={() => setTimeRange(t)}
                            className={clsx(
                                "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                                timeRange === t ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </header>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 flex items-start gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-2xl"><Zap className="w-6 h-6 text-indigo-400" /></div>
                    <div>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Total Habits Completed</p>
                        <h3 className="text-3xl font-black text-white">{habits.reduce((acc, h) => acc + (h.history?.length || 0), 0)}</h3>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 flex items-start gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-2xl"><Target className="w-6 h-6 text-purple-400" /></div>
                    <div>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Active Goals</p>
                        <h3 className="text-3xl font-black text-white">{goals.filter(g => g.status !== 'completed').length}</h3>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 flex items-start gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl"><TrendingUp className="w-6 h-6 text-emerald-400" /></div>
                    <div>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Total Savings Logged</p>
                        <h3 className="text-3xl font-black text-white">
                            ₹{expenses.filter(e => e.type === 'income').reduce((acc, e) => acc + e.amount, 0).toLocaleString()}
                        </h3>
                    </div>
                </motion.div>
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Habit Consistency Area Chart */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="glass-card p-6 flex flex-col h-[400px]">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart2 className="w-5 h-5 text-indigo-400" />
                        <h2 className="text-lg font-bold text-white">Habit Consistency</h2>
                    </div>
                    <div className="flex-1 min-h-0 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={habitStats}>
                                <defs>
                                    <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} dy={10} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="completions" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCompletions)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Financial Overview Bar Chart */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="glass-card p-6 flex flex-col h-[400px]">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        <h2 className="text-lg font-bold text-white">Cash Flow</h2>
                    </div>
                    <div className="flex-1 min-h-0 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={expenseStats} barGap={4}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} dy={10} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                                />
                                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Goals Category Pie Chart */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} className="glass-card p-6 flex flex-col h-[350px] lg:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                        <PieChartIcon className="w-5 h-5 text-purple-400" />
                        <h2 className="text-lg font-bold text-white">Goals by Category</h2>
                    </div>
                    <div className="flex-1 min-h-0 w-full flex items-center justify-center relative">
                        {goalStats.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={goalStats}
                                        cx="50%" cy="50%"
                                        innerRadius={80} outerRadius={110}
                                        paddingAngle={5} dataKey="value"
                                        stroke="none"
                                    >
                                        {goalStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: 'none' }}
                                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-zinc-600 text-sm">No goals created yet.</div>
                        )}
                        {/* Center Text */}
                        {goalStats.length > 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-black text-white">{goals.length}</span>
                                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Total Goals</span>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
