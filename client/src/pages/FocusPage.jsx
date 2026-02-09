
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Play, Pause, RotateCcw, CheckCircle, ChevronUp, ChevronDown, X, Edit, Save, Trash2, Volume2, VolumeX, Music } from 'lucide-react';
import api from '../lib/axios';

// Default 25 minutes
const DEFAULT_TIME = 25 * 60;

const FOCUS_SOUNDS = [
    { id: 'none', name: 'Silent', url: null },
    {
        id: 'meditation1',
        name: 'Peaceful Piano',
        url: '/audio/piano.mp3'
    },
    {
        id: 'meditation2',
        name: 'Deep Relaxation',
        url: '/audio/rain.mp3'
    },
    {
        id: 'meditation3',
        name: 'Calm Nature',
        url: '/audio/nature.mp3'
    },
    {
        id: 'meditation4',
        name: 'Zen Focus',
        url: '/audio/zen.mp3'
    }
];

function EditTimerModal({ onSave, onCancel, initialSeconds }) {
    // Convert total seconds to H/M/S
    const h = Math.floor(initialSeconds / 3600);
    const m = Math.floor((initialSeconds % 3600) / 60);
    const s = initialSeconds % 60;

    const [hours, setHours] = useState(h);
    const [minutes, setMinutes] = useState(m);
    const [seconds, setSeconds] = useState(s);
    const [name, setName] = useState("Focus Session");

    const handleSave = () => {
        const total = (hours * 3600) + (minutes * 60) + seconds;
        onSave(total, name);
    };

    // Helper for number inputs
    const NumberInput = ({ value, setter, max }) => (
        <div className="flex flex-col items-center">
            <button onClick={() => setter(v => (v + 1) % (max + 1))} className="text-zinc-500 hover:text-indigo-400 p-1">
                <ChevronUp className="w-5 h-5" />
            </button>
            <div className="text-3xl font-bold font-mono text-white w-16 text-center bg-transparent border-none appearance-none m-0">
                {value.toString().padStart(2, '0')}
            </div>
            <button onClick={() => setter(v => (v - 1 + (max + 1)) % (max + 1))} className="text-zinc-500 hover:text-indigo-400 p-1">
                <ChevronDown className="w-5 h-5" />
            </button>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-700/50 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-white">Edit timer</h2>
                    <div className="flex gap-2">
                        <button className="text-zinc-500 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Time Pickers */}
                <div className="flex items-center justify-center gap-2 mb-8 relative">
                    <NumberInput value={hours} setter={setHours} max={23} />
                    <span className="text-2xl font-bold text-zinc-600 pb-2">:</span>
                    <NumberInput value={minutes} setter={setMinutes} max={59} />
                    <span className="text-2xl font-bold text-zinc-600 pb-2">:</span>
                    <NumberInput value={seconds} setter={setSeconds} max={59} />

                    {/* Blue underline effect from screenshot */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-zinc-700 mt-2"></div>
                    <div className="absolute bottom-0 left-12 right-12 h-0.5 bg-indigo-500"></div>
                </div>

                {/* Name Input */}
                <div className="mb-6">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Edit className="h-4 w-4 text-zinc-500" />
                        </div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5 placeholder-zinc-500"
                            placeholder="Timer Name"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 grid grid-cols-2">
                    <button
                        onClick={handleSave}
                        className="flex items-center justify-center gap-2 text-white bg-indigo-600 hover:bg-indigo-500 font-medium rounded-lg text-sm px-5 py-2.5 transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        Save
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex items-center justify-center gap-2 text-zinc-300 bg-transparent border border-zinc-600 hover:bg-zinc-800 font-medium rounded-lg text-sm px-5 py-2.5 transition-colors"
                    >
                        <X className="w-4 h-4" />
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function FocusPage() {
    const [initialTime, setInitialTime] = useState(DEFAULT_TIME);
    const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
    const [isActive, setIsActive] = useState(false);
    const [selectedHabitId, setSelectedHabitId] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);

    // Audio State
    const [selectedSound, setSelectedSound] = useState('meditation1');
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [isPlayingSound, setIsPlayingSound] = useState(false);
    const [isAudioLoading, setIsAudioLoading] = useState(false);
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
            if (Notification.permission === 'granted') {
                new Notification("Focus Session Complete!");
            }
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    // Update audio volume when slider changes
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
            audioRef.current.muted = isMuted;
        }
    }, [volume, isMuted]);

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const toggleMusic = async () => {
        if (selectedSound === 'none') {
            alert('Please select a music option first');
            return;
        }

        if (isAudioLoading || !audioRef.current) {
            return; // Prevent rapid clicks
        }

        try {
            setIsAudioLoading(true);

            if (isPlayingSound) {
                // Pause music
                audioRef.current.pause();
                setIsPlayingSound(false);
            } else {
                // Play music
                await audioRef.current.play();
                setIsPlayingSound(true);
            }
        } catch (err) {
            console.error('Audio control error:', err);
            setIsPlayingSound(false);
        } finally {
            setIsAudioLoading(false);
        }
    };

    const resetTimer = () => {
        setIsActive(false);
        setIsPlayingSound(false);
        setTimeLeft(initialTime);
    };

    const handleSaveTime = (newSeconds, newName) => {
        setInitialTime(newSeconds);
        setTimeLeft(newSeconds);
        setShowEditModal(false);
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        if (h > 0) {
            // Show hours if present: H:MM:SS
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        // Otherwise just MM:SS
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Calculate progress for circle
    const progress = initialTime > 0 ? ((initialTime - timeLeft) / initialTime) * 100 : 0;
    const strokeDasharray = 2 * Math.PI * 120;
    const strokeDashoffset = strokeDasharray - (progress / 100) * strokeDasharray;

    const currentSoundUrl = FOCUS_SOUNDS.find(s => s.id === selectedSound)?.url;

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <Helmet>
                <title>Focus Mode | Life OS</title>
            </Helmet>

            {/* Audio Player */}
            {currentSoundUrl && (
                <audio
                    key={selectedSound}
                    ref={audioRef}
                    src={currentSoundUrl}
                    loop
                    preload="auto"
                    onLoadedData={() => {
                        console.log('Audio loaded:', selectedSound);
                        // Reset loading state
                        setIsAudioLoading(false);
                        if (audioRef.current) {
                            audioRef.current.volume = volume;
                            audioRef.current.muted = isMuted;
                            // Auto-play if was previous playing or just switched
                            if (isPlayingSound) {
                                audioRef.current.play().catch(e => console.error("Auto-play blocked:", e));
                            }
                        }
                    }}
                    onPlay={() => {
                        console.log('Audio playing:', selectedSound);
                        setIsPlayingSound(true);
                    }}
                    onPause={() => {
                        console.log('Audio paused:', selectedSound);
                        setIsPlayingSound(false);
                    }}
                    onError={(e) => {
                        console.error('Audio load error:', selectedSound, e);
                        setIsPlayingSound(false);
                        setIsAudioLoading(false);
                        alert("Could not load this audio track. Please try another one.");
                    }}
                />
            )}

            {/* Modal */}
            {showEditModal && (
                <EditTimerModal
                    initialSeconds={initialTime}
                    onSave={handleSaveTime}
                    onCancel={() => setShowEditModal(false)}
                />
            )}

            {/* Background Ambience */}
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

                {/* Sound Selector Compact */}
                <div className="w-full flex items-center gap-3 bg-zinc-900/30 border border-zinc-800 rounded-xl p-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                        <Music className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <select
                            value={selectedSound}
                            onChange={(e) => {
                                setIsPlayingSound(false); // Stop music when changing sound
                                setSelectedSound(e.target.value);
                            }}
                            className="w-full bg-transparent text-sm text-zinc-300 focus:outline-none border-none cursor-pointer"
                        >
                            {FOCUS_SOUNDS.map(s => (
                                <option key={s.id} value={s.id} className="bg-zinc-900">{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 border-l border-white/5 pl-3">
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className="text-zinc-400 hover:text-white transition-colors"
                        >
                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={isMuted ? 0 : volume}
                            onChange={(e) => {
                                setVolume(parseFloat(e.target.value));
                                setIsMuted(false);
                            }}
                            className="w-20 accent-indigo-500 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>

                {/* Timer Display */}
                <div className="relative group cursor-pointer" onClick={() => !isActive && setShowEditModal(true)}>
                    {/* Ring */}
                    <div className="relative w-72 h-72 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="50%" cy="50%" r="120" fill="none" stroke="#27272a" strokeWidth="8" />
                            <circle
                                cx="50%" cy="50%" r="120" fill="none"
                                stroke={isActive ? "#6366f1" : "#71717a"}
                                strokeWidth="8" strokeLinecap="round"
                                style={{ strokeDasharray, strokeDashoffset, transition: 'stroke-dashoffset 1s linear' }}
                            />
                        </svg>

                        {/* Text */}
                        <div className="absolute flex flex-col items-center">
                            <span className="text-6xl font-mono font-bold text-white tracking-wider tabular-nums">
                                {formatTime(timeLeft)}
                            </span>
                            {isActive ? (
                                <span className="text-indigo-400 text-sm mt-2 animate-pulse uppercase tracking-widest font-semibold">
                                    Focusing
                                </span>
                            ) : (
                                <div className="flex items-center gap-1 text-zinc-500 text-sm mt-2 group-hover:text-indigo-400 transition-colors">
                                    <Edit className="w-3 h-3" />
                                    <span className="uppercase tracking-widest font-semibold">Edit Timer</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4">
                    {/* Timer Control */}
                    <button
                        onClick={toggleTimer}
                        className={`p-6 rounded-full transition-all transform hover:scale-105 shadow-xl ${isActive
                            ? 'bg-zinc-800 text-red-400 hover:bg-zinc-700'
                            : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/30'
                            }`}
                        title={isActive ? 'Pause Timer' : 'Start Timer'}
                    >
                        {isActive ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                    </button>

                    {/* Music Control */}
                    <button
                        onClick={toggleMusic}
                        disabled={selectedSound === 'none' || isAudioLoading}
                        className={`p-5 rounded-full transition-all transform hover:scale-105 shadow-lg ${selectedSound === 'none' || isAudioLoading
                            ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                            : isPlayingSound
                                ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-500/30'
                                : 'bg-zinc-800 text-purple-400 hover:bg-zinc-700'
                            }`}
                        title={isAudioLoading ? 'Loading...' : isPlayingSound ? 'Pause Music' : 'Play Music'}
                    >
                        <Music className={`w-6 h-6 ${isAudioLoading ? 'animate-pulse' : ''}`} />
                    </button>

                    {/* Reset Timer */}
                    <button
                        onClick={resetTimer}
                        className="p-4 rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
                        title="Reset Timer"
                    >
                        <RotateCcw className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div >
    );
}
