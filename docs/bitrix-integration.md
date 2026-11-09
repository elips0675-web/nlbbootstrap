# Интеграция с компонентами Битрикса

Шаблон даёт разметку и стили, а данные поставляет ядро. Ниже — готовые вызовы
под классы шаблона. Все сниппеты рассчитаны на PHP-файл страницы
(`/news/index.php` и т.п.) или на `header.php`, если это глобальный блок.

Общее правило: **параметры компонента — в массив**, кеш — включён, заголовок
страницы задаётся один раз (`SetTitle`), а не компонентом, иначе на странице
появится два `<h1>`.

---

## 1. Меню

Уже подключено в `header.php:144`. Менять состав — в админке (**Структура
сайта → Меню**), а не в коде.

Файл меню лежит в корне сайта — `/.top.menu.php`: `bitrix:menu` ищет
`.<тип>.menu.php` в каталоге раздела и выше по дереву (`CMenu::Init`), поэтому
файл в подкаталоге `/menu/` компонент не видит. Создаёт файл миграция 006.

Второй уровень включён: `MAX_LEVEL => '2'`, `CHILD_MENU_TYPE => 'left'`.
Подпункты компонент берёт из `.left.menu.php` каталога раздела, а шаблон
`top_bootstrap` выводит их как Bootstrap-dropdown. Заготовки лежат в
`db/menu/services.left.menu.php` и `db/menu/printing.left.menu.php`
(копирует миграция 011).

Если нужно второе меню (например, в подвале), создайте отдельный тип `bottom`
и вызов:

```php
$APPLICATION->IncludeComponent('bitrix:menu', 'top_bootstrap', [
    'ROOT_MENU_TYPE' => 'bottom',
    'MAX_LEVEL' => '1',
    'MENU_CACHE_TYPE' => 'A',
    'MENU_CACHE_TIME' => '3600',
    'MENU_CACHE_USE_GROUPS' => 'Y',
], false, ['HIDE_ICONS' => 'Y']);
```

Шаблон `top_bootstrap` выводит `<ul class="navbar-nav mx-auto">` — для подвала
это визуально не подходит. Либо сделайте второй шаблон компонента
(`menu/bottom_links/template.php`) с классом `footer-links`, либо оставьте
подвал статическим (как сейчас, `footer.php:51`).

---

## 2. Хлебные крошки

Уже подключены в `header.php:228`:

```php
$APPLICATION->IncludeComponent('bitrix:breadcrumb', 'bootstrap', [
    'START_FROM' => '0',
    'PATH' => '',
    'SITE_ID' => SITE_ID,
], false);
```

`START_FROM => 0` — цепочка от корня сайта. Если нужно начинать с раздела
(например, не показывать «Главная»), поставьте `START_FROM` равным ID раздела.

Шаблон крошек обязан **вернуть** разметку строкой, а не напечатать её:
`bitrix:breadcrumb` вызывает шаблон из отложенной функции
`$APPLICATION->AddBufferContent()` с `$bIncludeOnce = true`, и `include`
возвращает то, что шаблон вернул. При печати крошки уезжают в начало
документа, а в контейнер `.page-head` попадает `1` — результат `include`
(так было до 08.11.2026, `docs/architecture.md`, раздел про крошки).

---

## 3. Новости: список

Инфоблок `news` уже создаётся миграциями `db/` (тип `nlb_content`, свойства
`AUTHOR`, `TAGS`, `READ_TIME`, `SOURCE_URL`) — см. `db.md`. Вручную в админке
ничего заводить не нужно.

Вызов на главной:

```php
$APPLICATION->IncludeComponent('bitrix:news.list', 'news_cards', [
    'IBLOCK_TYPE' => 'nlb_content',
    'IBLOCK_ID' => nlb_iblock_id('news'),   // не число: ID на каждой установке свой
    'NEWS_COUNT' => 4,
    'SORT_BY1' => 'ACTIVE_FROM',
    'SORT_ORDER1' => 'DESC',
    'SORT_BY2' => 'SORT',
    'SORT_ORDER2' => 'ASC',
    'FIELD_CODE' => ['NAME', 'PREVIEW_TEXT', 'PREVIEW_PICTURE', 'ACTIVE_FROM', 'DETAIL_PAGE_URL'],
    'PROPERTY_CODE' => ['AUTHOR', 'TAGS'],
    'CHECK_DATES' => 'Y',
    'SET_TITLE' => 'N',
    'SET_LAST_MODIFIED' => 'N',
    'INCLUDE_IBLOCK_INTO_CHAIN' => 'N',
    'ADD_SECTIONS_CHAIN' => 'N',
    'CACHE_TYPE' => 'A',
    'CACHE_TIME' => '3600',
    'CACHE_GROUPS' => 'Y',
    'DISPLAY_TOP_PAGER' => 'N',
    'DISPLAY_BOTTOM_PAGER' => 'N',
], false, ['HIDE_ICONS' => 'Y']);
```

Шаблон компонента `news_cards` нужно создать (см. п. 9) — стандартный
`.default` выведет свою таблицу и не попадёт в дизайн.

Для страницы «Все новости» — тот же вызов с `NEWS_COUNT => 12`,
`DISPLAY_BOTTOM_PAGER => 'Y'`, `PAGER_TEMPLATE => 'bootstrap'` (шаблон
постранички можно не создавать, стандартный `modern` тоже подойдёт).

---

## 4. Новости: детальная страница

```php
$APPLICATION->IncludeComponent('bitrix:news.detail', 'article', [
    'IBLOCK_TYPE' => 'nlb_content',
    'IBLOCK_ID' => nlb_iblock_id('news'),
    'ELEMENT_ID' => $ELEMENT_ID,      // или ELEMENT_CODE
    'FIELD_CODE' => ['NAME', 'PREVIEW_TEXT', 'DETAIL_TEXT', 'DETAIL_PICTURE', 'ACTIVE_FROM'],
    'PROPERTY_CODE' => ['AUTHOR', 'TAGS', 'READ_TIME'],
    'SET_TITLE' => 'Y',
    'SET_BROWSER_TITLE' => 'Y',
    'SET_META_DESCRIPTION' => 'Y',
    'SET_META_KEYWORDS' => 'N',
    'INCLUDE_IBLOCK_INTO_CHAIN' => 'N',
    'ADD_SECTIONS_CHAIN' => 'Y',
    'CACHE_TYPE' => 'A',
    'CACHE_TIME' => '3600',
], false, ['HIDE_ICONS' => 'Y']);
```

В шаблоне `article` детальный текст оборачивается в `.bitrix-content` — тогда
работают стили абзацев, списков, цитат и картинок (`styles.css:2435`).

---

## 5. События (афиша)

События — отдельный инфоблок `events` (тип `nlb_content`), создаётся
миграциями `db/`. Свойства:

| Свойство | Тип | Назначение |
|---|---|---|
| `DATE` | Дата/Время | дата и время начала |
| `PLACE` | Строка | зал/площадка |
| `CATEGORY` | Список | `literature`, `children`, `tech`, `lecture` |
| `FORMAT` | Список | `offline`, `online`, `hybrid` |
| `SEATS` | Число | количество мест |
| `PRICE` | Строка | «Бесплатно» |
| `DURATION` | Строка | «1,5 часа» |
| `REGISTER_URL` | Строка | ссылка на регистрацию |

> **Важно.** Дата мероприятия — свойство `DATE`, а `ACTIVE_FROM` — дата
> публикации. Иначе `CHECK_DATES => 'Y'` скроет будущие события из афиши.

```php
$APPLICATION->IncludeComponent('bitrix:news.list', 'events_cards', [
    'IBLOCK_TYPE' => 'nlb_content',
    'IBLOCK_ID' => nlb_iblock_id('events'),
    'NEWS_COUNT' => 3,
    'SORT_BY1' => 'PROPERTY_DATE',
    'SORT_ORDER1' => 'ASC',
    'FIELD_CODE' => ['NAME', 'PREVIEW_TEXT', 'PREVIEW_PICTURE', 'DETAIL_PAGE_URL'],
    'PROPERTY_CODE' => ['DATE', 'PLACE', 'CATEGORY', 'FORMAT', 'SEATS', 'PRICE', 'DURATION', 'REGISTER_URL'],
    'CHECK_DATES' => 'N',           // афиша показывает и будущие, и прошедшие
    'SET_TITLE' => 'N',
    'CACHE_TYPE' => 'A',
    'CACHE_TIME' => '1800',
], false, ['HIDE_ICONS' => 'Y']);
```

Сортировка по `PROPERTY_DATE` требует, чтобы свойство было объявлено с
`USER_TYPE => 'DateTime'` (так и сделано в `db/config/iblocks.php`).

Карточка события использует `.nlb-card`, `.event-cat`, `.event-date`,
`.event-meta`, `.event-btn`. Дата в бейдже — день и месяц:

```php
<?php
$raw = (string)($arItem['PROPERTIES']['DATE']['VALUE'] ?? '');
$date = $raw !== '' ? strtotime($raw) : time();
$day = date('d', $date);
$month = FormatDate('M', $date); // «ноя»
$time = date('H:i', $date);
?>
<span class="event-date"><b><?= $day ?></b><span><?= $month ?></span></span>
<span class="event-meta"><?= htmlspecialcharsbx($time) ?> · <?= htmlspecialcharsbx($arItem['PROPERTIES']['PLACE']['VALUE']) ?></span>
```

Категория задаёт цвет бейджа:

| XML_ID категории | Класс |
|---|---|
| `literature` | `bg-grad-sky` |
| `children` | `bg-grad-pink` |
| `tech` | `bg-grad-green` |
| `lecture` | `bg-grad-orange` |

В шаблоне сравнивайте `$arItem['PROPERTIES']['CATEGORY']['XML_ID']` (он есть,
если в `PROPERTY_CODE` указана `CATEGORY`), а не русский текст значения.

Кнопка «Зарегистрироваться» ведёт на `REGISTER_URL` или на форму
`/feedback/?event=<XML_ID>` (демо-данные уже содержат такие ссылки).

---

## 6. Печатные услуги (скроллер)

Инфоблок `printing` со свойствами `PRICE_FROM` (число), `ICON` (строка-код
иконки), `COLOR` (список: primary/green/sky/pink/orange).

Контейнер скроллера уже размечен в `demo/index.php`; для динамики:

```php
<div class="scroller-wrap" data-scroller>
    <div class="scroller" role="list">
        <?php foreach ($arResult['ITEMS'] as $arItem): ?>
            <article class="print-card" role="listitem">
                <div class="print-media">
                    <img src="<?= htmlspecialcharsbx($arItem['PREVIEW_PICTURE']['SRC']) ?>"
                         alt="<?= htmlspecialcharsbx($arItem['NAME']) ?>" loading="lazy">
                    <span class="print-badge bg-grad-primary">
                        <svg class="i" aria-hidden="true"><use href="#i-<?= htmlspecialcharsbx($arItem['PROPERTIES']['ICON']['VALUE']) ?>"/></svg>
                    </span>
                </div>
                <div class="print-body">
                    <h3 class="print-title"><?= htmlspecialcharsbx($arItem['NAME']) ?></h3>
                    <p class="print-text"><?= $arItem['PREVIEW_TEXT'] ?></p>
                    <div class="fw-bold text-dark mb-2">от <?= (int)$arItem['PROPERTIES']['PRICE_FROM']['VALUE'] ?> ₽</div>
                    <a class="print-link" href="<?= htmlspecialcharsbx($arItem['DETAIL_PAGE_URL']) ?>">
                        Подробнее
                        <svg class="i" aria-hidden="true"><use href="#i-arrow-right"/></svg>
                    </a>
                </div>
            </article>
        <?php endforeach; ?>
    </div>
    <button class="scroller-btn scroller-btn--prev" type="button" data-scroll-prev aria-label="Предыдущие услуги">…</button>
    <button class="scroller-btn scroller-btn--next" type="button" data-scroll-next aria-label="Следующие услуги">…</button>
</div>
```

Если `ICON` пуст, подставляйте `printer` — иначе `<use href="#i-">` не найдёт
символ и иконка исчезнет.

---

## 7. Счётчики и цифры: только количество

В структуре `db/` **нет счётчиков** услуг, просмотров, заказов и «сколько раз
воспользовались». Придумывать числа нельзя, поэтому на сайте показываем
только **количество активных элементов инфоблока**.

Готовые помощники — `db/lib/helpers.php`:

```php
nlb_iblock_count('services');  // сколько активных услуг
nlb_iblock_count('books');     // сколько сувениров в каталоге
nlb_counts();                  // массив по всем шести инфоблокам
```

Пример блока цифр на главной или странице «О библиотеке»:

```php
<?php
$counts = nlb_counts();
$stats = [
    ['value' => $counts['books'],       'label' => 'сувениров',         'anchor' => '/books/'],
    ['value' => $counts['events'],      'label' => 'событий в афише',   'anchor' => '/events/'],
    ['value' => $counts['news'],        'label' => 'новостей',          'anchor' => '/news/'],
    ['value' => $counts['services'],    'label' => 'услуг',             'anchor' => '/services/'],
    ['value' => $counts['printing'],    'label' => 'печатных услуг',    'anchor' => '/printing/'],
    ['value' => $counts['collections'], 'label' => 'подарочных наборов', 'anchor' => '/collections/'],
];
?>
<div class="row g-3">
    <?php foreach ($stats as $stat): ?>
        <div class="col-6 col-lg-2">
            <a class="stat-card d-block text-decoration-none" href="<?= $stat['anchor'] ?>">
                <span class="stat-value"><?= (int)$stat['value'] ?></span>
                <span class="stat-label"><?= htmlspecialcharsbx($stat['label']) ?></span>
            </a>
        </div>
    <?php endforeach; ?>
</div>
```

Классы `.stat-card`, `.stat-value`, `.stat-label` нужно добавить в `styles.css`
(секция «Внутренние страницы»), если блок используется. Без них это будет
обычная сетка Bootstrap.

Что это даёт:

- число всегда совпадает с контентом — добавили услугу, счётчик вырос;
- нет «магических» 500 000 книг из демо-текста;
- не нужен отдельный модуль статистики.

Если позже понадобится именно счётчик просмотров или заказов — это отдельная
задача: модуль «Статистика»/«Реклама» или внешняя аналитика. В бэклоге —
`P2-9`, не P0.

---

## 8. Обратная связь, брони и заказы

Все три формы сайта — это один шаблон
`bitrix:iblock.element.add.form → bootstrap` и три инфоблока из
`db/config/iblocks.php`. Заявка **сохраняется в базе** (элемент инфоблока),
письмо — только уведомление поверх записи. Модуль «Веб-формы» и платные
CRM-формы не нужны.

| Форма | Где | Инфоблок | Тип в `NLB_FORM` |
|---|---|---|---|
| Обращение | `/feedback/` и модалка в подвале | `requests` | `request` |
| Бронь услуги | `/services/<код>/#booking` | `bookings` | `booking` |
| Заказ сувенира | `/books/<код>/#order` | `orders` | `order` |

Подключение (пример для обратной связи):

```php
$APPLICATION->IncludeComponent('bitrix:iblock.element.add.form', 'bootstrap', [
    'IBLOCK_TYPE' => 'nlb_content',
    'IBLOCK_ID' => nlb_iblock_id('requests'),
    'PROPERTY_CODES' => nlb_form_property_codes('request'),
    'PROPERTY_CODES_REQUIRED' => nlb_form_required_codes('request'),
    'GROUPS' => [2],
    'STATUS_NEW' => '',
    'ELEMENT_ASSOC' => 'NONE',
    'MAX_USER_ENTRIES' => 0,
    'USE_CAPTCHA' => 'Y',
    'SEF_MODE' => 'N',
    'LIST_URL' => nlb_form_success_url('request'),
    'SET_TITLE' => 'N',
    'NLB_FORM' => 'request',
    'NLB_VALUES' => ['PAGE' => $APPLICATION->GetCurPage()],
], false, ['HIDE_ICONS' => 'Y']);
```

Что настроено в коде:

- `local/php_interface/include/nlb_forms.php` — конфиг полей, разметка
  (`nlb_form_render()`), проверка слотов, обработчики событий инфоблока;
- `nlb_form_property_codes()` / `nlb_form_required_codes()` — коды свойств
  для параметров компонента, чтобы не дублировать списки;
- `OnBeforeIBlockElementAdd` — согласие на обработку данных, пустые
  обязательные поля, кривой e-mail, дата не в прошлом, занятый слот
  (серверная проверка, не зависит от JS);
- `OnAfterIBlockElementAdd` — письмо `NLB_NEW_REQUEST` через `CEvent::Send`.
  Если почта не настроена, заявка всё равно остаётся в инфоблоке;
- `OnBeforeIBlockElementAdd` дополнительно пишет `SOURCE` — канал заявки
  (`nlb_form_source_value()`): `utm_source`/`utm_medium` → `utm:<slug>`,
  внешний `HTTP_REFERER` → `ref:<host>`, свой домен → `site`, ничего →
  `direct`. Скрытое поле в форме не нужно;
- `OnAfterIBlockElementUpdate` — при закрытии статуса (`request` → `done`;
  `booking` → `confirmed`/`cancelled`; `order` → `done`/`cancelled`) ставит
  `DATE_PROCESSED` и `CREATED_BY` (логин `$USER`, иначе ID). Возврат в
  открытый статус очищает дату.

Права: у инфоблоков заявок группа 2 «Все пользователи» имеет `W` (запись),
иначе анонимная форма не создаст элемент. Поисковый индекс выключен, чтобы
персональные данные не попадали в поиск.

`GROUPS => [2]` в параметрах компонента — не то же самое, что пустой массив:
с `[]` компонент показывает гостю форму, но при отправке не даёт группе 2
добавить элемент, и заявка теряется с ошибкой прав. Поэтому во всех трёх
вызовах (`feedback/index.php`, `services/detail.php`, `books/detail.php`)
стоит `[2]`.

Поля `CODE` и `XML_ID` у инфоблоков `requests`, `bookings`, `orders` не
обязательны: формы их не передают. Миграция `002_iblocks.php` снимает
обязательность через `nlb_iblock_relax_code()`, а код элемента генерирует
`OnBeforeIBlockElementAdd` в `nlb_forms.php` — иначе Битрикс отклоняет
добавление на проверке обязательных полей.

**Формы без JavaScript.** В разметке нет `novalidate`, у обязательных полей
стоит `required`, поэтому браузер с выключенным JS сам не даёт отправить
пустую заявку. `script.js:1374` выставляет `form.noValidate = true` только
при загруженном скрипте — дальше проверку показывает Bootstrap
(`.was-validated`). Второй рубеж — сервер: `nlb_forms_before_add()` сверяет
обязательные поля из конфига (`nlb_forms_required_labels()`,
`nlb_forms_missing_required()`), формат e-mail и дату брони. Проверки —
`db/tests/forms-validation.php` в общем прогоне `db/tests/run.php`, гейт §11.3
`tools/check-template.mjs` (форма без `novalidate`, `required` в разметке,
`noValidate` в скрипте, серверная проверка в библиотеке).

**Колонки списка заявок.** Свойства в списке элементов по умолчанию не
показываются, поэтому миграция `013_request_source.php` вызывает
`CGridOptions::SetDefaultView()` для grid `tbl_iblock_list_` + md5 от
`<тип>.<ID>` и задаёт набор `ID`, `NAME`, `STATUS`, `SOURCE`, `CREATED_BY`,
`DATE_PROCESSED`, `TIMESTAMP_X` (сортировка по `ID` вниз, 20 строк). Метод
пишет настройку в `main.interface.grid.common` и действует, только если у
сотрудника нет своей сохранённой вьюхи — иначе вернуть набор кнопкой
«Настроить список → По умолчанию». `SOURCE` заполняется из utm-меток и
referer, `DATE_PROCESSED`/`CREATED_BY` — при закрытии статуса (см. выше).

Почтовое событие создаёт миграция `008_requests.php`. В админке проверьте:
**Настройки → Настройки продукта → Почтовые события → Почтовые шаблоны** →
`NLB_NEW_REQUEST`. Поле `EMAIL_TO` в шаблоне — реальный ящик библиотеки;
демо-адрес `info@example.by` в продакшене не используйте.

Модалка в подвале отправляет POST на `/feedback/`, поэтому её обрабатывает
тот же компонент, что и страницу: второй инфоблок и второй обработчик не
нужны. После успешной отправки страница возвращается с `?sent=1#form` и
показывает сообщение вместо формы.

> **Не проверено:** на машине разработки нет ядра и лицензии Битрикса,
> поэтому реальная запись в БД, CAPTCHA и отправка письма не выполнялись.
> Проверены только разметка (на заглушках), синтаксис PHP и миграции.

Альтернативы, если понадобится больше:

| Вариант | Цена | Когда нужен |
|---|---|---|
| `iblock.element.add.form` | бесплатно | заявка должна храниться в базе сайта |
| `bitrix:form` (модуль «Веб-формы») | входит в редакции от «Малый бизнес» | несколько форм, статусы, экспорт |
| CRM-формы | по подписке (CRM / «Маркетинг 24») | заявки должны попадать в CRM |

---

## 9. Подписка

Форма в подвале (`footer.php:92`) отправляет `EMAIL` на `/subscribe/`.

Подписка — **бесплатный** модуль «Рассылки» (`subscribe`), входит в редакцию
«Старт». Платить нужно только за внешний сервис рассылок, если он понадобится.

Страница `/subscribe/index.php`:

```php
$APPLICATION->IncludeComponent('bitrix:subscribe.form', '', [
    'USE_PERSONALIZATION' => 'Y',
    'SHOW_HIDDEN' => 'N',
    'PAGE' => '/subscribe/',
    'CACHE_TYPE' => 'A',
    'CACHE_TIME' => '3600',
], false);
```

Редактирование подписки и отписка:

```php
$APPLICATION->IncludeComponent('bitrix:subscribe.edit', '', [
    'SHOW_HIDDEN' => 'N',
    'SET_TITLE' => 'Y',
    'CACHE_TYPE' => 'A',
    'CACHE_TIME' => '3600',
], false);
```

Не забудьте:

- **Настройки → Настройки продукта → Настройки модулей → Рассылки** — укажите
  `EMAIL` отправителя и включите «Автоматическая отправка»;
- настройте cron/агент: `bitrix/modules/subscribe/admin/subscribe_agent.php`
  или стандартный `cron` на `/bitrix/modules/main/tools/cron_events.php`;
- проверьте, что письмо-подтверждение уходит (**Рассылки → Журнал**).

Демо-форма в подвале после подключения компонента должна быть заменена на
вызов `subscribe.form` или оставлена как быстрый «подписаться» с переходом на
страницу.

---

## 10. Поиск

Модалка поиска (`header.php:191`) отправляет `GET /search/?q=…`.

Страница `/search/index.php`:

```php
$APPLICATION->IncludeComponent('bitrix:search.page', '', [
    'RESTART' => 'N',
    'NO_WORD_LOGIC' => 'N',
    'CHECK_DATES' => 'Y',
    'USE_TITLE_RANK' => 'N',
    'DEFAULT_SORT' => 'rank',
    'DISPLAY_TOP_PAGER' => 'N',
    'DISPLAY_BOTTOM_PAGER' => 'Y',
    'PAGER_TITLE' => 'Результаты поиска',
    'PAGER_SHOW_ALWAYS' => 'N',
    'PAGER_TEMPLATE' => '',
    'PAGER_DESC_NUMBERING' => 'N',
    'PAGER_DESC_NUMBERING_CACHE_TIME' => '36000',
    'SHOW_LOGIN' => 'N',
    'arrFILTER' => ['iblock_news', 'iblock_events', 'iblock_books', 'iblock_services', 'iblock_printing', 'iblock_collections'],
    'CACHE_TYPE' => 'A',
    'CACHE_TIME' => '3600',
], false);
```

Проверьте:

- **Настройки → Настройки продукта → Настройки модулей → Поиск** — включена
  индексация;
- **Поиск → Переиндексация** — запустить после наполнения инфоблоков;
- в `arrFILTER` — реальные коды (или ID) инфоблоков, иначе поиск вернёт пусто.

Форма в шапке не обязана быть компонентом: параметр `q` — стандартный для
`search.page`.

### Мгновенная выдача (BM25)

Модалка дополнительно запрашивает `local/ajax/search.php` (адрес задан в
`header.php:200`) и рисует подсказки из готового индекса
`db/search/index.json`. Индекс собирает `php tools/build-search-index.php`:
на живом ядре документы берутся из инфоблоков **вместе со свойствами**
(`AUTHOR`, `TAGS`, `PRICE`, `YEAR` и другие из белого списка
`nlb_search_property_text()`), без ядра — из `db/config/data/*.php`.
Значения списков индексируются текстом («Книги»), а не ID значения.

### Обновление индекса

`local/php_interface/init.php` подключает `nlb_search.php`, а библиотека
подписывает `OnAfterIBlockElementAdd`, `OnAfterIBlockElementUpdate` и
`OnAfterIBlockElementDelete` на `nlb_search_index_event()`. Событие только
ставит флаг «индекс устарел» и один раз подписывает
`register_shutdown_function`; пересборка идёт после ответа, поэтому
сохранение элемента в админке не ждёт 99 документов. Несколько правок в
одном запросе дают одну пересборку, а правка заявки — ни одной:
`nlb_search_iblock_map()` не берёт инфоблоки с `index => 'N'`
(`requests`, `bookings`, `orders`), и персональные данные в поиск не
попадают.

Индекс остаётся файлом `db/search/index.json`: каталог закрыт от веба
(`.htaccess` + `robots.txt`), читается одним `json_decode`, виден в
репозитории. Опция/кеш Битрикса не подошли: кеш пришлось бы чистить при
каждой правке, а файл пересобирается целиком и атомарно (временный файл с
PID → `rename`), так что читатель не увидит половину JSON. На проде
веб-пользователю нужна **запись** в `db/search/` (в контейнере — `www-data`);
без неё пересборка молча не сохранится, и останется ручная команда или cron.

Ручная команда остаётся для первого запуска: `php tools/build-search-index.php`.
Свежесть демо-источников сторожит `--check`, но на живой базе он сверяет
`db/config/data/*.php`, а не содержимое БД.

### Страница `/search/`

`search/index.php` не отдаёт штатный компонент безусловно:
`nlb_search_page_state()` возвращает режим (`empty`, `results`, `none`,
`fallback`), и страница рисует BM25-выдачу теми же классами
`.search-instant`, что и модалка. `bitrix:search.page` подключается только
в режиме `fallback` — когда индекс отсутствует или битый; тогда поиск
продолжает работать по индексу Битрикса, а сверху появляется пометка.
Поэтому `/search/?q=…` и мгновенная подсказка отвечают одинаково.

### Python-сервис

Мануал предлагает FastAPI + rank-bm25. Для shared-хостинга это
неприменимо (Python нет), для VPS — второй процесс без выигрыша: BM25 —
арифметика, и PHP считает её за миллисекунды. Решение: остаёмся на PHP.
Отдельный сервис имеет смысл только под эмбеддинги или LLM-ответы, которых
в текущем объёме нет.

---

## 11. Авторизация и личный кабинет

Ссылки шаблона ведут на `/auth/` и `/personal/` (`header.php:168`, `:175`).

`/auth/index.php`:

```php
if (!$USER->IsAuthorized()) {
    // Форма входа
    $APPLICATION->IncludeComponent('bitrix:system.auth.authorize', '', [
        'REGISTER_URL' => '/auth/register/',
        'FORGOT_PASSWORD_URL' => '/auth/forgot/',
        'PROFILE_URL' => '/personal/',
        'SHOW_ERRORS' => 'Y',
    ], false);
} else {
    // «Вы вошли как …» + выход
    $APPLICATION->IncludeComponent('bitrix:system.auth.form', '', [
        'REGISTER_URL' => '/auth/register/',
        'FORGOT_PASSWORD_URL' => '/auth/forgot/',
        'PROFILE_URL' => '/personal/',
        'SHOW_ERRORS' => 'Y',
    ], false);
}
```

`/personal/index.php`:

```php
$APPLICATION->IncludeComponent('bitrix:main.profile', '', [
    'SET_TITLE' => 'Y',
    'SEND_INFO' => 'N',
    'CHECK_RIGHTS' => 'Y',
    'USER_PROPERTY' => ['PERSONAL_PHONE', 'PERSONAL_CITY'],
], false);
```

`/auth/register/` — `bitrix:system.auth.registration`,
`/auth/forgot/` — `bitrix:system.auth.forgotpasswd`,
`/auth/change/` — `bitrix:system.auth.changepasswd`.

После настройки проверьте: вход, выход, восстановление пароля, письмо.
Шаблон только переключает кнопку «Войти»/«Кабинет» по `$USER->IsAuthorized()`
— сами страницы должны существовать, иначе будет 404.

---

## 12. Карта сайта

`/sitemap/index.php`:

```php
$APPLICATION->IncludeComponent('bitrix:main.map', '', [
    'LEVEL' => '3',
    'COL_NUM' => '2',
    'SHOW_DESCRIPTION' => 'N',
    'SET_TITLE' => 'Y',
    'CACHE_TYPE' => 'A',
    'CACHE_TIME' => '3600',
], false);
```

XML-карта для поисковиков — **Настройки → Настройки продукта → Настройки
модулей → Главный модуль → Карта сайта** или модуль `search` →
`sitemap.php`. Ссылка в подвале ведёт на `/sitemap/`, не на XML — это
человеческая карта.

---

## 13. Шаблоны компонентов, которые нужно создать

| Компонент | Шаблон | Зачем |
|---|---|---|
| `bitrix:news.list` | `news_cards` | карточки новостей `.nlb-card` |
| `bitrix:news.list` | `events_cards` | карточки событий с датой и категорией |
| `bitrix:news.detail` | `article` | детальная с `.bitrix-content` |
| `bitrix:iblock.element.add.form` | `bootstrap` | формы обращений, броней и заказов |
| `bitrix:search.page` | `bootstrap` (опц.) | результаты в стилях шаблона |

Путь: `local/templates/nlb_bootstrap/components/bitrix/<компонент>/<шаблон>/template.php`.
После создания — очистить кеш.

Пример `news_cards`:

```php
<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}
$this->setFrameMode(true);
?>
<div class="row g-4">
    <?php foreach ($arResult['ITEMS'] as $arItem):
        $this->AddEditAction($arItem['ID'], $arItem['EDIT_LINK'], CIBlock::GetArrayByID($arItem['IBLOCK_ID'], 'ELEMENT_EDIT'));
        $this->AddDeleteAction($arItem['ID'], $arItem['DELETE_LINK'], CIBlock::GetArrayByID($arItem['IBLOCK_ID'], 'ELEMENT_DELETE'), ['CONFIRM' => 'Удалить новость?']);
        $img = $arItem['PREVIEW_PICTURE']['SRC'] ?? SITE_TEMPLATE_PATH . '/assets/images/news-1.jpg';
        ?>
        <div class="col-sm-6 col-lg-3" id="<?= $this->GetEditAreaId($arItem['ID']) ?>">
            <article class="nlb-card">
                <a class="d-block h-100" href="<?= htmlspecialcharsbx($arItem['DETAIL_PAGE_URL']) ?>">
                    <div class="nlb-card__media">
                        <img src="<?= htmlspecialcharsbx($img) ?>"
                             alt="<?= htmlspecialcharsbx($arItem['NAME']) ?>" loading="lazy">
                    </div>
                    <div class="nlb-card__body">
                        <p class="news-date"><?= $arItem['DISPLAY_ACTIVE_FROM'] ?></p>
                        <h3 class="news-title"><?= htmlspecialcharsbx($arItem['NAME']) ?></h3>
                        <?php if ($arItem['PREVIEW_TEXT'] !== ''): ?>
                            <p class="news-text clamp-2"><?= $arItem['PREVIEW_TEXT'] ?></p>
                        <?php endif; ?>
                    </div>
                </a>
            </article>
        </div>
    <?php endforeach; ?>
</div>
```

`AddEditAction`/`GetEditAreaId` нужны, чтобы в режиме правки у каждой карточки
была иконка «редактировать». Без них шаблон работает, но контент-менеджер
теряет быстрый доступ.

---

## 14. Кеш и сброс

| Компонент | `CACHE_TYPE` | `CACHE_TIME` |
|---|---|---|
| Меню | `A` | 3600 |
| Крошки | — | без кеша |
| Новости/события | `A` | 3600 |
| Детальная | `A` | 3600 |
| Поиск | `A` | 3600 |

`A` — автоматический кеш с учётом групп пользователей. Если контент меняется
часто (афиша на сегодня), поставьте `CACHE_TIME => 300`.

Правка файла меню (`.top.menu.php`) видна только после сброса кеша: файл не
меняет дату элементов инфоблока, а кеш `bitrix:menu` живёт `MENU_CACHE_TIME`.
Правка элемента инфоблока сбрасывает свой тег и видна сразу — проверено на
живом ядре (Stage 70).

После правки шаблона компонента кеш сбрасывается кнопкой **Сбросить кеш** на
панели или через **Настройки → Автокеширование → Очистить весь кеш**.

---

## 15. Бесплатно или по подписке

Всё, что нужно сайту библиотеки, закрывается штатными модулями. Платные
подписки — только для расширений.

| Задача | Компонент / модуль | Цена |
|---|---|---|
| Меню, крошки | `bitrix:menu`, `bitrix:breadcrumb` | бесплатно |
| Новости, события, каталог | `bitrix:news.list`, `bitrix:news.detail` | бесплатно |
| Поиск | `bitrix:search.page`, модуль «Поиск» | бесплатно |
| Обращения, брони, заказы | `bitrix:iblock.element.add.form`, инфоблоки `requests`/`bookings`/`orders` | бесплатно |
| Подписка на рассылку | `bitrix:subscribe.form`, модуль «Рассылки» | бесплатно |
| Вход и профиль | `bitrix:system.auth.*`, `bitrix:main.profile` | бесплатно |
| Карта сайта | `bitrix:main.map` | бесплатно |
| Кеш, сжатие, бэкапы | штатные настройки | бесплатно |
| Формы с заявками в CRM | CRM-формы | по подписке |
| Массовые рассылки с аналитикой | «Маркетинг 24» | по подписке |
| SMS-уведомления | SMS-сервис | по подписке |
| Счётчик просмотров услуг | модуль «Статистика»/внешняя аналитика | бесплатно/по подписке |

Правило: если задачу решает штатный компонент — берём его; подписку
предлагаем только когда нужна CRM, массовые рассылки или SMS. Выбор
фиксируется в `Что доделать.txt`, а не в коде страницы.
