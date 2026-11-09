#!/usr/bin/env node
/**
 * Локальный сервер превью — как прод, а не «просто раздать папку».
 *
 * `php -S` и `python -m http.server` отдают файлы без `Content-Encoding` и без
 * `Cache-Control`: браузер держит старую CSS/HTML по эвристическому кешу,
 * а Lighthouse показывает 63–73 по Performance и «старую» доступность, хотя
 * в `preview/` уже лежит исправленная сборка. Здесь те же правила, что в
 * `vercel.json`: gzip/brotli для текста, HTML — `no-cache` с ETag, версионированные
 * `styles.css`/`script.js` — `immutable`, `assets/` — на сутки.
 *
 * Запуск: node tools/preview-server.mjs [--port 8791] [--root preview]
 */

import { createServer } from 'node:http';
import { createReadStream, statSync, existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { brotliCompressSync, gzipSync, constants as zlibConstants } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));

function arg(name, fallback) {
    const index = process.argv.indexOf(`--${name}`);
    if (index === -1 || index + 1 >= process.argv.length) return fallback;
    return process.argv[index + 1];
}

const host = arg('host', '127.0.0.1');
const port = Number(arg('port', 8791));
const root = resolve(repoRoot, arg('root', 'preview'));

if (!existsSync(join(root, 'index.html'))) {
    console.error(`preview-server: нет ${join(root, 'index.html')} — запускайте из корня репозитория`);
    process.exit(1);
}

const types = new Map(Object.entries({
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.pdf': 'application/pdf',
    '.mp4': 'video/mp4',
    '.map': 'application/json; charset=utf-8',
}));

const compressible = /^(text\/|application\/(json|manifest\+json|xml)|image\/svg\+xml)/;

function cacheControl(pathname, type) {
    if (type.startsWith('text/html')) return 'no-cache, must-revalidate';
    if (pathname === '/styles.css' || pathname === '/script.js') return 'public, max-age=31536000, immutable';
    if (pathname.startsWith('/assets/')) return 'public, max-age=86400';
    return 'public, max-age=3600';
}

function resolvePath(urlPath) {
    let decoded;
    try {
        decoded = decodeURIComponent(urlPath.split('?')[0]);
    } catch {
        return { status: 400 };
    }
    const target = normalize(join(root, decoded));
    if (target !== root && !target.startsWith(root + sep)) return { status: 403 };
    return { path: target };
}

function fileInfo(target) {
    if (!existsSync(target)) return null;
    const info = statSync(target);
    if (info.isDirectory()) return { directory: true };
    return { file: target, info };
}

function notFound(res) {
    const page = join(root, '404.html');
    if (existsSync(page)) {
        const body = readFileSync(page);
        res.writeHead(404, { 'Content-Type': types.get('.html'), 'Content-Length': body.length, 'Cache-Control': 'no-store' });
        res.end(body);
        return;
    }
    const body = Buffer.from('404 Not Found', 'utf8');
    res.writeHead(404, { 'Content-Type': types.get('.txt'), 'Content-Length': body.length, 'Cache-Control': 'no-store' });
    res.end(body);
}

const server = createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { Allow: 'GET, HEAD', 'Content-Type': types.get('.txt') });
        res.end('405 Method Not Allowed');
        return;
    }

    const urlPath = req.url || '/';
    const resolved = resolvePath(urlPath);
    if (resolved.status) {
        res.writeHead(resolved.status, { 'Content-Type': types.get('.txt'), 'Cache-Control': 'no-store' });
        res.end(String(resolved.status));
        return;
    }

    let found = fileInfo(resolved.path);
    if (found && found.directory) {
        const clean = urlPath.split('?')[0];
        const query = urlPath.includes('?') ? '?' + urlPath.split('?')[1] : '';
        if (!clean.endsWith('/')) {
            res.writeHead(301, { Location: clean + '/' + query, 'Cache-Control': 'no-store' });
            res.end();
            return;
        }
        found = fileInfo(join(resolved.path, 'index.html'));
    }
    if (!found) {
        notFound(res);
        return;
    }

    const type = types.get(extname(found.file).toLowerCase()) || 'application/octet-stream';
    const etag = `"${found.info.size.toString(16)}-${Math.floor(found.info.mtimeMs).toString(16)}"`;
    const headers = {
        'Content-Type': type,
        'Cache-Control': cacheControl(urlPath.split('?')[0], type),
        ETag: etag,
        'Last-Modified': found.info.mtime.toUTCString(),
        'X-Content-Type-Options': 'nosniff',
    };

    if (req.headers['if-none-match'] === etag) {
        res.writeHead(304, headers);
        res.end();
        return;
    }

    const accepts = String(req.headers['accept-encoding'] || '');
    let body = null;
    if (compressible.test(type) && found.info.size > 1024) {
        const raw = readFileSync(found.file);
        if (/\bbr\b/.test(accepts)) {
            body = brotliCompressSync(raw, {
                params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 5, [zlibConstants.BROTLI_PARAM_SIZE_HINT]: raw.length },
            });
            headers['Content-Encoding'] = 'br';
        } else if (/\bgzip\b/.test(accepts)) {
            body = gzipSync(raw, { level: 6 });
            headers['Content-Encoding'] = 'gzip';
        }
    }

    if (body) {
        headers.Vary = 'Accept-Encoding';
        headers['Content-Length'] = body.length;
    } else {
        headers['Content-Length'] = found.info.size;
    }

    res.writeHead(200, headers);
    if (req.method === 'HEAD') {
        res.end();
        return;
    }
    if (body) {
        res.end(body);
        return;
    }
    createReadStream(found.file).pipe(res);
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`preview-server: порт ${port} занят — закройте другой сервер или укажите --port`);
        process.exit(1);
    }
    throw error;
});

server.listen(port, host, () => {
    console.log(`preview-server: http://${host}:${port}/ → ${root}`);
    console.log('gzip/brotli, HTML no-cache, styles.css и script.js immutable — как ведёт себя прод Vercel');
});
