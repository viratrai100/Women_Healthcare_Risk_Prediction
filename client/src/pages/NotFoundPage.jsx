import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div className="flex flex-col items-center gap-6">
        <div className="text-7xl font-black text-primary-600 opacity-40 select-none">404</div>
        <h1 className="text-2xl font-bold text-white">Page not found</h1>
        <p className="text-slate-400 text-sm max-w-xs">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/dashboard" className="btn-primary">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
