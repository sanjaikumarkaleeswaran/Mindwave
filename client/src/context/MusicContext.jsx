import { createContext, useContext, useState, useRef } from 'react';

const MusicContext = createContext(null);

export function MusicProvider({ children }) {
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [volume, setVolume] = useState(0.5);

    // Basic Queue Implementation
    const [queue, setQueue] = useState([]);

    const playTrack = (track) => {
        setCurrentTrack(track);
        setIsPlaying(true);
        setIsMinimized(false);
    };

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const closePlayer = () => {
        setIsPlaying(false);
        setCurrentTrack(null);
    };

    return (
        <MusicContext.Provider value={{
            currentTrack,
            isPlaying,
            isMinimized,
            volume,
            queue,
            playTrack,
            togglePlay,
            setIsMinimized,
            setVolume,
            closePlayer,
            setIsPlaying // exposed for internal player use
        }}>
            {children}
        </MusicContext.Provider>
    );
}

export const useMusic = () => useContext(MusicContext);
