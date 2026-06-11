import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Helmet } from 'react-helmet-async';
import { User, Mail, Shield, Save, Camera, LogOut, Loader2, AlertTriangle, X, FileDown, CheckCircle, Calendar, Database, Bell, Link } from 'lucide-react';
import api from '../lib/axios';

export default function ProfilePage() {
    const { user, logout, updateProfile, updatePreferences, uploadAvatar, deleteAccount } = useAuth();
    const fileInputRef = useRef(null);

    // Initialize form with safe defaults
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        avatar: user?.avatar || '',
        aiTone: user?.preferences?.aiTone || 'helpful'
    });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState('json');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [exportPreview, setExportPreview] = useState(null);
    const [exportSections, setExportSections] = useState({ journals: true, habits: true, goals: true, chat: true });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    // --- Integrations ---
    const [pushStatus, setPushStatus] = useState('default');
    const [calendarUrl, setCalendarUrl] = useState('');

    const handleSubscribePush = async () => {
        setPushStatus('loading');
        try {
            const { data: { publicKey } } = await api.get('/notifications/vapidPublicKey');
            const registration = await navigator.serviceWorker.ready;
            
            const padding = '='.repeat((4 - publicKey.length % 4) % 4);
            const base64 = (publicKey + padding).replace(/\-/g, '+').replace(/_/g, '/');
            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: outputArray
            });

            await api.post('/notifications/subscribe', subscription);
            setPushStatus('subscribed');
            setMessage({ type: 'success', text: 'Successfully subscribed to push notifications!' });
        } catch (err) {
            console.error('Push error:', err);
            setPushStatus('error');
            setMessage({ type: 'error', text: 'Failed to subscribe to notifications. Please ensure notifications are allowed in your browser.' });
        }
    };

    const handleGenerateCalendar = async () => {
        try {
            const { data } = await api.get('/calendar/sync-url');
            setCalendarUrl(data.url);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Failed to generate calendar URL.' });
        }
    };
    
    const handleCopyCalendarUrl = () => {
        navigator.clipboard.writeText(calendarUrl);
        setMessage({ type: 'success', text: 'Calendar URL copied to clipboard!' });
    };

    // --- Drag Range Slider ---
    const trackRef = useRef(null);
    const draggingRef = useRef(null); // 'from' | 'to' | null

    // Full range: 365 days back → today
    const RANGE_DAYS = 365;
    const rangeEndMs = () => { const d = new Date(); d.setHours(23, 59, 59, 999); return d.getTime(); };
    const rangeStartMs = () => rangeEndMs() - RANGE_DAYS * 86400000;

    const dateToPercent = (dateStr) => {
        if (!dateStr) return null;
        const ms = new Date(dateStr).getTime();
        const pct = ((ms - rangeStartMs()) / (rangeEndMs() - rangeStartMs())) * 100;
        return Math.min(100, Math.max(0, pct));
    };

    const percentToDateStr = (pct) => {
        const ms = rangeStartMs() + (pct / 100) * (rangeEndMs() - rangeStartMs());
        return new Date(ms).toISOString().split('T')[0];
    };

    const getPercentFromEvent = (e) => {
        const track = trackRef.current;
        if (!track) return 0;
        const rect = track.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const raw = ((clientX - rect.left) / rect.width) * 100;
        return Math.min(100, Math.max(0, raw));
    };

    const formatLabel = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
    };

    // Mouse/touch move + up (global)
    useEffect(() => {
        const onMove = (e) => {
            if (!draggingRef.current) return;
            const pct = getPercentFromEvent(e);
            if (draggingRef.current === 'from') {
                const newFrom = percentToDateStr(pct);
                // don't cross 'to'
                if (!dateTo || newFrom <= dateTo) setDateFrom(newFrom);
            } else {
                const newTo = percentToDateStr(pct);
                if (!dateFrom || newTo >= dateFrom) setDateTo(newTo);
            }
        };
        const onUp = () => { draggingRef.current = null; };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onUp);
        };
    }, [dateFrom, dateTo, percentToDateStr]);

    const startDrag = (handle) => (e) => {
        e.preventDefault();
        draggingRef.current = handle;
    };

    const PRESETS = [
        { label: '7d', days: 7 },
        { label: '30d', days: 30 },
        { label: '90d', days: 90 },
        { label: 'All', days: 0 },
    ];

    const applyPreset = (days) => {
        if (days === 0) { setDateFrom(''); setDateTo(''); return; }
        const today = new Date();
        const from = new Date(today);
        from.setDate(today.getDate() - days + 1);
        setDateFrom(from.toISOString().split('T')[0]);
        setDateTo(today.toISOString().split('T')[0]);
    };

    const fromPct = dateToPercent(dateFrom) ?? 0;
    const toPct = dateToPercent(dateTo) ?? 100;


    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await updateProfile({
                name: formData.name,
                avatar: formData.avatar
            });
            await updatePreferences({
                aiTone: formData.aiTone
            });
            setMessage({ type: 'success', text: 'Profile updated successfully' });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: err.response?.data?.msg || 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setMessage({ type: '', text: '' });

        try {
            const newAvatarUrl = await uploadAvatar(file);
            setFormData(prev => ({ ...prev, avatar: newAvatarUrl }));
            setMessage({ type: 'success', text: 'Avatar uploaded successfully' });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Failed to upload avatar' });
        } finally {
            setUploading(false);
        }
    };

    // Fetch export preview counts on mount
    useEffect(() => {
        api.get('/auth/export').then(res => {
            const d = res.data;
            setExportPreview({
                journals: (d.journals || []).length,
                habits:   (d.habits   || []).length,
                goals:    (d.goals    || []).length,
                chat:     (d.chat?.history || []).length
            });
        }).catch(() => { });
    }, []);

    // Helper: convert array of objects to CSV string (with UTF-8 BOM for Excel)
    const toCSV = (rows) => {
        if (!rows || rows.length === 0) return '\uFEFFNo data'; // BOM for Excel
        const headers = Object.keys(rows[0]);
        const escape = (v) => {
            if (v === null || v === undefined) return '';
            const s = String(v).replace(/"/g, '""');
            return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s}"` : s;
        };
        // \uFEFF = UTF-8 BOM — makes Excel open the file with correct encoding
        return '\uFEFF' + [
            headers.join(','),
            ...rows.map(r => headers.map(h => escape(r[h])).join(','))
        ].join('\n');
    };

    const downloadBlob = (content, filename, mime) => {
        const blob = new Blob([content], { type: mime });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    };

    const handleExportData = async () => {
        setExporting(true);
        setMessage({ type: '', text: '' });
        const dateStr = new Date().toISOString().split('T')[0];

        // Guard: at least one section selected
        if (!exportSections.journals && !exportSections.habits && !exportSections.goals && !exportSections.chat) {
            setMessage({ type: 'error', text: 'Please select at least one section to export.' });
            setExporting(false);
            return;
        }

        // Build date filter query string
        const params = new URLSearchParams();
        if (dateFrom) params.set('from', dateFrom);
        if (dateTo) params.set('to', dateTo);
        const query = params.toString() ? `?${params.toString()}` : '';

        try {
            const response = await api.get(`/auth/export${query}`);
            const data = response.data;

            if (exportFormat === 'json') {
                // Filter JSON to only selected sections
                const filtered = { exportDate: data.exportDate };
                if (exportSections.journals) filtered.journals = data.journals;
                if (exportSections.habits)   filtered.habits   = data.habits;
                if (exportSections.goals)    filtered.goals    = data.goals;
                if (exportSections.chat)     filtered.chat     = data.chat;
                downloadBlob(
                    JSON.stringify(filtered, null, 2),
                    `mindwave_export_${dateStr}.json`,
                    'application/json'
                );
            } else {
                let delay = 0;

                if (exportSections.journals) {
                    const journalRows = (data.journals || []).map(j => ({
                        date: j.date ? new Date(j.date).toLocaleDateString() : '',
                        title: j.title || '',
                        mood: j.mood || '',
                        content: j.content || '',
                        tags: (j.tags || []).join('; '),
                        ai_sentiment: j.aiAnalysis?.sentiment || '',
                        ai_summary: j.aiAnalysis?.summary || '',
                        ai_key_topics: (j.aiAnalysis?.keyTopics || []).join('; '),
                        ai_insights: (j.aiAnalysis?.insights || []).join('; '),
                        ai_challenge: j.aiAnalysis?.actionableChallenge || '',
                        created_at: j.createdAt ? new Date(j.createdAt).toLocaleString() : ''
                    }));
                    setTimeout(() => downloadBlob(toCSV(journalRows), `mindwave_journals_${dateStr}.csv`, 'text/csv;charset=utf-8'), delay);
                    delay += 300;
                }

                if (exportSections.habits) {
                    const habitRows = (data.habits || []).map(h => ({
                        name: h.name || '',
                        frequency: h.frequency || 'daily',
                        current_streak: h.streak || 0,
                        best_streak: h.bestStreak || 0,
                        total_completions: (h.completedDates || []).length,
                        last_completed: h.completedDates?.length
                            ? new Date(h.completedDates[h.completedDates.length - 1]).toLocaleDateString()
                            : 'Never',
                        created_at: h.createdAt ? new Date(h.createdAt).toLocaleDateString() : ''
                    }));
                    setTimeout(() => downloadBlob(toCSV(habitRows), `mindwave_habits_${dateStr}.csv`, 'text/csv;charset=utf-8'), delay);
                    delay += 300;
                }

                if (exportSections.goals) {
                    const goalRows = (data.goals || []).map(g => ({
                        title:       g.title       || '',
                        description: g.description || '',
                        category:    g.category    || '',
                        status:      g.status      || '',
                        progress:    g.progress    || 0,
                        target_date: g.targetDate  ? new Date(g.targetDate).toLocaleDateString() : '',
                        total_steps: (g.milestones || []).length,
                        completed_steps: (g.milestones || []).filter(m => m.completed).length,
                        milestones:  (g.milestones || []).map(m =>
                            `[${m.completed ? '✓' : ' '}] ${m.text}${m.dueDate ? ' (' + new Date(m.dueDate).toLocaleDateString() + ')' : ''}`
                        ).join(' | '),
                        created_at:  g.createdAt ? new Date(g.createdAt).toLocaleDateString() : ''
                    }));
                    setTimeout(() => downloadBlob(toCSV(goalRows), `mindwave_goals_${dateStr}.csv`, 'text/csv;charset=utf-8'), delay);
                    delay += 300;
                }

                if (exportSections.chat) {
                    const chatRows = (data.chat?.history || []).map(c => ({
                        role: c.role || '',
                        conversation_id: c.conversationId || '',
                        message: c.content || '',
                        timestamp: c.timestamp ? new Date(c.timestamp).toLocaleString() : ''
                    }));
                    setTimeout(() => downloadBlob(toCSV(chatRows), `mindwave_chat_${dateStr}.csv`, 'text/csv;charset=utf-8'), delay);
                }
            }

            const selected = Object.entries(exportSections).filter(([, v]) => v).map(([k]) => k).join(', ');
            setMessage({ type: 'success', text: `Exported ${selected} as ${exportFormat.toUpperCase()}!` });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Failed to export data.' });
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="p-5 md:p-8 lg:p-12 max-w-6xl mx-auto space-y-5 md:space-y-10 mobile-page-pad">
            <Helmet>
                <title>Profile | Life OS</title>
            </Helmet>

            <header className="flex items-center justify-between pb-6 border-b border-white/5">
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    Account Settings
                </h1>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="md:col-span-1">
                    <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 flex flex-col items-center text-center space-y-4 shadow-xl">
                        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-800 group-hover:border-indigo-500 transition-colors relative">
                                {uploading ? (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                                    </div>
                                ) : null}
                                {formData.avatar ? (
                                    <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                        <User className="w-12 h-12 text-zinc-500" />
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full text-white hover:bg-indigo-500 transition-colors shadow-lg z-20"
                            >
                                <Camera className="w-4 h-4" />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
                            <p className="text-sm text-zinc-400">{user?.email}</p>
                        </div>

                        <div className="w-full pt-4 border-t border-zinc-800">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Member Since</span>
                                <span className="text-zinc-300">
                                    {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors text-sm font-medium mt-4"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="md:col-span-2">
                    <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-xl">
                        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-indigo-400" />
                            Personal Information
                        </h3>

                        {message.text && (
                            <div className={`p-4 mb-6 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            disabled
                                            className="w-full bg-zinc-950/30 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-zinc-500 cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-zinc-400">Avatar URL</label>
                                    <div className="relative">
                                        <Camera className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                        <input
                                            type="url"
                                            value={formData.avatar}
                                            onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                                            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                            placeholder="https://example.com/me.jpg"
                                        />
                                    </div>
                                    <p className="text-xs text-zinc-500 pl-1">
                                        Or click the profile picture on the left to upload an image.
                                    </p>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-zinc-400">AI Assistant Persona</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {[
                                            { value: 'helpful', label: 'Helpful Assistant', desc: 'Balanced, friendly, and standard AI.' },
                                            { value: 'tough_love', label: 'Tough Love Coach', desc: 'Direct, no-nonsense accountability.' },
                                            { value: 'gentle_therapist', label: 'Gentle Therapist', desc: 'Empathetic, validating, and soft.' },
                                            { value: 'minimalist', label: 'Minimalist', desc: 'Brief, efficient, no fluff.' }
                                        ].map(persona => (
                                            <button
                                                key={persona.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, aiTone: persona.value })}
                                                className={`p-3 rounded-xl border text-left transition-all ${
                                                    formData.aiTone === persona.value
                                                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg'
                                                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800'
                                                }`}
                                            >
                                                <div className="font-medium text-sm mb-1">{persona.label}</div>
                                                <div className="text-xs opacity-70 leading-snug">{persona.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-zinc-800 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Data Export */}
            <div className="md:col-span-1 lg:col-span-3">
                <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-5">

                    {/* Header row */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                                <FileDown className="w-5 h-5 text-indigo-400" />
                                Export Your Data
                            </h3>
                            <p className="text-zinc-400 text-sm">
                                Download journals, habits &amp; chat history. JSON = one file · CSV = three Excel-ready spreadsheets.
                            </p>
                        </div>

                        {/* Record Count Preview badges */}
                        {exportPreview && (
                            <div className="flex gap-3 shrink-0">
                                {[
                                    { icon: '✍️', label: 'Journals', count: exportPreview.journals },
                                    { icon: '✅', label: 'Habits', count: exportPreview.habits },
                                    { icon: '💬', label: 'Messages', count: exportPreview.chat }
                                ].map(({ icon, label, count }) => (
                                    <div key={label} className="flex flex-col items-center bg-zinc-800/60 border border-zinc-700/50 rounded-xl px-3 py-2 min-w-[64px]">
                                        <span className="text-lg mb-0.5">{icon}</span>
                                        <span className="text-white font-bold text-base leading-none">{count}</span>
                                        <span className="text-zinc-500 text-[10px] mt-0.5 uppercase tracking-wide">{label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Date Range Drag Slider */}
                    <div className="p-4 bg-zinc-800/40 border border-zinc-700/40 rounded-2xl space-y-4">

                        {/* Top row: label + presets */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-indigo-400" />
                                <span className="text-sm font-semibold text-zinc-300">Date Range</span>
                            </div>
                            {/* Quick-select preset pills */}
                            <div className="flex gap-1.5">
                                {PRESETS.map(({ label, days }) => {
                                    const isActive =
                                        days === 0
                                            ? !dateFrom && !dateTo
                                            : (() => {
                                                const today = new Date().toISOString().split('T')[0];
                                                const from = new Date();
                                                from.setDate(from.getDate() - days + 1);
                                                return dateFrom === from.toISOString().split('T')[0] && dateTo === today;
                                            })();
                                    return (
                                        <button
                                            key={label}
                                            onClick={() => applyPreset(days)}
                                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${isActive
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                                : 'bg-zinc-700/60 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Track + Handles */}
                        <div className="relative px-2 pt-6 pb-2 select-none">

                            {/* FROM label */}
                            <div
                                className="absolute top-0 text-[11px] font-semibold text-indigo-300 whitespace-nowrap -translate-x-1/2 pointer-events-none"
                                style={{ left: `calc(${fromPct}%)` }}
                            >
                                {dateFrom ? formatLabel(dateFrom) : 'Start'}
                            </div>

                            {/* TO label */}
                            <div
                                className="absolute top-0 text-[11px] font-semibold text-indigo-300 whitespace-nowrap -translate-x-1/2 pointer-events-none"
                                style={{ left: `calc(${toPct}%)` }}
                            >
                                {dateTo ? formatLabel(dateTo) : 'End'}
                            </div>

                            {/* Track + tick marks */}
                            <div className="relative" style={{ height: 28 }}>

                                {/* Tick lines + labels — 13 ticks, one per month */}
                                {(() => {
                                    const ticks = [];
                                    const todayMs = rangeEndMs();
                                    // Walk back 12 months, generate 1st of each month
                                    for (let m = 0; m <= 12; m++) {
                                        const d = new Date();
                                        d.setDate(1);
                                        d.setMonth(d.getMonth() - (12 - m));
                                        d.setHours(0, 0, 0, 0);
                                        const pct = ((d.getTime() - rangeStartMs()) / (todayMs - rangeStartMs())) * 100;
                                        if (pct < 0 || pct > 100) continue;
                                        const inRange = pct >= fromPct && pct <= toPct;
                                        const isFirst = m === 0;
                                        const isLast = m === 12;
                                        ticks.push(
                                            <div
                                                key={m}
                                                className="absolute flex flex-col items-center pointer-events-none"
                                                style={{ left: `${pct}%`, top: 0, transform: 'translateX(-50%)' }}
                                            >
                                                {/* Vertical tick line */}
                                                <div
                                                    className="w-px transition-colors duration-200"
                                                    style={{
                                                        height: 10,
                                                        background: inRange ? 'rgba(129,140,248,0.7)' : 'rgba(82,82,91,0.5)',
                                                        marginTop: 5
                                                    }}
                                                />
                                                {/* Month label */}
                                                <span
                                                    className="text-[8px] font-medium mt-0.5 transition-colors duration-200 whitespace-nowrap"
                                                    style={{ color: inRange ? '#a5b4fc' : '#52525b' }}
                                                >
                                                    {isFirst || isLast || m % 2 === 0
                                                        ? d.toLocaleDateString('en-US', { month: 'short' })
                                                        : ''}
                                                </span>
                                            </div>
                                        );
                                    }
                                    // "Today" tick
                                    ticks.push(
                                        <div
                                            key="today"
                                            className="absolute flex flex-col items-center pointer-events-none"
                                            style={{ left: '100%', top: 0, transform: 'translateX(-50%)' }}
                                        >
                                            <div className="w-px" style={{ height: 10, background: 'rgba(129,140,248,0.9)', marginTop: 5 }} />
                                            <span className="text-[8px] font-bold mt-0.5 text-indigo-400 whitespace-nowrap">Today</span>
                                        </div>
                                    );
                                    return ticks;
                                })()}

                                {/* Actual slider track — positioned in the middle vertically */}
                                <div
                                    ref={trackRef}
                                    className="absolute left-0 right-0 h-2 rounded-full bg-zinc-700/60 cursor-pointer"
                                    style={{ top: 4 }}
                                    onClick={(e) => {
                                        const pct = getPercentFromEvent(e);
                                        const distFrom = Math.abs(pct - fromPct);
                                        const distTo = Math.abs(pct - toPct);
                                        if (distFrom < distTo) setDateFrom(percentToDateStr(pct));
                                        else setDateTo(percentToDateStr(pct));
                                    }}
                                >
                                    {/* Filled range */}
                                    <div
                                        className="absolute top-0 h-full rounded-full pointer-events-none"
                                        style={{
                                            left: `${fromPct}%`,
                                            width: `${Math.max(0, toPct - fromPct)}%`,
                                            background: 'linear-gradient(90deg, #4f46e5, #818cf8)'
                                        }}
                                    />

                                    {/* FROM handle */}
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-indigo-500 border-2 border-white shadow-lg shadow-indigo-500/50 cursor-grab active:cursor-grabbing hover:scale-125 transition-transform z-10"
                                        style={{ left: `${fromPct}%` }}
                                        onMouseDown={startDrag('from')}
                                        onTouchStart={startDrag('from')}
                                    />

                                    {/* TO handle */}
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-indigo-400 border-2 border-white shadow-lg shadow-indigo-400/50 cursor-grab active:cursor-grabbing hover:scale-125 transition-transform z-10"
                                        style={{ left: `${toPct}%` }}
                                        onMouseDown={startDrag('to')}
                                        onTouchStart={startDrag('to')}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Summary + clear */}
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-zinc-500">
                                {dateFrom || dateTo
                                    ? <>Exporting: <span className="text-indigo-300 font-medium">{formatLabel(dateFrom) || '…'}</span> → <span className="text-indigo-300 font-medium">{formatLabel(dateTo) || 'today'}</span></>
                                    : <span className="italic">All time — drag handles or pick a preset</span>}
                            </p>
                            {(dateFrom || dateTo) && (
                                <button
                                    onClick={() => { setDateFrom(''); setDateTo(''); }}
                                    className="text-[11px] text-zinc-500 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10 font-medium"
                                >
                                    ✕ Reset
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Section Picker */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-zinc-300">Include in Export</p>
                            <button
                                onClick={() => {
                                    const allOn = exportSections.journals && exportSections.habits && exportSections.goals && exportSections.chat;
                                    setExportSections({ journals: !allOn, habits: !allOn, goals: !allOn, chat: !allOn });
                                }}
                                className="text-[11px] text-zinc-500 hover:text-indigo-400 transition-colors font-medium"
                            >
                                {exportSections.journals && exportSections.habits && exportSections.goals && exportSections.chat ? 'Deselect all' : 'Select all'}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                                {
                                    key: 'journals',
                                    emoji: '✍️',
                                    label: 'Journal',
                                    desc: 'Entries, moods & AI analysis',
                                    fields: ['date', 'title', 'mood', 'content', 'tags', 'ai_sentiment', 'ai_summary'],
                                    color: 'pink',
                                    count: exportPreview?.journals,
                                    activeGradient: 'from-pink-600/20 to-rose-500/10',
                                    activeBorder: 'border-pink-500/50',
                                    activeText: 'text-pink-400',
                                    activeDot: 'bg-pink-500',
                                },
                                {
                                    key: 'habits',
                                    emoji: '✅',
                                    label: 'Habits',
                                    desc: 'Streaks, completions & history',
                                    fields: ['name', 'frequency', 'streak', 'best_streak', 'total_completions'],
                                    color: 'emerald',
                                    count: exportPreview?.habits,
                                    activeGradient: 'from-emerald-600/20 to-green-500/10',
                                    activeBorder: 'border-emerald-500/50',
                                    activeText: 'text-emerald-400',
                                    activeDot: 'bg-emerald-500',
                                },
                                {
                                    key: 'goals',
                                    emoji: '🎯',
                                    label: 'Goals',
                                    desc: 'Milestones, progress & timeline',
                                    fields: ['title', 'status', 'progress', 'target_date', 'milestones'],
                                    color: 'purple',
                                    count: exportPreview?.goals,
                                    activeGradient: 'from-purple-600/20 to-violet-500/10',
                                    activeBorder: 'border-purple-500/50',
                                    activeText: 'text-purple-400',
                                    activeDot: 'bg-purple-500',
                                },
                                {
                                    key: 'chat',
                                    emoji: '💬',
                                    label: 'Chat History',
                                    desc: 'Messages & AI conversations',
                                    fields: ['role', 'conversation_id', 'message', 'timestamp'],
                                    color: 'indigo',
                                    count: exportPreview?.chat,
                                    activeGradient: 'from-indigo-600/20 to-violet-500/10',
                                    activeBorder: 'border-indigo-500/50',
                                    activeText: 'text-indigo-400',
                                    activeDot: 'bg-indigo-500',
                                },
                            ].map(({ key, emoji, label, desc, fields, activeGradient, activeBorder, activeText, activeDot, count }) => {
                                const on = exportSections[key];
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setExportSections(prev => ({ ...prev, [key]: !prev[key] }))}
                                        className={`relative text-left p-4 rounded-xl border transition-all duration-200 group ${on
                                            ? `bg-gradient-to-br ${activeGradient} ${activeBorder}`
                                            : 'bg-zinc-800/40 border-zinc-700/40 hover:border-zinc-600 hover:bg-zinc-800/70'
                                            }`}
                                    >
                                        {/* Checkmark badge */}
                                        <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${on ? `${activeDot} border-transparent` : 'border-zinc-600 bg-transparent'
                                            }`}>
                                            {on && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                        </div>

                                        {/* Icon + label */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-2xl">{emoji}</span>
                                            <div>
                                                <p className={`text-sm font-bold transition-colors ${on ? activeText : 'text-zinc-300'}`}>{label}</p>
                                                {count !== undefined && (
                                                    <p className="text-[10px] text-zinc-600 font-mono">{count} records</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <p className="text-[11px] text-zinc-500 mb-3 leading-relaxed">{desc}</p>

                                        {/* Field pills */}
                                        <div className="flex flex-wrap gap-1">
                                            {fields.map(f => (
                                                <span key={f} className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-colors ${on ? `${activeText} bg-white/5` : 'text-zinc-600 bg-zinc-800'
                                                    }`}>{f}</span>
                                            ))}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        {/* None selected warning */}
                        {!exportSections.journals && !exportSections.habits && !exportSections.chat && (
                            <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-1">
                                <span>⚠️</span> Select at least one section to export
                            </p>
                        )}
                    </div>

                    {/* Controls Row */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        {/* Format Toggle */}
                        <div className="flex rounded-lg overflow-hidden border border-zinc-700">
                            <button
                                onClick={() => setExportFormat('json')}
                                className={`flex-1 px-5 py-2 text-sm font-medium transition-colors ${exportFormat === 'json'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                    }`}
                            >
                                JSON
                            </button>
                            <button
                                onClick={() => setExportFormat('csv')}
                                className={`flex-1 px-5 py-2 text-sm font-medium transition-colors ${exportFormat === 'csv'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                    }`}
                            >
                                CSV
                            </button>
                        </div>

                        {/* CSV hint */}
                        {exportFormat === 'csv' && (
                            <p className="text-xs text-zinc-500 flex-1">
                                📊 3 files · UTF-8 BOM encoded · Opens correctly in Excel &amp; Google Sheets
                            </p>
                        )}

                        {/* Export Button */}
                        <button
                            onClick={handleExportData}
                            disabled={exporting || (!exportSections.journals && !exportSections.habits && !exportSections.chat)}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 ml-auto"
                        >
                            {exporting ? (
                                <><Loader2 className="w-4 h-4 animate-spin" />Exporting...</>
                            ) : (
                                <>
                                    <FileDown className="w-4 h-4" />
                                    Export {Object.values(exportSections).filter(Boolean).length} section{Object.values(exportSections).filter(Boolean).length !== 1 ? 's' : ''} as {exportFormat.toUpperCase()}
                                </>
                            )}
                        </button>
                    </div>

                </div>
            </div>

            {/* Integrations */}
            <div className="md:col-span-1 lg:col-span-3">
                <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-5">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Link className="w-5 h-5 text-indigo-400" />
                        Integrations & Notifications
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Push Notifications Card */}
                        <div className="bg-zinc-800/40 border border-zinc-700/40 rounded-xl p-5 flex flex-col justify-between">
                            <div>
                                <h4 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
                                    <Bell className="w-4 h-4 text-emerald-400" /> Push Notifications
                                </h4>
                                <p className="text-sm text-zinc-400 mb-4">
                                    Get real-time browser notifications for overdue goals, habits, and reminders.
                                </p>
                            </div>
                            <button
                                onClick={handleSubscribePush}
                                disabled={pushStatus === 'loading' || pushStatus === 'subscribed'}
                                className="w-full py-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded-lg transition-colors text-sm font-medium border border-emerald-500/20 flex items-center justify-center gap-2"
                            >
                                {pushStatus === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                                {pushStatus === 'subscribed' ? 'Subscribed' : 'Enable Notifications'}
                            </button>
                        </div>

                        {/* Calendar Sync Card */}
                        <div className="bg-zinc-800/40 border border-zinc-700/40 rounded-xl p-5 flex flex-col justify-between">
                            <div>
                                <h4 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
                                    <Calendar className="w-4 h-4 text-purple-400" /> Calendar Sync
                                </h4>
                                <p className="text-sm text-zinc-400 mb-4">
                                    Sync your goals and events to Google Calendar, Apple Calendar, or Outlook via ICS feed.
                                </p>
                            </div>
                            
                            {!calendarUrl ? (
                                <button
                                    onClick={handleGenerateCalendar}
                                    className="w-full py-2 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 rounded-lg transition-colors text-sm font-medium border border-purple-500/20"
                                >
                                    Generate Sync URL
                                </button>
                            ) : (
                                <div className="space-y-2">
                                    <div className="bg-zinc-950/50 border border-zinc-700 rounded-lg p-2 text-xs text-zinc-300 break-all font-mono">
                                        {calendarUrl}
                                    </div>
                                    <button
                                        onClick={handleCopyCalendarUrl}
                                        className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors text-sm font-medium"
                                    >
                                        Copy URL
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="md:col-span-1 lg:col-span-3">
                <div className="mt-8 bg-black/40 border border-red-500/20 rounded-2xl p-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-red-500 mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                Danger Zone
                            </h3>
                            <p className="text-zinc-400 text-sm max-w-xl">
                                Deleting your account is permanent. All your data including journals, habits, and chat history will be permanently erased. This action cannot be undone.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="px-5 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all text-sm font-medium border border-red-500/20"
                        >
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-zinc-700/50 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                        <h3 className="text-xl font-bold text-white mb-2">Delete Account?</h3>
                        <p className="text-zinc-400 mb-6">
                            This action is <span className="text-red-400 font-bold">irreversible</span>.
                            To confirm, please type <span className="font-mono text-white bg-zinc-800 px-1.5 py-0.5 rounded">DELETE</span> below.
                        </p>

                        <input
                            type="text"
                            value={deleteConfirmation}
                            placeholder="Type DELETE to confirm"
                            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all mb-6"
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                        />

                        {deleteError && (
                            <div className="mb-4 flex items-center gap-2 text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                                <AlertTriangle className="w-4 h-4 shrink-0" />{deleteError}
                            </div>
                        )}
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeleteConfirmation('');
                                    setDeleteError('');
                                }}
                                className="px-4 py-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg transition-colors text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={deleteConfirmation !== 'DELETE'}
                                onClick={async () => {
                                    setDeleteError('');
                                    try {
                                        await deleteAccount();
                                    } catch (err) {
                                        console.error(err);
                                        setDeleteError(err?.response?.data?.msg || 'Failed to delete account. Please try again.');
                                    }
                                }}
                                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${deleteConfirmation === 'DELETE'
                                    ? 'bg-red-600/90 text-white hover:bg-red-500'
                                    : 'bg-red-600/50 text-white/50 cursor-not-allowed'
                                    }`}
                            >
                                <AlertTriangle className="w-4 h-4" />
                                Yes, Delete Everything
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
