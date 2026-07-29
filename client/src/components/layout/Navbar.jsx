import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.jsx';

/**
 * Top navigation bar — shown on all authenticated pages.
 */
function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-surface-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white text-sm font-bold">
            ♀
          </span>
          <span className="hidden sm:block font-semibold text-white text-sm leading-tight">
            AI Women's <br />
            <span className="text-primary-400 font-normal text-xs">Healthcare</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link to="/dashboard" className="px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
            Dashboard
          </Link>
          <Link to="/assessment" className="px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
            Assessment
          </Link>
          <Link to="/reports" className="px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
            Reports
          </Link>
          <Link to="/profile" className="px-3 py-1.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
            Profile
          </Link>
        </nav>

        {/* User menu */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium text-white leading-none">{user?.name}</span>
            <span className="text-xs text-slate-400 capitalize">{user?.role}</span>
          </div>
          <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-sm select-none">
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <button
            onClick={handleLogout}
            className="btn-ghost !px-3 !py-1.5 !text-xs"
            id="logout-btn"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
