# Changelog

Формат — [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/),
версии — [SemVer](https://semver.org/lang/ru/).

## [0.2.0] — 03.11.2026

Публичные страницы, слой базы данных, PWA, SEO и безопасность.

### Добавлено

- **Страницы (28):** `about`, `news` (список + детальная), `events` (список +
  детальная с фильтром предстоящие/прошедшие), `services` (список + детальная),
  `printing` (список + детальная), `books` (список + детальная), `collections`
  (список + детальная), `contacts`, `feedback`, `subscribe`, `search`,
  `personal`, `auth` (вход, регистрация, забыли пароль, смена пароля),
  `rules`, `privacy`, `terms`, `sitemap`, `404.php`;
- **компонентные шаблоны:** универсальный список `news.list/nlb_cards`
  (параметр `NLB_CARD`) и детальная `news.detail/nlb_detail`
  (`NLB_BACK_URL`, `NLB_BACK_TEXT`); `main.feedback/bootstrap`;
- **база данных** `db/`: конфиг инфоблоков и демо-данных, 7 идемпотентных
  миграций на API Битрикса, `run.php`, `check.php`, `rollback.php`, `lint.php`,
  меню `top`/`bottom`, автотест на заглушках ядра (17 проверок);
- **демо-контент:** 3 типа инфоблоков, 6 инфоблоков, 31 свойство, 12 разделов,
  48 элементов (10 новостей, 6 событий, 12 книг, 6 услуг, 8 печатных услуг,
  6 коллекций);
- **PWA:** `manifest.webmanifest`, `sw.js` (кеш оболочки `nlb-shell-v1`,
  network-first для страниц, офлайн-заглушка), `offline.html`,
  `assets/js/pwa.js` (баннер «Установить приложение», инструкция для iOS),
  `assets/js/consent.js` (уведомление о cookie), 6 иконок;
- **SEO:** `local/php_interface/include/nlb_seo.php` — canonical, Open Graph,
  Twitter Card, `robots`, JSON-LD (`Library` + `WebSite`); `robots.txt`;
  `sitemap.php` (15 URL, отдаётся как `/sitemap.xml` через `urlrewrite.php`);
  `noindex` на поиске, авторизации, личном кабинете и 404;
- **безопасность:** `local/php_interface/include/nlb_security.php` — набор
  заголовков и CSP для публичных страниц; `db/.htaccess` и `tools/.htaccess`
  закрывают служебные каталоги от веба;
- `tools/optimize-images.ps1` — кадрирование и пережатие картинок;
- `og-cover.jpg` 1200×630 для карточек соцсетей.

### Изменено

- Google Fonts убран: системный шрифт, внешних запросов нет;
- картинки обрезаны под реальные пропорции вывода и пережаты:
  3722 КБ → 1813 КБ (−51 %);
- `preload` для `styles.css`, `fetchpriority="high"` у первого слайда,
  `loading="lazy"` + `decoding="async"` ниже первого экрана;
- `--nlb-notice-h` — FAB и кнопка «наверх» поднимаются над баннерами
  (`script.js`, `styles.css`);
- `README.md` переписан под публикацию на GitHub;
- `docs/security-performance.md` — реальные цифры вместо планов.

### Не проверено

- вывод страниц и компонентов в живом ядре Битрикса (нет ядра и лицензии);
- ЧПУ из `urlrewrite.php` в админке;
- `main.feedback`, `subscribe.*`, `search.page`, `system.auth.*` (нужны
  настройки почты, рассылок и индекса);
- CSP и заголовки на боевом сервере (nginx может переопределять);
- Lighthouse/PSI на домене, установка PWA на устройствах (нужен HTTPS).

## [0.1.0] — 03.11.2026

Первая поставка шаблона `nlb_bootstrap`.

### Добавлено

- шаблон сайта `local/templates/nlb_bootstrap/` для 1С-Битрикс;
- `header.php`: `<head>`, Manrope, SVG-спрайт (37 иконок), топбар, navbar,
  модалка поиска, хлебные крошки, открытие `<main>`;
- `footer.php`: подвал в 4 колонки, соцсети, подписка, FAB, кнопка «наверх»,
  модалки обратной связи и реквизитов, подключение скриптов;
- `styles.css`: дизайн-система на CSS-переменных, 15 разделов, адаптив,
  `prefers-reduced-motion`, стили печати;
- `script.js`: 9 модулей (тень шапки, reveal, скроллер, FAB, «наверх»,
  мобильное меню, автофокус поиска, валидация, Ctrl+K);
- компонентные шаблоны `bitrix:menu` (`top_bootstrap`) и `bitrix:breadcrumb`
  (`bootstrap`);
- `.description.php` — карточка шаблона в админке;
- Bootstrap 5.3.3 локально (`assets/css`, `assets/js`), без CDN и jQuery;
- 16 демо-изображений в `assets/images/`;
- `preview/index.html` — статическое превью без Битрикса;
- `demo/index.php` — демо-лендинг через `header.php`/`footer.php`;
- документация: `README.md`, `AGENTS.md`, `project-context.md`, `docs/*`
  (архитектура, установка, интеграция, Bootstrap, дизайн-система, контент,
  кастомизация, QA, безопасность, roadmap, правила агентов);
- `Что доделать.txt`, `Что сделано.txt`, `Промты.txt`, `CHANGELOG.md`;
- структурные гейты `tools/check-template.mjs` и `tools/check-docs.mjs`.

### Изменено

- дизайн Lovable (React + Tailwind) перенесён на серверный рендер: сетка
  Bootstrap, CSS-переменные вместо utility-классов, vanilla JS вместо React;
- иконки Lucide заменены на inline SVG-спрайт (без внешних зависимостей);
- формы и ссылки переведены на `SITE_DIR` для мультисайта.

### Не проверено

- живая установка в Битрикс (нет PHP/MySQL/Bitrix на машине разработки);
- `php -l` всех файлов;
- работа меню типа `top` и хлебных крошек в ядре;
- отправка форм (`main.feedback`, `subscribe.form`);
- кеш компонентов и страниц.

Подробности — `Что доделать.txt`, раздел P0.

### Известные ограничения

- демо-контакты, соцсети и реквизиты — заглушки;
- формы обратной связи и подписки не подключены к компонентам;
- изображения не оптимизированы (до 599 КБ);
- только светлая тема, только русский язык;
- нет CI, гейты запускаются вручную.
