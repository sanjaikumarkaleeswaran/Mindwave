import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle, Heart } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { formatTime } from '../lib/utils'; // We'll create this helper next

export default function Player() {
    const { currentSong, isPlaying, togglePlay, volume, setVolume, progress, duration, seek } = usePlayer();

    if (!currentSong) {
        return null;
    }

    return (
        <div className="h-24 bg-zinc-950 border-t border-zinc-900 px-6 flex items-center justify-between fixed bottom-0 left-0 w-full z-50">
            {/* Current Song */}
            <div className="flex items-center gap-4 w-1/3">
                <div className="w-14 h-14 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-600 overflow-hidden">
                    {/* Placeholder for album art logic */}
                    <MusicNoteIcon />
                </div>
                <div>
                    <h4 className="text-white font-medium text-sm line-clamp-1">{currentSong.title}</h4>
                    <p className="text-zinc-500 text-xs line-clamp-1">{currentSong.artist}</p>
                </div>
                <button className={`hover:text-indigo-500 transition-colors ${currentSong.liked ? 'text-indigo-500' : 'text-zinc-500'}`}>
                    <Heart className="w-4 h-4" />
                </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-2 w-1/3">
                <div className="flex items-center gap-6">
                    <button className="text-zinc-500 hover:text-white transition-colors">
                        <Shuffle className="w-4 h-4" />
                    </button>
                    <button className="text-zinc-400 hover:text-white transition-colors">
                        <SkipBack className="w-5 h-5" />
                    </button>
                    <button
                        onClick={togglePlay}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                    >
                        {isPlaying ? <Pause className="w-5 h-5 text-black" /> : <Play className="w-5 h-5 text-black ml-1" />}
                    </button>
                    <button className="text-zinc-400 hover:text-white transition-colors">
                        <SkipForward className="w-5 h-5" />
                    </button>
                    <button className="text-zinc-500 hover:text-white transition-colors">
                        <Repeat className="w-4 h-4" />
                    </button>
                </div>
                <div className="w-full max-w-md flex items-center gap-2 text-xs text-zinc-500 font-mono">
                    <span>{formatTime(progress)}</span>
                    <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={progress}
                        onChange={(e) => seek(Number(e.target.value))}
                        className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                    />
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Volume */}
            <div className="flex items-center justify-end gap-2 w-1/3">
                <Volume2 className="w-4 h-4 text-zinc-400" />
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-24 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                />
            </div>
        </div>
    );
}

function MusicNoteIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
    )
}
