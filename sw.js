/*!
 * Service worker прогрессивного веб-приложения «Библиотека 2026».
 *
 * Стратегия:
 *  - оболочка (CSS/JS/иконки/manifest) — cache-first, обновляется при смене версии;
 *  - переходы между страницами — network-first, офлайн отдаётся offline.html;
 *  - HTML-страницы не кешируются: на сайте есть авторизация и персональные данные,
 *    показывать чужой/устаревший ответ из кеша нельзя;
 *  - запросы в /bitrix/ (админка, служебные пути) не перехватываются.
 *
 * Файл лежит в корне DOCUMENT_ROOT, поэтому область действия — весь сайт.
 * При смене состава оболочки увеличьте VERSION: старый кеш удалится в activate.
 */

const VERSION = 'v1';
const SHELL_CACHE = `nlb-shell-${VERSION}`;
const OFFLINE_URL = 'offline.html';
const TEMPLATE = 'local/templates/nlb_bootstrap';

const SHELL = [
    OFFLINE_URL,
    'manifest.webmanifest',
    `${TEMPLATE}/assets/css/bootstrap.min.css`,
    `${TEMPLATE}/styles.css`,
    `${TEMPLATE}/assets/js/bootstrap.bundle.min.js`,
    `${TEMPLATE}/script.js`,
    `${TEMPLATE}/assets/js/pwa.js`,
    `${TEMPLATE}/assets/js/consent.js`,
    `${TEMPLATE}/assets/icons/icon-192.png`,
    `${TEMPLATE}/assets/icons/icon-512.png`,
    `${TEMPLATE}/assets/icons/icon.svg`
];

const STATIC_RE = /\.(?:css|js|mjs|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf|webmanifest)$/i;

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(SHELL_CACHE);
        // addAll падает целиком из-за одного 404 — кладём по одному и не блокируем установку.
        await Promise.all(SHELL.map(async (url) => {
            try {
                await cache.add(new Request(url, { cache: 'reload' }));
            } catch (error) {
                // Файл мог не попасть в сборку — установка из-за этого не отменяется.
            }
        }));
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys
            .filter((key) => key !== SHELL_CACHE && key.startsWith('nlb-'))
            .map((key) => caches.delete(key)));
        await self.clients.claim();
    })());
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

function isSkipped(url) {
    // Админка и служебные пути ядра: их ответы зависят от прав и сессии.
    if (url.pathname.includes('/bitrix/')) return true;
    if (url.search.toLowerCase().includes('logout')) return true;
    return false;
}

async function cacheFirst(request) {
    const cache = await caches.open(SHELL_CACHE);
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response && response.ok && response.type === 'basic') {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        return new Response('', { status: 504, statusText: 'Offline' });
    }
}

async function networkFirstNavigation(request) {
    try {
        return await fetch(request);
    } catch (error) {
        const cache = await caches.open(SHELL_CACHE);
        const offline = await cache.match(OFFLINE_URL);
        return offline || new Response('<!doctype html><meta charset="utf-8"><title>Нет сети</title><p>Нет подключения к интернету.', {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    }
}

self.addEventListener('fetch', (event) => {
    const request = event.request;

    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;
    if (isSkipped(url)) return;

    if (request.mode === 'navigate') {
        event.respondWith(networkFirstNavigation(request));
        return;
    }

    if (STATIC_RE.test(url.pathname)) {
        event.respondWith(cacheFirst(request));
    }
});
