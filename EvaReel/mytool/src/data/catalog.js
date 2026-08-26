// ── Remote video catalogue: maps (dramaId, episode) → video URL ──
// Hosted as static JSON on the same domain as the IAP API:
//   https://api.haoweimedia.cn/evareel/catalog.json
// Keeping video URLs off the client binary lets us add/rotate episodes
// without shipping a new app build.
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CATALOG_URL = 'https://api.haoweimedia.cn/evareel/catalog.json';
const STORAGE_KEY = 'eva_reel_catalog';

let cache = null;
let inflight = null;

// Fetch the catalog. Resolves with the parsed object (or null if unavailable).
// Falls back to the last cached copy in AsyncStorage when the network fails.
export async function fetchCatalog({ force = false } = {}) {
  if (cache && !force) return cache;
  if (inflight) return inflight;

  inflight = (async () => {
    let data = null;
    try {
      const res = await fetch(CATALOG_URL);
      if (res.ok) data = await res.json();
    } catch (e) {
      // network error — fall through to cache
    }
    if (!data) {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) data = JSON.parse(raw);
      } catch (e) {
        // ignore
      }
    }
    if (data) {
      cache = data;
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        // ignore
      }
    }
    inflight = null;
    return cache;
  })();

  return inflight;
}

// Fallback: when the catalog has only one real video, every episode points to
// it, so the home screen looks content-rich and everything "plays" (a
// submission-transition measure to avoid the "only 1 video" impression).
let _fallbackUrl = null;
function firstAvailableUrl() {
  if (_fallbackUrl) return _fallbackUrl;
  if (!cache || !cache.dramas) return null;
  for (const id of Object.keys(cache.dramas)) {
    const d = cache.dramas[id];
    if (d && d.urls) {
      const ep = Object.keys(d.urls)[0];
      if (ep) {
        const rel = d.urls[ep];
        _fallbackUrl = rel.startsWith('http') ? rel : `${cache.baseUrl || ''}${rel}`;
        return _fallbackUrl;
      }
    }
  }
  return null;
}

// Resolve the absolute video URL for a drama episode, or null if not hosted yet.
// If the drama has no video of its own, fall back to the catalog's one real video.
export function getVideoUrl(dramaId, episode) {
  if (!cache) return null;
  const d = cache.dramas && cache.dramas[String(dramaId)];
  const rel = d && d.urls && d.urls[String(episode)];
  if (!rel) return firstAvailableUrl();
  if (rel.startsWith('http')) return rel;
  const base = cache.baseUrl || '';
  return `${base}${rel}`;
}

// True if the given episode has a hosted video in the catalog.
export function isEpisodeAvailable(dramaId, episode) {
  return getVideoUrl(dramaId, episode) != null;
}

// Convenience hook: triggers a fetch on mount and reports readiness.
export function useCatalog() {
  const [ready, setReady] = useState(!!cache);
  useEffect(() => {
    let active = true;
    fetchCatalog().then(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);
  return ready;
}
