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

    const playSong = async (song) => {
        if (!song.fileUrl) {
            alert("Error: This song has no audio URL.");
            return;
        }

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

            {/* Hidden Player - Off-screen but with size to satisfy YouTube API */}
            <div style={{ position: 'fixed', top: '-9999px', left: '-9999px' }}>
                <ReactPlayer
                    ref={playerRef}
                    url={currentSong?.fileUrl}
                    playing={isPlaying && !!currentSong}
                    volume={volume}
                    muted={false}

                    onProgress={handleProgress}
                    onEnded={handleEnded}
                    onError={(e) => {
                        console.error("Player Error:", e);
                        // Only alert if it's a genuine error, not just an interruption
                        if (isPlaying) alert("Playback Error: Unable to play this track. The source might be restricted.");
                    }}
                    onStart={() => console.log("Player Started")}

                    width="200px"
                    height="200px"
                    config={{
                        youtube: {
                            playerVars: {
                                playsinline: 1,
                                origin: window.location.origin,
                                disablekb: 1
                            }
                        }
                    }}
                />
            </div>
        </PlayerContext.Provider>
    );
};

export const usePlayer = () => useContext(PlayerContext);
