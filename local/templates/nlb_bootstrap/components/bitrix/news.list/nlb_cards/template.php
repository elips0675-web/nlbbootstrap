<?php
/**
 * Универсальный шаблон списка: bitrix:news.list → nlb_cards.
 *
 * Один шаблон на все инфоблоки сайта, вид карточки задаётся параметром
 * NLB_CARD: news | event | service | printing | book | collection.
 *
 * Пример вызова — docs/bitrix-integration.md, § 3–6.
 */

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

$this->setFrameMode(true);

$card = (string)($arParams['NLB_CARD'] ?? 'news');
$items = isset($arResult['ITEMS']) && is_array($arResult['ITEMS']) ? $arResult['ITEMS'] : [];
$columns = (string)($arParams['NLB_COLUMNS'] ?? 'col-sm-6 col-lg-4');
$fallbackImage = SITE_TEMPLATE_PATH . '/assets/images/news-1.jpg';
$iconFallback = 'i-book';

if (!function_exists('nlb_card_picture')) {
    /**
     * Картинка карточки: анонс → детальная → заглушка.
     */
    function nlb_card_picture(array $item, string $fallback): string
    {
        foreach (['PREVIEW_PICTURE', 'DETAIL_PICTURE'] as $key) {
            $picture = $item[$key] ?? null;
            if (is_array($picture) && !empty($picture['SRC'])) {
                return (string)$picture['SRC'];
            }
        }
        return $fallback;
    }
}

if (!function_exists('nlb_card_edit')) {
    /**
     * Иконки «редактировать/удалить» в режиме правки.
     */
    function nlb_card_edit($component, array $item): string
    {
        $id = (int)($item['ID'] ?? 0);
        if ($id <= 0) {
            return '';
        }
        $component->AddEditAction(
            $id,
            (string)($item['EDIT_LINK'] ?? ''),
            CIBlock::GetArrayByID((int)$item['IBLOCK_ID'], 'ELEMENT_EDIT')
        );
        $component->AddDeleteAction(
            $id,
            (string)($item['DELETE_LINK'] ?? ''),
            CIBlock::GetArrayByID((int)$item['IBLOCK_ID'], 'ELEMENT_DELETE'),
            ['CONFIRM' => 'Удалить элемент?']
        );
        return (string)$component->GetEditAreaId($id);
    }
}

if (!$items) {
    echo '<div class="empty-state">Материалов пока нет. Добавьте их в админке — '
        . 'раздел «Контент → Инфоблоки».</div>';
    return;
}
?>
<?php if ($card === 'service-feature'): ?>
    <div class="service-feature-list">
        <?php foreach ($items as $index => $arItem):
            $editArea = nlb_card_edit($this, $arItem);
            $name = (string)($arItem['NAME'] ?? '');
            $link = (string)($arItem['DETAIL_PAGE_URL'] ?? '');
            $preview = (string)($arItem['PREVIEW_TEXT'] ?? '');
            $image = nlb_card_picture($arItem, $fallbackImage);
            $icon = nlb_value($arItem, 'ICON', 'book');
            $color = nlb_grad_class(nlb_xml_id($arItem, 'COLOR'));
            $duration = nlb_value($arItem, 'DURATION');
            $features = nlb_values($arItem, 'FEATURES');
            $price = nlb_price(nlb_value($arItem, 'PRICE_FROM'));
            $reverse = $index % 2 === 1;
            ?>
            <article class="service-feature<?= $reverse ? ' service-feature--reverse' : '' ?>"
                <?= $editArea !== '' ? ' id="' . $editArea . '"' : '' ?>>
                <div class="service-feature-media">
                    <img src="<?= htmlspecialcharsbx($image) ?>" alt="<?= htmlspecialcharsbx($name) ?>"
                         loading="lazy" decoding="async">
                    <span class="service-feature-icon bg-grad-<?= htmlspecialcharsbx($color) ?>">
                        <svg class="i" aria-hidden="true"><use href="#i-<?= htmlspecialcharsbx($icon) ?>"/></svg>
                    </span>
                </div>
                <div class="service-feature-body">
                    <?php if ($duration !== ''): ?>
                        <span class="service-feature-badge">
                            <svg class="i" aria-hidden="true"><use href="#i-clock"/></svg>
                            <?= htmlspecialcharsbx($duration) ?>
                        </span>
                    <?php endif; ?>
                    <h2 class="service-feature-title"><?= htmlspecialcharsbx($name) ?></h2>
                    <?php if ($preview !== ''): ?>
                        <p class="service-feature-lead"><?= htmlspecialcharsbx($preview) ?></p>
                    <?php endif; ?>
                    <span class="service-feature-price bg-grad-<?= htmlspecialcharsbx($color) ?>">
                        <?= $price !== '' ? htmlspecialcharsbx($price) : 'Бесплатно для читателей' ?>
                    </span>
                    <?php if ($features): ?>
                        <ul class="service-feature-points">
                            <?php foreach ($features as $feature): ?>
                                <li>
                                    <span class="service-feature-check bg-grad-<?= htmlspecialcharsbx($color) ?>">
                                        <svg class="i" aria-hidden="true"><use href="#i-check"/></svg>
                                    </span>
                                    <?= htmlspecialcharsbx($feature) ?>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    <?php endif; ?>
                    <div class="service-feature-actions">
                        <a class="btn btn-nlb btn-lg-nlb" href="<?= SITE_DIR ?>feedback/">
                            Забронировать
                            <svg class="i" aria-hidden="true"><use href="#i-arrow-right"/></svg>
                        </a>
                        <?php if ($link !== ''): ?>
                            <a class="btn btn-nlb-outline btn-lg-nlb" href="<?= htmlspecialcharsbx($link) ?>">
                                Узнать подробнее
                            </a>
                        <?php endif; ?>
                    </div>
                </div>
            </article>
        <?php endforeach; ?>
    </div>
    <?php return; ?>
<?php endif; ?>
<div class="row g-4">
    <?php foreach ($items as $arItem):
        $editArea = nlb_card_edit($this, $arItem);
        $name = (string)($arItem['NAME'] ?? '');
        $link = (string)($arItem['DETAIL_PAGE_URL'] ?? '');
        $preview = (string)($arItem['PREVIEW_TEXT'] ?? '');
        $image = nlb_card_picture($arItem, $fallbackImage);
        ?>
        <div class="<?= htmlspecialcharsbx($columns) ?>"<?= $editArea !== '' ? ' id="' . $editArea . '"' : '' ?>>
            <?php if ($card === 'service'): ?>
                <?php
                $icon = nlb_value($arItem, 'ICON', 'book');
                $color = nlb_color_class(nlb_xml_id($arItem, 'COLOR'));
                ?>
                <div class="service-card h-100">
                    <span class="icon-tile icon-tile--<?= htmlspecialcharsbx($color) ?>">
                        <svg class="i" aria-hidden="true"><use href="#i-<?= htmlspecialcharsbx($icon) ?>"/></svg>
                    </span>
                    <h3>
                        <?php if ($link !== ''): ?>
                            <a class="stretched-link text-reset" href="<?= htmlspecialcharsbx($link) ?>"><?= htmlspecialcharsbx($name) ?></a>
                        <?php else: ?>
                            <?= htmlspecialcharsbx($name) ?>
                        <?php endif; ?>
                    </h3>
                    <?php if ($preview !== ''): ?>
                        <p><?= htmlspecialcharsbx($preview) ?></p>
                    <?php endif; ?>
                    <?php $duration = nlb_value($arItem, 'DURATION'); ?>
                    <?php if ($duration !== ''): ?>
                        <p class="small text-muted mb-0"><?= htmlspecialcharsbx($duration) ?></p>
                    <?php endif; ?>
                </div>

            <?php elseif ($card === 'printing'): ?>
                <?php
                $icon = nlb_value($arItem, 'ICON', 'printer');
                $price = nlb_price(nlb_value($arItem, 'PRICE_FROM'));
                $unit = nlb_value($arItem, 'UNIT');
                ?>
                <article class="print-card h-100">
                    <div class="print-media">
                        <img src="<?= htmlspecialcharsbx($image) ?>" alt="<?= htmlspecialcharsbx($name) ?>" loading="lazy" decoding="async">
                        <span class="print-badge bg-grad-<?= htmlspecialcharsbx(nlb_grad_class(nlb_xml_id($arItem, 'COLOR'))) ?>">
                            <svg class="i" aria-hidden="true"><use href="#i-<?= htmlspecialcharsbx($icon) ?>"/></svg>
                        </span>
                    </div>
                    <div class="print-body">
                        <h3 class="print-title"><?= htmlspecialcharsbx($name) ?></h3>
                        <?php if ($preview !== ''): ?>
                            <p class="print-text"><?= htmlspecialcharsbx($preview) ?></p>
                        <?php endif; ?>
                        <?php if ($price !== ''): ?>
                            <div class="fw-bold text-dark mb-2">
                                <?= htmlspecialcharsbx($price) ?>
                                <?php if ($unit !== ''): ?>
                                    <span class="small fw-normal text-muted">· <?= htmlspecialcharsbx($unit) ?></span>
                                <?php endif; ?>
                            </div>
                        <?php endif; ?>
                        <?php if ($link !== ''): ?>
                            <a class="print-link" href="<?= htmlspecialcharsbx($link) ?>">
                                Подробнее
                                <svg class="i" aria-hidden="true"><use href="#i-arrow-right"/></svg>
                            </a>
                        <?php endif; ?>
                    </div>
                </article>

            <?php elseif ($card === 'event'): ?>
                <?php
                $rawDate = nlb_value($arItem, 'DATE');
                $timestamp = $rawDate !== '' ? strtotime($rawDate) : false;
                $place = nlb_value($arItem, 'PLACE', 'Библиотека');
                $seats = (int)nlb_value($arItem, 'SEATS');
                $register = nlb_value($arItem, 'REGISTER_URL', $link);
                $category = nlb_xml_id($arItem, 'CATEGORY');
                $categoryName = nlb_value($arItem, 'CATEGORY', 'Событие');
                ?>
                <article class="nlb-card h-100">
                    <div class="nlb-card__media">
                        <img src="<?= htmlspecialcharsbx($image) ?>" alt="<?= htmlspecialcharsbx($name) ?>" loading="lazy" decoding="async">
                        <span class="event-cat <?= htmlspecialcharsbx(nlb_event_cat_class($category)) ?>">
                            <?= htmlspecialcharsbx($categoryName) ?>
                        </span>
                        <?php if ($timestamp): ?>
                            <span class="event-date">
                                <b><?= date('d', $timestamp) ?></b>
                                <span><?= FormatDate('M', $timestamp) ?></span>
                            </span>
                        <?php endif; ?>
                    </div>
                    <div class="nlb-card__body">
                        <h3 class="event-title">
                            <?php if ($link !== ''): ?>
                                <a class="text-reset" href="<?= htmlspecialcharsbx($link) ?>"><?= htmlspecialcharsbx($name) ?></a>
                            <?php else: ?>
                                <?= htmlspecialcharsbx($name) ?>
                            <?php endif; ?>
                        </h3>
                        <?php if ($preview !== ''): ?>
                            <p class="event-text clamp-2"><?= htmlspecialcharsbx($preview) ?></p>
                        <?php endif; ?>
                        <div class="event-meta">
                            <?php if ($timestamp): ?>
                                <span>
                                    <svg class="i i-20" aria-hidden="true"><use href="#i-clock"/></svg>
                                    <?= date('H:i', $timestamp) ?>
                                </span>
                            <?php endif; ?>
                            <span>
                                <svg class="i i-20" aria-hidden="true"><use href="#i-pin"/></svg>
                                <?= htmlspecialcharsbx($place) ?>
                            </span>
                            <?php if ($seats > 0): ?>
                                <span>
                                    <svg class="i i-20" aria-hidden="true"><use href="#i-users"/></svg>
                                    <?= $seats ?> мест
                                </span>
                            <?php endif; ?>
                        </div>
                        <?php if ($register !== ''): ?>
                            <a class="event-btn" href="<?= htmlspecialcharsbx($register) ?>">Зарегистрироваться</a>
                        <?php endif; ?>
                    </div>
                </article>

            <?php elseif ($card === 'book'): ?>
                <?php
                $author = nlb_value($arItem, 'AUTHOR', 'Автор не указан');
                $year = nlb_value($arItem, 'YEAR');
                $available = nlb_value($arItem, 'AVAILABLE', 'В наличии');
                $availableXml = nlb_xml_id($arItem, 'AVAILABLE');
                $availableClass = $availableXml === 'available' ? 'is-available'
                    : ($availableXml === 'reserved' ? 'is-reserved' : 'is-unavailable');
                $palette = ['primary', 'green', 'sky', 'pink', 'orange'];
                $coverClass = $palette[abs(crc32($name)) % count($palette)];
                ?>
                <article class="book-card h-100">
                    <a class="book-cover book-cover--<?= $coverClass ?>" href="<?= htmlspecialcharsbx($link) ?>" aria-hidden="true" tabindex="-1">
                        <svg class="i" aria-hidden="true"><use href="#i-book"/></svg>
                        <span><?= htmlspecialcharsbx(mb_substr($name, 0, 28)) ?></span>
                    </a>
                    <div class="book-body">
                        <span class="book-status <?= $availableClass ?>"><?= htmlspecialcharsbx($available) ?></span>
                        <h3 class="book-title">
                            <a class="text-reset" href="<?= htmlspecialcharsbx($link) ?>"><?= htmlspecialcharsbx($name) ?></a>
                        </h3>
                        <p class="book-author"><?= htmlspecialcharsbx($author) ?><?= $year !== '' ? ', ' . htmlspecialcharsbx($year) : '' ?></p>
                        <?php if ($preview !== ''): ?>
                            <p class="book-text clamp-2"><?= htmlspecialcharsbx($preview) ?></p>
                        <?php endif; ?>
                    </div>
                </article>

            <?php elseif ($card === 'collection'): ?>
                <?php
                $icon = nlb_value($arItem, 'ICON', 'book');
                $color = nlb_color_class(nlb_xml_id($arItem, 'COLOR'));
                $bg = nlb_collection_class(nlb_xml_id($arItem, 'COLOR'));
                $count = (int)nlb_value($arItem, 'COUNT');
                ?>
                <div class="collection-card collection-card--<?= htmlspecialcharsbx($bg) ?> h-100">
                    <span class="icon-tile icon-tile--<?= htmlspecialcharsbx($color) ?>">
                        <svg class="i" aria-hidden="true"><use href="#i-<?= htmlspecialcharsbx($icon) ?>"/></svg>
                    </span>
                    <h3><?= htmlspecialcharsbx($name) ?></h3>
                    <?php if ($count > 0): ?>
                        <div class="collection-count"><?= $count ?> книг</div>
                    <?php endif; ?>
                    <?php if ($preview !== ''): ?>
                        <p class="collection-text"><?= htmlspecialcharsbx($preview) ?></p>
                    <?php endif; ?>
                    <?php if ($link !== ''): ?>
                        <a class="collection-more" href="<?= htmlspecialcharsbx($link) ?>">
                            Узнать больше
                            <svg class="i i-20" aria-hidden="true"><use href="#i-arrow-right"/></svg>
                        </a>
                    <?php endif; ?>
                </div>

            <?php else: ?>
                <article class="nlb-card h-100">
                    <a class="d-block h-100" href="<?= htmlspecialcharsbx($link) ?>">
                        <div class="nlb-card__media">
                            <img src="<?= htmlspecialcharsbx($image) ?>" alt="<?= htmlspecialcharsbx($name) ?>" loading="lazy" decoding="async">
                        </div>
                        <div class="nlb-card__body">
                            <p class="news-date"><?= (string)($arItem['DISPLAY_ACTIVE_FROM'] ?? '') ?></p>
                            <h3 class="news-title"><?= htmlspecialcharsbx($name) ?></h3>
                            <?php if ($preview !== ''): ?>
                                <p class="news-text clamp-2"><?= htmlspecialcharsbx($preview) ?></p>
                            <?php endif; ?>
                        </div>
                    </a>
                </article>
            <?php endif; ?>
        </div>
    <?php endforeach; ?>
</div>

<?php if (!empty($arResult['NAV_STRING'])): ?>
    <div class="pagination-wrap mt-5">
        <?= $arResult['NAV_STRING'] ?>
    </div>
<?php endif; ?>
