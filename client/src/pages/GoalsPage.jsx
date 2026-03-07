import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import {
    Target, Plus, Trash2, CheckCircle2, Circle, ChevronDown, ChevronUp,
    X, Calendar, Flag, Briefcase, BookOpen, Heart, DollarSign,
    Users, Star, Edit3, AlertCircle, PenLine, TrendingUp,
    TrendingDown, Minus, Clock, Zap, Sparkles, FileText, Send, Bot
} from 'lucide-react';

/* ── constants ── */
const CATEGORIES = [
    { value: 'health', label: 'Health', icon: Heart, color: '#f43f5e', bg: 'from-rose-500/20 to-pink-500/10' },
    { value: 'career', label: 'Career', icon: Briefcase, color: '#f59e0b', bg: 'from-amber-500/20 to-yellow-500/10' },
    { value: 'learning', label: 'Learning', icon: BookOpen, color: '#8b5cf6', bg: 'from-violet-500/20 to-purple-500/10' },
    { value: 'finance', label: 'Finance', icon: DollarSign, color: '#10b981', bg: 'from-emerald-500/20 to-green-500/10' },
    { value: 'relationships', label: 'Social', icon: Users, color: '#3b82f6', bg: 'from-blue-500/20 to-cyan-500/10' },
    { value: 'personal', label: 'Personal', icon: Star, color: '#6366f1', bg: 'from-indigo-500/20 to-violet-500/10' },
    { value: 'other', label: 'Other', icon: Flag, color: '#71717a', bg: 'from-zinc-500/20 to-zinc-600/10' },
];
const getCat = v => CATEGORIES.find(c => c.value === v) || CATEGORIES[5];
const toInput = d => { try { return d ? new Date(d).toISOString().split('T')[0] : ''; } catch { return ''; } };
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

/* ── tiny helpers ── */
function ProgressRing({ pct, color, size = 60, stroke = 5 }) {
    const r = (size - stroke) / 2, circ = 2 * Math.PI * r, dash = (pct / 100) * circ;
    return (
        <svg width={size} height={size} className="rotate-[-90deg]">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray .8s ease' }} />
        </svg>
    );
}
function Bar({ pct, color }) {
    return (
        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ background: color }}
                initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: .8, ease: 'easeOut' }} />
        </div>
    );
}
function TrackBadge({ t, a }) {
    const d = a - t;
    if (d >= 5) return <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-500/30 rounded-full px-2 py-0.5"><TrendingUp className="w-2.5 h-2.5" />Ahead</span>;
    if (d <= -10) return <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-400 bg-rose-400/10 border border-rose-500/30 rounded-full px-2 py-0.5"><TrendingDown className="w-2.5 h-2.5" />Behind</span>;
    return <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-500/30 rounded-full px-2 py-0.5"><Minus className="w-2.5 h-2.5" />On track</span>;
}
function timeProg(createdAt, targetDate) {
    if (!targetDate) return null;
    const s = new Date(createdAt).getTime(), e = new Date(targetDate).getTime(), n = Date.now();
    if (e <= s) return null;
    return { pct: Math.min(100, Math.max(0, Math.round(((n - s) / (e - s)) * 100))), daysLeft: Math.ceil((e - n) / (864e5)) };
}

/* ══════════════════════════════════════════════════════════════
   AI CHAT GOAL CREATOR — the main new feature
══════════════════════════════════════════════════════════════ */
function AIChatModal({ onClose, onGenerated }) {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        { role: 'ai', text: "Hi! 👋 Tell me about the goal you'd like to achieve. Describe it in your own words — I'll turn it into a structured plan you can edit." }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const bottomRef = useRef(null);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const send = async () => {
        const msg = input.trim();
        if (!msg || loading) return;
        setInput(''); setError('');
        setMessages(p => [...p, { role: 'user', text: msg }]);
        setLoading(true);
        try {
            setMessages(p => [...p, { role: 'ai', text: '⏳ Generating your goal plan…', loading: true }]);
            const res = await api.post('/goals/ai-create', { message: msg });
            const goal = res.data.goal;
            setMessages(p => p.filter(m => !m.loading).concat({
                role: 'ai',
                text: `✅ I've created a goal plan for you!\n\n**${goal.title}**\n${goal.description}\n\n📅 Target: ${fmtDate(goal.targetDate)}\n🗂 Category: ${goal.category}\n📋 ${goal.milestones?.length || 0} steps planned\n\nClick **"Use this goal"** to review and edit, or describe a different goal.`,
                goal,
            }));
        } catch (e) {
            setMessages(p => p.filter(m => !m.loading));
            setError(e?.response?.data?.msg || 'AI failed. Try again.');
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="bg-zinc-900 border border-zinc-700/50 rounded-t-2xl md:rounded-2xl w-full md:max-w-lg h-[85vh] md:h-[600px] flex flex-col shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800 shrink-0">
                    <div className="p-2 bg-indigo-500/15 rounded-xl"><Bot className="w-5 h-5 text-indigo-400" /></div>
                    <div className="flex-1">
                        <h2 className="text-white font-bold text-base">AI Goal Creator</h2>
                        <p className="text-zinc-500 text-xs">Describe your goal — AI builds the plan</p>
                    </div>
                    {/* Pencil — go to main chat if wrong place */}
                    <button
                        onClick={() => { onClose(); navigate('/chat'); }}
                        title="Open main AI Chat instead"
                        className="p-2 hover:bg-indigo-500/15 rounded-full transition-colors group"
                    >
                        <PenLine className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-zinc-400" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {m.role === 'ai' && (
                                <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                                </div>
                            )}
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-zinc-800 border border-zinc-700/50 text-zinc-200 rounded-tl-sm'}`}>
                                {m.loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            {[0, 1, 2].map(j => <div key={j} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />)}
                                        </div>
                                        <span className="text-zinc-400 text-xs">Thinking…</span>
                                    </div>
                                ) : (
                                    <>
                                        <p className="whitespace-pre-wrap">{m.text.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
                                        {m.goal && (
                                            <button onClick={() => { onGenerated(m.goal); onClose(); }}
                                                className="mt-3 w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5">
                                                <Sparkles className="w-3.5 h-3.5" /> Use this goal →
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    {error && (
                        <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-zinc-800 shrink-0">
                    <div className="flex gap-2">
                        <textarea value={input} onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                            placeholder="e.g. I want to learn guitar and perform a song in 3 months…"
                            rows={2}
                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all resize-none placeholder-zinc-600" />
                        <button onClick={send} disabled={loading || !input.trim()}
                            className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-all self-end">
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-zinc-600 text-[10px] mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
                </div>
            </motion.div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   ACTIVITY MODAL
══════════════════════════════════════════════════════════════ */
function ActivityModal({ milestone, goalId, catColor, onClose, onSave }) {
    const [notes, setNotes] = useState(milestone.notes || '');
    const [markDone, setMarkDone] = useState(!milestone.completed);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const save = async () => {
        // Guard: can't patch a milestone that isn't saved to DB yet
        if (!milestone._id || String(milestone._id) === 'undefined') {
            setError('This step is not yet saved. Create the goal first.');
            return;
        }
        setLoading(true); setError('');
        try {
            const res = await api.patch(`/goals/${goalId}/milestone/${milestone._id}`, {
                notes,
                forceComplete: markDone ? true : undefined,
            });
            onSave(res.data);
        } catch { setError('Failed to save. Try again.'); }
        finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={onClose}>
            <motion.div initial={{ scale: .9, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: .9, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 320 }}
                className="bg-zinc-900 border border-zinc-700/50 rounded-2xl w-full max-w-md shadow-2xl"
                onClick={e => e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-3">
                    <div className="p-2 rounded-xl" style={{ background: `${catColor}20` }}>
                        <FileText className="w-4 h-4" style={{ color: catColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Log Activity</p>
                        <h3 className="text-white font-semibold text-sm truncate">{milestone.text}</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-4 h-4 text-zinc-400" />
                    </button>
                </div>

                {milestone.dueDate && (
                    <div className="px-5 pt-3 flex items-center gap-1.5 text-xs text-zinc-500">
                        <Calendar className="w-3.5 h-3.5" style={{ color: catColor }} />
                        Due: <span className="text-zinc-300 font-medium ml-1">{fmtDate(milestone.dueDate)}</span>
                    </div>
                )}

                <div className="px-5 py-4 space-y-4">
                    {error && <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
                    <div>
                        <label className="text-sm font-medium text-zinc-400 block mb-2">📝 What did you do?</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                            placeholder="Describe what you accomplished for this step…"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all resize-none placeholder-zinc-600" />
                    </div>
                    {!milestone.completed && (
                        <label className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setMarkDone(!markDone)}>
                            <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                                style={markDone ? { background: catColor, borderColor: catColor } : { borderColor: '#52525b' }}>
                                {markDone && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-sm text-zinc-300">Mark step as <strong className="text-white">completed</strong></span>
                        </label>
                    )}
                    {milestone.completed && <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-400/10 border border-emerald-500/20 rounded-lg px-3 py-2"><CheckCircle2 className="w-4 h-4" />Already completed</div>}
                </div>

                <div className="px-5 pb-5 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-all">Cancel</button>
                    <button onClick={save} disabled={loading}
                        className="flex-1 py-2.5 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ background: `linear-gradient(135deg,${catColor}cc,${catColor}88)` }}>
                        {loading ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</> : '💾 Save Activity'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   GOAL FORM MODAL (Create / Edit — pre-fill from AI)
══════════════════════════════════════════════════════════════ */
function GoalFormModal({ onClose, onSave, initialData = null }) {
    const navigate = useNavigate();
    // Only treat as edit when the goal already exists in DB (has _id)
    const isEdit = !!(initialData && initialData._id);
    const [form, setForm] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        category: initialData?.category || 'personal',
        targetDate: toInput(initialData?.targetDate),
    });
    const [milestones, setMilestones] = useState(
        initialData?.milestones?.length
            ? initialData.milestones.map(m => ({ text: typeof m === 'string' ? m : m.text, dueDate: toInput(m.dueDate) }))
            : [{ text: '', dueDate: '' }]
    );
    const [aiLoading, setAiLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [aiError, setAiError] = useState('');

    const upMs = (i, f, v) => { const n = [...milestones]; n[i] = { ...n[i], [f]: v }; setMilestones(n); };

    const genAI = async () => {
        if (!form.title.trim()) { setAiError('Enter a title first'); return; }
        setAiLoading(true); setAiError('');
        try {
            const res = await api.post('/goals/ai-milestones', { title: form.title, description: form.description, category: form.category, targetDate: form.targetDate });
            setMilestones(res.data.milestones.map(m => ({ text: m.text, dueDate: m.dueDate || '' })));
        } catch { setAiError('AI failed. Try again.'); }
        finally { setAiLoading(false); }
    };

    const submit = async e => {
        e.preventDefault();
        if (!form.title.trim()) { setError('Title is required'); return; }
        setLoading(true); setError('');
        try {
            const payload = {
                ...form,
                color: getCat(form.category).color,
                milestones: milestones.filter(m => m.text.trim()).map(m => ({ text: m.text, dueDate: m.dueDate || undefined })),
            };
            const res = isEdit ? await api.put(`/goals/${initialData._id}`, payload) : await api.post('/goals', payload);
            onSave(res.data); onClose();
        } catch (err) { setError(err?.response?.data?.msg || 'Failed. Try again.'); }
        finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <motion.div initial={{ scale: .92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: .92, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-zinc-900 border border-zinc-700/50 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={e => e.stopPropagation()}>

                <div className="p-5 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-900 z-10">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        {isEdit ? <><PenLine className="w-5 h-5 text-indigo-400" />Edit Goal</> : <><Target className="w-5 h-5 text-indigo-400" />New Goal</>}
                    </h2>
                    <div className="flex items-center gap-1">
                        <button type="button" onClick={() => { onClose(); navigate('/chat'); }} title="Open AI Chat instead" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <PenLine className="w-5 h-5 text-zinc-500 hover:text-indigo-400" />
                        </button>
                        <button type="button" onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5 text-zinc-400" /></button>
                    </div>
                </div>

                <form onSubmit={submit} className="p-5 space-y-4">
                    {error && <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}

                    <div>
                        <label className="text-sm font-medium text-zinc-400 block mb-1.5">Title *</label>
                        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Run a 5K marathon"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-all" />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-zinc-400 block mb-1.5">Description</label>
                        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                            placeholder="What does success look like?"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-all resize-none" />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-zinc-400 block mb-2">Category</label>
                        <div className="grid grid-cols-4 gap-1.5">
                            {CATEGORIES.map(cat => {
                                const I = cat.icon; return (
                                    <button key={cat.value} type="button" onClick={() => setForm({ ...form, category: cat.value })}
                                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all text-xs ${form.category === cat.value ? 'border-indigo-500 bg-indigo-500/15 text-white' : 'border-zinc-700 text-zinc-500 hover:border-zinc-600'}`}>
                                        <I className="w-4 h-4" style={{ color: form.category === cat.value ? cat.color : undefined }} />
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-zinc-400 block mb-1.5">Target Date</label>
                        <input type="date" value={form.targetDate} onChange={e => setForm({ ...form, targetDate: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-all" />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-zinc-400">Steps / Milestones</label>
                            <button type="button" onClick={genAI} disabled={aiLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-60"
                                style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white' }}>
                                {aiLoading ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating…</> : <><Sparkles className="w-3 h-3" />AI Plan</>}
                            </button>
                        </div>
                        {aiError && <div className="text-amber-400 text-xs mb-2">{aiError}</div>}
                        <div className="space-y-2">
                            {milestones.map((m, i) => (
                                <motion.div key={i} layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 items-start">
                                    <span className="text-zinc-600 text-xs font-bold w-5 shrink-0 text-right mt-2.5">{i + 1}.</span>
                                    <div className="flex-1 space-y-1">
                                        <input value={m.text} onChange={e => upMs(i, 'text', e.target.value)} placeholder={`Step ${i + 1}…`}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all" />
                                        <input type="date" value={m.dueDate} onChange={e => upMs(i, 'dueDate', e.target.value)}
                                            className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-3 py-1.5 text-zinc-400 text-xs focus:outline-none focus:border-indigo-500/50 transition-all" />
                                    </div>
                                    {milestones.length > 1 && <button type="button" onClick={() => setMilestones(milestones.filter((_, j) => j !== i))} className="p-1.5 mt-1.5 text-zinc-600 hover:text-rose-400 transition-colors shrink-0"><X className="w-4 h-4" /></button>}
                                </motion.div>
                            ))}
                            <button type="button" onClick={() => setMilestones([...milestones, { text: '', dueDate: '' }])}
                                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 ml-7 transition-colors">
                                <Plus className="w-3 h-3" />Add step
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{isEdit ? 'Saving…' : 'Creating…'}</> : isEdit ? '💾 Save Changes' : '🎯 Create Goal'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   GOAL CARD
══════════════════════════════════════════════════════════════ */
function GoalCard({ goal, onDelete, onUpdate, onEdit }) {
    const [expanded, setExpanded] = useState(false);
    const [actMs, setActMs] = useState(null);
    const [newMs, setNewMs] = useState('');
    const [newMsDate, setNewMsDate] = useState('');
    const [msLoad, setMsLoad] = useState(false);
    const cat = getCat(goal.category);
    const CatIcon = cat.icon;
    const tp = timeProg(goal.createdAt, goal.targetDate);
    const done = goal.milestones.filter(m => m.completed).length;

    const SC = {
        active: 'text-emerald-400 bg-emerald-400/10 border-emerald-500/30',
        completed: 'text-indigo-400 bg-indigo-400/10 border-indigo-500/30',
        paused: 'text-amber-400 bg-amber-400/10 border-amber-500/30',
        archived: 'text-zinc-400 bg-zinc-400/10 border-zinc-500/30',
    };

    const toggleMs = async id => {
        if (!id || id === 'undefined') return; // guard: milestone not yet persisted
        try { const r = await api.patch(`/goals/${goal._id}/milestone/${id}`); onUpdate(r.data); } catch (e) { console.error(e); }
    };
    const addMs = async () => {
        if (!newMs.trim()) return; setMsLoad(true);
        try { const r = await api.patch(`/goals/${goal._id}/milestone`, { text: newMs, dueDate: newMsDate || undefined }); onUpdate(r.data); setNewMs(''); setNewMsDate(''); }
        catch (e) { console.error(e); } finally { setMsLoad(false); }
    };
    const setStatus = async s => { try { const r = await api.put(`/goals/${goal._id}`, { status: s }); onUpdate(r.data); } catch (e) { console.error(e); } };
    const setProgress = async v => { try { const r = await api.put(`/goals/${goal._id}`, { progress: v }); onUpdate(r.data); } catch (e) { console.error(e); } };

    return (
        <>
            <motion.div layout initial={{ opacity: 0, y: 20, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: .95 }}
                className="relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/60 backdrop-blur-sm hover:border-white/10 transition-all">
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: cat.color }} />
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.bg} opacity-40 pointer-events-none`} />

                <div className="relative p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="p-2 rounded-xl shrink-0" style={{ background: `${cat.color}20` }}><CatIcon className="w-4 h-4" style={{ color: cat.color }} /></div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-white text-base truncate">{goal.title}</h3>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${SC[goal.status]}`}>{goal.status}</span>
                                    {tp && <TrackBadge t={tp.pct} a={goal.progress} />}
                                </div>
                            </div>
                        </div>
                        <div className="relative shrink-0">
                            <ProgressRing pct={goal.progress} color={cat.color} size={56} />
                            <div className="absolute inset-0 flex items-center justify-center"><span className="text-xs font-bold text-white">{goal.progress}%</span></div>
                        </div>
                    </div>

                    {goal.description && <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2">{goal.description}</p>}

                    {/* Timeline */}
                    {tp && (
                        <div className="bg-black/20 rounded-xl p-3 space-y-2 border border-white/5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-zinc-500 flex items-center gap-1"><Clock className="w-3 h-3" />Time elapsed</span>
                                <span className={`font-semibold ${tp.daysLeft < 0 ? 'text-rose-400' : tp.daysLeft < 7 ? 'text-amber-400' : 'text-zinc-300'}`}>
                                    {tp.daysLeft > 0 ? `${tp.daysLeft}d left` : tp.daysLeft === 0 ? 'Due today!' : `${Math.abs(tp.daysLeft)}d overdue`}
                                </span>
                            </div>
                            <Bar pct={tp.pct} color="rgba(255,255,255,0.15)" />
                            <Bar pct={goal.progress} color={cat.color} />
                            <div className="flex justify-between text-[10px] text-zinc-600">
                                <span>{tp.pct}% time used</span><span style={{ color: cat.color }}>{goal.progress}% done</span>
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
                                            style={m.completed ? { background: `${cat.color}30`, borderColor: cat.color, color: cat.color } : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: '#71717a' }}>
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
                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                        <button onClick={() => setExpanded(!expanded)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all">
                            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {expanded ? 'Hide' : 'Full timeline'}
                        </button>
                        <button onClick={() => onEdit(goal)} className="p-1.5 text-zinc-600 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => onDelete(goal)} className="p-1.5 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>

                    {/* Expanded timeline */}
                    <AnimatePresence>
                        {expanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .25 }} className="overflow-hidden">
                                <div className="pt-4 border-t border-white/5 space-y-5">
                                    <div>
                                        <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">Status</p>
                                        <div className="flex gap-2 flex-wrap">
                                            {['active', 'paused', 'completed', 'archived'].map(s => (
                                                <button key={s} onClick={() => setStatus(s)}
                                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${goal.status === s ? SC[s] : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}>{s}</button>
                                            ))}
                                        </div>
                                    </div>

                                    {goal.milestones.length > 0 && (
                                        <div>
                                            <p className="text-xs text-zinc-500 mb-3 font-medium uppercase tracking-wider flex items-center gap-1.5">
                                                <Zap className="w-3 h-3" />Step-by-step Timeline <span className="text-zinc-600 normal-case tracking-normal ml-1">(click to log activity)</span>
                                            </p>
                                            <div>
                                                {goal.milestones.map((m, i) => {
                                                    const isLast = i === goal.milestones.length - 1;
                                                    const isNext = !m.completed && (i === 0 || goal.milestones[i - 1]?.completed);
                                                    const dl = m.dueDate ? Math.ceil((new Date(m.dueDate) - Date.now()) / 864e5) : null;
                                                    return (
                                                        <div key={m._id} className="flex gap-3">
                                                            <div className="flex flex-col items-center" style={{ minWidth: 28 }}>
                                                                <button onClick={() => toggleMs(m._id)} className="shrink-0 hover:scale-110 transition-transform focus:outline-none">
                                                                    {m.completed ? <CheckCircle2 className="w-5 h-5" style={{ color: cat.color }} /> : <Circle className={`w-5 h-5 ${isNext ? 'text-zinc-400' : 'text-zinc-700'}`} />}
                                                                </button>
                                                                {!isLast && <div className="w-px flex-1 mt-0.5 mb-0.5" style={{ background: m.completed ? `${cat.color}60` : 'rgba(255,255,255,0.07)', minHeight: 20 }} />}
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
                                                <button onClick={addMs} disabled={msLoad} className="px-3 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-50">Add</button>
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
                {actMs && <ActivityModal milestone={actMs} goalId={goal._id} catColor={cat.color} onClose={() => setActMs(null)} onSave={r => { onUpdate(r); setActMs(null); }} />}
            </AnimatePresence>
        </>
    );
}

/* ══════════════════════════════════════════════════════════════
   DELETE CONFIRM
══════════════════════════════════════════════════════════════ */
function DeleteModal({ goal, onClose, onConfirm, loading }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <motion.div initial={{ scale: .9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: .9, opacity: 0 }}
                className="bg-zinc-900 border border-zinc-700/50 rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-rose-500/15 rounded-xl"><Trash2 className="w-5 h-5 text-rose-400" /></div>
                    <div><h3 className="font-semibold text-white">Delete Goal?</h3><p className="text-sm text-zinc-500">Cannot be undone.</p></div>
                </div>
                <p className="text-zinc-400 text-sm mb-5 bg-zinc-800/60 rounded-lg px-3 py-2 border border-zinc-700/50">"{goal.title}"</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-all">Cancel</button>
                    <button onClick={onConfirm} disabled={loading} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50">{loading ? 'Deleting…' : 'Delete'}</button>
                </div>
            </motion.div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function GoalsPage() {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [editGoal, setEditGoal] = useState(null);   // for edit modal
    const [aiGoal, setAiGoal] = useState(null);   // for AI-prefilled create modal
    const [delGoal, setDelGoal] = useState(null);
    const [delLoad, setDelLoad] = useState(false);
    const [filter, setFilter] = useState('all');

    useEffect(() => { fetchGoals(); }, []);

    const fetchGoals = async () => {
        try { const r = await api.get('/goals'); setGoals(r.data); }
        catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleCreate = g => setGoals(p => [g, ...p]);
    const handleUpdate = up => setGoals(p => p.map(g => g._id === up._id ? up : g));
    const handleDelConfirm = async () => {
        if (!delGoal) return; setDelLoad(true);
        try { await api.delete(`/goals/${delGoal._id}`); setGoals(p => p.filter(g => g._id !== delGoal._id)); setDelGoal(null); }
        catch (e) { console.error(e); } finally { setDelLoad(false); }
    };

    // When AI generates a goal, open the form pre-filled so user can review/edit
    const handleAIGenerated = aiGoalData => {
        setAiGoal(aiGoalData);
    };

    const filtered = filter === 'all' ? goals : goals.filter(g => g.status === filter);
    const totalActive = goals.filter(g => g.status === 'active').length;
    const totalDone = goals.filter(g => g.status === 'completed').length;
    const avgProg = goals.length > 0 ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0;

    const filters = [
        { value: 'all', label: 'All' },
        { value: 'active', label: '🔥 Active' },
        { value: 'completed', label: '✅ Completed' },
        { value: 'paused', label: '⏸ Paused' },
    ];

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            <Helmet><title>Goals | Life OS</title></Helmet>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Goals</h1>
                    <p className="text-zinc-500 mt-1">Set intentions, track milestones, achieve more.</p>
                </div>
                <div className="flex gap-2">
                    {/* AI Chat button */}
                    <button onClick={() => setShowChat(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-indigo-500/50 text-zinc-300 hover:text-white rounded-xl font-medium transition-all text-sm">
                        <Bot className="w-4 h-4 text-indigo-400" />Ask AI
                    </button>
                    <button onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20">
                        <Plus className="w-4 h-4" />New Goal
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[{ label: 'Active', value: totalActive, color: 'text-emerald-400' }, { label: 'Completed', value: totalDone, color: 'text-indigo-400' }, { label: 'Avg Progress', value: `${avgProg}%`, color: 'text-purple-400' }].map(s => (
                    <div key={s.label} className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 text-center">
                        <div className={`text-2xl md:text-3xl font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {filters.map(f => (
                    <button key={f.value} onClick={() => setFilter(f.value)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${filter === f.value ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-zinc-500 hover:text-zinc-300 bg-zinc-900/50 border border-zinc-800'}`}>
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20"><div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : filtered.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl">
                    <Target className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-400 font-medium">No goals yet</p>
                    <p className="text-zinc-600 text-sm mt-1">Use AI chat or create one manually</p>
                    <div className="flex items-center justify-center gap-3 mt-6">
                        <button onClick={() => setShowChat(true)} className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-all flex items-center gap-2">
                            <Bot className="w-4 h-4 text-indigo-400" />Ask AI
                        </button>
                        <button onClick={() => setShowCreate(true)} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all">Create Goal</button>
                    </div>
                </motion.div>
            ) : (
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    <AnimatePresence>
                        {filtered.map(g => (
                            <GoalCard key={g._id} goal={g} onDelete={setDelGoal} onUpdate={handleUpdate} onEdit={setEditGoal} />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Modals */}
            <AnimatePresence>
                {showChat && <AIChatModal onClose={() => setShowChat(false)} onGenerated={handleAIGenerated} />}
            </AnimatePresence>
            <AnimatePresence>
                {/* AI-generated goal opens in form for user to review */}
                {aiGoal && <GoalFormModal initialData={aiGoal} onClose={() => setAiGoal(null)} onSave={g => { handleCreate(g); setAiGoal(null); }} />}
            </AnimatePresence>
            <AnimatePresence>
                {showCreate && <GoalFormModal onClose={() => setShowCreate(false)} onSave={handleCreate} />}
            </AnimatePresence>
            <AnimatePresence>
                {editGoal && <GoalFormModal initialData={editGoal} onClose={() => setEditGoal(null)} onSave={handleUpdate} />}
            </AnimatePresence>
            <AnimatePresence>
                {delGoal && <DeleteModal goal={delGoal} onClose={() => setDelGoal(null)} onConfirm={handleDelConfirm} loading={delLoad} />}
            </AnimatePresence>
        </div>
    );
}
