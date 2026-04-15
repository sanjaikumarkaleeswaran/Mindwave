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
                    res.data.forEach(b => {
                        bMap[b.category] = b.limit;
                    });
                    setBudgets(bMap);
                } catch (e) {
                    console.error(e);
                }
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
                return api.post('/expenses/budgets', {
                    category,
                    limit: parseFloat(limit),
                    month: currentMonth
                });
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

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-x-4 bottom-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-zinc-900 border border-white/10 rounded-[2.5rem] shadow-2xl z-[70] overflow-hidden"
                    >
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                        <TrendingUp className="w-6 h-6 text-amber-400" />
                                    </div>
                                    Monthly Budgets
                                </h3>
                                <button onClick={onClose} className="p-2.5 hover:bg-white/5 rounded-2xl text-zinc-500 transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                                    {CATEGORIES.map(category => (
                                        <div key={category} className="space-y-1.5">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{category}</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">₹</span>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    value={budgets[category] || ''}
                                                    onChange={e => setBudgets({ ...budgets, [category]: e.target.value })}
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-9 pr-4 text-white focus:outline-none focus:border-amber-500/50 transition-all font-bold"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full py-5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-black rounded-3xl shadow-[0_15px_30px_rgba(245,158,11,0.3)] transition-all mt-4 flex items-center justify-center gap-2 group active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <div className="w-6 h-6 border-3 border-black/30 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                            <span className="uppercase tracking-[0.15em] text-xs">Update Budgets</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
