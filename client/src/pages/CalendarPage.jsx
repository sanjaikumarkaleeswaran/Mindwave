import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, Target, CheckCircle2, Circle, Clock, Flag } from 'lucide-react';
import api from '../lib/axios';

const CATEGORY_COLORS = {
    health: '#f43f5e',
    career: '#f59e0b',
    learning: '#8b5cf6',
    finance: '#10b981',
    relationships: '#3b82f6',
    personal: '#6366f1',
    other: '#71717a',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function pad(n) { return String(n).padStart(2, '0'); }
function toYMD(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function fmtDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Build a map: "YYYY-MM-DD" → [{ goalTitle, milestoneText, completed, color, goalId }]
function buildEventMap(goals) {
    const map = {};
    goals.forEach(goal => {
        goal.milestones?.forEach(ms => {
            if (!ms.dueDate) return;
            const key = toYMD(new Date(ms.dueDate));
            if (!map[key]) map[key] = [];
            map[key].push({
                goalTitle: goal.title,
                goalId: goal._id,
                milestoneText: ms.text,
                completed: ms.completed,
                color: CATEGORY_COLORS[goal.category] || '#6366f1',
                category: goal.category,
                notes: ms.notes || '',
            });
        });
    });
    return map;
}

// Day detail panel shown on right (or bottom on mobile)
function DayPanel({ date, events, onClose }) {
    const today = toYMD(new Date());
    const isToday = toYMD(date) === today;
    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
    const overdue = events.filter(e => !e.completed && isPast);
    const done = events.filter(e => e.completed);
    const pending = events.filter(e => !e.completed && !isPast);

    return (
        <motion.div
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
            className="bg-zinc-900 border border-zinc-700/50 rounded-2xl p-5 h-full overflow-y-auto"
        >
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">{MONTHS[date.getMonth()]} {date.getFullYear()}</p>
                    <h3 className="text-2xl font-bold text-white">{date.getDate()}
                        {isToday && <span className="ml-2 text-xs font-semibold text-indigo-400 bg-indigo-400/10 border border-indigo-500/30 px-2 py-0.5 rounded-full">Today</span>}
                    </h3>
                </div>
                <button onClick={onClose} className="text-zinc-500 hover:text-white text-lg leading-none transition-colors">✕</button>
            </div>

            {events.length === 0 ? (
                <div className="text-center py-10">
                    <Calendar className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500 text-sm">No milestones due</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {overdue.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Clock className="w-3 h-3" />Overdue</p>
                            {overdue.map((e, i) => <EventCard key={i} event={e} />)}
                        </div>
                    )}
                    {pending.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Flag className="w-3 h-3" />Due Today</p>
                            {pending.map((e, i) => <EventCard key={i} event={e} />)}
                        </div>
                    )}
                    {done.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Completed</p>
                            {done.map((e, i) => <EventCard key={i} event={e} />)}
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}

function EventCard({ event }) {
    return (
        <Link to="/goals" className="block group">
            <div className="flex gap-3 p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/40 hover:border-zinc-600 transition-all cursor-pointer mb-2">
                <div className="w-1 rounded-full shrink-0" style={{ background: event.color, minHeight: 40 }} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                        {event.completed
                            ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: event.color }} />
                            : <Circle className="w-3.5 h-3.5 shrink-0 text-zinc-600" />}
                        <p className={`text-xs font-semibold truncate ${event.completed ? 'text-zinc-500 line-through' : 'text-white'}`}>{event.milestoneText}</p>
                    </div>
                    <p className="text-[10px] text-zinc-500 truncate">🎯 {event.goalTitle}</p>
                    {event.notes && <p className="text-[10px] text-zinc-600 italic mt-1 truncate">"{event.notes}"</p>}
                </div>
            </div>
        </Link>
    );
}

export default function CalendarPage() {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null); // Date object

    useEffect(() => {
        api.get('/goals').then(r => setGoals(r.data)).catch(console.error).finally(() => setLoading(false));
    }, []);

    const eventMap = buildEventMap(goals);

    // Calendar grid
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
    const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

    const todayStr = toYMD(today);

    // Summary stats
    const allEvents = Object.values(eventMap).flat();
    const totalMs = allEvents.length;
    const doneMs = allEvents.filter(e => e.completed).length;
    const overdueMs = allEvents.filter(e => !e.completed && new Date(Object.keys(eventMap).find(k => eventMap[k].includes(e))) < today).length;
    const thisMonthEvents = Object.entries(eventMap)
        .filter(([k]) => { const d = new Date(k); return d.getFullYear() === year && d.getMonth() === month; })
        .flatMap(([, v]) => v);

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            <Helmet><title>Calendar | Life OS</title></Helmet>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Calendar</h1>
                    <p className="text-zinc-500 mt-1">All your milestone due dates in one view.</p>
                </div>
                <Link to="/goals" className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-all">
                    <Target className="w-4 h-4 text-indigo-400" />Manage Goals
                </Link>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'This Month', value: thisMonthEvents.length, color: 'text-indigo-400' },
                    { label: 'Completed', value: doneMs, color: 'text-emerald-400' },
                    { label: 'Overdue', value: overdueMs, color: overdueMs > 0 ? 'text-rose-400' : 'text-zinc-500' },
                ].map(s => (
                    <div key={s.label} className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 text-center">
                        <div className={`text-2xl md:text-3xl font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Main calendar layout */}
            <div className="flex flex-col lg:flex-row gap-5">
                {/* Calendar */}
                <div className="flex-1 bg-zinc-900/60 border border-white/5 rounded-2xl overflow-hidden">
                    {/* Month nav */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                        <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-zinc-400 hover:text-white">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-white">{MONTHS[month]}</h2>
                            <p className="text-zinc-500 text-sm">{year}</p>
                        </div>
                        <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-zinc-400 hover:text-white">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 border-b border-white/5">
                        {WEEKDAYS.map(d => (
                            <div key={d} className="py-3 text-center text-xs font-semibold text-zinc-600 uppercase tracking-wider">{d}</div>
                        ))}
                    </div>

                    {/* Day cells */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-7">
                            {cells.map((day, i) => {
                                if (!day) return <div key={`e-${i}`} className="h-16 md:h-20 border-b border-r border-white/[0.03]" />;
                                const dateKey = `${year}-${pad(month + 1)}-${pad(day)}`;
                                const dayEvents = eventMap[dateKey] || [];
                                const isToday = dateKey === todayStr;
                                const isSelected = selected && toYMD(selected) === dateKey;
                                const hasDue = dayEvents.some(e => !e.completed);
                                const allDone = dayEvents.length > 0 && dayEvents.every(e => e.completed);

                                return (
                                    <motion.div key={day} whileHover={{ scale: 1.02 }}
                                        onClick={() => setSelected(new Date(year, month, day))}
                                        className={`h-16 md:h-20 p-1.5 border-b border-r border-white/[0.03] cursor-pointer transition-all relative ${isSelected ? 'bg-indigo-500/15 border-indigo-500/20' : hasDue ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-800/30'}`}
                                    >
                                        {/* Day number */}
                                        <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mb-1 ${isToday ? 'bg-indigo-500 text-white' : isSelected ? 'text-indigo-400' : 'text-zinc-400'}`}>
                                            {day}
                                        </div>

                                        {/* Event dots */}
                                        {dayEvents.length > 0 && (
                                            <div className="flex flex-wrap gap-0.5 px-0.5">
                                                {dayEvents.slice(0, 4).map((e, idx) => (
                                                    <div key={idx}
                                                        className={`w-2.5 h-2.5 rounded-full border ${e.completed ? 'opacity-50' : 'opacity-100'}`}
                                                        style={{ background: e.color, borderColor: `${e.color}60` }}
                                                        title={e.milestoneText}
                                                    />
                                                ))}
                                                {dayEvents.length > 4 && (
                                                    <span className="text-[8px] text-zinc-500 leading-none mt-0.5">+{dayEvents.length - 4}</span>
                                                )}
                                            </div>
                                        )}

                                        {/* All done checkmark */}
                                        {allDone && (
                                            <div className="absolute bottom-1 right-1">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-400 opacity-70" />
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    {/* Legend */}
                    <div className="px-5 py-3 border-t border-white/5 flex items-center gap-4 flex-wrap">
                        <span className="text-xs text-zinc-600 font-medium uppercase tracking-wider">Legend:</span>
                        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                            <div key={cat} className="flex items-center gap-1">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                                <span className="text-[10px] text-zinc-500 capitalize">{cat}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Day panel */}
                <div className="lg:w-80">
                    <AnimatePresence mode="wait">
                        {selected ? (
                            <DayPanel
                                key={toYMD(selected)}
                                date={selected}
                                events={eventMap[toYMD(selected)] || []}
                                onClose={() => setSelected(null)}
                            />
                        ) : (
                            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 text-center h-64 flex flex-col items-center justify-center">
                                <Calendar className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                                <p className="text-zinc-500 text-sm">Click a day to see milestones</p>
                                <p className="text-zinc-600 text-xs mt-1">Colored dots = milestone due dates</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Upcoming milestones list */}
                    <UpcomingPanel goals={goals} />
                </div>
            </div>
        </div>
    );
}

function UpcomingPanel({ goals }) {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const upcoming = [];
    goals.forEach(goal => {
        goal.milestones?.forEach(ms => {
            if (!ms.dueDate || ms.completed) return;
            const d = new Date(ms.dueDate); d.setHours(0, 0, 0, 0);
            const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
            upcoming.push({ ...ms, goalTitle: goal.title, color: CATEGORY_COLORS[goal.category] || '#6366f1', diff, goalId: goal._id });
        });
    });
    upcoming.sort((a, b) => a.diff - b.diff);
    const slice = upcoming.slice(0, 8);

    if (slice.length === 0) return null;

    return (
        <div className="mt-4 bg-zinc-900/60 border border-white/5 rounded-2xl p-5">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Upcoming Steps</p>
            <div className="space-y-2">
                {slice.map((ms, i) => {
                    const isOverdue = ms.diff < 0;
                    const isToday = ms.diff === 0;
                    const isSoon = ms.diff < 3 && ms.diff >= 0;
                    return (
                        <Link to="/goals" key={i} className="flex items-start gap-3 group cursor-pointer hover:opacity-90 transition-opacity">
                            <div className="w-1 rounded-full shrink-0 mt-1" style={{ background: ms.color, height: 32 }} />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-white font-medium truncate">{ms.text}</p>
                                <p className="text-[10px] text-zinc-500 truncate">🎯 {ms.goalTitle}</p>
                            </div>
                            <span className={`text-[10px] font-bold shrink-0 px-1.5 py-0.5 rounded-full ${isOverdue ? 'text-rose-400 bg-rose-400/10' : isToday ? 'text-amber-400 bg-amber-400/10' : isSoon ? 'text-orange-400 bg-orange-400/10' : 'text-zinc-500 bg-zinc-700/30'}`}>
                                {isOverdue ? `${Math.abs(ms.diff)}d late` : isToday ? 'Today' : `${ms.diff}d`}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
