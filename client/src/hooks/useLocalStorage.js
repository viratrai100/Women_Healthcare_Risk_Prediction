import { useState, useEffect } from 'react';

/**
 * Persists state to localStorage, keeping it in sync across renders.
 *
 * @template T
 * @param {string} key      localStorage key
 * @param {T}      initial  default value
 * @returns {[T, (value: T) => void]}
 */
function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage errors
    }
  }, [key, value]);

  return [value, setValue];
}

export default useLocalStorage;
