/**
 * AuthLayout — centred card wrapper for all auth pages (login, register, etc.).
 */
function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12 overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-primary-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-primary-800/15 blur-[80px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo mark */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600/20 border border-primary-500/30 text-3xl">
            ♀
          </div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate-400">{subtitle}</p>}
        </div>

        {/* Card */}
        <div className="card !p-8 shadow-2xl shadow-black/40">
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
