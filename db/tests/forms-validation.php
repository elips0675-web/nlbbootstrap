<?php
/**
 * Формы отбивают пустые поля и без JavaScript (P1-8).
 *
 * Зачем тест: `script.js` навешивает Bootstrap-проверку, но при отключённом
 * JavaScript она не работает. Тогда единственная защита — атрибут `required`
 * в разметке и серверная проверка обязательных полей. Тест доказывает обе:
 * в разметке нет `novalidate`, а `OnBeforeIBlockElementAdd` не пускает
 * POST с пустыми обязательными полями, кривым e-mail и прошедшей датой.
 *
 * Запускается из db/tests/run.php в песочнице с заглушками ядра.
 *
 * Запуск: php db/tests/forms-validation.php
 * Выход:  0 — форма без JS не пропускает пустоту, 1 — расхождение.
 */

declare(strict_types=1);

require __DIR__ . '/../lib/boot.php';

if (!function_exists('htmlspecialcharsbx')) {
    function htmlspecialcharsbx($value): string
    {
        return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}

if (!function_exists('bitrix_sessid_post')) {
    function bitrix_sessid_post(): string
    {
        return '<input type="hidden" name="sessid" value="test">';
    }
}

if (!function_exists('AddEventHandler')) {
    function AddEventHandler(string $module, string $event, string $handler): void
    {
        $GLOBALS['nlb_test_handlers'][$module . ':' . $event][] = $handler;
    }
}

if (!class_exists('NlbValidationApplication')) {
    /**
     * Заглушка $APPLICATION: копит сообщения об ошибках формы.
     */
    class NlbValidationApplication
    {
        /** @var string[] */
        public array $exceptions = [];

        public function ThrowException(string $message): void
        {
            $this->exceptions[] = $message;
        }

        public function GetString(): string
        {
            return implode(' ', $this->exceptions);
        }
    }
}

require nlb_root() . '/local/php_interface/include/nlb_db.php';
require nlb_root() . '/local/php_interface/include/nlb_forms.php';

$GLOBALS['APPLICATION'] = new NlbValidationApplication();

$errors = [];

function nlb_val_check(bool $condition, string $message): void
{
    global $errors;
    if (!$condition) {
        $errors[] = $message;
    }
}

/**
 * Свойства элемента для события инфоблока: ID свойства => значение.
 *
 * @param array<string,string> $values CODE => значение
 * @return array<int,array<int,array<string,string>>>
 */
function nlb_val_props(string $iblockCode, array $values): array
{
    $properties = nlb_iblock_properties($iblockCode);
    $result = [];
    foreach ($values as $field => $value) {
        $id = (int)($properties[$field]['ID'] ?? 0);
        if ($id > 0) {
            $result[$id] = [0 => ['VALUE' => $value]];
        }
    }
    return $result;
}

/**
 * Имитация отправки формы: метод, POST и пустые метки канала.
 *
 * @param array<string,string> $post
 */
function nlb_val_post(array $post): void
{
    $_SERVER['REQUEST_METHOD'] = $post === [] ? 'GET' : 'POST';
    $_SERVER['HTTP_HOST'] = 'example.by';
    $_POST = $post;
    $_GET = [];
    unset($_SERVER['HTTP_REFERER']);
    $GLOBALS['APPLICATION']->exceptions = [];
}

function nlb_val_message(): string
{
    return implode(' ', $GLOBALS['APPLICATION']->exceptions);
}

/* 1. Обработчик проверки зарегистрирован. */
$handlers = $GLOBALS['nlb_test_handlers']['iblock:OnBeforeIBlockElementAdd'] ?? [];
nlb_val_check(
    in_array('nlb_forms_before_add', $handlers, true),
    'OnBeforeIBlockElementAdd не подписан на nlb_forms_before_add'
);

/* 2. Разметка формы не отдаёт проверку только JavaScript. */
nlb_val_post([]);
ob_start();
nlb_form_render('request');
$markup = (string)ob_get_clean();

nlb_val_check(
    str_contains($markup, 'class="feedback-form needs-validation"'),
    'форма заявки не помечена needs-validation'
);
nlb_val_check(!str_contains($markup, 'novalidate'), 'в разметке остался novalidate — без JS пустые поля уйдут на сервер');
nlb_val_check(str_contains($markup, 'method="post"'), 'у формы нет method="post"');
nlb_val_check(
    substr_count($markup, ' required') >= 3,
    'у обязательных полей формы заявки нет атрибута required'
);
foreach (['name="PROPERTY[', 'name="CONSENT"', 'data-nlb-form="request"'] as $part) {
    nlb_val_check(str_contains($markup, $part), "в форме заявки нет {$part}");
}

/* 3. Обязательные поля описаны конфигом и подписями. */
$labels = nlb_forms_required_labels('request');
foreach (['NAME', 'EMAIL', 'MESSAGE'] as $code) {
    nlb_val_check(isset($labels[$code]), "request: {$code} нет в списке обязательных полей");
}
$bookingLabels = nlb_forms_required_labels('booking');
foreach (['DATE', 'TIME', 'PERSON', 'PHONE'] as $code) {
    nlb_val_check(isset($bookingLabels[$code]), "booking: {$code} нет в списке обязательных полей");
}
nlb_val_check(
    nlb_forms_missing_required('request', ['EMAIL' => '', 'MESSAGE' => ''], '') === ['Имя', 'E-mail', 'Сообщение'],
    'nlb_forms_missing_required не собирает подписи незаполненных полей'
);

/* 4. Пустая заявка не создаётся: серверная проверка вместо JavaScript. */
$requestsId = (int)nlb_iblock_id('requests');
nlb_val_post(['iblock_submit' => 'Y', 'CONSENT' => 'Y']);
$fields = ['IBLOCK_ID' => $requestsId, 'NAME' => '', 'PROPERTY_VALUES' => []];
nlb_val_check(nlb_forms_before_add($fields) === false, 'пустая заявка прошла серверную проверку');
$message = nlb_val_message();
foreach (['Имя', 'E-mail', 'Сообщение'] as $label) {
    nlb_val_check(str_contains($message, $label), "сообщение об ошибке не называет поле «{$label}»");
}

/* 5. Без согласия заявка не создаётся. */
nlb_val_post(['iblock_submit' => 'Y']);
$fields = [
    'IBLOCK_ID' => $requestsId,
    'NAME' => 'Анна',
    'PROPERTY_VALUES' => nlb_val_props('requests', [
        'EMAIL' => 'anna@example.by',
        'MESSAGE' => 'Прошу перезвонить.',
    ]),
];
nlb_val_check(nlb_forms_before_add($fields) === false, 'заявка без согласия прошла проверку');
nlb_val_check(
    str_contains(nlb_val_message(), 'согласие'),
    'сообщение об ошибке не требует согласия на обработку данных'
);

/* 6. Кривой e-mail не создаёт заявку. */
nlb_val_post(['iblock_submit' => 'Y', 'CONSENT' => 'Y']);
$fields = [
    'IBLOCK_ID' => $requestsId,
    'NAME' => 'Анна',
    'PROPERTY_VALUES' => nlb_val_props('requests', [
        'EMAIL' => 'anna@',
        'MESSAGE' => 'Прошу перезвонить.',
    ]),
];
nlb_val_check(nlb_forms_before_add($fields) === false, 'заявка с кривым e-mail прошла проверку');
nlb_val_check(
    str_contains(nlb_val_message(), 'e-mail'),
    'сообщение об ошибке не указывает на неверный e-mail'
);

/* 7. Заполненная заявка создаётся. */
nlb_val_post(['iblock_submit' => 'Y', 'CONSENT' => 'Y']);
$fields = [
    'IBLOCK_ID' => $requestsId,
    'NAME' => 'Анна',
    'PROPERTY_VALUES' => nlb_val_props('requests', [
        'EMAIL' => 'anna@example.by',
        'MESSAGE' => 'Прошу перезвонить.',
    ]),
];
nlb_val_check(nlb_forms_before_add($fields) === true, 'заполненная заявка не прошла проверку');
nlb_val_check(nlb_val_message() === '', 'заполненная заявка получила сообщение об ошибке');

/* 8. Бронь: пустые поля и прошедшая дата отбиваются на сервере. */
$bookingsId = (int)nlb_iblock_id('bookings');
nlb_val_post(['iblock_submit' => 'Y', 'CONSENT' => 'Y']);
$fields = [
    'IBLOCK_ID' => $bookingsId,
    'NAME' => 'Бронь: Сауна',
    'PROPERTY_VALUES' => nlb_val_props('bookings', [
        'SERVICE' => 'Сауна',
        'SERVICE_CODE' => 'sauna',
        'DATE' => '',
        'TIME' => '',
    ]),
];
nlb_val_check(nlb_forms_before_add($fields) === false, 'бронь без даты и телефона прошла проверку');
$message = nlb_val_message();
foreach (['Дата', 'Время', 'Имя', 'Телефон'] as $label) {
    nlb_val_check(str_contains($message, $label), "сообщение о брони не называет поле «{$label}»");
}

nlb_val_post(['iblock_submit' => 'Y', 'CONSENT' => 'Y']);
$fields = [
    'IBLOCK_ID' => $bookingsId,
    'NAME' => 'Бронь: Сауна',
    'PROPERTY_VALUES' => nlb_val_props('bookings', [
        'SERVICE' => 'Сауна',
        'SERVICE_CODE' => 'sauna',
        'DATE' => '2020-01-01',
        'TIME' => '10:00',
        'PERSON' => 'Анна',
        'PHONE' => '+375291111111',
    ]),
];
nlb_val_check(nlb_forms_before_add($fields) === false, 'бронь с прошедшей датой прошла проверку');
nlb_val_check(
    str_contains(nlb_val_message(), 'Дата уже прошла'),
    'сообщение об ошибке не объясняет, что дата прошла'
);

/* 9. Программная запись (админка, миграции) не блокируется формой. */
nlb_val_post([]);
$fields = ['IBLOCK_ID' => $requestsId, 'NAME' => '', 'PROPERTY_VALUES' => []];
nlb_val_check(nlb_forms_before_add($fields) === true, 'проверка формы блокирует программную запись элемента');

/* 10. Шаблоны и скрипт: нативная проверка не отключена разметкой. */
$root = nlb_root();
$feedbackTemplate = (string)file_get_contents(
    $root . '/local/templates/nlb_bootstrap/components/bitrix/main.feedback/bootstrap/template.php'
);
nlb_val_check(!str_contains($feedbackTemplate, 'novalidate'), 'main.feedback: в разметке остался novalidate');
nlb_val_check(str_contains($feedbackTemplate, "' required'"), 'main.feedback: обязательные поля без required');

$footer = (string)file_get_contents($root . '/local/templates/nlb_bootstrap/footer.php');
nlb_val_check(!str_contains($footer, 'novalidate'), 'footer.php: подписка размечена с novalidate');
nlb_val_check(
    str_contains($footer, 'type="email" name="EMAIL"')
    && str_contains($footer, 'required'),
    'footer.php: у подписки нет required на e-mail'
);

$script = (string)file_get_contents($root . '/local/templates/nlb_bootstrap/script.js');
nlb_val_check(
    (bool)preg_match('/form\.noValidate\s*=\s*true/', $script),
    'script.js: нативную проверку не отключает JavaScript — novalidate из разметки не вернуть'
);

if ($errors) {
    foreach ($errors as $error) {
        fwrite(STDERR, 'ОШИБКА: ' . $error . "\n");
    }
    exit(1);
}

echo "OK: формы не отправляют пустые поля без JavaScript и на сервере\n";
exit(0);
