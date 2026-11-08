<?php
/**
 * 013 — заявки: источник, ответственный и дата обработки.
 *
 * Без этих полей нельзя ответить на вопросы «какой канал приносит заявки»
 * и «сколько заявок висит без ответа». Шаг досоздаёт три свойства в
 * requests, bookings и orders по конфигу db/config/iblocks.php:
 *  - SOURCE         — нормализованный канал (utm:telegram, ref:t.me, site);
 *  - CREATED_BY     — логин сотрудника, закрывшего заявку;
 *  - DATE_PROCESSED — дата и время закрытия (DateTime).
 *
 * Там же задаются колонки списка заявок в админке: свойства по умолчанию
 * не видны, а без них аналитика остаётся «в базе, но не на экране».
 * Повторный запуск ничего не дублирует.
 */

return static function (): array {
    $config = nlb_load_config('iblocks');
    $codes = ['requests', 'bookings', 'orders'];
    $propertyCodes = ['SOURCE', 'CREATED_BY', 'DATE_PROCESSED'];
    $created = 0;
    $skipped = 0;
    $notes = [];

    foreach ($codes as $code) {
        $iblock = $config['iblocks'][$code] ?? null;
        if (!$iblock) {
            throw new RuntimeException("013: в db/config/iblocks.php нет инфоблока {$code}");
        }

        $iblockId = nlb_iblock_id($code);
        if ($iblockId <= 0) {
            throw new RuntimeException("013: инфоблок {$code} не найден (сначала 008)");
        }

        $propertyIds = [];
        foreach ($propertyCodes as $propertyCode) {
            $property = $iblock['properties'][$propertyCode] ?? null;
            if (!$property) {
                throw new RuntimeException("013: в конфиге {$code} нет свойства {$propertyCode}");
            }

            $existing = nlb_property($iblockId, $propertyCode);
            if ($existing) {
                $propertyIds[$propertyCode] = (int)$existing['ID'];
                $skipped++;
                continue;
            }

            $multiple = $property['multiple'] ?? 'N';
            $fields = [
                'IBLOCK_ID' => $iblockId,
                'NAME' => $property['name'],
                'CODE' => $propertyCode,
                'ACTIVE' => 'Y',
                'SORT' => (int)($property['sort'] ?? 500),
                'PROPERTY_TYPE' => $property['type'],
                'MULTIPLE' => $multiple,
                'IS_REQUIRED' => $property['required'] ?? 'N',
                'SEARCHABLE' => $property['searchable'] ?? 'N',
                'FILTRABLE' => $property['filtrable'] ?? 'N',
                'LIST_TYPE' => $multiple === 'Y' ? 'C' : 'L',
                'USER_TYPE' => $property['user_type'] ?? false,
            ];

            $object = new CIBlockProperty();
            $propertyId = (int)$object->Add($fields);
            if ($propertyId <= 0) {
                $error = isset($object->LAST_ERROR) ? (string)$object->LAST_ERROR : '';
                throw new RuntimeException("свойство {$code}.{$propertyCode}: " . ($error ?: 'не удалось создать'));
            }

            $propertyIds[$propertyCode] = $propertyId;
            $created++;
            $notes[] = "создано свойство {$code}.{$propertyCode} (ID {$propertyId})";
        }

        $columns = ['ID', 'NAME'];
        foreach (['STATUS', 'SOURCE', 'CREATED_BY', 'DATE_PROCESSED'] as $columnCode) {
            $columnId = $propertyIds[$columnCode] ?? 0;
            if ($columnId === 0) {
                $columnRow = nlb_property($iblockId, $columnCode);
                $columnId = $columnRow ? (int)$columnRow['ID'] : 0;
            }
            if ($columnId > 0) {
                $columns[] = 'PROPERTY_' . $columnId;
            }
        }
        $columns[] = 'TIMESTAMP_X';

        if (class_exists('CGridOptions')) {
            $gridId = 'tbl_iblock_list_' . md5($iblock['type'] . '.' . $iblockId);
            $grid = new CGridOptions($gridId);
            $grid->SetDefaultView([
                'name' => 'Заявки с сайта',
                'columns' => implode(',', $columns),
                'sort_by' => 'ID',
                'sort_order' => 'desc',
                'page_size' => '20',
                'saved_filter' => '',
                'custom_names' => [],
            ]);
            $notes[] = "колонки списка {$code}: источник, ответственный, дата обработки";
        } else {
            $notes[] = "колонки списка {$code} пропущены: нет классов ядра (заглушки)";
        }
    }

    return ['created' => $created, 'skipped' => $skipped, 'notes' => $notes];
};
