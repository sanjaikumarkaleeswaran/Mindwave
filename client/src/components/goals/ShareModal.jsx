import { useState } from 'react';
import { motion } from 'framer-motion';
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

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={onClose}>
            <motion.div initial={{ scale: .9, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: .9, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 320 }}
                className="bg-zinc-900 border border-zinc-700/50 rounded-2xl w-full max-w-md shadow-2xl"
                onClick={e => e.stopPropagation()}>

                <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/10">
                        <Users className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Collaborators</p>
                        <h3 className="text-white font-semibold text-sm truncate">Share: {goal.title}</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-4 h-4 text-zinc-400" />
                    </button>
                </div>

                <div className="px-5 py-5 space-y-5">
                    {/* Add Collaborator Form */}
                    <form onSubmit={handleShare} className="space-y-3">
                        <label className="text-sm font-medium text-zinc-400 block">Invite via Email</label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="colleague@example.com"
                                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder-zinc-600"
                            />
                            <button
                                type="submit"
                                disabled={loading || !email.trim()}
                                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                Invite
                            </button>
                        </div>
                        {error && (
                            <div className="flex items-center gap-2 text-rose-400 text-xs mt-2">
                                <AlertCircle className="w-3.5 h-3.5" />{error}
                            </div>
                        )}
                    </form>

                    {/* Shared With List */}
                    <div>
                        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Currently Shared With</h4>
                        {(!goal.sharedWith || goal.sharedWith.length === 0) ? (
                            <div className="text-sm text-zinc-500 bg-zinc-800/50 rounded-xl p-4 text-center border border-dashed border-zinc-700/50">
                                Not shared with anyone yet.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {goal.sharedWith.map(user => (
                                    <div key={user._id} className="flex items-center gap-3 bg-zinc-800 border border-zinc-700/50 rounded-xl p-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                                            {user.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-white truncate">{user.name}</div>
                                            <div className="text-xs text-zinc-500 truncate">{user.email}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-5 pb-5 pt-2">
                    <button onClick={onClose} className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-all">Done</button>
                </div>
            </motion.div>
        </div>
    );
}
