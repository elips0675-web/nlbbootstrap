<?php
/**
 * Услуги библиотеки — список.
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
        <span class="eyebrow eyebrow--red">Сервисы</span>
        <h1 class="page-title">Услуги</h1>
        <p class="page-lead">
            Читальные залы, коворкинг, компьютеры и обучение — всё, что нужно
            для работы, учёбы и творчества.
        </p>
    </div>
</section>

<section class="section pt-0">
    <div class="container">
        <?php $APPLICATION->IncludeComponent('bitrix:news.list', 'nlb_cards', [
            'IBLOCK_TYPE' => 'nlb_services',
            'IBLOCK_ID' => nlb_iblock_id('services'),
            'NLB_CARD' => 'service',
            'NLB_COLUMNS' => 'col-sm-6 col-lg-4',
            'NEWS_COUNT' => 12,
            'SORT_BY1' => 'SORT',
            'SORT_ORDER1' => 'ASC',
            'FIELD_CODE' => ['NAME', 'PREVIEW_TEXT', 'DETAIL_PAGE_URL'],
            'PROPERTY_CODE' => ['ICON', 'COLOR', 'PRICE_FROM', 'DURATION'],
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
            <span class="eyebrow eyebrow--green">Как начать</span>
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

        <div class="text-center mt-5">
            <a class="btn btn-nlb btn-lg-nlb" href="<?= SITE_DIR ?>feedback/">Задать вопрос</a>
        </div>
    </div>
</section>

<section class="section">
    <div class="container">
        <div class="row g-4 align-items-center">
            <div class="col-lg-7" data-reveal>
                <span class="eyebrow eyebrow--violet">Полиграфия</span>
                <h2 class="section-title">Печать, сканирование и переплёт</h2>
                <p class="section-lead mb-0">
                    Печатаем документы, курсовые и книги, сканируем архивы,
                    делаем переплёт и сувениры. Цены — в каталоге печатных услуг.
                </p>
            </div>
            <div class="col-lg-5 text-lg-end" data-reveal>
                <a class="btn btn-nlb-green btn-lg-nlb btn-icon" href="<?= SITE_DIR ?>printing/">
                    Каталог печатных услуг
                    <svg class="i" aria-hidden="true"><use href="#i-arrow-right"/></svg>
                </a>
            </div>
        </div>
    </div>
</section>

<?php require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php'; ?>
