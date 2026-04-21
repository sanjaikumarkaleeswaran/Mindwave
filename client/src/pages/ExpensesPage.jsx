import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Wallet, TrendingUp, Plus, Download, AlertCircle,
    ChevronLeft, ChevronRight, Search, Tag
} from 'lucide-react';
import api from '../lib/axios';
import AddExpenseModal from '../components/expenses/AddExpenseModal';
import ExpenseTable from '../components/expenses/ExpenseTable';
import CategoryPieChart from '../components/expenses/CategoryPieChart';
import MonthlyBarChart from '../components/expenses/MonthlyBarChart';
import BudgetProgress from '../components/expenses/BudgetProgress';
import ManageBudgetsModal from '../components/expenses/ManageBudgetsModal';
import { Helmet } from 'react-helmet-async';

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState([]);
    const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0, categoryBreakdown: {} });
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [expRes, sumRes, budRes] = await Promise.all([
                api.get(`/expenses?startDate=${currentMonth}-01`),
                api.get(`/expenses/summary?month=${currentMonth}`),
                api.get(`/expenses/budgets?month=${currentMonth}`)
            ]);
            setExpenses(expRes.data);
            setSummary(sumRes.data);
            setBudgets(budRes.data);
        } catch (err) {
            console.error('Error fetching expenses:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [currentMonth]);

    const handleDeleteExpense = async (id) => {
        if (!window.confirm('Delete this transaction?')) return;
        try { await api.delete(`/expenses/${id}`); fetchData(); }
        catch (err) { console.error(err); }
    };

    const filteredExpenses = expenses.filter(exp =>
        (exp.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exp.note || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const exportToCSV = () => {
        const headers = ['Date', 'Type', 'Amount', 'Category', 'Note'];
        const rows = expenses.map(e => [new Date(e.date).toLocaleDateString(), e.type, e.amount, e.category, e.note || '']);
        const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.setAttribute('href', URL.createObjectURL(blob));
        link.setAttribute('download', `expenses_${currentMonth}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const navigateMonth = (dir) => {
        const d = new Date(currentMonth + '-01');
        d.setMonth(d.getMonth() + dir);
        setCurrentMonth(d.toISOString().slice(0, 7));
    };

    const monthLabel = new Date(currentMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 mobile-page-pad relative overflow-hidden">
            <Helmet><title>Expenses | Life OS</title></Helmet>

            {/* Ambient BG */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/[0.03] blur-[150px] rounded-full -mr-80 -mt-80 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/[0.03] blur-[150px] rounded-full -ml-64 -mb-64 pointer-events-none" />

            <div className="max-w-[1600px] mx-auto relative z-10 space-y-5 md:space-y-6">
                {/* ── Header ── */}
                <div className="flex flex-col gap-4">
                    <div>
                        <div className="inline-flex items-center px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">
                            Financial OS
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white leading-none">
                            Expense <span className="text-zinc-600">Tracker</span>
                        </h1>
                    </div>

                    {/* Controls row */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Month nav */}
                        <div className="flex items-center p-1 bg-zinc-900 border border-white/5 rounded-2xl h-11 flex-1 min-w-0">
                            <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-white/5 rounded-xl text-zinc-400 transition-all active:scale-90 flex-shrink-0">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="flex-1 text-[11px] md:text-sm font-black uppercase tracking-widest text-zinc-300 text-center truncate px-1">
                                {monthLabel}
                            </span>
                            <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-white/5 rounded-xl text-zinc-400 transition-all active:scale-90 flex-shrink-0">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Add + Export */}
                        <button onClick={() => { setEditData(null); setIsAddModalOpen(true); }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white h-11 px-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 flex-shrink-0 shadow-lg shadow-indigo-500/20">
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Log Entry</span>
                            <span className="sm:hidden">New</span>
                        </button>
                        <button onClick={exportToCSV}
                            className="h-11 px-3 bg-zinc-800 border border-white/5 rounded-2xl text-zinc-400 hover:text-white transition-all active:scale-90 flex-shrink-0">
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* ── Balance Hero Card ── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none" />
                    <div className="flex items-start justify-between mb-5">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                            <Wallet className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-right">
                            <p className="text-white/50 text-[10px] font-black uppercase tracking-widest">Vault Balance</p>
                            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white mt-0.5">
                                ₹{summary.balance.toLocaleString('en-IN')}
                            </h2>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                            <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">Income</p>
                            <p className="text-lg md:text-xl font-black text-white">₹{summary.totalIncome.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                            <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">Expense</p>
                            <p className="text-lg md:text-xl font-black text-white">₹{summary.totalExpense.toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                </motion.div>

                {/* ── Charts Row ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Spending Analytics */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-6 shadow-xl flex flex-col">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-black tracking-tight">Spending Analytics</h3>
                        </div>
                        <div className="flex-1 min-h-[200px] md:min-h-[240px]">
                            <MonthlyBarChart expenses={filteredExpenses} />
                        </div>
                    </motion.div>

                    {/* Category Distribution */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-6 shadow-xl flex flex-col">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                                <Tag className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-black tracking-tight">Distribution</h3>
                        </div>
                        <div className="flex-1 flex items-center justify-center min-h-[200px] md:min-h-[240px]">
                            <CategoryPieChart summary={summary} />
                        </div>
                    </motion.div>
                </div>

                {/* ── Transactions + Budgets ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Activity Feed */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="lg:col-span-2 bg-zinc-900/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] flex flex-col shadow-xl overflow-hidden">
                        <div className="p-5 md:p-6 border-b border-white/5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tighter leading-none">Activity Feed</h3>
                                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] mt-1">Live Transaction Stream</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1 sm:flex-none">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                        <input type="text" placeholder="Filter..."
                                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                            className="bg-black/40 border border-white/5 rounded-xl py-2.5 pl-9 pr-3 text-xs font-black tracking-widest text-white focus:outline-none focus:border-indigo-500/50 w-full sm:w-36 transition-all" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-4 min-h-[280px] max-h-[500px]">
                            <ExpenseTable
                                expenses={filteredExpenses}
                                onDelete={handleDeleteExpense}
                                onEdit={(exp) => { setEditData(exp); setIsAddModalOpen(true); }}
                            />
                        </div>
                    </motion.div>

                    {/* Budget Thresholds */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-6 shadow-xl flex flex-col">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-black tracking-tight">Budgets</h3>
                            </div>
                            <button onClick={() => setIsBudgetModalOpen(true)}
                                className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors px-3 py-1.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 active:scale-95">
                                Adjust
                            </button>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-1">
                            {budgets.length > 0 ? budgets.map(budget => (
                                <BudgetProgress key={budget._id} budget={budget} expenses={expenses} />
                            )) : (
                                <div className="flex flex-col items-center justify-center h-full py-10 text-zinc-600 text-center">
                                    <AlertCircle className="w-10 h-10 mb-3 text-zinc-700" />
                                    <p className="text-sm font-bold text-zinc-500">No Budgets Set</p>
                                    <p className="text-[10px] uppercase tracking-widest mt-1">Configure limits to track</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            <AddExpenseModal
                isOpen={isAddModalOpen}
                onClose={() => { setIsAddModalOpen(false); setEditData(null); }}
                onAdded={fetchData}
                editData={editData}
            />
            <ManageBudgetsModal
                isOpen={isBudgetModalOpen}
                onClose={() => setIsBudgetModalOpen(false)}
                onUpdated={fetchData}
                currentMonth={currentMonth}
            />

            {/* Mobile FAB */}
            <motion.button whileTap={{ scale: 0.9 }}
                onClick={() => setIsAddModalOpen(true)}
                className="md:hidden fixed bottom-24 right-5 w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(99,102,241,0.5)] z-50 text-white border border-white/20 active:scale-95">
                <Plus className="w-7 h-7" />
            </motion.button>
        </div>
    );
}
