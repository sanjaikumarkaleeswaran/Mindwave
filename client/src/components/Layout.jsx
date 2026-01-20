import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Player from './Player';

export default function Layout() {
    return (
        <div className="flex bg-black min-h-screen text-white">
            <Sidebar />
            <main className="flex-1 ml-64 mb-24 min-h-screen">
                <Outlet />
            </main>
            <Player />
        </div>
    );
}
