import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, BookOpen, CheckCircle, MessageSquare, Target, Loader2, ArrowRight, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';

const useDebounce = (value, delay) => {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
};

const SECTION_META = {
    habits: { icon: CheckCircle, label: 'Habits', color: 'text-green-400', path: '/habits' },
    journals: { icon: BookOpen, label: 'Journal', color: 'text-purple-400', path: '/journal' },
    conversations: { icon: MessageSquare, label: 'Chat', color: 'text-indigo-400', pathFn: (item) => `/chat/${item._id}` },
    goals: { icon: Target, label: 'Goals', color: 'text-amber-400', path: '/goals' },
    documents: { icon: FileText, label: 'Docs', color: 'text-rose-400', path: '/chat' },
};

export default function GlobalSearch({ isOpen, onClose }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const navigate = useNavigate();
    const debouncedQuery = useDebounce(query, 300);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery('');
            setResults(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!debouncedQuery || debouncedQuery.trim().length < 2) {
            setResults(null);
            return;
        }
        const search = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/search?q=${encodeURIComponent(debouncedQuery)}`);
                setResults(res.data);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        search();
    }, [debouncedQuery]);

    const handleNavigate = (path) => {
        navigate(path);
        onClose();
    };

    const totalResults = results
        ? Object.values(results).reduce((s, arr) => s + arr.length, 0)
        : 0;

    const hasResults = results && totalResults > 0;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Search Panel */}
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
                    >
                        <div className="bg-zinc-900 border border-zinc-700/60 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
                            {/* Input */}
                            <div className="flex items-center gap-3 px-4 py-4 border-b border-zinc-800">
                                {loading
                                    ? <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
                                    : <Search className="w-5 h-5 text-zinc-500 shrink-0" />
                                }
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="Search habits, journal entries, chats, goals..."
                                    className="flex-1 bg-transparent text-white placeholder-zinc-500 focus:outline-none text-base"
                                />
                                {query && (
                                    <button onClick={() => { setQuery(''); setResults(null); inputRef.current?.focus(); }}
                                        className="p-1 text-zinc-500 hover:text-white transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                <kbd className="hidden md:block text-xs text-zinc-600 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5">ESC</kbd>
                            </div>

                            {/* Results */}
                            <div className="max-h-[60vh] overflow-y-auto">
                                {!query && (
                                    <div className="p-8 text-center">
                                        <Search className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                                        <p className="text-zinc-500 text-sm">Type at least 2 characters to search across your entire life OS</p>
                                    </div>
                                )}

                                {query && !loading && !hasResults && results && (
                                    <div className="p-8 text-center">
                                        <p className="text-zinc-500 text-sm">No results for "<span className="text-zinc-300">{query}</span>"</p>
                                    </div>
                                )}

                                {hasResults && (
                                    <div className="p-3 space-y-1">
                                        {Object.entries(results).map(([section, items]) => {
                                            if (!items || items.length === 0) return null;
                                            const meta = SECTION_META[section];
                                            if (!meta) return null;
                                            const Icon = meta.icon;

                                            return (
                                                <div key={section}>
                                                    <div className="flex items-center gap-2 px-3 py-1.5">
                                                        <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                                                        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{meta.label}</span>
                                                    </div>
                                                    {items.map(item => {
                                                        const path = meta.pathFn ? meta.pathFn(item) : meta.path;
                                                        const title = item.name || item.title || (item.source ? item.content.substring(0, 40) + '...' : 'Untitled');
                                                        const subtitle = item.content && !item.source
                                                            ? item.content.substring(0, 80) + '...'
                                                            : item.description
                                                                ? item.description.substring(0, 80)
                                                                 : item.mood
                                                                     ? `Mood: ${item.mood}`
                                                                     : item.source 
                                                                        ? `From: ${item.source}`
                                                                        : item.category || '';

                                                        return (
                                                            <button
                                                                key={item._id}
                                                                onClick={() => handleNavigate(path)}
                                                                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group text-left"
                                                            >
                                                                <div className="min-w-0">
                                                                    <p className="text-white text-sm font-medium truncate">{title}</p>
                                                                    {subtitle && <p className="text-zinc-500 text-xs truncate">{subtitle}</p>}
                                                                </div>
                                                                <ArrowRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-400 shrink-0 transition-colors" />
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer hint */}
                            {hasResults && (
                                <div className="px-4 py-2 border-t border-zinc-800 text-xs text-zinc-600 flex items-center gap-1">
                                    <span>{totalResults} result{totalResults !== 1 ? 's' : ''} found</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
