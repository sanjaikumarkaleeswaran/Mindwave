import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Helmet } from 'react-helmet-async';
import { User, Mail, Shield, Save, Camera, LogOut, Loader2, AlertTriangle, X } from 'lucide-react';

export default function ProfilePage() {
    const { user, logout, updateProfile, uploadAvatar, deleteAccount } = useAuth();
    const fileInputRef = useRef(null);

    // Initialize form with safe defaults
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        avatar: user?.avatar || ''
    });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await updateProfile({
                name: formData.name,
                avatar: formData.avatar
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

    return (
        <div className="p-6 md:p-12 max-w-6xl mx-auto space-y-10">
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

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeleteConfirmation('');
                                }}
                                className="px-4 py-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg transition-colors text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={deleteConfirmation !== 'DELETE'}
                                onClick={async () => {
                                    try {
                                        await deleteAccount();
                                    } catch (err) {
                                        alert("Failed to delete account. Please try again.");
                                        console.error(err);
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
