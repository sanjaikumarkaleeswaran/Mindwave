import { createContext, useState, useContext, useRef } from 'react';
import ReactPlayer from 'react-player';

const PlayerContext = createContext(null);

export const PlayerProvider = ({ children }) => {
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5); // Default 50%
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    // ReactPlayer Ref
    const playerRef = useRef(null);

    const playSong = (song) => {
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

    const handleProgress = (state) => {
        // state.playedSeconds, state.loadedSeconds, etc.
        if (!state.seeking) {
            setProgress(state.playedSeconds);
            // Fix for 'onDuration' React warning: Fetch duration manually during progress
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
        // Here we could auto-play next song if we had a queue
    };

    return (
        <PlayerContext.Provider value={{
            currentSong,
            isPlaying,
            playSong,
            togglePlay,
            volume,
            setVolume,
            progress,
            duration,
            seek
        }}>
            {children}

            {/* Hidden Player that powers the whole app */}
            {currentSong && (
                <div style={{ display: 'none' }}>
                    <ReactPlayer
                        ref={playerRef}
                        url={currentSong.fileUrl}
                        playing={isPlaying}
                        volume={volume}
                        onProgress={handleProgress}
                        onEnded={handleEnded}
                        width="0"
                        height="0"
                        config={{
                            youtube: {
                                playerVars: { showinfo: 0, controls: 0 }
                            }
                        }}
                    />
                </div>
            )}
        </PlayerContext.Provider>
    );
};

export const usePlayer = () => useContext(PlayerContext);
