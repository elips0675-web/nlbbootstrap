<?php
/**
 * Поиск по сайту.
 *
 * Форма в шапке отправляет GET ?q=…; параметр стандартный для search.page.
 * arrFILTER — коды инфоблоков с префиксом iblock_ (см. docs/bitrix-integration.md, §10).
 *
 * Выдача считается по BM25 из `db/search/index.json` (тот же индекс, что
 * у мгновенной подсказки в шапке и у `local/ajax/search.php`). Штатный
 * `bitrix:search.page` остаётся запасным: он подключается только тогда,
 * когда индекс недоступен, — тогда поиск продолжает работать по индексу
 * Битрикса, а не отдаёт пустую страницу.
 */

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php';

$APPLICATION->SetPageProperty('robots', 'noindex, follow');

$query = isset($_GET['q']) ? trim((string)$_GET['q']) : '';
$query = mb_substr($query, 0, 200);

$searchLibrary = $_SERVER['DOCUMENT_ROOT'] . '/local/php_interface/include/nlb_search.php';
if (is_file($searchLibrary)) {
    require_once $searchLibrary;
}

$pageState = [
    'mode' => 'fallback',
    'query' => $query,
    'results' => [],
    'count' => 0,
];
if (function_exists('nlb_search_page_state')) {
    $pageState = nlb_search_page_state($query, $_SERVER['DOCUMENT_ROOT']);
}

$APPLICATION->SetTitle(
    $pageState['mode'] === 'results'
        ? 'Поиск: ' . $query . ' — найдено ' . (int)$pageState['count']
        : ($query !== '' ? 'Поиск: ' . $query : 'Поиск по сайту')
);
$APPLICATION->AddChainItem($query !== '' ? 'Поиск: ' . $query : 'Поиск по сайту');
$APPLICATION->SetPageProperty(
    'description',
    'Поиск по книгам, событиям, новостям, услугам и печатному каталогу библиотеки.'
);

?>

<section class="page-hero">
    <div class="container">
        <span class="eyebrow eyebrow--green">Поиск</span>
        <h1 class="page-title">Поиск по сайту</h1>

        <form class="row g-2 align-items-center mb-3" action="<?= SITE_DIR ?>search/" method="get" role="search" style="max-width: 640px">
            <div class="col">
                <label class="visually-hidden" for="nlbSearchPageInput">Поисковый запрос</label>
                <div class="search-field">
                    <svg class="i i-24" aria-hidden="true"><use href="#i-search"/></svg>
                    <input class="form-control" id="nlbSearchPageInput" type="search" name="q"
                           value="<?= htmlspecialcharsbx($query) ?>"
                           placeholder="Книги, авторы, события, услуги…" autocomplete="off">
                </div>
            </div>
            <div class="col-auto">
                <button class="btn btn-nlb btn-icon" type="submit">
                    Найти
                    <svg class="i" aria-hidden="true"><use href="#i-arrow-right"/></svg>
                </button>
            </div>
        </form>

        <div class="d-flex flex-wrap gap-2" aria-label="Популярные запросы">
            <a class="search-chip" href="<?= SITE_DIR ?>search/?q=каталог">Каталог книг</a>
            <a class="search-chip" href="<?= SITE_DIR ?>search/?q=афиша">Афиша</a>
            <a class="search-chip" href="<?= SITE_DIR ?>search/?q=печать">Печать</a>
            <a class="search-chip" href="<?= SITE_DIR ?>search/?q=коворкинг">Коворкинг</a>
        </div>
    </div>
</section>

<section class="section pt-0">
    <div class="container">
        <?php if ($pageState['mode'] === 'empty'): ?>
            <div class="empty-state">
                Введите запрос — найдём книги, события, новости и услуги.
                Поиск работает по названиям, описаниям и свойствам материалов.
            </div>
        <?php elseif ($pageState['mode'] === 'results'): ?>
            <p class="form-hint mb-3">Найдено: <?= (int)$pageState['count'] ?></p>

            <div class="search-instant">
                <?php foreach ($pageState['results'] as $hit): ?>
                    <?php $category = nlb_search_category_name((string)$hit['category'], $_SERVER['DOCUMENT_ROOT']); ?>
                    <a class="search-instant__item" href="<?= htmlspecialcharsbx((string)$hit['url']) ?>">
                        <span class="search-instant__title"><?= htmlspecialcharsbx((string)$hit['title']) ?></span>
                        <?php if ($category !== ''): ?>
                            <span class="search-instant__snippet"><?= htmlspecialcharsbx($category) ?></span>
                        <?php endif; ?>
                        <?php if ((string)$hit['snippet'] !== ''): ?>
                            <span class="search-instant__snippet"><?= htmlspecialcharsbx((string)$hit['snippet']) ?></span>
                        <?php endif; ?>
                    </a>
                <?php endforeach; ?>
            </div>
        <?php elseif ($pageState['mode'] === 'none'): ?>
            <div class="empty-state">
                По запросу «<?= htmlspecialcharsbx($query) ?>» ничего не нашлось.
                Проверьте раскладку и попробуйте более короткий запрос — например,
                название книги или услуги одним словом.
            </div>
        <?php endif; ?>

        <?php if ($pageState['mode'] === 'fallback'): ?>
            <div class="alert alert-warning" role="status">
                Поиск по сайту работает в штатном режиме: подсказки по индексу
                временно недоступны. Индекс пересобирается автоматически после
                правки материалов.
            </div>

            <?php $APPLICATION->IncludeComponent('bitrix:search.page', '', [
                'RESTART' => 'N',
                'NO_WORD_LOGIC' => 'N',
                'CHECK_DATES' => 'N',
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
            ], false, ['HIDE_ICONS' => 'Y']); ?>

            <p class="form-hint mt-4 mb-0">
                Если результатов нет, проверьте раскладку и попробуйте более короткий запрос.
                Индексация включается в админке: «Поиск → Переиндексация».
            </p>
        <?php endif; ?>
    </div>
</section>

<?php require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php'; ?>
