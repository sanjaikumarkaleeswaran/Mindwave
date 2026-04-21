import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, X, AlertCircle, Plus, Loader2 } from 'lucide-react';
import api from '../../lib/axios';

export default function ShareModal({ goal, onClose, onUpdate }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleShare = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;
        setLoading(true);
        setError('');
        try {
            const res = await api.post(`/goals/${goal._id}/share`, { email: email.trim() });
            onUpdate(res.data);
            setEmail('');
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to share goal.');
        } finally {
            setLoading(false);
        }
    };

    const contentNode = (
        <div className="p-6 md:p-8 relative">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30">
                        <Users className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white leading-tight truncate max-w-[200px]">
                            Share Goal
                        </h3>
                        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-0.5 truncate max-w-[200px]">
                            {goal.title}
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2.5 hover:bg-white/5 rounded-2xl text-zinc-600 hover:text-white transition-all active:scale-90">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-6">
                {/* Add Collaborator Form */}
                <form onSubmit={handleShare} className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Invite via Email</label>
                    <div className="flex gap-2">
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="colleague@example.com"
                            className="flex-1 bg-zinc-900/30 border border-white/5 rounded-[1.25rem] px-4 py-3.5 text-white text-sm font-medium focus:outline-none focus:border-indigo-500/50 transition-all placeholder-zinc-700"
                        />
                        <button
                            type="submit"
                            disabled={loading || !email.trim()}
                            className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.25rem] text-sm font-black transition-all disabled:opacity-50 flex items-center gap-2 active:scale-95"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Invite
                        </button>
                    </div>
                    {error && (
                        <div className="flex items-center gap-2 text-rose-400 text-xs mt-2 px-1">
                            <AlertCircle className="w-3.5 h-3.5" />{error}
                        </div>
                    )}
                </form>

                {/* Shared With List */}
                <div>
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1 mb-3">Currently Shared With</h4>
                    {(!goal.sharedWith || goal.sharedWith.length === 0) ? (
                        <div className="text-sm font-medium text-zinc-500 bg-zinc-900/30 rounded-[1.25rem] p-6 text-center border border-dashed border-white/5">
                            Not shared with anyone yet.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {goal.sharedWith.map(user => (
                                <div key={user._id} className="flex items-center gap-4 bg-zinc-900/30 border border-white/5 rounded-[1.25rem] p-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-sm border border-indigo-500/20">
                                        {user.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-white truncate">{user.name}</div>
                                        <div className="text-xs font-medium text-zinc-500 truncate">{user.email}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Safe bottom space for mobile */}
            <div className="h-6 md:h-0" />
        </div>
    );

    return (
        <AnimatePresence>
            <>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[60]"
                />

                {/* ── Mobile: bottom sheet ── */}
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: "spring", damping: 28, stiffness: 280 }}
                    className="fixed inset-x-0 bottom-0 bg-[#0c0c0e] border-t border-white/10 rounded-t-[3rem] z-[70] max-h-[95dvh] overflow-y-auto hide-scrollbar md:hidden"
                >
                    {contentNode}
                </motion.div>

                {/* ── Desktop: scroll-proof centered modal ── */}
                <div className="fixed inset-0 z-[70] hidden md:flex items-center justify-center pointer-events-none px-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.93 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.93 }}
                        transition={{ type: "spring", damping: 26, stiffness: 300 }}
                        className="w-full max-w-lg bg-[#0c0c0e] border border-white/10 rounded-[3rem] shadow-[0_32px_80px_rgba(0,0,0,0.95)] max-h-[90vh] overflow-y-auto hide-scrollbar pointer-events-auto"
                    >
                        {contentNode}
                    </motion.div>
                </div>
            </>
        </AnimatePresence>
    );
}
