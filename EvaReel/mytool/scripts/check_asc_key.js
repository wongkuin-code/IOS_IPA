const fs = require('fs');
const crypto = require('crypto');

const keyId = process.argv[2];
const issuerId = process.argv[3] || 'ac9f4281-658a-4b96-8a40-cebf371c26de';
const keyPath = `../../keys/AuthKey_${keyId}.p8`;

const privateKey = fs.readFileSync(keyPath, 'utf8');
const now = Math.floor(Date.now() / 1000);

function derToRawJose(signatureDer) {
  let offset = 0;
  const bytes = () => {
    const b = signatureDer[offset]; offset += 1; return b;
  };
  const readLen = () => {
    let n = bytes();
    if (n & 0x80) {
      const cnt = n & 0x7f;
      n = 0;
      for (let i = 0; i < cnt; i++) n = (n << 8) | bytes();
    }
    return n;
  };
  if (bytes() !== 0x30) throw new Error('not a sequence');
  readLen();
  const readInt = () => {
    if (bytes() !== 0x02) throw new Error('not an integer');
    const len = readLen();
    let data = signatureDer.subarray(offset, offset + len); offset += len;
    if (data.length > 33) throw new Error('integer too long: ' + data.length);
    if (data[0] === 0x00) data = data.subarray(1);
    if (data.length > 32) throw new Error('raw int too long: ' + data.length);
    const buf = Buffer.alloc(32);
    data.copy(buf, 32 - data.length);
    return buf;
  };
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
