// ── Local library store: saved list + watch history (AsyncStorage) ──
import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_KEY = 'evareel_saved';
const HISTORY_KEY = 'evareel_history';

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

export async function loadSaved() {
  return readJson(SAVED_KEY, []);
}

export async function toggleSaved(id) {
  const saved = await loadSaved();
  const next = saved.includes(id) ? saved.filter((x) => x !== id) : [id, ...saved];
  await writeJson(SAVED_KEY, next);
  return next;
}

export async function loadHistory() {
  return readJson(HISTORY_KEY, []);
}

export async function addHistory(id, episode) {
  const history = await loadHistory();
  const next = [{ id, episode, ts: Date.now() }, ...history.filter((h) => h.id !== id)].slice(0, 50);
  await writeJson(HISTORY_KEY, next);
  return next;
}
