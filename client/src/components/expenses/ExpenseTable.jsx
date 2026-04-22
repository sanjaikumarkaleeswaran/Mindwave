import { Trash2, Edit2, ArrowUpRight, ArrowDownLeft, Tag, Calendar } from 'lucide-react';

export default function ExpenseTable({ expenses, onDelete, onEdit }) {
    if (expenses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-white/5 flex items-center justify-center">
                    <Tag className="w-8 h-8 opacity-20" />
                </div>
                <div className="text-center">
                    <p className="font-bold text-white">No transactions yet</p>
                    <p className="text-sm">Add your first expense or income to start tracking.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-white/5 bg-black/20">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/5">
                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Note</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-zinc-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-zinc-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                        {expenses.map((exp) => (
                            <tr key={exp._id} className="hover:bg-white/[0.04] transition-all group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${exp.type === 'income' ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]'}`}>
                                            {exp.type === 'income' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="text-sm text-white font-bold">{new Date(exp.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-0.5">{new Date(exp.date).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl">
                                        <Tag className="w-3 h-3 text-zinc-500" />
                                        <span className="text-[11px] font-black text-zinc-300 uppercase tracking-wider">
                                            {exp.category}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className="text-sm text-zinc-400 font-medium line-clamp-1">{exp.note || 'No description provided'}</span>
                                </td>
                                <td className={`px-8 py-6 text-right font-black font-mono text-lg tracking-tight ${exp.type === 'income' ? 'text-green-400' : 'text-white'}`}>
                                    {exp.type === 'income' ? '+' : '-'}₹{exp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                        <button onClick={() => onEdit(exp)} className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-400 hover:text-indigo-400 transition-colors border border-white/5">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => onDelete(exp._id)} className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-400 hover:text-red-400 transition-colors border border-white/5">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {expenses.map((exp) => (
                    <div key={exp._id} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between group active:scale-[0.98] transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${exp.type === 'income' ? 'bg-green-500/10 text-green-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                {exp.type === 'income' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-zinc-200 truncate">{exp.category}</span>
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight shrink-0">{new Date(exp.date).toLocaleDateString()}</span>
                                </div>
                                <span className="text-xs text-zinc-500 truncate block">{exp.note || 'No note'}</span>
                            </div>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                            <div className={`font-bold font-mono text-base ${exp.type === 'income' ? 'text-green-400' : 'text-white'}`}>
                                {exp.type === 'income' ? '+' : '-'}₹{exp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="flex items-center justify-end gap-1 mt-1">
                                <button onClick={() => onEdit(exp)} className="p-1.5 text-zinc-600 hover:text-indigo-400">
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => onDelete(exp._id)} className="p-1.5 text-zinc-600 hover:text-red-400">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
