import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Wallet, Tag, Calendar, FileText, ChevronDown, Save, IndianRupee } from 'lucide-react';
import api from '../../lib/axios';

const CATEGORIES = {
    expense: ['Food', 'Travel', 'Bills', 'Shopping', 'Health', 'Investment', 'Others'],
    income: ['Salary', 'Investment', 'Gift', 'Others']
};

export default function AddExpenseModal({ isOpen, onClose, onAdded, editData = null }) {
    const [formData, setFormData] = useState({
        type: 'expense',
        amount: '',
        category: 'Food',
        note: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editData) {
            setFormData({
                type: editData.type,
                amount: editData.amount.toString(),
                category: editData.category,
                note: editData.note || '',
                date: new Date(editData.date).toISOString().split('T')[0]
            });
        } else {
            setFormData({
                type: 'expense',
                amount: '',
                category: 'Food',
                note: '',
                date: new Date().toISOString().split('T')[0]
            });
        }
    }, [editData, isOpen]);

    const handleTypeChange = (type) => {
        setFormData({ 
            ...formData, 
            type, 
            category: CATEGORIES[type][0] 
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                amount: parseFloat(formData.amount)
            };

            if (editData) {
                await api.put(`/expenses/${editData._id}`, payload);
            } else {
                await api.post('/expenses', payload);
            }

            onAdded();
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
                        className="fixed inset-x-4 bottom-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-[#0c0c0e] border border-white/10 rounded-[2.5rem] shadow-[0_32px_64px_rgba(0,0,0,0.9)] z-[70] max-h-[90vh] overflow-y-auto custom-scrollbar"
                    >
                        <div className="p-8 md:p-10">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-black text-white flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                        <IndianRupee className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    {editData ? 'Edit Transaction' : 'Add Transaction'}
                                </h3>
                                <button 
                                    onClick={onClose} 
                                    className="p-3 hover:bg-white/5 rounded-2xl text-zinc-600 hover:text-white transition-all active:scale-90"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Type Toggle */}
                                <div className="flex p-2 bg-black/40 rounded-[1.5rem] border border-white/5">
                                    <button
                                        type="button"
                                        onClick={() => handleTypeChange('expense')}
                                        className={`flex-1 py-4 rounded-2xl text-sm font-black transition-all duration-300 ${formData.type === 'expense' ? 'bg-zinc-800 text-white shadow-xl translate-z-0' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        Expense
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleTypeChange('income')}
                                        className={`flex-1 py-4 rounded-2xl text-sm font-black transition-all duration-300 ${formData.type === 'income' ? 'bg-indigo-600 text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        Income
                                    </button>
                                </div>

                                {/* Amount */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Amount (INR)</label>
                                    <div className="relative group">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-white/[0.03] flex items-center justify-center text-zinc-500 group-focus-within:text-indigo-400 transition-colors">
                                            <span className="font-bold text-lg">₹</span>
                                        </div>
                                        <input
                                            required
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                            className="w-full bg-black/40 border border-white/5 rounded-[1.75rem] py-6 pl-16 pr-8 text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-mono text-3xl tracking-tighter"
                                        />
                                    </div>
                                </div>

                                {/* Category & Date Row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Category</label>
                                        <div className="relative">
                                            <select
                                                required
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl h-16 pl-6 pr-4 text-white focus:outline-none focus:border-indigo-500/50 appearance-none transition-all text-sm font-bold"
                                            >
                                                {CATEGORIES[formData.type].map(c => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Date</label>
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl h-16 px-6 text-white focus:outline-none focus:border-indigo-500/50 transition-all text-sm font-bold"
                                        />
                                    </div>
                                </div>

                                {/* Note */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Note (Optional)</label>
                                    <textarea
                                        placeholder="What was this for?"
                                        value={formData.note}
                                        onChange={e => setFormData({ ...formData, note: e.target.value })}
                                        rows={2}
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-6 text-white focus:outline-none focus:border-indigo-500/50 transition-all text-sm font-medium resize-none"
                                    />
                                </div>

                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-[2rem] font-black shadow-[0_20px_50px_rgba(99,102,241,0.4)] active:scale-[0.98] transition-all mt-4 flex items-center justify-center gap-3 group relative overflow-hidden"
                                >
                                    {/* Shine Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shine" />
                                    
                                    {loading ? (
                                        <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            {editData ? <Save className="w-5 h-5 group-hover:scale-110 transition-transform" /> : <Plus className="w-5 h-5 group-hover:scale-110 group-hover:rotate-90 transition-transform" />}
                                            <span className="uppercase tracking-[0.2em] text-[10px] md:text-xs">
                                                {editData ? 'Update Transaction' : 'Save Transaction'}
                                            </span>
                                        </>
                                    )}
                                </button>
                            </form>
                            <div className="h-6 md:h-0" />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
