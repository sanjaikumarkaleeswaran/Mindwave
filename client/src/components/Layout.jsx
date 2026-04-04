import { Outlet, useLocation, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';

import { useState, useEffect } from 'react';
import { Menu, Search, Home, MessageSquare, Zap, CheckCircle, Target, CalendarDays, BookOpen } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../lib/axios';
import clsx from 'clsx';

// Bottom navigation items (subset — most important pages for mobile)
const BOTTOM_NAV = [
    { icon: Home,         label: 'Home',    path: '/',        end: true  },
    { icon: CheckCircle,  label: 'Habits',  path: '/habits',  end: false },
    { icon: MessageSquare,label: 'Chat',    path: '/chat',    end: false },
    { icon: Target,       label: 'Goals',   path: '/goals',   end: false },
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
    }, [location.pathname]);

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
                <header className="flex items-center justify-between px-4 py-3 glass sticky top-0 z-30 border-b border-white/5">
                    {/* Left: Hamburger + brand (mobile only) */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                            aria-label="Open menu"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <span className="md:hidden font-semibold text-lg bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                            MindWave
                        </span>
                    </div>

                    {/* Right: Search + Notifications */}
                    <div className="flex items-center gap-2">
                        {/* Search button */}
                        <button
                            id="global-search-btn"
                            onClick={() => setIsSearchOpen(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 rounded-xl text-zinc-500 hover:text-zinc-300 transition-all text-sm"
                            aria-label="Open search"
                        >
                            <Search className="w-4 h-4" />
                            <span className="hidden md:block text-xs">Search...</span>
                            <kbd className="hidden md:block text-[10px] bg-zinc-700/50 border border-zinc-600/50 rounded px-1">⌘K</kbd>
                        </button>

                        {/* Notifications */}
                        <NotificationBell habits={habits} journals={journals} goals={goals} />
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* ── Mobile Bottom Navigation Bar ── */}
            <nav
                className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur-xl flex items-stretch justify-around"
                style={{
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                    boxShadow: '0 -1px 0 rgba(255,255,255,0.05)'
                }}
            >
                {BOTTOM_NAV.map(({ icon: Icon, label, path, end }) => (
                    <NavLink
                        key={path}
                        to={path}
                        end={end}
                        className={({ isActive }) => clsx(
                            'flex flex-col items-center justify-center gap-1 py-2 px-1 min-w-0 flex-1 relative transition-all',
                            isActive ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'
                        )}
                        aria-label={label}
                    >
                        {({ isActive }) => (
                            <>
                                {/* Indicator line — sits flush at top of nav */}
                                {isActive && (
                                    <motion.div
                                        layoutId="bottomNavIndicator"
                                        className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 bg-indigo-500 rounded-full"
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    />
                                )}
                                {/* Icon */}
                                <div className={clsx(
                                    'p-1.5 rounded-xl transition-all',
                                    isActive ? 'bg-indigo-500/15' : ''
                                )}>
                                    <Icon className={clsx('w-5 h-5', isActive ? 'text-indigo-400' : 'text-zinc-500')} />
                                </div>
                                {/* Label */}
                                <span className={clsx('text-[10px] font-medium leading-none', isActive ? 'text-indigo-400' : 'text-zinc-600')}>
                                    {label}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Global Search Overlay */}
            <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </div>
    );
}
