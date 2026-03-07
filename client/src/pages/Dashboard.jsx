import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Activity, Zap, MessageSquare, CheckCircle2, ArrowRight, Book, Target, TrendingUp, Award, Brain, Calendar, Flag } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import api from '../lib/axios';

const QUOTES = [
    "The only way to do great work is to love what you do.",
    "Your time is limited, so don't waste it living someone else's life.",
    "Believe you can and you're halfway there.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "The future belongs to those who believe in the beauty of their dreams.",
    "Do something today that your future self will thank you for.",
    "Productivity is being able to do things that you were never able to do before.",
    "Focus on being productive instead of busy."
];

export default function Dashboard() {
    const { user } = useAuth();
    const [time, setTime] = useState(new Date().getHours());
    const [habits, setHabits] = useState([]);
    const [chats, setChats] = useState([]);
    const [journals, setJournals] = useState([]);
    const [goals, setGoals] = useState([]);
    const [quote, setQuote] = useState("");
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        // Set Greeting Phrase
        // Set Quote based on day of year to be consistent for 24h
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        setQuote(QUOTES[dayOfYear % QUOTES.length]);

        const fetchData = async () => {
            try {
                const [habitsRes, chatsRes, journalsRes, statsRes, goalsRes] = await Promise.all([
                    api.get('/habits'),
                    api.get('/chat/conversations'),
                    api.get('/journal'),
                    api.get('/search/stats'),
                    api.get('/goals'),
                ]);
                setHabits(habitsRes.data);
                setChats(chatsRes.data.slice(0, 3));
                setJournals(journalsRes.data);
                setStats(statsRes.data);
                setGoals(goalsRes.data.filter(g => g.status === 'active').slice(0, 4));
            } catch (err) {
                console.error("Dashboard Fetch Error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Helper for Local Date String (YYYY-MM-DD)
    const getLocalDateString = (date) => {
        const d = new Date(date);
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().split('T')[0];
    };

    const greeting = time < 12 ? 'Good morning' : time < 18 ? 'Good afternoon' : 'Good evening';

    // Calculate Habit Progress
    const todayStr = getLocalDateString(new Date());
    const completedToday = habits.filter(h =>
        h.completedDates.some(d => getLocalDateString(d) === todayStr)
    ).length;
    const progress = habits.length > 0 ? (completedToday / habits.length) * 100 : 0;

    // Calculate Last 7 Days Data for Chart
    // Calculate Last 7 Days Data for Chart
    const chartData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i)); // Order: -6, -5, ... 0 (Today)
        return d;
    }).map(date => {
        const dateStr = getLocalDateString(date);
        const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });

        if (habits.length === 0) return { day: dayLabel, fullDate: dateStr, value: 0 };

        // Check completion for this specific date (Local Time)
        const completedCount = habits.filter(h =>
            h.completedDates.some(cd => getLocalDateString(cd) === dateStr)
        ).length;

        return {
            day: dayLabel,
            fullDate: dateStr,
            value: Math.round((completedCount / habits.length) * 100)
        };
    });

    const isChartEmpty = chartData.every(d => d.value === 0);

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto">
            <Helmet>
                <title>Dashboard | Life OS</title>
            </Helmet>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-2">
                        {greeting}, <span className="text-indigo-400">{user?.name ? user.name.split(' ')[0] : 'User'}</span>
                    </h1>
                    <p className="text-zinc-400 text-sm md:text-lg max-w-2xl">
                        "{quote}"
                    </p>
                </div>
                <div className="text-right hidden md:block">
                    <div className="text-zinc-500 text-sm font-mono">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                </div>
            </div>

            {/* Main Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">

                {/* 1. Quick Chat / AI Card */}
                <Link to="/chat" className="group relative glass-card p-6 overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Sparkles className="w-24 h-24 text-indigo-500" />
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="bg-indigo-500/20 w-fit p-3 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Sparkles className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Ask AI</h3>
                        <p className="text-zinc-400 text-sm mb-4 flex-1">Draft emails, brainstorm ideas, or plan your schedule.</p>

                        {/* Recent Chats Mini-List */}
                        <div className="space-y-2 mb-4">
                            {chats.slice(0, 2).map(chat => (
                                <div key={chat._id} className="text-xs text-zinc-500 truncate flex items-center gap-2">
                                    <MessageSquare className="w-3 h-3" />
                                    {chat.title || "New Conversation"}
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto flex items-center gap-2 text-indigo-400 text-sm font-medium">
                            Start New Chat <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </Link>

                {/* 2. Focus Mode Card */}
                <Link to="/focus" className="group relative glass-card p-6 overflow-hidden flex flex-col">
                    <div className="absolute -bottom-8 -right-8 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap className="w-40 h-40 text-purple-500" />
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="bg-purple-500/20 w-fit p-3 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Zap className="w-6 h-6 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Focus Mode</h3>
                        <p className="text-zinc-400 text-sm mb-6 flex-1">Block distractions and enter the flow state.</p>

                        <div className="mt-auto">
                            <div className="flex items-center gap-2 text-purple-400 text-sm font-medium bg-purple-500/10 py-2 px-3 rounded-lg w-fit group-hover:bg-purple-500/20 transition-colors">
                                Start Session <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* 3. Habits Status Card */}
                <Link to="/habits" className="group relative glass-card p-6 overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity className="w-24 h-24 text-green-500" />
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="bg-green-500/20 w-fit p-3 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Activity className="w-6 h-6 text-green-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Daily Goals</h3>

                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-3xl font-bold text-white">{completedToday}</span>
                            <span className="text-zinc-500 mb-1 text-xs">/ {habits.length} done</span>
                        </div>

                        {/* Mini Progress Bar */}
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mb-4">
                            <div
                                className="bg-green-500 h-full transition-all duration-1000 ease-out"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>

                        <div className="mt-auto space-y-1.5">
                            {habits.slice(0, 2).map(h => {
                                const isDone = h.completedDates.some(d => new Date(d).toISOString().split('T')[0] === todayStr);
                                return (
                                    <div key={h._id} className="flex items-center gap-2 text-xs">
                                        <div className={`w-3 h-3 rounded-full flex items-center justify-center border ${isDone ? 'bg-green-500 border-green-500' : 'border-zinc-700'}`}>
                                            {isDone && <CheckCircle2 className="w-2.5 h-2.5 text-black" />}
                                        </div>
                                        <span className={`truncate ${isDone ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>{h.name}</span>
                                    </div>
                                );
                            })}
                            {habits.length > 2 && <div className="text-[10px] text-zinc-500 pl-5">+{habits.length - 2} more...</div>}
                        </div>
                    </div>
                </Link>

                {/* 4. Journal Card */}
                <Link to="/journal" className="group relative glass-card p-6 overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Book className="w-24 h-24 text-pink-500" />
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="bg-pink-500/20 w-fit p-3 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Book className="w-6 h-6 text-pink-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">Journal</h3>

                        {journals.length > 0 && new Date(journals[0].date).toDateString() === new Date().toDateString() ? (
                            <>
                                <p className="text-zinc-400 text-sm mb-2">Today's entry captured.</p>
                                <div className="mt-auto">
                                    <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
                                        <div className="text-xs text-zinc-500 mb-1">Mood</div>
                                        <div className="text-white font-medium capitalize">{journals[0].mood || 'Neutral'}</div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-zinc-400 text-sm mb-6 flex-1">Reflect on your day and clear your mind.</p>
                                <div className="mt-auto">
                                    <div className="flex items-center gap-2 text-pink-400 text-sm font-medium bg-pink-500/10 py-2 px-3 rounded-lg w-fit group-hover:bg-pink-500/20 transition-colors">
                                        Write Entry <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </Link>

            </div>

            {/* ── Stats Panel ── */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Productivity Score */}
                    <div className="relative glass-card p-5 overflow-hidden col-span-2 md:col-span-1">
                        <div className="absolute -top-4 -right-4 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl" />
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-3">
                                <Brain className="w-4 h-4 text-indigo-400" />
                                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Productivity</span>
                            </div>
                            <div className="text-4xl font-bold text-white tabular-nums">{stats.productivityScore}<span className="text-lg text-zinc-500">/100</span></div>
                            <div className="mt-2 w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000" style={{ width: `${stats.productivityScore}%` }} />
                            </div>
                            <p className="text-xs text-zinc-500 mt-1">Weekly score</p>
                        </div>
                    </div>

                    {/* Best Streak */}
                    <div className="glass-card p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Award className="w-4 h-4 text-amber-400" />
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Best Streak</span>
                        </div>
                        <div className="text-3xl font-bold text-amber-400 tabular-nums">{stats.habits.bestStreak}<span className="text-sm text-zinc-500"> days</span></div>
                        <p className="text-xs text-zinc-500 mt-1">{stats.habits.totalCompletions} total completions</p>
                    </div>

                    {/* Journal Streak */}
                    <div className="glass-card p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Book className="w-4 h-4 text-pink-400" />
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Journal Streak</span>
                        </div>
                        <div className="text-3xl font-bold text-pink-400 tabular-nums">{stats.journal.streak}<span className="text-sm text-zinc-500"> days</span></div>
                        <p className="text-xs text-zinc-500 mt-1">{stats.journal.total} total entries</p>
                    </div>

                    {/* Goals */}
                    <Link to="/goals" className="glass-card p-5 group hover:border-indigo-500/20 transition-colors">
                        <div className="flex items-center gap-2 mb-3">
                            <Target className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Goals</span>
                        </div>
                        <div className="text-3xl font-bold text-emerald-400 tabular-nums">{stats.goals.avgProgress}<span className="text-sm text-zinc-500">% avg</span></div>
                        <p className="text-xs text-zinc-500 mt-1">{stats.goals.active} active · {stats.goals.completed} done</p>
                    </Link>
                </div>
            )}

            {/* Mood Tracker strip (if journal data available) */}
            {stats && Object.values(stats.journal.moodCounts).some(v => v > 0) && (
                <div className="glass-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-4 h-4 text-zinc-400" />
                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Mood Distribution · Last 30 Days</h3>
                    </div>
                    <div className="flex items-end gap-3">
                        {[
                            { key: 'great', label: '😄', color: '#10b981' },
                            { key: 'good', label: '🙂', color: '#6366f1' },
                            { key: 'okay', label: '😐', color: '#f59e0b' },
                            { key: 'bad', label: '😟', color: '#f97316' },
                            { key: 'terrible', label: '😢', color: '#ef4444' },
                        ].map(({ key, label, color }) => {
                            const count = stats.journal.moodCounts[key] || 0;
                            const total = Object.values(stats.journal.moodCounts).reduce((a, b) => a + b, 0);
                            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                            return (
                                <div key={key} className="flex-1 flex flex-col items-center gap-2">
                                    <span className="text-xs font-bold tabular-nums" style={{ color }}>{pct > 0 ? `${pct}%` : ''}</span>
                                    <div className="w-full bg-zinc-800 rounded-full overflow-hidden" style={{ height: 60 }}>
                                        <div className="rounded-full transition-all duration-1000 mt-auto" style={{ height: `${pct}%`, background: color, marginTop: `${100 - pct}%` }} />
                                    </div>
                                    <span className="text-lg">{label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Active Goals Progress ── */}
            {goals.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-500/15 rounded-lg"><Target className="w-4 h-4 text-indigo-400"/></div>
                            <h3 className="text-lg font-bold text-white">Active Goals</h3>
                        </div>
                        <Link to="/goals" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                            View all <ArrowRight className="w-3 h-3"/>
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {goals.map(goal => {
                            const CAT_COLOR = {
                                health:'#f43f5e', career:'#f59e0b', learning:'#8b5cf6',
                                finance:'#10b981', relationships:'#3b82f6', personal:'#6366f1', other:'#71717a'
                            };
                            const color = CAT_COLOR[goal.category] || '#6366f1';
                            const done  = goal.milestones.filter(m => m.completed).length;
                            const total = goal.milestones.length;
                            const msPct = total > 0 ? Math.round((done/total)*100) : 0;
                            // Find next incomplete milestone
                            const nextMs = goal.milestones.find(m => !m.completed);
                            const daysLeft = goal.targetDate
                                ? Math.ceil((new Date(goal.targetDate) - Date.now()) / 864e5) : null;
                            return (
                                <Link key={goal._id} to="/goals"
                                    className="group relative bg-zinc-900/60 border border-white/5 hover:border-white/10 rounded-2xl p-5 overflow-hidden transition-all">
                                    <div className="absolute top-0 left-0 right-0 h-0.5" style={{background:color}}/>
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-white text-sm truncate">{goal.title}</h4>
                                            <span className="text-[10px] text-zinc-500 capitalize">{goal.category}</span>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-lg font-bold" style={{color}}>{goal.progress}%</div>
                                            {daysLeft !== null && (
                                                <div className={`text-[10px] ${daysLeft < 0 ? 'text-rose-400' : daysLeft < 7 ? 'text-amber-400' : 'text-zinc-500'}`}>
                                                    {daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? 'Due today' : `${Math.abs(daysLeft)}d over`}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="w-full bg-white/5 rounded-full h-1.5 mb-3 overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700" style={{width:`${goal.progress}%`, background:color}}/>
                                    </div>
                                    {/* Milestone dots */}
                                    {total > 0 && (
                                        <div className="flex items-center gap-1 mb-2">
                                            {goal.milestones.slice(0,8).map((m,i) => (
                                                <div key={i} className="w-2.5 h-2.5 rounded-full border transition-all"
                                                    style={m.completed
                                                        ? {background:color, borderColor:color}
                                                        : {background:'transparent', borderColor:'rgba(255,255,255,0.15)'}}/>
                                            ))}
                                            {total > 8 && <span className="text-[9px] text-zinc-600">+{total-8}</span>}
                                            <span className="text-[10px] text-zinc-500 ml-auto">{done}/{total} steps</span>
                                        </div>
                                    )}
                                    {/* Next step */}
                                    {nextMs && (
                                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 bg-white/3 rounded-lg px-2.5 py-1.5 border border-white/5">
                                            <Flag className="w-2.5 h-2.5 shrink-0" style={{color}}/>
                                            <span className="truncate">Next: {nextMs.text}</span>
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Weekly Activity Chart */}
            <div className="relative rounded-2xl overflow-hidden border border-white/5"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(15,15,20,0.95) 60%, rgba(16,185,129,0.04) 100%)' }}>


                {/* Ambient glow blobs */}
                <div className="absolute -top-16 left-1/4 w-56 h-56 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 right-1/4 w-48 h-48 bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />

                <div className="relative p-6 md:p-8">

                    {/* Header */}
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 bg-indigo-500/15 rounded-lg">
                                    <Activity className="w-4 h-4 text-indigo-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white tracking-tight">Weekly Activity</h3>
                                {/* Live badge */}
                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse inline-block" />
                                    Live
                                </span>
                            </div>
                            <p className="text-zinc-500 text-xs ml-8">Habit completion rate · last 7 days</p>
                        </div>

                        {/* Summary stat */}
                        <div className="text-right">
                            <div className="text-2xl font-bold text-white tabular-nums">
                                {Math.round(chartData.reduce((s, d) => s + d.value, 0) / chartData.length)}
                                <span className="text-sm text-zinc-500 font-normal">%</span>
                            </div>
                            <div className="text-[11px] text-zinc-600 mt-0.5">7-day avg</div>
                        </div>
                    </div>

                    {/* Chart body */}
                    {(() => {
                        const BAR_H = 180;
                        const gridLines = [100, 75, 50, 25];

                        return (
                            <div className="relative">
                                {/* Y-axis grid lines */}
                                <div className="absolute inset-0 pointer-events-none" style={{ bottom: 28 }}>
                                    {gridLines.map(pct => (
                                        <div
                                            key={pct}
                                            className="absolute left-0 right-0 flex items-center gap-2"
                                            style={{ bottom: `${(pct / 100) * BAR_H}px` }}
                                        >
                                            <span className="text-[9px] text-zinc-700 w-6 text-right shrink-0 tabular-nums">{pct}</span>
                                            <div className="flex-1 border-t border-white/[0.04]" />
                                        </div>
                                    ))}
                                </div>

                                {/* Bars */}
                                <div className="flex items-end justify-between gap-2 md:gap-3 pl-8" style={{ height: BAR_H + 28 }}>
                                    {chartData.map((data, i) => {
                                        const fillPx = data.value > 0
                                            ? Math.max(Math.round((data.value / 100) * BAR_H), 8)
                                            : 3;
                                        const isToday = data.fullDate === todayStr;
                                        const isHigh = data.value >= 80;
                                        const isMid = data.value >= 50 && data.value < 80;

                                        const barGradient = isHigh
                                            ? 'linear-gradient(to top, #059669, #34d399, #6ee7b7)'
                                            : isMid
                                                ? 'linear-gradient(to top, #4f46e5, #818cf8, #a5b4fc)'
                                                : data.value > 0
                                                    ? 'linear-gradient(to top, #3f3f46, #71717a)'
                                                    : 'linear-gradient(to top, #27272a, #27272a)';

                                        const glowColor = isHigh
                                            ? 'rgba(52,211,153,0.45)'
                                            : isMid
                                                ? 'rgba(129,140,248,0.45)'
                                                : 'transparent';

                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 group" style={{ height: BAR_H + 28 }}>

                                                {/* Hover % pill */}
                                                <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 mb-1">
                                                    <span className="text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-full border"
                                                        style={{
                                                            color: isHigh ? '#34d399' : isMid ? '#818cf8' : '#71717a',
                                                            background: isHigh ? 'rgba(52,211,153,0.1)' : isMid ? 'rgba(129,140,248,0.1)' : 'rgba(63,63,70,0.3)',
                                                            borderColor: isHigh ? 'rgba(52,211,153,0.3)' : isMid ? 'rgba(129,140,248,0.3)' : 'rgba(63,63,70,0.5)',
                                                        }}>
                                                        {data.value > 0 ? `${data.value}%` : '—'}
                                                    </span>
                                                </div>

                                                {/* Column wrapper */}
                                                <div className="w-full relative flex flex-col justify-end" style={{ height: BAR_H }}>

                                                    {/* Track */}
                                                    <div className="absolute inset-0 rounded-xl bg-white/[0.03] border border-white/[0.05]" />

                                                    {/* Filled bar */}
                                                    <div
                                                        className="relative w-full rounded-xl overflow-hidden transition-all duration-700 ease-out"
                                                        style={{
                                                            height: fillPx,
                                                            background: barGradient,
                                                            boxShadow: data.value > 0 ? `0 -4px 20px 2px ${glowColor}, 0 0 8px 0 ${glowColor}` : 'none',
                                                        }}
                                                    >
                                                        {/* Shimmer overlay */}
                                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%)' }} />
                                                    </div>

                                                    {/* Today ring */}
                                                    {isToday && (
                                                        <div className="absolute inset-0 rounded-xl pointer-events-none"
                                                            style={{ boxShadow: 'inset 0 0 0 1.5px rgba(129,140,248,0.5)' }} />
                                                    )}
                                                </div>

                                                {/* Day label */}
                                                <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${isToday ? 'text-indigo-400' : 'text-zinc-600 group-hover:text-zinc-400'}`}
                                                    style={{ height: 16 }}>
                                                    {data.day}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Empty State */}
                    {isChartEmpty && (
                        <div className="absolute inset-0 top-24 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <div className="text-3xl mb-2">📊</div>
                                <p className="text-zinc-500 text-sm px-4 py-2 rounded-full border border-white/5 bg-black/30 backdrop-blur-sm">
                                    Complete habits to see your activity
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
