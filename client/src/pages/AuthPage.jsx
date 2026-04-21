import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

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

    const inputClass = "w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-4 py-3.5 text-white text-sm font-medium focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-zinc-600";
    const labelClass = "block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1 mb-1.5";

    return (
        <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

            {/* Brand */}
            <div className="relative z-10 mb-8 text-center">
                <div className="inline-flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                        <Sparkles className="w-6 h-6 text-indigo-400" />
                    </div>
                    <span className="text-3xl font-black tracking-tighter bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        MindWave
                    </span>
                </div>
                <p className="text-zinc-500 text-sm font-medium">Your personal AI Life Operating System</p>
            </div>

            {/* Card */}
            <div className="relative z-10 w-full max-w-md">
                <div className="bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-[0_32px_80px_rgba(0,0,0,0.6)]">

                    {/* Tab toggle */}
                    <div className="relative flex p-1.5 bg-zinc-950/60 rounded-[1.5rem] border border-white/5 mb-7">
                        <div
                            className="absolute inset-y-1.5 rounded-[1.25rem] bg-zinc-700/80 transition-all duration-300 shadow"
                            style={{ left: isLogin ? '6px' : '50%', width: 'calc(50% - 6px)' }}
                        />
                        <button type="button" onClick={() => { setIsLogin(true); setError(''); }}
                            className={`relative flex-1 py-2.5 text-sm font-black rounded-[1.25rem] transition-colors duration-300 ${isLogin ? 'text-white' : 'text-zinc-500'}`}>
                            Sign In
                        </button>
                        <button type="button" onClick={() => { setIsLogin(false); setError(''); }}
                            className={`relative flex-1 py-2.5 text-sm font-black rounded-[1.25rem] transition-colors duration-300 ${!isLogin ? 'text-white' : 'text-zinc-500'}`}>
                            Sign Up
                        </button>
                    </div>

                    <h2 className="text-2xl font-black text-white tracking-tight mb-1">
                        {isLogin ? 'Welcome back 👋' : 'Create account ✨'}
                    </h2>
                    <p className="text-zinc-500 text-sm font-medium mb-6">
                        {isLogin ? 'Pick up where you left off.' : 'Start your life OS journey today.'}
                    </p>

                    {error && (
                        <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm text-center font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
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
                            <label className={labelClass}>Email</label>
                            <input type="email" required placeholder="you@example.com"
                                className={inputClass}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5 px-1">
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Password</span>
                                {isLogin && (
                                    <Link to="/forgot-password" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors">
                                        Forgot?
                                    </Link>
                                )}
                            </div>
                            <input type="password" required placeholder="••••••••"
                                className={inputClass}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full mt-2 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-black text-sm uppercase tracking-[0.15em] rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(99,102,241,0.4)] group">
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? 'Sign In' : 'Get Started'}
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-zinc-600 text-xs font-medium mt-6">
                    By continuing, you agree to our{' '}
                    <span className="text-zinc-400 hover:text-white transition-colors cursor-pointer">Terms</span>
                    {' & '}
                    <span className="text-zinc-400 hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
                </p>
            </div>
        </div>
    );
}
