import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    // Close sidebar on route change
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    return (
        <div className="flex bg-black min-h-screen text-white">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-h-screen md:ml-64 transition-all duration-300 relative">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center p-4 bg-zinc-950 border-b border-zinc-900 sticky top-0 z-30">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="ml-3 font-semibold text-lg bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">Life OS</span>
                </header>

                <main className="flex-1 pb-24">
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

        </div>
    );
}
