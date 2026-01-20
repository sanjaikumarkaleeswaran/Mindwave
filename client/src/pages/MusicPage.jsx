import { useState, useEffect } from 'react';
import api from '../lib/axios';
import { Play, Plus, X, Music as MusicIcon, Trash2, Pencil } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export default function MusicPage() {
    const [songs, setSongs] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { playSong, currentSong, isPlaying, togglePlay } = usePlayer();

    // Form State
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        artist: '',
        fileUrl: '', // For MVP we paste URLs. In PROD we'd upload files.
        moodTags: ''
    });

    const fetchMusic = async () => {
        try {
            const res = await api.get('/music');
            setSongs(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchMusic();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this song?")) return;
        try {
            await api.delete(`/music/${id}`);
            fetchMusic();
        } catch (err) {
            console.error(err);
        }
    };

    const openEditModal = (song) => {
        setEditingId(song._id);
        setFormData({
            title: song.title,
            artist: song.artist,
            fileUrl: song.fileUrl,
            moodTags: song.moodTags.join(', ')
        });
        setIsModalOpen(true);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            // Convert comma separated tags to array
            const tags = formData.moodTags.split(',').map(t => t.trim()).filter(Boolean);

            if (editingId) {
                // UPDATE
                await api.put(`/music/${editingId}`, {
                    ...formData,
                    moodTags: tags
                });
            } else {
                // CREATE
                await api.post('/music/upload', {
                    ...formData,
                    moodTags: tags,
                    duration: 0 // We'd need to fetch metadata to get this realsies
                });
            }

            setIsModalOpen(false);
            setEditingId(null);
            setFormData({ title: '', artist: '', fileUrl: '', moodTags: '' });
            fetchMusic();
        } catch (err) {
            console.error("Failed to save song", err);
            alert("Failed to save song. Check console.");
        }
    }

    return (
        <div className="p-8 relative">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Your Library</h1>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({ title: '', artist: '', fileUrl: '', moodTags: '' });
                        setIsModalOpen(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full flex items-center gap-2 font-medium text-sm transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Music
                </button>
            </div>

            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-zinc-800 text-left text-zinc-400 text-sm">
                            <th className="p-4 w-12 text-center">#</th>
                            <th className="p-4">Title</th>
                            <th className="p-4">Album</th>
                            <th className="p-4">Date Added</th>
                            <th className="p-4 w-24 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {songs.map((song, i) => {
                            const isCurrent = currentSong?._id === song._id;

                            return (
                                <tr key={song._id} className={`group hover:bg-zinc-800/50 transition-colors ${isCurrent ? 'bg-zinc-800/30' : ''}`}>
                                    <td className="p-4 text-center text-zinc-500 group-hover:text-white pb-3 relative">
                                        <span className={`group-hover:hidden ${isCurrent ? 'text-indigo-500 font-bold' : ''}`}>
                                            {isCurrent && isPlaying ? <MusicIcon className="w-4 h-4 mx-auto animate-pulse" /> : i + 1}
                                        </span>
                                        <button
                                            onClick={() => playSong(song)}
                                            className="absolute inset-0 m-auto w-8 h-8 flex items-center justify-center hidden group-hover:flex"
                                        >
                                            {isCurrent && isPlaying ? <div className="w-3 h-3 bg-indigo-500 rounded-sm" /> : <Play className="w-4 h-4 text-white" />}
                                        </button>
                                    </td>
                                    <td className="p-4">
                                        <div className={`font-medium ${isCurrent ? 'text-indigo-400' : 'text-white'}`}>{song.title}</div>
                                        <div className="text-zinc-500 text-sm">{song.artist}</div>
                                    </td>
                                    <td className="p-4 text-zinc-400">{song.album || '-'}</td>
                                    <td className="p-4 text-zinc-500 text-sm">
                                        {new Date(song.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openEditModal(song); }}
                                                className="p-2 text-zinc-500 hover:text-indigo-400 transition-colors"
                                                title="Edit Song"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(song._id); }}
                                                className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                                                title="Delete Song"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                        {songs.length === 0 && (
                            <tr>
                                <td colSpan="5" className="p-12 text-center text-zinc-500 flex flex-col items-center">
                                    <p className="mb-2">No music added yet.</p>
                                    <p className="text-xs">Tip: Add a direct MP3 link (e.g. from GitHub or a Hosting service)</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Music Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-full max-w-lg relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute right-4 top-4 text-zinc-500 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-bold mb-6">{editingId ? 'Edit Song' : 'Add New Song'}</h2>

                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Song Title</label>
                                <input
                                    required
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Artist</label>
                                    <input
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                                        value={formData.artist}
                                        onChange={e => setFormData({ ...formData, artist: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Tags (Comma sep)</label>
                                    <input
                                        placeholder="chill, focus, gym"
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                                        value={formData.moodTags}
                                        onChange={e => setFormData({ ...formData, moodTags: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Audio URL (MP3)</label>
                                <input
                                    required
                                    type="url"
                                    placeholder="https://youtu.be/..."
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                                    value={formData.fileUrl}
                                    onChange={e => setFormData({ ...formData, fileUrl: e.target.value })}
                                />
                                <p className="text-xs text-zinc-500 mt-1">Supports YouTube links or direct MP3 URLs.</p>
                            </div>

                            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl mt-4">
                                {editingId ? 'Save Changes' : 'Add to Library'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
