// ── API client: single base URL + token-aware fetch helper ──
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// API base is env-driven: set `extra.apiBase` in app.json (or inject via EAS
// env) to point the app at a different backend without code changes. Falls
// back to the production domain when unset.
const DEFAULT_API_BASE = 'https://api.haoweimedia.cn/api';
export const API_BASE =
  (Constants.expoConfig && Constants.expoConfig.extra && Constants.expoConfig.extra.apiBase) ||
  DEFAULT_API_BASE;

// Static assets (covers, videos) are served same-origin as the API but at the
// site root, not under /api. Derive the static host by stripping the /api tail.
export const STATIC_BASE = API_BASE.replace(/\/api\/?$/i, '');

const TOKEN_KEY = 'evashort_auth_token';

export async function getToken() {
  try {
    return (await AsyncStorage.getItem(TOKEN_KEY)) || '';
  } catch (e) {
    return '';
  }
}

export async function setToken(token) {
  try {
    if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
    else await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    // ignore
  }
}

async function request(method, url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`${API_BASE}${url}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    return { ok: false, networkError: true, error: `Network error: ${e && e.message}` };
  }
  let data;
  try {
    data = await res.json();
  } catch (e) {
    return { ok: false, error: `Unexpected server response [${res.status}]` };
  }
  if (!res.ok || !data.ok) {
    const msg = data.message || data.error || `Request failed [${res.status}]`;
    return { ok: false, error: msg, code: data.error };
  }
  return data;
}

export const api = {
  get: (url, token) => request('GET', url, undefined, token),
  post: (url, body, token) => request('POST', url, body, token),
  put: (url, body, token) => request('PUT', url, body, token),
  del: (url, body, token) => request('DELETE', url, body, token),
};

// ── Video catalogue ──
// List of drama summaries (no per-episode videoUrl). Returns [] on any error
// so callers can fall back to the bundled catalogue.
export async function getVideos(params = {}) {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  const r = await api.get(`/videos${qs ? `?${qs}` : ''}`);
  if (r && r.ok && Array.isArray(r.items)) return r.items;
  return [];
}

// Full drama detail including episodes[] (each with videoUrl). Returns
// { ok:false } when missing/offline so callers can keep the summary.
export async function getVideo(id) {
  const r = await api.get(`/videos/${id}`);
  if (r && r.ok && r.video) return { ok: true, video: r.video };
  return { ok: false };
}

// Search summaries. Returns [] on error so callers can fall back to local.
export async function searchVideos(q) {
  const r = await api.get(`/search?q=${encodeURIComponent(q || '')}`);
  if (r && r.ok && Array.isArray(r.items)) return r.items;
  return [];
}
