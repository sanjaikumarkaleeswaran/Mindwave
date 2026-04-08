import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Edit3, Trash2, ChevronDown, ChevronUp,
    CheckCircle2, Circle, Clock, Calendar,
    Zap, Plus,
} from 'lucide-react';
import api from '../../lib/axios';
import ActivityModal from './ActivityModal';
import { getCat, timeProg, fmtDate, ProgressRing, Bar, TrackBadge } from './goalHelpers.jsx';

export default function GoalCard({ goal, onDelete, onUpdate, onEdit }) {
    const [expanded,  setExpanded]  = useState(false);
    const [actMs,     setActMs]     = useState(null);
    const [newMs,     setNewMs]     = useState('');
    const [newMsDate, setNewMsDate] = useState('');
    const [msLoad,    setMsLoad]    = useState(false);

    const cat     = getCat(goal.category);
    const CatIcon = cat.icon;
    const tp      = timeProg(goal.createdAt, goal.targetDate);
    const done    = goal.milestones.filter(m => m.completed).length;

    const SC = {
        active:    'text-emerald-400 bg-emerald-400/10 border-emerald-500/30',
        completed: 'text-indigo-400 bg-indigo-400/10 border-indigo-500/30',
        paused:    'text-amber-400 bg-amber-400/10 border-amber-500/30',
        archived:  'text-zinc-400 bg-zinc-400/10 border-zinc-500/30',
    };

    const toggleMs    = async id => {
        if (!id || id === 'undefined') return;
        try { const r = await api.patch(`/goals/${goal._id}/milestone/${id}`); onUpdate(r.data); } catch (e) { console.error(e); }
    };
    const addMs       = async () => {
        if (!newMs.trim()) return; setMsLoad(true);
        try { const r = await api.patch(`/goals/${goal._id}/milestone`, { text: newMs, dueDate: newMsDate || undefined }); onUpdate(r.data); setNewMs(''); setNewMsDate(''); }
        catch (e) { console.error(e); } finally { setMsLoad(false); }
    };
    const setStatus   = async s => { try { const r = await api.put(`/goals/${goal._id}`, { status: s });   onUpdate(r.data); } catch (e) { console.error(e); } };
    const setProgress = async v => { try { const r = await api.put(`/goals/${goal._id}`, { progress: v }); onUpdate(r.data); } catch (e) { console.error(e); } };

    const isDone = goal.status === 'completed' || goal.progress === 100;

    return (
        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className={`relative overflow-hidden rounded-[2rem] border transition-all duration-300 transform active:scale-[0.98] shadow-xl ${
                isDone 
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-400/50 shadow-indigo-500/25' 
                    : 'bg-zinc-900 border-zinc-800'
            }`}>
                {/* Background glow when done */}
                {isDone && (
                    <>
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />
                    </>
                )}

                <div className="relative p-5">
                    {/* Header: Icon + Title + Status */}
                    <div className="flex items-center gap-4 mb-5 relative z-10">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-inner transition-all duration-300 ${
                            isDone ? 'bg-white/20 scale-110 shadow-white/30' : 'bg-zinc-800'
                        }`}>
                            <CatIcon className={`w-7 h-7 ${isDone ? 'text-white' : ''}`} style={{ color: isDone ? undefined : cat.color }} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className={`font-black text-xl tracking-tight leading-tight truncate ${isDone ? 'text-white' : 'text-zinc-100'}`}>{goal.title}</h3>
                            <div className="flex items-center gap-2 mt-1.5 font-bold">
                                <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-md border ${isDone ? 'bg-white/10 border-white/20 text-white' : SC[goal.status]}`}>
                                    {goal.status}
                                </span>
                                {tp && !isDone && <TrackBadge t={tp.pct} a={goal.progress} />}
                            </div>
                        </div>
                    </div>

                    {/* Step Tracker (Habit Circular Style) */}
                    {goal.milestones.length > 0 && (
                        <div className="flex justify-between items-center relative z-10 bg-black/10 rounded-2xl p-3 border border-white/5 mb-5">
                            <div className="flex gap-2.5 overflow-x-auto hide-scrollbar -mx-1 px-1">
                                {goal.milestones.map((m, i) => {
                                    const mDone = m.completed;
                                    return (
                                        <div key={m._id} className="flex flex-col items-center gap-1.5 shrink-0">
                                            <span className={`text-[8px] font-black uppercase tracking-widest ${isDone ? 'text-indigo-200' : 'text-zinc-500'}`}>
                                                ST{i + 1}
                                            </span>
                                            <div onClick={() => !isDone && toggleMs(m._id)} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                                                mDone 
                                                    ? (isDone ? 'bg-white text-indigo-600 shadow-sm' : 'bg-indigo-500 text-white') 
                                                    : (isDone ? 'bg-black/10 text-transparent' : 'bg-zinc-800 text-transparent')
                                            }`}>
                                                {mDone && <CheckCircle2 className="w-4 h-4" strokeWidth={3} />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Progress Stats Row */}
                    <div className="flex items-center justify-between mb-5 px-1 relative z-10">
                        <div className="flex-1">
                            <div className={`text-[10px] uppercase font-black tracking-widest ${isDone ? 'text-indigo-100' : 'text-zinc-500'}`}>Current Progress</div>
                            <div className={`text-2xl font-black tabular-nums ${isDone ? 'text-white' : 'text-indigo-400'}`}>{goal.progress}%</div>
                        </div>
                        <div className="relative shrink-0 flex items-center justify-center">
                            <ProgressRing pct={goal.progress} color={isDone ? '#fff' : cat.color} size={48} stroke={4} />
                            <div className={`absolute inset-0 flex items-center justify-center text-[10px] font-black ${isDone ? 'text-white' : 'text-zinc-500'}`}>
                                {goal.progress}%
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center gap-2 relative z-10">
                        <button onClick={() => setExpanded(!expanded)} className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg ${
                            isDone ? 'bg-white text-indigo-600 hover:bg-white/90' : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700/50'
                        }`}>
                            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            {expanded ? 'Collapse' : 'Manage Goal'}
                        </button>
                    </div>

                    {/* Expanded Detail View */}
                    <AnimatePresence>
                        {expanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden relative z-10">
                                <div className="pt-6 space-y-6">
                                    {goal.description && (
                                        <div className="space-y-2">
                                            <div className={`text-[10px] font-black uppercase tracking-widest ${isDone ? 'text-indigo-100' : 'text-zinc-500'}`}>Mission</div>
                                            <p className={`text-sm leading-relaxed ${isDone ? 'text-white/80' : 'text-zinc-300'}`}>{goal.description}</p>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <div className={`text-[10px] font-black uppercase tracking-widest ${isDone ? 'text-indigo-100' : 'text-zinc-500'}`}>Journey Map</div>
                                        <div className="space-y-2">
                                            {goal.milestones.map((m, i) => (
                                                <div key={m._id} onClick={() => setActMs(m)} className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all active:scale-[0.98] ${
                                                    m.completed 
                                                        ? (isDone ? 'bg-white/10 border-white/20' : 'bg-indigo-500/10 border-indigo-500/20') 
                                                        : 'bg-black/10 border-transparent'
                                                }`}>
                                                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                                                        m.completed ? (isDone ? 'text-white' : 'text-indigo-400') : 'text-zinc-600'
                                                    }`}>
                                                        {m.completed ? <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className={`text-sm font-bold tracking-tight ${m.completed ? (isDone ? 'text-white' : 'text-zinc-200 line-through opacity-60') : 'text-zinc-400'}`}>{m.text}</div>
                                                        {m.dueDate && <div className={`text-[9px] uppercase font-black mt-1 ${isDone ? 'text-white/40' : 'text-zinc-600'}`}>TARGET: {fmtDate(m.dueDate)}</div>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action row */}
                                    <div className="flex gap-2 pt-2 pb-1">
                                        <button onClick={() => onEdit(goal)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${isDone ? 'bg-white/10 border-white/20 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-indigo-400'}`}>
                                            <Edit3 className="w-3.5 h-3.5" /> Edit
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); onDelete(goal); }} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${isDone ? 'bg-white/10 border-white/20 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-rose-400'}`}>
                                            <Trash2 className="w-3.5 h-3.5" /> Delete
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <AnimatePresence>
                {actMs && (
                    <ActivityModal milestone={actMs} goalId={goal._id} catColor={isDone ? '#6366f1' : cat.color}
                        onClose={() => setActMs(null)}
                        onSave={r => { onUpdate(r); setActMs(null); }} />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
