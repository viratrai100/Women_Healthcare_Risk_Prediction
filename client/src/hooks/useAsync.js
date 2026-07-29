import { useState } from 'react';

/**
 * Generic async operation hook.
 * Tracks loading state and errors for any async function.
 *
 * @example
 * const { execute, loading, error } = useAsync(authAPI.login);
 * const result = await execute({ email, password });
 */
function useAsync(asyncFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const execute = async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn(...args);
      return result;
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Something went wrong');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error };
}

export default useAsync;
