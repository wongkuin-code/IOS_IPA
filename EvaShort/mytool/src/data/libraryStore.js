// ── Library store: saved list + watch history ──
// Guests: nothing is stored (no local, no server).
// Signed-in accounts: data lives on the server (keyed by account); the local
// copy is just a cache, cleared and re-pulled on every session change.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, getToken } from '../api/client';

const SAVED_KEY = 'evashort_saved';
const HISTORY_KEY = 'evashort_history';

let guestMode = false;

// Called by AuthContext whenever the session changes.
export function setGuestMode(isGuest) {
  guestMode = Boolean(isGuest);
}

async function readJson(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

async function writeJson(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // ignore
  }
}

export async function clearLibraryLocal() {
  try {
    await AsyncStorage.removeItem(SAVED_KEY);
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    // ignore
  }
}

export async function loadSaved() {
  if (guestMode) return [];
  return readJson(SAVED_KEY, []);
}

export async function toggleSaved(id) {
  if (guestMode) return [];
  const saved = await loadSaved();
  const exists = saved.some((x) => String(x) === String(id));
  const next = exists ? saved.filter((x) => String(x) !== String(id)) : [id, ...saved];
  await writeJson(SAVED_KEY, next);
  uploadLibrary();
  return next;
}

export async function loadHistory() {
  if (guestMode) return [];
  return readJson(HISTORY_KEY, []);
}

export async function addHistory(id, episode) {
  if (guestMode) return [];
  const history = await loadHistory();
  const next = [{ id, episode, ts: Date.now() }, ...history.filter((h) => h.id !== id)].slice(0, 50);
  await writeJson(HISTORY_KEY, next);
  uploadLibrary();
  return next;
}

// ── Server sync ──
// Push local saved/history to the account (fire-and-forget).
export async function uploadLibrary() {
  if (guestMode) return;
  const token = await getToken();
  if (!token) return;
  const [saved, history] = await Promise.all([loadSaved(), loadHistory()]);
  try {
    await api.put('/user/saved', { ids: saved }, token);
    await api.put('/user/history', { items: history }, token);
  } catch (e) {
    // offline: keep local only
  }
}

// Pull server data into local storage. Server is the source of truth for
// the account — local copy is fully replaced, never merged.
export async function syncLibraryFromServer() {
  if (guestMode) return;
  const token = await getToken();
  if (!token) return;
  const r1 = await api.get('/user/saved', token);
  if (r1.ok && Array.isArray(r1.ids)) {
    await writeJson(SAVED_KEY, r1.ids);
  }
  const r2 = await api.get('/user/history', token);
  if (r2.ok && Array.isArray(r2.items)) {
    await writeJson(HISTORY_KEY, r2.items.slice(0, 50));
  }
}
