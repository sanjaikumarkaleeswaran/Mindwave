import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function MonthlyBarChart({ expenses }) {
    // Group by weeks of the month for a true monthly overview
    const data = [
        { name: 'Week 1', amount: 0 },
        { name: 'Week 2', amount: 0 },
        { name: 'Week 3', amount: 0 },
        { name: 'Week 4', amount: 0 },
        { name: 'Week 5', amount: 0 },
    ];

    expenses.filter(e => e.type === 'expense').forEach(exp => {
        const date = new Date(exp.date);
        const day = date.getDate();
        let weekIdx = 0;
        if (day <= 7) weekIdx = 0;
        else if (day <= 14) weekIdx = 1;
        else if (day <= 21) weekIdx = 2;
        else if (day <= 28) weekIdx = 3;
        else weekIdx = 4;

        data[weekIdx].amount += exp.amount;
    });

    return (
        <div className="w-full h-full min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.3}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#52525b', fontSize: 10, fontWeight: 'black', textAnchor: 'middle' }}
                        dy={10}
                    />
                    <YAxis hide />
                    <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 10 }}
                        contentStyle={{ 
                            backgroundColor: '#09090b', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '16px',
                            fontSize: '11px',
                            fontWeight: 'black',
                            color: '#fff'
                        }}
                        formatter={(value) => [`₹${value.toLocaleString()}`, 'Spent']}
                    />
                    <Bar 
                        dataKey="amount" 
                        radius={[8, 8, 8, 8]} 
                        maxBarSize={40}
                    >
                        {data.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`}
                                fill={entry.amount > 0 ? "url(#barGradient)" : "rgba(255,255,255,0.05)"}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
