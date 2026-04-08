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

    return (
        <>
            <motion.div layout initial={{ opacity: 0, y: 20, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: .95 }}
                className="relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/60 backdrop-blur-sm hover:border-white/10 transition-all">

                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: cat.color }} />
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.bg} opacity-40 pointer-events-none`} />

                <div className="relative p-4 md:p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="p-2.5 rounded-2xl shrink-0" style={{ background: `${cat.color}20` }}>
                                <CatIcon className="w-5 h-5 md:w-4 md:h-4" style={{ color: cat.color }} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-white text-lg md:text-base truncate tracking-tight">{goal.title}</h3>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${SC[goal.status]}`}>{goal.status}</span>
                                    {tp && <TrackBadge t={tp.pct} a={goal.progress} />}
                                </div>
                            </div>
                        </div>
                        <div className="relative shrink-0 flex items-center justify-center">
                            <ProgressRing pct={goal.progress} color={cat.color} size={window.innerWidth < 768 ? 48 : 56} stroke={window.innerWidth < 768 ? 4 : 5} />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] md:text-xs font-black text-white">{goal.progress}%</span>
                            </div>
                        </div>
                    </div>

                    {goal.description && <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2">{goal.description}</p>}

                    {/* Timeline bar */}
                    {tp && (
                        <div className="bg-black/20 rounded-xl p-3 space-y-2 border border-white/5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-zinc-500 flex items-center gap-1"><Clock className="w-3 h-3" />Time elapsed</span>
                                <span className={`font-semibold ${tp.daysLeft < 0 ? 'text-rose-400' : tp.daysLeft < 7 ? 'text-amber-400' : 'text-zinc-300'}`}>
                                    {tp.daysLeft > 0 ? `${tp.daysLeft}d left` : tp.daysLeft === 0 ? 'Due today!' : `${Math.abs(tp.daysLeft)}d overdue`}
                                </span>
                            </div>
                            <Bar pct={tp.pct}       color="rgba(255,255,255,0.15)" />
                            <Bar pct={goal.progress} color={cat.color} />
                            <div className="flex justify-between text-[10px] text-zinc-600">
                                <span>{tp.pct}% time used</span>
                                <span style={{ color: cat.color }}>{goal.progress}% done</span>
                            </div>
                        </div>
                    )}

                    {/* Step dots */}
                    {goal.milestones.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
                                <span className="font-medium uppercase tracking-wider">Steps</span>
                                <span style={{ color: cat.color }} className="font-semibold">{done}/{goal.milestones.length} done</span>
                            </div>
                            <div className="flex gap-1.5 flex-wrap">
                                {goal.milestones.map((m, i) => (
                                    <div key={m._id} title={`Step ${i + 1}: ${m.text}`} className="relative group cursor-pointer" onClick={() => setActMs(m)}>
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all hover:scale-110"
                                            style={m.completed
                                                ? { background: `${cat.color}30`, borderColor: cat.color, color: cat.color }
                                                : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: '#71717a' }}>
                                            {m.completed ? '✓' : i + 1}
                                        </div>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-[10px] text-zinc-200 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 max-w-[160px] text-center">
                                            <p className="truncate">{m.text}</p>
                                            {m.dueDate && <p className="text-zinc-500">{fmtDate(m.dueDate)}</p>}
                                            <p className="text-indigo-400">Click to log</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="relative h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                                <motion.div className="absolute left-0 top-0 h-full rounded-full" style={{ background: cat.color }}
                                    animate={{ width: `${goal.milestones.length > 0 ? (done / goal.milestones.length) * 100 : 0}%` }} transition={{ duration: .6 }} />
                            </div>
                        </div>
                    )}

                    {goal.milestones.length === 0 && (
                        <div>
                            <Bar pct={goal.progress} color={cat.color} />
                            <input type="range" min="0" max="100" value={goal.progress} onChange={e => setProgress(Number(e.target.value))}
                                className="w-full mt-2 h-1 cursor-pointer" style={{ accentColor: cat.color }} />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                        <button onClick={() => setExpanded(!expanded)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 md:py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl transition-all">
                            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            {expanded ? 'Hide' : 'Progress'}
                        </button>
                        <button onClick={() => onEdit(goal)} className="p-3 md:p-1.5 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all border border-zinc-800">
                            <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(goal)} className="p-3 md:p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-zinc-800">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Expanded timeline */}
                    <AnimatePresence>
                        {expanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: .25 }} className="overflow-hidden">
                                <div className="pt-4 border-t border-white/5 space-y-5">
                                    {/* Status pills */}
                                    <div>
                                        <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">Status</p>
                                        <div className="flex gap-2 flex-wrap">
                                            {['active', 'paused', 'completed', 'archived'].map(s => (
                                                <button key={s} onClick={() => setStatus(s)}
                                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${goal.status === s ? SC[s] : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}>
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Step-by-step timeline */}
                                    {goal.milestones.length > 0 && (
                                        <div>
                                            <p className="text-xs text-zinc-500 mb-3 font-medium uppercase tracking-wider flex items-center gap-1.5">
                                                <Zap className="w-3 h-3" />Step-by-step Timeline
                                                <span className="text-zinc-600 normal-case tracking-normal ml-1">(click to log activity)</span>
                                            </p>
                                            <div>
                                                {goal.milestones.map((m, i) => {
                                                    const isLast = i === goal.milestones.length - 1;
                                                    const isNext = !m.completed && (i === 0 || goal.milestones[i - 1]?.completed);
                                                    const dl     = m.dueDate ? Math.ceil((new Date(m.dueDate) - Date.now()) / 864e5) : null;
                                                    return (
                                                        <div key={m._id} className="flex gap-3">
                                                            <div className="flex flex-col items-center" style={{ minWidth: 28 }}>
                                                                <button onClick={() => toggleMs(m._id)} className="shrink-0 hover:scale-110 transition-transform focus:outline-none">
                                                                    {m.completed
                                                                        ? <CheckCircle2 className="w-5 h-5" style={{ color: cat.color }} />
                                                                        : <Circle className={`w-5 h-5 ${isNext ? 'text-zinc-400' : 'text-zinc-700'}`} />}
                                                                </button>
                                                                {!isLast && <div className="w-px flex-1 mt-0.5 mb-0.5"
                                                                    style={{ background: m.completed ? `${cat.color}60` : 'rgba(255,255,255,0.07)', minHeight: 20 }} />}
                                                            </div>
                                                            <div className="pb-4 flex-1 cursor-pointer group" onClick={() => setActMs(m)}>
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <span className={`text-xs font-semibold ${m.completed ? 'text-zinc-600' : isNext ? 'text-white' : 'text-zinc-500'}`}>Step {i + 1}</span>
                                                                    {isNext && !m.completed && <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 border border-amber-500/20 rounded-full px-1.5 py-0.5 uppercase">Next</span>}
                                                                    {m.notes && <span className="text-[9px] text-indigo-400 bg-indigo-400/10 border border-indigo-500/20 rounded-full px-1.5 py-0.5">📝 logged</span>}
                                                                    <span className="ml-auto text-[10px] text-zinc-600 group-hover:text-indigo-400 transition-colors">Log →</span>
                                                                </div>
                                                                <p className={`text-sm leading-relaxed ${m.completed ? 'line-through text-zinc-600' : isNext ? 'text-zinc-200' : 'text-zinc-500'}`}>{m.text}</p>
                                                                {m.dueDate && (
                                                                    <p className={`text-xs mt-1 flex items-center gap-1 ${dl !== null && dl < 0 && !m.completed ? 'text-rose-400' : dl !== null && dl < 3 && !m.completed ? 'text-amber-400' : 'text-zinc-600'}`}>
                                                                        <Calendar className="w-3 h-3" />
                                                                        {m.completed ? `Done · ${fmtDate(m.completedAt)}` : fmtDate(m.dueDate)}
                                                                        {!m.completed && dl !== null && <span className="ml-1">{dl > 0 ? `(${dl}d left)` : dl === 0 ? '(today)' : `(${Math.abs(dl)}d overdue)`}</span>}
                                                                    </p>
                                                                )}
                                                                {m.notes && <p className="text-xs text-zinc-500 mt-1 italic bg-white/[0.03] rounded-lg px-3 py-1.5 border border-white/5 line-clamp-2">"{m.notes}"</p>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Add step inline */}
                                    <div>
                                        <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">Add a step</p>
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <input value={newMs} onChange={e => setNewMs(e.target.value)} onKeyDown={e => e.key === 'Enter' && addMs()}
                                                    placeholder="Next step…"
                                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all" />
                                                <button onClick={addMs} disabled={msLoad}
                                                    className="px-3 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-50">Add</button>
                                            </div>
                                            <input type="date" value={newMsDate} onChange={e => setNewMsDate(e.target.value)}
                                                className="w-full bg-white/3 border border-white/8 rounded-lg px-3 py-1.5 text-zinc-500 text-xs focus:outline-none transition-all" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            <AnimatePresence>
                {actMs && (
                    <ActivityModal milestone={actMs} goalId={goal._id} catColor={cat.color}
                        onClose={() => setActMs(null)}
                        onSave={r => { onUpdate(r); setActMs(null); }} />
                )}
            </AnimatePresence>
        </>
    );
}
