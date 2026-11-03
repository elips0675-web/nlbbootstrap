<?php
/**
 * Услуги библиотеки — список.
 *
 * Крупные чередующиеся блоки: фото слева/справа, описание, цена, что входит
 * и две кнопки. Ниже — превью каталога печатных услуг и CTA.
 */

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php';

$APPLICATION->SetTitle('Услуги');
$APPLICATION->SetPageProperty(
    'description',
    'Услуги библиотеки: читальные залы, коворкинг, компьютеры, экскурсии и обучение.'
);

?>

<section class="page-hero">
    <div class="container">
        <span class="eyebrow eyebrow--violet">
            <svg class="i" aria-hidden="true"><use href="#i-sparkles"/></svg>
            Сервисы библиотеки
        </span>
        <h1 class="page-title">Наши услуги</h1>
        <p class="page-lead">
            Библиотека — это не только книги. Читальные залы, коворкинг, лектории,
            детская комната и цифровые ресурсы — всё в одном месте.
        </p>
    </div>
</section>

<section class="section pt-0">
    <div class="container">
        <?php $APPLICATION->IncludeComponent('bitrix:news.list', 'nlb_cards', [
            'IBLOCK_TYPE' => 'nlb_services',
            'IBLOCK_ID' => nlb_iblock_id('services'),
            'NLB_CARD' => 'service-feature',
            'NEWS_COUNT' => 12,
            'SORT_BY1' => 'SORT',
            'SORT_ORDER1' => 'ASC',
            'FIELD_CODE' => ['NAME', 'PREVIEW_TEXT', 'PREVIEW_PICTURE', 'DETAIL_PAGE_URL'],
            'PROPERTY_CODE' => ['ICON', 'COLOR', 'PRICE_FROM', 'DURATION', 'FEATURES'],
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
        <div class="section-head" data-reveal>
            <span class="eyebrow eyebrow--green">Полиграфия</span>
            <h2 class="section-title">Каталог печатных услуг</h2>
            <p class="section-lead">
                Печать документов, сканирование, переплёт, визитки, сувениры
                и фотопечать — рядом с читальными залами.
            </p>
        </div>

        <?php $APPLICATION->IncludeComponent('bitrix:news.list', 'nlb_cards', [
            'IBLOCK_TYPE' => 'nlb_catalog',
            'IBLOCK_ID' => nlb_iblock_id('printing'),
            'NLB_CARD' => 'printing',
            'NLB_COLUMNS' => 'col-6 col-lg-3',
            'NEWS_COUNT' => 8,
            'SORT_BY1' => 'SORT',
            'SORT_ORDER1' => 'ASC',
            'FIELD_CODE' => ['NAME', 'PREVIEW_TEXT', 'PREVIEW_PICTURE', 'DETAIL_PAGE_URL'],
            'PROPERTY_CODE' => ['ICON', 'COLOR', 'PRICE_FROM', 'UNIT'],
            'SET_TITLE' => 'N',
            'INCLUDE_IBLOCK_INTO_CHAIN' => 'N',
            'ADD_SECTIONS_CHAIN' => 'N',
            'CACHE_TYPE' => 'A',
            'CACHE_TIME' => '3600',
        ], false, ['HIDE_ICONS' => 'Y']); ?>

        <div class="text-center mt-5" data-reveal>
            <a class="btn btn-nlb-green btn-lg-nlb btn-icon" href="<?= SITE_DIR ?>printing/">
                Весь каталог печатных услуг
                <svg class="i" aria-hidden="true"><use href="#i-arrow-right"/></svg>
            </a>
        </div>
    </div>
</section>

<section class="section">
    <div class="container">
        <div class="section-head" data-reveal>
            <span class="eyebrow eyebrow--red">Как начать</span>
            <h2 class="section-title">Читательский билет за три шага</h2>
            <p class="section-lead">
                Билет бесплатный, оформляется при первом посещении. Нужен паспорт
                или другой документ с фотографией.
            </p>
        </div>

        <div class="row g-4">
            <div class="col-md-4" data-reveal>
                <div class="info-card">
                    <span class="icon-tile icon-tile--blue mb-3">
                        <svg class="i" aria-hidden="true"><use href="#i-file"/></svg>
                    </span>
                    <h3>1. Возьмите документ</h3>
                    <p class="text-muted mb-0">
                        Паспорт, студенческий или служебный пропуск — достаточно
                        одного документа с фотографией.
                    </p>
                </div>
            </div>
            <div class="col-md-4" data-reveal>
                <div class="info-card">
                    <span class="icon-tile icon-tile--green mb-3">
                        <svg class="i" aria-hidden="true"><use href="#i-user"/></svg>
                    </span>
                    <h3>2. Заполните заявление</h3>
                    <p class="text-muted mb-0">
                        Форма на стойке регистрации или на этой странице — сотрудник
                        поможет и ответит на вопросы.
                    </p>
                </div>
            </div>
            <div class="col-md-4" data-reveal>
                <div class="info-card">
                    <span class="icon-tile icon-tile--orange mb-3">
                        <svg class="i" aria-hidden="true"><use href="#i-card"/></svg>
                    </span>
                    <h3>3. Получите билет</h3>
                    <p class="text-muted mb-0">
                        Билет действует во всех читальных залах и даёт доступ
                        к электронным ресурсам.
                    </p>
                </div>
            </div>
        </div>
    </div>
</section>

<section class="section section--soft">
    <div class="container">
        <div class="cta-banner" data-reveal>
            <h2>Готовы начать?</h2>
            <p class="text-white-75 mb-4">
                Запишитесь онлайн или задайте вопрос — ответим в течение дня.
            </p>
            <div class="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                <a class="btn btn-nlb-white btn-lg-nlb" href="<?= SITE_DIR ?>auth/register/">
                    Записаться в библиотеку
                </a>
                <a class="btn btn-nlb-outline btn-lg-nlb" href="<?= SITE_DIR ?>feedback/">
                    Задать вопрос
                </a>
            </div>
        </div>
    </div>
</section>

<?php require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php'; ?>
