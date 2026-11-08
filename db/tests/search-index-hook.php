<?php
/**
 * Проверка обновления индекса поиска после правки элемента (P1-18).
 *
 * Зачем тест: индекс `db/search/index.json` — файл, и до этого этапа его
 * обновляла только ручная команда. Хук на `OnAfterIBlockElement*` легко
 * сделать «тихо неработающим»: подписать не на то событие, пересобирать
 * на каждую правку или, наоборот, забыть про удаление. Ошибка не падает,
 * а оставляет поиск на старом содержимом.
 *
 * Проверяется:
 *  - подписка на Add/Update/Delete и карта инфоблоков без персональных
 *    (`index => 'N'`);
 *  - пересборка отложена до конца запроса и выполняется один раз на пачку
 *    событий;
 *  - новый элемент попадает в индекс, удалённый — исчезает;
 *  - пересборка пишется в указанный корень, а не в рабочий `db/`;
 *  - если каталог `db` недоступен для записи, пересборка возвращает false,
 *    а не притворяется успешной.
 *
 * Запускается из db/tests/run.php в песочнице с заглушками ядра.
 *
 * Запуск: php db/tests/search-index-hook.php
 * Выход:  0 — хук обновляет индекс, 1 — расхождение.
 */

declare(strict_types=1);

require __DIR__ . '/../lib/boot.php';

if (!function_exists('AddEventHandler')) {
    function AddEventHandler(string $module, string $event, string $handler): void
    {
        $GLOBALS['nlb_test_handlers'][$module . ':' . $event][] = $handler;
    }
}

require nlb_root() . '/local/php_interface/include/nlb_search.php';

$errors = [];

function nlb_hook_check(bool $condition, string $message): void
{
    global $errors;
    if (!$condition) {
        $errors[] = $message;
    }
}

function nlb_hook_rmdir(string $dir): void
{
    if (!is_dir($dir)) {
        return;
    }
    foreach (scandir($dir) ?: [] as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }
        $path = $dir . '/' . $item;
        if (is_link($path) || is_file($path)) {
            @unlink($path);
        } else {
            nlb_hook_rmdir($path);
        }
    }
    @rmdir($dir);
}

function nlb_hook_copy(string $source, string $target): void
{
    if (is_file($source)) {
        @mkdir(dirname($target), 0775, true);
        @copy($source, $target);
        return;
    }
    if (!is_dir($source)) {
        return;
    }
    @mkdir($target, 0775, true);
    foreach (scandir($source) ?: [] as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }
        nlb_hook_copy($source . '/' . $item, $target . '/' . $item);
    }
}

$root = nlb_root();
$temp = rtrim(sys_get_temp_dir(), '/\\') . '/nlb-search-hook-' . getmypid();
$isolated = $temp . '/index-root';

nlb_hook_rmdir($temp);
nlb_hook_copy($root . '/db/config', $isolated . '/db/config');
nlb_hook_copy($root . '/db/search/pages.json', $isolated . '/db/search/pages.json');

$liveIndex = $root . '/db/search/index.json';
$liveHash = is_file($liveIndex) ? (string)hash_file('sha256', $liveIndex) : '';

/* 1. События подписаны на пересборку. */
$handlers = $GLOBALS['nlb_test_handlers'] ?? [];
foreach (['OnAfterIBlockElementAdd', 'OnAfterIBlockElementUpdate', 'OnAfterIBlockElementDelete'] as $event) {
    $subscribed = $handlers['iblock:' . $event] ?? [];
    nlb_hook_check(
        in_array('nlb_search_index_event', $subscribed, true),
        "iblock:{$event} не подписан на nlb_search_index_event"
    );
}

/* 2. Карта инфоблоков: контент участвует, персональные данные — нет. */
$map = nlb_search_iblock_map($root);
$contentIds = [];
foreach (['news', 'events', 'books', 'collections', 'services', 'printing'] as $code) {
    $iblockId = nlb_iblock_id($code);
    $contentIds[$code] = $iblockId;
    nlb_hook_check(($map[$iblockId] ?? '') === $code, "{$code}: инфоблок не попал в карту поиска");
}

foreach (['requests', 'bookings', 'orders'] as $code) {
    $iblockId = nlb_iblock_id($code);
    nlb_hook_check(!isset($map[$iblockId]), "{$code}: персональный инфоблок попал в индекс");
}

/* 3. Событие не пересобирает сразу: работа уходит в конец запроса. */
$newsId = $contentIds['news'];
nlb_search_index_reset();
nlb_search_index_event(['IBLOCK_ID' => $newsId, 'ID' => 1]);
nlb_hook_check(nlb_search_index_pending(), 'событие не пометило индекс устаревшим');
nlb_hook_check(nlb_search_index_runs() === 0, 'пересборка выполнилась до конца запроса');

nlb_search_index_event(['IBLOCK_ID' => $newsId, 'ID' => 2]);
nlb_search_index_event(['IBLOCK_ID' => $newsId, 'ID' => 3]);
nlb_hook_check(
    nlb_search_index_run($isolated) === true,
    'отложенная пересборка не записала индекс'
);
nlb_hook_check(nlb_search_index_runs() === 1, 'пачка событий дала больше одной пересборки');
nlb_hook_check(!nlb_search_index_pending(), 'после пересборки флаг «устарел» остался');
nlb_hook_check(nlb_search_index_run($isolated) === false, 'повторный запуск без события пересобрал индекс');
nlb_hook_check(nlb_search_index_runs() === 1, 'счётчик пересборок вырос без события');

nlb_hook_check(is_file($isolated . '/db/search/index.json'), 'индекс не появился в изолированном корне');
$isolatedIndex = nlb_search_load_index($isolated);
nlb_hook_check(is_array($isolatedIndex) && ($isolatedIndex['docs'] ?? []) !== [], 'пересобранный индекс пуст');

/* 4. Персональный и незнакомый инфоблоки индекс не трогают. */
nlb_search_index_reset();
nlb_search_index_event(['IBLOCK_ID' => nlb_iblock_id('requests'), 'ID' => 1]);
nlb_hook_check(!nlb_search_index_pending(), 'заявка пометила индекс устаревшим');
nlb_hook_check(nlb_search_index_run($isolated) === false, 'заявка запустила пересборку');
nlb_hook_check(nlb_search_index_runs() === 0, 'пересборка заявки увеличила счётчик');

nlb_search_index_event(['IBLOCK_ID' => 999999, 'ID' => 1]);
nlb_search_index_event([]);
nlb_search_index_event('мусор');
nlb_hook_check(!nlb_search_index_pending(), 'событие без инфоблока пометило индекс устаревшим');

/* 5. Новый элемент попадает в индекс, удалённый — исчезает. */
$marker = 'zqxhooktest' . bin2hex(random_bytes(3));
$element = new CIBlockElement();
$elementId = (int)$element->Add([
    'IBLOCK_ID' => $newsId,
    'NAME' => 'Проверка хука ' . $marker,
    'CODE' => 'hook-' . $marker,
    'ACTIVE' => 'Y',
    'PREVIEW_TEXT' => 'Служебный элемент для проверки пересборки индекса.',
]);
nlb_hook_check($elementId > 0, 'не удалось создать временный элемент');

nlb_search_index_reset();
nlb_search_index_event(['IBLOCK_ID' => $newsId, 'ID' => $elementId]);
nlb_search_index_run($isolated);
$rebuilt = nlb_search_load_index($isolated);
$found = nlb_search_query(is_array($rebuilt) ? $rebuilt : [], $marker, 5);
nlb_hook_check(
    ($found[0]['id'] ?? '') === 'news:' . $elementId,
    'новый элемент не попал в индекс после пересборки'
);

CIBlockElement::Delete($elementId);
nlb_search_index_reset();
nlb_search_index_event(['IBLOCK_ID' => $newsId, 'ID' => $elementId]);
nlb_search_index_run($isolated);
$rebuilt = nlb_search_load_index($isolated);
$found = nlb_search_query(is_array($rebuilt) ? $rebuilt : [], $marker, 5);
nlb_hook_check($found === [], 'удалённый элемент остался в индексе');

/* 6. Пересборка не трогает рабочий индекс и честно падает без записи. */
$liveAfter = is_file($liveIndex) ? (string)hash_file('sha256', $liveIndex) : '';
nlb_hook_check($liveHash === $liveAfter, 'пересборка переписала рабочий db/search/index.json');

$blocked = $temp . '/blocked';
@mkdir($blocked, 0775, true);
@file_put_contents($blocked . '/db', 'не каталог');
nlb_search_index_reset();
nlb_search_index_schedule($blocked);
nlb_hook_check(
    nlb_search_index_run($blocked) === false,
    'недоступный для записи каталог дал «успешную» пересборку'
);
nlb_hook_check(!nlb_search_index_pending(), 'после неудачной записи флаг остался');

nlb_hook_rmdir($temp);

if ($errors) {
    foreach ($errors as $error) {
        fwrite(STDERR, 'ОШИБКА: ' . $error . "\n");
    }
    exit(1);
}

echo "OK: индекс поиска пересобирается после правки элемента\n";
exit(0);
