import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Loader2, Mail } from 'lucide-react';
import api from '../lib/axios';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isUnverified, setIsUnverified] = useState(false); // 403 email-not-verified state
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);

    const [verificationSent, setVerificationSent] = useState(false);

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsUnverified(false);
        setResendSuccess(false);
        setLoading(true);
        try {
            if (isLogin) {
                await login(formData.email, formData.password);
                navigate('/');
            } else {
                await register(formData.name, formData.email, formData.password);
                setVerificationSent(true);
            }
        } catch (err) {
            if (err.response?.status === 403) {
                setIsUnverified(true); // show resend banner
            } else {
                setError(err.response?.data?.msg || 'An error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendVerification = async () => {
        setResendLoading(true);
        setResendSuccess(false);
        try {
            await api.post('/auth/resend-verification', { email: formData.email });
            setResendSuccess(true);
        } catch (err) {
            setError(err.response?.data?.msg || 'Could not resend email. Try again.');
            // Don't set isUnverified to false, so the user can actually try again from the banner
        } finally {
            setResendLoading(false);
        }
    };

    if (verificationSent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
                <div className="w-full max-w-md bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 shadow-xl backdrop-blur-sm text-center">
                    <div className="flex justify-center mb-6">
                        <div className="p-3 bg-green-500/10 rounded-full">
                            <Sparkles className="w-8 h-8 text-green-500" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold mb-4 text-white">Check Your Email</h2>
                    <p className="text-zinc-400 mb-8">
                        We've sent a verification link to <strong>{formData.email}</strong>.<br />
                        Please verify your email to continue.
                    </p>
                    <button
                        onClick={() => {
                            setVerificationSent(false);
                            setIsLogin(true);
                        }}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition-all"
                    >
                        Back to Sign In
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
            <div className="w-full max-w-md bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 shadow-xl backdrop-blur-sm">
                <div className="flex justify-center mb-8">
                    <div className="p-3 bg-indigo-500/10 rounded-xl">
                        <Sparkles className="w-8 h-8 text-indigo-500" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-center mb-2 text-white">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-zinc-400 text-center mb-8">
                    Your personal AI Life OS awaits
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Email Not Verified Banner */}
                {isUnverified && (
                    <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-sm">
                        <div className="flex items-start gap-3 mb-3">
                            <Mail className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
                            <div>
                                <p className="font-semibold text-amber-200 mb-1">Email not verified</p>
                                <p className="text-amber-400/80 text-xs">Check your inbox for the verification link, or resend it below.</p>
                            </div>
                        </div>
                        {resendSuccess ? (
                            <p className="text-green-400 text-xs font-medium text-center">✅ Verification email sent! Check your inbox.</p>
                        ) : (
                            <button
                                onClick={handleResendVerification}
                                disabled={resendLoading}
                                className="w-full flex items-center justify-center gap-2 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-amber-300 text-xs font-semibold transition-colors disabled:opacity-60"
                            >
                                {resendLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                                {resendLoading ? 'Sending...' : 'Resend Verification Email'}
                            </button>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Name</label>
                            <input
                                type="text"
                                required
                                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    {isLogin && (
                        <div className="flex justify-end">
                            <Link to="/forgot-password" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                                Forgot password?
                            </Link>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 group"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                {isLogin ? 'Sign In' : 'Get Started'}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                        {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                    </button>
                </div>
            </div>
        </div>
    );
}
