const fs = require('fs');
const crypto = require('crypto');
const keyId = 'YS9XQVB4SS';
const issuerId = 'ac9f4281-658a-4b96-8a40-cebf371c26de';
const privateKey = fs.readFileSync('../keys/AuthKey_' + keyId + '.p8');
const now = Math.floor(Date.now() / 1000);
function d2r(sig) { let o = 0; const r = (n) => { const b = sig.subarray(o, o + n); o += n; return b; };
  const ri = () => { const s = r(2)[1]; const l = s & 0x80 ? r(s & 0x7f).reduce((a, b) => (a << 8) | b, 0) : s; let d = r(l); while (d[0] === 0 && d.length > 32) d = d.subarray(1); const b = Buffer.alloc(32); d.copy(b, 32 - d.length); return b; };
  r(2); return Buffer.concat([ri(), ri()]); }
const h = Buffer.from(JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' })).toString('base64url');
const p = Buffer.from(JSON.stringify({ iss: issuerId, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' })).toString('base64url');
const t = h + '.' + p + '.' + d2r(crypto.sign('sha256', Buffer.from(h + '.' + p), privateKey)).toString('base64url');

async function getState() {
  const res = await fetch('https://api.appstoreconnect.apple.com/v1/builds/76c9cd50-1b49-4764-a8bf-b1d513034b4f', { headers: { Authorization: 'Bearer ' + t } });
  const d = await res.json();
  return d.data.attributes.processingState;
}

async function addToGroup() {
  const res = await fetch('https://api.appstoreconnect.apple.com/v1/builds/76c9cd50-1b49-4764-a8bf-b1d513034b4f/relationships/betaGroups', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [{ type: 'betaGroups', id: '12a65f74-9141-4b96-b57a-c2182f69405d' }] }),
  });
  console.log('add to TestFlight group:', res.status, await res.text());
}

(async () => {
  const deadline = Date.now() + 45 * 60 * 1000;
  let state = 'PROCESSING';
  while (Date.now() < deadline && state === 'PROCESSING') {
    try { state = await getState(); } catch (e) { state = 'PROCESSING'; }
    console.log(new Date().toISOString(), 'state=' + state);
    if (state !== 'PROCESSING') break;
    await new Promise(r => setTimeout(r, 30000));
  }
  if (state === 'VALID') { await addToGroup(); } else { console.log('final state:', state); }
})().catch(e => { console.error(e); process.exit(1); });
