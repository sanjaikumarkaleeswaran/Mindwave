import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Activity, Zap, MessageSquare, CheckCircle2, ArrowRight, Book } from 'lucide-react';
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
    const [quote, setQuote] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Set Greeting Phrase
        // Set Quote based on day of year to be consistent for 24h
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        setQuote(QUOTES[dayOfYear % QUOTES.length]);

        const fetchData = async () => {
            try {
                const [habitsRes, chatsRes, journalsRes] = await Promise.all([
                    api.get('/habits'),
                    api.get('/chat/conversations'),
                    api.get('/journal')
                ]);
                setHabits(habitsRes.data);
                setChats(chatsRes.data.slice(0, 3)); // Get top 3
                setJournals(journalsRes.data);
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
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            <Helmet>
                <title>Dashboard | Life OS</title>
            </Helmet>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
                        {greeting}, <span className="text-indigo-400">{user?.name ? user.name.split(' ')[0] : 'User'}</span>
                    </h1>
                    <p className="text-zinc-400 text-lg max-w-2xl">
                        "{quote}"
                    </p>
                </div>
                <div className="text-right hidden md:block">
                    <div className="text-zinc-500 text-sm font-mono">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                </div>
            </div>

            {/* Main Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

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

            {/* Weekly Activity Chart */}
            <div className="glass-card p-6 md:p-8 relative">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-400" />
                            Weekly Activity
                        </h3>
                        <p className="text-zinc-500 text-sm mt-1">Consistency over the last 7 days</p>
                    </div>
                </div>

                <div className="h-64 flex items-end justify-between gap-2 md:gap-4">
                    {chartData.map((data, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-3">
                            <div className="w-full relative group h-full flex items-end">
                                {/* Background Bar */}
                                <div className="absolute inset-0 bg-white/5 rounded-t-lg"></div>

                                {/* Fill Bar */}
                                <div
                                    className="w-full relative overflow-hidden transition-all duration-1000 ease-out rounded-t-lg group-hover:brightness-110"
                                    style={{ height: `${Math.max(data.value, 4)}%` }} // Min height for visibility
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-t ${data.value >= 80 ? 'from-green-600 to-emerald-500' :
                                        data.value >= 50 ? 'from-indigo-600 to-purple-500' :
                                            'from-zinc-700 to-zinc-600'
                                        } opacity-90`}></div>
                                </div>

                                {/* Tooltip */}
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-xl font-mono">
                                    {data.value}%
                                </div>
                            </div>
                            <span className={`text-xs font-medium uppercase ${data.fullDate === todayStr ? 'text-indigo-400 font-bold' : 'text-zinc-500'}`}>
                                {data.day}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Empty State Overlay */}
                {isChartEmpty && (
                    <div className="absolute inset-0 top-20 flex items-center justify-center pointer-events-none">
                        <p className="text-zinc-500 text-sm bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full border border-white/5">
                            Complete habits to see your progress here
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
