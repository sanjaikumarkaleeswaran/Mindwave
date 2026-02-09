import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen,
    Plus,
    Calendar,
    Sparkles,
    Trash2,
    Edit3,
    Save,
    X,
    Smile,
    Meh,
    Frown,
    TrendingUp,
    Brain,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import api from '../lib/axios';

const JournalPage = () => {
    const [journals, setJournals] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(null);
    const [expandedEntry, setExpandedEntry] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        mood: '',
        tags: []
    });
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        fetchJournals();
    }, []);

    const fetchJournals = async () => {
        try {
            setLoading(true);
            const response = await api.get('/journal');
            setJournals(response.data);
        } catch (error) {
            console.error('Error fetching journals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.content.trim()) {
            alert('Please write something in your journal');
            return;
        }

        try {
            if (editingId) {
                await api.put(`/journal/${editingId}`, formData);
            } else {
                await api.post('/journal', formData);
            }

            resetForm();
            fetchJournals();
        } catch (error) {
            console.error('Error saving journal:', error);
            alert('Failed to save journal entry');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this journal entry?')) {
            return;
        }

        try {
            await api.delete(`/journal/${id}`);
            fetchJournals();
        } catch (error) {
            console.error('Error deleting journal:', error);
            alert('Failed to delete journal entry');
        }
    };

    const handleEdit = (journal) => {
        setEditingId(journal._id);
        setFormData({
            title: journal.title || '',
            content: journal.content,
            mood: journal.mood || '',
            tags: journal.tags || []
        });
        setIsCreating(true);
    };

    const handleAnalyze = async (id) => {
        try {
            setAnalyzing(id);
            const response = await api.post(`/journal/${id}/analyze`);

            // Update the journal in the list
            setJournals(journals.map(j =>
                j._id === id ? response.data : j
            ));
        } catch (error) {
            console.error('Error analyzing journal:', error);
            alert('Failed to analyze journal entry');
        } finally {
            setAnalyzing(null);
        }
    };

    const resetForm = () => {
        setFormData({ title: '', content: '', mood: '', tags: [] });
        setTagInput('');
        setIsCreating(false);
        setEditingId(null);
    };

    const addTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
            setFormData({
                ...formData,
                tags: [...formData.tags, tagInput.trim()]
            });
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter(tag => tag !== tagToRemove)
        });
    };

    const getMoodIcon = (mood) => {
        switch (mood) {
            case 'great':
            case 'good':
                return <Smile className="w-5 h-5 text-green-400" />;
            case 'okay':
                return <Meh className="w-5 h-5 text-yellow-400" />;
            case 'bad':
            case 'terrible':
                return <Frown className="w-5 h-5 text-red-400" />;
            default:
                return null;
        }
    };

    const getSentimentColor = (sentiment) => {
        switch (sentiment?.toLowerCase()) {
            case 'positive':
                return 'text-green-400 bg-green-400/10';
            case 'negative':
                return 'text-red-400 bg-red-400/10';
            case 'mixed':
                return 'text-yellow-400 bg-yellow-400/10';
            default:
                return 'text-gray-400 bg-gray-400/10';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
                                <BookOpen className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-white mb-1">
                                    Daily Journal
                                </h1>
                                <p className="text-gray-400">
                                    Document your thoughts, track your journey
                                </p>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsCreating(!isCreating)}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
                        >
                            {isCreating ? (
                                <>
                                    <X className="w-5 h-5" />
                                    Cancel
                                </>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5" />
                                    New Entry
                                </>
                            )}
                        </motion.button>
                    </div>
                </motion.div>

                {/* Create/Edit Form */}
                <AnimatePresence>
                    {isCreating && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-8"
                        >
                            <form onSubmit={handleSubmit} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20 shadow-xl">
                                <div className="space-y-4">
                                    {/* Title */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Title (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="Give your entry a title..."
                                            className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
                                        />
                                    </div>

                                    {/* Mood Selector */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            How are you feeling?
                                        </label>
                                        <div className="flex gap-2">
                                            {[
                                                { value: 'great', label: '😄 Great', color: 'from-green-500 to-emerald-500' },
                                                { value: 'good', label: '🙂 Good', color: 'from-blue-500 to-cyan-500' },
                                                { value: 'okay', label: '😐 Okay', color: 'from-yellow-500 to-orange-500' },
                                                { value: 'bad', label: '😟 Bad', color: 'from-orange-500 to-red-500' },
                                                { value: 'terrible', label: '😢 Terrible', color: 'from-red-500 to-pink-500' }
                                            ].map((mood) => (
                                                <button
                                                    key={mood.value}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, mood: mood.value })}
                                                    className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${formData.mood === mood.value
                                                            ? `bg-gradient-to-r ${mood.color} text-white shadow-lg`
                                                            : 'bg-slate-900/50 text-gray-400 hover:bg-slate-900 border border-purple-500/10'
                                                        }`}
                                                >
                                                    {mood.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            What's on your mind? *
                                        </label>
                                        <textarea
                                            value={formData.content}
                                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                            placeholder="Write about your day, thoughts, feelings, experiences..."
                                            rows={8}
                                            className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all resize-none"
                                            required
                                        />
                                    </div>

                                    {/* Tags */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Tags
                                        </label>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                                placeholder="Add a tag..."
                                                className="flex-1 px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={addTag}
                                                className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-xl hover:bg-purple-500/30 transition-all"
                                            >
                                                Add
                                            </button>
                                        </div>
                                        {formData.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {formData.tags.map((tag, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm flex items-center gap-2"
                                                    >
                                                        {tag}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeTag(tag)}
                                                            className="hover:text-purple-100"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Submit Buttons */}
                                    <div className="flex gap-3 pt-2">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="submit"
                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
                                        >
                                            <Save className="w-5 h-5" />
                                            {editingId ? 'Update Entry' : 'Save Entry'}
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="button"
                                            onClick={resetForm}
                                            className="px-6 py-3 bg-slate-700/50 text-gray-300 rounded-xl font-semibold hover:bg-slate-700 transition-all"
                                        >
                                            Cancel
                                        </motion.button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Journal Entries List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
                            <p className="text-gray-400 mt-4">Loading your journals...</p>
                        </div>
                    ) : journals.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12 bg-slate-800/30 rounded-2xl border border-purple-500/10"
                        >
                            <BookOpen className="w-16 h-16 text-purple-500/50 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-300 mb-2">
                                No journal entries yet
                            </h3>
                            <p className="text-gray-500 mb-6">
                                Start documenting your journey by creating your first entry
                            </p>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
                            >
                                Create First Entry
                            </button>
                        </motion.div>
                    ) : (
                        journals.map((journal, index) => (
                            <motion.div
                                key={journal._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20 shadow-xl hover:border-purple-500/40 transition-all"
                            >
                                {/* Entry Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Calendar className="w-4 h-4 text-purple-400" />
                                            <span className="text-sm text-gray-400">
                                                {new Date(journal.date).toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                            {journal.mood && getMoodIcon(journal.mood)}
                                        </div>
                                        {journal.title && (
                                            <h3 className="text-xl font-semibold text-white mb-2">
                                                {journal.title}
                                            </h3>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleAnalyze(journal._id)}
                                            disabled={analyzing === journal._id}
                                            className="p-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-all disabled:opacity-50"
                                            title="AI Analysis"
                                        >
                                            {analyzing === journal._id ? (
                                                <div className="w-5 h-5 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Sparkles className="w-5 h-5" />
                                            )}
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleEdit(journal)}
                                            className="p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-all"
                                            title="Edit"
                                        >
                                            <Edit3 className="w-5 h-5" />
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleDelete(journal._id)}
                                            className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </motion.button>
                                    </div>
                                </div>

                                {/* Entry Content */}
                                <div className="mb-4">
                                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                                        {journal.content}
                                    </p>
                                </div>

                                {/* Tags */}
                                {journal.tags && journal.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {journal.tags.map((tag, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-purple-500/10 text-purple-300 rounded-full text-sm border border-purple-500/20"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* AI Analysis */}
                                {journal.aiAnalysis && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mt-4 pt-4 border-t border-purple-500/20"
                                    >
                                        <button
                                            onClick={() => setExpandedEntry(expandedEntry === journal._id ? null : journal._id)}
                                            className="flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-all mb-3"
                                        >
                                            <Brain className="w-5 h-5" />
                                            <span className="font-semibold">AI Insights</span>
                                            {expandedEntry === journal._id ? (
                                                <ChevronUp className="w-4 h-4" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4" />
                                            )}
                                        </button>

                                        <AnimatePresence>
                                            {expandedEntry === journal._id && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="space-y-3"
                                                >
                                                    {/* Sentiment */}
                                                    {journal.aiAnalysis.sentiment && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-gray-400">Sentiment:</span>
                                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(journal.aiAnalysis.sentiment)}`}>
                                                                {journal.aiAnalysis.sentiment}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Summary */}
                                                    {journal.aiAnalysis.summary && (
                                                        <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
                                                            <p className="text-sm text-gray-300 leading-relaxed">
                                                                {journal.aiAnalysis.summary}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Key Topics */}
                                                    {journal.aiAnalysis.keyTopics && journal.aiAnalysis.keyTopics.length > 0 && (
                                                        <div>
                                                            <p className="text-sm text-gray-400 mb-2">Key Topics:</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {journal.aiAnalysis.keyTopics.map((topic, idx) => (
                                                                    <span
                                                                        key={idx}
                                                                        className="px-3 py-1 bg-pink-500/10 text-pink-300 rounded-full text-sm border border-pink-500/20"
                                                                    >
                                                                        {topic}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Insights */}
                                                    {journal.aiAnalysis.insights && journal.aiAnalysis.insights.length > 0 && (
                                                        <div>
                                                            <p className="text-sm text-gray-400 mb-2">Insights:</p>
                                                            <ul className="space-y-2">
                                                                {journal.aiAnalysis.insights.map((insight, idx) => (
                                                                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                                                                        <TrendingUp className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                                                        <span>{insight}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    <p className="text-xs text-gray-500 mt-3">
                                                        Analyzed on {new Date(journal.aiAnalysis.analyzedAt).toLocaleDateString()}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                )}
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default JournalPage;
