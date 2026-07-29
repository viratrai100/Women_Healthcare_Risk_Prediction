import Navbar from '@/components/layout/Navbar.jsx';
import { Outlet } from 'react-router-dom';

/**
 * AppLayout — wraps all authenticated pages with the Navbar.
 */
function AppLayout() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
