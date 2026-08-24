const fs = require('fs');
const crypto = require('crypto');

const keyId = process.argv[2] || 'YS9XQVB4SS';
const issuerId = 'ac9f4281-658a-4b96-8a40-cebf371c26de';
const keyPath = `../../keys/AuthKey_${keyId}.p8`;

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
  const buildNumber = process.argv[3] || '23';
  const res = await fetch(`https://api.appstoreconnect.apple.com/v1/apps/6799368982/builds?limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) { console.log('HTTP', res.status, JSON.stringify(data, null, 2)); return; }
  const builds = (data.data || []).sort((a, b) => b.attributes.version.localeCompare(a.attributes.version, undefined, { numeric: true }));
  console.log('Builds on ASC for 1.0.0:');
  builds.forEach(b => {
    const a = b.attributes;
    console.log(`  build ${a.version}: status=${a.processingState} expired=${a.expired} uploaded=${a.uploadedDate}`);
  });
  const target = builds.find(b => b.attributes.version === buildNumber);
  if (!target) { console.log(`\nBuild number ${buildNumber} NOT found on App Store Connect`); return; }
  console.log(`\nTarget build ${buildNumber}: id=${target.id} processingState=${target.attributes.processingState}`);
  const groups = await fetch(`https://api.appstoreconnect.apple.com/v1/builds/${target.id}/betaGroups?limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const gd = await groups.json();
  const gList = (gd.data || []).map(g => g.attributes.name);
  console.log('Beta groups containing this build:', gList.length ? gList.join(', ') : 'NONE (not in TestFlight groups)');
  const betas = await fetch(`https://api.appstoreconnect.apple.com/v1/builds/${target.id}/buildBetaDetails`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const bd = await betas.json();
  const bAttr = (bd.data || []).map(b => b.attributes);
  console.log('buildBetaDetails:', bAttr.length ? JSON.stringify(bAttr) : 'none');
}

main().catch(e => { console.error(e); process.exit(1); });
