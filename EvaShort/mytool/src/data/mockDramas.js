// ── Short-drama catalogue (30 bundled posters, gradient-first, zero network) ──
import { coverAssets } from './coverAssets';

export const categories = ['For You', 'Romance', 'Urban', 'Revenge', 'More'];

const seed = (id, title, subtitle, episodes, rating, category, premium, meta = {}) => ({
  id,
  title,
  subtitle,
  episodes,
  rating,
  category,
  premium: Boolean(premium),
  asset: coverAssets[(id - 1) % coverAssets.length],
  year: meta.year || 2026,
  status: meta.status || 'Completed',
  tags: meta.tags || category.slice(0, 2),
  cast: meta.cast || ['Aria Lane', 'Noah Sterling'],
  description:
    meta.description ||
    `${title} follows a captivating story of love, betrayal and second chances. ${subtitle} — every episode ends on a twist you will not see coming.`,
});

export const dramas = [
  seed(1, 'Fated to My Vengeful Husband', 'The CEO', 100, 8.6, ['Romance', 'ForYou'], true, { tags: ['CEO', 'Enemies to Lovers', 'Marriage'] }),
  seed(2, 'The Heiress Returns', 'Revenge Queen', 81, 7.2, ['Revenge', 'ForYou'], true, { tags: ['Rebirth', 'Family Feud', 'Payback'] }),
  seed(3, 'Love at First Sight', 'Sweet Obsession', 72, 8.5, ['Romance', 'ForYou'], false, { tags: ['Falling in Love', 'Office', 'Sparks'] }),
  seed(4, 'Reborn to Love', 'Second Chance', 64, 8.8, ['Romance', 'ForYou'], true, { tags: ['Rebirth', 'Redemption', 'Slow Burn'] }),
  seed(5, "The CEO's Secret Bride", 'Hidden Wedding', 90, 7.9, ['Urban', 'ForYou'], true, { tags: ['CEO', 'Secret Marriage', 'Drama'] }),
  seed(6, "Billionaire's Substitute Wife", 'Contract Love', 85, 7.1, ['Urban'], false, { tags: ['Contract Marriage', 'Billionaire', 'Cold Heart'] }),
  seed(7, 'Revenge of the Phoenix', 'Rise from Ashes', 68, 8.2, ['Revenge'], true, { tags: ['Comeback', 'Betrayal', 'Power'] }),
  seed(8, 'My Ex-Husband Regrets', 'Divorce Storm', 76, 7.6, ['Revenge'], false, { tags: ['Divorce', 'Regret', 'Family'] }),
  seed(9, 'Sweetheart in the City', 'Romance, Inc.', 58, 8.0, ['Romance'], false, { tags: ['City Life', 'New Love', 'Career'] }),
  seed(10, "The Tycoon's Last Promise", 'Final Vow', 47, 8.4, ['Urban'], true, { tags: ['Tycoon', 'Promise', 'Legacy'] }),
  seed(11, 'Chasing My Runaway Wife', 'Pursuit', 93, 7.3, ['Romance', 'Revenge'], false, { tags: ['Runaway', 'Second Chance', 'Chase'] }),
  seed(12, 'Queen of the Boardroom', 'Empire', 88, 7.8, ['Urban'], true, { tags: ['Female Lead', 'Business', 'Ambition'] }),
  seed(13, 'A Love Written in Rain', 'Paper Umbrella', 52, 8.1, ['Romance'], false, { tags: ['First Love', 'Letters', 'Nostalgia'] }),
  seed(14, "The Heir's Cold Heart", 'Ice Prince', 61, 7.0, ['Urban', 'Revenge'], false, { tags: ['Cold Male Lead', 'Heir', 'Healing'] }),
  seed(15, 'Stolen Kisses, Stolen Fortune', 'After Midnight', 70, 7.7, ['Romance'], true, { tags: ['Forbidden Love', 'Fortune', 'Night'] }),
  seed(16, 'Rise of the Divorcee', 'Rebirth', 99, 8.3, ['Revenge'], true, { tags: ['Divorcee', 'Rebirth', 'Success'] }),
  seed(17, "The Butler's Secret", 'Lies & Loyalty', 55, 7.4, ['Urban'], false, { tags: ['Mystery', 'Secrets', 'Mansion'] }),
  seed(18, 'First Love, Forever', 'Timeless', 44, 8.9, ['Romance'], true, { tags: ['First Love', 'Timeless', 'Sweet'] }),
  seed(19, "The Billionaire's Heir", 'Legacy', 82, 7.5, ['Urban'], false, { tags: ['Heir', 'Legacy', 'Rivalry'] }),
  seed(20, 'Payback with Interest', 'Cold Steel', 65, 7.9, ['Revenge'], true, { tags: ['Payback', 'Corporate', 'Cold'] }),
  seed(21, 'Honeymoon Betrayal', 'Crumbled Vows', 49, 7.2, ['Revenge', 'Urban'], false, { tags: ['Betrayal', 'Wedding', 'Truth'] }),
  seed(22, 'Campus Sweetheart', 'First Crush', 38, 8.6, ['Romance'], false, { tags: ['Campus', 'First Crush', 'Youth'] }),
  seed(23, "The Dragon's Bride", 'Mafia Love', 87, 8.1, ['Urban', 'Romance'], true, { tags: ['Mafia', 'Forbidden Love', 'Protective'] }),
  seed(24, 'Silent Vengeance', 'No Mercy', 77, 8.0, ['Revenge'], true, { tags: ['Silent', 'Vengeance', 'Slow Burn'] }),
  seed(25, 'After the Divorce, I Shine', 'New Dawn', 95, 8.4, ['Revenge'], false, { tags: ['Divorce', 'Glow Up', 'Self Love'] }),
  seed(26, "The Lawyer's Wife", 'Court & Heart', 66, 7.6, ['Urban'], false, { tags: ['Lawyer', 'Courtroom', 'Love'] }),
  seed(27, 'Moonlit Promises', 'Nightfall', 41, 8.7, ['Romance'], true, { tags: ['Moonlight', 'Promises', 'Fairytale'] }),
  seed(28, 'The Golden Handcuffs', 'Arranged Fate', 74, 7.3, ['Urban', 'Romance'], false, { tags: ['Arranged', 'Golden Cage', 'Fate'] }),
  seed(29, 'Twilight Vendetta', 'Dark Retribution', 83, 8.2, ['Revenge'], true, { tags: ['Vendetta', 'Twilight', 'Dark'] }),
  seed(30, 'Love Under the Neon', 'City Nights', 57, 7.8, ['Urban'], false, { tags: ['City', 'Neon', 'Night'] }),
];

export const trending = dramas.filter((d) => d.rating >= 8.0);
export const newReleases = dramas.slice(0, 12);
export const ongoing = dramas.filter((d) => d.status === 'Ongoing');
export const completed = dramas.filter((d) => d.status === 'Completed');

export const hotSearches = ['Mafia', 'Slow Burn', 'Heir', 'Office', 'Moonlight', 'First Love', 'Family Feud', 'Vendetta'];

// Deterministic daily picks: rotate through the catalogue by day-of-year.
export function dailyPicks() {
  const now = new Date();
  const start = Date.UTC(now.getFullYear(), 0, 0);
  const day = Math.floor((now - start) / 86400000);
  return [0, 3, 6, 9, 12].map((i) => dramas[(day + i) % dramas.length]);
}

// Similar dramas: same category first, then top rated.
export function similarTo(drama, limit = 6) {
  const others = dramas.filter((d) => d.id !== drama.id);
  const sameCat = others.filter((d) => d.category.some((c) => drama.category.includes(c)));
  const rest = others.filter((d) => !sameCat.includes(d));
  return [...sameCat.sort((a, b) => b.rating - a.rating), ...rest.sort((a, b) => b.rating - a.rating)].slice(0, limit);
}

// Generated episode titles so every episode feels real.
const EP_TITLE_WORDS = ['Secrets', 'Betrayal', 'The Truth', 'A New Beginning', 'Broken Vows', 'The Deal', 'First Kiss', 'The Letter', 'After Midnight', 'No Turning Back', 'The Heir', 'Reunion', 'Hidden Past', 'The Storm', 'Second Chances', 'Silence', 'The Promise', 'Showdown', 'Tears', 'The Confession'];

export function episodeTitle(drama, ep) {
  const n = Number(String(drama.id).replace(/-r$/, '')) || 0;
  return `${drama.subtitle} · ${EP_TITLE_WORDS[(n + ep) % EP_TITLE_WORDS.length]}`;
}

export function byCategory(cat) {
  if (!cat || cat === 'For You' || cat === 'More') return dramas;
  return dramas.filter((d) => d.category.includes(cat));
}

export function searchDramas(keyword) {
  const q = (keyword || '').trim().toLowerCase();
  if (!q) return dramas;
  return dramas.filter(
    (d) =>
      d.title.toLowerCase().includes(q) ||
      (d.subtitle || '').toLowerCase().includes(q) ||
      (d.tags || []).some((t) => t.toLowerCase().includes(q))
  );
}

export function moreOf(data) {
  return [...data, ...data.slice(0, 6).map((d) => ({ ...d, id: `${d.id}-r` }))];
}