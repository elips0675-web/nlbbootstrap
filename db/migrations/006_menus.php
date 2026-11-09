<?php
/**
 * 006 — файлы меню.
 *
 * Копирует db/menu/top.menu.php и db/menu/bottom.menu.php в корень сайта
 * как /.top.menu.php и /.bottom.menu.php. bitrix:menu ищет файл
 * .<тип>.menu.php в каталоге текущего раздела (CMenu::Init), поэтому
 * файл в подкаталоге /menu/ компонент не видит и рисует пустое меню.
 * Существующие файлы по умолчанию не перезаписываются: меню правит
 * контент-менеджер в админке («Структура сайта → Меню»).
 *
 * Перезаписать: php db/run.php --only=006 --force
 */

return static function (): array {
    $root = nlb_root();
    $force = (bool)nlb_option('force', false);
    $created = 0;
    $skipped = 0;
    $notes = [];

    if (!is_writable($root)) {
        throw new RuntimeException('корень сайта ' . $root . ' недоступен для записи');
    }

    foreach (['top', 'bottom'] as $type) {
        $source = $root . '/db/menu/' . $type . '.menu.php';
        $target = $root . '/.' . $type . '.menu.php';

        if (!is_file($source)) {
            throw new RuntimeException('нет исходного меню: ' . $source);
        }
        if (is_file($target) && !$force) {
            $skipped++;
            $notes[] = ".{$type}.menu.php уже есть (пропущено)";
            continue;
        }

        if (!@copy($source, $target)) {
            throw new RuntimeException('не удалось скопировать меню в ' . $target);
        }

        $created++;
        $notes[] = ".{$type}.menu.php записан";
    }

    return ['created' => $created, 'skipped' => $skipped, 'notes' => $notes];
};
