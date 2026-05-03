import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import FloatingActionPanel from './FloatingActionPanel';

export default function Layout() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="app-3d-shell min-h-screen bg-gray-50">
      <div className="app-3d-scene" aria-hidden="true">
        <span className="app-3d-shape app-3d-shape-one" />
        <span className="app-3d-shape app-3d-shape-two" />
        <span className="app-3d-shape app-3d-shape-three" />
      </div>
      <Navbar />
      {!isOnline && (
        <div className="sticky top-16 z-40 border-b border-yellow-200 bg-yellow-50 px-4 py-2 text-center text-sm font-medium text-yellow-900">
          Offline mode: first aid stays available, and emergency triggers will queue until signal returns.
        </div>
      )}
      <main className="app-3d-content">
        <Outlet />
      </main>
      <FloatingActionPanel />
    </div>
  );
}
