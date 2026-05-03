import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Target, Plus, X, PenLine, Sparkles, AlertCircle } from 'lucide-react';
import api from '../../lib/axios';
import { CATEGORIES, getCat, toInput } from './goalHelpers.jsx';

export default function GoalFormModal({ onClose, onSave, onOpenChat, initialData = null }) {
    const navigate = useNavigate();
    const isEdit = !!(initialData && initialData._id);

    const [form, setForm] = useState({
        title:       initialData?.title       || '',
        description: initialData?.description || '',
        category:    initialData?.category    || 'personal',
        targetDate:  toInput(initialData?.targetDate),
    });

    const [milestones, setMilestones] = useState(
        initialData?.milestones?.length
            ? initialData.milestones.map(m => ({ text: typeof m === 'string' ? m : m.text, dueDate: toInput(m.dueDate) }))
            : [{ text: '', dueDate: '' }]
    );

    const [aiLoading, setAiLoading] = useState(false);
    const [loading,   setLoading]   = useState(false);
    const [error,     setError]     = useState('');
    const [aiError,   setAiError]   = useState('');

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
            const res = isEdit
                ? await api.put(`/goals/${initialData._id}`, payload)
                : await api.post('/goals', payload);
            onSave(res.data); onClose();
        } catch (err) { setError(err?.response?.data?.msg || 'Failed. Try again.'); }
        finally { setLoading(false); }
    };

    const content = (
        <div className="p-5 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-white flex items-center gap-3">
                    <div className="w-11 h-11 rounded-[1.25rem] bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30">
                        {isEdit ? <PenLine className="w-5 h-5 text-indigo-400" /> : <Target className="w-5 h-5 text-indigo-400" />}
                    </div>
                    <div>
                        <div className="leading-tight">{isEdit ? 'Edit Goal' : 'New Goal'}</div>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Objective Setup</div>
                    </div>
                </h2>
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => { onClose(); onOpenChat ? onOpenChat() : navigate('/chat'); }}
                        title="Open AI Goal Creator" className="p-2.5 hover:bg-white/5 rounded-2xl text-zinc-500 hover:text-indigo-400 transition-all active:scale-90">
                        <Sparkles className="w-5 h-5" />
                    </button>
                    <button type="button" onClick={onClose} className="p-2.5 hover:bg-white/5 rounded-2xl text-zinc-600 hover:text-white transition-all active:scale-90">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-4">
                {error && (
                    <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                        <AlertCircle className="w-4 h-4 shrink-0" />{error}
                    </div>
                )}

                <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1 block mb-1.5">Title *</label>
                    <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                        placeholder="e.g. Run a 5K marathon"
                        className="w-full bg-zinc-900/30 border border-white/5 rounded-[1.25rem] px-4 py-3.5 text-white text-sm font-bold focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-600" />
                </div>

                <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1 block mb-1.5">Description</label>
                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                        placeholder="What does success look like?"
                        className="w-full bg-zinc-900/30 border border-white/5 rounded-[1.25rem] px-4 py-3.5 text-white text-sm font-medium focus:outline-none focus:border-indigo-500/50 transition-all resize-none placeholder:text-zinc-600" />
                </div>

                <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1 block mb-2">Category</label>
                    <div className="grid grid-cols-4 gap-2">
                        {CATEGORIES.map(cat => {
                            const I = cat.icon;
                            return (
                                <button key={cat.value} type="button" onClick={() => setForm({ ...form, category: cat.value })}
                                    className={`flex flex-col items-center gap-1 p-3 rounded-[1rem] border transition-all text-xs font-bold active:scale-95 ${form.category === cat.value ? 'border-indigo-500/50 bg-indigo-500/15 text-white' : 'border-white/5 text-zinc-500 hover:border-white/10'}`}>
                                    <I className="w-4 h-4 mb-0.5" style={{ color: form.category === cat.value ? cat.color : undefined }} />
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1 block mb-1.5">Target Date</label>
                    <input type="date" value={form.targetDate} onChange={e => setForm({ ...form, targetDate: e.target.value })}
                        className="w-full bg-zinc-900/30 border border-white/5 rounded-[1.25rem] px-4 py-3.5 text-white text-sm font-bold focus:outline-none focus:border-indigo-500/50 transition-all [color-scheme:dark]" />
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2 px-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Steps / Milestones</label>
                        <button type="button" onClick={genAI} disabled={aiLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-60 active:scale-95"
                            style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', color: 'white' }}>
                            {aiLoading
                                ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Gen…</>
                                : <><Sparkles className="w-3 h-3" />AI Plan</>}
                        </button>
                    </div>
                    {aiError && <div className="text-amber-400 text-xs font-medium mb-2 px-1">{aiError}</div>}
                    <div className="space-y-2">
                        {milestones.map((m, i) => (
                            <motion.div key={i} layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                className="flex gap-2 items-start bg-zinc-900/20 p-3 rounded-[1.25rem] border border-white/5">
                                <span className="text-zinc-500 text-xs font-black shrink-0 w-5 mt-3 text-center">{i + 1}.</span>
                                <div className="flex-1 space-y-1.5">
                                    <input value={m.text} onChange={e => upMs(i, 'text', e.target.value)} placeholder={`Step ${i + 1}…`}
                                        className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-700" />
                                    <input type="date" value={m.dueDate} onChange={e => upMs(i, 'dueDate', e.target.value)}
                                        className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-zinc-300 text-xs font-medium focus:outline-none focus:border-indigo-500/50 transition-all [color-scheme:dark]" />
                                </div>
                                {milestones.length > 1 && (
                                    <button type="button" onClick={() => setMilestones(milestones.filter((_, j) => j !== i))}
                                        className="p-2 mt-1 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all shrink-0 active:scale-90">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </motion.div>
                        ))}
                        <button type="button" onClick={() => setMilestones([...milestones, { text: '', dueDate: '' }])}
                            className="text-[11px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest flex items-center gap-1.5 ml-2 mt-1 transition-colors active:scale-95">
                            <Plus className="w-3.5 h-3.5" />Add step
                        </button>
                    </div>
                </div>

                <button type="submit" disabled={loading}
                    className="w-full py-4 mt-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black uppercase tracking-widest text-xs rounded-[1.25rem] shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]">
                    {loading
                        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{isEdit ? 'Saving…' : 'Creating…'}</>
                        : isEdit ? 'Update Goal' : 'Create Goal'}
                </button>
            </form>
            <div className="h-6 md:h-0" />
        </div>
    );

    return (
        <AnimatePresence>
            <>
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[60]"
                />

                {/* Centered modal — all screen sizes */}
                <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none px-4 py-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.93, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.93 }}
                        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                        className="w-full max-w-lg bg-[#0c0c0e] border border-white/10 rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.95)] max-h-[90dvh] overflow-y-auto hide-scrollbar pointer-events-auto"
                    >
                        {content}
                    </motion.div>
                </div>
            </>
        </AnimatePresence>
    );
}
