import { createContext, useState, useContext, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';

const PlayerContext = createContext(null);

export const PlayerProvider = ({ children }) => {
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    const playerRef = useRef(null);

    const playSong = (song) => {
        if (!song.fileUrl) {
            alert("Error: This song has no audio URL.");
            return;
        }
        // If it's the same song, just toggle. Otherwise new song.
        if (currentSong?._id === song._id) {
            setIsPlaying(!isPlaying);
        } else {
            setCurrentSong(song);
            setIsPlaying(true);
            setProgress(0);
        }
    };

    const togglePlay = () => {
        if (currentSong) setIsPlaying(!isPlaying);
    };

    const seek = (time) => {
        if (playerRef.current) {
            playerRef.current.seekTo(time);
            setProgress(time);
        }
    }

    // Rename to avoid loop if any
    const setVolumeState = (val) => {
        const v = parseFloat(val);
        if (v >= 0 && v <= 1) setVolume(v);
    }

    const handleProgress = (state) => {
        if (!state.seeking) {
            setProgress(state.playedSeconds);
            if (playerRef.current) {
                const d = playerRef.current.getDuration();
                if (d && d !== duration) setDuration(d);
            }
        }
    };

    const handleDuration = (d) => {
        setDuration(d);
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
    };

    return (
        <PlayerContext.Provider value={{
            currentSong,
            isPlaying,
            playSong,
            togglePlay,
            volume,
            setVolume: setVolumeState,
            progress,
            duration,
            seek
        }}>
            {children}

            {/* Hidden Player that powers the whole app - Always mounted */}
            {/* Optimized: Starts MUTED to bypass autoplay block, then unmuted via logic */}
            {/* Hidden Player that powers the whole app - Always mounted */}
            {/* Strategy: "Ghost Player" - It is physically on top (z-10) but invisible. This satisfies 'visibility' checks. */}
            <div style={{ position: 'fixed', bottom: 10, right: 10, width: '1px', height: '1px', opacity: 0.001, zIndex: 10, pointerEvents: 'none' }}>
                <ReactPlayer
                    ref={playerRef}
                    url={currentSong?.fileUrl}
                    playing={isPlaying && !!currentSong}
                    volume={volume}

                    onProgress={handleProgress}
                    onDuration={handleDuration}
                    onEnded={handleEnded}
                    onError={(e) => console.error("Player Error:", e)}
                    onStart={() => console.log("Player Started")}

                    width="100%"
                    height="100%"
                    config={{
                        youtube: {
                            playerVars: {
                                playsinline: 1,
                                origin: window.location.origin
                            }
                        }
                    }}
                />
            </div>
        </PlayerContext.Provider>
    );
};

export const usePlayer = () => useContext(PlayerContext);
