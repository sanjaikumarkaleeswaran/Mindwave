import { Outlet, useLocation, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';

import { useState, useEffect } from 'react';
import { Menu, Search, Home, MessageSquare, Zap, CheckCircle, Target, CalendarDays, BookOpen, Wallet } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../lib/axios';
import clsx from 'clsx';

// Bottom navigation items (subset — most important pages for mobile)
const BOTTOM_NAV = [
    { icon: Home,         label: 'Home',    path: '/',        end: true  },
    { icon: MessageSquare,label: 'Chat',    path: '/chat',    end: false },
    { icon: Zap,          label: 'Focus',   path: '/focus',   end: false },
    { icon: CheckCircle,  label: 'Habits',  path: '/habits',  end: false },
    { icon: Target,       label: 'Goals',   path: '/goals',   end: false },
    { icon: CalendarDays, label: 'Calendar',path: '/calendar',end: false },
    { icon: Wallet,       label: 'Money',   path: '/expenses',end: false },
    { icon: BookOpen,     label: 'Journal', path: '/journal', end: false },
];

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [habits, setHabits] = useState([]);
    const [journals, setJournals] = useState([]);
    const [goals, setGoals] = useState([]);
    const location = useLocation();

    const isChat = location.pathname.startsWith('/chat');

    // Close sidebar on route change
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    // Fetch habits, journals & goals for notification context
    useEffect(() => {
        const fetchContext = async () => {
            try {
                const [hRes, jRes, gRes] = await Promise.all([
                    api.get('/habits'),
                    api.get('/journal'),
                    api.get('/goals'),
                ]);
                setHabits(hRes.data);
                setJournals(jRes.data);
                setGoals(gRes.data);
            } catch { /* silent */ }
        };
        fetchContext();
    }, []); // Fetch once on mount — no need to re-fetch on every route change

    // Global keyboard shortcut: Ctrl+K or Cmd+K to open search
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(prev => !prev);
            }
            if (e.key === 'Escape') setIsSearchOpen(false);
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    return (
        <div className="flex bg-black min-h-screen min-h-[100dvh] text-white">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main content area — shifts right on desktop to avoid sidebar overlap */}
            <div className="flex-1 flex flex-col min-h-screen min-h-[100dvh] md:ml-64 transition-all duration-300 relative">
                {/* Sticky Top Header */}
                <header 
                    className="flex items-center justify-between px-4 glass sticky top-0 z-30 border-b border-white/5"
                    style={{ minHeight: 'var(--header-h)', paddingTop: 'env(safe-area-inset-top, 0px)' }}
                >
                    {/* Left: Hamburger + brand (mobile only) */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors active:scale-90"
                            aria-label="Open menu"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <span className="md:hidden font-black text-xl tracking-tighter bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            MindWave
                        </span>
                    </div>

                    {/* Right: Search + Notifications */}
                    <div className="flex items-center gap-2">
                        {/* Search icon-only on mobile to save space */}
                        <button
                            id="global-search-btn"
                            onClick={() => setIsSearchOpen(true)}
                            className="flex items-center gap-2 p-2 md:px-3 md:py-2 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 rounded-xl text-zinc-500 hover:text-zinc-300 transition-all text-sm"
                            aria-label="Open search"
                        >
                            <Search className="w-4 h-4" />
                            <span className="hidden md:block text-xs">Search...</span>
                            <kbd className="hidden md:block text-[10px] bg-zinc-700/50 border border-zinc-600/50 rounded px-1 ml-1 font-sans">⌘K</kbd>
                        </button>

                        {/* Notifications */}
                        <NotificationBell habits={habits} journals={journals} goals={goals} />
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 relative pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom,0px))] md:pb-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="h-full"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* ── Mobile Bottom Navigation Bar ── */}
            <nav
                className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-950/90 backdrop-blur-2xl border-t border-white/5 overflow-x-auto hide-scrollbar"
                style={{
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                    height: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom, 0px))'
                }}
            >
                <div className="flex items-stretch min-w-full h-full px-1">
                    {BOTTOM_NAV.map(({ icon: Icon, label, path, end }) => (
                        <NavLink
                            key={path}
                            to={path}
                            end={end}
                            className={({ isActive }) => clsx(
                                'flex flex-col items-center justify-center gap-0.5 py-1 px-1.5 min-w-[48px] flex-1 relative transition-all active:scale-90 shrink-0',
                                isActive ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'
                            )}
                            aria-label={label}
                        >
                            {({ isActive }) => (
                                <>
                                    {/* Indicator line */}
                                    <div
                                        className={clsx(
                                            "absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-6 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]",
                                            isActive ? "bg-indigo-500 opacity-100" : "bg-transparent opacity-0"
                                        )}
                                    />
                                    {/* Icon */}
                                    <div className={clsx(
                                        'p-1 rounded-xl transition-all',
                                        isActive ? 'bg-indigo-500/10' : ''
                                    )}>
                                        <Icon className={clsx('w-4 h-4', isActive ? 'text-indigo-400' : 'text-zinc-500')} />
                                    </div>
                                    {/* Label */}
                                    <span className={clsx('text-[9px] font-bold leading-none tracking-tight truncate w-full text-center', isActive ? 'text-indigo-400' : 'text-zinc-500')}>
                                        {label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            </nav>

            {/* Global Search Overlay */}
            <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </div>
    );
}
