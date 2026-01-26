import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Activity, Zap, MessageSquare, CheckCircle2, ArrowRight } from 'lucide-react';
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
    const [quote, setQuote] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Set Greeting Phrase
        // Set Quote based on day of year to be consistent for 24h
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        setQuote(QUOTES[dayOfYear % QUOTES.length]);

        const fetchData = async () => {
            try {
                const [habitsRes, chatsRes] = await Promise.all([
                    api.get('/habits'),
                    api.get('/chat/conversations')
                ]);
                setHabits(habitsRes.data);
                setChats(chatsRes.data.slice(0, 3)); // Get top 3
            } catch (err) {
                console.error("Dashboard Fetch Error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const greeting = time < 12 ? 'Good morning' : time < 18 ? 'Good afternoon' : 'Good evening';

    // Calculate Habit Progress
    const todayStr = new Date().toISOString().split('T')[0];
    const completedToday = habits.filter(h =>
        h.completedDates.some(d => new Date(d).toISOString().split('T')[0] === todayStr)
    ).length;
    const progress = habits.length > 0 ? (completedToday / habits.length) * 100 : 0;

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* 1. Quick Chat / AI Card */}
                <Link to="/chat" className="group relative bg-zinc-900/40 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 hover:bg-zinc-900/60 hover:border-indigo-500/50 transition-all duration-300 overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Sparkles className="w-24 h-24 text-indigo-500" />
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="bg-indigo-500/20 w-fit p-3 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Sparkles className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-semibold text-white mb-2">Ask AI</h3>
                        <p className="text-zinc-400 mb-6 flex-1">Draft emails, brainstorm ideas, or plan your schedule.</p>

                        {/* Recent Chats Mini-List */}
                        <div className="space-y-2">
                            {chats.length > 0 ? (
                                chats.map(chat => (
                                    <div key={chat._id} className="text-sm text-zinc-500 truncate flex items-center gap-2">
                                        <MessageSquare className="w-3 h-3" />
                                        {chat.title || "New Conversation"}
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-zinc-600 italic">No recent chats</div>
                            )}
                        </div>

                        <div className="mt-6 flex items-center gap-2 text-indigo-400 text-sm font-medium">
                            Start Verification <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </Link>

                {/* 2. Focus Mode Card */}
                <Link to="/focus" className="group relative bg-zinc-900/40 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 hover:bg-zinc-900/60 hover:border-purple-500/50 transition-all duration-300 overflow-hidden">
                    <div className="absolute -bottom-8 -right-8 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap className="w-40 h-40 text-purple-500" />
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="bg-purple-500/20 w-fit p-3 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Zap className="w-6 h-6 text-purple-400" />
                        </div>
                        <h3 className="text-2xl font-semibold text-white mb-2">Focus Mode</h3>
                        <p className="text-zinc-400 mb-6 flex-1">Block distractions and enter the flow state.</p>

                        <div className="mt-auto">
                            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-purple-500 h-full w-2/3 animate-pulse"></div>
                            </div>
                            <div className="flex justify-between text-xs text-zinc-500 mt-2">
                                <span>Productivity Pulse</span>
                                <span>Ready</span>
                            </div>
                        </div>
                    </div>
                </Link>

                {/* 3. Habits Status Card */}
                <Link to="/habits" className="group relative bg-zinc-900/40 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 hover:bg-zinc-900/60 hover:border-green-500/50 transition-all duration-300 overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity className="w-24 h-24 text-green-500" />
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="bg-green-500/20 w-fit p-3 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Activity className="w-6 h-6 text-green-400" />
                        </div>
                        <h3 className="text-2xl font-semibold text-white mb-2">Daily Goals</h3>

                        <div className="flex items-end gap-2 mb-4">
                            <span className="text-4xl font-bold text-white">{completedToday}</span>
                            <span className="text-zinc-500 mb-1">/ {habits.length} completed</span>
                        </div>

                        {/* Mini Progress Bar */}
                        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden mb-6">
                            <div
                                className="bg-green-500 h-full transition-all duration-1000 ease-out"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>

                        <div className="mt-auto space-y-2">
                            {habits.slice(0, 3).map(h => {
                                const isDone = h.completedDates.some(d => new Date(d).toISOString().split('T')[0] === todayStr);
                                return (
                                    <div key={h._id} className="flex items-center gap-3 text-sm">
                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${isDone ? 'bg-green-500 border-green-500' : 'border-zinc-700'}`}>
                                            {isDone && <CheckCircle2 className="w-3 h-3 text-black" />}
                                        </div>
                                        <span className={isDone ? 'text-zinc-500 line-through' : 'text-zinc-300'}>{h.name}</span>
                                    </div>
                                );
                            })}
                            {habits.length > 3 && <div className="text-xs text-zinc-500 pl-7">+{habits.length - 3} more...</div>}
                        </div>
                    </div>
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Potentially a large chart or "Week at a glance" here later */}
            </div>
        </div>
    );
}
