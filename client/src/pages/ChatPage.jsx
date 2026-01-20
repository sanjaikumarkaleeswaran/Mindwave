import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User } from 'lucide-react';
import api from '../lib/axios';

export default function ChatPage() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        // Load history
        const fetchHistory = async () => {
            try {
                const res = await api.get('/chat/history');
                setMessages(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchHistory();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const newMsg = { role: 'user', content: input, timestamp: new Date() };
        setMessages([...messages, newMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/chat/send', { message: input });
            // The backend returns { response, history: [userMsg, aiMsg] }
            // Or we can just append the response locally if we trust it matching
            setMessages(prev => [...prev, { role: 'assistant', content: res.data.response, timestamp: new Date() }]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col p-6 max-h-[calc(100vh-6rem)]">
            <div className="flex-1 overflow-y-auto space-y-6 pr-4 mb-4" ref={scrollRef}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-zinc-700' : 'bg-indigo-600'}`}>
                            {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                        </div>
                        <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${msg.role === 'user'
                                ? 'bg-zinc-800 text-zinc-100 rounded-tr-sm'
                                : 'bg-indigo-600 text-white rounded-tl-sm'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div className="bg-zinc-900 rounded-2xl px-5 py-3 rounded-tl-sm flex gap-1 items-center">
                            <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-100"></span>
                            <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-200"></span>
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSend} className="relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 pr-12 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="absolute right-2 top-2 p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
}
