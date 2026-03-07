import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';

import { useState, useEffect } from 'react';
import { Menu, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../lib/axios';

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [habits, setHabits] = useState([]);
    const [journals, setJournals] = useState([]);
    const [goals, setGoals] = useState([]);
    const location = useLocation();

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
            } catch (e) { /* silent */ }
        };
        fetchContext();
    }, [location.pathname]); // Refresh when navigating

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
        <div className="flex bg-black min-h-screen text-white">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-h-screen md:ml-64 transition-all duration-300 relative">
                {/* Mobile & Desktop Top Header */}
                <header className="flex items-center justify-between px-4 py-3 glass sticky top-0 z-30 border-b border-white/5">
                    {/* Left: Hamburger + brand (mobile) */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <span className="md:hidden font-semibold text-lg bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">Life OS</span>
                    </div>

                    {/* Right: Search + Notifications */}
                    <div className="flex items-center gap-2">
                        {/* Search button */}
                        <button
                            id="global-search-btn"
                            onClick={() => setIsSearchOpen(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 rounded-xl text-zinc-500 hover:text-zinc-300 transition-all text-sm"
                        >
                            <Search className="w-4 h-4" />
                            <span className="hidden md:block text-xs">Search...</span>
                            <kbd className="hidden md:block text-[10px] bg-zinc-700/50 border border-zinc-600/50 rounded px-1">⌘K</kbd>
                        </button>

                        {/* Notifications */}
                        <NotificationBell habits={habits} journals={journals} goals={goals} />
                    </div>
                </header>

                <main className={`flex-1 ${location.pathname.startsWith('/chat') ? 'pb-0' : 'pb-24'}`}>
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

            {/* Global Search Overlay */}
            <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </div>
    );
}
