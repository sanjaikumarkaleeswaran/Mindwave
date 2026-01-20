import { useState, useEffect } from 'react';
import api from '../lib/axios';
import { Plus, Check, Award } from 'lucide-react';

export default function HabitsPage() {
    const [habits, setHabits] = useState([]);
    const [newHabit, setNewHabit] = useState('');

    const fetchHabits = async () => {
        try {
            const res = await api.get('/habits');
            setHabits(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchHabits();
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newHabit.trim()) return;
        try {
            await api.post('/habits', { name: newHabit });
            setNewHabit('');
            fetchHabits();
        } catch (err) {
            console.error(err);
        }
    };

    const handleComplete = async (id) => {
        try {
            await api.put(`/habits/${id}/complete`);
            fetchHabits();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Habit Tracker</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* List */}
                <div className="space-y-4">
                    {habits.map(habit => (
                        <div key={habit._id} className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => handleComplete(habit._id)}
                                    className="w-8 h-8 rounded-full border-2 border-zinc-600 hover:border-green-500 hover:bg-green-500/10 flex items-center justify-center transition-all"
                                >
                                    <Check className="w-4 h-4 text-transparent group-hover:text-green-500" />
                                </button>
                                <div>
                                    <h3 className="font-semibold">{habit.name}</h3>
                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                        <Award className="w-3 h-3 text-orange-500" />
                                        <span>{habit.streak} day streak</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add New */}
                    <form onSubmit={handleAdd} className="mt-4">
                        <div className="relative">
                            <input
                                type="text"
                                value={newHabit}
                                onChange={(e) => setNewHabit(e.target.value)}
                                placeholder="Add a new habit..."
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                            />
                            <button type="submit" className="absolute right-2 top-2 p-1.5 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
