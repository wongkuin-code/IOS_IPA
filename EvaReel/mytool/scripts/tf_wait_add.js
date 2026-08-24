const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const easJson = JSON.parse(fs.readFileSync(path.join(root, 'eas.json'), 'utf8'));
const submit = easJson.submit?.production?.ios;
if (!submit || !submit.ascAppId) {
  console.error('eas.json 缺少 submit.production.ios.ascAppId');
  process.exit(1);
}

const keyId = submit.ascApiKeyId || process.argv[2];
const issuerId = submit.ascApiKeyIssuerId;
const keyPath = submit.ascApiKeyPath
  ? path.resolve(root, submit.ascApiKeyPath)
  : path.join(root, '..', 'keys', `AuthKey_${keyId}.p8`);
const betaGroupId = process.argv[2] || '12a65f74-9141-4b96-b57a-c2182f69405d';
const appId = submit.ascAppId;

const privateKey = fs.readFileSync(keyPath, 'utf8');
const now = Math.floor(Date.now() / 1000);

function d2r(sig) {
  let o = 0;
  const r = (n) => { const b = sig.subarray(o, o + n); o += n; return b; };
  const ri = () => {
    const s = r(2)[1];
    const l = s & 0x80 ? r(s & 0x7f).reduce((a, b) => (a << 8) | b, 0) : s;
    let d = r(l);
    while (d[0] === 0 && d.length > 32) d = d.subarray(1);
    const b = Buffer.alloc(32);
    d.copy(b, 32 - d.length);
    return b;
  };
  r(2);
  return Buffer.concat([ri(), ri()]);
}

const h = Buffer.from(JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' })).toString('base64url');
const p = Buffer.from(JSON.stringify({ iss: issuerId, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' })).toString('base64url');
const t = `${h}.${p}.${d2r(crypto.sign('sha256', Buffer.from(`${h}.${p}`), privateKey)).toString('base64url')}`;

const api = async (url, opts = {}) => {
  const res = await fetch(url, { ...opts, headers: { Authorization: `Bearer ${t}`, ...(opts.headers || {}) } });
  const data = await res.json();
  if (!res.ok) {
    console.error(`ASC API ${res.status}:`, JSON.stringify(data));
    process.exit(1);
  }
  return data;
};

async function latestBuild() {
  const d = await api(`https://api.appstoreconnect.apple.com/v1/builds?filter[app]=${appId}&sort=-uploadedDate&limit=1`);
  const b = d.data?.[0];
  if (!b) { console.error('未找到任何构建'); process.exit(1); }
  console.log('最新构建:', b.id, 'version=' + b.attributes.version, 'state=' + b.attributes.processingState);
  return b;
}

async function addToGroup(buildId) {
  const res = await fetch(`https://api.appstoreconnect.apple.com/v1/builds/${buildId}/relationships/betaGroups`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [{ type: 'betaGroups', id: betaGroupId }] }),
  });
  console.log('加入 TestFlight 组:', res.status);
  if (!res.ok) process.exit(1);
}

(async () => {
  const build = await latestBuild();
  if (build.attributes.processingState !== 'PROCESSING') {
    if (build.attributes.processingState === 'VALID') { await addToGroup(build.id); }
    else { console.log('最终状态:', build.attributes.processingState); process.exit(1); }
    return;
  }
  const deadline = Date.now() + 45 * 60 * 1000;
  let state = 'PROCESSING';
  while (Date.now() < deadline && state === 'PROCESSING') {
    await new Promise(r => setTimeout(r, 30000));
    try {
      const d = await api(`https://api.appstoreconnect.apple.com/v1/builds/${build.id}`);
      state = d.data.attributes.processingState;
    } catch { state = 'PROCESSING'; }
    console.log(new Date().toISOString(), 'state=' + state);
  }
  if (state === 'VALID') await addToGroup(build.id);
  else { console.log('最终状态:', state); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });