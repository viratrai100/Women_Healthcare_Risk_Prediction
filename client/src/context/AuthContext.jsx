import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '@/api/auth.api.js';

const AuthContext = createContext(null);

/**
 * Provides auth state and actions to the entire component tree.
 * Persists the JWT and user object in localStorage across page refreshes.
 */
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true); // true until initial bootstrap done

  // ── Bootstrap: restore session from localStorage on mount ────────────────
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, [token]);

  // ── Persist helpers ───────────────────────────────────────────────────────
  const persistSession = useCallback((newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
  const register = async (payload) => {
    const { data } = await authAPI.register(payload);
    persistSession(data.data.token, data.data.user);
    return data;
  };

  const login = async (payload) => {
    const { data } = await authAPI.login(payload);
    persistSession(data.data.token, data.data.user);
    return data;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch { /* ignore network errors on logout */ }
    clearSession();
  };

  const updateLocalUser = (updated) => {
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    register,
    login,
    logout,
    updateLocalUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};
