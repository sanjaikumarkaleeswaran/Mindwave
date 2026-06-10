import { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, Target, CheckCircle2, Circle, Clock, Flag, Plus, X, Loader2 } from 'lucide-react';
import api from '../lib/axios';

const CATEGORY_COLORS = {
    health: '#f43f5e', career: '#f59e0b', learning: '#8b5cf6',
    finance: '#10b981', relationships: '#3b82f6', personal: '#6366f1', other: '#71717a',
    work: '#f97316', social: '#06b6d4', habit: '#84cc16', goal: '#a855f7',
};
const EVENT_CATEGORIES = ['personal','work','health','social','finance','learning','other'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function pad(n) { return String(n).padStart(2, '0'); }
function toYMD(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }

function buildEventMap(goals, customEvents) {
    const map = {};
    // Goal milestones
    goals.forEach(goal => {
        goal.milestones?.forEach(ms => {
            if (!ms.dueDate) return;
            const key = toYMD(new Date(ms.dueDate));
            if (!map[key]) map[key] = [];
            map[key].push({ type: 'milestone', goalTitle: goal.title, goalId: goal._id, milestoneText: ms.text, completed: ms.completed, color: CATEGORY_COLORS[goal.category] || '#6366f1', category: goal.category, notes: ms.notes || '' });
        });
    });
    // Custom events
    customEvents.forEach(ev => {
        const key = toYMD(new Date(ev.startDate));
        if (!map[key]) map[key] = [];
        map[key].push({ type: 'event', id: ev._id, milestoneText: ev.title, completed: ev.completed, color: CATEGORY_COLORS[ev.category] || '#6366f1', category: ev.category, notes: ev.description || '' });
    });
    return map;
}

// Add Event Form Modal
function AddEventModal({ date, onClose, onSaved }) {
    const [form, setForm] = useState({ title: '', category: 'personal', color: '#6366f1', description: '', allDay: true });
    const [saving, setSaving] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/events', { ...form, startDate: date.toISOString() });
            onSaved();
            onClose();
        } catch (err) { console.error(err); } finally { setSaving(false); }
    };

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-700/60 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-white">Add Event · {date?.toLocaleDateString()}</h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1 block">Title *</label>
                        <input value={form.title} onChange={e => set('title', e.target.value)} required placeholder="Event title..."
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                    </div>
                    <div>
                        <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1 block">Category</label>
                        <select value={form.category} onChange={e => { set('category', e.target.value); set('color', CATEGORY_COLORS[e.target.value] || '#6366f1'); }}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors">
                            {EVENT_CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1 block">Notes</label>
                        <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional notes..."
                            rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none" />
                    </div>
                    <button type="submit" disabled={saving}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Save Event
                    </button>
                </form>
            </div>
        </motion.div>
    );
}

function DayPanel({ date, events, onClose, onAddEvent, onToggleEvent }) {
    const today = toYMD(new Date());
    const isToday = toYMD(date) === today;
    const isPast = date < new Date(new Date().setHours(0,0,0,0));
    const overdue = events.filter(e => !e.completed && isPast);
    const done = events.filter(e => e.completed);
    const pending = events.filter(e => !e.completed && !isPast);

    return (
        <motion.div initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:16 }}
            className="bg-zinc-900 border border-zinc-700/50 rounded-2xl p-5 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">{MONTHS[date.getMonth()]} {date.getFullYear()}</p>
                    <h3 className="text-2xl font-bold text-white">{date.getDate()}
                        {isToday && <span className="ml-2 text-xs font-semibold text-indigo-400 bg-indigo-400/10 border border-indigo-500/30 px-2 py-0.5 rounded-full">Today</span>}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => onAddEvent(date)} className="p-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-400 rounded-xl transition-all" title="Add event">
                        <Plus className="w-4 h-4" />
                    </button>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white text-lg leading-none transition-colors">✕</button>
                </div>
            </div>

            {events.length === 0 ? (
                <div className="text-center py-8">
                    <Calendar className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500 text-sm mb-3">No events for this day</p>
                    <button onClick={() => onAddEvent(date)} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mx-auto transition-colors">
                        <Plus className="w-3 h-3" /> Add event
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {overdue.length > 0 && <EventGroup label="Overdue" color="rose" events={overdue} onToggle={onToggleEvent} />}
                    {pending.length > 0 && <EventGroup label="Due Today / Upcoming" color="amber" events={pending} onToggle={onToggleEvent} />}
                    {done.length > 0 && <EventGroup label="Completed" color="emerald" events={done} onToggle={onToggleEvent} />}
                </div>
            )}
        </motion.div>
    );
}

function EventGroup({ label, color, events, onToggle }) {
    const colorMap = { rose: 'text-rose-400', amber: 'text-amber-400', emerald: 'text-emerald-400' };
    return (
        <div>
            <p className={`text-xs font-semibold ${colorMap[color]} uppercase tracking-wider mb-2 flex items-center gap-1`}>
                {color === 'rose' ? <Clock className="w-3 h-3" /> : color === 'amber' ? <Flag className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                {label}
            </p>
            {events.map((e, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/40 hover:border-zinc-600 transition-all mb-2">
                    <div className="w-1 rounded-full shrink-0" style={{ background: e.color, minHeight: 40 }} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                            {e.completed ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: e.color }} /> : <Circle className="w-3.5 h-3.5 shrink-0 text-zinc-600" />}
                            <p className={`text-xs font-semibold truncate ${e.completed ? 'text-zinc-500 line-through' : 'text-white'}`}>{e.milestoneText}</p>
                        </div>
                        {e.goalTitle && <p className="text-[10px] text-zinc-500 truncate">🎯 {e.goalTitle}</p>}
                        {e.notes && <p className="text-[10px] text-zinc-600 italic mt-1 truncate">"{e.notes}"</p>}
                    </div>
                    {e.type === 'event' && (
                        <button onClick={() => onToggle(e.id, e.completed)} className="shrink-0 text-zinc-600 hover:text-emerald-400 transition-colors">
                            {e.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4" />}
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}

export default function CalendarPage() {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [goals, setGoals] = useState([]);
    const [customEvents, setCustomEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [addingFor, setAddingFor] = useState(null); // Date for add modal

    const fetchEvents = useCallback(async () => {
        try {
            const [goalsRes, eventsRes] = await Promise.all([
                api.get('/goals'),
                api.get('/events')
            ]);
            setGoals(goalsRes.data);
            setCustomEvents(eventsRes.data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    const handleToggleEvent = async (id, current) => {
        try {
            await api.patch(`/events/${id}/toggle`);
            setCustomEvents(prev => prev.map(e => e._id === id ? { ...e, completed: !current } : e));
        } catch (err) { console.error(err); }
    };

    const eventMap = useMemo(() => buildEventMap(goals, customEvents), [goals, customEvents]);
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const cells = useMemo(() => {
        const arr = [];
        for (let i = 0; i < firstDay; i++) arr.push(null);
        for (let d = 1; d <= daysInMonth; d++) arr.push(d);
        while (arr.length % 7 !== 0) arr.push(null);
        return arr;
    }, [firstDay, daysInMonth]);

    const prevMonth = useCallback(() => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); }, [month]);
    const nextMonth = useCallback(() => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); }, [month]);
    const todayStr = useMemo(() => toYMD(today), [today]);

    const { allEvents, doneMs, overdueMs, thisMonthEvents } = useMemo(() => {
        const events = Object.values(eventMap).flat();
        const done = events.filter(e => e.completed).length;
        const overdue = events.filter(e => {
            if (e.completed) return false;
            const dateKey = Object.keys(eventMap).find(k => eventMap[k].includes(e));
            return dateKey && new Date(dateKey) < today;
        }).length;
        const thisMonth = Object.entries(eventMap)
            .filter(([k]) => { const d = new Date(k); return d.getFullYear() === year && d.getMonth() === month; })
            .flatMap(([,v]) => v);
        return { allEvents: events, doneMs: done, overdueMs: overdue, thisMonthEvents: thisMonth };
    }, [eventMap, today, year, month]);

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 mobile-page-pad">
            <Helmet><title>Calendar | Life OS</title></Helmet>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Calendar</h1>
                    <p className="text-zinc-500 mt-1">Your events, habits & milestone due dates.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setAddingFor(new Date())} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all active:scale-95">
                        <Plus className="w-4 h-4" /> Add Event
                    </button>
                    <Link to="/goals" className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-all">
                        <Target className="w-4 h-4 text-indigo-400" />Manage Goals
                    </Link>
                </div>
            </div>

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

            <div className="flex flex-col lg:flex-row gap-5">
                <div className="flex-1 bg-zinc-900/60 border border-white/5 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                        <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-zinc-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></button>
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-white">{MONTHS[month]}</h2>
                            <p className="text-zinc-500 text-sm">{year}</p>
                        </div>
                        <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-zinc-400 hover:text-white"><ChevronRight className="w-5 h-5" /></button>
                    </div>
                    <div className="grid grid-cols-7 border-b border-white/5">
                        {WEEKDAYS.map(d => <div key={d} className="py-3 text-center text-xs font-semibold text-zinc-600 uppercase tracking-wider">{d}</div>)}
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
                    ) : (
                        <div className="grid grid-cols-7">
                            {cells.map((day, i) => {
                                if (!day) return <div key={`e-${i}`} className="h-16 md:h-20 border-b border-r border-white/[0.03]" />;
                                const dateKey = `${year}-${pad(month+1)}-${pad(day)}`;
                                const dayEvents = eventMap[dateKey] || [];
                                const isToday = dateKey === todayStr;
                                const isSelected = selected && toYMD(selected) === dateKey;
                                const hasDue = dayEvents.some(e => !e.completed);
                                const allDone = dayEvents.length > 0 && dayEvents.every(e => e.completed);
                                return (
                                    <motion.div key={day} whileHover={{ scale: 1.02 }}
                                        onClick={() => setSelected(new Date(year, month, day))}
                                        className={`h-16 md:h-20 p-1.5 border-b border-r border-white/[0.03] cursor-pointer transition-all relative ${isSelected ? 'bg-indigo-500/15 border-indigo-500/20' : hasDue ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-800/30'}`}>
                                        <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mb-1 ${isToday ? 'bg-indigo-500 text-white' : isSelected ? 'text-indigo-400' : 'text-zinc-400'}`}>{day}</div>
                                        {dayEvents.length > 0 && (
                                            <div className="flex flex-wrap gap-0.5 px-0.5">
                                                {dayEvents.slice(0,4).map((e,idx) => (
                                                    <div key={idx} className={`w-2.5 h-2.5 rounded-full border ${e.completed ? 'opacity-50' : 'opacity-100'}`} style={{ background: e.color, borderColor: `${e.color}60` }} />
                                                ))}
                                                {dayEvents.length > 4 && <span className="text-[8px] text-zinc-500 leading-none mt-0.5">+{dayEvents.length-4}</span>}
                                            </div>
                                        )}
                                        {allDone && <div className="absolute bottom-1 right-1"><CheckCircle2 className="w-3 h-3 text-emerald-400 opacity-70" /></div>}
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                    <div className="px-5 py-3 border-t border-white/5 flex items-center gap-4 flex-wrap">
                        <span className="text-xs text-zinc-600 font-medium uppercase tracking-wider">Legend:</span>
                        {Object.entries(CATEGORY_COLORS).slice(0,7).map(([cat, color]) => (
                            <div key={cat} className="flex items-center gap-1">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                                <span className="text-[10px] text-zinc-500 capitalize">{cat}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:w-80">
                    <AnimatePresence mode="wait">
                        {selected ? (
                            <DayPanel key={toYMD(selected)} date={selected} events={eventMap[toYMD(selected)] || []}
                                onClose={() => setSelected(null)} onAddEvent={setAddingFor} onToggleEvent={handleToggleEvent} />
                        ) : (
                            <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }}
                                className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 text-center h-64 flex flex-col items-center justify-center">
                                <Calendar className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                                <p className="text-zinc-500 text-sm">Click a day to see events</p>
                                <p className="text-zinc-600 text-xs mt-1">Colored dots = events & milestones</p>
                                <button onClick={() => setAddingFor(new Date())} className="mt-4 text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors mx-auto">
                                    <Plus className="w-3 h-3" /> Add event for today
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <UpcomingPanel goals={goals} customEvents={customEvents} />
                </div>
            </div>

            <AnimatePresence>
                {addingFor && <AddEventModal date={addingFor} onClose={() => setAddingFor(null)} onSaved={fetchEvents} />}
            </AnimatePresence>
        </div>
    );
}

function UpcomingPanel({ goals, customEvents }) {
    const now = new Date(); now.setHours(0,0,0,0);
    const upcoming = [];
    goals.forEach(goal => {
        goal.milestones?.forEach(ms => {
            if (!ms.dueDate || ms.completed) return;
            const d = new Date(ms.dueDate); d.setHours(0,0,0,0);
            const diff = Math.ceil((d - now) / 86400000);
            upcoming.push({ text: ms.text, subtitle: `🎯 ${goal.title}`, color: CATEGORY_COLORS[goal.category] || '#6366f1', diff });
        });
    });
    customEvents.forEach(ev => {
        if (ev.completed) return;
        const d = new Date(ev.startDate); d.setHours(0,0,0,0);
        const diff = Math.ceil((d - now) / 86400000);
        if (diff >= 0 && diff <= 30) upcoming.push({ text: ev.title, subtitle: ev.category, color: CATEGORY_COLORS[ev.category] || '#6366f1', diff });
    });
    upcoming.sort((a,b) => a.diff - b.diff);
    const slice = upcoming.slice(0, 8);
    if (slice.length === 0) return null;
    return (
        <div className="mt-4 bg-zinc-900/60 border border-white/5 rounded-2xl p-5">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Upcoming</p>
            <div className="space-y-2">
                {slice.map((item, i) => {
                    const isOverdue = item.diff < 0, isToday = item.diff === 0, isSoon = item.diff < 3 && item.diff >= 0;
                    return (
                        <div key={i} className="flex items-start gap-3">
                            <div className="w-1 rounded-full shrink-0 mt-1" style={{ background: item.color, height: 32 }} />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-white font-medium truncate">{item.text}</p>
                                <p className="text-[10px] text-zinc-500 truncate">{item.subtitle}</p>
                            </div>
                            <span className={`text-[10px] font-bold shrink-0 px-1.5 py-0.5 rounded-full ${isOverdue ? 'text-rose-400 bg-rose-400/10' : isToday ? 'text-amber-400 bg-amber-400/10' : isSoon ? 'text-orange-400 bg-orange-400/10' : 'text-zinc-500 bg-zinc-700/30'}`}>
                                {isOverdue ? `${Math.abs(item.diff)}d late` : isToday ? 'Today' : `${item.diff}d`}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
