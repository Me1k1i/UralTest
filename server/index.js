import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createOffersMiddleware } from './favoritMiddleware.js';

const projectDirectory = fileURLToPath(new URL('../', import.meta.url));
const defaultStaticDirectory = resolve(projectDirectory, 'dist');
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function notFound(response) {
  response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end('Ресурс не найден.');
}

async function serveStatic(request, response, directory) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD', 'Cache-Control': 'no-store' });
    response.end();
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400, { 'Cache-Control': 'no-store' });
    response.end();
    return;
  }
  const segments = pathname.split('/').filter(Boolean);
  if (pathname.startsWith('/api/') || segments.some((segment) => segment.startsWith('.') || segment.includes('\\') || segment.includes('\0'))) {
    notFound(response);
    return;
  }
  const filename = pathname === '/' ? resolve(directory, 'index.html') : resolve(directory, ...segments);
  const contentType = contentTypes[extname(filename).toLowerCase()];
  if (!filename.startsWith(`${directory}${sep}`) || !contentType) {
    notFound(response);
    return;
  }
  try {
    const details = await stat(filename);
    if (!details.isFile()) {
      notFound(response);
      return;
    }
    const body = request.method === 'HEAD' ? null : await readFile(filename);
    response.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': details.size,
      'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(body);
  } catch {
    notFound(response);
  }
}

export function createAppServer({ env = process.env, fetchImpl = fetch, staticDirectory = defaultStaticDirectory } = {}) {
  const middleware = createOffersMiddleware({ env, fetchImpl });
  const directory = resolve(staticDirectory);
  return createServer((request, response) => {
    void middleware(request, response, () => {
      void serveStatic(request, response, directory);
    });
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const localEnvFile = resolve(projectDirectory, '.env.local');
  if (existsSync(localEnvFile)) process.loadEnvFile(localEnvFile);
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '127.0.0.1';
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT должен быть числом от 1 до 65535.');
  const server = createAppServer();
  server.listen(port, host, () => {
    console.log(`Приложение запущено: http://${host}:${port}`);
  });
}
