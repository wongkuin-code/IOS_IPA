const express = require('express');
const fs = require('fs');
const path = require('path');
const { SignedDataVerifier, Environment, Type } = require('@apple/app-store-server-library');

const PORT = process.env.PORT || 3000;
const BUNDLE_ID = process.env.BUNDLE_ID || 'com.mytool.booksreader';
const ALLOWED_PRODUCT_IDS = new Set(
  (process.env.ALLOWED_PRODUCT_IDS || 'vip.unlock.video').split(',').map((s) => s.trim()).filter(Boolean)
);
// 'AUTO' (default): pick the verifier from the transaction's own environment
// claim, then fall back to the other one. Force a single environment with
// APP_ENV=SANDBOX / APP_ENV=PRODUCTION when needed.
const APP_ENV = process.env.APP_ENV || 'AUTO';
const APPLE_APP_ID = process.env.APPLE_APP_ID || '6799368982';
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

// StoreKit signs review/sandbox transactions with environment=Sandbox and real
// user transactions with environment=Production, and SignedDataVerifier rejects
// a transaction whose environment differs from its own. Keep one verifier per
// environment and choose by the transaction's own claim, falling back to the
// other one, so both sandbox review and live purchases verify.
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

// Read the (unverified) environment claim from the JWS header payload. This is
// only used to order the verifiers; the signature is verified afterwards.
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

const app = express();
app.use(express.json({ limit: '100kb' }));

// Cover images for the app (poster-01..30.jpg), long-cached.
const COVERS_DIR = path.join(__dirname, 'covers');
if (!fs.existsSync(COVERS_DIR)) {
  fs.mkdirSync(COVERS_DIR, { recursive: true });
}
app.use('/covers', express.static(COVERS_DIR, { maxAge: '30d', immutable: true }));

app.get('/health', (req, res) => {
  res.json({ ok: true, app: 'evareel-iap-verify', env: APP_ENV, verifiers: Object.keys(verifiers) });
});

// Hosted privacy policy (Guideline 5.1.1: must be reachable over https and
// from an in-app link). The file lives next to server.js on the host.
app.get('/evareel/privacy-policy.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'privacy-policy.html'));
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
  let txEnvironment;
  try {
    const verified = await verifyTransaction(jws);
    payload = verified.payload;
    txEnvironment = verified.environment;
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
  console.log(`[verify-iap] listening on :${PORT} env=${APP_ENV} verifiers=${Object.keys(verifiers).join(',')} bundleId=${BUNDLE_ID}`);
  console.log(`[verify-iap] products=${[...ALLOWED_PRODUCT_IDS].join(',')} rootCAs=${ROOT_CAS.length}`);
});
