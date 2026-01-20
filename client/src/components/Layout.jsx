import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Player from './Player';
import { usePlayer } from '../context/PlayerContext';

export default function Layout() {
    const { currentSong } = usePlayer();

    return (
        <div className="flex bg-black min-h-screen text-white">
            <Sidebar />
            <main className={`flex-1 ml-64 min-h-screen ${currentSong ? 'mb-24' : ''}`}>
                <Outlet />
            </main>
            <Player />
        </div>
    );
}
