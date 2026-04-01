import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Send, Bot, User, Trash2, ChevronDown, Paperclip, X, FileText, Download, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, updatePreferences } = useAuth();
    const queryClient = useQueryClient();
    const [input, setInput] = useState('');
    const [file, setFile] = useState(null);
    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);

    const [selectedModel, setSelectedModel] = useState(user?.preferences?.selectedModel || "llama-3.3-70b-versatile");
    const [showModelMenu, setShowModelMenu] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    // Voice & Audio States
    const [isListening, setIsListening] = useState(false);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(user?.preferences?.voiceEnabled || false);
    const recognitionRef = useRef(null);

    const models = [
        { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B (Smartest)" },
        { id: "deepseek-r1-distill-llama-70b", name: "DeepSeek R1 70B (Reasoning)" },
        { id: "llama3-70b-8192", name: "Llama 3 70B (Fast)" },
        { id: "gemma-2-9b-it", name: "Gemma 2 9B (Lightweight)" }
    ];

    const { data: messages = [] } = useQuery({
        queryKey: ['chat', id],
        queryFn: async () => {
            if (!id) return [];
            const res = await api.get(`/chat/${id}`);
            return res.data;
        },
        enabled: !!id,
    });

    const sendMutation = useMutation({
        mutationFn: async ({ content, conversationId, model, fileData }) => {
            if (fileData) {
                const formData = new FormData();
                if (content.trim()) formData.append('message', content);
                else formData.append('message', 'What is this file?'); // Default generic message if skipped
                formData.append('conversationId', conversationId);
                formData.append('model', model);
                formData.append('file', fileData);
                return api.post('/chat/send', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            return api.post('/chat/send', { message: content || '...', conversationId, model });
        },
        onMutate: async ({ content, conversationId, fileData }) => {
            await queryClient.cancelQueries({ queryKey: ['chat', conversationId] });
            const previousMessages = queryClient.getQueryData(['chat', conversationId]) || [];

            // Optimistic update
            let optContent = content || 'What is this file?';
            if (fileData) {
                if (fileData.type.startsWith('image/')) {
                    const tempUrl = URL.createObjectURL(fileData);
                    optContent += `\n\n![${fileData.name}](${tempUrl})`;
                } else {
                    optContent += `\n\n[${fileData.name}](attachment://local)`;
                }
            }

            const newMsg = { role: 'user', content: optContent, timestamp: new Date() };
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
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
        onError: (err, vars, context) => {
            queryClient.setQueryData(['chat', vars.conversationId], context.previousMessages);
        }
    });

    // 🎙️ Speech Recognition Initialization
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

    // 🔊 Text-to-Speech
    const speakText = (text) => {
        if (!isVoiceEnabled) return;
        // Clean markdown for clearer speech
        const cleanText = text.replace(/[*#_`]/g, '').replace(/\[(.*?)\]\((.*?)\)/g, '$1');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.cancel(); // Stop current speech
        window.speechSynthesis.speak(utterance);
    };

    // Trigger TTS on new AI success
    useEffect(() => {
        if (isVoiceEnabled && messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.role === 'assistant') {
                speakText(lastMsg.content);
            }
        }
    }, [messages, isVoiceEnabled]);

    // Save preferences when they change
    useEffect(() => {
        if (!user) return;
        const syncPrefs = async () => {
            if (user.preferences?.voiceEnabled !== isVoiceEnabled || 
                user.preferences?.selectedModel !== selectedModel) {
                    try {
                        await updatePreferences({ 
                            voiceEnabled: isVoiceEnabled, 
                            selectedModel 
                        });
                    } catch (err) {
                        console.error("Failed to sync preferences", err);
                    }
            }
        };
        syncPrefs();
    }, [isVoiceEnabled, selectedModel, user, updatePreferences]);

    // Auto-scroll logic
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);



    const handleSend = async (e, overrideText) => {
        if (e) e.preventDefault();
        const msgContent = overrideText ?? input;
        
        if (!msgContent.trim() && !file) return;

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

        const fileAttachment = file;
        setInput(''); // Clear input immediately
        setFile(null); // Clear file immediately

        sendMutation.mutate({
            content: msgContent,
            conversationId: targetId,
            model: selectedModel,
            fileData: fileAttachment
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
        // Auto-submit the suggestion immediately
        handleSend({ preventDefault: () => { } }, text);
    };

    // On mobile: fills the space between top header and bottom nav. On desktop: sits inside the content area.
    return (
        <div className="fixed inset-x-0 top-[57px] bottom-[64px] md:static md:top-auto md:bottom-auto md:inset-x-auto md:h-[calc(100vh-6rem)] flex flex-col bg-zinc-900/50 md:rounded-2xl border-t md:border border-zinc-800 overflow-hidden relative md:m-6 shadow-2xl z-0">
            <Helmet>
                <title>Chat | Life OS</title>
            </Helmet>

            {/* Full Screen Image Preview Modal */}
            {previewImage && (
                <div 
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 cursor-zoom-out transition-all animate-in fade-in duration-300"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
                    <button 
                        className="absolute top-10 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all border border-white/10 shadow-2xl backdrop-blur-md z-[201] active:scale-95"
                        onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
                    >
                        <X className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <img 
                        src={previewImage} 
                        alt="Preview" 
                        className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()} 
                    />
                </div>
            )}
            {/* Model Selector - Centered Top */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-xs flex justify-center">
                <div className="relative">
                    <button
                        onClick={() => setShowModelMenu(!showModelMenu)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg text-xs md:text-sm text-zinc-300 hover:text-white transition-all border border-zinc-700/50 backdrop-blur-sm shadow-lg"
                    >
                        <span className="truncate max-w-[150px]">{models.find(m => m.id === selectedModel)?.name}</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                    </button>



                    {showModelMenu && (
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 z-50">
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
                
                {/* Voice Control Toggle */}
                <button
                    onClick={() => {
                        setIsVoiceEnabled(!isVoiceEnabled);
                        if (isVoiceEnabled) window.speechSynthesis.cancel();
                    }}
                    className={`ml-2 p-1.5 rounded-lg border transition-all ${
                        isVoiceEnabled 
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.3)]' 
                        : 'bg-zinc-800/80 border-zinc-700/50 text-zinc-500 hover:text-zinc-300'
                    }`}
                    title={isVoiceEnabled ? "Disable AI Voice" : "Enable AI Voice"}
                >
                    {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
            </div>

            {
                !id && messages.length === 0 ? (
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
                            {file && (
                                <div className="absolute -top-14 left-0 bg-zinc-800/90 text-zinc-300 px-3 py-2 rounded-xl text-xs flex items-center gap-3 border border-zinc-700/50 shadow-lg font-medium">
                                    {file.type.startsWith('image/') ? (
                                        <img src={URL.createObjectURL(file)} alt="preview" className="w-8 h-8 rounded shrink-0 object-cover border border-zinc-700" />
                                    ) : (
                                        <div className="w-8 h-8 rounded bg-zinc-700/50 flex items-center justify-center shrink-0 border border-zinc-600">
                                            <Paperclip className="w-4 h-4 text-zinc-400" />
                                        </div>
                                    )}
                                    <span className="truncate max-w-[150px]">{file.name}</span>
                                    <button type="button" onClick={() => setFile(null)} className="p-1 hover:bg-zinc-700 rounded-full transition-colors ml-1"><X className="w-3.5 h-3.5" /></button>
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} onChange={(e) => e.target.files[0] && setFile(e.target.files[0])} className="hidden" accept=".pdf,.txt,.js,.json,.jsx,image/*" />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute left-3 top-3 text-zinc-500 hover:text-white transition-colors"
                            >
                                <Paperclip className="w-5 h-5" />
                            </button>
                            <textarea
                                autoFocus
                                rows={1}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend(e);
                                    }
                                }}
                                placeholder="Message Life OS or upload a file..."
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-14 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium resize-none min-h-[56px] custom-scrollbar"
                                style={{ maxHeight: '200px' }}
                            />
                            <button
                                type="submit"
                                disabled={sendMutation.isPending || (!input.trim() && !file)}
                                className="absolute right-2 top-2 p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors disabled:opacity-50"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                            <button
                                type="button"
                                onClick={toggleListening}
                                className={`absolute right-12 top-2 p-2 rounded-lg transition-all ${
                                    isListening 
                                    ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                                    : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                                }`}
                            >
                                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </button>
                        </form>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 pt-14 md:pt-6 space-y-6 scroll-smooth overscroll-contain" ref={scrollRef}>
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
                                                    urlTransform={(url) => url}
                                                    /* eslint-disable no-unused-vars */
                                                    components={{
                                                        p: ({ node, ...props }) => <div className="mb-2 last:mb-0" {...props} />,
                                                        ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                                                        ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                                                        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                                        code: ({ node, className, children, ...props }) => (
                                                            <code className={`${className ?? ''} bg-zinc-700/50 px-1 py-0.5 rounded text-xs font-mono`} {...props}>
                                                                {children}
                                                            </code>
                                                        ),
                                                        pre: ({ node, children, ...props }) => (
                                                            <pre className="bg-zinc-900/50 p-3 rounded-lg overflow-x-auto my-2 text-xs font-mono border border-zinc-700/50" {...props}>
                                                                {children}
                                                            </pre>
                                                        ),
                                                        img: ({ node, ...props }) => (
                                                            <div className="relative inline-block cursor-zoom-in group mt-2" onClick={() => setPreviewImage(props.src)}>
                                                                <img className="rounded-xl max-w-full max-h-[300px] object-cover my-2 border border-zinc-700/50 shadow-md transition-all group-hover:opacity-90 group-hover:ring-2 group-hover:ring-indigo-500/50" {...props} />
                                                            </div>
                                                        ),
                                                        a: ({ node, children, ...props }) => {
                                                            if (props.href && props.href.startsWith('attachment://')) {
                                                                const url = props.href.replace('attachment://', '');
                                                                const filename = children[0];
                                                                const extMatch = String(filename).match(/\.([^.]+)$/);
                                                                const ext = extMatch ? extMatch[1].toUpperCase() : 'FILE';
                                                                
                                                                return (
                                                                    <a 
                                                                        href={url === 'local' ? '#' : url} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-3 md:gap-4 p-3 md:p-4 mt-3 bg-black/20 hover:bg-black/30 border border-white/10 rounded-xl transition-colors w-full max-w-sm group text-left no-underline"
                                                                    >
                                                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-black/40 flex items-center justify-center shrink-0 border border-white/5">
                                                                            <FileText className="w-5 h-5 md:w-6 md:h-6 text-zinc-300" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <h4 className="text-white font-medium text-xs md:text-sm truncate">{filename}</h4>
                                                                            <p className="text-zinc-300 text-[10px] md:text-xs mt-0.5">Document · {ext}</p>
                                                                        </div>
                                                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <Download className="w-4 h-4 text-white" />
                                                                        </div>
                                                                    </a>
                                                                );
                                                            }
                                                            return <a className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors" {...props}>{children}</a>;
                                                        }
                                                    }}
                                                    /* eslint-enable no-unused-vars */
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

                        <form onSubmit={handleSend} className="p-4 bg-zinc-900/80 backdrop-blur-md border-t border-zinc-800 relative">
                            <div className="relative max-w-5xl mx-auto">
                                {file && (
                                    <div className="absolute -top-14 left-0 bg-zinc-800/90 text-zinc-300 px-3 py-2 rounded-xl text-xs flex items-center gap-3 border border-zinc-700/50 shadow-lg font-medium backdrop-blur-md">
                                        {file.type.startsWith('image/') ? (
                                            <img src={URL.createObjectURL(file)} alt="preview" className="w-8 h-8 rounded shrink-0 object-cover border border-zinc-600" />
                                        ) : (
                                            <div className="w-8 h-8 rounded bg-zinc-700/50 flex items-center justify-center shrink-0 border border-zinc-600">
                                                <Paperclip className="w-4 h-4 text-zinc-400" />
                                            </div>
                                        )}
                                        <span className="truncate max-w-[150px]">{file.name}</span>
                                        <button type="button" onClick={() => setFile(null)} className="p-1 hover:bg-zinc-700 rounded-full transition-colors ml-1"><X className="w-3.5 h-3.5" /></button>
                                    </div>
                                )}
                                <input type="file" ref={fileInputRef} onChange={(e) => e.target.files[0] && setFile(e.target.files[0])} className="hidden" accept=".pdf,.txt,.js,.json,.jsx,image/*" />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute left-3 top-3 text-zinc-500 hover:text-indigo-400 transition-colors z-10"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <textarea
                                    autoFocus
                                    rows={1}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend(e);
                                        }
                                    }}
                                    placeholder="Message Life OS or upload a file..."
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-11 pr-14 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium resize-none min-h-[56px] custom-scrollbar"
                                    style={{ maxHeight: '200px' }}
                                />
                                <button
                                    type="submit"
                                    disabled={sendMutation.isPending || (!input.trim() && !file)}
                                    className="absolute right-2 top-2 p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors disabled:opacity-50 shadow-lg shadow-indigo-500/20 z-10"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={toggleListening}
                                    className={`absolute right-12 top-2 p-2 rounded-lg transition-all z-10 ${
                                        isListening 
                                        ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                                        : 'bg-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-600'
                                    }`}
                                >
                                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                </button>
                            </div>
                        </form>
                    </>
                )
            }
        </div >
    );
}
