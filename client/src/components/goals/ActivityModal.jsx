import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Calendar, X, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../lib/axios';
import { fmtDate } from './goalHelpers.jsx';

export default function ActivityModal({ milestone, goalId, catColor, onClose, onSave }) {
    const [notes,    setNotes]    = useState(milestone.notes || '');
    const [markDone, setMarkDone] = useState(!milestone.completed);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState('');

    const save = async () => {
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

    const content = (
        <>
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-3">
                <div className="p-2 rounded-xl" style={{ background: `${catColor}20` }}>
                    <FileText className="w-4 h-4" style={{ color: catColor }} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Log Activity</p>
                    <h3 className="text-white font-semibold text-sm truncate">{milestone.text}</h3>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors active:scale-90">
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
                {error && (
                    <div className="flex items-center gap-2 text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />{error}
                    </div>
                )}
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
                {milestone.completed && (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-400/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                        <CheckCircle2 className="w-4 h-4" />Already completed
                    </div>
                )}
            </div>

            <div className="px-5 pb-5 flex gap-3" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))' }}>
                <button onClick={onClose} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-all active:scale-95">Cancel</button>
                <button onClick={save} disabled={loading}
                    className="flex-1 py-2.5 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
                    style={{ background: `linear-gradient(135deg,${catColor}cc,${catColor}88)` }}>
                    {loading
                        ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                        : '💾 Save Activity'}
                </button>
            </div>
        </>
    );

    return (
        <AnimatePresence>
            <>
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[70]"
                />

                {/* Centered modal — all screen sizes */}
                <div className="fixed inset-0 z-[80] flex items-center justify-center pointer-events-none px-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 320 }}
                        className="bg-zinc-900 border border-zinc-700/50 rounded-2xl w-full max-w-md shadow-2xl pointer-events-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        {content}
                    </motion.div>
                </div>
            </>
        </AnimatePresence>
    );
}
