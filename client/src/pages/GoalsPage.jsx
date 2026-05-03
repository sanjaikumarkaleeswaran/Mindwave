import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Bot } from 'lucide-react';
import api from '../lib/axios';

/* ── sub-components ── */
import AIChatModal   from '../components/goals/AIChatModal';
import GoalFormModal from '../components/goals/GoalFormModal';
import GoalCard      from '../components/goals/GoalCard';
import DeleteModal   from '../components/goals/DeleteModal';

export default function GoalsPage() {
    const [goals,        setGoals]        = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [showCreate,   setShowCreate]   = useState(false);
    const [showChat,     setShowChat]     = useState(false);
    const [editGoal,     setEditGoal]     = useState(null);
    const [aiGoal,       setAiGoal]       = useState(null);
    const [delGoal,      setDelGoal]      = useState(null);
    const [delLoad,      setDelLoad]      = useState(false);
    const [filter,       setFilter]       = useState('all');
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput,    setChatInput]    = useState('');

    useEffect(() => { fetchGoals(); }, []);

    const fetchGoals = async () => {
        try { const r = await api.get('/goals'); setGoals(Array.isArray(r.data) ? r.data : []); }
        catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleCreate     = g  => setGoals(p => [g, ...p]);
    const handleUpdate     = up => setGoals(p => p.map(g => g._id === up._id ? up : g));
    const handleAIGenerated= ag => setAiGoal(ag);

    const handleDelConfirm = async () => {
        if (!delGoal) return;
        setDelLoad(true);
        try {
            await api.delete(`/goals/${delGoal._id}`);
            setGoals(p => p.filter(g => g._id !== delGoal._id));
            setDelGoal(null);
        } catch (e) { console.error(e); }
        finally { setDelLoad(false); }
    };

    const filtered    = filter === 'all' ? goals : goals.filter(g => g.status === filter);
    const totalActive = goals.filter(g => g.status === 'active').length;
    const totalDone   = goals.filter(g => g.status === 'completed').length;
    const avgProg     = goals.length > 0 ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0;

    const FILTERS = [
        { value: 'all',       label: 'All' },
        { value: 'active',    label: '🔥 Active' },
        { value: 'completed', label: '✅ Completed' },
        { value: 'paused',    label: '⏸ Paused' },
    ];

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto mobile-page-pad overflow-x-hidden">
            <Helmet><title>Goals | Life OS</title></Helmet>

            {/* ── Page header ── */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter leading-tight">
                        Mission{' '}
                        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Control</span>
                    </h1>
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 mt-2 uppercase tracking-[0.2em]">
                        <Target className="w-3 h-3 text-indigo-400" />
                        <span>Set intentions &amp; track milestones.</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setShowChat(true)}
                        className="flex items-center gap-2 px-3 py-2.5 bg-zinc-800/80 border border-zinc-700/50 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-all active:scale-95">
                        <Bot className="h-4 w-4 text-indigo-400" />
                        <span className="hidden sm:inline">Ask AI</span>
                    </button>
                    <button onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">New Goal</span>
                    </button>
                </div>
            </div>

            {/* ── Stats (3-Column Grid) ── */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Active', value: totalActive, color: 'text-emerald-400' },
                    { label: 'Done',   value: totalDone,   color: 'text-indigo-400'  },
                    { label: 'Avg',    value: `${avgProg}%`, color: 'text-purple-400' },
                ].map((s) => (
                    <div key={s.label} className="premium-card p-4 flex flex-col items-center justify-center text-center">
                        <div className="text-[9px] text-zinc-600 uppercase font-black mb-1">{s.label}</div>
                        <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* ── Filter pills ── */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
                {FILTERS.map(f => (
                    <button key={f.value} onClick={() => setFilter(f.value)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${filter === f.value ? 'bg-zinc-800 text-white border-zinc-700 shadow-md' : 'text-zinc-600 hover:text-zinc-400 bg-transparent border-transparent'}`}>
                        {f.label}
                    </button>
                ))}
            </div>

            {/* ── Goal grid ── */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl">
                    <Target className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-400 font-medium">No goals yet</p>
                    <p className="text-zinc-600 text-sm mt-1">Use AI chat or create one manually</p>
                    <div className="flex items-center justify-center gap-3 mt-6">
                        <button onClick={() => setShowChat(true)}
                            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-all flex items-center gap-2">
                            <Bot className="w-4 h-4 text-indigo-400" />Ask AI
                        </button>
                        <button onClick={() => setShowCreate(true)}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all">
                            Create Goal
                        </button>
                    </div>
                </motion.div>
            ) : (
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    <AnimatePresence>
                        {filtered.map(g => (
                            <GoalCard key={g._id} goal={g} onDelete={setDelGoal} onUpdate={handleUpdate} onEdit={setEditGoal} />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* ── Modals ── */}
            <AnimatePresence>
                {showChat && (
                    <AIChatModal
                        initialGoal={typeof showChat === 'object' ? showChat : null}
                        onClose={() => setShowChat(false)}
                        onGenerated={handleAIGenerated}
                        chatMessages={chatMessages}
                        setChatMessages={setChatMessages}
                        chatInput={chatInput}
                        setChatInput={setChatInput}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {aiGoal && (
                    <GoalFormModal initialData={aiGoal} onClose={() => setAiGoal(null)}
                        onSave={g => { handleCreate(g); setAiGoal(null); }}
                        onOpenChat={() => setShowChat(aiGoal)} />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showCreate && <GoalFormModal onClose={() => setShowCreate(false)} onSave={handleCreate} onOpenChat={() => setShowChat(true)} />}
            </AnimatePresence>
            <AnimatePresence>
                {editGoal && (
                    <GoalFormModal initialData={editGoal} onClose={() => setEditGoal(null)}
                        onSave={handleUpdate} onOpenChat={() => setShowChat(editGoal)} />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {delGoal && <DeleteModal goal={delGoal} onClose={() => setDelGoal(null)} onConfirm={handleDelConfirm} loading={delLoad} />}
            </AnimatePresence>
        </div>
    );
}
