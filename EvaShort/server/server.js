// ── EvaShort server: IAP verification + user accounts (register/login/guest) ──
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { SignedDataVerifier, Environment, Type } = require('@apple/app-store-server-library');

const PORT = process.env.PORT || 3000;
const BUNDLE_ID = process.env.BUNDLE_ID || 'com.mycompany.EvaShort';
const ALLOWED_PRODUCT_IDS = new Set(
  (process.env.ALLOWED_PRODUCT_IDS || '2.99').split(',').map((s) => s.trim()).filter(Boolean)
);
// 'AUTO'（默认）：按交易自身声明的 environment 选 verifier，并互相兜底。
// 需要固定单环境时可用 APP_ENV=SANDBOX / APP_ENV=PRODUCTION 覆盖。
const APP_ENV = process.env.APP_ENV || 'AUTO';
const APPLE_APP_ID = process.env.APPLE_APP_ID || '6802204407';
const STORE_FILE = process.env.STORE_FILE || path.join(__dirname, 'store.json');
const USERS_FILE = process.env.USERS_FILE || path.join(__dirname, 'users.json');
const GUEST_DAILY_LIMIT = Number(process.env.GUEST_DAILY_LIMIT || 3);

const ROOT_CAS = [
  'AppleRootCA-G3.cer',
  'AppleRootCA-G2.cer',
]
  .map((f) => path.join(__dirname, 'certs', f))
  .filter(fs.existsSync)
  .map((f) => fs.readFileSync(f));

if (!ROOT_CAS.length) {
  console.error('缺少 Apple 根证书: server/certs/ 下需要 AppleRootCA-G3.cer');
  process.exit(1);
}

// 沙盒/审核交易签 environment=Sandbox，真实用户交易签 environment=Production，
// 而 SignedDataVerifier 会在 `decodedJWT.environment !== this.environment` 时直接抛错
// （库内 jws_verification.js:78）。固定单一环境会导致：审核期能过、上线后真实用户
// 验签失败永远解锁不了（或反之）。故两个环境各建一个 verifier，按声明选路并兜底。
const verifiers = {
  [Environment.SANDBOX]: new SignedDataVerifier(ROOT_CAS, true, Environment.SANDBOX, BUNDLE_ID),
};
if (APPLE_APP_ID) {
  verifiers[Environment.PRODUCTION] = new SignedDataVerifier(
    ROOT_CAS,
    true,
    Environment.PRODUCTION,
    BUNDLE_ID,
    Number(APPLE_APP_ID)
  );
}

// 仅读取 JWS 里（未验签的）environment 声明用于排序，签名随后仍会严格校验。
function environmentOfJws(jws) {
  try {
    const segment = String(jws).split('.')[1];
    return JSON.parse(Buffer.from(segment, 'base64').toString('utf8')).environment;
  } catch (e) {
    return null;
  }
}

async function verifyTransaction(jws) {
  const claimed = environmentOfJws(jws);
  let order;
  if (APP_ENV === 'SANDBOX') {
    order = [Environment.SANDBOX, Environment.PRODUCTION];
  } else if (APP_ENV === 'PRODUCTION') {
    order = [Environment.PRODUCTION, Environment.SANDBOX];
  } else {
    order = claimed === Environment.PRODUCTION
      ? [Environment.PRODUCTION, Environment.SANDBOX]
      : [Environment.SANDBOX, Environment.PRODUCTION];
  }
  let lastError;
  for (const env of order) {
    const v = verifiers[env];
    if (!v) continue;
    try {
      return { payload: await v.verifyAndDecodeTransaction(jws), environment: env };
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error('no verifier available for this environment');
}

const store = {
  transactionIds: new Set(),
  load() {
    try {
      const j = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
      this.transactionIds = new Set(j.transactionIds || []);
    } catch (e) {
      this.transactionIds = new Set();
    }
  },
  save() {
    fs.writeFileSync(STORE_FILE, JSON.stringify({ transactionIds: [...this.transactionIds] }));
  },
  has(id) {
    return id && this.transactionIds.has(id);
  },
  add(id) {
    if (!id) return;
    this.transactionIds.add(id);
    this.save();
  },
};
store.load();

// ── User store: users.json, scrypt-hashed passwords, bearer tokens ──
function loadUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}
function saveUsers() {
  const tmp = USERS_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(users));
  fs.renameSync(tmp, USERS_FILE);
}
let users = loadUsers();
let idCounter = Object.keys(users).reduce((m, id) => Math.max(m, Number(id) || 0), 0);

function hashPassword(password, salt) {
  return crypto.scryptSync(String(password), salt, 32).toString('hex');
}

function newUserId() {
  idCounter += 1;
  return String(idCounter);
}

function publicUser(u) {
  return {
    id: u.id,
    nickname: u.nickname,
    account: u.account || null,
    email: u.email || null,
    avatar: u.avatar || '👤',
    isGuest: Boolean(u.isGuest),
    createdAt: u.createdAt,
    saved: u.saved || [],
    history: (u.history || []).slice(0, 50),
  };
}

function findUserByToken(token) {
  if (!token) return null;
  for (const u of Object.values(users)) {
    if (u.tokens && u.tokens.includes(token)) return u;
  }
  return null;
}

function issueToken(user) {
  const token = crypto.randomBytes(24).toString('hex');
  user.tokens = user.tokens || [];
  user.tokens.push(token);
  if (user.tokens.length > 5) user.tokens = user.tokens.slice(-5);
  saveUsers();
  return token;
}

function makeGuest() {
  const id = newUserId();
  const nickname = `Guest_${String(Math.floor(1000 + Math.random() * 9000))}`;
  const user = {
    id,
    nickname,
    email: null,
    avatar: '🎭',
    isGuest: true,
    createdAt: new Date().toISOString(),
    saved: [],
    history: [],
    tokens: [],
    guestQuota: { date: guestDateKey(), used: 0 },
  };
  users[id] = user;
  return user;
}

function guestDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function makeAccount(account, password, opts = {}) {
  const id = newUserId();
  const salt = crypto.randomBytes(12).toString('hex');
  const acc = String(account).trim().toLowerCase();
  const user = {
    id,
    nickname: String(account).trim().slice(0, 20),
    account: acc,
    email: null,
    avatar: opts.avatar || '👤',
    isGuest: false,
    salt,
    passwordHash: hashPassword(password, salt),
    createdAt: new Date().toISOString(),
    saved: opts.saved || [],
    history: opts.history || [],
    tokens: [],
  };
  users[id] = user;
  return user;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ACCOUNT_RE = /^[A-Za-z0-9_\u4e00-\u9fa5]{2,20}$/;
const NICK_RE = /^[A-Za-z0-9_\u4e00-\u9fa5 ]{2,20}$/;

function validateCreds(account, password) {
  if (!account || !ACCOUNT_RE.test(String(account).trim())) {
    return 'Account must be 2-20 letters, numbers, underscores or Chinese characters';
  }
  if (!password || String(password).length < 6) return 'Password must be at least 6 characters';
  return null;
}

// ── Express app ──
const app = express();
app.use(express.json({ limit: '100kb' }));

// CORS: allow the web build to call the API from any origin (token in header, no cookies)
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Simple in-memory rate limit for auth endpoints (per IP)
const rateHits = new Map();
function rateLimit(req, res, next) {
  const key = (req.ip || 'x') + ':' + (req.path || '');
  const now = Date.now();
  const arr = (rateHits.get(key) || []).filter((t) => now - t < 60000);
  if (arr.length >= 20) {
    return res.status(429).json({ ok: false, error: 'TOO_MANY_REQUESTS' });
  }
  arr.push(now);
  rateHits.set(key, arr);
  next();
}

// Cover images for the app (poster-01..30.jpg), long-cached.
const COVERS_DIR = path.join(__dirname, 'covers');
if (!fs.existsSync(COVERS_DIR)) {
  fs.mkdirSync(COVERS_DIR, { recursive: true });
}
app.use('/covers', express.static(COVERS_DIR, { maxAge: '30d', immutable: true }));

// ── Videos: real, owned short-drama content ──
// Videos are served from VIDEOS_DIR; videoUrl in the JSON is a same-origin
// relative path (e.g. /videos/1.mp4). For production, point VIDEOS_DIR at a
// CDN-backed directory or swap videoUrl to absolute CDN URLs.
const VIDEOS_FILE = process.env.VIDEOS_FILE || path.join(__dirname, 'videos.json');
// Default: videos live alongside the server under ./videos so a plain deploy
// (rsync of this folder) is self-contained. Override with VIDEOS_DIR in prod
// if you prefer a CDN-backed or separate volume.
const VIDEOS_DIR = process.env.VIDEOS_DIR || path.join(__dirname, 'videos');
function loadVideos() {
  try {
    const j = JSON.parse(fs.readFileSync(VIDEOS_FILE, 'utf8'));
    return j.videos || [];
  } catch (e) {
    console.error('[videos] 读取失败:', VIDEOS_FILE, e && e.message);
    return [];
  }
}
let VIDEOS = loadVideos();
if (!fs.existsSync(VIDEOS_DIR)) {
  console.warn('[videos] 视频目录不存在:', VIDEOS_DIR);
}
app.use('/videos', express.static(VIDEOS_DIR, { maxAge: '1h', acceptRanges: true }));

// List view: summary only (no per-episode videoUrl), supports category + pagination.
app.get('/api/videos', (req, res) => {
  const { category, page = '1', limit = '50', q } = req.query;
  let list = VIDEOS;
  if (q) {
    const k = String(q).toLowerCase();
    list = list.filter(
      (v) =>
        v.title.toLowerCase().includes(k) ||
        (v.subtitle || '').toLowerCase().includes(k) ||
        (v.tags || []).some((t) => t.toLowerCase().includes(k))
    );
  } else if (category && category !== 'For You' && category !== 'More') {
    list = list.filter((v) => (v.category || []).includes(category));
  }
  const total = list.length;
  const p = Math.max(1, parseInt(page, 10) || 1);
  const lim = Math.min(200, parseInt(limit, 10) || 50);
  const items = list.slice((p - 1) * lim, p * lim).map(toVideoSummary);
  res.json({ ok: true, total, page: p, limit: lim, items });
});

// Detail: full object including episodes[] with videoUrl.
app.get('/api/videos/:id', (req, res) => {
  const id = Number(req.params.id);
  const v = VIDEOS.find((x) => x.id === id);
  if (!v) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  res.json({ ok: true, video: v });
});

// Search (alias of list filtered by q).
app.get('/api/search', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ ok: true, items: [] });
  const k = q.toLowerCase();
  const items = VIDEOS.filter(
    (v) =>
      v.title.toLowerCase().includes(k) ||
      (v.subtitle || '').toLowerCase().includes(k) ||
      (v.tags || []).some((t) => t.toLowerCase().includes(k))
  ).map(toVideoSummary);
  res.json({ ok: true, items });
});

function toVideoSummary(v) {
  const { episodes, ...rest } = v;
  const first =
    Array.isArray(v.episodes) && v.episodes.length
      ? v.episodes[0].videoUrl || v.videoUrl
      : v.videoUrl;
  return { ...rest, episodeCount: (episodes || []).length, videoUrl: first || null };
}

app.get('/health', (req, res) => {
  res.json({ ok: true, app: 'evashort-api', env: APP_ENV, verifiers: Object.keys(verifiers), users: Object.keys(users).length });
});

// ── Auth ──
app.post('/api/auth/register', rateLimit, (req, res) => {
  const { account, password } = req.body || {};
  const err = validateCreds(account, password);
  if (err) return res.status(400).json({ ok: false, error: 'INVALID_INPUT', message: err });
  const acc = String(account).trim().toLowerCase();
  const exists = Object.values(users).some((u) => u.account === acc);
  if (exists) return res.status(409).json({ ok: false, error: 'ACCOUNT_TAKEN', message: 'This account is already registered — try logging in' });
  const user = makeAccount(account, password);
  const token = issueToken(user);
  res.json({ ok: true, token, user: publicUser(user) });
});

app.post('/api/auth/login', rateLimit, (req, res) => {
  const { account, password } = req.body || {};
  if (!account || !password) return res.status(400).json({ ok: false, error: 'INVALID_INPUT', message: 'Account and password are required' });
  const acc = String(account).trim().toLowerCase();
  const user = Object.values(users).find((u) => u.account === acc || (u.email && u.email === acc));
  if (!user || user.isGuest) {
    return res.status(401).json({ ok: false, error: 'BAD_CREDENTIALS', message: 'Account or password is incorrect' });
  }
  const hash = hashPassword(password, user.salt);
  if (hash !== user.passwordHash) {
    return res.status(401).json({ ok: false, error: 'BAD_CREDENTIALS', message: 'Account or password is incorrect' });
  }
  const token = issueToken(user);
  res.json({ ok: true, token, user: publicUser(user) });
});

// Guest login: one guest account per device (client stores the token).
app.post('/api/auth/guest', rateLimit, (req, res) => {
  const guest = makeGuest();
  const token = issueToken(guest);
  res.json({ ok: true, token, user: publicUser(guest) });
});

// Upgrade a guest account to a real account, keeping saved/history.
app.post('/api/auth/upgrade', rateLimit, (req, res) => {
  const auth = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const guest = findUserByToken(auth);
  if (!guest || !guest.isGuest) return res.status(401).json({ ok: false, error: 'UNAUTHORIZED', message: 'Guest session required' });
  const { account, password } = req.body || {};
  const err = validateCreds(account, password);
  if (err) return res.status(400).json({ ok: false, error: 'INVALID_INPUT', message: err });
  const acc = String(account).trim().toLowerCase();
  const exists = Object.values(users).some((u) => u.account === acc);
  if (exists) return res.status(409).json({ ok: false, error: 'ACCOUNT_TAKEN', message: 'This account is already registered — try logging in' });
  guest.isGuest = false;
  guest.account = acc;
  guest.email = null;
  guest.nickname = String(account).trim().slice(0, 20);
  guest.avatar = '👤';
  guest.salt = crypto.randomBytes(12).toString('hex');
  guest.passwordHash = hashPassword(password, guest.salt);
  guest.createdAt = guest.createdAt || new Date().toISOString();
  delete guest.guestQuota;
  saveUsers();
  res.json({ ok: true, token: auth, user: publicUser(guest) });
});

function authUser(req, res) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const user = findUserByToken(token);
  if (!user) {
    res.status(401).json({ ok: false, error: 'UNAUTHORIZED', message: 'Please log in again' });
    return null;
  }
  return user;
}

app.get('/api/auth/me', (req, res) => {
  const user = authUser(req, res);
  if (!user) return;
  res.json({ ok: true, user: publicUser(user) });
});

app.put('/api/user/profile', (req, res) => {
  const user = authUser(req, res);
  if (!user) return;
  const { nickname, avatar } = req.body || {};
  if (nickname !== undefined) {
    if (!NICK_RE.test(String(nickname).trim())) {
      return res.status(400).json({ ok: false, error: 'INVALID_INPUT', message: 'Nickname must be 2-20 letters, numbers, spaces or Chinese characters' });
    }
    user.nickname = String(nickname).trim().slice(0, 20);
  }
  if (avatar !== undefined) {
    user.avatar = String(avatar).trim().slice(0, 4) || '👤';
  }
  saveUsers();
  res.json({ ok: true, user: publicUser(user) });
});

app.get('/api/user/saved', (req, res) => {
  const user = authUser(req, res);
  if (!user) return;
  res.json({ ok: true, ids: user.saved || [] });
});

app.put('/api/user/saved', (req, res) => {
  const user = authUser(req, res);
  if (!user) return;
  const { ids } = req.body || {};
  if (!Array.isArray(ids)) return res.status(400).json({ ok: false, error: 'INVALID_INPUT' });
  const norm = ids.map((x) => Number(x)).filter((x) => Number.isInteger(x) && x > 0);
  user.saved = [...new Set(norm)].slice(0, 200);
  saveUsers();
  res.json({ ok: true, ids: user.saved });
});

app.get('/api/user/history', (req, res) => {
  const user = authUser(req, res);
  if (!user) return;
  res.json({ ok: true, items: (user.history || []).slice(0, 50) });
});

app.put('/api/user/history', (req, res) => {
  const user = authUser(req, res);
  if (!user) return;
  const { items } = req.body || {};
  if (!Array.isArray(items)) return res.status(400).json({ ok: false, error: 'INVALID_INPUT' });
  user.history = items
    .filter((h) => h && h.id)
    .map((h) => ({ id: Number(h.id), episode: Number(h.episode) || 1, ts: Number(h.ts) || Date.now() }))
    .slice(0, 50);
  saveUsers();
  res.json({ ok: true, items: user.history });
});

// Guest watch quota: guests may preview a limited number of episodes per day.
// Regular accounts have no limit. The client calls this before starting playback.
app.post('/api/user/watch', (req, res) => {
  const user = authUser(req, res);
  if (!user) return;
  const { dramaId, episode } = req.body || {};
  if (!user.isGuest) {
    return res.json({ ok: true, allowed: true, isGuest: false });
  }
  const today = guestDateKey();
  if (!user.guestQuota || user.guestQuota.date !== today) {
    user.guestQuota = { date: today, used: 0 };
  }
  const limit = GUEST_DAILY_LIMIT;
  if (user.guestQuota.used >= limit) {
    return res.json({ ok: true, allowed: false, isGuest: true, used: user.guestQuota.used, limit, dramaId, episode });
  }
  user.guestQuota.used += 1;
  saveUsers();
  res.json({ ok: true, allowed: true, isGuest: true, used: user.guestQuota.used, limit, dramaId, episode });
});

// ── Account deletion: permanent. Requires login + password confirmation. ──
app.delete('/api/auth/account', (req, res) => {
  const user = authUser(req, res);
  if (!user) return;
  if (user.isGuest) {
    return res.status(400).json({ ok: false, error: 'GUEST_ACCOUNT', message: 'Guest accounts have no data to delete' });
  }
  const { password } = req.body || {};
  if (!password) {
    return res.status(400).json({ ok: false, error: 'INVALID_INPUT', message: 'Enter your password to confirm' });
  }
  const hash = hashPassword(String(password), user.salt);
  if (hash !== user.passwordHash) {
    return res.status(401).json({ ok: false, error: 'BAD_CREDENTIALS', message: 'Password is incorrect' });
  }
  delete users[user.id];
  saveUsers();
  console.log(`[auth] account deleted id=${user.id} email=${user.email}`);
  res.json({ ok: true, deleted: true });
});

// ── IAP verification ──
app.post('/api/verify-iap', async (req, res) => {
  const { jws, platform = 'ios' } = req.body || {};
  if (!jws || typeof jws !== 'string') {
    return res.status(400).json({ ok: false, error: 'MISSING_JWS' });
  }
  if (platform !== 'ios') {
    return res.status(400).json({ ok: false, error: 'UNSUPPORTED_PLATFORM' });
  }
  let payload;
  try {
    const verified = await verifyTransaction(jws);
    payload = verified.payload;
  } catch (e) {
    console.warn('[verify-iap] 验签失败:', e && e.message);
    return res.status(400).json({ ok: false, error: 'INVALID_SIGNATURE', detail: e && e.message });
  }
  if (payload.bundleId !== BUNDLE_ID) {
    return res.status(400).json({ ok: false, error: 'BUNDLE_MISMATCH', bundleId: payload.bundleId });
  }
  if (!ALLOWED_PRODUCT_IDS.has(payload.productId)) {
    return res.status(400).json({ ok: false, error: 'PRODUCT_NOT_ALLOWED', productId: payload.productId });
  }
  if (payload.type !== Type.NON_CONSUMABLE) {
    return res.status(400).json({ ok: false, error: 'UNEXPECTED_TYPE', type: payload.type });
  }
  if (store.has(payload.transactionId)) {
    return res.json({ ok: true, alreadyGranted: true, productId: payload.productId, transactionId: payload.transactionId });
  }
  store.add(payload.transactionId);
  console.log(
    `[verify-iap] 验证通过 product=${payload.productId} tx=${payload.transactionId} env=${payload.environment}`
  );
  res.json({ ok: true, productId: payload.productId, transactionId: payload.transactionId, environment: payload.environment });
});

app.listen(PORT, () => {
  console.log(`[evashort-api] listening on :${PORT} env=${APP_ENV} verifiers=${Object.keys(verifiers).join(',')} bundleId=${BUNDLE_ID}`);
  console.log(`[evashort-api] products=${[...ALLOWED_PRODUCT_IDS].join(',')} users=${Object.keys(users).length}`);
});