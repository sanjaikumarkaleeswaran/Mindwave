import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = [
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6'  // Blue
];

export default function CategoryPieChart({ summary }) {
    const data = Object.entries(summary.categoryBreakdown).map(([name, value]) => ({
        name,
        value
    })).sort((a, b) => b.value - a.value);

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-zinc-600 space-y-2">
                <div className="w-12 h-12 rounded-full border border-dashed border-zinc-800 flex items-center justify-center">
                    <span className="text-xs">0%</span>
                </div>
                <p className="text-[10px] uppercase tracking-widest font-black">No Data</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[220px] relative group">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]} 
                                className="hover:opacity-80 transition-opacity cursor-pointer"
                            />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: '#09090b', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                        }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value) => `₹${value.toLocaleString()}`}
                    />
                </PieChart>
            </ResponsiveContainer>
            
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Spent</span>
                <span className="text-xl font-black text-white">₹{summary.totalExpense.toLocaleString()}</span>
            </div>
        </div>
    );
}
