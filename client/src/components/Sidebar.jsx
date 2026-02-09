import { AnimatePresence, motion } from 'framer-motion';
import { Home, MessageSquare, CheckCircle, Settings, LogOut, Plus, Trash2, Zap, User, BookOpen } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import clsx from 'clsx';


export default function Sidebar({ isOpen, onClose }) {
    const { logout, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const isChat = location.pathname.startsWith('/chat');
    const queryClient = useQueryClient();

    // Chat History Query
    const { data: conversations = [] } = useQuery({
        queryKey: ['conversations'],
        queryFn: async () => {
            const res = await api.get('/chat/conversations');
            return res.data;
        },
        enabled: isChat // Only fetch when chat section is visible/active
    });

    const createMutation = useMutation({
        mutationFn: () => api.post('/chat/conversations'),
        onSuccess: (res) => {
            queryClient.invalidateQueries(['conversations']);
            navigate(`/chat/${res.data._id}`);
            if (window.innerWidth < 768) onClose();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/chat/conversations/${id}`),
        onMutate: async (id) => {
            await queryClient.cancelQueries(['conversations']);
            const previous = queryClient.getQueryData(['conversations']);
            queryClient.setQueryData(['conversations'], old => old.filter(c => c._id !== id));
            return { previous };
        },
        onError: (err, id, context) => queryClient.setQueryData(['conversations'], context.previous),
        onSettled: () => queryClient.invalidateQueries(['conversations'])
    });

    const createNewChat = () => {
        createMutation.mutate();
    };

    const deleteConversation = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm("Delete this chat?")) return;

        deleteMutation.mutate(id);

        if (location.pathname.includes(id)) {
            navigate('/chat');
        }
    };

    const navItems = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: CheckCircle, label: 'Habits', path: '/habits' },
        { icon: Zap, label: 'Focus', path: '/focus' },
        { icon: BookOpen, label: 'Journal', path: '/journal' },
        { icon: MessageSquare, label: 'Chat', path: '/chat' },
    ];

    return (
        <AnimatePresence>
            {/* Mobile Overlay */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{
                    x: isOpen || window.innerWidth >= 768 ? 0 : "-100%"
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={clsx(
                    "w-64 glass-panel flex flex-col h-screen fixed left-0 top-0 z-50 md:translate-x-0"
                )}
                style={{ x: isOpen ? 0 : "-100%" }} // Fallback/Base state handling via motion
            >
                {/* Brand */}
                <div className="p-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" fill="currentColor" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                        Life OS
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                    <div className="space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => { if (window.innerWidth < 768) onClose(); }}
                                end={item.path !== '/chat' && item.path !== '/'}
                                className={({ isActive }) => clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm border border-transparent relative overflow-hidden",
                                    isActive || (item.path === '/chat' && isChat)
                                        ? "text-indigo-400 border-indigo-500/20 bg-indigo-500/10"
                                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                                )}
                            >
                                {({ isActive }) => (
                                    <>
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeNavIndicator"
                                                className="absolute inset-0 bg-indigo-500/10"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                            />
                                        )}
                                        <item.icon className={clsx("w-5 h-5 transition-colors relative z-10",
                                            (isActive || (item.path === '/chat' && isChat)) ? "text-indigo-400" : "text-zinc-500 group-hover:text-white"
                                        )} />
                                        <span className="relative z-10">{item.label}</span>
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>

                    {/* Chat History Section */}
                    {isChat && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-8 pt-4 border-t border-white/5"
                        >
                            <div className="flex items-center justify-between px-2 mb-3">
                                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Messages</span>
                                <button
                                    onClick={createNewChat}
                                    className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                                    title="New Chat"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-1">
                                <AnimatePresence initial={false}>
                                    {conversations.map(conv => (
                                        <motion.div
                                            key={conv._id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            layout
                                        >
                                            <NavLink
                                                to={`/chat/${conv._id}`}
                                                onClick={() => { if (window.innerWidth < 768) onClose(); }}
                                                className={({ isActive }) => clsx(
                                                    "flex items-center justify-between group px-3 py-2.5 rounded-lg text-sm transition-all border border-transparent",
                                                    isActive
                                                        ? "bg-zinc-800/80 text-white border-zinc-700 shadow-sm"
                                                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
                                                )}
                                            >
                                                <span className="truncate max-w-[140px]">{conv.title || 'New Chat'}</span>
                                                <button
                                                    onClick={(e) => deleteConversation(e, conv._id)}
                                                    className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 p-1 rounded hover:bg-zinc-800 transition-all"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </NavLink>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {conversations.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-6 text-zinc-600 space-y-2 border border-dashed border-zinc-800 rounded-xl">
                                        <MessageSquare className="w-6 h-6 opacity-20" />
                                        <span className="text-xs">No chats yet</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </nav>

                {/* User Section (Bottom) */}
                <div className="p-4 border-t border-white/5 space-y-2 bg-black/20">
                    <NavLink
                        to="/profile"
                        onClick={() => { if (window.innerWidth < 768) onClose(); }}
                        className={({ isActive }) => clsx(
                            "flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-colors text-sm font-medium",
                            isActive ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                        )}
                    >
                        {user?.avatar ? (
                            <img src={user.avatar} className="w-5 h-5 rounded-full object-cover" alt="User" />
                        ) : (
                            <User className="w-5 h-5" />
                        )}
                        <span>Profile & Settings</span>
                    </NavLink>

                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors text-sm font-medium group"
                    >
                        <LogOut className="w-5 h-5 group-hover:text-red-400 transition-colors" />
                        Sign Out
                    </button>
                </div>
            </motion.aside>
        </AnimatePresence>
    );
}
