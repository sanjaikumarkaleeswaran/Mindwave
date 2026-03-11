
import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
                    <div className="max-w-md w-full bg-red-900/20 border border-red-500/50 rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-red-500/20 rounded-full">
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>
                            <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
                        </div>

                        <p className="text-zinc-300 mb-6 font-medium">
                            The application encountered an unexpected error.
                        </p>

                        {this.state.error && (
                            <div className="bg-black/50 rounded-lg p-4 mb-6 overflow-auto max-h-48 border border-white/5">
                                <p className="text-red-400 font-mono text-xs break-all">
                                    {this.state.error.toString()}
                                </p>
                                {this.state.errorInfo && (
                                    <pre className="text-zinc-500 text-[10px] mt-2 whitespace-pre-wrap">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </div>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors"
                        >
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
