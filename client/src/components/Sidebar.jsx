import { Home, MessageSquare, Music2, CheckCircle, Settings, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

export default function Sidebar() {
    const { logout } = useAuth();

    const navItems = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: MessageSquare, label: 'Chat', path: '/chat' },
        { icon: Music2, label: 'Music', path: '/music' },
        { icon: CheckCircle, label: 'Habits', path: '/habits' },
    ];

    return (
        <aside className="w-64 bg-zinc-950 border-r border-zinc-900 flex flex-col h-screen fixed left-0 top-0">
            <div className="p-6">
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                    Life OS
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => clsx(
                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm",
                            isActive
                                ? "bg-indigo-500/10 text-indigo-400"
                                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                        )}
                    >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                    </NavLink>
                ))}
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
    );
}
