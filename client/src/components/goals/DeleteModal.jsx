import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';

export default function DeleteModal({ goal, onClose, onConfirm, loading }) {
    const content = (
        <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-rose-500/15 rounded-xl"><Trash2 className="w-5 h-5 text-rose-400" /></div>
                <div>
                    <h3 className="font-semibold text-white">Delete Goal?</h3>
                    <p className="text-sm text-zinc-500">Cannot be undone.</p>
                </div>
            </div>
            <p className="text-zinc-400 text-sm mb-5 bg-zinc-800/60 rounded-lg px-3 py-2 border border-zinc-700/50">"{goal.title}"</p>
            <div className="flex gap-3" style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom, 0px))' }}>
                <button onClick={onClose} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-all active:scale-95">Cancel</button>
                <button onClick={onConfirm} disabled={loading}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50 active:scale-95">
                    {loading ? 'Deleting…' : 'Delete'}
                </button>
            </div>
        </div>
    );

    return (
        <AnimatePresence>
            <>
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70]"
                />

                {/* Mobile: bottom sheet */}
                <motion.div
                    initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                    className="fixed inset-x-0 bottom-0 bg-zinc-900 border-t border-zinc-700/50 rounded-t-[2.5rem] z-[80] md:hidden"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="w-10 h-1 rounded-full bg-zinc-700" />
                    </div>
                    {content}
                </motion.div>

                {/* Desktop: centered modal */}
                <div className="fixed inset-0 z-[80] hidden md:flex items-center justify-center pointer-events-none px-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 320 }}
                        className="bg-zinc-900 border border-zinc-700/50 rounded-2xl w-full max-w-sm shadow-2xl pointer-events-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        {content}
                    </motion.div>
                </div>
            </>
        </AnimatePresence>
    );
}
