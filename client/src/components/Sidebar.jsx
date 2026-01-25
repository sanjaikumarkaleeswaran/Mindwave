import { Home, MessageSquare, CheckCircle, Settings, LogOut, Plus, Trash2, Zap } from 'lucide-react';

import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import clsx from 'clsx';

export default function Sidebar({ isOpen, onClose }) {
    const { logout } = useAuth();
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
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
                    onClick={onClose}
                />
            )}

            <aside className={clsx(
                "w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col h-screen fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out",
                isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="p-6">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                        Life OS
                    </h1>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => { if (window.innerWidth < 768) onClose(); }}
                            end={item.path !== '/chat' && item.path !== '/'} // Exact match for others, but Chat is prefix
                            className={({ isActive }) => clsx(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm",
                                isActive || (item.path === '/chat' && isChat)
                                    ? "bg-primary/10 text-primary"
                                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </NavLink>
                    ))}

                    {/* Chat History Section */}
                    {isChat && (
                        <div className="mt-6 pt-4 border-t border-zinc-900">
                            <div className="flex items-center justify-between px-2 mb-2">
                                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">History</span>
                                <button onClick={createNewChat} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors">
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
                                            "flex items-center justify-between group px-3 py-2 rounded-lg text-sm transition-colors",
                                            isActive ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                                        )}
                                    >
                                        <span className="truncate max-w-[140px]">{conv.title}</span>
                                        <button
                                            onClick={(e) => deleteConversation(e, conv._id)}
                                            className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500 transition-opacity"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </NavLink>
                                ))}
                                {conversations.length === 0 && (
                                    <p className="px-3 text-xs text-zinc-600 italic">No history</p>
                                )}
                            </div>
                        </div>
                    )}
                </nav>

                <div className="p-4 border-t border-zinc-900 space-y-2">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
}
