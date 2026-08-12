const fs = require('fs');
const crypto = require('crypto');

const keyId = process.argv[2];
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
    if (data[0] & 0x80) data = data.subarray(1);
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
  const res = await fetch('https://api.appstoreconnect.apple.com/v1/apps?limit=100', {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('HTTP', res.status);
  const data = await res.json();
  if (res.ok) {
    const apps = data.data || [];
    console.log('Total apps visible to key:', apps.length);
    const target = apps.find(a => a.attributes.bundleId === 'com.mytool.booksreader');
    console.log('com.mytool.booksreader visible:', target ? `YES (id=${target.id})` : 'NO');
    apps.forEach(a => console.log(' -', a.id, a.attributes.bundleId, a.attributes.name));
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

main().catch(e => { console.error(e); process.exit(1); });
