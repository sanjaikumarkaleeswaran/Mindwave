import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Tag, Calendar, FileText, ChevronDown, Save, IndianRupee, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
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

    // Helper to get local date string YYYY-MM-DD
    const getLocalDateString = (dateObj = new Date()) => {
        const offsetMs = dateObj.getTimezoneOffset() * 60000;
        return new Date(dateObj.getTime() - offsetMs).toISOString().split('T')[0];
    };

    useEffect(() => {
        if (editData) {
            setFormData({
                type: editData.type,
                amount: editData.amount.toString(),
                category: editData.category,
                note: editData.note || '',
                date: getLocalDateString(new Date(editData.date))
            });
        } else {
            setFormData({
                type: 'expense',
                amount: '',
                category: 'Food',
                note: '',
                date: getLocalDateString()
            });
        }
    }, [editData, isOpen]);

    const handleTypeChange = (type) => {
        setFormData({ ...formData, type, category: CATEGORIES[type][0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...formData, amount: parseFloat(formData.amount) };
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

    // The shared form content (used in both mobile and desktop)
    const formContentNode = (
        <div className="p-8 relative">
            {/* Decorative Background Glows */}
            <div className="absolute top-0 inset-x-0 h-64 overflow-hidden pointer-events-none rounded-t-[3rem] md:rounded-[3rem]">
                <div className={`absolute -top-32 -left-32 w-64 h-64 rounded-full blur-[100px] transition-colors duration-700 ${formData.type === 'expense' ? 'bg-red-500/10' : 'bg-emerald-500/10'}`} />
                <div className={`absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] transition-colors duration-700 ${formData.type === 'expense' ? 'bg-orange-500/10' : 'bg-indigo-500/10'}`} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-8 relative">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center border transition-all duration-500 ${formData.type === 'expense' ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                        <IndianRupee className={`w-6 h-6 transition-colors duration-500 ${formData.type === 'expense' ? 'text-red-400' : 'text-emerald-400'}`} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white leading-tight">
                            {editData ? 'Edit Entry' : 'New Entry'}
                        </h3>
                        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                            Financial Record
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2.5 hover:bg-white/5 rounded-2xl text-zinc-600 hover:text-white transition-all active:scale-90"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative">
                {/* Type Toggle */}
                <div className="relative flex p-1.5 bg-zinc-900/60 rounded-[2rem] border border-white/5">
                    <motion.div
                        className="absolute inset-y-1.5 rounded-[1.75rem] shadow-xl"
                        initial={false}
                        animate={{
                            x: formData.type === 'expense' ? 0 : '100%',
                            backgroundColor: formData.type === 'expense' ? '#3f3f46' : '#4f46e5',
                            width: 'calc(50% - 6px)'
                        }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    />
                    <button
                        type="button"
                        onClick={() => handleTypeChange('expense')}
                        className={`relative flex-1 py-3.5 px-4 rounded-[1.75rem] text-sm font-black transition-colors duration-300 flex items-center justify-center gap-2 ${formData.type === 'expense' ? 'text-white' : 'text-zinc-500'}`}
                    >
                        <ArrowDownLeft className="w-4 h-4" />
                        Expense
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTypeChange('income')}
                        className={`relative flex-1 py-3.5 px-4 rounded-[1.75rem] text-sm font-black transition-colors duration-300 flex items-center justify-center gap-2 ${formData.type === 'income' ? 'text-white' : 'text-zinc-500'}`}
                    >
                        <ArrowUpRight className="w-4 h-4" />
                        Income
                    </button>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Amount (INR)</label>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${formData.type === 'expense' ? 'text-red-400 border-red-500/20 bg-red-500/5' : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5'}`}>
                            {formData.type.toUpperCase()}
                        </span>
                    </div>
                    <div className="relative group">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none">
                            <span className="font-mono text-3xl font-medium tracking-tighter">₹</span>
                        </div>
                        <input
                            required
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            className="w-full bg-zinc-900/30 border border-white/5 rounded-[1.75rem] py-6 pl-[4.5rem] pr-6 text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-mono text-3xl tracking-tighter"
                        />
                    </div>
                </div>

                {/* Category & Date Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Category</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none">
                                <Tag className="w-4 h-4" />
                            </div>
                            <select
                                required
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full bg-zinc-900/30 border border-white/5 rounded-[1.25rem] h-14 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500/50 appearance-none transition-all text-sm font-bold"
                            >
                                {CATEGORIES[formData.type].map(c => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Date</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <input
                                required
                                type="date"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-zinc-900/30 border border-white/5 rounded-[1.25rem] h-14 pl-10 pr-3 text-white focus:outline-none focus:border-indigo-500/50 transition-all text-sm font-bold [color-scheme:dark]"
                            />
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Notes</label>
                    <div className="relative group">
                        <div className="absolute left-4 top-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors">
                            <FileText className="w-4 h-4" />
                        </div>
                        <textarea
                            placeholder="What was this for?"
                            value={formData.note}
                            onChange={e => setFormData({ ...formData, note: e.target.value })}
                            rows={2}
                            className="w-full bg-zinc-900/30 border border-white/5 rounded-[1.25rem] p-4 pl-11 text-white focus:outline-none focus:border-indigo-500/50 transition-all text-sm font-medium resize-none placeholder:text-zinc-700"
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    disabled={loading}
                    type="submit"
                    className={`w-full py-5 rounded-[1.75rem] font-black shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 group relative overflow-hidden ${
                        formData.type === 'expense'
                            ? 'bg-zinc-100 hover:bg-white text-black'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine" />
                    {loading ? (
                        <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${formData.type === 'expense' ? 'border-zinc-400 border-t-black' : 'border-indigo-300 border-t-white'}`} />
                    ) : (
                        <>
                            {editData
                                ? <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                : <Plus className="w-4 h-4 group-hover:scale-110 group-hover:rotate-90 transition-transform" />
                            }
                            <span className="uppercase tracking-[0.2em] text-xs">
                                {editData ? 'Update Entry' : 'Log Entry'}
                            </span>
                        </>
                    )}
                </button>
            </form>

            {/* Safe bottom space for mobile */}
            <div className="h-6 md:h-0" />
        </div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* ── Backdrop ── */}
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
                        {formContentNode}
                    </motion.div>

                    {/* ── Desktop: scroll-proof centered modal ── */}
                    {/* 
                        The outer div is a fixed inset-0 flex container — 
                        centering is done by flexbox, NOT by top+translate.
                        This means the modal stays centered no matter how far the page is scrolled.
                        pointer-events-none so clicks pass through to the backdrop above.
                    */}
                    <div className="fixed inset-0 z-[70] hidden md:flex items-center justify-center pointer-events-none px-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.93 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.93 }}
                            transition={{ type: "spring", damping: 26, stiffness: 300 }}
                            className="w-full max-w-lg bg-[#0c0c0e] border border-white/10 rounded-[3rem] shadow-[0_32px_80px_rgba(0,0,0,0.95)] max-h-[90vh] overflow-y-auto hide-scrollbar pointer-events-auto"
                        >
                            {formContentNode}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
