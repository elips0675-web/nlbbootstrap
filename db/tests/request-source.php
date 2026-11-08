<?php
/**
 * Проверка источника заявки, даты обработки и ответственного (миграция 013).
 *
 * Зачем тест: три свойства и обработчик смены статуса — единственное место,
 * где считается «какой канал приносит заявки» и «сколько висит без ответа».
 * Ошибка здесь не падает, а тихо врёт в аналитике.
 *
 * Запускается из db/tests/run.php в песочнице с заглушками ядра.
 *
 * Запуск: php db/tests/request-source.php
 * Выход:  0 — свойства, источник и даты корректны, 1 — расхождение.
 */

declare(strict_types=1);

require __DIR__ . '/../lib/boot.php';

if (!function_exists('htmlspecialcharsbx')) {
    function htmlspecialcharsbx($value): string
    {
        return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}

if (!function_exists('AddEventHandler')) {
    function AddEventHandler(string $module, string $event, string $handler): void
    {
        $GLOBALS['nlb_test_handlers'][$module . ':' . $event][] = $handler;
    }
}

require nlb_root() . '/local/php_interface/include/nlb_db.php';
require nlb_root() . '/local/php_interface/include/nlb_forms.php';

$errors = [];

function nlb_src_check(bool $condition, string $message): void
{
    global $errors;
    if (!$condition) {
        $errors[] = $message;
    }
}

function nlb_src_property(int $iblockId, string $code): array
{
    foreach (NlbStubStore::$properties as $property) {
        if ((int)$property['IBLOCK_ID'] === $iblockId && (string)$property['CODE'] === $code) {
            return $property;
        }
    }
    return [];
}

function nlb_src_source(array $get, array $server = []): string
{
    $_GET = $get;
    $_POST = [];
    $_SERVER['HTTP_HOST'] = $server['HTTP_HOST'] ?? 'example.by';
    if (array_key_exists('HTTP_REFERER', $server)) {
        $_SERVER['HTTP_REFERER'] = $server['HTTP_REFERER'];
    } else {
        unset($_SERVER['HTTP_REFERER']);
    }
    return nlb_form_source_value();
}

function nlb_src_after_update(int $elementId, int $iblockId): void
{
    $fields = ['ID' => $elementId, 'IBLOCK_ID' => $iblockId];
    nlb_forms_after_update($fields);
}

/* 1. Обработчик смены статуса зарегистрирован. */
$handlers = $GLOBALS['nlb_test_handlers']['iblock:OnAfterIBlockElementUpdate'] ?? [];
nlb_src_check(
    in_array('nlb_forms_after_update', $handlers, true),
    'OnAfterIBlockElementUpdate не подписан на nlb_forms_after_update'
);

/* 2. Три свойства есть в трёх инфоблоках заявок. */
$iblocks = [];
foreach (['requests', 'bookings', 'orders'] as $code) {
    $iblockId = nlb_iblock_id($code);
    $iblocks[$code] = $iblockId;
    nlb_src_check($iblockId > 0, "не найден инфоблок {$code}");

    $source = nlb_src_property($iblockId, 'SOURCE');
    $createdBy = nlb_src_property($iblockId, 'CREATED_BY');
    $processed = nlb_src_property($iblockId, 'DATE_PROCESSED');

    nlb_src_check($source !== [], "{$code}: нет свойства SOURCE");
    nlb_src_check($createdBy !== [], "{$code}: нет свойства CREATED_BY");
    nlb_src_check($processed !== [], "{$code}: нет свойства DATE_PROCESSED");

    if ($source !== []) {
        nlb_src_check((string)$source['PROPERTY_TYPE'] === 'S', "{$code}.SOURCE: тип не S");
        nlb_src_check((string)$source['FILTRABLE'] === 'Y', "{$code}.SOURCE: не участвует в фильтре");
    }
    if ($createdBy !== []) {
        nlb_src_check((string)$createdBy['PROPERTY_TYPE'] === 'S', "{$code}.CREATED_BY: тип не S");
        nlb_src_check((string)$createdBy['FILTRABLE'] === 'Y', "{$code}.CREATED_BY: не участвует в фильтре");
    }
    if ($processed !== []) {
        nlb_src_check((string)$processed['PROPERTY_TYPE'] === 'S', "{$code}.DATE_PROCESSED: тип не S");
        nlb_src_check(
            (string)$processed['USER_TYPE'] === 'DateTime',
            "{$code}.DATE_PROCESSED: нет user_type DateTime"
        );
        nlb_src_check((string)$processed['FILTRABLE'] === 'Y', "{$code}.DATE_PROCESSED: не участвует в фильтре");
    }
}

/* 3. Колонки админ-списка заданы по умолчанию. */
foreach ($iblocks as $code => $iblockId) {
    $gridId = 'tbl_iblock_list_' . md5('nlb_content.' . $iblockId);
    $settings = NlbStubStore::$gridDefaults[$gridId] ?? null;
    nlb_src_check($settings !== null, "{$code}: не задан вид списка по умолчанию (grid {$gridId})");
    if ($settings === null) {
        continue;
    }
    $columns = explode(',', (string)($settings['columns'] ?? ''));
    foreach (['SOURCE', 'CREATED_BY', 'DATE_PROCESSED'] as $propertyCode) {
        $property = nlb_src_property($iblockId, $propertyCode);
        $header = $property ? 'PROPERTY_' . (int)$property['ID'] : '';
        nlb_src_check(
            $header !== '' && in_array($header, $columns, true),
            "{$code}: в списке нет колонки {$propertyCode}"
        );
    }
}

/* 4. Формы содержат скрытое поле источника. */
$formsConfig = nlb_forms_config();
foreach (['request', 'booking', 'order'] as $type) {
    $field = $formsConfig[$type]['fields']['SOURCE'] ?? null;
    nlb_src_check(
        is_array($field) && (string)($field['type'] ?? '') === 'hidden' && !empty($field['source']),
        "{$type}: нет скрытого поля SOURCE с автозаполнением"
    );
}

/* 5. Нормализация канала. */
nlb_src_check(nlb_src_source(['utm_source' => 'Telegram']) === 'utm:telegram', 'utm_source не нормализуется');
nlb_src_check(nlb_src_source(['utm_medium' => 'Email']) === 'utm:email', 'utm_medium не нормализуется');
nlb_src_check(
    nlb_src_source([], ['HTTP_REFERER' => 'https://t.me/nlb']) === 'ref:t.me',
    'внешний referer не сводится к ref:<host>'
);
nlb_src_check(
    nlb_src_source([], ['HTTP_REFERER' => 'http://example.by/events/']) === 'site',
    'свой referer не сводится к site'
);
nlb_src_check(
    nlb_src_source([], ['HTTP_HOST' => 'localhost:8793', 'HTTP_REFERER' => 'http://localhost:8793/']) === 'site',
    'локальный referer не сводится к site'
);
nlb_src_check(nlb_src_source([]) === 'direct', 'без меток и referer источник не direct');
nlb_src_check(
    nlb_src_source(['utm_source' => '<script> evil']) === 'utm:script-evil',
    'utm_source не очищается от посторонних символов'
);

/* 6. before_add заполняет только пустой SOURCE. */
$requestsId = $iblocks['requests'];
$sourceProperty = nlb_src_property($requestsId, 'SOURCE');
$sourceId = (int)($sourceProperty['ID'] ?? 0);

$_GET = ['utm_source' => 'telegram'];
$_POST = [];
$_SERVER['HTTP_HOST'] = 'example.by';
unset($_SERVER['HTTP_REFERER']);

$fields = ['IBLOCK_ID' => $requestsId, 'NAME' => 'Заявка', 'PROPERTY_VALUES' => []];
nlb_forms_before_add($fields);
nlb_src_check(
    (string)($fields['PROPERTY_VALUES'][$sourceId][0]['VALUE'] ?? '') === 'utm:telegram',
    'before_add не записал источник в пустое поле'
);

$fields = [
    'IBLOCK_ID' => $requestsId,
    'NAME' => 'Заявка',
    'PROPERTY_VALUES' => [$sourceId => [0 => ['VALUE' => 'ref:vk.com']]],
];
nlb_forms_before_add($fields);
nlb_src_check(
    (string)($fields['PROPERTY_VALUES'][$sourceId][0]['VALUE'] ?? '') === 'ref:vk.com',
    'before_add перетёр уже указанный источник'
);

$newsId = nlb_iblock_id('news');
$fields = ['IBLOCK_ID' => $newsId, 'NAME' => 'Новость', 'PROPERTY_VALUES' => []];
nlb_forms_before_add($fields);
nlb_src_check($fields['PROPERTY_VALUES'] === [], 'before_add трогает чужой инфоблок');

/* 7. Смена статуса: дата обработки и ответственный. */
$GLOBALS['USER'] = new class {
    public function GetLogin(): string
    {
        return 'librarian';
    }

    public function GetID(): int
    {
        return 7;
    }
};

$element = new CIBlockElement();
$statusIds = [];
$createdElements = [];

foreach ($iblocks as $code => $iblockId) {
    $progress = [
        'requests' => 'in_progress',
        'bookings' => 'new',
        'orders' => 'processing',
    ];
    $closed = [
        'requests' => 'done',
        'bookings' => 'confirmed',
        'orders' => 'done',
    ];
    $statusIds[$code] = [
        'progress' => (int)nlb_enum_id($iblockId, 'STATUS', $progress[$code]),
        'closed' => (int)nlb_enum_id($iblockId, 'STATUS', $closed[$code]),
    ];
}

$requestId = (int)$element->Add([
    'IBLOCK_ID' => $requestsId,
    'NAME' => 'Проверка источника',
    'XML_ID' => 'test-request-source-' . bin2hex(random_bytes(4)),
    'ACTIVE' => 'Y',
    'PROPERTY_VALUES' => [
        'STATUS' => $statusIds['requests']['progress'],
        'SOURCE' => 'utm:telegram',
    ],
]);
$createdElements[] = [$requestId, $requestsId];

nlb_src_after_update($requestId, $requestsId);
$props = nlb_forms_element_props($requestsId, $requestId);
nlb_src_check(
    trim((string)($props['values']['DATE_PROCESSED'] ?? '')) === '',
    'дата обработки появилась у заявки в работе'
);

$element->Update($requestId, ['PROPERTY_VALUES' => ['STATUS' => $statusIds['requests']['closed']]]);
nlb_src_after_update($requestId, $requestsId);
$props = nlb_forms_element_props($requestsId, $requestId);
$firstDate = trim((string)($props['values']['DATE_PROCESSED'] ?? ''));
nlb_src_check(
    (bool)preg_match('/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2}$/', $firstDate),
    'закрытая заявка не получила дату обработки в формате сайта'
);
nlb_src_check(
    trim((string)($props['values']['CREATED_BY'] ?? '')) === 'librarian',
    'закрытая заявка не запомнила ответственного'
);

nlb_src_after_update($requestId, $requestsId);
$props = nlb_forms_element_props($requestsId, $requestId);
nlb_src_check(
    trim((string)($props['values']['DATE_PROCESSED'] ?? '')) === $firstDate,
    'повторная смена статуса переписала дату обработки'
);

$element->Update($requestId, ['PROPERTY_VALUES' => ['STATUS' => $statusIds['requests']['progress']]]);
nlb_src_after_update($requestId, $requestsId);
$props = nlb_forms_element_props($requestsId, $requestId);
nlb_src_check(
    trim((string)($props['values']['DATE_PROCESSED'] ?? '')) === '',
    'возврат в работу не очистил дату обработки'
);

$bookingId = (int)$element->Add([
    'IBLOCK_ID' => $iblocks['bookings'],
    'NAME' => 'Проверка брони',
    'XML_ID' => 'test-booking-source-' . bin2hex(random_bytes(4)),
    'ACTIVE' => 'Y',
    'PROPERTY_VALUES' => ['STATUS' => (int)nlb_enum_id($iblocks['bookings'], 'STATUS', 'confirmed')],
]);
$createdElements[] = [$bookingId, $iblocks['bookings']];
nlb_src_after_update($bookingId, $iblocks['bookings']);
$props = nlb_forms_element_props($iblocks['bookings'], $bookingId);
nlb_src_check(
    trim((string)($props['values']['DATE_PROCESSED'] ?? '')) !== '',
    'подтверждённая бронь не получила дату обработки'
);

$orderId = (int)$element->Add([
    'IBLOCK_ID' => $iblocks['orders'],
    'NAME' => 'Проверка заказа',
    'XML_ID' => 'test-order-source-' . bin2hex(random_bytes(4)),
    'ACTIVE' => 'Y',
    'PROPERTY_VALUES' => ['STATUS' => (int)nlb_enum_id($iblocks['orders'], 'STATUS', 'done')],
]);
$createdElements[] = [$orderId, $iblocks['orders']];
nlb_src_after_update($orderId, $iblocks['orders']);
$props = nlb_forms_element_props($iblocks['orders'], $orderId);
nlb_src_check(
    trim((string)($props['values']['DATE_PROCESSED'] ?? '')) !== '',
    'выполненный заказ не получил дату обработки'
);

/* 8. Закрытые статусы объявлены явно. */
nlb_src_check(nlb_forms_status_closed('request', 'done'), 'request.done не считается закрытым');
nlb_src_check(!nlb_forms_status_closed('request', 'in_progress'), 'request.in_progress считается закрытым');
nlb_src_check(nlb_forms_status_closed('booking', 'confirmed'), 'booking.confirmed не считается закрытым');
nlb_src_check(nlb_forms_status_closed('booking', 'cancelled'), 'booking.cancelled не считается закрытым');
nlb_src_check(!nlb_forms_status_closed('booking', 'new'), 'booking.new считается закрытым');
nlb_src_check(nlb_forms_status_closed('order', 'done'), 'order.done не считается закрытым');
nlb_src_check(nlb_forms_status_closed('order', 'cancelled'), 'order.cancelled не считается закрытым');
nlb_src_check(!nlb_forms_status_closed('order', 'processing'), 'order.processing считается закрытым');

/* 9. Убираем временные элементы, чтобы откат считал только демо-контент. */
foreach ($createdElements as [$elementId, $iblockId]) {
    CIBlockElement::Delete((int)$elementId);
}

if ($errors) {
    foreach ($errors as $error) {
        fwrite(STDERR, 'ОШИБКА: ' . $error . "\n");
    }
    exit(1);
}

echo "OK: заявки получают источник, дату обработки и ответственного\n";
exit(0);
