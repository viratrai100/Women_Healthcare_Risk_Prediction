/**
 * Alert — inline feedback banner.
 * type: 'error' | 'success' | 'info'
 */
function Alert({ type = 'error', children, className = '' }) {
  const styles = {
    error:   'bg-rose-500/10 border-rose-500/30 text-rose-400',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    info:    'bg-primary-500/10 border-primary-500/30 text-primary-300',
  };
  return (
    <div
      role="alert"
      className={`rounded-xl border px-4 py-3 text-sm ${styles[type]} ${className}`}
    >
      {children}
    </div>
  );
}

export default Alert;
