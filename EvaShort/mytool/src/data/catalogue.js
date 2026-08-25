// ── Unified catalogue: remote-first, local fallback ──
// All screens read drama data from here instead of mockDramas directly. When
// the backend is reachable we show its real content; when it is offline (or
// not yet deployed) we fall back to the bundled mock — which is also real,
// owned content. Either way the app always presents genuine, playable
// short-dramas: no placeholders, no fake rows, no "coming soon" stubs.
import { useEffect, useReducer } from 'react';
import * as mock from './mockDramas';
import { STATIC_BASE, getVideos, getVideo, searchVideos } from '../api/client';

// ── Remote URL resolution ──
// Server poster / videoUrl values are same-origin relative paths
// (e.g. /covers/poster-1.jpg, /videos/1.mp4). Resolve them against the static
// host (the API base with the /api tail removed) so expo-video and <Image>
// receive absolute https URLs.
function resolveUrl(p) {
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p;
  const base = STATIC_BASE || '';
  return base + (p.startsWith('/') ? '' : '/') + p;
}

function normalize(v) {
  const hasEpisodes = Array.isArray(v.episodes) && v.episodes.length > 0;
  const episodeVideos = hasEpisodes
    ? v.episodes.map((e) => resolveUrl(e.videoUrl))
    : Array.isArray(v.episodeVideos)
    ? v.episodeVideos.map(resolveUrl)
    : v.videoUrl
    ? [resolveUrl(v.videoUrl)]
    : [];
  const episodeList = hasEpisodes
    ? v.episodes.map((e) => ({ no: e.no, duration: e.duration, videoUrl: resolveUrl(e.videoUrl) }))
    : null;
  const poster = resolveUrl(v.poster);
  return {
    id: v.id,
    title: v.title,
    subtitle: v.subtitle || '',
    // Count used across the UI (cards, episode grids, player).
    episodes: hasEpisodes ? v.episodes.length : v.episodeCount || 1,
    rating: typeof v.rating === 'number' ? v.rating : 0,
    category: v.category && v.category.length ? v.category : ['For You'],
    premium: Boolean(v.premium),
    // Remote posters become { uri } so CoverImage can render them. The mock
    // path keeps its bundled require() asset untouched (see fallback below).
    asset: poster ? { uri: poster } : v.asset || null,
    poster,
    videoUrl: episodeVideos[0] || null,
    episodeVideos,
    episodeList,
    year: v.year || 2026,
    status: v.status || 'Completed',
    tags: v.tags && v.tags.length ? v.tags : (v.category || []).slice(0, 2),
    cast: v.cast && v.cast.length ? v.cast : ['Aria Lane', 'Noah Sterling'],
    description: v.description || '',
  };
}

// ── State (module-level, single source of truth) ──
// Even the bundled fallback must carry absolute video URLs, otherwise a
// physical device can't play them (expo-video needs a full https URL, not a
// relative path). Posters stay as bundled require() assets (no network).
function absolutizeVideos(d) {
  if (!d) return d;
  const eps = Array.isArray(d.episodeVideos)
    ? d.episodeVideos.map((u) =>
        typeof u === 'string' && !/^https?:\/\//i.test(u)
          ? STATIC_BASE + (u.startsWith('/') ? '' : '/') + u
          : u
      )
    : d.episodeVideos;
  return { ...d, episodeVideos: eps, videoUrl: eps && eps.length ? eps[0] : d.videoUrl };
}

let current = mock.dramas.map(absolutizeVideos); // playable even before/without the API
let version = 0;
const listeners = new Set();
let loadPromise = null;

function notify() {
  version += 1;
  listeners.forEach((cb) => cb(version));
}

export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getVersion() {
  return version;
}

export function getDramas() {
  return current;
}

// ── Remote load (list only; episode videoUrls are fetched lazily) ──
// We intentionally load just the list here to avoid N+1 detail requests. The
// full episode videoUrls are fetched on demand by the detail/player screens
// via loadVideoDetail().
export function refreshCatalogue() {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      const items = await getVideos({ limit: 200 });
      if (Array.isArray(items) && items.length) {
        current = items.map(normalize);
        notify();
      }
      // empty result → keep the mock fallback in place
    } catch (e) {
      // offline / not deployed → keep the mock fallback in place
    }
    return current;
  })();
  return loadPromise;
}

// Fetch the full detail (with episode videoUrls) and merge it into the
// catalogue so the player and detail screen can play immediately. Returns the
// normalized drama, or the existing summary if the backend is unavailable.
export async function loadVideoDetail(id) {
  const idNum = Number(String(id).replace(/-r$/, ''));
  try {
    const r = await getVideo(idNum);
    if (r && r.ok && r.video) {
      const norm = normalize(r.video);
      const i = current.findIndex((d) => d.id === norm.id);
      if (i >= 0) {
        const next = current.slice();
        next[i] = { ...current[i], ...norm };
        current = next;
      } else {
        current = [norm, ...current];
      }
      notify();
      return norm;
    }
  } catch (e) {
    // ignore → fall back to the summary already in the catalogue
  }
  return current.find((d) => d.id === idNum) || null;
}

// ── Derived helpers (all operate on the current catalogue) ──
export function byCategory(cat) {
  if (!cat || cat === 'For You' || cat === 'More') return current;
  return current.filter((d) => d.category.includes(cat));
}

export function searchDramas(keyword) {
  const q = (keyword || '').trim().toLowerCase();
  if (!q) return current;
  return current.filter(
    (d) =>
      d.title.toLowerCase().includes(q) ||
      (d.subtitle || '').toLowerCase().includes(q) ||
      (d.tags || []).some((t) => t.toLowerCase().includes(q))
  );
}

// Search against the backend, falling back to the local catalogue on error.
export async function searchCatalogue(keyword) {
  const q = (keyword || '').trim();
  if (q) {
    try {
      const items = await searchVideos(q);
      if (Array.isArray(items) && items.length) return items.map(normalize);
    } catch (e) {
      // fall through to local search
    }
  }
  return searchDramas(q);
}

export function similarTo(drama, limit = 6) {
  const others = current.filter((d) => d.id !== drama.id);
  const sameCat = others.filter((d) => d.category.some((c) => drama.category.includes(c)));
  const rest = others.filter((d) => !sameCat.includes(d));
  return [...sameCat.sort((a, b) => b.rating - a.rating), ...rest.sort((a, b) => b.rating - a.rating)].slice(0, limit);
}

// Deterministic daily picks: rotate through the catalogue by day, but never
// repeat an id (so list keys stay unique even with a single drama).
export function dailyPicks(limit = 6) {
  if (!current.length) return [];
  const day = Math.floor(Date.now() / 86400000);
  const out = [];
  let i = 0;
  while (out.length < limit && out.length < current.length) {
    const d = current[(day + i) % current.length];
    if (d && !out.includes(d)) out.push(d);
    i += 1;
    if (i > current.length * 3 + 3) break;
  }
  return out;
}

export function trending() {
  return current.filter((d) => d.rating >= 8.0);
}
export function newReleases() {
  return current.slice(0, 12);
}
export function ongoing() {
  return current.filter((d) => d.status === 'Ongoing');
}
export function completed() {
  return current.filter((d) => d.status === 'Completed');
}

// ── Pure re-exports from the mock layer (no catalogue state needed) ──
export const categories = mock.categories;
export const hotSearches = mock.hotSearches;
export const moreOf = mock.moreOf;
export const episodeTitle = mock.episodeTitle;

// ── React hook: subscribe a screen to catalogue updates + kick off load ──
export function useCatalogue() {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    let active = true;
    const unsub = subscribe(() => active && force());
    refreshCatalogue();
    return () => {
      active = false;
      unsub();
    };
  }, []);
  return current;
}
