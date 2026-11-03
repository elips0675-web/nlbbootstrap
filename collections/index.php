<?php
/**
 * Коллекции — список тематических подборок.
 */

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php';

$APPLICATION->SetTitle('Коллекции');
$APPLICATION->SetPageProperty(
    'description',
    'Тематические подборки книг: классика, путешествия, научпоп, детская полка, бизнес-книги.'
);

?>

<section class="page-hero">
    <div class="container">
        <span class="eyebrow eyebrow--violet">Подборки</span>
        <h1 class="page-title">Коллекции</h1>
        <p class="page-lead">
            Готовые маршруты по фонду: от классики до научпопа и детской полки.
            Выбирайте тему — внутри короткое описание и состав подборки.
        </p>
    </div>
</section>

<section class="section pt-0">
    <div class="container">
        <?php $APPLICATION->IncludeComponent('bitrix:news.list', 'nlb_cards', [
            'IBLOCK_TYPE' => 'nlb_content',
            'IBLOCK_ID' => nlb_iblock_id('collections'),
            'NLB_CARD' => 'collection',
            'NLB_COLUMNS' => 'col-md-6 col-lg-4',
            'NEWS_COUNT' => 12,
            'SORT_BY1' => 'SORT',
            'SORT_ORDER1' => 'ASC',
            'FIELD_CODE' => ['NAME', 'PREVIEW_TEXT', 'DETAIL_PAGE_URL'],
            'PROPERTY_CODE' => ['COUNT', 'COLOR', 'ICON'],
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
                <span class="eyebrow eyebrow--green">Каталог</span>
                <h2 class="section-title">Ищите конкретную книгу?</h2>
                <p class="section-lead mb-0">
                    В каталоге — автор, год издания, ISBN, шифр и статус наличия.
                    Поиск по названию и автору — в шапке сайта.
                </p>
            </div>
            <div class="col-lg-5 text-lg-end" data-reveal>
                <a class="btn btn-nlb btn-lg-nlb" href="<?= SITE_DIR ?>books/">Перейти в каталог</a>
            </div>
        </div>
    </div>
</section>

<?php require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php'; ?>
