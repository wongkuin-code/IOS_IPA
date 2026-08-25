const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'dist-web');
// Local-test video source: served directly from test_video/videos_compressed (not bundled).
// In production this is replaced by remote server URLs referenced from the app data.
const VIDEOS_ROOT = path.join(__dirname, '..', '..', '..', 'test_video', 'videos_compressed');
const port = Number(process.argv[2] || 8080);
const logFile = path.join(__dirname, 'serve_web.log');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  // — video (required for HTML5 <video> playback & seeking) —
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
};

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try { fs.appendFileSync(logFile, line); } catch (e) {}
  process.stdout.write(line);
}

// Serves a file, supporting HTTP Range requests so <video> can seek/stream.
function serve(req, res, file) {
  const ext = path.extname(file).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  let total = 0;
  try { total = fs.statSync(file).size; } catch (e) { total = 0; }
  const range = req.headers.range;

  if (range && total > 0) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const start = m && m[1] ? parseInt(m[1], 10) : 0;
    let end = m && m[2] ? parseInt(m[2], 10) : total - 1;
    if (isNaN(start) || isNaN(end) || start > end || end >= total) {
      res.writeHead(416, { 'Content-Range': `bytes */${total}` });
      return res.end();
    }
    res.writeHead(206, {
      'Content-Type': type,
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(file, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Type': type,
      'Accept-Ranges': 'bytes',
      'Content-Length': total,
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(file).pipe(res);
  }
}

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  // Local-test videos: /videos/* -> test_video/videos/*
  if (p.startsWith('/videos/')) {
    const rel = p.slice('/videos/'.length);
    const file = path.join(VIDEOS_ROOT, rel);
    if (!file.startsWith(VIDEOS_ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
    if (fs.existsSync(file) && fs.statSync(file).isFile()) { serve(req, res, file); return; }
    res.writeHead(404); res.end('Not Found'); return;
  }
  if (p === '/') p = '/index.html';
  let file = path.join(root, p);
  log(`${req.method} ${req.url} -> ${file}`);
  if (!file.startsWith(root)) { res.writeHead(403); res.end('Forbidden'); return; }
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    serve(req, res, file);
    return;
  }
  // SPA fallback: unknown path serves index.html so in-app routes work on refresh
  const idx = path.join(root, 'index.html');
  if (fs.existsSync(idx)) {
    log(`  fallback -> index.html`);
    serve(req, res, idx);
    return;
  }
  res.writeHead(404); res.end('Not Found');
}).listen(port, '0.0.0.0', () => console.log(`Web app serving http://localhost:${port}`));
