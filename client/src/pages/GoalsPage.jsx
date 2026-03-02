import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/axios';
import {
    Target, Plus, Trash2, CheckCircle2, Circle, ChevronDown, ChevronUp,
    X, Calendar, Sparkles, Flag, Briefcase, BookOpen, Heart, DollarSign,
    Users, Star, Edit3, Save, AlertCircle
} from 'lucide-react';

const CATEGORIES = [
    { value: 'health', label: 'Health', icon: Heart, color: '#f43f5e', bg: 'from-rose-500/20 to-pink-500/10' },
    { value: 'career', label: 'Career', icon: Briefcase, color: '#f59e0b', bg: 'from-amber-500/20 to-yellow-500/10' },
    { value: 'learning', label: 'Learning', icon: BookOpen, color: '#8b5cf6', bg: 'from-violet-500/20 to-purple-500/10' },
    { value: 'finance', label: 'Finance', icon: DollarSign, color: '#10b981', bg: 'from-emerald-500/20 to-green-500/10' },
    { value: 'relationships', label: 'Social', icon: Users, color: '#3b82f6', bg: 'from-blue-500/20 to-cyan-500/10' },
    { value: 'personal', label: 'Personal', icon: Star, color: '#6366f1', bg: 'from-indigo-500/20 to-violet-500/10' },
    { value: 'other', label: 'Other', icon: Flag, color: '#71717a', bg: 'from-zinc-500/20 to-zinc-600/10' },
];

const getCat = (v) => CATEGORIES.find(c => c.value === v) || CATEGORIES[5];

function ProgressRing({ pct, color, size = 56, stroke = 5 }) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    return (
        <svg width={size} height={size} className="rotate-[-90deg]">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
            <circle
                cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={color} strokeWidth={stroke}
                strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.7s ease' }}
            />
        </svg>
    );
}

function GoalCard({ goal, onDelete, onUpdate }) {
    const [expanded, setExpanded] = useState(false);
    const [editing, setEditing] = useState(false);
    const [newMilestone, setNewMilestone] = useState('');
    const [loading, setLoading] = useState(false);
    const cat = getCat(goal.category);
    const CatIcon = cat.icon;

    const daysLeft = goal.targetDate
        ? Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24))
        : null;

    const toggleMilestone = async (milestoneId) => {
        try {
            const res = await api.patch(`/goals/${goal._id}/milestone/${milestoneId}`);
            onUpdate(res.data);
        } catch (e) { console.error(e); }
    };

    const addMilestone = async () => {
        if (!newMilestone.trim()) return;
        setLoading(true);
        try {
            const res = await api.patch(`/goals/${goal._id}/milestone`, { text: newMilestone });
            onUpdate(res.data);
            setNewMilestone('');
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const updateProgress = async (val) => {
        try {
            const res = await api.put(`/goals/${goal._id}`, { progress: val });
            onUpdate(res.data);
        } catch (e) { console.error(e); }
    };

    const updateStatus = async (status) => {
        try {
            const res = await api.put(`/goals/${goal._id}`, { status });
            onUpdate(res.data);
        } catch (e) { console.error(e); }
    };

    const statusColors = {
        active: 'text-emerald-400 bg-emerald-400/10 border-emerald-500/30',
        completed: 'text-indigo-400 bg-indigo-400/10 border-indigo-500/30',
        paused: 'text-amber-400 bg-amber-400/10 border-amber-500/30',
        archived: 'text-zinc-400 bg-zinc-400/10 border-zinc-500/30',
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/60 backdrop-blur-sm hover:border-white/10 transition-all"
        >
            {/* Category accent line */}
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: cat.color }} />

            <div className={`absolute inset-0 bg-gradient-to-br ${cat.bg} opacity-40 pointer-events-none`} />

            <div className="relative p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded-xl shrink-0" style={{ background: `${cat.color}20` }}>
                            <CatIcon className="w-4 h-4" style={{ color: cat.color }} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-white text-base truncate">{goal.title}</h3>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColors[goal.status]}`}>
                                {goal.status}
                            </span>
                        </div>
                    </div>
                    <div className="relative ml-2 shrink-0">
                        <ProgressRing pct={goal.progress} color={cat.color} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">{goal.progress}%</span>
                        </div>
                    </div>
                </div>

                {goal.description && (
                    <p className="text-zinc-400 text-sm mb-4 leading-relaxed line-clamp-2">{goal.description}</p>
                )}

                {/* Meta */}
                <div className="flex items-center gap-3 mb-4 text-xs text-zinc-500">
                    {daysLeft !== null && (
                        <span className={`flex items-center gap-1 ${daysLeft < 7 ? 'text-rose-400' : daysLeft < 30 ? 'text-amber-400' : 'text-zinc-500'}`}>
                            <Calendar className="w-3 h-3" />
                            {daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? 'Due today' : `${Math.abs(daysLeft)}d overdue`}
                        </span>
                    )}
                    {goal.milestones.length > 0 && (
                        <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {goal.milestones.filter(m => m.completed).length}/{goal.milestones.length} steps
                        </span>
                    )}
                </div>

                {/* Progress bar (manual, only if no milestones) */}
                {goal.milestones.length === 0 && (
                    <div className="mb-4">
                        <div className="w-full bg-white/5 rounded-full h-1.5 mb-1">
                            <div className="h-1.5 rounded-full transition-all" style={{ width: `${goal.progress}%`, background: cat.color }} />
                        </div>
                        <input
                            type="range" min="0" max="100" value={goal.progress}
                            onChange={e => updateProgress(Number(e.target.value))}
                            className="w-full accent-indigo-500 h-1 cursor-pointer"
                        />
                    </div>
                )}

                {/* Actions row */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                    >
                        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {expanded ? 'Less' : 'Milestones & Actions'}
                    </button>
                    <button onClick={() => onDelete(goal._id)} className="p-1.5 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Expanded section */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="pt-4 border-t border-white/5 mt-4 space-y-4">
                                {/* Status control */}
                                <div>
                                    <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">Status</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {['active', 'paused', 'completed', 'archived'].map(s => (
                                            <button key={s} onClick={() => updateStatus(s)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${goal.status === s ? statusColors[s] : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}>
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Milestones */}
                                <div>
                                    <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">Milestones</p>
                                    <div className="space-y-2">
                                        {goal.milestones.map(m => (
                                            <div key={m._id} onClick={() => toggleMilestone(m._id)}
                                                className="flex items-center gap-2 cursor-pointer group">
                                                {m.completed
                                                    ? <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: cat.color }} />
                                                    : <Circle className="w-4 h-4 shrink-0 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                                                }
                                                <span className={`text-sm transition-all ${m.completed ? 'line-through text-zinc-500' : 'text-zinc-300'}`}>{m.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Add milestone */}
                                    <div className="flex gap-2 mt-3">
                                        <input value={newMilestone} onChange={e => setNewMilestone(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && addMilestone()}
                                            placeholder="Add milestone..."
                                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                                        />
                                        <button onClick={addMilestone} disabled={loading}
                                            className="px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-50">
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

function CreateGoalModal({ onClose, onCreate }) {
    const [form, setForm] = useState({
        title: '', description: '', category: 'personal', targetDate: '', color: '#6366f1'
    });
    const [milestones, setMilestones] = useState(['']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) { setError('Title is required'); return; }
        setLoading(true);
        try {
            const payload = {
                ...form,
                color: getCat(form.category).color,
                milestones: milestones.filter(m => m.trim())
            };
            const res = await api.post('/goals', payload);
            onCreate(res.data);
            onClose();
        } catch (err) {
            setError('Failed to create goal. Try again.');
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-zinc-900 border border-zinc-700/50 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-900 z-10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Target className="w-5 h-5 text-indigo-400" /> New Goal
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-zinc-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />{error}
                    </div>}

                    <div>
                        <label className="text-sm font-medium text-zinc-400 block mb-1.5">Title *</label>
                        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                            placeholder="e.g. Run a 5K marathon"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all" />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-zinc-400 block mb-1.5">Description</label>
                        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                            rows={3} placeholder="What does success look like?"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all resize-none" />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-zinc-400 block mb-2">Category</label>
                        <div className="grid grid-cols-4 gap-2">
                            {CATEGORIES.map(cat => {
                                const CatIcon = cat.icon;
                                return (
                                    <button key={cat.value} type="button" onClick={() => setForm({ ...form, category: cat.value })}
                                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${form.category === cat.value ? 'border-indigo-500 bg-indigo-500/15 text-white' : 'border-zinc-700 text-zinc-500 hover:border-zinc-600'}`}>
                                        <CatIcon className="w-4 h-4" style={{ color: form.category === cat.value ? cat.color : undefined }} />
                                        <span className="text-[10px] font-medium">{cat.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-zinc-400 block mb-1.5">Target Date (optional)</label>
                        <input type="date" value={form.targetDate} onChange={e => setForm({ ...form, targetDate: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all" />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-zinc-400 block mb-2">Milestones (optional)</label>
                        <div className="space-y-2">
                            {milestones.map((m, i) => (
                                <div key={i} className="flex gap-2">
                                    <input value={m} onChange={e => { const n = [...milestones]; n[i] = e.target.value; setMilestones(n); }}
                                        placeholder={`Step ${i + 1}...`}
                                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all" />
                                    {milestones.length > 1 && (
                                        <button type="button" onClick={() => setMilestones(milestones.filter((_, idx) => idx !== i))}
                                            className="p-2 text-zinc-600 hover:text-rose-400 transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" onClick={() => setMilestones([...milestones, ''])}
                                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                                <Plus className="w-3 h-3" /> Add step
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20">
                        {loading ? 'Creating...' : '🎯 Create Goal'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}

export default function GoalsPage() {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        try {
            const res = await api.get('/goals');
            setGoals(res.data);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleCreate = (goal) => setGoals([goal, ...goals]);
    const handleUpdate = (updated) => setGoals(goals.map(g => g._id === updated._id ? updated : g));
    const handleDelete = async (id) => {
        if (!confirm('Delete this goal?')) return;
        try {
            await api.delete(`/goals/${id}`);
            setGoals(goals.filter(g => g._id !== id));
        } catch (e) { console.error(e); }
    };

    const filterOptions = [
        { value: 'all', label: 'All' },
        { value: 'active', label: '🔥 Active' },
        { value: 'completed', label: '✅ Completed' },
        { value: 'paused', label: '⏸ Paused' },
    ];

    const filtered = filter === 'all' ? goals : goals.filter(g => g.status === filter);

    const totalActive = goals.filter(g => g.status === 'active').length;
    const totalCompleted = goals.filter(g => g.status === 'completed').length;
    const avgProgress = goals.length > 0 ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            <Helmet><title>Goals | Life OS</title></Helmet>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Goals
                    </h1>
                    <p className="text-zinc-500 mt-1">Set intentions, track milestones, achieve more.</p>
                </div>
                <button onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20">
                    <Plus className="w-4 h-4" /> New Goal
                </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Active', value: totalActive, color: 'text-emerald-400' },
                    { label: 'Completed', value: totalCompleted, color: 'text-indigo-400' },
                    { label: 'Avg Progress', value: `${avgProgress}%`, color: 'text-purple-400' },
                ].map(stat => (
                    <div key={stat.label} className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 text-center">
                        <div className={`text-2xl md:text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {filterOptions.map(f => (
                    <button key={f.value} onClick={() => setFilter(f.value)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${filter === f.value ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-zinc-500 hover:text-zinc-300 bg-zinc-900/50 border border-zinc-800'}`}>
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Goals grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl">
                    <Target className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-400 font-medium">No goals yet</p>
                    <p className="text-zinc-600 text-sm mt-1">Set your first goal to start tracking your progress</p>
                    <button onClick={() => setShowCreate(true)}
                        className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all">
                        Create Goal
                    </button>
                </div>
            ) : (
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    <AnimatePresence>
                        {filtered.map(goal => (
                            <GoalCard key={goal._id} goal={goal} onDelete={handleDelete} onUpdate={handleUpdate} />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Create Modal */}
            <AnimatePresence>
                {showCreate && <CreateGoalModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
            </AnimatePresence>
        </div>
    );
}
