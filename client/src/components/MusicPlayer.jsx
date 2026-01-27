import { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { useMusic } from '../context/MusicContext';
import { Play, Pause, X, ChevronDown, ChevronUp, Volume2, SkipBack, SkipForward, Maximize2 } from 'lucide-react';

export default function MusicPlayer() {
    const { currentTrack, isPlaying, togglePlay, closePlayer, setIsPlaying, volume, setVolume, showPlayerUI } = useMusic();
    const [played, setPlayed] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        setIsReady(false);
    }, [currentTrack?.id]);
    const playerRef = useRef(null);

    if (!currentTrack) return null;

    const handleProgress = (state) => {
        setPlayed(state.played);
        if (playerRef.current && !duration) {
            const d = playerRef.current.getDuration();
            if (d) setDuration(d);
        }
    };



    const handleSeek = (e) => {
        setPlayed(parseFloat(e.target.value));
        playerRef.current.seekTo(parseFloat(e.target.value));
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <>
            {/* Hidden Player for Logic - Placed behind content (z-index -50) with valid size/opacity to satisfy YouTube/Browser policies */}
            <div style={{ position: 'fixed', bottom: 0, right: 0, width: '320px', height: '180px', opacity: 1, pointerEvents: 'none', zIndex: -50, visibility: 'visible' }}>
                <ReactPlayer
                    ref={playerRef}
                    url={`https://www.youtube.com/watch?v=${currentTrack.id}`}
                    playing={isPlaying}
                    volume={volume}
                    muted={false}
                    config={{
                        youtube: {
                            playerVars: { playsinline: 1 }
                        }
                    }}
                    onReady={() => {
                        setIsReady(true);
                        if (playerRef.current) {
                            setDuration(playerRef.current.getDuration());
                        }
                    }}
                    onProgress={handleProgress}
                    onEnded={() => setIsPlaying(false)}
                    width="100%"
                    height="100%"
                    onError={(e) => console.error("ReactPlayer Error:", e)}
                />
            </div>

            {/* Visual Interface - Only shown if enabled */}
            {showPlayerUI && (
                <div className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${isExpanded ? 'h-full bg-black/90 backdrop-blur-xl' : 'h-20 bg-zinc-900/90 backdrop-blur-lg border-t border-zinc-800'}`}>

                    {/* Minimized Bar Content */}
                    {!isExpanded && (
                        <div className="flex items-center justify-between h-full px-4 md:px-6 w-full max-w-screen-2xl mx-auto">
                            {/* Track Info */}
                            <div className="flex items-center gap-4 w-1/3">
                                <div
                                    className="relative group cursor-pointer"
                                    onClick={() => setIsExpanded(true)}
                                >
                                    {currentTrack.thumbnail ? (
                                        <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-12 h-12 rounded-md object-cover shadow-lg" />
                                    ) : (
                                        <div className="w-12 h-12 bg-zinc-800 rounded-md flex items-center justify-center">
                                            <Maximize2 className="w-6 h-6 text-zinc-500" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                                        <ChevronUp className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="flex flex-col truncate">
                                    <span className="text-sm font-bold text-white truncate">{currentTrack.title}</span>
                                    <span className="text-xs text-zinc-400 truncate">{currentTrack.artist}</span>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex flex-col items-center gap-1 flex-1 max-w-lg">
                                <div className="flex items-center gap-6">
                                    <button className="text-zinc-400 hover:text-white transition-colors">
                                        <SkipBack className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={togglePlay}
                                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-transform"
                                    >
                                        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                                    </button>
                                    <button className="text-zinc-400 hover:text-white transition-colors">
                                        <SkipForward className="w-5 h-5" />
                                    </button>
                                </div>
                                {/* Progress Bar (Mini) */}
                                <div className="w-full flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                                    <span>{formatTime(duration * played)}</span>
                                    <div className="flex-1 h-1 bg-zinc-800 rounded-full cursor-pointer relative group">
                                        <div
                                            className="absolute inset-y-0 left-0 bg-white rounded-full transition-all group-hover:bg-green-500"
                                            style={{ width: `${played * 100}%` }}
                                        ></div>
                                        <input
                                            type="range"
                                            min={0}
                                            max={0.999999}
                                            step="any"
                                            value={played}
                                            onChange={handleSeek}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            {/* Volume & Close */}
                            <div className="flex items-center justify-end gap-2 w-1/3">
                                <div className="flex items-center gap-2 group">
                                    <Volume2 className="w-5 h-5 text-zinc-400" />
                                    <input
                                        type="range"
                                        min={0}
                                        max={1}
                                        step="any"
                                        value={volume}
                                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                                        className="w-20 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                                    />
                                </div>
                                <button onClick={closePlayer} className="p-2 text-zinc-400 hover:text-white ml-4">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Expanded View */}
                    {isExpanded && (
                        <div className="flex flex-col h-full p-8 md:p-12 relative">
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="absolute top-6 left-6 p-2 text-zinc-400 hover:text-white"
                            >
                                <ChevronDown className="w-8 h-8" />
                            </button>

                            <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-12">
                                {/* Album Art */}
                                <div className="w-full max-w-md aspect-square bg-zinc-800 rounded-xl shadow-2xl overflow-hidden relative group">
                                    {currentTrack.thumbnail ? (
                                        <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Maximize2 className="w-24 h-24 text-zinc-600" />
                                        </div>
                                    )}
                                    {/* Youtube visualizer could go here if using video */}
                                </div>

                                {/* Metadata & Controls */}
                                <div className="w-full max-w-md space-y-8">
                                    <div className="space-y-2">
                                        <h2 className="text-3xl md:text-4xl font-bold text-white">{currentTrack.title}</h2>
                                        <p className="text-xl text-zinc-400">{currentTrack.artist}</p>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Big Progress Bar */}
                                        <div className="flex items-center gap-3 text-sm font-mono text-zinc-400">
                                            <span>{formatTime(duration * played)}</span>
                                            <div className="flex-1 h-2 bg-zinc-800 rounded-full relative group">
                                                <div
                                                    className="absolute inset-y-0 left-0 bg-green-500 rounded-full"
                                                    style={{ width: `${played * 100}%` }}
                                                ></div>
                                                <input
                                                    type="range"
                                                    min={0}
                                                    max={0.999999}
                                                    step="any"
                                                    value={played}
                                                    onChange={handleSeek}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                            </div>
                                            <span>{formatTime(duration)}</span>
                                        </div>

                                        {/* Big Controls */}
                                        <div className="flex items-center justify-center gap-8">
                                            <button className="text-zinc-400 hover:text-white transition-colors">
                                                <SkipBack className="w-10 h-10" />
                                            </button>
                                            <button
                                                onClick={togglePlay}
                                                className="w-20 h-20 flex items-center justify-center rounded-full bg-green-500 text-black hover:scale-105 transition-transform shadow-lg shadow-green-500/20"
                                            >
                                                {isPlaying ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-1" />}
                                            </button>
                                            <button className="text-zinc-400 hover:text-white transition-colors">
                                                <SkipForward className="w-10 h-10" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
