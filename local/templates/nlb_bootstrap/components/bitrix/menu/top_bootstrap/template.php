<?php
/**
 * Шаблон компонента bitrix:menu → Bootstrap navbar с выпадающими списками.
 * Подключение: $APPLICATION->IncludeComponent('bitrix:menu', 'top_bootstrap', [...]);
 *
 * Второй уровень приходит из .left.menu.php раздела (CHILD_MENU_TYPE = left,
 * MAX_LEVEL = 2): компонент отдаёт плоский список с DEPTH_LEVEL и IS_PARENT.
 * Шаблон собирает из него дерево и рисует пункты с подменю как dropdown.
 */

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
    die();
}

$this->setFrameMode(true);

$items = is_array($arResult) ? $arResult : [];

/* Дерево: пункты DEPTH_LEVEL > 1 вкладываются в ближайший пункт первого уровня. */
$tree = [];
$parentIndex = null;
foreach ($items as $item) {
    if ((int)($item['DEPTH_LEVEL'] ?? 1) > 1) {
        if ($parentIndex !== null) {
            $tree[$parentIndex]['CHILDREN'][] = $item;
        }
        continue;
    }

    $tree[] = [
        'TEXT' => (string)($item['TEXT'] ?? ''),
        'LINK' => (string)($item['LINK'] ?? '#'),
        'SELECTED' => !empty($item['SELECTED']),
        'CHILDREN' => [],
    ];
    $parentIndex = count($tree) - 1;
}

// Родитель подсвечивается, когда открыт любой его подпункт.
foreach ($tree as &$node) {
    foreach ($node['CHILDREN'] as $child) {
        if (!empty($child['SELECTED'])) {
            $node['SELECTED'] = true;
        }
    }
}
unset($node);
?>
<ul class="navbar-nav mx-auto">
    <?php foreach ($tree as $index => $node):
        $isSelected = !empty($node['SELECTED']);
        $link = $node['LINK'] !== '' ? $node['LINK'] : '#';
        $hasChildren = !empty($node['CHILDREN']);
        ?>
        <?php if ($hasChildren): ?>
            <?php $menuId = 'nlb-menu-' . (int)$index; ?>
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle<?= $isSelected ? ' active' : '' ?>"
                   href="<?= htmlspecialcharsbx($link) ?>" id="<?= $menuId ?>"
                   role="button" data-bs-toggle="dropdown" aria-expanded="false"<?= $isSelected ? ' aria-current="page"' : '' ?>>
                    <?= $node['TEXT'] ?>
                </a>
                <ul class="dropdown-menu" aria-labelledby="<?= $menuId ?>">
                    <?php foreach ($node['CHILDREN'] as $child):
                        $childSelected = !empty($child['SELECTED']);
                        ?>
                        <li>
                            <a class="dropdown-item<?= $childSelected ? ' active' : '' ?>"
                               href="<?= htmlspecialcharsbx((string)($child['LINK'] ?? '#')) ?>"<?= $childSelected ? ' aria-current="page"' : '' ?>>
                                <?= $child['TEXT'] ?>
                            </a>
                        </li>
                    <?php endforeach; ?>
                </ul>
            </li>
        <?php else: ?>
            <li class="nav-item">
                <a class="nav-link<?= $isSelected ? ' active' : '' ?>"
                   href="<?= htmlspecialcharsbx($link) ?>"<?= $isSelected ? ' aria-current="page"' : '' ?>>
                    <?= $node['TEXT'] ?>
                </a>
            </li>
        <?php endif; ?>
    <?php endforeach; ?>
</ul>
