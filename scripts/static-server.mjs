#!/usr/bin/env node
/**
 * static-server.mjs — zero-dependency static file server for the SkyCast app.
 *
 * Playwright's webServer starts this automatically. Keeping it dependency-free
 * (no `npx serve` download at test time) makes local runs and CI deterministic.
 *
 * Root directory: ../skycast relative to this file (override with STATIC_ROOT).
 * Port: 4173 (override with PORT).
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT ?? 4173);
const PROJECT_ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..'); // skycast-qa/
const ROOT = resolve(PROJECT_ROOT, process.env.STATIC_ROOT ?? '../skycast');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    // Directory requests ("/", "/docs/") map to their index.html.
    const target = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
    const filePath = normalize(join(ROOT, target));

    // Path-traversal guard: never serve anything outside ROOT.
    if (!filePath.startsWith(resolve(ROOT) + sep) && filePath !== resolve(ROOT)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    const body = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`SkyCast static server: http://127.0.0.1:${PORT} (root: ${ROOT})`);
});
