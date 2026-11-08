# NLB Bootstrap — Project Context

## 1. Что это

Сайт библиотеки на **1С-Битрикс: Управление сайтом**. Оформление — шаблон сайта
`nlb_bootstrap` в `local/templates/nlb_bootstrap/`. Дизайн перенесён из
Lovable-проекта `../src/` (React 18 + Tailwind 3 + shadcn/ui) на серверный
рендер: PHP-шаблон + Bootstrap 5 + vanilla JS.

Ключевое отличие от исходника: нет SPA, нет клиентского роутинга, нет сборки.
Каждая страница — обычный PHP-файл Битрикс, который подключает
`bitrix:header.php`, контент и `bitrix:footer.php`.

## 2. Стек

| Слой | Технология | Версия / файл |
|---|---|---|
| CMS | 1С-Битрикс: Управление сайтом | «Старт»+ |
| Язык шаблона | PHP | 8.0+ |
| CSS-фреймворк | Bootstrap | 5.3.3, `assets/css/bootstrap.min.css` |
| JS-фреймворк | Bootstrap bundle (Popper внутри) | 5.3.3, `assets/js/bootstrap.bundle.min.js` |
| Свой CSS | CSS3 + custom properties | `styles.css`, 3 785 строк |
| Свой JS | ES5-совместимый vanilla, IIFE | `script.js`, 10 модулей + `pwa.js`, `consent.js` |
| Шрифт | системный стек (`Manrope` — если установлен) | `styles.css:55`, внешних запросов нет |
| Иконки | inline SVG `<symbol>` | спрайт в `header.php`, копия в `preview/index.html` |
| Изображения | JPG + WebP/AVIF, ширины 480/960/1280, `<picture>` и `srcset` | `assets/images/`, 20 исходников |
| Данные | миграции на API Битрикса | `db/`, 9 инфоблоков, 91 элемент |
| SEO | свои хелперы | `local/php_interface/include/nlb_seo.php` |
| Безопасность | заголовки + CSP из PHP | `local/php_interface/include/nlb_security.php` |
| PWA | manifest + service worker | `manifest.webmanifest`, `sw.js`, `offline.html` |
| Сборка | отсутствует | — |
| jQuery | не используется | — |

## 3. Дизайн-токены

Источник правды — `styles.css:12` (`:root`). Значения:

```css
--nlb-primary: #2563eb;      /* синий — ссылки, акценты */
--nlb-primary-dark: #1d4ed8;
--nlb-violet: #7c3aed;       /* фиолетовый — градиент */
--nlb-violet-bright: #9333ea;
--nlb-pink: #ec4899;
--nlb-accent: #10b981;       /* зелёный — CTA, успех */
--nlb-accent-dark: #16a34a;
--nlb-sky: #06b6d4;
--nlb-danger: #dc2626;

--nlb-ink: #0f172a;          /* заголовки */
--nlb-body: #334155;         /* основной текст */
--nlb-muted: #64748b;        /* вторичный текст */
--nlb-soft: #f8fafc;         /* фон секций */
--nlb-soft-2: #f1f5f9;
--nlb-line: #e2e8f0;         /* границы */

--nlb-radius: 1.25rem;
--nlb-radius-sm: 0.85rem;
--nlb-shadow: 0 24px 60px -34px rgba(15, 23, 42, .35);
--nlb-shadow-sm: 0 14px 34px -22px rgba(15, 23, 42, .35);
--nlb-header-h: 76px;
```

Градиенты (`styles.css:35`):

| Переменная | Направление и цвета | Где |
|---|---|---|
| `--nlb-grad` | 135°, `#2563eb → #7c3aed 55% → #9333ea` | логотип, `.btn-nlb`, FAB, счётчики коллекций |
| `--nlb-grad-green` | 135°, `#10b981 → #16a34a` | главный CTA hero, кнопки событий |
| `--nlb-grad-sky` | 135°, `#3b82f6 → #06b6d4` | карточки печати, CTA-баннер |
| `--nlb-grad-pink` | 135°, `#ec4899 → #a855f7` | бейдж «Для детей» |
| `--nlb-grad-orange` | 135°, `#f97316 → #ef4444` | бейджи сувениров |

## 4. Типографика

| Роль | Размер | Вес | Класс |
|---|---|---|---|
| Hero H1 | `clamp(2.1rem, 5.2vw, 4.25rem)` | 800 | `.hero-title` |
| Заголовок секции | `clamp(1.9rem, 3.2vw, 3rem)` | 800 | `.section-title` |
| Заголовок карточки | 1.05–1.25rem | 800 | `.event-title`, `.news-title` |
| Основной текст | 1rem / 1.7 | 400 | `body` |
| Вторичный текст | 0.9–0.95rem | 400 | `.section-lead`, `.news-text` |
| Надзаголовок | 0.8125rem | 700 | `.eyebrow` |
| Подпись логотипа | 0.6875rem, uppercase, tracking .14em | 600 | `.brand-tag` |

Семейство: `"Manrope", "Inter", "Segoe UI", system-ui, ...` (`styles.css:55`).

## 5. Сетка и брейкпоинты

Используются стандартные брейкпоинты Bootstrap 5:

| Точка | Ширина | Что меняется |
|---|---|---|
| `sm` | ≥ 576px | карточки печати 2 в ряд, hero-текст крупнее |
| `md` | ≥ 768px | коллекции 2 в ряд, скрываются стрелки hero |
| `lg` | ≥ 992px | navbar раскрыт, топбар виден, услуги 3 в ряд |
| `xl` | ≥ 1200px | карточки печати 4 в ряд |

Контейнер — стандартный `.container` Bootstrap (max-width 1320px на xl).
Секции — `.section` (`padding: 5.5rem 0`), на мобильных 3.25rem
(`styles.css:146`, адаптив в конце файла).

## 6. Карта секций главной

Порядок и якоря — как в `demo/index.php` и `preview/index.html`:

| # | Секция | Якорь | Классы-маркеры | Данные в Битриксе |
|---|---|---|---|---|
| 1 | Hero-карусель, 3 слайда | `#top` | `.hero`, `.carousel` | статика или `bitrix:news.list` |
| 2 | Услуги, 6 карточек | `#services` | `.service-card`, `.icon-tile` | статика / `iblock` «Услуги» |
| 3 | Печатные услуги, 8 карточек | `#print` | `.scroller`, `.print-card` | `iblock` «Печать» |
| 4 | События, 3 карточки + CTA | `#events` | `.nlb-card`, `.event-date` | `iblock` «События» |
| 5 | Новости, 4 карточки | `#news` | `.news-date`, `.news-title` | `bitrix:news.list` |
| 6 | Коллекции, 6 карточек | `#collections` | `.collection-card`, `.collection-count` | статика / `iblock` |
| 7 | Партнёры, 5 логотипов | — | `.partners`, `.partner` | статика |
| 8 | Подвал | `#contacts` | `.site-footer` | статика + настройки |

Внутренние страницы: `page-head` + хлебные крошки + `.bitrix-content`
(стили для контента визуального редактора, `styles.css:2435`).

## 7. Точки интеграции с Битриксом

| Что | Где вызывается | Компонент / шаблон |
|---|---|---|
| Меню | `header.php:144` | `bitrix:menu` → `top_bootstrap`, тип `top` |
| Хлебные крошки | `header.php:228` | `bitrix:breadcrumb` → `bootstrap` |
| Заголовок страницы | `header.php:26` | `$APPLICATION->ShowTitle()` |
| Мета/CSS/JS ядра | `header.php:25` | `$APPLICATION->ShowHead()` |
| SEO и JSON-LD | `header.php:29–30` | `nlb_seo_head()`, `nlb_seo_jsonld()` |
| Панель редактирования | `header.php:47` | `$APPLICATION->ShowPanel()` |
| Поиск | `header.php:191` | модалка `#searchModal`, форма на `:199` → `GET /search/?q=`; мгновенная выдача — `local/ajax/search.php` (BM25) |
| Личный кабинет | `header.php:162–178` | `/personal/`, `/auth/` |
| Подписка | `footer.php:92` | `/subscribe/` → `bitrix:subscribe.form` |
| Обратная связь | `footer.php:250` | модалка `#feedbackModal` → POST `/feedback/` → `requests` |
| Реквизиты | `footer.php:283` | модалка `#requisitesModal`, статика |
| Скрипты | `footer.php:308–321` | bundle, `script.js`, `pwa.js`, `push.js`, `consent.js` |

## 8. Ограничения

- **Нет живой установки.** Ядра и лицензии Битрикса на машине разработки нет,
  поэтому интеграционные вещи не проверены (см. `Что доделать.txt`, P0).
  Синтаксис всех 104 PHP-файлов (вне `preview/`) проверен `php -l` — 0 ошибок.
- **Демо-контент.** Все тексты, контакты, цены, события и фото — заглушки.
- **Один шаблон.** Мультисайтовость не настроена; `SITE_DIR`/`SITE_ID`
  используются, но второй сайт не тестировался.
- **Только светлая тема.** Тёмная не планируется — решение владельца
  от 04.11.2026, `prefers-color-scheme` не подключается.
- **Картинки с вариантами.** JPG пережаты (3722 → 1813 КБ); рядом лежат WebP,
  AVIF и ширины 480/960/1280, вывод — через `nlb_picture()`. Варианты собирает
  `php tools/build-image-variants.php` (GD с `imagewebp`/`imageavif`).
- **Без CI.** Гейты локальные: `node tools/check-template.mjs`,
  `node tools/check-docs.mjs`, `node tools/check-filter-parity.mjs`,
  `php db/lint.php`, `php db/tests/run.php`, `php tools/filter-selftest.php`,
  `php tools/search-selftest.php`, `php tools/build-search-index.php --check`.

## 9. Соглашения

- Префикс своих классов — `nlb-` (`.nlb-card`) или семантический
  (`.hero`, `.print-card`); пересечения с Bootstrap минимизированы.
- Модификаторы — двойной дефис: `.collection-card--blue`,
  `.section--soft`, `.icon-tile--green`.
- Состояния — `is-*`: `.is-scrolled`, `.is-open`, `.is-visible`.
- JS-хуки — `data-*`: `data-reveal`, `data-scroller`, `data-scroll-prev`,
  `data-scroll-next`.
- PHP-переменные шаблона — `$nlb*` (`$nlbSiteDir`, `$nlbTpl`, `$nlbAuthorized`).
- Комментарии в коде — по-русски, блоками с номерами разделов.
