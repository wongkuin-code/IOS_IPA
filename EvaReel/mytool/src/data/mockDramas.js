// ── Healing/relaxation video catalogue ──
// Every entry below has a real, hosted, playable video (id 1–9 map 1:1 to the
// server's /evareel/videos/<id>/<id>.mp4). The cover of each available video is
// its OWN first frame (poster.jpg), extracted on the server during transcode —
// so the library shows real stills, not gradient placeholders.

export const categories = ['For You', 'Nature', 'Relax', 'Sleep', 'More'];

const POSTER_BASE = 'https://api.haoweimedia.cn/evareel/videos';

const seed = (id, title, subtitle, episodes, rating, category, premium, available) => ({
  id,
  title,
  subtitle,
  episodes,
  rating,
  category,
  premium: Boolean(premium),
  // `available` = a real, hosted video exists and is ready to play.
  available: Boolean(available),
  // Real cover = the video's own first frame (poster.jpg), extracted on the
  // server at transcode time. On load error CoverImage falls back to gradient
  // art, so a cover can never end up blank.
  asset: available ? { uri: `${POSTER_BASE}/${id}/poster.jpg` } : null,
});

export const dramas = [
  seed(1, 'Enjoy Nature', 'Healing in Nature', 1, 8.6, ['Nature', 'ForYou'], true, true),
  seed(2, 'Misty Morning Valley', 'Fresh & Clear', 1, 8.2, ['Nature', 'ForYou'], false, true),
  seed(3, 'Seaside Stroll', 'Relax & Unwind', 1, 8.5, ['Relax', 'ForYou'], false, true),
  seed(4, 'Forest Path', 'Into the Woods', 1, 8.8, ['Nature', 'ForYou'], false, true),
  seed(5, 'Starry Night Whispers', 'Sleep Aid', 1, 7.9, ['Sleep', 'ForYou'], false, true),
  seed(6, 'Tea After Rain', 'Soothing Calm', 1, 8.0, ['Relax', 'ForYou'], false, true),
  seed(7, 'Breezy Meadow', 'Stretch & Breathe', 1, 8.2, ['Nature', 'ForYou'], false, true),
  seed(8, 'Silent Snow Peak', 'Meditation', 1, 8.4, ['Sleep', 'ForYou'], false, true),
  seed(9, 'Four Seasons Bloom', 'Warmth', 1, 8.1, ['Relax', 'ForYou'], false, true),
  seed(10, 'Stream Murmurs', 'Nature Sounds', 1, 8.3, ['Nature', 'ForYou']),
  seed(11, 'Warm Afternoon Sun', 'Lazy & Slow', 1, 8.0, ['Relax', 'ForYou']),
  seed(12, 'Above the Clouds', 'Vast & Open', 1, 8.4, ['Nature', 'ForYou']),
  seed(13, 'Moonlit Beach', 'For Sleep', 1, 8.7, ['Sleep', 'ForYou']),
  seed(14, 'Deep in the Bamboo', 'Quiet Mind', 1, 8.2, ['Relax', 'ForYou']),
  seed(15, 'Autumn Maples', 'Gentle Ease', 1, 8.3, ['Nature', 'ForYou']),
  seed(16, 'Lake Reflections', 'Stillness', 1, 8.1, ['Relax', 'ForYou']),
  seed(17, 'Pastoral Song', 'Healing Days', 1, 8.5, ['Nature', 'ForYou']),
  seed(18, 'First Light', 'Hope', 1, 8.9, ['Relax', 'ForYou']),
  seed(19, 'Azure Coast', 'Freedom', 1, 8.4, ['Nature', 'ForYou']),
  seed(20, 'Pine Forest Breath', 'Relax', 1, 8.2, ['Sleep', 'ForYou']),
  seed(21, 'Firefly Night', 'Tender', 1, 8.0, ['Relax', 'ForYou']),
  seed(22, 'Valley Echoes', 'Ethereal', 1, 8.6, ['Nature', 'ForYou']),
  seed(23, 'Flower Sea Walk', 'Romantic Nature', 1, 8.5, ['Nature', 'ForYou']),
  seed(24, 'Lone Journey in Snow', 'Serene', 1, 8.3, ['Sleep', 'ForYou']),
  seed(25, 'Rainbow After Rain', 'Healing', 1, 8.4, ['Relax', 'ForYou']),
  seed(26, 'Coastal Dusk', 'Warmth', 1, 8.2, ['Nature', 'ForYou']),
  seed(27, 'Sunrise Sea of Clouds', 'Majestic', 1, 8.7, ['Nature', 'ForYou']),
  seed(28, 'Listening to Wind by the Stream', 'Peace', 1, 8.3, ['Sleep', 'ForYou']),
  seed(29, 'Starry Camp', 'Camping Calm', 1, 8.6, ['Relax', 'ForYou']),
  seed(30, 'Warm Lights on the Way Home', 'Home Warmth', 1, 8.8, ['Nature', 'ForYou']),
];

export const trending = dramas.filter((d) => d.rating >= 8.0);
export const newReleases = dramas.slice(0, 12);

export const hotSearches = ['Relax', 'Sleep', 'Nature', 'Meditation', 'Healing', 'Scenery'];

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
