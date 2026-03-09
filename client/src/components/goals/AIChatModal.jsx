import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bot, PenLine, X, Send, AlertCircle, Sparkles, Calendar, ListChecks } from 'lucide-react';
import { Target } from 'lucide-react';
import api from '../../lib/axios';
import { fmtDate } from './goalHelpers.jsx';

export default function AIChatModal({ onClose, onGenerated, initialGoal = null, chatMessages, setChatMessages, chatInput, setChatInput }) {
    const navigate = useNavigate();
    const isEditMode = !!(initialGoal && initialGoal.title);

    useEffect(() => {
        const currentGoalId = initialGoal?._id || 'new';
        if (chatMessages.length === 0 || chatMessages.__goalId !== currentGoalId) {
            const arr = [{
                role: 'ai',
                text: isEditMode
                    ? `Hi! 👋 I see you're editing **"${initialGoal.title}"**.\n\nTell me what you'd like to change (e.g. "push the target date by 2 weeks", "add more steps for learning the basics").`
                    : "Hi! 👋 Tell me about the goal you'd like to achieve. Describe it in your own words — I'll turn it into a structured plan you can edit.",
            }];
            arr.__goalId = currentGoalId;
            setChatMessages(arr);
        }
    }, [initialGoal, isEditMode, chatMessages.length]);

    const [loading, setLoading] = useState(false);
    const [error, setError]   = useState('');
    const bottomRef = useRef(null);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

    const send = async () => {
        const msg = chatInput.trim();
        if (!msg || loading) return;
        setChatInput(''); setError('');
        setChatMessages(p => {
            const arr = [...p, { role: 'user', text: msg }];
            arr.__goalId = p.__goalId;
            return arr;
        });
        setLoading(true);
        try {
            setChatMessages(p => {
                const arr = [...p, { role: 'ai', text: isEditMode ? '⏳ Modifying your goal plan…' : '⏳ Generating your goal plan…', loading: true }];
                arr.__goalId = p.__goalId;
                return arr;
            });
            const res  = await api.post('/goals/ai-create', { message: msg, existingGoal: isEditMode ? initialGoal : undefined });
            const goal = res.data.goal;
            if (isEditMode && initialGoal._id) goal._id = initialGoal._id;

            setChatMessages(p => {
                const arr = p.filter(m => !m.loading).concat({
                    role: 'ai',
                    text: `✅ I've ${isEditMode ? 'updated the' : 'created a'} goal plan for you! Review the details below.`,
                    goal,
                });
                arr.__goalId = p.__goalId;
                return arr;
            });
        } catch (e) {
            setChatMessages(p => { const arr = p.filter(m => !m.loading); arr.__goalId = p.__goalId; return arr; });
            setError(e?.response?.data?.msg || 'AI failed. Try again.');
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="bg-zinc-900 border border-zinc-700/50 rounded-t-2xl md:rounded-2xl w-full md:max-w-lg h-[85vh] md:h-[600px] flex flex-col shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800 shrink-0">
                    <div className="p-2 bg-indigo-500/15 rounded-xl"><Bot className="w-5 h-5 text-indigo-400" /></div>
                    <div className="flex-1">
                        <h2 className="text-white font-bold text-base">AI Goal Creator</h2>
                        <p className="text-zinc-500 text-xs">Describe your goal — AI builds the plan</p>
                    </div>
                    <button onClick={() => { onClose(); navigate('/chat'); }} title="Open main AI Chat instead"
                        className="p-2 hover:bg-indigo-500/15 rounded-full transition-colors group">
                        <PenLine className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-zinc-400" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    {chatMessages.map((m, i) => (
                        <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {m.role === 'ai' && (
                                <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                                </div>
                            )}
                            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-zinc-800 border border-zinc-700/50 text-zinc-200 rounded-tl-sm'}`}>
                                {m.loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            {[0, 1, 2].map(j => <div key={j} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />)}
                                        </div>
                                        <span className="text-zinc-400 text-xs">Thinking…</span>
                                    </div>
                                ) : (
                                    <>
                                        <p className="whitespace-pre-wrap">{m.text.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
                                        {m.goal && (
                                            <div className="bg-black/20 border border-indigo-500/20 rounded-xl p-4 mt-3 space-y-3">
                                                <h4 className="text-white font-semibold text-[15px]">{m.goal.title}</h4>
                                                <p className="text-zinc-400 text-xs leading-relaxed">{m.goal.description}</p>
                                                <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-400 mt-2">
                                                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-indigo-400" /> {m.goal.targetDate ? fmtDate(m.goal.targetDate) : 'No date'}</span>
                                                    <span className="flex items-center gap-1 capitalize"><Target className="w-3.5 h-3.5 text-indigo-400" /> {m.goal.category}</span>
                                                    <span className="flex items-center gap-1"><ListChecks className="w-3.5 h-3.5 text-indigo-400" /> {m.goal.milestones?.length || 0} steps</span>
                                                </div>
                                                <button onClick={() => { onGenerated(m.goal); onClose(); }}
                                                    className="w-full mt-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5">
                                                    <Sparkles className="w-3.5 h-3.5" /> Use this plan →
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    {error && (
                        <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-zinc-800 shrink-0">
                    <div className="flex gap-2">
                        <textarea value={chatInput} onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                            placeholder="e.g. I want to learn guitar and perform a song in 3 months…"
                            rows={2}
                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all resize-none placeholder-zinc-600" />
                        <button onClick={send} disabled={loading || !chatInput.trim()}
                            className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-all self-end">
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-zinc-600 text-[10px] mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
                </div>
            </motion.div>
        </div>
    );
}
