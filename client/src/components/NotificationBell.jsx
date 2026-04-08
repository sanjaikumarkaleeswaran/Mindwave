import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle2, Clock, Target, Flame, BookOpen, Check, Calendar } from 'lucide-react';

const STORAGE_KEY = 'mindwave_dismissed_notifs';
const getDismissed = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } };
const saveDismissed = ids => localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));

function buildNotifications(habits = [], journals = [], goals = []) {
    if (!Array.isArray(habits)) habits = [];
    if (!Array.isArray(journals)) journals = [];
    if (!Array.isArray(goals)) goals = [];
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const hour = now.getHours();
    const notifs = [];

    /* ── 1. Goal milestone reminders ─────────────────────────── */
    const overdue = [], dueToday = [], dueSoon = [];
    goals.forEach(goal => {
        if (goal.status === 'completed' || goal.status === 'archived') return;
        (goal.milestones || []).forEach(ms => {
            if (!ms.dueDate || ms.completed) return;
            const base = new Date(); base.setHours(0, 0, 0, 0);
            const due = new Date(ms.dueDate); due.setHours(0, 0, 0, 0);
            const diff = Math.ceil((due - base) / 86400000);
            if (diff < 0) overdue.push({ ms, goal, diff });
            else if (diff === 0) dueToday.push({ ms, goal });
            else if (diff <= 2) dueSoon.push({ ms, goal, diff });
        });
    });

    if (overdue.length > 0) {
        notifs.push({
            id: `goal-overdue-${todayStr}`,
            type: 'goal',
            title: `${overdue.length} overdue milestone${overdue.length > 1 ? 's' : ''}`,
            body: overdue.slice(0, 2).map(x => `"${x.ms.text}" — ${x.goal.title}`).join(' · '),
            icon: Target,
            color: 'text-rose-400',
            bg: 'bg-rose-500/10 border-rose-500/20',
            priority: 'critical',
        });
    }
    if (dueToday.length > 0) {
        notifs.push({
            id: `goal-today-${todayStr}`,
            type: 'goal',
            title: `${dueToday.length} milestone${dueToday.length > 1 ? 's' : ''} due today`,
            body: dueToday.slice(0, 2).map(x => `"${x.ms.text}"`).join(' · '),
            icon: Calendar,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10 border-amber-500/20',
            priority: 'high',
        });
    }
    if (dueSoon.length > 0) {
        notifs.push({
            id: `goal-soon-${todayStr}`,
            type: 'goal',
            title: `${dueSoon.length} milestone${dueSoon.length > 1 ? 's' : ''} due in 1–2 days`,
            body: dueSoon.slice(0, 2).map(x => `"${x.ms.text}" (${x.diff}d)`).join(' · '),
            icon: Clock,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10 border-blue-500/20',
            priority: 'medium',
        });
    }

    /* ── 2. Habit reminders ───────────────────────────────────── */
    const pendingHabits = habits.filter(h =>
        !h.completedDates.some(d => new Date(d).toISOString().split('T')[0] === todayStr)
    );
    if (pendingHabits.length > 0 && hour >= 9) {
        notifs.push({
            id: `habit-pending-${todayStr}`,
            type: 'habit',
            title: `${pendingHabits.length} habit${pendingHabits.length > 1 ? 's' : ''} remaining today`,
            body: pendingHabits.slice(0, 2).map(h => h.name).join(', ') + (pendingHabits.length > 2 ? ` +${pendingHabits.length - 2} more` : ''),
            icon: Flame,
            color: 'text-orange-400',
            bg: 'bg-orange-500/10 border-orange-500/20',
            priority: 'high',
        });
    }

    const streakRisk = habits.filter(h =>
        h.streak > 2 && !h.completedDates.some(d => new Date(d).toISOString().split('T')[0] === todayStr)
    );
    if (streakRisk.length > 0 && hour >= 17) {
        notifs.push({
            id: `streak-risk-${todayStr}`,
            type: 'streak',
            title: '🔥 Streak at risk!',
            body: `"${streakRisk[0].name}" — ${streakRisk[0].streak}-day streak will reset`,
            icon: Flame,
            color: 'text-rose-400',
            bg: 'bg-rose-500/10 border-rose-500/20',
            priority: 'critical',
        });
    }

    /* ── 3. Journal reminder ─────────────────────────────────── */
    const hasJournal = journals.some(j => new Date(j.date).toISOString().split('T')[0] === todayStr);
    if (!hasJournal && hour >= 19) {
        notifs.push({
            id: `journal-${todayStr}`,
            type: 'journal',
            title: "You haven't journaled today",
            body: 'Take 5 minutes to reflect on your day',
            icon: BookOpen,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10 border-purple-500/20',
            priority: 'medium',
        });
    }

    /* ── 4. Morning motivation ───────────────────────────────── */
    if (hour >= 7 && hour < 10) {
        notifs.push({
            id: `morning-${todayStr}`,
            type: 'motivation',
            title: 'Good morning! Ready to crush it? 🌅',
            body: habits.length > 0 ? `${habits.length} habits to complete today` : 'Start your day with intention!',
            icon: CheckCircle2,
            color: 'text-indigo-400',
            bg: 'bg-indigo-500/10 border-indigo-500/20',
            priority: 'low',
        });
    }

    return notifs;
}

export default function NotificationBell({ habits = [], journals = [], goals = [] }) {
    const [open, setOpen] = useState(false);
    const [dismissed, setDismissed] = useState(getDismissed);
    const panelRef = useRef(null);

    const allNotifs = buildNotifications(habits, journals, goals);
    const visible = allNotifs.filter(n => !dismissed.includes(n.id));
    const unreadCount = visible.length;
    const hasCritical = visible.some(n => n.priority === 'critical');

    // Browser push permission
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Close on outside click
    useEffect(() => {
        const h = e => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    // Close on Escape
    useEffect(() => {
        const h = e => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('keydown', h);
        return () => document.removeEventListener('keydown', h);
    }, []);

    const dismiss = id => { const u = [...dismissed, id]; setDismissed(u); saveDismissed(u); };
    const dismissAll = () => { const u = [...dismissed, ...visible.map(n => n.id)]; setDismissed(u); saveDismissed(u); setOpen(false); };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell */}
            <button id="notification-bell" onClick={() => setOpen(!open)}
                className={`relative p-2 rounded-xl transition-all ${open ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
                <Bell className={`w-5 h-5 ${hasCritical ? 'text-rose-400 animate-pulse' : ''}`} />
                {unreadCount > 0 && (
                    <span className={`absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full text-[10px] font-bold text-white flex items-center justify-center ${hasCritical ? 'bg-rose-500' : 'bg-indigo-600'}`}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="absolute right-0 top-12 w-80 bg-zinc-900 border border-zinc-700/60 rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                            <span className="text-sm font-semibold text-white">Notifications</span>
                            {visible.length > 0 && (
                                <button onClick={dismissAll} className="text-xs text-zinc-500 hover:text-indigo-400 transition-colors">Clear all</button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-96 overflow-y-auto">
                            {visible.length === 0 ? (
                                <div className="p-8 text-center">
                                    <CheckCircle2 className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                                    <p className="text-zinc-500 text-sm">You're all caught up!</p>
                                    <p className="text-zinc-600 text-xs mt-1">No new notifications</p>
                                </div>
                            ) : (
                                <AnimatePresence initial={false}>
                                    {visible.map(notif => {
                                        const Icon = notif.icon;
                                        return (
                                            <motion.div key={notif.id} layout
                                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20, height: 0 }}
                                                className={`flex items-start gap-3 px-4 py-3 border-b border-zinc-800/50 group ${notif.priority === 'critical' ? 'bg-rose-500/5' : ''}`}>
                                                <div className={`p-2 rounded-lg shrink-0 mt-0.5 border ${notif.bg}`}>
                                                    <Icon className={`w-3.5 h-3.5 ${notif.color}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white leading-snug">{notif.title}</p>
                                                    <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed line-clamp-2">{notif.body}</p>
                                                </div>
                                                <button onClick={() => dismiss(notif.id)}
                                                    className="p-1 text-zinc-700 hover:text-zinc-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
