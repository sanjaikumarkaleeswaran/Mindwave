import { useAuth } from '../context/AuthContext';
import { Sparkles, Activity, Music } from 'lucide-react';

export default function Dashboard() {
    const { user } = useAuth();
    const time = new Date().getHours();
    const greeting = time < 12 ? 'Good morning' : time < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold mb-2">{greeting}, {user?.name}</h1>
                <p className="text-zinc-400">Your digital brain is online and ready.</p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Quick Chat */}
                <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Sparkles className="w-6 h-6 text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Ask AI</h3>
                    <p className="text-zinc-500 text-sm">Draft an email, plan your day, or just chat.</p>
                </div>

                {/* Habits Status */}
                <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Activity className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Habit Streaks</h3>
                    <p className="text-zinc-500 text-sm">You're on a roll! Check your daily goals.</p>
                </div>

                {/* Music Suggestions */}
                <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Music className="w-6 h-6 text-pink-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Jump Back In</h3>
                    <p className="text-zinc-500 text-sm">Continue listening to your 'Focus' mix.</p>
                </div>
            </div>
        </div>
    );
}
