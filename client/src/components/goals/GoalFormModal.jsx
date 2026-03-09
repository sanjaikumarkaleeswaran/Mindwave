import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Target, Plus, X, PenLine, Sparkles, AlertCircle } from 'lucide-react';
import api from '../../lib/axios';
import { CATEGORIES, getCat, toInput } from './goalHelpers.jsx';

export default function GoalFormModal({ onClose, onSave, onOpenChat, initialData = null }) {
    const navigate = useNavigate();
    const isEdit   = !!(initialData && initialData._id);

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
                        <button type="button" onClick={() => { onClose(); onOpenChat ? onOpenChat() : navigate('/chat'); }}
                            title="Open AI Goal Creator instead" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <PenLine className="w-5 h-5 text-zinc-500 hover:text-indigo-400" />
                        </button>
                        <button type="button" onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X className="w-5 h-5 text-zinc-400" />
                        </button>
                    </div>
                </div>

                <form onSubmit={submit} className="p-5 space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />{error}
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-medium text-zinc-400 block mb-1.5">Title *</label>
                        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                            placeholder="e.g. Run a 5K marathon"
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
                                const I = cat.icon;
                                return (
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
                                {aiLoading
                                    ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating…</>
                                    : <><Sparkles className="w-3 h-3" />AI Plan</>}
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
                                    {milestones.length > 1 && (
                                        <button type="button" onClick={() => setMilestones(milestones.filter((_, j) => j !== i))}
                                            className="p-1.5 mt-1.5 text-zinc-600 hover:text-rose-400 transition-colors shrink-0">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
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
                        {loading
                            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{isEdit ? 'Saving…' : 'Creating…'}</>
                            : isEdit ? '💾 Save Changes' : '🎯 Create Goal'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
