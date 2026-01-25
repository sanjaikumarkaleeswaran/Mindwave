import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Send, Bot, User, Trash2, ChevronDown } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [input, setInput] = useState('');
    const scrollRef = useRef(null);
    // Model Selection State
    const [selectedModel, setSelectedModel] = useState("llama-3.3-70b-versatile");
    const [showModelMenu, setShowModelMenu] = useState(false);

    const models = [
        { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B (Smartest)" },
        { id: "llama3-70b-8192", name: "Llama 3 70B (Fast)" },
        { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B (Balanced)" },
        { id: "gemma-2-9b-it", name: "Gemma 2 9B (Lightweight)" }
    ];

    const { data: messages = [], isLoading: isHistoryLoading } = useQuery({
        queryKey: ['chat', id],
        queryFn: async () => {
            if (!id) return [];
            const res = await api.get(`/chat/${id}`);
            return res.data;
        },
        enabled: !!id,
    });

    const sendMutation = useMutation({
        mutationFn: async ({ content, conversationId, model }) => {
            return api.post('/chat/send', { message: content, conversationId, model });
        },
        onMutate: async ({ content, conversationId }) => {
            await queryClient.cancelQueries(['chat', conversationId]);
            const previousMessages = queryClient.getQueryData(['chat', conversationId]) || [];

            // Optimistic update
            const newMsg = { role: 'user', content, timestamp: new Date() };
            queryClient.setQueryData(['chat', conversationId], [...previousMessages, newMsg]);

            return { previousMessages };
        },
        onSuccess: (res, vars) => {
            const aiContent = res.data.response;
            queryClient.setQueryData(['chat', vars.conversationId], old => [
                ...old,
                { role: 'assistant', content: aiContent, timestamp: new Date() }
            ]);
            // Invalidate conversations list in sidebar
            queryClient.invalidateQueries(['conversations']);
        },
        onError: (err, vars, context) => {
            queryClient.setQueryData(['chat', vars.conversationId], context.previousMessages);
        }
    });

    // Auto-scroll logic
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleClear = async () => {
        if (!id) return;
        if (!window.confirm("Clear all chat history?")) return;
        try {
            await api.delete(`/chat/conversations/${id}`);
            queryClient.invalidateQueries(['conversations']);
            navigate('/chat');
        } catch (err) {
            console.error(err);
        }
    };

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (!input.trim()) return;

        let targetId = id;

        // If no ID (on /chat), create new convo first
        if (!targetId) {
            try {
                const res = await api.post('/chat/conversations');
                targetId = res.data._id;
                // Pre-seed the cache for the new conversation so optimistic update works immediately
                queryClient.setQueryData(['chat', targetId], []);
                navigate(`/chat/${targetId}`);
            } catch (err) {
                console.error(err);
                return;
            }
        }

        const msgContent = input;
        setInput(''); // Clear input immediately

        sendMutation.mutate({
            content: msgContent,
            conversationId: targetId,
            model: selectedModel
        });
    };

    const suggestions = [
        { icon: "💪", text: "Help me set a new gym habit" },
        { icon: "🤔", text: "How are my habits going?" },
        { icon: "📊", text: "Show me my progress" },
        { icon: "✨", text: "Give me motivation" },
    ];

    const handleSuggestionClick = (text) => {
        setInput(text);
        // Optional: Auto submit?
        // handleSend({ preventDefault: () => {} });
    };

    return (
        <div className="h-[calc(100vh-5rem)] md:h-[calc(100vh-6rem)] flex flex-col bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden relative m-2 md:m-6 shadow-2xl">
            <Helmet>
                <title>Chat | Life OS</title>
            </Helmet>
            {/* Model Selector - Centered Top */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                <div className="relative">
                    <button
                        onClick={() => setShowModelMenu(!showModelMenu)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 hover:text-white transition-all border border-zinc-700/50 backdrop-blur-sm"
                    >
                        <span>{models.find(m => m.id === selectedModel)?.name}</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    {showModelMenu && (
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in slide-in-from-top-2">
                            {models.map(model => (
                                <button
                                    key={model.id}
                                    onClick={() => {
                                        setSelectedModel(model.id);
                                        setShowModelMenu(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${selectedModel === model.id
                                        ? 'bg-indigo-600/10 text-indigo-400'
                                        : 'text-zinc-300 hover:bg-zinc-700/50 hover:text-white'
                                        }`}
                                >
                                    {model.name}
                                    {selectedModel === model.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {!id && messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
                        <Bot className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">How can I help you today?</h2>
                    <p className="text-zinc-400 max-w-md mb-8">
                        I can help you track your habits, analyze your progress, and answer your questions.
                    </p>

                    {/* Suggestions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg mb-8">
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => handleSuggestionClick(s.text)}
                                className="p-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-indigo-500/50 rounded-xl text-left transition-all group"
                            >
                                <div className="text-lg mb-1">{s.icon}</div>
                                <div className="text-sm text-zinc-300 group-hover:text-white font-medium">{s.text}</div>
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSend} className="w-full max-w-lg relative">
                        <input
                            autoFocus
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Message Life OS..."
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-5 py-4 pr-12 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                        />
                        <button
                            type="submit"
                            disabled={sendMutation.isPending || !input.trim()}
                            className="absolute right-2 top-2 p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors disabled:opacity-50"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            ) : (
                <>
                    <div className="flex-1 overflow-y-auto p-6 pt-14 md:pt-6 space-y-6 scroll-smooth" ref={scrollRef}>
                        <div className="max-w-5xl mx-auto space-y-6">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`w-full flex gap-2 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} group`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-zinc-700'}`}>
                                        {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-indigo-400" />}
                                    </div>
                                    <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl px-5 py-3 shadow-sm ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                                        : 'bg-zinc-800 text-zinc-100 rounded-tl-sm'
                                        }`}>
                                        <div className="markdown-body text-sm md:text-base leading-relaxed prose prose-invert prose-sm max-w-none">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                                                    ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                                                    li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                                    code: ({ node, inline, className, children, ...props }) => {
                                                        return inline ? (
                                                            <code className="bg-zinc-700/50 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                                                                {children}
                                                            </code>
                                                        ) : (
                                                            <pre className="bg-zinc-900/50 p-3 rounded-lg overflow-x-auto my-2 text-xs font-mono border border-zinc-700/50">
                                                                <code className={className} {...props}>
                                                                    {children}
                                                                </code>
                                                            </pre>
                                                        )
                                                    }
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {sendMutation.isPending && (
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shrink-0">
                                        <Bot className="w-5 h-5" />
                                    </div>
                                    <div className="bg-zinc-900 rounded-2xl px-5 py-3 rounded-tl-sm flex gap-1 items-center border border-zinc-800">
                                        <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-100"></span>
                                        <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-200"></span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <form onSubmit={handleSend} className="p-4 bg-zinc-900/80 backdrop-blur-md border-t border-zinc-800">
                        <div className="relative max-w-5xl mx-auto">
                            <input
                                autoFocus
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Message Life OS..."
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-4 pr-14 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                            />
                            <button
                                type="submit"
                                disabled={sendMutation.isPending || !input.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </form>
                </>
            )}
        </div>
    );
}
