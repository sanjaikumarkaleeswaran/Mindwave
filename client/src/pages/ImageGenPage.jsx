
import { useState } from 'react';
import { Sparkles, Download, Wand2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/axios';

export default function ImageGenPage() {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState(null);

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsGenerating(true);
        setGeneratedImage(null);

        try {
            const res = await api.post('/image/generate', { prompt });
            setGeneratedImage(res.data.imageUrl);
        } catch (err) {
            console.error("Failed to generate image:", err);
            alert("Failed to generate image. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="h-full flex flex-col p-6 max-w-6xl mx-auto space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Wand2 className="w-8 h-8 text-pink-500" />
                    AI Image Studio
                </h1>
                <p className="text-zinc-400">Turn your imagination into reality with our advanced diffusion models.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
                {/* Control Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <form onSubmit={handleGenerate} className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Describe your image
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="A cyberpunk city with flying cars in neon rain..."
                                className="w-full h-32 bg-zinc-950/50 border border-zinc-700 rounded-xl p-4 text-white focus:outline-none focus:border-pink-500 transition-colors resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isGenerating || !prompt}
                            className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all
                                ${isGenerating
                                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 text-white shadow-lg shadow-pink-900/20'
                                }`}
                        >
                            {isGenerating ? (
                                <>
                                    <Sparkles className="w-5 h-5 animate-spin" />
                                    Creating Masterpiece...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-5 h-5" />
                                    Generate Art
                                </>
                            )}
                        </button>
                    </form>

                    <div className="bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50">
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Recent Inspirations</h3>
                        <div className="flex flex-wrap gap-2">
                            {['Cyberpunk City', 'Anime Portrait', 'Abstract Fluid', 'Space Station'].map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => setPrompt(tag)}
                                    className="px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-700 text-xs text-zinc-300 rounded-lg transition-colors"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Canvas / Result Area */}
                <div className="lg:col-span-2 bg-zinc-950 rounded-3xl border border-zinc-900 flex items-center justify-center overflow-hidden relative group">
                    <AnimatePresence mode="wait">
                        {isGenerating ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center space-y-4"
                            >
                                <div className="relative w-24 h-24 mx-auto">
                                    <div className="absolute inset-0 border-t-4 border-pink-500 rounded-full animate-spin"></div>
                                    <div className="absolute inset-2 border-t-4 border-purple-500 rounded-full animate-spin animation-delay-150"></div>
                                    <div className="absolute inset-4 border-t-4 border-indigo-500 rounded-full animate-spin animation-delay-300"></div>
                                </div>
                                <p className="text-zinc-500 animate-pulse">Dreaming up pixels...</p>
                            </motion.div>
                        ) : generatedImage ? (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative w-full h-full"
                            >
                                <img
                                    src={generatedImage}
                                    alt="Generated"
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://placehold.co/600x400?text=Generation+Failed';
                                        alert("Failed to load generic image from provider.");
                                    }}
                                />
                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-end">
                                    <div>
                                        <p className="text-white font-medium truncate max-w-md">{prompt}</p>
                                        <p className="text-zinc-400 text-xs">High Resolution • v5.0</p>
                                    </div>
                                    <button className="p-3 bg-white text-black rounded-full hover:bg-zinc-200 transition-colors">
                                        <Download className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center text-zinc-600"
                            >
                                <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p>Your canvas is empty.</p>
                                <p className="text-sm">Enter a prompt to start creating.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
