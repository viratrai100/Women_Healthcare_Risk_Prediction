/**
 * Spinner — animated loading indicator.
 * size: 'sm' | 'md' | 'lg'
 */
function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block rounded-full border-2 border-primary-500 border-t-transparent animate-spin ${sizes[size]} ${className}`}
    />
  );
}

export default Spinner;
