const BASE = 'https://fanqienovel.com';
const COMMON_PARAMS = { aid: '2503', app_name: 'muye_novel' };

function buildUrl(path, params = {}) {
  const p = { ...COMMON_PARAMS, ...params };
  const qs = Object.entries(p).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
  return `${BASE}${path}?${qs}`;
}

function headers(cookie, csrf) {
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Origin': BASE,
    'Referer': `${BASE}/main/writer/`,
    'X-Secsdk-Csrf-Token': csrf,
    'Cookie': cookie,
  };
}

async function get(path, params, cookie, csrf) {
  const url = buildUrl(path, params);
  const res = await fetch(url, { method: 'GET', headers: headers(cookie, csrf) });
  const json = await res.json();
  if (json.code !== 0) throw new Error(`API错误 [${json.code}]: ${json.message || '未知错误'}`);
  return json.data || {};
}

async function post(path, data, cookie, csrf) {
  const p = { ...COMMON_PARAMS, ...Object.fromEntries(Object.entries(data || {}).map(([k, v]) => [k, String(v)])) };
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      ...headers(cookie, csrf),
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: new URLSearchParams(p).toString(),
  });
  const json = await res.json();
  if (json.code !== 0) throw new Error(`API错误 [${json.code}]: ${json.message || '未知错误'}`);
  return json.data || {};
}

// ── 公开 API ──

export async function listBooks(cookie, csrf) {
  const data = await get('/api/author/book/book_list/v1', {}, cookie, csrf);
  return data.data || data.book_list || [];
}

export async function listVolumes(bookId, cookie, csrf) {
  const data = await get('/api/author/volume/volume_list/v1', { book_id: bookId }, cookie, csrf);
  return data.data || data.volume_list || [];
}

export async function listChapters(bookId, volumeId, cookie, csrf) {
  const data = await get('/api/author/article/list_article/v0', { book_id: bookId, volume_id: volumeId }, cookie, csrf);
  return data.item_list || data.data || [];
}

export async function getChapterContent(bookId, itemId, cookie, csrf) {
  const data = await get('/api/author/article/get_latest_article/v0', { book_id: bookId, item_id: itemId }, cookie, csrf);
  return data;
}

export async function createChapter(bookId, volumeId, title, content, cookie, csrf) {
  const data = await post('/api/author/article/new_article/v0', { book_id: bookId, volume_id: volumeId, title, content }, cookie, csrf);
  return data.item_id || (data.column_data && data.column_data.item_id);
}

export async function updateChapter(bookId, itemId, title, content, cookie, csrf) {
  const data = await post('/api/author/article/cover_article/v0', { book_id: bookId, item_id: itemId, title, content }, cookie, csrf);
  return data.latest_version != null;
}

export async function deleteChapter(bookId, itemId, cookie, csrf) {
  const data = await post('/api/author/delete_article/v0', { book_id: bookId, item_id: itemId }, cookie, csrf);
  return true;
}

export async function publishChapter(bookId, itemId, cookie, csrf) {
  const data = await post('/api/author/publish_article/v0', { book_id: bookId, item_id: itemId }, cookie, csrf);
  return true;
}
