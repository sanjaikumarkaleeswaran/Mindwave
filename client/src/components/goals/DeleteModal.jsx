import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';

export default function DeleteModal({ goal, onClose, onConfirm, loading }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <motion.div initial={{ scale: .9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: .9, opacity: 0 }}
                className="bg-zinc-900 border border-zinc-700/50 rounded-2xl w-full max-w-sm p-6 shadow-2xl"
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-rose-500/15 rounded-xl"><Trash2 className="w-5 h-5 text-rose-400" /></div>
                    <div>
                        <h3 className="font-semibold text-white">Delete Goal?</h3>
                        <p className="text-sm text-zinc-500">Cannot be undone.</p>
                    </div>
                </div>
                <p className="text-zinc-400 text-sm mb-5 bg-zinc-800/60 rounded-lg px-3 py-2 border border-zinc-700/50">"{goal.title}"</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-all">Cancel</button>
                    <button onClick={onConfirm} disabled={loading}
                        className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50">
                        {loading ? 'Deleting…' : 'Delete'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
