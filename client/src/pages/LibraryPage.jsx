import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Library as LibraryIcon,
    Plus,
    X,
    Save,
    Trash2,
    BookOpen,
    Clock,
    CheckCircle,
    Edit3,
    Book,
    Search,
    Sparkles,
    Upload,
    FileText,
    Star
} from 'lucide-react';
import api from '../lib/axios';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const getBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace('/api', '');
    return import.meta.env.PROD ? '' : 'http://localhost:5000';
};

const LibraryPage = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [activeTab, setActiveTab] = useState('reading'); // 'reading', 'want_to_read', 'finished'

    const [formData, setFormData] = useState({
        title: '',
        author: '',
        totalPages: '',
        coverUrl: '',
        status: 'want_to_read',
        pdfFile: null,
        rating: 0,
        notes: ''
    });

    const [summaryModalOpen, setSummaryModalOpen] = useState(false);
    const [currentSummary, setCurrentSummary] = useState('');
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summaryBookTitle, setSummaryBookTitle] = useState('');

    const [bookToDelete, setBookToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiRecommendations, setAiRecommendations] = useState([]);
    const [isAiLoading, setIsAiLoading] = useState(false);

    const [progressData, setProgressData] = useState({
        id: null,
        currentPage: ''
    });

    const [readingPdf, setReadingPdf] = useState(null);

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        try {
            setLoading(true);
            const response = await api.get('/books');
            setBooks(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching books:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ title: '', author: '', totalPages: '', coverUrl: '', status: 'want_to_read', pdfFile: null, rating: 0, notes: '' });
        setSearchQuery('');
        setIsCreating(false);
        setEditingId(null);
    };

    const searchOpenLibrary = async (e, customQuery = null) => {
        if (e) e.preventDefault();
        const queryToSearch = customQuery || searchQuery;
        if (!queryToSearch.trim()) return;
        
        setIsSearching(true);
        try {
            const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(queryToSearch)}&limit=1`);
            const data = await res.json();
            if (data.docs && data.docs.length > 0) {
                const book = data.docs[0];
                
                const isIsbnSearch = /^\d+$/.test(queryToSearch.replace(/[- ]/g, ''));
                const formatTitleCase = (str) => {
                    return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                };

                setFormData(prev => ({
                    ...prev,
                    title: isIsbnSearch ? (book.title || prev.title) : (formatTitleCase(queryToSearch) || book.title || prev.title),
                    author: book.author_name ? book.author_name[0] : prev.author,
                    totalPages: book.number_of_pages_median || prev.totalPages,
                    coverUrl: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : prev.coverUrl
                }));
                // Only clear search query if we did a manual search, otherwise keep it for context
                if (!customQuery) setSearchQuery('');
            } else if (!customQuery) {
                // Only alert on manual searches
                alert('No book found with that title.');
            }
        } catch (error) {
            console.error('Error searching open library:', error);
            if (!customQuery) alert('Failed to search book details.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleGetRecommendations = async (e) => {
        e.preventDefault();
        if (!aiPrompt.trim()) return;
        setIsAiLoading(true);
        try {
            const res = await api.post('/ai/book-recommendations', { prompt: aiPrompt });
            setAiRecommendations(res.data.suggestions || []);
        } catch (error) {
            console.error('AI error:', error);
            alert('Failed to get recommendations');
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('author', formData.author);
            data.append('totalPages', parseInt(formData.totalPages) || 0);
            data.append('coverUrl', formData.coverUrl);
            data.append('status', formData.status);
            data.append('rating', formData.rating);
            data.append('notes', formData.notes);
            if (formData.pdfFile) {
                data.append('pdf', formData.pdfFile);
            }

            if (editingId) {
                await api.put(`/books/${editingId}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/books', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            resetForm();
            fetchBooks();
        } catch (error) {
            console.error('Error saving book:', error);
            alert('Failed to save book');
        }
    };

    const confirmDelete = async () => {
        if (!bookToDelete) return;
        setIsDeleting(true);
        try {
            await api.delete(`/books/${bookToDelete._id}`);
            setBookToDelete(null);
            fetchBooks();
        } catch (error) {
            console.error('Error deleting book:', error);
            alert('Failed to delete book');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleUpdateProgress = async (id, currentPage) => {
        try {
            await api.put(`/books/${id}`, { currentPage: parseInt(currentPage) });
            setProgressData({ id: null, currentPage: '' });
            fetchBooks();
        } catch (error) {
            console.error('Error updating progress:', error);
            alert('Failed to update progress');
        }
    };

    const handleGenerateSummary = async (book) => {
        setSummaryBookTitle(book.title);
        setSummaryModalOpen(true);
        setCurrentSummary('');
        setIsSummarizing(true);
        try {
            const res = await api.post('/ai/book-summary', { 
                title: book.title, 
                author: book.author,
                notes: book.notes || '' 
            });
            setCurrentSummary(res.data.summary);
        } catch (error) {
            console.error('Error generating summary:', error);
            setCurrentSummary('Failed to generate summary.');
        } finally {
            setIsSummarizing(false);
        }
    };

    const filteredBooks = books.filter(b => b.status === activeTab);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900/20 to-slate-900 p-4 md:p-6 lg:p-8 mobile-page-pad overflow-x-hidden w-full max-w-full">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 md:mb-8"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl shrink-0">
                                <LibraryIcon className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
                                    Library
                                </h1>
                                <p className="text-sm md:text-base text-gray-400">
                                    Track your reading progress and organize your books
                                </p>
                            </div>
                        </div>

                        <div className="flex w-full md:w-auto gap-3">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    if(isCreating) setIsCreating(false);
                                    setIsAiModalOpen(!isAiModalOpen);
                                }}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all"
                            >
                                <Sparkles className="w-5 h-5" />
                                <span className="hidden sm:inline">AI Recommend</span>
                                <span className="sm:hidden">AI</span>
                            </motion.button>
                            
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    if(isAiModalOpen) setIsAiModalOpen(false);
                                    resetForm();
                                    setIsCreating(!isCreating);
                                }}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all"
                            >
                                {isCreating ? (
                                    <>
                                        <X className="w-5 h-5" />
                                        Cancel
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5" />
                                        Add Book
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                <AnimatePresence>
                    {isAiModalOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-8"
                        >
                            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-pink-500/20 shadow-xl">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-pink-400" />
                                        AI Book Recommendations
                                    </h2>
                                    <button onClick={() => {setIsAiModalOpen(false); setAiRecommendations([]); setAiPrompt('');}} className="text-gray-400 hover:text-white">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <form onSubmit={handleGetRecommendations} className="flex flex-col sm:flex-row gap-2 mb-6">
                                    <input
                                        type="text"
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        placeholder="What kind of book are you looking for? (e.g. 'sci-fi about time travel')"
                                        className="flex-1 px-4 py-3 bg-slate-900/50 border border-pink-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 transition-all"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={isAiLoading || !aiPrompt.trim()}
                                        className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isAiLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                        Ask AI
                                    </button>
                                </form>

                                {aiRecommendations.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {aiRecommendations.map((rec, idx) => (
                                            <div key={idx} className="bg-slate-900/50 p-4 rounded-xl border border-white/5 flex flex-col">
                                                <h3 className="font-bold text-white mb-1">{rec.title}</h3>
                                                <p className="text-sm text-pink-400 mb-2">by {rec.author}</p>
                                                <p className="text-sm text-gray-400 mb-4 flex-1 italic">"{rec.reason}"</p>
                                                <button
                                                    onClick={() => {
                                                        // Instantly pre-fill what the AI knows
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            title: rec.title,
                                                            author: rec.author
                                                        }));
                                                        setSearchQuery(rec.title);
                                                        setIsAiModalOpen(false);
                                                        setIsCreating(true);
                                                        
                                                        // Silently fetch cover art and page count from OpenLibrary in the background!
                                                        searchOpenLibrary(null, rec.title);
                                                    }}
                                                    className="w-full py-2 bg-indigo-500/20 text-indigo-300 rounded-lg text-sm font-medium hover:bg-indigo-500/30 transition-colors"
                                                >
                                                    Add to Library
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Create/Edit Form */}
                <AnimatePresence>
                    {isCreating && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-8"
                        >
                            <form onSubmit={handleSubmit} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-indigo-500/20 shadow-xl">
                                {!editingId && (
                                    <div className="mb-6 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
                                        <label className="block text-sm font-medium text-indigo-300 mb-2">Auto-fill with OpenLibrary API</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        searchOpenLibrary(e);
                                                    }
                                                }}
                                                placeholder="Enter book title (e.g. Atomic Habits)"
                                                className="flex-1 px-4 py-2 bg-slate-900/50 border border-indigo-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={searchOpenLibrary}
                                                disabled={isSearching || !searchQuery.trim()}
                                                className="px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-xl hover:bg-indigo-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {isSearching ? <div className="w-4 h-4 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
                                                Search
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-900/50 border border-indigo-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Author *</label>
                                        <input
                                            type="text"
                                            value={formData.author}
                                            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-900/50 border border-indigo-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Total Pages (optional)</label>
                                        <input
                                            type="number"
                                            value={formData.totalPages}
                                            onChange={(e) => setFormData({ ...formData, totalPages: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-900/50 border border-indigo-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-900/50 border border-indigo-500/20 rounded-xl text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                                        >
                                            <option value="want_to_read">Want to Read</option>
                                            <option value="reading">Currently Reading</option>
                                            <option value="finished">Finished</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Upload PDF (optional)</label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={(e) => setFormData({ ...formData, pdfFile: e.target.files[0] })}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="w-full px-4 py-3 bg-slate-900/50 border border-indigo-500/20 rounded-xl text-gray-400 flex items-center justify-between transition-all hover:bg-slate-900">
                                                <span className="truncate">{formData.pdfFile ? formData.pdfFile.name : 'Choose a PDF file...'}</span>
                                                <Upload className="w-4 h-4 text-indigo-400" />
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Total pages will be auto-calculated!</p>
                                    </div>
                                    {editingId && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-2">Rating</label>
                                                <div className="flex gap-2">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, rating: star })}
                                                            className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                                                        >
                                                            <Star className={`w-6 h-6 ${formData.rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-300 mb-2">Personal Notes / Review</label>
                                                <textarea
                                                    value={formData.notes}
                                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                    rows={3}
                                                    className="w-full px-4 py-3 bg-slate-900/50 border border-indigo-500/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                                                    placeholder="What did you think of the book?"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="flex gap-3 pt-6">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all"
                                    >
                                        <Save className="w-5 h-5" />
                                        {editingId ? 'Update Book' : 'Save Book'}
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tabs */}
                <div className="flex p-1 bg-slate-800/50 backdrop-blur-sm rounded-xl mb-6 border border-white/5 w-full md:w-fit">
                    {[
                        { id: 'reading', label: 'Reading', icon: BookOpen },
                        { id: 'want_to_read', label: 'Want to Read', icon: Clock },
                        { id: 'finished', label: 'Finished', icon: CheckCircle },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                "flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all relative",
                                activeTab === tab.id ? "text-white shadow-sm" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                            )}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="libraryTabIndicator"
                                    className="absolute inset-0 bg-indigo-500/20 border border-indigo-500/30 rounded-lg"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <tab.icon className="w-4 h-4 relative z-10" />
                            <span className="relative z-10">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Books Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
                    </div>
                ) : filteredBooks.length === 0 ? (
                    <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-indigo-500/10">
                        <Book className="w-16 h-16 text-indigo-500/50 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-300 mb-2">No books found</h3>
                        <p className="text-gray-500">You don't have any books in this category yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredBooks.map((book, index) => {
                            const progress = book.totalPages > 0 ? Math.min(100, Math.round((book.currentPage / book.totalPages) * 100)) : 0;
                            
                            return (
                                <motion.div
                                    key={book._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-indigo-500/20 shadow-xl relative group flex flex-col h-full"
                                >
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-30">
                                        <button
                                            onClick={() => {
                                                setEditingId(book._id);
                                                setFormData({
                                                    title: book.title,
                                                    author: book.author,
                                                    totalPages: book.totalPages || '',
                                                    coverUrl: book.coverUrl || '',
                                                    status: book.status,
                                                    rating: book.rating || 0,
                                                    notes: book.notes || ''
                                                });
                                                setIsCreating(true);
                                            }}
                                            className="p-1.5 bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/30 transition-all"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setBookToDelete(book)}
                                            className="p-1.5 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {book.coverUrl && (
                                        <div className="mb-4 -mx-6 -mt-6 rounded-t-2xl overflow-hidden h-48 bg-slate-900 relative">
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-800/90 via-slate-800/20 to-transparent z-10" />
                                            <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover opacity-80" />
                                        </div>
                                    )}

                                    <div className="flex-1 relative z-20">
                                        <h3 className="text-xl font-bold text-white mb-1 pr-12 line-clamp-2">{book.title}</h3>
                                        <p className="text-gray-400 text-sm mb-4">{book.author}</p>
                                        
                                        {book.totalPages > 0 && book.status !== 'want_to_read' && (
                                            <div className="space-y-2 mt-4">
                                                <div className="flex justify-between text-xs text-gray-400 font-medium">
                                                    <span>{book.currentPage} / {book.totalPages} pages</span>
                                                    <span>{progress}%</span>
                                                </div>
                                                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-white/5">
                                                    <motion.div 
                                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress}%` }}
                                                        transition={{ duration: 1, ease: "easeOut" }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {book.status === 'reading' && (
                                        <div className="mt-6 pt-4 border-t border-white/5 space-y-3">
                                            {book.pdfUrl && (
                                                <button
                                                    onClick={() => {
                                                        setProgressData({ id: book._id, currentPage: book.currentPage || '' });
                                                        setReadingPdf(book);
                                                    }}
                                                    className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    Read PDF
                                                </button>
                                            )}

                                            {progressData.id === book._id && !readingPdf ? (
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        placeholder="Page"
                                                        value={progressData.currentPage}
                                                        onChange={e => setProgressData({ ...progressData, currentPage: e.target.value })}
                                                        className="w-full px-3 py-1.5 bg-slate-900 border border-indigo-500/30 rounded-lg text-white text-sm focus:outline-none"
                                                    />
                                                    <button
                                                        onClick={() => handleUpdateProgress(book._id, progressData.currentPage)}
                                                        className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setProgressData({ id: null, currentPage: '' })}
                                                        className="px-3 py-1.5 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : !readingPdf ? (
                                                <button
                                                    onClick={() => setProgressData({ id: book._id, currentPage: book.currentPage || '' })}
                                                    className="w-full py-2 bg-indigo-500/10 text-indigo-300 rounded-xl font-medium text-sm hover:bg-indigo-500/20 transition-all border border-indigo-500/20"
                                                >
                                                    Update Progress manually
                                                </button>
                                            ) : null}
                                        </div>
                                    )}

                                    {(book.status === 'finished' || book.status === 'reading') && (
                                        <div className="mt-4 pt-4 border-t border-white/5">
                                            <button
                                                onClick={() => handleGenerateSummary(book)}
                                                className="w-full py-2 bg-gradient-to-r from-pink-500/10 to-rose-500/10 text-pink-400 rounded-xl font-medium text-sm hover:from-pink-500/20 hover:to-rose-500/20 transition-all border border-pink-500/20 flex items-center justify-center gap-2"
                                            >
                                                <Sparkles className="w-4 h-4" />
                                                Generate AI Summary
                                            </button>
                                        </div>
                                    )}

                                    {book.status === 'want_to_read' && (
                                        <div className="mt-6 pt-4 border-t border-white/5">
                                            <button
                                                onClick={() => {
                                                    api.put(`/books/${book._id}`, { status: 'reading' }).then(() => fetchBooks());
                                                }}
                                                className="w-full py-2 bg-indigo-500/10 text-indigo-300 rounded-xl font-medium text-sm hover:bg-indigo-500/20 transition-all border border-indigo-500/20"
                                            >
                                                Start Reading
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* PDF Reader Modal */}
            <AnimatePresence>
                {readingPdf && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex flex-col"
                    >
                        <div className="p-4 bg-slate-900 flex justify-between items-center border-b border-white/10">
                            <h3 className="text-white font-bold text-lg flex items-center gap-2 truncate pr-4">
                                <FileText className="w-5 h-5 text-indigo-400" />
                                {readingPdf.title}
                            </h3>
                            <div className="flex items-center gap-4 flex-shrink-0">
                                <div className="hidden sm:flex items-center gap-2">
                                    <span className="text-gray-400 text-sm">Save Progress:</span>
                                    <input
                                        type="number"
                                        value={progressData.currentPage}
                                        onChange={e => setProgressData({ ...progressData, currentPage: e.target.value })}
                                        placeholder={`Page`}
                                        className="w-24 px-3 py-1.5 bg-slate-800 border border-indigo-500/30 rounded-lg text-white text-sm focus:outline-none"
                                    />
                                    <button
                                        onClick={() => {
                                            handleUpdateProgress(readingPdf._id, progressData.currentPage);
                                            setReadingPdf(null);
                                        }}
                                        className="px-4 py-1.5 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors"
                                    >
                                        Save & Close
                                    </button>
                                </div>
                                <button onClick={() => setReadingPdf(null)} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors sm:hidden">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        {/* Mobile quick save bar */}
                        <div className="sm:hidden p-3 bg-slate-800 border-b border-white/5 flex gap-2">
                            <input
                                type="number"
                                value={progressData.currentPage}
                                onChange={e => setProgressData({ ...progressData, currentPage: e.target.value })}
                                placeholder={`Page`}
                                className="flex-1 px-3 py-1.5 bg-slate-900 border border-indigo-500/30 rounded-lg text-white text-sm focus:outline-none"
                            />
                            <button
                                onClick={() => {
                                    handleUpdateProgress(readingPdf._id, progressData.currentPage);
                                    setReadingPdf(null);
                                }}
                                className="px-4 py-1.5 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors"
                            >
                                Save
                            </button>
                        </div>
                        <div className="flex-1 w-full h-full bg-[#323639]">
                            <iframe
                                src={`${getBaseUrl()}${readingPdf.pdfUrl}#page=${readingPdf.currentPage || 1}`}
                                className="w-full h-full border-none"
                                title="PDF Reader"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AI Summary Modal */}
            <AnimatePresence>
                {summaryModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setSummaryModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-slate-900 border border-pink-500/20 rounded-2xl p-6 shadow-2xl shadow-pink-500/10 max-w-2xl w-full max-h-[80vh] flex flex-col relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setSummaryModalOpen(false)}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            
                            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 pr-8 flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-pink-400" />
                                AI Summary: {summaryBookTitle}
                            </h2>

                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                {isSummarizing ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin mb-4" />
                                        <p className="text-pink-400 font-medium animate-pulse">Reading the book...</p>
                                        <p className="text-gray-500 text-sm mt-2">Generating your personalized summary</p>
                                    </div>
                                ) : (
                                    <div className="prose prose-invert prose-pink max-w-none text-sm md:text-base leading-relaxed">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {currentSummary}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {bookToDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setBookToDelete(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-slate-900 border border-red-500/20 rounded-2xl p-6 shadow-2xl shadow-red-500/10 max-w-sm w-full relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-red-500/10 rounded-xl">
                                    <Trash2 className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Delete Book?</h2>
                                    <p className="text-sm text-gray-400">This action cannot be undone.</p>
                                </div>
                            </div>
                            
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 mb-6">
                                <p className="text-gray-300 font-medium truncate">"{bookToDelete.title}"</p>
                                <p className="text-gray-500 text-sm truncate">by {bookToDelete.author}</p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setBookToDelete(null)}
                                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl text-sm font-medium transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LibraryPage;
