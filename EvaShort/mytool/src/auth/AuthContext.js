// ── Auth context: user session (login / register / guest / upgrade / logout) ──
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, getToken, setToken } from '../api/client';
import { uploadLibrary, syncLibraryFromServer, clearLibraryLocal, setGuestMode } from '../data/libraryStore';

const USER_KEY = 'evashort_auth_user';

const AuthContext = createContext(null);

async function loadCachedUser() {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function persistUser(user) {
  try {
    if (user) AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    else AsyncStorage.removeItem(USER_KEY);
  } catch (e) {
    // ignore
  }
}

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading'); // loading | signedOut | signedIn
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);

  // Restore session from disk on launch
  useEffect(() => {
    let alive = true;
    (async () => {
      const [token, cachedUser] = await Promise.all([getToken(), loadCachedUser()]);
      if (!alive) return;
      if (token && cachedUser) {
        setUser(cachedUser);
        setStatus('signedIn');
        setGuestMode(Boolean(cachedUser.isGuest));
        // Re-validate on the server in the background
        const r = await api.get('/auth/me', token);
        if (alive && r.ok && r.user) {
          setUser(r.user);
          persistUser(r.user);
        }
      } else {
        setStatus('signedOut');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const applySession = useCallback((token, userData) => {
    setToken(token);
    persistUser(userData);
    setUser(userData);
    setStatus('signedIn');
    setAuthError(null);
    // Library is bound to the account: drop any local leftovers from a
    // previous session, then pull the account's saved/history from the server.
    setGuestMode(Boolean(userData && userData.isGuest));
    (async () => {
      await clearLibraryLocal();
      await syncLibraryFromServer();
      await uploadLibrary();
    })();
  }, []);

  const register = useCallback(async (account, password) => {
    const r = await api.post('/auth/register', { account, password });
    if (r.ok) applySession(r.token, r.user);
    else setAuthError(r.error);
    return r.ok;
  }, [applySession]);

  const login = useCallback(async (account, password) => {
    const r = await api.post('/auth/login', { account, password });
    if (r.ok) applySession(r.token, r.user);
    else setAuthError(r.error);
    return r.ok;
  }, [applySession]);

  const guestLogin = useCallback(async () => {
    const r = await api.post('/auth/guest', {});
    if (r.ok) applySession(r.token, r.user);
    else setAuthError(r.error);
    return r.ok;
  }, [applySession]);

  const upgrade = useCallback(async (account, password) => {
    const token = await getToken();
    const r = await api.post('/auth/upgrade', { account, password }, token);
    if (r.ok) {
      setToken(r.token);
      persistUser(r.user);
      setUser(r.user);
      setStatus('signedIn');
      setAuthError(null);
    } else {
      setAuthError(r.error);
    }
    return r.ok;
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
    persistUser(null);
    setUser(null);
    setStatus('signedOut');
    setAuthError(null);
    setGuestMode(false);
  }, []);

  const updateProfile = useCallback(async (nickname, avatar) => {
    const token = await getToken();
    const r = await api.put('/user/profile', { nickname, avatar }, token);
    if (r.ok) {
      persistUser(r.user);
      setUser(r.user);
      return { ok: true };
    }
    return { ok: false, error: r.error };
  }, []);

  const deleteAccount = useCallback(async (password) => {
    const token = await getToken();
    const r = await api.del('/auth/account', { password }, token);
    if (r.ok) {
      setToken(null);
      persistUser(null);
      setUser(null);
      setStatus('signedOut');
      setAuthError(null);
      setGuestMode(false);
      return { ok: true };
    }
    return { ok: false, error: r.error };
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      authError,
      setAuthError,
      register,
      login,
      guestLogin,
      upgrade,
      logout,
      updateProfile,
      deleteAccount,
    }),
    [status, user, authError, register, login, guestLogin, upgrade, logout, updateProfile, deleteAccount]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
