import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import FloatingActionPanel from './FloatingActionPanel';

export default function Layout() {
  return (
    <div className="app-3d-shell min-h-screen bg-gray-50">
      <div className="app-3d-scene" aria-hidden="true">
        <span className="app-3d-shape app-3d-shape-one" />
        <span className="app-3d-shape app-3d-shape-two" />
        <span className="app-3d-shape app-3d-shape-three" />
      </div>
      <Navbar />
      <main className="app-3d-content">
        <Outlet />
      </main>
      <FloatingActionPanel />
    </div>
  );
}
