#!/usr/bin/env node
/**
 * Сборка bootstrap.min.css под фактически используемые классы.
 *
 * Полная сборка Bootstrap 5.3.3 весит 227 КБ, из которых на главной странице
 * используется 6%. Без сжатия (python -m http.server, php -S) эти 227 КБ едут
 * по сети целиком и стоят ~1.1 с до первой отрисовки, потому что CSS
 * блокирует рендер. Локальное превью и прод на Vercel отдают один и тот же
 * файл, поэтому режем его на сборке, а не «на лету».
 *
 * Источник — `bootstrap.source.min.css` (нетронутый вендорный файл), результат —
 * `bootstrap.min.css` в шаблоне и в превью (они обязаны совпадать побайтово).
 *
 * Правила отбора:
 *   - правила без классов (reboot, :root, теги, [type=...]) остаются целиком;
 *   - правило с классами остаётся, только если ВСЕ его классы есть в выборке;
 *   - выборка = классы из разметки (class="...") + классы, которые добавляет
 *     JavaScript, + safelist состояний Bootstrap (show, fade, collapsing…).
 *
 *   node tools/purge-css.mjs           — пересобрать оба файла
 *   node tools/purge-css.mjs --check   — упасть, если файлы разошлись со сборкой
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tplCss = path.join(root, 'local/templates/nlb_bootstrap/assets/css');
const source = path.join(tplCss, 'bootstrap.source.min.css');
const targets = [
    path.join(tplCss, 'bootstrap.min.css'),
    path.join(root, 'preview/assets/css/bootstrap.min.css'),
];

const check = process.argv.includes('--check');

const skipDirs = new Set(['.git', 'node_modules', 'test', 'docs']);
const scanExt = /\.(php|html|js|json|webmanifest)$/i;

function walk(dir, out) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (skipDirs.has(entry.name)) continue;
            walk(path.join(dir, entry.name), out);
            continue;
        }
        if (scanExt.test(entry.name)) out.push(path.join(dir, entry.name));
    }
    return out;
}

const files = walk(root, []);

const classAttr = new Set();
const jsStrings = new Set();

for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(/class\s*=\s*(["'])([^"']*)\1/g)) {
        for (const token of match[2].split(/\s+/)) {
            const clean = token.replace(/\$\{[^}]*\}/g, '');
            if (clean && /^[_a-zA-Z][_a-zA-Z0-9-]*$/.test(clean)) classAttr.add(clean);
        }
    }
    if (/\.js$/.test(file)) {
        for (const match of text.matchAll(/["'`]([a-zA-Z][a-zA-Z0-9-]{1,40})["'`]/g)) {
            jsStrings.add(match[1]);
        }
    }
}

const css = fs.readFileSync(source, 'utf8');

const cssClasses = new Set([...css.matchAll(/\.(-?[_a-zA-Z][_a-zA-Z0-9-]*)/g)].map((m) => m[1]));

const fromJs = [...jsStrings].filter((s) => cssClasses.has(s));
const safelist = [
    'show', 'fade', 'collapsing', 'collapsed', 'active', 'disabled', 'modal-open',
    'modal-static', 'modal-backdrop', 'offcanvas-backdrop', 'was-validated',
    'is-valid', 'is-invalid', 'valid-feedback', 'invalid-feedback', 'valid-tooltip',
    'invalid-tooltip', 'carousel-item-start', 'carousel-item-end', 'carousel-item-next',
    'carousel-item-prev', 'carousel-fade', 'dropdown-menu-end', 'dropdown-menu-start',
    'tooltip', 'tooltip-inner', 'tooltip-arrow', 'popover', 'popover-inner',
    'popover-arrow', 'bs-tooltip-top', 'bs-tooltip-bottom', 'bs-tooltip-start',
    'bs-tooltip-end', 'bs-popover-top', 'bs-popover-bottom', 'bs-popover-start',
    'bs-popover-end', 'accordion-collapse', 'btn-check', 'visually-hidden-focusable',
    'sticky-top', 'sticky-bottom', 'fixed-top', 'fixed-bottom',
];

const keep = new Set([...classAttr, ...fromJs, ...safelist].filter((c) => cssClasses.has(c)));

const rules = parse(css.replace(/\/\*[\s\S]*?\*\//g, ''));
const kept = filter(rules);
const banner = '/*! Собрано tools/purge-css.mjs из bootstrap.source.min.css — не правьте вручную: правка потеряется при пересборке */\n';
let out = kept.map(render).join('');
if (out.startsWith('@charset "UTF-8";')) out = '@charset "UTF-8";\n' + banner + out.slice('@charset "UTF-8";'.length);
else out = banner + out;

const kb = (n) => (n / 1024).toFixed(1);
console.log(`источник: ${kb(css.length)} КБ`);
console.log(`классов в источнике: ${cssClasses.size}`);
console.log(`из разметки: ${classAttr.size}, из JS: ${fromJs.length}, safelist: ${safelist.length}`);
console.log(`в выборке: ${keep.size}`);
console.log(`результат: ${kb(out.length)} КБ (${Math.round((1 - out.length / css.length) * 100)}% меньше)`);

const missing = [...classAttr].filter((c) => !cssClasses.has(c));
if (missing.length) console.log(`не из Bootstrap (свои классы styles.css): ${missing.length}`);

if (check) {
    let drift = 0;
    for (const target of targets) {
        const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
        if (current !== out) {
            console.error(`РАСХОЖДЕНИЕ: ${path.relative(root, target)} не совпадает со сборкой`);
            drift++;
        }
    }
    if (drift) process.exit(1);
    console.log('OK: bootstrap.min.css собран из source и совпадает в шаблоне и превью');
    process.exit(0);
}

for (const target of targets) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, out);
    console.log(`записан ${path.relative(root, target)}`);
}

/* ------------------------------------------------------------------ */

function parse(text) {
    const nodes = [];
    let i = 0;
    while (i < text.length) {
        const open = text.indexOf('{', i);
        const semi = text.indexOf(';', i);
        if (open === -1) break;
        if (semi !== -1 && semi < open) {
            nodes.push({ type: 'raw', text: text.slice(i, semi + 1) });
            i = semi + 1;
            continue;
        }
        const prelude = text.slice(i, open).trim();
        let depth = 1;
        let j = open + 1;
        while (j < text.length && depth > 0) {
            const ch = text[j];
            if (ch === '"' || ch === "'") {
                j++;
                while (j < text.length && text[j] !== ch) j += text[j] === '\\' ? 2 : 1;
            } else if (ch === '{') depth++;
            else if (ch === '}') depth--;
            j++;
        }
        const body = text.slice(open + 1, j - 1);
        if (prelude.startsWith('@')) {
            const name = prelude.slice(1).split(/[\s(]/)[0];
            if (name === 'media' || name === 'supports' || name === 'layer' || name === 'container') {
                nodes.push({ type: 'at', prelude, children: parse(body) });
            } else {
                nodes.push({ type: 'at', prelude, raw: body });
            }
        } else {
            nodes.push({ type: 'rule', selector: prelude, body });
        }
        i = j;
    }
    return nodes;
}

function filter(nodes) {
    const out = [];
    for (const node of nodes) {
        if (node.type === 'raw') {
            out.push(node);
            continue;
        }
        if (node.type === 'at') {
            if (!node.children) {
                out.push(node);
                continue;
            }
            const kids = filter(node.children);
            if (kids.length) out.push({ ...node, children: kids });
            continue;
        }
        const selectors = splitSelector(node.selector).filter(selectorKept);
        if (selectors.length) out.push({ ...node, selector: selectors.join(',') });
    }
    return out;
}

function splitSelector(selector) {
    const parts = [];
    let depth = 0;
    let current = '';
    for (let i = 0; i < selector.length; i++) {
        const ch = selector[i];
        if (ch === '(' || ch === '[') depth++;
        if (ch === ')' || ch === ']') depth--;
        if (ch === ',' && depth === 0) {
            parts.push(current.trim());
            current = '';
            continue;
        }
        current += ch;
    }
    if (current.trim()) parts.push(current.trim());
    return parts;
}

function selectorKept(selector) {
    const classes = [...selector.matchAll(/\.(-?[_a-zA-Z][_a-zA-Z0-9-]*)/g)].map((m) => m[1]);
    return classes.every((name) => keep.has(name));
}

function render(node) {
    if (node.type === 'raw') return node.text;
    if (node.type === 'at') {
        if (!node.children) return `${node.prelude}{${node.raw}}`;
        return `${node.prelude}{${node.children.map(render).join('')}}`;
    }
    return `${node.selector}{${node.body}}`;
}
