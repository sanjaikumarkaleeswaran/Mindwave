import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import api from '../lib/axios';
import { Plus, Check, Flame, Trash2, TrendingUp, Calendar, GripVertical, Pencil, History, Sparkles, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import confetti from 'canvas-confetti';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Helper for safe date comparison
const isSameDay = (d1, d2) => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();
};

// Sortable Row Component
function SortableRow({ habit, tableDates, handleToggleDate, handleDelete, getMonthlyProgress, handleUpdateName }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: habit._id });
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(habit.name);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const saveEdit = () => {
        if (editName.trim() !== habit.name) {
            handleUpdateName(habit._id, editName);
        }
        setIsEditing(false);
    };

    return (
        <tr ref={setNodeRef} style={style} className="border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors group">
            <td className="p-4 w-10 hidden md:table-cell">
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-4 h-4 text-zinc-600 hover:text-zinc-400" />
                </div>
            </td>
            <td className="p-4 pl-2 w-1/3 min-w-[140px] sticky left-0 z-10 bg-zinc-900 md:bg-transparent border-r border-zinc-800 md:border-none shadow-[2px_0_5px_rgba(0,0,0,0.3)] md:shadow-none">
                {isEditing ? (
                    <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                        className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white w-full focus:outline-none focus:border-indigo-500"
                        autoFocus
                    />
                ) : (
                    <div onClick={() => setIsEditing(true)} className="cursor-pointer">
                        <div className="font-medium text-white truncate max-w-[120px] md:max-w-none">{habit.name}</div>
                        <Pencil className="w-3 h-3 inline-block ml-2 opacity-0 group-hover:opacity-50" />
                    </div>
                )}
                <div className="text-xs text-zinc-500">Best: {habit.bestStreak}</div>
            </td>
            {tableDates.map((date, i) => {
                const isDone = habit.completedDates.some(d => isSameDay(d, date));
                return (
                    <td key={i} className="p-2 md:p-4 text-center">
                        <button
                            onClick={() => handleToggleDate(habit._id, new Date(date))}
                            className={`w-6 h-6 md:w-8 md:h-8 rounded-lg transition-all ${isDone ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-zinc-800 hover:bg-zinc-700'}`}
                        >
                            {isDone && <Check className="w-3 h-3 md:w-4 md:h-4 text-white mx-auto" />}
                        </button>
                    </td>
                );
            })}
            <td className="p-2 md:p-4 text-center">
                <div className="flex items-center gap-2 justify-center">
                    <Flame className="w-4 h-4 text-orange-500 shrink-0" />
                    <span className="font-bold text-orange-500">{habit.streak}</span>
                </div>
            </td>
            <td className="p-4 hidden md:table-cell">
                <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all" style={{ width: `${getMonthlyProgress(habit)}%` }}></div>
                </div>
                <div className="text-xs text-zinc-500 mt-1">{getMonthlyProgress(habit)}%</div>
            </td>
            <td className="p-2 md:p-4 text-right">
                <button onClick={() => handleDelete(habit._id)} className="text-red-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                </button>
            </td>
        </tr>
    );
}

// Main Component
export default function HabitsPage() {
    const queryClient = useQueryClient();
    const [newHabit, setNewHabit] = useState('');
    const [viewMode, setViewMode] = useState(window.innerWidth < 768 ? 'grid' : 'table');
    const [showCalendar, setShowCalendar] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

    const { data: habits = [], isLoading: loading } = useQuery({
        queryKey: ['habits'],
        queryFn: async () => {
            const res = await api.get('/habits');
            return res.data.sort((a, b) => a.order - b.order);
        }
    });

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const res = await api.post('/chat/analyze-habits');
            setAnalysisResult(res.data.analysis);
        } catch (err) {
            console.error(err);
            alert("Failed to analyze habits.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // DEBUG: Ensure currentDate is active
    useEffect(() => {
        console.log("Habits Page Mounted. Current Date:", currentDate);
    }, [currentDate]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Mutations
    const reorderMutation = useMutation({
        mutationFn: (newHabits) => api.put('/habits/reorder', newHabits.map((h, i) => ({ id: h._id, order: i }))),
        onMutate: async (newHabits) => {
            await queryClient.cancelQueries(['habits']);
            const previous = queryClient.getQueryData(['habits']);
            queryClient.setQueryData(['habits'], newHabits);
            return { previous };
        },
        onError: (err, newHabits, context) => queryClient.setQueryData(['habits'], context.previous),
        onSettled: () => queryClient.invalidateQueries(['habits'])
    });

    const addMutation = useMutation({
        mutationFn: (name) => api.post('/habits', { name }),
        onSuccess: () => {
            setNewHabit('');
            queryClient.invalidateQueries(['habits']);
        }
    });

    const toggleMutation = useMutation({
        mutationFn: async ({ id, date }) => {
            // Send standard YYYY-MM-DD string (Local Time)
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - (offset * 60 * 1000));
            const dateStr = localDate.toISOString().split('T')[0];
            return api.put(`/habits/${id}/toggle`, { date: dateStr });
        },
        onMutate: async ({ id, date }) => {
            await queryClient.cancelQueries(['habits']);
            const previousHabits = queryClient.getQueryData(['habits']);

            queryClient.setQueryData(['habits'], old => old.map(h => {
                if (h._id === id) {
                    const isDone = h.completedDates.some(d => isSameDay(d, date));
                    // Check logic for confetti (optimistic)
                    if (!isDone && isSameDay(date, new Date())) {
                        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                    }

                    // Toggle date locally for instant UI
                    let newDates = [...h.completedDates];
                    if (isDone) {
                        newDates = newDates.filter(d => !isSameDay(d, date));
                    } else {
                        newDates.push(date.toISOString());
                    }

                    // Simple streak update (approximate)
                    let newStreak = h.streak;
                    if (!isDone && isSameDay(date, new Date())) newStreak += 1; // Increment if doing today

                    return { ...h, completedDates: newDates, streak: newStreak };
                }
                return h;
            }));

            return { previousHabits };
        },
        onError: (err, vars, context) => queryClient.setQueryData(['habits'], context.previousHabits),
        onSettled: () => queryClient.invalidateQueries(['habits'])
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/habits/${id}`),
        onMutate: async (id) => {
            await queryClient.cancelQueries(['habits']);
            const previous = queryClient.getQueryData(['habits']);
            queryClient.setQueryData(['habits'], old => old.filter(h => h._id !== id));
            return { previous };
        },
        onError: (err, id, context) => queryClient.setQueryData(['habits'], context.previous),
        onSettled: () => queryClient.invalidateQueries(['habits'])
    });

    const updateNameMutation = useMutation({
        mutationFn: ({ id, name }) => api.put(`/habits/${id}`, { name }),
        onSettled: () => queryClient.invalidateQueries(['habits'])
    });

    // Handlers
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = habits.findIndex(h => h._id === active.id);
        const newIndex = habits.findIndex(h => h._id === over.id);
        const newHabits = arrayMove(habits, oldIndex, newIndex);
        reorderMutation.mutate(newHabits);
    };

    const handleAdd = (e) => {
        e.preventDefault();
        if (!newHabit.trim()) return;
        addMutation.mutate(newHabit);
    };

    const handleToggleDate = (id, date) => {
        toggleMutation.mutate({ id, date });
    };

    const handleDelete = (id) => {
        if (!confirm('Delete this habit?')) return;
        deleteMutation.mutate(id);
    };

    const handleUpdateName = (id, newName) => {
        updateNameMutation.mutate({ id, name: newName });
    };

    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d);
        }
        return days;
    };

    const getLast30Days = () => {
        const days = [];
        // Calculate based on last 30 days
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d);
        }
        return days;
    };

    const getMonthlyProgress = (habit) => {
        const last30 = getLast30Days();
        // Check completion count in the last 30 days
        const completed = last30.filter(d => habit.completedDates.some(cd => isSameDay(cd, d))).length;
        // Return percentage
        return Math.round((completed / 30) * 100);
    };

    const getWeeklyProgress = (habit) => {
        const last7 = getLast7Days();
        const completed = last7.filter(d => habit.completedDates.some(cd => isSameDay(cd, d))).length;
        return Math.round((completed / 7) * 100);
    };

    const getHeatmapData = () => {
        const data = [];
        for (let i = 59; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const completedCount = habits.filter(h => h.completedDates.some(cd => isSameDay(cd, d))).length;
            const intensity = habits.length > 0 ? completedCount / habits.length : 0;
            data.push({ date: d, intensity });
        }
        return data;
    };

    const getDailyProgress = (date) => {
        if (!habits.length) return 0;
        const validHabits = habits.length;
        const completedCount = habits.filter(h =>
            h.completedDates.some(d => isSameDay(d, date))
        ).length;
        return Math.round((completedCount / validHabits) * 100);
    };

    const getDailyStatus = (percentage) => {
        if (percentage === 100) return { text: "Perfect!", color: "text-green-400" };
        if (percentage >= 80) return { text: "Well done", color: "text-indigo-400" };
        if (percentage >= 50) return { text: "Good job", color: "text-blue-400" };
        return { text: "Keep going", color: "text-zinc-500" };
    };

    const heatmapData = getHeatmapData();
    const tableDates = getLast7Days();

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10 relative">
            <Helmet>
                <title>Habit Tracker | Life OS</title>
            </Helmet>
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 md:gap-4">
                <div className="w-full md:w-auto">
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Habit Tracker</h1>
                    <div className="flex items-center gap-2 text-sm text-zinc-500 mt-2">
                        <span className="uppercase tracking-wider font-medium">{currentDate.toLocaleDateString('en-US', { weekday: 'long' })}</span>
                        <span className="w-1 h-1 bg-zinc-600 rounded-full"></span>
                        <span>
                            {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="flex-1 md:flex-none px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
                    >
                        <Sparkles className="w-4 h-4" />
                        {isAnalyzing ? 'Analyzing...' : 'AI Insights'}
                    </button>

                    <button
                        onClick={() => setShowCalendar(true)}
                        className="flex-1 md:flex-none px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        <Calendar className="w-4 h-4" />
                        <span className="hidden sm:inline">Calendar View</span>
                        <span className="sm:hidden">Calendar</span>
                    </button>

                    <div className="flex bg-zinc-900 border border-zinc-700 rounded-lg p-1 w-full md:w-auto overflow-x-auto">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all text-center ${viewMode === 'table' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                        >
                            Table
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all text-center ${viewMode === 'grid' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}
                        >
                            Grid
                        </button>
                        <button
                            onClick={() => setViewMode('history')}
                            className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all text-center ${viewMode === 'history' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'} flex items-center justify-center gap-2`}
                        >
                            <History className="w-3.5 h-3.5" />
                            History
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Modal */}
            {
                showCalendar && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowCalendar(false)}>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">Calendar View</h2>
                                <button onClick={() => setShowCalendar(false)} className="text-zinc-400 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="grid grid-cols-7 gap-2">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="text-center text-xs font-medium text-zinc-500 py-2">{day}</div>
                                ))}
                                {Array.from({ length: 35 }).map((_, i) => {
                                    const date = new Date();
                                    date.setDate(date.getDate() - date.getDay() + i - 28);
                                    const isToday = isSameDay(date, new Date());
                                    return (
                                        <div key={i} className={`aspect-square p-2 rounded-lg ${isToday ? 'bg-indigo-900/50 border border-indigo-500' : 'bg-zinc-800/50'}`}>
                                            <div className={`text-right text-sm mb-2 ${isSameDay(date, new Date()) ? 'text-indigo-400 font-bold' : 'text-zinc-500'}`}>{date.getDate()}</div>
                                            <div className="space-y-1">
                                                {habits.map(h => {
                                                    const isDone = h.completedDates.some(cd => isSameDay(cd, date));
                                                    if (!isDone) return null;
                                                    return (
                                                        <div key={h._id} className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 truncate">
                                                            {h.name}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Stats */}
            <div className="flex gap-6 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-400">{getDailyProgress(new Date())}%</div>
                    <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Today Progress</div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-bold text-white">{habits.length}</div>
                    <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Active Streaks</div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">{Math.round(habits.reduce((sum, h) => sum + getWeeklyProgress(h), 0) / (habits.length || 1))}%</div>
                    <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Weekly Consistency</div>
                </div>
            </div>

            {/* Heatmap */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-4 h-4 text-zinc-400" />
                    <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Last 60 Days Consistency</h2>
                </div>
                <div className="flex gap-1">
                    {heatmapData.map((d, i) => {
                        let bgClass = "bg-zinc-800/50";
                        if (d.intensity > 0) bgClass = "bg-indigo-900/60";
                        if (d.intensity > 0.3) bgClass = "bg-indigo-700/60";
                        if (d.intensity > 0.6) bgClass = "bg-indigo-500/80";
                        if (d.intensity === 1) bgClass = "bg-indigo-500 shadow-[0_0_4px_rgba(99,102,241,0.4)]";

                        const isToday = isSameDay(d.date, new Date());
                        return (
                            <div
                                key={i}
                                title={`${d.date.toDateString()}: ${Math.round(d.intensity * 100)}%`}
                                className={`w-2 h-8 rounded-sm ${bgClass} ${isToday ? 'ring-1 ring-white' : ''} transition-all hover:opacity-80`}
                            ></div>
                        )
                    })}
                </div>
            </div>

            {/* Main Content */}
            <div className="space-y-6">
                {viewMode !== 'history' && (
                    <form onSubmit={handleAdd} className="relative max-w-xl mx-auto md:mx-0">
                        <input
                            type="text"
                            value={newHabit}
                            onChange={(e) => setNewHabit(e.target.value)}
                            placeholder="+ Add new habit"
                            className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:bg-zinc-900 transition-all font-medium"
                        />
                    </form>
                )}

                {viewMode === 'table' ? (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-zinc-800 bg-zinc-900/50">
                                            <th className="p-4 w-10 hidden md:table-cell"></th>
                                            <th className="p-4 pl-2 font-medium text-zinc-400 w-1/3 min-w-[140px] sticky left-0 z-10 bg-zinc-900/95 backdrop-blur-sm md:bg-transparent md:static border-r border-zinc-800 md:border-none shadow-[2px_0_5px_rgba(0,0,0,0.3)] md:shadow-none">Habit</th>
                                            {tableDates.map((date, i) => {
                                                const isToday = isSameDay(date, new Date());
                                                return (
                                                    <th key={i} className={`p-2 md:p-4 font-medium text-center min-w-[3rem] ${isToday ? 'text-indigo-400' : 'text-zinc-400'}`}>
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[10px] uppercase tracking-wider">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]}</span>
                                                            <span className="text-xs">{date.getDate()}</span>
                                                        </div>
                                                    </th>
                                                );
                                            })}
                                            <th className="p-2 md:p-4 font-medium text-zinc-400 text-center">Streak</th>
                                            <th className="p-4 font-medium text-zinc-400 hidden md:table-cell">Progress</th>
                                            <th className="p-2 md:p-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <SortableContext items={habits.map(h => h._id)} strategy={verticalListSortingStrategy}>
                                            {habits.map(habit => (
                                                <SortableRow
                                                    key={habit._id}
                                                    habit={habit}
                                                    tableDates={tableDates}
                                                    handleToggleDate={handleToggleDate}
                                                    handleDelete={handleDelete}
                                                    getMonthlyProgress={getMonthlyProgress}
                                                    handleUpdateName={handleUpdateName}
                                                />
                                            ))}
                                        </SortableContext>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </DndContext>
                ) : viewMode === 'history' ? (
                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-sm">
                        <div className="overflow-x-auto relative">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-zinc-800 bg-zinc-900/50">
                                        <th className="p-4 font-medium text-zinc-400 w-48 sticky left-0 z-20 bg-zinc-900/95 backdrop-blur-sm shadow-[2px_0_5px_rgba(0,0,0,0.3)] border-r border-zinc-800">Date</th>
                                        <th className="p-4 font-medium text-zinc-400 w-32 sticky left-48 z-20 bg-zinc-900/95 backdrop-blur-sm shadow-[2px_0_5px_rgba(0,0,0,0.3)] border-r border-zinc-800">Daily Progress</th>
                                        {habits.map(h => (
                                            <th key={h._id} className="p-4 font-medium text-zinc-400 text-center min-w-[4rem] text-xs uppercase tracking-wider">
                                                <div className="[writing-mode:vertical-rl] transform h-24 flex items-center justify-center">{h.name.substring(0, 10)}</div>
                                            </th>
                                        ))}
                                        <th className="p-4 font-medium text-zinc-400 text-right min-w-[100px]">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {Array.from({ length: 30 }).map((_, i) => {
                                        const d = new Date();
                                        d.setDate(d.getDate() - i);
                                        const progress = getDailyProgress(d);
                                        const status = getDailyStatus(progress);
                                        return (
                                            <tr key={i} className="hover:bg-zinc-800/30 transition-colors group">
                                                <td className="p-4 sticky left-0 z-10 bg-zinc-900 group-hover:bg-zinc-800 transition-colors border-r border-zinc-800 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                                                    <div className="font-medium text-white">{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                                    <div className="text-xs text-zinc-500">{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                                </td>
                                                <td className="p-4 sticky left-48 z-10 bg-zinc-900 group-hover:bg-zinc-800 transition-colors border-r border-zinc-800 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                                                    <div className="w-full bg-zinc-800 rounded-full h-2">
                                                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                                                    </div>
                                                    <div className="text-xs text-zinc-500 mt-1">{progress}%</div>
                                                </td>
                                                {habits.map(h => {
                                                    const isDone = h.completedDates.some(cd => isSameDay(cd, d));
                                                    return (
                                                        <td key={h._id} className="p-4 text-center">
                                                            <button
                                                                onClick={() => handleToggleDate(h._id, d)}
                                                                className={`w-6 h-6 rounded transition-all ${isDone ? 'bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.4)]' : 'bg-zinc-800 hover:bg-zinc-700'}`}
                                                            >
                                                                {isDone && <Check className="w-3 h-3 text-white mx-auto" />}
                                                            </button>
                                                        </td>
                                                    );
                                                })}
                                                <td className="p-4 text-right">
                                                    <span className={`text-sm font-medium ${status.color}`}>{status.text}</span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {habits.map(habit => (
                            <div key={habit._id} className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-medium text-white">{habit.name}</h3>
                                    <button onClick={() => handleDelete(habit._id)} className="text-red-500 hover:text-red-400">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Flame className="w-4 h-4 text-orange-500" />
                                    <span className="text-sm text-zinc-400">Streak: <span className="font-bold text-white">{habit.streak}</span></span>
                                </div>
                                <div className="grid grid-cols-7 gap-1 mb-3">
                                    {getLast7Days().map((date, i) => {
                                        const isDone = habit.completedDates.some(d => isSameDay(d, date));
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => handleToggleDate(habit._id, new Date(date))}
                                                className={`aspect-square rounded transition-all ${isDone ? 'bg-indigo-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}
                                            >
                                                {isDone && <Check className="w-3 h-3 text-white mx-auto" />}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => handleToggleDate(habit._id, new Date())}
                                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors"
                                >
                                    {habit.completedDates.some(d => isSameDay(d, new Date())) ? 'Completed Today' : 'Mark Complete'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Yearly Overview */}
            <div className="pt-8 border-t border-zinc-800">
                <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-zinc-400" />
                    Yearly Overview {new Date().getFullYear()}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 12 }).map((_, monthIndex) => {
                        const year = new Date().getFullYear();
                        const firstDay = new Date(year, monthIndex, 1);
                        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
                        const startingDayOfWeek = firstDay.getDay();
                        const monthName = firstDay.toLocaleString('default', { month: 'long' });

                        const slots = [];
                        for (let i = 0; i < startingDayOfWeek; i++) slots.push(null);
                        for (let i = 1; i <= daysInMonth; i++) slots.push(new Date(year, monthIndex, i));

                        return (
                            <div key={monthIndex} className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-xl hover:border-zinc-700 transition-colors">
                                <h3 className="text-sm font-semibold text-zinc-300 mb-3">{monthName}</h3>

                                <div className="grid grid-cols-7 gap-1">
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                        <div key={i} className="text-[8px] text-zinc-600 text-center font-medium">{d}</div>
                                    ))}

                                    {slots.map((date, i) => {
                                        if (!date) return <div key={i} className="aspect-square"></div>;

                                        const completedCount = habits.filter(h =>
                                            h.completedDates.some(cd => isSameDay(cd, date))
                                        ).length;

                                        const intensity = habits.length > 0 ? completedCount / habits.length : 0;

                                        let bgClass = "bg-zinc-800/50";
                                        if (intensity > 0) bgClass = "bg-indigo-900/60";
                                        if (intensity > 0.3) bgClass = "bg-indigo-700/60";
                                        if (intensity > 0.6) bgClass = "bg-indigo-500/80";
                                        if (intensity === 1) bgClass = "bg-indigo-500 shadow-[0_0_4px_rgba(99,102,241,0.4)]";

                                        const isToday = isSameDay(date, new Date());

                                        return (
                                            <div
                                                key={i}
                                                title={`${date.toDateString()}: ${Math.round(intensity * 100)}%`}
                                                className={`aspect-square rounded-sm ${bgClass} ${isToday ? 'ring-1 ring-white' : ''} transition-all hover:opacity-80 flex items-center justify-center`}
                                            >
                                                <span className="text-[6px] text-zinc-400">{date.getDate()}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* AI Analysis Modal */}
            {
                analysisResult && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in" onClick={() => setAnalysisResult(null)}>
                        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-indigo-500/30 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl shadow-indigo-500/10" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-indigo-500/20 flex justify-between items-center sticky top-0 bg-zinc-900/95 backdrop-blur z-10">
                                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-indigo-400" />
                                    AI Insights
                                </h2>
                                <button onClick={() => setAnalysisResult(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-zinc-400 hover:text-white" />
                                </button>
                            </div>
                            <div className="p-8 prose prose-invert prose-p:text-zinc-300 prose-headings:text-indigo-200 prose-li:text-zinc-300 max-w-none">
                                <ReactMarkdown>{analysisResult}</ReactMarkdown>
                            </div>
                            <div className="p-6 border-t border-indigo-500/20 bg-zinc-900/50 text-center">
                                <button
                                    onClick={() => setAnalysisResult(null)}
                                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                                >
                                    Got it, let's crush it! 🚀
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
