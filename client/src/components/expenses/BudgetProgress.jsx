import { motion } from 'framer-motion';

export default function BudgetProgress({ budget, expenses }) {
    const spent = expenses
        .filter(e => e.type === 'expense' && e.category === budget.category)
        .reduce((sum, e) => sum + e.amount, 0);
    
    const percentage = Math.min((spent / budget.limit) * 100, 100);
    const isOver = spent > budget.limit;

    return (
        <div className="space-y-3 group">
            <div className="flex justify-between items-end px-1">
                <div>
                    <h4 className="text-[13px] font-black text-white tracking-tight">{budget.category}</h4>
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-0.5">
                        {isOver ? 'Limit Exceeded' : `${Math.round(percentage)}% of limit`}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-black text-white">₹{spent.toLocaleString()}</p>
                    <p className="text-[9px] font-bold text-zinc-600">/ ₹{budget.limit.toLocaleString()}</p>
                </div>
            </div>
            
            <div className="h-2 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.05] p-[1px]">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${isOver ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]'}`}
                />
            </div>
        </div>
    );
}
