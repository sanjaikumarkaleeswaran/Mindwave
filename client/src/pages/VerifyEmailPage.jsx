import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { Sparkles, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                await api.put(`/auth/verify-email/${token}`);
                setStatus('success');
                setTimeout(() => {
                    navigate('/auth');
                }, 3000);
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.msg || 'Verification failed');
            }
        };

        if (token) verifyEmail();
    }, [token, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
            <div className="w-full max-w-md bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 shadow-xl backdrop-blur-sm text-center">
                <div className="flex justify-center mb-6">
                    {status === 'verifying' && (
                        <div className="p-3 bg-indigo-500/10 rounded-full">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        </div>
                    )}
                    {status === 'success' && (
                        <div className="p-3 bg-green-500/10 rounded-full">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="p-3 bg-red-500/10 rounded-full">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                    )}
                </div>

                <h2 className="text-2xl font-bold mb-4 text-white">
                    {status === 'verifying' && 'Verifying Email...'}
                    {status === 'success' && 'Email Verified!'}
                    {status === 'error' && 'Verification Failed'}
                </h2>

                <p className="text-zinc-400 mb-8">
                    {status === 'verifying' && 'Please wait while we verify your email address.'}
                    {status === 'success' && 'Your email has been successfully verified. Redirecting to login...'}
                    {status === 'error' && (message || 'The verification link is invalid or expired.')}
                </p>

                {status !== 'verifying' && (
                    <Link
                        to="/auth"
                        className="inline-block w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition-all"
                    >
                        {status === 'success' ? 'Sign In' : 'Back to Sign In'}
                    </Link>
                )}
            </div>
        </div>
    );
}
