import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, TrendingUp } from 'lucide-react';
import api from '../../lib/axios';

const CATEGORIES = ['Food', 'Travel', 'Bills', 'Shopping', 'Health', 'Others'];

export default function ManageBudgetsModal({ isOpen, onClose, onUpdated, currentMonth }) {
    const [budgets, setBudgets] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchBudgets = async () => {
                try {
                    const res = await api.get(`/expenses/budgets?month=${currentMonth}`);
                    const bMap = {};
                    res.data.forEach(b => { bMap[b.category] = b.limit; });
                    setBudgets(bMap);
                } catch (e) { console.error(e); }
            };
            fetchBudgets();
        }
    }, [isOpen, currentMonth]);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const promises = Object.entries(budgets).map(([category, limit]) => {
                if (!limit) return null;
                return api.post('/expenses/budgets', { category, limit: parseFloat(limit), month: currentMonth });
            }).filter(p => p !== null);
            await Promise.all(promises);
            onUpdated();
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const content = (
        <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-7">
                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                        <TrendingUp className="w-6 h-6 text-amber-400" />
                    </div>
                    Monthly Budgets
                </h3>
                <button onClick={onClose} className="p-2.5 hover:bg-white/5 rounded-2xl text-zinc-500 transition-all active:scale-90">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1 hide-scrollbar">
                    {CATEGORIES.map(category => (
                        <div key={category}>
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 block mb-1.5">{category}</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-sm">₹</span>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={budgets[category] || ''}
                                    onChange={e => setBudgets({ ...budgets, [category]: e.target.value })}
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-9 pr-4 text-white focus:outline-none focus:border-amber-500/50 transition-all font-bold text-sm"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <button disabled={loading} type="submit"
                    className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-black rounded-2xl shadow-[0_8px_30px_rgba(245,158,11,0.3)] transition-all mt-4 flex items-center justify-center gap-2 group active:scale-[0.98] text-xs uppercase tracking-widest">
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                        <><Save className="w-4 h-4 group-hover:scale-110 transition-transform" />Update Budgets</>
                    )}
                </button>
            </form>
            <div className="h-6 md:h-0" />
        </div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
                    />

                    {/* Mobile: bottom sheet */}
                    <motion.div
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                        className="fixed inset-x-0 bottom-0 bg-[#0c0c0e] border-t border-white/10 rounded-t-[3rem] z-[70] max-h-[95dvh] overflow-y-auto hide-scrollbar md:hidden"
                    >
                        {content}
                    </motion.div>

                    {/* Desktop: centered modal */}
                    <div className="fixed inset-0 z-[70] hidden md:flex items-center justify-center pointer-events-none px-4 py-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.93 }}
                            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                            className="w-full max-w-md bg-[#0c0c0e] border border-white/10 rounded-[3rem] shadow-[0_32px_80px_rgba(0,0,0,0.95)] max-h-[90vh] overflow-y-auto hide-scrollbar pointer-events-auto"
                        >
                            {content}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
