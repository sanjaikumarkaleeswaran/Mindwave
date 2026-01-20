import { useState, useEffect } from 'react';
import api from '../lib/axios';
import { Play, Plus, X, Music as MusicIcon, Trash2, Pencil, ListMusic, Heart, Search, Clock, Calendar, Check, MoreHorizontal } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { formatTime } from '../lib/utils';

export default function MusicPage() {
    const [view, setView] = useState('songs');
    const [songs, setSongs] = useState([]);
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filtering
    const [activeMood, setActiveMood] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Modals
    const [isSongModalOpen, setIsSongModalOpen] = useState(false);
    const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
    const [playlistToEdit, setPlaylistToEdit] = useState(null);

    const { playSong, currentSong, isPlaying } = usePlayer();

    // Song Form State
    const [songForm, setSongForm] = useState({ id: null, title: '', artist: '', fileUrl: '', moodTags: '' });
    const [searchResults, setSearchResults] = useState([]);

    const handleSearch = async () => {
        if (!songForm.title) return;
        try {
            const res = await api.get(`/music/search?query=${encodeURIComponent(songForm.title)}`);
            setSearchResults(res.data);
        } catch (err) {
            console.error(err);
            alert("Search failed or backend not running properly.");
        }
    };

    // Playlist Form State
    const [playlistName, setPlaylistName] = useState('');
    const [playlistSongs, setPlaylistSongs] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [songsRes, playlistsRes] = await Promise.all([
                api.get('/music'),
                api.get('/music/playlists')
            ]);
            setSongs(songsRes.data);
            setPlaylists(playlistsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // --- Actions ---
    const handleDeleteSong = async (id, e) => {
        e.stopPropagation();
        if (!confirm("Delete?")) return;
        try { await api.delete(`/music/${id}`); fetchData(); } catch (e) { console.error(e); }
    }
    const handleLikeSong = async (id, e) => {
        e.stopPropagation();
        try { await api.put(`/music/${id}/like`); setSongs(songs.map(s => s._id === id ? { ...s, liked: !s.liked } : s)); } catch (e) { console.error(e); }
    }

    const handleSaveSong = async (e) => {
        e.preventDefault();
        try {
            const tags = songForm.moodTags.split(',').map(t => t.trim()).filter(Boolean);
            const payload = { ...songForm, moodTags: tags };

            if (songForm.id) await api.put(`/music/${songForm.id}`, payload);
            else await api.post('/music/upload', payload);
            setIsSongModalOpen(false);
            setSongForm({ id: null, title: '', artist: '', fileUrl: '', moodTags: '' });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleSavePlaylist = async (e) => {
        e.preventDefault();
        try {
            if (playlistToEdit) await api.put(`/music/playlists/${playlistToEdit._id}`, { name: playlistName, songs: playlistSongs });
            else await api.post('/music/playlists', { name: playlistName, songs: playlistSongs });
            setIsPlaylistModalOpen(false);
            fetchData();
        } catch (e) { console.error(e); }
    }

    const handleDeletePlaylist = async (id, e) => {
        e.stopPropagation();
        if (!confirm("Delete?")) return;
        try { await api.delete(`/music/playlists/${id}`); fetchData(); } catch (e) { console.error(e); }
    }
    const toggleSongInPlaylist = (id) => {
        if (playlistSongs.includes(id)) setPlaylistSongs(playlistSongs.filter(s => s !== id));
        else setPlaylistSongs([...playlistSongs, id]);
    }
    const openPlaylistModal = (p = null) => {
        if (p) { setPlaylistToEdit(p); setPlaylistName(p.name); setPlaylistSongs(p.songs.map(s => s._id)); }
        else { setPlaylistToEdit(null); setPlaylistName(''); setPlaylistSongs([]); }
        setIsPlaylistModalOpen(true);
    }


    // --- Derived State ---
    const allTags = ['All', ...new Set(songs.flatMap(s => s.moodTags || []))];
    const filteredSongs = songs.filter(song => {
        const matchesMood = activeMood === 'All' || (song.moodTags && song.moodTags.includes(activeMood));
        const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase()) || song.artist.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesMood && matchesSearch;
    });

    const Greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 18) return 'Good afternoon';
        return 'Good evening';
    };

    // Play song logic: Simple pass-through
    const handlePlay = (song) => {
        playSong(song);
    }

    return (
        <div className="bg-[#121212] min-h-screen text-white pb-32">

            {/* Gradient Background */}
            <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-[#533483] to-[#121212] opacity-50 pointer-events-none" />

            {/* Header/Nav */}
            <div className="relative sticky top-0 z-40 bg-[#121212]/80 backdrop-blur-md px-8 py-4 flex items-center justify-between">
                <div className="flex gap-4">
                    <div className="flex bg-[#282828] rounded-full p-1">
                        <button onClick={() => setView('songs')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${view === 'songs' ? 'bg-[#3E3E3E] text-white' : 'text-[#b3b3b3] hover:text-white'}`}>Songs</button>
                        <button onClick={() => setView('playlists')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${view === 'playlists' ? 'bg-[#3E3E3E] text-white' : 'text-[#b3b3b3] hover:text-white'}`}>Playlists</button>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {/* Search Pill */}
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b3b3b3] group-focus-within:text-white" />
                        <input
                            type="text"
                            placeholder="What do you want to play?"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] rounded-full text-sm text-white focus:outline-none focus:ring-2 focus:ring-white w-64 transition-all placeholder-[#b3b3b3]"
                        />
                    </div>
                    <button
                        onClick={() => { setSongForm({ id: null, title: '', artist: '', fileUrl: '', moodTags: '' }); setIsSongModalOpen(true); }}
                        className="bg-white text-black px-4 py-1.5 rounded-full font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Music
                    </button>
                </div>
            </div>

            <div className="px-8 relative z-10 mt-4 space-y-8">

                {view === 'songs' && (
                    <>
                        {/* Greeting & Moods */}
                        <div>
                            <h2 className="text-3xl font-bold mb-6"><Greeting /></h2>
                            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                                {allTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => setActiveMood(tag)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeMood === tag
                                            ? 'bg-white text-black'
                                            : 'bg-[#2a2a2a] text-white hover:bg-[#3E3E3E]'
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Song List */}
                        <div>
                            <div className="sticky top-[72px] bg-[#121212] z-30 border-b border-[#282828] text-[#b3b3b3] text-sm font-medium mx-[-32px] px-[32px] py-2 mb-2 grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 items-center">
                                <span className="w-8 text-center">#</span>
                                <span>Title</span>
                                <span>Album</span>
                                <span>Date Added</span>
                                <span className="w-12 text-center"><Clock className="w-4 h-4 mx-auto" /></span>
                            </div>

                            <div className="space-y-0">
                                {filteredSongs.map((song, i) => {
                                    const isCurrent = currentSong?._id === song._id;
                                    return (
                                        <div
                                            key={song._id}
                                            onClick={() => handlePlay(song)}
                                            className={`group grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 items-center px-4 py-2 rounded-md hover:bg-[#2a2a2a] transition-colors cursor-pointer ${isCurrent ? 'bg-[#2a2a2a]' : ''}`}
                                        >
                                            <div className="w-8 text-center text-[#b3b3b3] font-medium group-hover:hidden flex justify-center">
                                                {isCurrent && isPlaying ? <img src="https://open.spotifycdn.com/cdn/images/equaliser-animated-green.f93a2ef4.gif" className="h-3 w-3" alt="playing" /> : i + 1}
                                            </div>
                                            <div className="w-8 text-center hidden group-hover:flex items-center justify-center">
                                                <Play className={`w-4 h-4 ${isCurrent ? 'text-[#1DB954] fill-[#1DB954]' : 'text-white fill-white'}`} />
                                            </div>

                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-10 h-10 bg-[#282828] flex items-center justify-center rounded text-[#b3b3b3]">
                                                    <MusicIcon className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className={`font-medium truncate ${isCurrent ? 'text-[#1DB954]' : 'text-white'}`}>{song.title}</div>
                                                    <div className="text-sm text-[#b3b3b3] group-hover:text-white truncate">{song.artist}</div>
                                                </div>
                                            </div>

                                            <div className="text-sm text-[#b3b3b3] hover:text-white truncate min-w-0">{song.album || 'Unknown Album'}</div>

                                            <div className="text-sm text-[#b3b3b3] min-w-0">{new Date(song.createdAt).toLocaleDateString()}</div>

                                            <div className="w-12 flex items-center justify-center gap-4 text-[#b3b3b3]">
                                                <button onClick={(e) => handleLikeSong(song._id, e)} className={`${song.liked ? 'text-[#1DB954] opacity-100' : 'opacity-0 group-hover:opacity-100 hover:text-white'}`}>
                                                    <Heart className={`w-4 h-4 ${song.liked ? 'fill-[#1DB954]' : ''}`} />
                                                </button>
                                                <span className="text-sm font-mono group-hover:hidden">{formatTime(180)}</span>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteSong(song._id, e); }} className="opacity-0 group-hover:opacity-100 hover:text-white">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </>
                )}

                {view === 'playlists' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Your Playlists</h2>
                            <button onClick={() => openPlaylistModal()} className="bg-white text-black px-4 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Create Playlist
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {playlists.map(playlist => (
                                <div key={playlist._id} className="bg-[#181818] p-4 rounded-md hover:bg-[#282828] transition-all group cursor-pointer relative" onClick={() => { if (playlist.songs[0]) handlePlay(playlist.songs[0]) }}>
                                    <div className="aspect-square bg-[#282828] rounded-md mb-4 shadow-lg flex items-center justify-center text-[#b3b3b3] relative">
                                        <ListMusic className="w-12 h-12" />
                                        <button className="absolute bottom-2 right-2 w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-105">
                                            <Play className="w-6 h-6 text-black fill-black ml-1" />
                                        </button>
                                    </div>
                                    <h3 className="font-bold text-white mb-1 truncate">{playlist.name}</h3>
                                    <p className="text-sm text-[#b3b3b3] line-clamp-2">By You • {playlist.songs.length} songs</p>

                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); openPlaylistModal(playlist); }} className="bg-black/50 p-2 rounded-full hover:bg-black/70 mr-1"><Pencil className="w-4 h-4 text-white" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeletePlaylist(playlist._id, e) }} className="bg-black/50 p-2 rounded-full hover:bg-black/70"><X className="w-4 h-4 text-white" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Song Modal */}
            {isSongModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[#282828] rounded-xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => { setIsSongModalOpen(false); setSearchResults([]); }} className="absolute right-4 top-4 text-[#b3b3b3] hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-bold mb-6 text-white">{songForm.id ? 'Edit details' : 'Add to library'}</h2>
                        <form onSubmit={handleSaveSong} className="space-y-4">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-white mb-1">Title / Search Query</label>
                                    <input value={songForm.title} onChange={e => setSongForm({ ...songForm, title: e.target.value })} required className="w-full bg-[#3E3E3E] border border-transparent rounded p-2.5 text-white focus:outline-none focus:border-white/20 text-sm" />
                                </div>
                                <div className="flex items-end">
                                    <button type="button" onClick={handleSearch} className="bg-[#E4405F] text-white font-bold px-4 py-2.5 rounded hover:bg-[#D33B56] text-sm">
                                        <Search className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Search Results Area */}
                            {searchResults.length > 0 && (
                                <div className="bg-[#181818] rounded-md p-2 space-y-2 max-h-48 overflow-y-auto border border-[#3E3E3E]">
                                    <p className="text-xs text-[#b3b3b3] mb-1 px-1">Select a video:</p>
                                    {searchResults.map((res, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => {
                                                setSongForm({ ...songForm, title: res.title, fileUrl: `https://www.youtube.com/watch?v=${res.videoId}` });
                                                setSearchResults([]);
                                            }}
                                            className="flex items-center gap-3 p-2 hover:bg-[#3E3E3E] rounded cursor-pointer transition-colors"
                                        >
                                            <img src={res.thumbnail} alt="" className="w-10 h-10 object-cover rounded" />
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium text-white line-clamp-1">{res.title}</div>
                                                <div className="text-xs text-[#b3b3b3]">{res.channel || res.duration}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-white mb-1">Artist</label>
                                    <input value={songForm.artist} onChange={e => setSongForm({ ...songForm, artist: e.target.value })} className="w-full bg-[#3E3E3E] border border-transparent rounded p-2.5 text-white focus:outline-none focus:border-white/20 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white mb-1">Tags</label>
                                    <input value={songForm.moodTags} onChange={e => setSongForm({ ...songForm, moodTags: e.target.value })} placeholder="focus, chill" className="w-full bg-[#3E3E3E] border border-transparent rounded p-2.5 text-white focus:outline-none focus:border-white/20 text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white mb-1">Audio URL (Optional)</label>
                                <input
                                    value={songForm.fileUrl}
                                    onChange={e => setSongForm({ ...songForm, fileUrl: e.target.value })}
                                    type="text"
                                    placeholder="Leave empty to auto-find or paste link..."
                                    className="w-full bg-[#3E3E3E] border border-transparent rounded p-2.5 text-white focus:outline-none focus:border-white/20 text-sm"
                                />
                            </div>
                            <div className="flex justify-end pt-4">
                                <button type="submit" className="bg-white text-black font-bold px-8 py-3 rounded-full hover:scale-105 transition-transform text-sm">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Playlist Modal */}
            {isPlaylistModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[#282828] rounded-xl w-full max-w-2xl p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
                        <h2 className="text-xl font-bold mb-4">{playlistToEdit ? 'Edit details' : 'Create playlist'}</h2>
                        <button onClick={() => setIsPlaylistModalOpen(false)} className="absolute right-4 top-4 text-[#b3b3b3] hover:text-white">
                            <X className="w-5 h-5" />
                        </button>

                        <form onSubmit={handleSavePlaylist} className="flex flex-col flex-1 overflow-hidden">
                            <input
                                value={playlistName}
                                onChange={e => setPlaylistName(e.target.value)}
                                required
                                placeholder="My Playlist"
                                className="w-full bg-[#3E3E3E] border-none rounded p-3 text-white focus:outline-none text-sm mb-4"
                            />

                            <div className="flex-1 overflow-hidden flex flex-col">
                                <label className="block text-xs font-bold text-white mb-2">Add Songs</label>
                                <div className="flex-1 overflow-y-auto border-t border-[#3E3E3E]">
                                    {songs.map(song => {
                                        const isSelected = playlistSongs.includes(song._id);
                                        return (
                                            <div
                                                key={song._id}
                                                onClick={() => toggleSongInPlaylist(song._id)}
                                                className={`p-3 flex items-center justify-between cursor-pointer hover:bg-[#3E3E3E] rounded-md ${isSelected ? 'text-[#1DB954]' : ''}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="">
                                                        <div className={`text-sm font-medium ${isSelected ? 'text-[#1DB954]' : 'text-white'}`}>{song.title}</div>
                                                        <div className="text-xs text-[#b3b3b3]">{song.artist}</div>
                                                    </div>
                                                </div>
                                                {isSelected && <Check className="w-4 h-4" />}
                                                {!isSelected && <button className="text-sm font-bold border border-[#727272] px-3 py-1 rounded-full text-white hover:border-white">Add</button>}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="pt-6 mt-auto flex justify-end">
                                <button type="submit" className="bg-white text-black font-bold px-8 py-3 rounded-full hover:scale-105 transition-transform text-sm">Save</button>
                            </div>
                        </form>
                    </div>
                </div >
            )
            }

        </div >
    );
}
