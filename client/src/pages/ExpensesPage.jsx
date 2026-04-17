import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Wallet, 
    TrendingUp, 
    TrendingDown, 
    Plus, 
    Filter, 
    Download, 
    PieChart as PieIcon, 
    BarChart3, 
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Search,
    Tag
} from 'lucide-react';
import api from '../lib/axios';
import AddExpenseModal from '../components/expenses/AddExpenseModal';
import ExpenseTable from '../components/expenses/ExpenseTable';
import CategoryPieChart from '../components/expenses/CategoryPieChart';
import MonthlyBarChart from '../components/expenses/MonthlyBarChart';
import BudgetProgress from '../components/expenses/BudgetProgress';
import ManageBudgetsModal from '../components/expenses/ManageBudgetsModal';

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState([]);
    const [summary, setSummary] = useState({
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        categoryBreakdown: {}
    });
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
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

    useEffect(() => {
        fetchData();
    }, [currentMonth]);

    const handlePrevMonth = () => {
        const d = new Date(currentMonth + '-01');
        d.setMonth(d.getMonth() - 1);
        setCurrentMonth(d.toISOString().slice(0, 7));
    };

    const handleNextMonth = () => {
        const d = new Date(currentMonth + '-01');
        d.setMonth(d.getMonth() + 1);
        setCurrentMonth(d.toISOString().slice(0, 7));
    };

    const handleDeleteExpense = async (id) => {
        if (!window.confirm('Are you sure you want to delete this transaction?')) return;
        try {
            await api.delete(`/expenses/${id}`);
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const filteredExpenses = expenses.filter(exp => 
        (exp.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exp.note || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const exportToCSV = () => {
        const headers = ['Date', 'Type', 'Amount', 'Category', 'Note'];
        const rows = expenses.map(e => [
            new Date(e.date).toLocaleDateString(),
            e.type,
            e.amount,
            e.category,
            e.note || ''
        ]);
        
        const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `mindwave_expenses_${currentMonth}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const monthLabel = new Date(currentMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 pt-20 md:pt-8 pb-32 md:pb-12 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/[0.03] blur-[150px] rounded-full -mr-96 -mt-96 animate-blob" />
            <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-purple-500/[0.03] blur-[150px] rounded-full -ml-96 -mb-96 animate-blob animation-delay-4000" />

            <div className="max-w-[1600px] mx-auto relative z-10 space-y-8">
                {/* Modern Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1 min-h-[22px] flex items-center justify-center">
                                Financial OS v2.0
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-none">
                            Expense <span className="text-zinc-600">Tracker</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-3 mt-4 md:mt-0">
                        <div className="flex items-center p-1 bg-zinc-900 border border-white/5 rounded-2xl h-[46px]">
                            <button 
                                onClick={() => {
                                    const date = new Date(currentMonth + '-01');
                                    date.setMonth(date.getMonth() - 1);
                                    setCurrentMonth(date.toISOString().slice(0, 7));
                                }}
                                className="p-2 hover:bg-white/5 rounded-xl text-zinc-400 transition-all active:scale-90 flex items-center justify-center"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="px-3 md:px-4 text-[11px] md:text-sm font-black uppercase tracking-widest text-zinc-300 min-w-[120px] md:min-w-[140px] text-center whitespace-nowrap mt-0.5">
                                {monthLabel}
                            </span>
                            <button 
                                onClick={() => {
                                    const date = new Date(currentMonth + '-01');
                                    date.setMonth(date.getMonth() + 1);
                                    setCurrentMonth(date.toISOString().slice(0, 7));
                                }}
                                className="p-2 hover:bg-white/5 rounded-xl text-zinc-400 transition-all active:scale-90 flex items-center justify-center"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                        <button 
                            onClick={() => { setEditData(null); setIsAddModalOpen(true); }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white h-[46px] px-4 md:px-6 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all active:scale-95 shadow-2xl shadow-indigo-500/20 flex items-center justify-center gap-2 group border border-indigo-400/20"
                        >
                            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                            <span className="hidden sm:inline mt-0.5">Log Entry</span>
                            <span className="sm:hidden mt-0.5">New</span>
                        </button>
                    </div>
                </header>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:auto-rows-[240px]">
                    
                    {/* Main Balance Hero (Bento 4x2) */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="md:col-span-4 md:row-span-2 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[3rem] p-10 flex flex-col justify-between relative overflow-hidden shadow-2xl group"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000" />
                        
                        <div>
                            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl mb-6">
                                <Wallet className="w-7 h-7 text-white" />
                            </div>
                            <p className="text-white/60 text-sm font-black uppercase tracking-[0.3em]">Vault Balance</p>
                            <h2 className="text-6xl font-black tracking-tighter text-white mt-2">
                                ₹{summary.balance.toLocaleString('en-IN')}
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/10 backdrop-blur-md rounded-[1.75rem] p-5 border border-white/10">
                                <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">Income</p>
                                <p className="text-xl font-black text-white">₹{summary.totalIncome.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-[1.75rem] p-5 border border-white/10">
                                <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">Expense</p>
                                <p className="text-xl font-black text-white">₹{summary.totalExpense.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Analytics Chart (Bento 8x2) */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="md:col-span-8 md:row-span-2 bg-zinc-900/50 border border-white/5 rounded-[3rem] p-8 flex flex-col shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <h3 className="text-xl font-black tracking-tight leading-none mt-1">Spending Analytics</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black text-zinc-500 uppercase tracking-widest">7 Days</div>
                                <div className="px-3 py-1 bg-indigo-500/10 rounded-lg text-[10px] font-black text-indigo-400 uppercase tracking-widest border border-indigo-500/20 text-glow">30 Days</div>
                            </div>
                        </div>
                        <div className="flex-1 min-h-[300px]">
                            <MonthlyBarChart expenses={filteredExpenses} />
                        </div>
                    </motion.div>

                    {/* Category Breakdown (Bento 4x2) */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="md:col-span-4 md:row-span-2 bg-zinc-900/50 border border-white/5 rounded-[3rem] p-8 flex flex-col shadow-2xl overflow-hidden"
                    >
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                                <Tag className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-black tracking-tight leading-none mt-1">Distribution</h3>
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                            <CategoryPieChart summary={summary} />
                        </div>
                    </motion.div>

                    {/* Transactions Feed (Bento 8x4) */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="md:col-span-8 md:row-span-4 bg-zinc-900/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] flex flex-col shadow-2xl"
                    >
                        <div className="p-8 md:p-10 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tighter leading-none mb-2">Activity Feed</h3>
                                <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em]">Live Transaction Stream</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                    <input 
                                        type="text"
                                        placeholder="FILTER RECORDS..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="bg-black/40 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-[10px] font-black tracking-widest text-white focus:outline-none focus:border-indigo-500/50 w-48 transition-all"
                                    />
                                </div>
                                <button 
                                    onClick={exportToCSV}
                                    className="p-3 bg-zinc-800 border border-white/5 rounded-xl text-zinc-400 hover:text-white transition-all active:scale-90"
                                >
                                    <Download className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                            <ExpenseTable 
                                expenses={filteredExpenses} 
                                onDelete={handleDeleteExpense}
                                onEdit={(exp) => { setEditData(exp); setIsAddModalOpen(true); }}
                            />
                        </div>
                    </motion.div>

                    {/* Budget Progress (Bento 4x2) */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="md:col-span-4 md:row-span-2 bg-zinc-900/50 border border-white/5 rounded-[3rem] p-8 flex flex-col shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <h3 className="text-xl font-black tracking-tight leading-none mt-1">Thresholds</h3>
                            </div>
                            <button 
                                onClick={() => setIsBudgetModalOpen(true)}
                                className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                                Adjust
                            </button>
                        </div>
                        <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2">
                            {budgets.length > 0 ? budgets.map(budget => (
                                <BudgetProgress key={budget._id} budget={budget} expenses={expenses} />
                            )) : (
                                <div className="flex flex-col items-center justify-center h-full text-zinc-600 text-center">
                                    <p className="text-sm font-bold">No Budgets Set</p>
                                    <p className="text-[10px] uppercase tracking-widest mt-1">Configure limits to track health</p>
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
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsAddModalOpen(true)}
                className="md:hidden fixed bottom-24 right-6 w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-full flex items-center justify-center shadow-[0_15px_40px_rgba(99,102,241,0.5)] z-50 text-white border border-white/20"
            >
                <Plus className="w-8 h-8 drop-shadow-lg" />
            </motion.button>
        </div>
    );
}
