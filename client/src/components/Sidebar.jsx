import { Home, MessageSquare, CheckCircle, Settings, LogOut, Plus, Trash2, Zap, User } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import clsx from 'clsx';
import { useMusic } from '../context/MusicContext';

export default function Sidebar({ isOpen, onClose }) {
    const { logout, user } = useAuth();
    const { isPlaying, currentTrack } = useMusic();
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
        { icon: MessageSquare, label: 'Chat', path: '/chat' },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
                    onClick={onClose}
                />
            )}

            <aside className={clsx(
                "w-64 bg-zinc-950/90 backdrop-blur-xl border-r border-white/5 flex flex-col h-screen fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out",
                isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
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
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm border border-transparent",
                                    isActive || (item.path === '/chat' && isChat)
                                        ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                                )}
                            >
                                <item.icon className={clsx("w-5 h-5 transition-colors",
                                    (item.path === '/chat' && isChat) ? "text-indigo-400" : "text-zinc-500 group-hover:text-white"
                                )} />
                                {item.label}
                            </NavLink>
                        ))}
                    </div>

                    {/* Chat History Section */}
                    {isChat && (
                        <div className="mt-8 pt-4 border-t border-white/5 animate-in slide-in-from-left-4 fade-in duration-300">
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
                                {conversations.map(conv => (
                                    <NavLink
                                        key={conv._id}
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
                                ))}
                                {conversations.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-6 text-zinc-600 space-y-2 border border-dashed border-zinc-800 rounded-xl">
                                        <MessageSquare className="w-6 h-6 opacity-20" />
                                        <span className="text-xs">No chats yet</span>
                                    </div>
                                )}
                            </div>
                        </div>
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

                {/* Spacer for Music Player if Active */}
                {currentTrack && <div className="h-20 shrink-0"></div>}
            </aside>
        </>
    );
}
