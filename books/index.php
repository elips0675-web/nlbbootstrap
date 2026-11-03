<?php
/**
 * Каталог книг — список.
 *
 * Жанры — разделы инфоблока books, поэтому фильтр идёт по SECTION_ID.
 */

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php';

$sectionCode = isset($_GET['section']) ? (string)$_GET['section'] : '';
$sectionCode = (string)preg_replace('/[^a-z0-9_-]/i', '', $sectionCode);
$sectionId = $sectionCode !== '' ? nlb_iblock_section_id('books', $sectionCode) : 0;

$GLOBALS['nlbBooksFilter'] = $sectionId > 0
    ? ['SECTION_ID' => $sectionId, 'INCLUDE_SUBSECTIONS' => 'Y']
    : [];

$APPLICATION->SetTitle('Каталог книг');
$APPLICATION->SetPageProperty(
    'description',
    'Каталог книг библиотеки: художественная литература, история, наука, детские книги и бизнес-литература.'
);

?>

<section class="page-hero">
    <div class="container">
        <span class="eyebrow eyebrow--violet">Фонды</span>
        <h1 class="page-title">Каталог книг</h1>
        <p class="page-lead">
            Что есть на полках: художественная литература, история, наука,
            детские книги и бизнес-литература. Наличие обновляется вручную.
        </p>

        <ul class="section-chips" aria-label="Жанры">
            <li>
                <a class="section-chip<?= $sectionId === 0 ? ' is-active' : '' ?>"
                   href="<?= SITE_DIR ?>books/">Все книги</a>
            </li>
            <?php foreach (nlb_iblock_sections('books') as $section): ?>
                <li>
                    <a class="section-chip<?= $sectionId === $section['ID'] ? ' is-active' : '' ?>"
                       href="<?= SITE_DIR ?>books/?section=<?= urlencode($section['CODE']) ?>">
                        <?= htmlspecialcharsbx($section['NAME']) ?>
                    </a>
                </li>
            <?php endforeach; ?>
        </ul>
    </div>
</section>

<section class="section pt-0">
    <div class="container">
        <div class="d-flex flex-wrap align-items-center gap-3 mb-4" aria-label="Обозначения наличия">
            <span class="book-status is-available">В наличии</span>
            <span class="book-status is-reserved">Забронирована</span>
            <span class="book-status is-unavailable">Выдана</span>
            <span class="small text-muted">Статус указан на карточке каждой книги.</span>
        </div>

        <?php $APPLICATION->IncludeComponent('bitrix:news.list', 'nlb_cards', [
            'IBLOCK_TYPE' => 'nlb_catalog',
            'IBLOCK_ID' => nlb_iblock_id('books'),
            'NLB_CARD' => 'book',
            'NLB_COLUMNS' => 'col-sm-6 col-lg-4 col-xl-3',
            'NEWS_COUNT' => 12,
            'FILTER_NAME' => 'nlbBooksFilter',
            'SORT_BY1' => 'SORT',
            'SORT_ORDER1' => 'ASC',
            'SORT_BY2' => 'NAME',
            'SORT_ORDER2' => 'ASC',
            'FIELD_CODE' => ['NAME', 'PREVIEW_TEXT', 'PREVIEW_PICTURE', 'DETAIL_PAGE_URL'],
            'PROPERTY_CODE' => ['AUTHOR', 'YEAR', 'AVAILABLE', 'ISBN'],
            'DISPLAY_BOTTOM_PAGER' => 'Y',
            'PAGER_TEMPLATE' => '.default',
            'SET_TITLE' => 'N',
            'INCLUDE_IBLOCK_INTO_CHAIN' => 'N',
            'ADD_SECTIONS_CHAIN' => 'N',
            'CACHE_TYPE' => 'A',
            'CACHE_TIME' => '3600',
        ], false, ['HIDE_ICONS' => 'Y']); ?>
    </div>
</section>

<section class="section section--soft">
    <div class="container">
        <div class="row g-4 align-items-center">
            <div class="col-lg-7" data-reveal>
                <span class="eyebrow eyebrow--green">Подборки</span>
                <h2 class="section-title">Не знаете, с чего начать?</h2>
                <p class="section-lead mb-0">
                    Собрали тематические подборки: классика, книги о путешествиях,
                    научпоп, детская полка и другие.
                </p>
            </div>
            <div class="col-lg-5 text-lg-end" data-reveal>
                <a class="btn btn-nlb-green btn-lg-nlb btn-icon" href="<?= SITE_DIR ?>collections/">
                    Смотреть коллекции
                    <svg class="i" aria-hidden="true"><use href="#i-arrow-right"/></svg>
                </a>
            </div>
        </div>
    </div>
</section>

<?php require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php'; ?>
