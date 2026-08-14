// ── API client: single base URL + token-aware fetch helper ──
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE = 'https://api.haoweimedia.cn/api';
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
