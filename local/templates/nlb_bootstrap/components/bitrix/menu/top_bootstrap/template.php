<?php
/**
 * Шаблон компонента bitrix:menu → Bootstrap navbar.
 * Подключение: $APPLICATION->IncludeComponent('bitrix:menu', 'top_bootstrap', [...]);
 */

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

$this->setFrameMode(true);

$items = is_array($arResult) ? $arResult : [];

// Демо-меню: нужно, чтобы шаблон выглядел готовым до создания типа меню "top".
if (empty($items)) {
    $current = $APPLICATION->GetCurPage(false);
    $demo = [
        ['TEXT' => 'Главная', 'LINK' => SITE_DIR],
        ['TEXT' => 'Новости', 'LINK' => SITE_DIR . 'news/'],
        ['TEXT' => 'События', 'LINK' => SITE_DIR . 'events/'],
        ['TEXT' => 'Услуги', 'LINK' => SITE_DIR . 'services/'],
        ['TEXT' => 'Печать', 'LINK' => SITE_DIR . 'printing/'],
        ['TEXT' => 'Книги', 'LINK' => SITE_DIR . 'books/'],
        ['TEXT' => 'Контакты', 'LINK' => SITE_DIR . 'contacts/'],
    ];

    foreach ($demo as $item) {
        $link = rtrim($item['LINK'], '/');
        $isHome = $link === rtrim(SITE_DIR, '/');
        $items[] = [
            'TEXT' => $item['TEXT'],
            'LINK' => $item['LINK'],
            'SELECTED' => $isHome
                ? rtrim($current, '/') === $link
                : $link !== '' && strpos($current, $link . '/') === 0,
            'DEPTH_LEVEL' => 1,
        ];
    }
}
?>
<ul class="navbar-nav mx-auto">
    <?php foreach ($items as $item):
        $isSelected = !empty($item['SELECTED']);
        $link = isset($item['LINK']) ? (string)$item['LINK'] : '#';
        ?>
        <li class="nav-item">
            <a class="nav-link<?= $isSelected ? ' active' : '' ?>"
               href="<?= htmlspecialcharsbx($link) ?>"<?= $isSelected ? ' aria-current="page"' : '' ?>>
                <?= $item['TEXT'] ?>
            </a>
        </li>
    <?php endforeach; ?>
</ul>
