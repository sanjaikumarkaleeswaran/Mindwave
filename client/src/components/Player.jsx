import { Play, SkipBack, SkipForward, Volume2, Repeat, Shuffle, Heart } from 'lucide-react';

export default function Player() {
    return (
        <div className="h-24 bg-zinc-950 border-t border-zinc-900 px-6 flex items-center justify-between fixed bottom-0 left-0 w-full z-50">
            {/* Current Song */}
            <div className="flex items-center gap-4 w-1/3">
                <div className="w-14 h-14 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-600">
                    <span className="text-xs">Cover</span>
                </div>
                <div>
                    <h4 className="text-white font-medium text-sm">No song playing</h4>
                    <p className="text-zinc-500 text-xs">Pick a song to start</p>
                </div>
                <button className="text-zinc-500 hover:text-indigo-500 transition-colors">
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
                    <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform">
                        <Play className="w-5 h-5 text-black ml-1" />
                    </button>
                    <button className="text-zinc-400 hover:text-white transition-colors">
                        <SkipForward className="w-5 h-5" />
                    </button>
                    <button className="text-zinc-500 hover:text-white transition-colors">
                        <Repeat className="w-4 h-4" />
                    </button>
                </div>
                <div className="w-full max-w-md flex items-center gap-2 text-xs text-zinc-500 font-mono">
                    <span>0:00</span>
                    <div className="h-1 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full w-0 bg-white rounded-full"></div>
                    </div>
                    <span>0:00</span>
                </div>
            </div>

            {/* Volume */}
            <div className="flex items-center justify-end gap-2 w-1/3">
                <Volume2 className="w-4 h-4 text-zinc-400" />
                <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden group hover:bg-zinc-700 cursor-pointer">
                    <div className="h-full w-2/3 bg-zinc-500 group-hover:bg-indigo-500 transition-colors rounded-full"></div>
                </div>
            </div>
        </div>
    );
}
