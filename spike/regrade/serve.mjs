// A static server for the spike, with HTTP range requests (video seeking needs them).
// Usage: node serve.mjs [port]   then open http://localhost:<port>/
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const ROOT = new URL('.', import.meta.url).pathname;
const PORT = Number(process.argv[2] || 8742);
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.md': 'text/plain',
};

createServer((req, res) => {
  const path = normalize(
    decodeURIComponent(new URL(req.url, 'http://x').pathname)
  );
  if (path.includes('..')) return res.writeHead(400).end();
  const file = join(ROOT, path === '/' ? 'index.html' : path);
  let size;
  try {
    size = statSync(file).size;
  } catch {
    return res.writeHead(404).end();
  }
  const type = TYPES[extname(file)] || 'application/octet-stream';
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
  if (!m) {
    res.writeHead(200, {
      'content-type': type,
      'content-length': size,
      'accept-ranges': 'bytes',
    });
    return createReadStream(file).pipe(res);
  }
  const start = m[1] ? Number(m[1]) : size - Number(m[2]);
  const end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  res.writeHead(206, {
    'content-type': type,
    'content-length': end - start + 1,
    'accept-ranges': 'bytes',
    'content-range': `bytes ${start}-${end}/${size}`,
  });
  createReadStream(file, { start, end }).pipe(res);
}).listen(PORT, '127.0.0.1', () => console.log(`http://localhost:${PORT}/`));
