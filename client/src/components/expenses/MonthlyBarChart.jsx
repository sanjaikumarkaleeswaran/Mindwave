import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function MonthlyBarChart({ expenses }) {
    // Group by day of week for a "Recent Activity" feel
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = days.map(day => ({ name: day, amount: 0 }));

    const today = new Date();
    const last7Days = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));

    expenses.filter(e => e.type === 'expense' && new Date(e.date) >= last7Days).forEach(exp => {
        const dayName = days[new Date(exp.date).getDay()];
        const dayObj = data.find(d => d.name === dayName);
        if (dayObj) dayObj.amount += exp.amount;
    });

    return (
        <div className="w-full h-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
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
                    />
                    <Bar 
                        dataKey="amount" 
                        radius={[6, 6, 6, 6]} 
                        barSize={32}
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
