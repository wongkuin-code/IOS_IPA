const express = require('express');
const fs = require('fs');
const path = require('path');
const { SignedDataVerifier, Environment, Type } = require('@apple/app-store-server-library');

const PORT = process.env.PORT || 3000;
const BUNDLE_ID = process.env.BUNDLE_ID || 'com.mytool.booksreader';
const ALLOWED_PRODUCT_IDS = new Set(
  (process.env.ALLOWED_PRODUCT_IDS || 'vip.unlock.all').split(',').map((s) => s.trim()).filter(Boolean)
);
const APP_ENV = process.env.APP_ENV || 'SANDBOX';
const APPLE_APP_ID = process.env.APPLE_APP_ID || undefined;
const STORE_FILE = process.env.STORE_FILE || path.join(__dirname, 'store.json');

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

const environment = APP_ENV === 'PRODUCTION' ? Environment.PRODUCTION : Environment.SANDBOX;
const verifier = new SignedDataVerifier(ROOT_CAS, true, environment, BUNDLE_ID, APPLE_APP_ID);

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

const app = express();
app.use(express.json({ limit: '100kb' }));

// Cover images for the app (poster-01..30.jpg), long-cached.
const COVERS_DIR = path.join(__dirname, 'covers');
if (!fs.existsSync(COVERS_DIR)) {
  fs.mkdirSync(COVERS_DIR, { recursive: true });
}
app.use('/covers', express.static(COVERS_DIR, { maxAge: '30d', immutable: true }));

app.get('/health', (req, res) => {
  res.json({ ok: true, app: 'evareel-iap-verify', env: environment });
});

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
    payload = await verifier.verifyAndDecodeTransaction(jws);
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
  console.log(`[verify-iap] listening on :${PORT} env=${environment} bundleId=${BUNDLE_ID}`);
  console.log(`[verify-iap] products=${[...ALLOWED_PRODUCT_IDS].join(',')} rootCAs=${ROOT_CAS.length}`);
});
