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

// Resolve the absolute video URL for a drama episode, or null if not hosted yet.
export function getVideoUrl(dramaId, episode) {
  if (!cache) return null;
  const d = cache.dramas && cache.dramas[String(dramaId)];
  if (!d) return null;
  const rel = d.urls && d.urls[String(episode)];
  if (!rel) return null;
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
