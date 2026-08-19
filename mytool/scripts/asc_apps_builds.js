const fs = require('fs');
const crypto = require('crypto');

const keyId = process.argv[2] || 'YS9XQVB4SS';
const issuerId = process.argv[3] || 'ac9f4281-658a-4b96-8a40-cebf371c26de';
const keyPath = `../keys/AuthKey_${keyId}.p8`;

const privateKey = fs.readFileSync(keyPath, 'utf8');
const now = Math.floor(Date.now() / 1000);

function derToRawJose(signatureDer) {
  let offset = 0;
  const read = (n) => { const b = signatureDer.subarray(offset, offset + n); offset += n; return b; };
  const readInt = () => {
    const seq = read(2)[1];
    const len = seq & 0x80 ? read(seq & 0x7f).reduce((a, b) => (a << 8) | b, 0) : seq;
    let data = read(len);
    while (data[0] === 0 && data.length > 32) data = data.subarray(1);
    const buf = Buffer.alloc(32);
    data.copy(buf, 32 - data.length);
    return buf;
  };
  read(2);
  const r = readInt();
  const s = readInt();
  return Buffer.concat([r, s]);
}

const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' })).toString('base64url');
const payload = Buffer.from(JSON.stringify({ iss: issuerId, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' })).toString('base64url');
const signingInput = `${header}.${payload}`;
const derSig = crypto.sign('sha256', Buffer.from(signingInput), privateKey);
const rawSig = derToRawJose(derSig);
const token = `${signingInput}.${rawSig.toString('base64url')}`;

async function main() {
  const apps = await fetch('https://api.appstoreconnect.apple.com/v1/apps?limit=100', { headers: { Authorization: `Bearer ${token}` } });
  const ad = await apps.json();
  console.log('--- Apps visible to key ---');
  (ad.data || []).forEach(a => console.log(a.id, a.attributes.bundleId, a.attributes.name));

  const appId = process.argv[4];
  if (appId) {
    const bs = await fetch(`https://api.appstoreconnect.apple.com/v1/apps/${appId}/builds?limit=20`, { headers: { Authorization: `Bearer ${token}` } });
    const bd = await bs.json();
    console.log('--- Builds for app', appId, '---');
    (bd.data || []).forEach(b => console.log(`build ${b.attributes.version}: state=${b.attributes.processingState} expired=${b.attributes.expired} uploaded=${b.attributes.uploadedDate}`));
    if (bd.errors) console.log(JSON.stringify(bd.errors, null, 2));
  }
}
main().catch(e => { console.error(e); process.exit(1); });
