import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Activity, Zap, MessageSquare, CheckCircle2, ArrowRight, Book, Target, TrendingUp, Award, Brain, Calendar, Flag, ChevronLeft, ChevronRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/axios';
import NotificationBell from '../components/NotificationBell';

const QUOTES = [
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "Do something today that your future self will thank you for.",
    "The only way to do great work is to love what you do.",
    "Productivity is being able to do things that you were never able to do before.",
    "Your mind is for having ideas, not holding them."
];

export default function Dashboard() {
    const { user } = useAuth();
    const [time] = useState(new Date().getHours());
    const [habits, setHabits] = useState([]);
    const [chats, setChats] = useState([]);
    const [journals, setJournals] = useState([]);
    const [goals, setGoals] = useState([]);
    const [quoteIdx, setQuoteIdx] = useState(0);
    const [targetScore, setTargetScore] = useState(75);
    const [, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    const scrollRef = useRef(null);

    const scroll = (dir) => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const target = dir === 'left' ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2;
            scrollRef.current.scrollTo({ left: target, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        // Set Initial Quote based on day of year
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        setQuoteIdx(dayOfYear % QUOTES.length);
        
        // Auto-cycle quotes every 10 seconds
        const interval = setInterval(() => {
            setQuoteIdx(prev => (prev + 1) % QUOTES.length);
        }, 10000);

        const fetchData = async () => {
            try {
                const [habitsRes, chatsRes, journalsRes, statsRes, goalsRes] = await Promise.all([
                    api.get('/habits'),
                    api.get('/chat/conversations'),
                    api.get('/journal'),
                    api.get('/search/stats'),
                    api.get('/goals'),
                ]);
                setHabits(Array.isArray(habitsRes.data) ? habitsRes.data : []);
                setChats(Array.isArray(chatsRes.data) ? chatsRes.data.slice(0, 3) : []);
                setJournals(Array.isArray(journalsRes.data) ? journalsRes.data : []);
                setStats(statsRes.data || null);
                setGoals(Array.isArray(goalsRes.data) ? goalsRes.data.filter(g => g.status === 'active').slice(0, 4) : []);
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
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto mobile-page-pad pb-24 md:pb-8 overflow-x-hidden">
            <Helmet>
                <title>Dashboard | Life OS</title>
            </Helmet>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter leading-none">
                        {greeting}, <br/>
                        <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{user?.name ? user.name.split(' ')[0] : 'User'}</span>
                    </h1>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 mt-2 uppercase tracking-[0.2em]">
                        <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={quoteIdx}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.5 }}
                            >
                                {QUOTES[quoteIdx].substring(0, 45)}…
                            </motion.span>
                        </AnimatePresence>
                    </div>
                </div>
                <div className="text-right hidden md:block">
                    <div className="text-zinc-500 text-sm font-mono">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                </div>
            </div>

            {/* Main Details Grid */}
            {/* Quick Actions Slider */}
            <div className="relative group/slider">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Quick Actions</span>
                    <div className="hidden md:flex gap-2">
                        <button onClick={() => scroll('left')} className="p-1.5 rounded-full bg-zinc-800/50 hover:bg-zinc-700 border border-white/5 transition-all">
                            <ChevronLeft className="w-4 h-4 text-zinc-400" />
                        </button>
                        <button onClick={() => scroll('right')} className="p-1.5 rounded-full bg-zinc-800/50 hover:bg-zinc-700 border border-white/5 transition-all">
                            <ChevronRight className="w-4 h-4 text-zinc-400" />
                        </button>
                    </div>
                </div>
                
                <div 
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-1 px-1 snap-x snap-mandatory scroll-smooth"
                >
                    {/* 1. Ask AI Card */}
                    <Link to="/chat" className="relative h-[100px] min-w-[200px] flex-1 md:flex-none md:w-64 overflow-hidden rounded-2xl p-4 bg-zinc-900/80 border border-zinc-700/50 shadow-xl backdrop-blur-md transition-all active:scale-[0.98] group flex items-center snap-start">
                        <div className="flex items-center gap-3 relative z-10 w-full">
                            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center shadow-inner shrink-0 group-hover:bg-indigo-600/20 transition-colors">
                                <Sparkles className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-base text-white tracking-tight leading-tight">Ask AI</h3>
                                <p className="text-zinc-500 text-[10px] font-medium mt-0.5 line-clamp-1">Brainstorm ideas & plan.</p>
                            </div>
                        </div>
                        <Sparkles className="absolute -right-2 -bottom-2 w-20 h-20 text-indigo-500/5 opacity-20 transition-transform group-hover:scale-110" />
                    </Link>

                    {/* 2. Focus Mode Card */}
                    <Link to="/focus" className="relative h-[100px] min-w-[200px] flex-1 md:flex-none md:w-64 overflow-hidden rounded-2xl p-4 bg-zinc-900/80 border border-zinc-700/50 shadow-xl backdrop-blur-md transition-all active:scale-[0.98] group flex items-center snap-start">
                        <div className="flex items-center gap-3 relative z-10 w-full">
                            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center shadow-inner shrink-0 group-hover:bg-purple-600/20 transition-colors">
                                <Zap className="w-6 h-6 text-purple-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-base text-white tracking-tight leading-tight">Focus Mode</h3>
                                <p className="text-zinc-500 text-[10px] font-medium mt-0.5 line-clamp-1">Enter the deep flow state.</p>
                            </div>
                        </div>
                        <Zap className="absolute -right-2 -bottom-2 w-20 h-20 text-purple-500/5 opacity-20 transition-transform group-hover:scale-110" />
                    </Link>

                    {/* 3. Habits Status Card */}
                    <Link to="/habits" className="relative h-[100px] min-w-[200px] flex-1 md:flex-none md:w-64 overflow-hidden rounded-2xl p-4 bg-zinc-900/80 border border-zinc-700/50 shadow-xl backdrop-blur-md transition-all active:scale-[0.98] group flex items-center snap-start">
                        <div className="flex items-center gap-3 relative z-10 w-full">
                            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center shadow-inner shrink-0 group-hover:bg-green-600/20 transition-colors">
                                <Activity className="w-6 h-6 text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-base text-white tracking-tight leading-tight">Habits</h3>
                                <div className="flex items-end gap-1 mt-0.5">
                                    <span className="text-xl font-black text-white">{completedToday}</span>
                                    <span className="text-zinc-500 font-bold text-[8px] mb-0.5 uppercase tracking-widest">/ {habits.length} done</span>
                                </div>
                            </div>
                        </div>
                        <Activity className="absolute -right-2 -bottom-2 w-20 h-20 text-green-500/5 opacity-20 transition-transform group-hover:scale-110" />
                    </Link>

                    {/* 4. Journal Card */}
                    <Link to="/journal" className="relative h-[100px] min-w-[200px] flex-1 md:flex-none md:w-64 overflow-hidden rounded-2xl p-4 bg-zinc-900/80 border border-zinc-700/50 shadow-xl backdrop-blur-md transition-all active:scale-[0.98] group flex items-center snap-start">
                        <div className="flex items-center gap-3 relative z-10 w-full">
                            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center shadow-inner shrink-0 group-hover:bg-pink-600/20 transition-colors">
                                <Book className="w-6 h-6 text-pink-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-base text-white tracking-tight leading-tight">Journal</h3>
                                <p className="text-zinc-500 text-[10px] font-medium mt-0.5 line-clamp-1">Reflect on your journey.</p>
                            </div>
                        </div>
                        <Book className="absolute -right-1 -bottom-1 w-20 h-20 text-pink-500/5 opacity-20 transition-transform group-hover:scale-110" />
                    </Link>

                    {/* 5. Vision Card */}
                    <Link to="/chat" className="relative h-[100px] min-w-[200px] flex-1 md:flex-none md:w-64 overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 shadow-xl backdrop-blur-md transition-all active:scale-[0.98] group flex items-center snap-start">
                        <div className="flex items-center gap-3 relative z-10 w-full">
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shadow-inner shrink-0 group-hover:bg-white/20 transition-colors border border-white/10">
                                <Brain className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-base text-white tracking-tight leading-tight">Visionary</h3>
                                <p className="text-zinc-300 text-[10px] font-medium mt-0.5 line-clamp-1">AI-powered long-term planning.</p>
                            </div>
                        </div>
                        <Brain className="absolute -right-2 -bottom-2 w-20 h-20 text-white/5 opacity-20 transition-transform group-hover:scale-110" />
                    </Link>
                </div>
            </div>

            {/* ── Stats Panel ── */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Productivity Score */}
                    <div className="relative glass-card p-5 overflow-hidden col-span-2 md:col-span-1">
                        <div className="absolute -top-4 -right-4 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl" />
                        <div className="relative">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Brain className="w-3.5 h-3.5 text-indigo-400" />
                                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">Productivity</span>
                                </div>
                                <span className="text-[10px] font-bold text-indigo-400">Target: {targetScore}</span>
                            </div>
                            <div className="text-3xl font-bold text-white tabular-nums">{stats.productivityScore}<span className="text-base text-zinc-500">/{targetScore}</span></div>
                            <div className="mt-2 w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000" style={{ width: `${Math.min(100, (stats.productivityScore / targetScore) * 100)}%` }} />
                            </div>
                            
                            <div className="mt-4 hidden md:block group/resizer">
                                <input 
                                    type="range" min="10" max="100" value={targetScore} 
                                    onChange={(e) => setTargetScore(parseInt(e.target.value))}
                                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 premium-slider"
                                />
                                <div className="flex justify-between mt-1 opacity-0 group-hover/resizer:opacity-100 transition-opacity">
                                    <span className="text-[8px] text-zinc-600 font-bold uppercase">Lower Target</span>
                                    <span className="text-[8px] text-zinc-600 font-bold uppercase">High Achiever</span>
                                </div>
                            </div>
                            <p className="text-xs text-zinc-500 mt-1 md:hidden">Weekly score</p>
                        </div>
                    </div>

                    {/* Best Streak */}
                    <div className="glass-card p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Award className="w-4 h-4 text-amber-400" />
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Best Streak</span>
                        </div>
                        <div className="text-3xl md:text-3xl font-bold text-amber-400 tabular-nums">{stats.habits?.bestStreak || 0}<span className="text-sm text-zinc-500"> days</span></div>
                        <p className="text-xs text-zinc-500 mt-1">{stats.habits?.totalCompletions || 0} total completions</p>
                    </div>

                    {/* Journal Streak */}
                    <div className="glass-card p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Book className="w-4 h-4 text-pink-400" />
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Journal Streak</span>
                        </div>
                        <div className="text-3xl md:text-3xl font-bold text-pink-400 tabular-nums">{stats.journal?.streak || 0}<span className="text-sm text-zinc-500"> days</span></div>
                        <p className="text-xs text-zinc-500 mt-1">{stats.journal?.total || 0} total entries</p>
                    </div>

                    {/* Goals */}
                    <Link to="/goals" className="glass-card p-5 group hover:border-indigo-500/20 transition-colors col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-3">
                            <Target className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Goals</span>
                        </div>
                        <div className="text-3xl md:text-3xl font-bold text-emerald-400 tabular-nums">{stats.goals?.avgProgress || 0}<span className="text-sm text-zinc-500">% avg</span></div>
                        <p className="text-xs text-zinc-500 mt-1">{stats.goals?.active || 0} active · {stats.goals?.completed || 0} done</p>
                    </Link>
                </div>
            )}

            {/* Mood Tracker strip (if journal data available) */}
            {stats && stats.journal?.moodCounts && Object.values(stats.journal.moodCounts).some(v => v > 0) && (
                <div className="glass-card p-4 md:p-5 overflow-hidden">
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
                                    <div className="w-full bg-zinc-800 rounded-full overflow-hidden relative" style={{ height: 60 }}>
                                        <div className="w-full rounded-full transition-all duration-1000 absolute bottom-0 left-0" style={{ height: `${pct}%`, background: color }} />
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
                        <div className="text-right shrink-0">
                            <div className="text-2xl font-bold text-white tabular-nums">
                                {chartData.length > 0 ? Math.round(chartData.reduce((s, d) => s + d.value, 0) / chartData.length) : 0}
                                <span className="text-sm text-zinc-500 font-normal">%</span>
                            </div>
                            <div className="text-[11px] text-zinc-600 mt-0.5 whitespace-nowrap">7-day avg</div>
                        </div>
                    </div>

                    {/* Chart body */}
                    {(() => {
                        const BAR_H = 140; // Reduced height for mobile
                        const gridLines = [100, 50]; // Simplified grid

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
                                <div className="flex items-end justify-between gap-1.5 sm:gap-3 pl-6 sm:pl-8" style={{ height: BAR_H + 28 }}>
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
