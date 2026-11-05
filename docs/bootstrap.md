# Bootstrap 5 в шаблоне

## 1. Версия и подключение

| Файл | Версия | Откуда |
|---|---|---|
| `assets/css/bootstrap.min.css` | 5.3.3 | официальная сборка, локально |
| `assets/js/bootstrap.bundle.min.js` | 5.3.3 | включает Popper |

Порядок в `header.php`:

```html
<?php $APPLICATION->ShowHead(); ?>
<link rel="stylesheet" href="/local/templates/nlb_bootstrap/assets/css/bootstrap.min.css">
<link rel="stylesheet" href="/local/templates/nlb_bootstrap/styles.css">
```

Скрипты — в `footer.php:285`:

```html
<script src="/local/templates/nlb_bootstrap/assets/js/bootstrap.bundle.min.js"></script>
<script src="/local/templates/nlb_bootstrap/script.js"></script>
```

Правила:

- **CDN не используется.** Сайт не зависит от доступности jsdelivr/unpkg;
- **jQuery не нужен.** Bootstrap 5 работает без него, все плагины —
  `data-bs-*`;
- **порядок фиксирован:** bootstrap → styles → (в подвале) bundle → script;
- **вендорные файлы не редактируются.** Обновление — замена файла целиком.

## 2. Что из Bootstrap используется

| Компонент | Где | Как |
|---|---|---|
| Grid | все секции | `container`, `row`, `col-*`, `g-*` |
| Utilities | разметка | `d-flex`, `gap-*`, `text-center`, `mb-*`, `w-100` |
| Navbar | `header.php:104` | `navbar`, `navbar-expand-lg`, `collapse` |
| Carousel | hero | `carousel`, `carousel-fade`, `data-bs-ride` |
| Modal | поиск, обратная связь, реквизиты | `modal`, `modal-dialog`, `data-bs-toggle` |
| Collapse | мобильное меню | через navbar-toggler |
| Forms | подписка, обратная связь | `form-control`, `form-check`, `invalid-feedback` |
| Close button | модалки | `btn-close` |

Не используются (можно добавить при необходимости): tooltip, popover, toast,
offcanvas, accordion, tabs, dropdown. Если добавляете — подключайте только
через `data-bs-*` и проверяйте, что `bootstrap.bundle` уже загружен.

## 3. Сетка

Стандартные брейкпоинты, без кастомных:

```html
<!-- услуги: 1 → 2 → 3 -->
<div class="col-sm-6 col-lg-4">…</div>

<!-- новости: 1 → 2 → 4 -->
<div class="col-sm-6 col-lg-3">…</div>

<!-- коллекции: 1 → 2 → 3 -->
<div class="col-md-6 col-lg-4">…</div>

<!-- партнёры: 2 → 3 → 5 -->
<div class="col-6 col-md-4 col-lg-2">…</div>
```

Отступы сетки — `g-4` (1.5rem), в подвале `g-4 g-lg-5`. Свои `margin` у
колонок не задаются — это ломает сетку.

Контейнер — `.container` (не `.container-fluid`): контент не растягивается на
ультрашироких экранах.

## 4. Что переопределено в styles.css

Bootstrap остаётся базой, но несколько компонентов намеренно перекрыты:

| Компонент | Переопределение | Строка |
|---|---|---|
| `.btn` | скругление 999px, вес 700, паддинги | `styles.css:201` |
| `.form-control`, `.form-select` | радиус `--nlb-radius-sm`, бордер `--nlb-line` | `styles.css:303` |
| `.modal-content` | радиус 1.5rem, тень | `styles.css:329` |
| `.navbar` | свои паддинги, прозрачный фон | `styles.css:397` |
| `.nav-link` | свои паддинги, hover-фон | `styles.css:452` |
| `.carousel-indicators` | круглые точки, зелёный активный | `styles.css:607` |
| `.breadcrumb` | **не используется** — своя разметка `.breadcrumb-navigation` | `styles.css:1535` |

Важно: `.breadcrumb` Bootstrap не применяется, потому что компонент
`bitrix:breadcrumb` выводит свой `<ol class="breadcrumb-navigation">`.
Не добавляйте класс `breadcrumb` к нему — получите конфликт стилей.

## 5. Утилиты vs свои классы

Правило: **утилиты для одноразового, класс — для повторяемого**.

Можно утилитами:

```html
<div class="d-flex align-items-center justify-content-between gap-3 mb-4">
<p class="text-white-75 mb-0 small">
<div class="row g-4 justify-content-center">
```

Нужен свой класс, если:

- одинаковый набор утилит повторяется 3+ раза;
- нужны состояния (`:hover`, `.is-open`, `.active`);
- нужна адаптивность сложнее одной точки (`clamp()`, скрытие части блока);
- это часть дизайн-системы (`.btn-nlb`, `.nlb-card`, `.icon-tile`).

Нельзя:

- инлайновые `style="color:#..."` (кроме демо/отладки);
- `!important` для перекрытия Bootstrap (кроме `.visually-hidden`,
  `.text-white-75` и печати);
- свои `.row`/`.col` с фиксированной шириной.

## 6. JS-плагины: как инициализируются

Bootstrap 5 сам инициализирует всё по `data-bs-*`. Свой JS нужен только там,
где данных атрибутов не хватает.

| Плагин | Инициализация | Наш код |
|---|---|---|
| Carousel | `data-bs-ride="carousel"` на `.carousel` | не нужен |
| Collapse (navbar) | `data-bs-toggle="collapse" data-bs-target="#nlbNav"` | закрытие после клика (`script.js:442`) |
| Modal | `data-bs-toggle="modal" data-bs-target="#searchModal"` | автофокус (`script.js:455`), Ctrl+K (`script.js:578`) |
| Validation | класс `needs-validation` | обработчик submit (`script.js:466`) |

Программный вызов — только через `getOrCreateInstance`, не `new bootstrap.Modal(...)`:

```js
bootstrap.Modal.getOrCreateInstance(document.getElementById('searchModal')).show();
bootstrap.Collapse.getOrCreateInstance(document.getElementById('nlbNav')).hide();
```

`getOrCreateInstance` не создаёт дубликаты и не теряет обработчики.

## 7. Модалки: чек-лист разметки

```html
<div class="modal fade modal-nlb" id="feedbackModal" tabindex="-1"
     aria-labelledby="feedbackModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h2 class="modal-title" id="feedbackModalLabel">Обратная связь</h2>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button>
            </div>
            <div class="modal-body">…</div>
        </div>
    </div>
</div>
```

Обязательно: `tabindex="-1"`, `aria-labelledby`, `aria-hidden`, `btn-close` с
`aria-label`. Кнопка открытия — `data-bs-toggle="modal"` +
`data-bs-target="#id"`.

## 8. Формы

```html
<form class="feedback-form needs-validation" action="/feedback/" method="post" novalidate>
    <label class="form-label" for="nlbFbEmail">E-mail</label>
    <input class="form-control" id="nlbFbEmail" type="email" name="PROPERTY[EMAIL][0]" required>
    <div class="invalid-feedback">Укажите корректный e-mail.</div>
    <button class="btn btn-nlb" type="submit">Отправить</button>
</form>
```

Имена полей заявок — `PROPERTY[<ID свойства>][0]`: их подставляет
`nlb_form_render()` из `local/php_interface/include/nlb_forms.php`, а не
контент-менеджер. Вручную такие формы не верстают — подключают
`bitrix:iblock.element.add.form → bootstrap`.

- `novalidate` + `needs-validation` — валидация берётся из `script.js`;
- `invalid-feedback` должен идти **после** поля;
- у checkbox — `form-check-input` + `form-check-label`;
- на сервере всё равно проверяйте данные: клиентская валидация — удобство, не
  безопасность.

## 9. Доступность (Bootstrap-часть)

- `aria-label` у иконочных кнопок (`header-icon`, `scroller-btn`, `to-top`);
- `aria-current="page"` у активного пункта меню;
- `aria-expanded` у бургера и FAB — Bootstrap обновляет бургер сам, FAB — наш
  `script.js:93`;
- `visually-hidden` для текста, который нужен скринридеру, но не виден
  (подписи слайдов);
- `:focus-visible` задан глобально (`styles.css:82`), не убирайте его;
- `prefers-reduced-motion` отключает reveal и плавный скролл
  (`styles.css:2070`).

## 10. Обновление Bootstrap

1. Скачайте `bootstrap.min.css` и `bootstrap.bundle.min.js` нужной версии с
   официального сайта.
2. Замените файлы в `assets/`.
3. Проверьте по `qa-checklist.md`: navbar, карусель, модалки, формы, сетку.
4. Проверьте, что кастомные переменные не конфликтуют: Bootstrap 5.3 сам
   использует `--bs-*`, наши — `--nlb-*`, пересечений нет.
5. Очистите кеш Битрикса и браузера.

Менять версию в `README.md` и `project-context.md` в том же этапе — иначе
документация начнёт врать.
