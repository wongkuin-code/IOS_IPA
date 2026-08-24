const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'dist');
const port = Number(process.argv[2] || 8080);
const logFile = path.join(__dirname, 'serve_web.log');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
};

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try { fs.appendFileSync(logFile, line); } catch (e) {}
  process.stdout.write(line);
}

function serve(res, file) {
  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  fs.createReadStream(file).pipe(res);
}

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  let file = path.join(root, p);
  log(`${req.method} ${req.url} -> ${file}`);
  if (!file.startsWith(root)) { res.writeHead(403); res.end('Forbidden'); return; }
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    serve(res, file);
    return;
  }
  // SPA fallback: unknown path serves index.html so in-app routes work on refresh
  const idx = path.join(root, 'index.html');
  if (fs.existsSync(idx)) {
    log(`  fallback -> index.html`);
    serve(res, idx);
    return;
  }
  res.writeHead(404); res.end('Not Found');
}).listen(port, '0.0.0.0', () => console.log(`Web app serving http://localhost:${port}`));
