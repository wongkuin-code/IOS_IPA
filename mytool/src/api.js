// Gutendex API —— 古腾堡计划（Project Gutenberg）免费公共版权书库
// 无需 API Key，书籍均为公共版权（Public Domain），可免费阅读与分发
// 文档: https://gutendex.com  |  数据源: https://www.gutenberg.org

const API_BASE = 'https://gutendex.com';
const TEXT_BASE = 'https://www.gutenberg.org/cache/epub';

async function request(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`请求失败 [${res.status}]`);
  return res.json();
}

function normalizeBook(b) {
  const formats = b.formats || {};
  return {
    id: b.id,
    title: b.title,
    author: (b.authors || []).map(a => a.name).join('、') || '佚名',
    downloads: b.download_count || 0,
    languages: b.languages || [],
    textUrl: toSecure(formats['text/plain; charset=utf-8'] || formats['text/plain'] || ''),
  };
}

function toSecure(url) {
  if (!url) return '';
  let u = url;
  if (u.startsWith('http://')) u = `https://${u.slice(7)}`;
  const m = u.match(/^https:\/\/www\.gutenberg\.org\/ebooks\/(\d+)\.txt\./);
  if (m) u = `https://www.gutenberg.org/cache/epub/${m[1]}/pg${m[1]}.txt`;
  return u;
}

// 获取书单（按热度排序），language: 'zh' | 'en'，search 关键字
export async function fetchBooks({ language = 'zh', search = '', page = 1 } = {}) {
  const params = new URLSearchParams({ languages: language, page: String(page) });
  if (search.trim()) params.set('search', search.trim());
  const data = await request(`/books?${params.toString()}`);
  return {
    books: (data.results || []).map(normalizeBook),
    hasMore: Boolean(data.next),
    count: data.count || 0,
  };
}

// 获取书籍正文（纯文本，自动剥离 Gutenberg 头尾声明）
export async function fetchBookText(book) {
  const url = toSecure(book.textUrl) || `${TEXT_BASE}/${book.id}/pg${book.id}.txt`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`正文获取失败 [${res.status}]`);
  const raw = await res.text();
  return stripBoilerplate(raw);
}

function stripBoilerplate(raw) {
  let s = raw.replace(/\r\n/g, '\n');
  const startMark = '*** START OF THE PROJECT GUTENBERG';
  const endMark = '*** END OF THE PROJECT GUTENBERG';
  if (s.includes(startMark)) {
    s = s.slice(s.indexOf('\n', s.indexOf(startMark)) + 1);
  }
  if (s.includes(endMark)) {
    s = s.slice(0, s.indexOf(endMark));
  }
  return s
    .replace(/\u3000/g, ' ')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

// 按字符数分页（先按码点拆分再拼接，中文安全）
export function paginate(content, pageSize = 1500) {
  const pages = [];
  const chars = [...content];
  for (let i = 0; i < chars.length; i += pageSize) {
    pages.push(chars.slice(i, i + pageSize).join(''));
  }
  return pages;
}
