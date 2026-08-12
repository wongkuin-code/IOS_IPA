// ── Mock short-drama catalogue (covers served from our HK API server) ──

export const categories = ['For You', 'Romance', 'Urban', 'Revenge', 'More'];

// Covers are served from our own Hong Kong server (fast & reliable from mainland CN).
// RN native Image loads these as remote URLs — the standard, reliable path on iOS
// (base64 data URIs and locally-bundled assets both failed to render on iOS builds).
const coverUrl = (id) => `https://api.haoweimedia.cn/covers/poster-${String(id).padStart(2, '0')}.jpg`;

const seed = (id, title, subtitle, episodes, rating, category, premium) => ({
  id,
  title,
  subtitle,
  episodes,
  rating,
  category,
  premium: Boolean(premium),
  cover: { uri: coverUrl(id) },
  poster: { uri: coverUrl(id) },
});

export const dramas = [
  seed(1, 'Fated to My Vengeful Husband', 'The CEO', 100, 8.6, ['Romance', 'ForYou'], true),
  seed(2, 'The Heiress Returns', 'Revenge Queen', 81, 7.2, ['Revenge', 'ForYou'], true),
  seed(3, 'Love at First Sight', 'Sweet Obsession', 72, 8.5, ['Romance', 'ForYou']),
  seed(4, 'Reborn to Love', 'Second Chance', 64, 8.8, ['Romance', 'ForYou'], true),
  seed(5, 'The CEO\'s Secret Bride', 'Hidden Wedding', 90, 7.9, ['Urban', 'ForYou'], true),
  seed(6, 'Billionaire\'s Substitute Wife', 'Contract Love', 85, 7.1, ['Urban']),
  seed(7, 'Revenge of the Phoenix', 'Rise from Ashes', 68, 8.2, ['Revenge'], true),
  seed(8, 'My Ex-Husband Regrets', 'Divorce Storm', 76, 7.6, ['Revenge']),
  seed(9, 'Sweetheart in the City', 'Romance, Inc.', 58, 8.0, ['Romance']),
  seed(10, 'The Tycoon\'s Last Promise', 'Final Vow', 47, 8.4, ['Urban'], true),
  seed(11, 'Chasing My Runaway Wife', 'Pursuit', 93, 7.3, ['Romance', 'Revenge']),
  seed(12, 'Queen of the Boardroom', 'Empire', 88, 7.8, ['Urban'], true),
  seed(13, 'A Love Written in Rain', 'Paper Umbrella', 52, 8.1, ['Romance']),
  seed(14, 'The Heir\'s Cold Heart', 'Ice Prince', 61, 7.0, ['Urban', 'Revenge']),
  seed(15, 'Stolen Kisses, Stolen Fortune', 'After Midnight', 70, 7.7, ['Romance'], true),
  seed(16, 'Rise of the Divorcee', 'Rebirth', 99, 8.3, ['Revenge'], true),
  seed(17, 'The Butler\'s Secret', 'Lies & Loyalty', 55, 7.4, ['Urban']),
  seed(18, 'First Love, Forever', 'Timeless', 44, 8.9, ['Romance'], true),
  seed(19, 'The Billionaire\'s Heir', 'Legacy', 82, 7.5, ['Urban']),
  seed(20, 'Payback with Interest', 'Cold Steel', 65, 7.9, ['Revenge'], true),
  seed(21, 'Honeymoon Betrayal', 'Crumbled Vows', 49, 7.2, ['Revenge', 'Urban']),
  seed(22, 'Campus Sweetheart', 'First Crush', 38, 8.6, ['Romance']),
  seed(23, 'The Dragon\'s Bride', 'Mafia Love', 87, 8.1, ['Urban', 'Romance'], true),
  seed(24, 'Silent Vengeance', 'No Mercy', 77, 8.0, ['Revenge'], true),
  seed(25, 'After the Divorce, I Shine', 'New Dawn', 95, 8.4, ['Revenge']),
  seed(26, 'The Lawyer\'s Wife', 'Court & Heart', 66, 7.6, ['Urban']),
  seed(27, 'Moonlit Promises', 'Nightfall', 41, 8.7, ['Romance'], true),
  seed(28, 'The Golden Handcuffs', 'Arranged Fate', 74, 7.3, ['Urban', 'Romance']),
  seed(29, 'Twilight Vendetta', 'Dark Retribution', 83, 8.2, ['Revenge'], true),
  seed(30, 'Love Under the Neon', 'City Nights', 57, 7.8, ['Urban']),
];

export const trending = dramas.filter((d) => d.rating >= 8.0);
export const newReleases = dramas.slice(0, 12);

export const hotSearches = ['CEO', 'Revenge', 'Reborn', 'Billionaire', 'Sweetheart', 'Divorce'];

export function byCategory(cat) {
  if (!cat || cat === 'For You') return dramas;
  if (cat === 'More') return dramas;
  return dramas.filter((d) => d.category.includes(cat));
}

export function searchDramas(keyword) {
  const q = (keyword || '').trim().toLowerCase();
  if (!q) return dramas;
  return dramas.filter(
    (d) => d.title.toLowerCase().includes(q) || (d.subtitle || '').toLowerCase().includes(q)
  );
}

export function moreOf(data) {
  return [...data, ...data.slice(0, 6).map((d) => ({ ...d, id: `${d.id}-r` }))];
}
