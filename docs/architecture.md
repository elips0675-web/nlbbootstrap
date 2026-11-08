# Архитектура шаблона

## 1. Место в Битриксе

Шаблон сайта — это набор файлов, который ядро подключает для каждой страницы:

```
local/templates/nlb_bootstrap/
├── header.php              ← $APPLICATION->ShowHead(), шапка, <main>
├── footer.php              ← подвал, модалки, </body>
├── styles.css              ← дизайн-система
├── script.js               ← поведение
├── .description.php        ← карточка шаблона в админке
├── assets/
│   ├── css/bootstrap.min.css
│   ├── js/bootstrap.bundle.min.js
│   └── images/*.jpg
└── components/
    └── bitrix/
        ├── menu/top_bootstrap/template.php
        └── breadcrumb/bootstrap/template.php
```

Поток запроса:

```
GET /news/
  → bitrix/modules/main/include/prolog.php
  → SITE_TEMPLATE_PATH/header.php
      → ShowHead()            (мета, CSS/JS ядра, SEO)
      → ShowPanel()           (панель редактирования для админа)
      → navbar + bitrix:menu  (тип top)
      → breadcrumb            (кроме главной)
      → <main>
  → /news/index.php            (контент страницы или компонент)
  → SITE_TEMPLATE_PATH/footer.php
      → Bootstrap bundle + script.js
      → </html>
```

`header.php` открывает `<main class="site-main" id="main">`, `footer.php`
закрывает его первой строкой (`footer.php:1`). Любая страница обязана
подключаться через `bitrix:header.php`/`bitrix:footer.php`, иначе шапка и
подвал не появятся.

## 2. header.php

Слои сверху вниз (по порядку в файле, без номеров строк — они устаревают на
каждой правке, искать по селекторам и вызовам):

- защита от прямого вызова, `$nlbSiteDir`, `$nlbTpl`, `$nlbAuthorized`;
- `<head>`: meta, preconnect, Manrope, `ShowHead()`, `<title>`;
- `ShowPanel()` и открытие `<body>`;
- inline SVG-спрайт: 37 символов `#i-*`;
- `.site-header` и `.topbar`: адрес, часы, телефон, e-mail (только ≥ lg);
- navbar: логотип, бургер, меню, поиск, уведомления, кабинет;
- модалка поиска `#searchModal` с формой `role="search"`;
- контейнер хлебных крошек `.page-head` (не на главной);
- открытие `<main class="site-main" id="main">`.

Важные переменные:

- `SITE_DIR` — корень текущего сайта (`/` или `/ru/`), используется во всех
  ссылках, чтобы шаблон работал на мультисайте;
- `SITE_TEMPLATE_PATH` — путь к шаблону (`/local/templates/nlb_bootstrap`);
- `LANGUAGE_ID` — язык сайта для `<html lang>`;
- `$USER->IsAuthorized()` — переключает «Войти» ↔ «Кабинет» и зелёную точку
  уведомлений.

`ShowHead()` обязателен: он выводит `<meta>` заголовка, CSS/JS ядра и
служебные скрипты. Свои `<link rel="stylesheet">` идут **после** него, чтобы
`styles.css` перекрывал Bootstrap.

## 3. footer.php

Слои сверху вниз (по порядку в файле, без номеров строк):

- закрытие `<main>`, защита от прямого вызова, переменные;
- `.site-footer`: бренд, соцсети, колонки ссылок, контакты, подписка
  (`bitrix:subscribe.form`);
- `.footer-bottom`: копирайт, политика, условия, карта сайта, настройки cookie;
- `.site-notices`: баннеры cookie и PWA;
- FAB `#nlbFab`: Telegram, WhatsApp, звонок, e-mail, обратная связь;
- кнопка «наверх» `.to-top`;
- модалка обратной связи `#feedbackModal` (`nlb_form_render('request')`);
- модалка реквизитов `#requisitesModal`;
- скрипты: `bootstrap.bundle.min.js`, `script.js`, `pwa.js`, `push.js`,
  `consent.js`.

Скрипты подключаются в конце `<body>`, без `defer`: bundle нужен до
`script.js`, а оба файла локальные и лёгкие. `script.js` сам проверяет наличие
элементов, поэтому на страницах без карусели/скроллера ошибок нет.

## 4. styles.css

Файл разбит на 18 пронумерованных разделов:

| № | Раздел | Примеры |
|---|---|---|
| 1 | Токены | `:root`, градиенты |
| 2 | База и утилиты | `.section`, `.eyebrow`, `.text-gradient`, `.i` |
| 3 | Кнопки, формы, модалки | `.btn-nlb`, `.form-control`, `.modal-nlb` |
| 4 | Топбар и шапка | `.topbar`, `.site-header`, `.brand` |
| 5 | Hero | `.hero`, `.hero-title`, `.hero-arrow` |
| 6 | Услуги | `.service-card`, `.icon-tile` |
| 7 | Скроллер печати | `.scroller`, `.print-card`, `.scroller-btn` |
| 8 | События и новости | `.nlb-card`, `.event-date`, `.news-title` |
| 9 | Сувениры, наборы, партнёры, CTA | `.collection-card`, `.partner`, `.cta-banner` |
| 10 | Подвал | `.site-footer`, `.footer-links`, `.newsletter` |
| 11 | Поиск, FAB, «наверх» | `.search-field`, `.fab`, `.to-top` |
| 12 | Внутренние страницы | `.page-head`, `.breadcrumb-navigation`, `.bitrix-content` |
| 13 | Анимация появления | `.reveal`, `prefers-reduced-motion` |
| 14 | Адаптив | `@media (max-width: …)` |
| 15 | Печать | `@media print` |
| 16 | Страницы разделов | `.page-hero`, `.book-card`, `.article` |
| 17 | Уведомления | `.cookie-banner`, `.pwa-banner` |
| 18 | Услуги и бронирование | `.service-tile`, `.tariff-card`, `.booking-card` |

Порядок каскада: `bootstrap.min.css` → `styles.css`. Специфичность повышается
точечно (`.site-footer .brand-tag`, `.collection-card .icon-tile`), без
`!important`, кроме утилит и печати.

## 5. script.js

Девять независимых модулей в одном IIFE:

| № | Модуль | Триггер | Строки |
|---|---|---|---|
| 1 | Тень шапки | `#siteHeader`, `scroll > 8` | 13–21 |
| 2 | Reveal-анимация | `[data-reveal]`, IntersectionObserver | 24–42 |
| 3 | Скроллер печати | `[data-scroller]`, кнопки `[data-scroll-*]` | 46–82 |
| 4 | FAB | `.fab`, `.fab-toggle` | 85–110 |
| 5 | «Наверх» | `.to-top`, `scroll > 480` | 113–126 |
| 6 | Мобильное меню | `#nlbNav`, клик по `.nav-link` | 129–139 |
| 7 | Автофокус поиска | `#searchModal`, `shown.bs.modal` | 142–150 |
| 8 | Валидация форм | `form.needs-validation` | 153–163 |
| 9 | Ctrl+K | `keydown`, `#searchModal` | 166–175 |

В конце на `<html>` добавляется класс `js` (`script.js:1512`) — это позволяет
в будущем скрывать анимации при отключённом JS.

## 6. Компонентные шаблоны

### Меню `top_bootstrap`

`components/bitrix/menu/top_bootstrap/template.php`:

- `setFrameMode(true)` — режим компонента, чтобы правки в админке применялись к
  фрагменту;
- если `$arResult` пуст — подставляется демо-меню из 7 пунктов с демо-подпунктами
  для «Услуг» и «Печати» (`components/bitrix/menu/top_bootstrap/template.php:46`), чтобы сайт не остался без
  навигации до создания типа `top`;
- `$arResult` приходит плоским списком (`DEPTH_LEVEL`): шаблон собирает из него
  дерево и пункты с детьми рисует как `.nav-item.dropdown` с
  `.dropdown-menu` и `.dropdown-item`;
- активный пункт: `SELECTED` → класс `active` + `aria-current="page"`; если
  выбран дочерний пункт, подсвечивается и родитель;
- ссылка и текст экранируются: `htmlspecialcharsbx()`.

Вызов — `header.php:144`:

```php
$APPLICATION->IncludeComponent('bitrix:menu', 'top_bootstrap', [
    'ROOT_MENU_TYPE' => 'top',
    'MAX_LEVEL' => '2',
    'CHILD_MENU_TYPE' => 'left',
    'USE_EXT' => 'Y',
    'DELAY' => 'N',
    'ALLOW_MULTI_SELECT' => 'N',
    'MENU_CACHE_TYPE' => 'A',
    'MENU_CACHE_TIME' => '3600',
    'MENU_CACHE_USE_GROUPS' => 'Y',
    'MENU_CACHE_GET_VARS' => [],
], false, ['HIDE_ICONS' => 'Y']);
```

Второй уровень — файлы `.left.menu.php` в разделах (`/services/`, `/printing/`),
их копирует миграция 011.

### Хлебные крошки `bootstrap`

`components/bitrix/breadcrumb/bootstrap/template.php`:

- **возвращает** строку `<nav aria-label="Хлебные крошки"><ol class="breadcrumb-navigation">…</ol></nav>`,
  а не печатает её: компонент подключает шаблон через
  `$APPLICATION->AddBufferContent()` с `$bIncludeOnce = true`, поэтому
  `include` возвращает то, что вернул шаблон. Печать ломает и позицию
  (крошки уезжают в начало документа), и содержимое контейнера — туда
  попадает `1`, результат `include`;
- последний элемент без ссылки получает `aria-current="page"`;
- пустой `$arResult` → возвращается пустая строка, компонент ничего не рисует;
- вызов — `header.php:228`, только если `GetCurPage(false) !== SITE_DIR`.

## 7. Серверный слой

Ядро подключает `local/php_interface/init.php` до вывода страницы. Порядок
включений важен: сначала заголовки, потом хелперы, которые используют шаблон
и страницы.

| Файл (`local/php_interface/include/`) | Назначение |
|---|---|
| `nlb_security.php` | заголовки безопасности и CSP; вызов `nlb_security_headers()` из `init.php` |
| `nlb_db.php` | чтение инфоблоков: поиск по коду, количество элементов, классы оформления |
| `nlb_forms.php` | три формы заявок (`request` → `requests`, `booking` → `bookings`, `order` → `orders`), разметка `nlb_form_render()`, проверка слота и письмо |
| `nlb_push.php` | Web Push (VAPID): ключи, подписки браузеров, отправка уведомлений о брони |
| `nlb_media.php` | адаптивные изображения: `<picture>`, WebP/AVIF, `srcset` |
| `nlb_seo.php` | canonical, Open Graph, Twitter Card, robots, JSON-LD |
| `nlb_search.php` | индекс и ранжирование BM25 для мгновенной выдачи |
| `nlb_text_filter.php` | серверный фильтр сообщений чата, паритет с браузерным |

`nlb_search.php` и `nlb_text_filter.php` не входят в `init.php`: их подключают
только те точки входа, которым они нужны (`local/ajax/search.php` и
`local/ajax/chat.php`), чтобы не грузить BM25 и списки фраз на каждой странице.

Обработчики событий ядра регистрирует `nlb_forms.php`:

- `OnBeforeIBlockElementAdd` → `nlb_forms_before_add()` — согласие на обработку
  ПД, дата не в прошлом, слот не занят (проверка на сервере, не в JS);
- `OnAfterIBlockElementAdd` → `nlb_forms_after_add()` — письмо о новой заявке.

AJAX-точки входа `local/ajax/` отвечают только JSON и не рендерят HTML:

| Файл | Запрос | Ответ |
|---|---|---|
| `search.php` | `GET q=… [limit=1..10]` | `{ ok, query, count, results[] }`, 400/405/503 |
| `chat.php` | `POST message=… [sessid]` | `{ ok, verdict }`, 400/403/405/413/422/503 |
| `push.php` | `POST action=subscribe|unsubscribe` | `{ ok, … }` |

Клиентские скрипты сверх `script.js` подключаются в подвале: `pwa.js`
(service worker, офлайн-страница), `push.js` (подписка на Web Push),
`consent.js` (баннер cookie). Все три — vanilla, без сборки.

## 8. Демо-лендинг и превью

| Файл | Что это | Зачем |
|---|---|---|
| `preview/` | статические страницы с чистыми адресами | посмотреть сайт без Битрикса |
| `demo/index.php` | главная через `header.php`/`footer.php` | быстро получить главную на живом сайте |

`preview/` собирается командой `php tools/build-preview-pages.php`: каркас
берётся из `preview/index.html`, разделы и карточки — из `db/config/data/*.php`.
Запуск: `php -S 127.0.0.1:8791 -t preview`, меню ведёт на `/services/`,
`/news/`, `/events/` и остальные разделы. Кроме списков сборщик пишет
`/about/` (цифры считаются по демо-данным), `/search/` (форма и популярные
запросы без выдачи — её собирает `bitrix:search.page`), `/personal/`
(meta refresh на `/auth/`), `/404.html` и `/sitemap.xml`. Чего в превью нет
сознательно — перечислено в шапке сборщика (P1-28).

Ссылки на `styles.css` и `script.js` получают `?v=<8 символов sha256>`:
ни `php -S`, ни `python -m http.server` не отдают `Cache-Control`, и после
пересборки браузер держал старые файлы — виджет выглядел «сломанным».
Версия считается от содержимого, поэтому повторная сборка остаётся
побайтово той же.

`demo/index.php` собран из `<main>` превью: пути к картинкам заменены на
`<?= SITE_TEMPLATE_PATH ?>/assets/images/…`, ссылки — на абсолютные адреса
разделов (`/services/`, `/news/`, `/events/`, `/printing/`, `/books/`,
`/collections/`, `/contacts/`, `/subscribe/`).

## 9. Зависимости

```
Bootstrap CSS ─┐
               ├→ styles.css (переопределения) → страница
Bootstrap JS  ─┴→ script.js (поведение)
```

Внешних зависимостей нет: Bootstrap и все ассеты лежат в `assets/`, шрифты
системные, изображения — в `assets/images/`. Сайт работает в закрытом контуре
без обращений к CDN и Google Fonts.
