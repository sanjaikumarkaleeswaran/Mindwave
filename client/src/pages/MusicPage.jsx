import { useState, useEffect } from 'react';
import api from '../lib/axios';
import { Play, Plus } from 'lucide-react';

export default function MusicPage() {
    const [songs, setSongs] = useState([]);

    useEffect(() => {
        const fetchMusic = async () => {
            try {
                const res = await api.get('/music');
                setSongs(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchMusic();
    }, []);

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Your Library</h1>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full flex items-center gap-2 font-medium text-sm transition-colors">
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
                            <th className="p-4 w-12"><div className="w-4 h-4" /></th>
                        </tr>
                    </thead>
                    <tbody>
                        {songs.map((song, i) => (
                            <tr key={song._id} className="group hover:bg-zinc-800/50 transition-colors">
                                <td className="p-4 text-center text-zinc-500 group-hover:text-white pb-3">
                                    <span className="group-hover:hidden">{i + 1}</span>
                                    <Play className="w-4 h-4 hidden group-hover:block mx-auto" />
                                </td>
                                <td className="p-4">
                                    <div className="font-medium text-white">{song.title}</div>
                                    <div className="text-zinc-500 text-sm">{song.artist}</div>
                                </td>
                                <td className="p-4 text-zinc-400">{song.album || '-'}</td>
                                <td className="p-4 text-zinc-500 text-sm">
                                    {new Date(song.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-center">...</td>
                            </tr>
                        ))}
                        {songs.length === 0 && (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-zinc-500">
                                    No music added yet. Use the Upload button or ask AI to find music (mock).
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
