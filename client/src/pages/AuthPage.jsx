import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Loader2, Bot, Target, Activity, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                await login(formData.email, formData.password);
                navigate('/');
            } else {
                await register(formData.name, formData.email, formData.password);
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full bg-zinc-900/50 border border-white/10 rounded-2xl px-4 py-4 text-white text-sm font-medium focus:outline-none focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/20 transition-all placeholder:text-zinc-600";
    const labelClass = "block text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] px-1 mb-2";

    return (
        <div className="min-h-[100dvh] w-full flex flex-col lg:flex-row bg-zinc-950 overflow-hidden font-sans">
            
            {/* Left/Right Side - Form */}
            <motion.div 
                layout
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                className={`w-full lg:w-1/2 flex flex-col relative z-20 bg-zinc-950 ${!isLogin ? 'lg:order-2' : 'lg:order-1'}`}
            >
                {/* Mobile ambient glows */}
                <div className="lg:hidden absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="lg:hidden absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

                {/* Top Logo */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="p-6 md:p-8 flex items-center gap-3"
                >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                        <Sparkles className="w-5 h-5 text-indigo-400" />
                    </div>
                    <span className="text-xl font-black tracking-tighter text-white">
                        MindWave
                    </span>
                </motion.div>

                {/* Form Container */}
                <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 md:px-24 xl:px-32 max-w-2xl mx-auto w-full pb-12">
                    
                    <div className="relative w-full">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isLogin ? "login" : "signup"}
                                initial={{ opacity: 0, x: isLogin ? -30 : 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: isLogin ? 30 : -30 }}
                                transition={{ duration: 0.3 }}
                                className="w-full flex flex-col"
                            >
                                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
                                    {isLogin ? 'Welcome back.' : 'Join MindWave.'}
                                </h1>
                                <p className="text-zinc-400 text-base md:text-lg mb-8">
                                    {isLogin ? 'Log in to your personal AI Life Operating System.' : 'Start transforming your daily life with AI-driven insights.'}
                                </p>

                                {error && (
                                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {!isLogin && (
                                        <div>
                                            <label className={labelClass}>Full Name</label>
                                            <input type="text" required placeholder="John Doe"
                                                className={inputClass}
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                        </div>
                                    )}

                                    <div>
                                        <label className={labelClass}>Email Address</label>
                                        <input type="email" required placeholder="you@example.com"
                                            className={inputClass}
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between px-1 mb-2">
                                            <span className={labelClass.replace('mb-2', '')}>Password</span>
                                            {isLogin && (
                                                <Link to="/forgot-password" className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors pb-0.5 border-b border-indigo-400/30 hover:border-indigo-400">
                                                    Forgot?
                                                </Link>
                                            )}
                                        </div>
                                        <input type="password" required placeholder="••••••••"
                                            className={inputClass}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                                    </div>

                                    <motion.button 
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit" disabled={loading}
                                        className="w-full mt-4 py-4 bg-white text-zinc-950 disabled:opacity-50 font-black text-[13px] uppercase tracking-[0.15em] rounded-2xl transition-all flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.1)] group overflow-hidden relative"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                                        ) : (
                                            <span className="relative z-10 flex items-center gap-2">
                                                {isLogin ? 'Sign In to MindWave' : 'Create Account'}
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </span>
                                        )}
                                    </motion.button>
                                </form>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="mt-6 text-center lg:text-left"
                    >
                        <button 
                            type="button" 
                            onClick={() => { setIsLogin(!isLogin); setError(''); }}
                            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center justify-center lg:justify-start gap-2 mx-auto lg:mx-0 group"
                        >
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                            <span className="text-indigo-400 font-bold group-hover:underline underline-offset-4">
                                {isLogin ? 'Sign up' : 'Sign in'}
                            </span>
                        </button>
                    </motion.div>

                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="text-zinc-600 text-xs font-medium mt-10 text-center lg:text-left"
                    >
                        By continuing, you agree to our{' '}
                        <span className="text-zinc-400 hover:text-white transition-colors cursor-pointer border-b border-zinc-700">Terms</span>
                        {' & '}
                        <span className="text-zinc-400 hover:text-white transition-colors cursor-pointer border-b border-zinc-700">Privacy Policy</span>
                    </motion.p>
                </div>
            </motion.div>

            {/* Right Side - Visual/Graphic */}
            <motion.div 
                layout
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                className={`hidden lg:flex w-1/2 relative bg-zinc-900 p-8 xl:p-12 items-center justify-center overflow-hidden ${!isLogin ? 'lg:order-1' : 'lg:order-2'}`}
            >
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-zinc-950 opacity-80" />
                
                {/* Dynamic shapes */}
                <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3], rotate: [0, 90, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/4 -right-20 w-96 h-96 bg-indigo-500/30 rounded-full blur-[100px]" 
                />
                <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2], rotate: [0, -90, 0] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-1/4 -left-20 w-[30rem] h-[30rem] bg-purple-600/20 rounded-full blur-[120px]" 
                />

                {/* Floating Mockup UI Container */}
                <div className="relative w-full max-w-lg z-10 flex flex-col gap-6">
                    {/* Floating elements text */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="mb-6"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4 shadow-xl">
                            <span className="flex w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="text-xs font-bold text-white uppercase tracking-widest">MindWave OS</span>
                        </div>
                        <h2 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight">
                            Elevate your daily <br/>
                            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">productivity.</span>
                        </h2>
                    </motion.div>

                    {/* Fake App Cards */}
                    <motion.div 
                        initial={{ opacity: 0, x: 50, rotate: -10 }}
                        animate={{ opacity: 1, x: 0, rotate: -2, y: [0, -10, 0] }}
                        transition={{ 
                            opacity: { duration: 0.8, delay: 0.4 },
                            x: { duration: 0.8, delay: 0.4 },
                            rotate: { duration: 0.8, delay: 0.4 },
                            y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 } 
                        }}
                        className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl hover:rotate-0 transition-transform duration-500 group relative overflow-hidden"
                    >
                        {/* Shimmer effect inside card */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />

                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <Bot className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold">AI Daily Brief</h3>
                                <p className="text-zinc-400 text-sm">Your personalized day planner.</p>
                            </div>
                        </div>
                        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 w-3/4 rounded-full relative">
                                <div className="absolute inset-0 bg-white/20 w-1/2 animate-[translateX_2s_infinite]" />
                            </div>
                        </div>
                    </motion.div>

                    <div className="flex gap-6 translate-x-8">
                        <motion.div 
                            initial={{ opacity: 0, y: 50, rotate: 10 }}
                            animate={{ opacity: 1, y: [0, -8, 0], rotate: 2 }}
                            transition={{ 
                                opacity: { duration: 0.8, delay: 0.6 },
                                rotate: { duration: 0.8, delay: 0.6 },
                                y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 } 
                            }}
                            className="flex-1 bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl hover:rotate-0 transition-transform duration-500 group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Activity className="w-5 h-5 text-emerald-400" />
                            </div>
                            <h3 className="text-white font-bold text-lg mb-1">Habits</h3>
                            <p className="text-zinc-500 text-xs">Build lasting routines</p>
                        </motion.div>
                        
                        <motion.div 
                            initial={{ opacity: 0, y: 50, rotate: -10 }}
                            animate={{ opacity: 1, y: [0, -12, 0], rotate: -1 }}
                            transition={{ 
                                opacity: { duration: 0.8, delay: 0.8 },
                                rotate: { duration: 0.8, delay: 0.8 },
                                y: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 } 
                            }}
                            className="flex-1 bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl hover:rotate-0 transition-transform duration-500 group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Target className="w-5 h-5 text-purple-400" />
                            </div>
                            <h3 className="text-white font-bold text-lg mb-1">Goals</h3>
                            <p className="text-zinc-500 text-xs">Track life milestones</p>
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* Custom Keyframes embedded to avoid editing index.css unnecessarily */}
            <style jsx>{`
                @keyframes shimmer {
                    100% {
                        transform: translateX(100%);
                    }
                }
            `}</style>
        </div>
    );
}
