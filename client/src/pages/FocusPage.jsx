import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Play, Pause, RotateCcw, Music, CheckCircle } from 'lucide-react';
import api from '../lib/axios';

const FOCUS_TIME = 25 * 60; // 25 minutes

const MUSIC_TRACKS = [
    { id: "jfKfPfyJRdk", name: "Lofi Girl", description: "Beats to Relax/Study to" },
    { id: "4xDzrJKXOOY", name: "Synthwave", description: "Chillwave / Retrowave" },
    { id: "t_jHrUE5IOk", name: "Deep Focus", description: "Ambient Electronic" }, // Changed to a more reliable ambient link
    { id: "1ZPvfIZoJzw", name: "Rain Sounds", description: "Heavy Rain & Thunder" },
    { id: "lTRiuFIWV54", name: "Classical", description: "Mozart for Brain Power" }
];

export default function FocusPage() {
    const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
    const [isActive, setIsActive] = useState(false);
    const [selectedHabitId, setSelectedHabitId] = useState('');
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [selectedTrackId, setSelectedTrackId] = useState(MUSIC_TRACKS[0].id);
    const audioRef = useRef(null);

    // Fetch habits for selection
    const { data: habits = [] } = useQuery({
        queryKey: ['habits'],
        queryFn: async () => {
            const res = await api.get('/habits');
            return res.data;
        }
    });

    // Timer logic
    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((time) => time - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            setIsMusicPlaying(false); // Stop music when done
            // Play alarm sound here if desired
            if (Notification.permission === 'granted') {
                new Notification("Focus Session Complete!");
            }
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(FOCUS_TIME);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate progress for circle
    const progress = ((FOCUS_TIME - timeLeft) / FOCUS_TIME) * 100;
    const strokeDasharray = 2 * Math.PI * 120; // Radius 120
    const strokeDashoffset = strokeDasharray - (progress / 100) * strokeDasharray;

    const currentTrack = MUSIC_TRACKS.find(t => t.id === selectedTrackId);

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <Helmet>
                <title>Focus Mode | Life OS</title>
            </Helmet>

            {/* Background Ambience (Optional Visuals) */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? 'opacity-20' : 'opacity-5'}`}>
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
                <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
            </div>

            <div className="z-10 flex flex-col items-center w-full max-w-md space-y-8">

                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold text-white tracking-tight">Focus Mode</h1>
                    <p className="text-zinc-400">Select a habit and start your session</p>
                </div>

                {/* Habit Selector */}
                <div className="w-full">
                    <select
                        value={selectedHabitId}
                        onChange={(e) => setSelectedHabitId(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                        disabled={isActive}
                    >
                        <option value="" disabled>Select a task to focus on...</option>
                        {habits.map(h => (
                            <option key={h._id} value={h._id}>{h.name}</option>
                        ))}
                    </select>
                </div>

                {/* Timer Display */}
                <div className="relative group">
                    {/* Progress Ring */}
                    <div className="relative w-72 h-72 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            {/* Track */}
                            <circle
                                cx="50%"
                                cy="50%"
                                r="120"
                                fill="none"
                                stroke="#27272a" /* zinc-800 */
                                strokeWidth="8"
                            />
                            {/* Indicator */}
                            <circle
                                cx="50%"
                                cy="50%"
                                r="120"
                                fill="none"
                                stroke={isActive ? "#6366f1" : "#71717a"} /* indigo-500 or zinc-500 */
                                strokeWidth="8"
                                strokeLinecap="round"
                                style={{
                                    strokeDasharray,
                                    strokeDashoffset,
                                    transition: 'stroke-dashoffset 1s linear'
                                }}
                            />
                        </svg>

                        {/* Digital Time */}
                        <div className="absolute flex flex-col items-center">
                            <span className="text-6xl font-mono font-bold text-white tracking-wider">
                                {formatTime(timeLeft)}
                            </span>
                            {isActive && (
                                <span className="text-indigo-400 text-sm mt-2 animate-pulse uppercase tracking-widest font-semibold">
                                    Focusing
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-6">
                    <button
                        onClick={toggleTimer}
                        className={`p-6 rounded-full transition-all transform hover:scale-105 shadow-xl ${isActive
                            ? 'bg-zinc-800 text-red-400 hover:bg-zinc-700'
                            : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/30'
                            }`}
                    >
                        {isActive ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                    </button>

                    <button
                        onClick={resetTimer}
                        className="p-4 rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
                        title="Reset Timer"
                    >
                        <RotateCcw className="w-6 h-6" />
                    </button>
                </div>

                {/* Music Controls */}
                <div className="w-full space-y-4">
                    {/* Toggle Switch Area */}
                    <div className={`flex items-center gap-4 px-6 py-3 rounded-xl border transition-all ${isMusicPlaying
                        ? 'bg-indigo-900/20 border-indigo-500/50'
                        : 'bg-zinc-900/30 border-zinc-800'
                        }`}>
                        <div className="p-2 rounded-full bg-zinc-800">
                            <Music className={`w-5 h-5 ${isMusicPlaying ? 'text-indigo-400 animate-pulse' : 'text-zinc-500'}`} />
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-medium text-white">Focus Background</div>
                            <div className="text-xs text-zinc-500">{isMusicPlaying ? currentTrack.name : 'Off'}</div>
                        </div>
                        <button
                            onClick={() => setIsMusicPlaying(!isMusicPlaying)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isMusicPlaying ? 'bg-indigo-500' : 'bg-zinc-700'
                                }`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isMusicPlaying ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                        </button>
                    </div>

                    {/* Track Selection (Visible only when playing) */}
                    {isMusicPlaying && (
                        <div className="animate-in fade-in slide-in-from-top-2 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-2">
                            <div className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-2">Select Station</div>
                            <div className="grid grid-cols-1 gap-2">
                                {MUSIC_TRACKS.map(track => (
                                    <button
                                        key={track.id}
                                        onClick={() => setSelectedTrackId(track.id)}
                                        className={`flex items-center justify-between p-3 rounded-lg text-left transition-all ${selectedTrackId === track.id
                                                ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300'
                                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
                                            }`}
                                    >
                                        <div>
                                            <div className="font-medium text-sm">{track.name}</div>
                                            <div className="text-[10px] opacity-70">{track.description}</div>
                                        </div>
                                        {selectedTrackId === track.id && (
                                            <div className="flex space-x-1">
                                                <span className="w-1 h-3 bg-indigo-500 animate-pulse"></span>
                                                <span className="w-1 h-3 bg-indigo-500 animate-pulse delay-75"></span>
                                                <span className="w-1 h-3 bg-indigo-500 animate-pulse delay-150"></span>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Hidden Youtube Embed for Audio */}
                {isMusicPlaying && (
                    <div className="hidden">
                        <iframe
                            width="560"
                            height="315"
                            src={`https://www.youtube.com/embed/${selectedTrackId}?autoplay=1&controls=0&loop=1&playlist=${selectedTrackId}`}
                            title="Focus Music"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        ></iframe>
                    </div>
                )}
            </div>
        </div>
    );
}
