import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle, Heart, Mic2, Layers, MonitorSpeaker, Maximize2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { formatTime } from '../lib/utils';

export default function Player() {
    const { currentSong, isPlaying, togglePlay, volume, setVolume, progress, duration, seek } = usePlayer();

    if (!currentSong) {
        return null; // Or return an empty state if you prefer the bar to always be there
    }

    return (
        <div className="h-[90px] bg-surface border-t border-zinc-800 px-4 flex items-center justify-between fixed bottom-0 left-0 w-full z-50">
            {/* Left: Song Info */}
            <div className="flex items-center gap-4 w-[30%] min-w-[180px]">
                {/* Fake Album Art */}
                <div className="w-14 h-14 bg-zinc-800 rounded flex items-center justify-center text-muted shadow-lg group relative overflow-hidden">
                    {currentSong.imageUrl ? (
                        <img src={currentSong.imageUrl} alt={currentSong.title} className="w-full h-full object-cover" />
                    ) : (
                        <MusicNoteIcon className="w-8 h-8" />
                    )}
                    <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center">
                        <Maximize2 className="w-4 h-4 text-white" />
                    </div>
                </div>
                <div className="flex flex-col justify-center overflow-hidden">
                    <h4 className="text-white font-normal text-sm hover:underline cursor-pointer truncate">{currentSong.title}</h4>
                    <p className="text-muted text-xs hover:underline hover:text-white cursor-pointer truncate">{currentSong.artist}</p>
                </div>
                <button className={`ml-2 hover:scale-105 transition-transform ${currentSong.liked ? 'text-primary' : 'text-muted hover:text-white'}`}>
                    <Heart className={`w-4 h-4 ${currentSong.liked ? 'fill-primary' : ''}`} />
                </button>
            </div>

            {/* Center: Controls */}
            <div className="flex flex-col items-center max-w-[40%] w-full px-4">
                <div className="flex items-center gap-6 mb-2">
                    <button className="text-muted hover:text-white transition-colors">
                        <Shuffle className="w-4 h-4" />
                    </button>
                    <button className="text-muted hover:text-white transition-colors">
                        <SkipBack className="w-5 h-5 fill-current" />
                    </button>
                    <button
                        onClick={togglePlay}
                        className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
                    >
                        {isPlaying ? (
                            <Pause className="w-4 h-4 text-black fill-black" />
                        ) : (
                            <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                        )}
                    </button>
                    <button className="text-muted hover:text-white transition-colors">
                        <SkipForward className="w-5 h-5 fill-current" />
                    </button>
                    <button className="text-muted hover:text-white transition-colors">
                        <Repeat className="w-4 h-4" />
                    </button>
                </div>

                <div className="w-full flex items-center gap-2 text-xs text-muted font-sans">
                    <span className="min-w-[40px] text-right">{formatTime(progress)}</span>
                    <div className="relative group w-full flex items-center">
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={progress}
                            onChange={(e) => seek(Number(e.target.value))}
                            className="absolute z-10 w-full h-1 opacity-0 cursor-pointer"
                        />
                        <div className="w-full h-1 bg-zinc-700 rounded-full overflow-hidden group-hover:h-1.5 transition-all">
                            <div
                                className="h-full bg-white group-hover:bg-primary rounded-full"
                                style={{ width: `${(progress / (duration || 1)) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                    <span className="min-w-[40px]">{formatTime(duration)}</span>
                </div>
            </div>

            {/* Right: Volume & Extras */}
            <div className="flex items-center justify-end gap-3 w-[30%] min-w-[180px]">
                <button className="text-muted hover:text-white"><Mic2 className="w-4 h-4" /></button>
                <button className="text-muted hover:text-white"><Layers className="w-4 h-4" /></button>
                <button className="text-muted hover:text-white"><MonitorSpeaker className="w-4 h-4" /></button>
                <div className="flex items-center gap-2 w-24 ml-1">
                    <Volume2 className="w-4 h-4 text-muted" />
                    <div className="relative group w-full flex items-center">
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={(e) => setVolume(Number(e.target.value))}
                            className="absolute z-10 w-full h-1 opacity-0 cursor-pointer"
                        />
                        <div className="w-full h-1 bg-zinc-700 rounded-full overflow-hidden group-hover:h-1.5 transition-all">
                            <div
                                className="h-full bg-white group-hover:bg-primary rounded-full"
                                style={{ width: `${volume * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MusicNoteIcon({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
    )
}
