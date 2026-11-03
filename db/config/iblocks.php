<?php
/**
 * NLB Bootstrap — структура данных сайта библиотеки.
 *
 * Файл не требует ядра Битрикса: это чистый массив, который читают
 * миграции (db/migrations/*) и офлайн-линтер (db/lint.php).
 *
 * Соглашения:
 *  - ID типов инфоблоков — [a-z0-9_], префикс nlb_ (свои данные не смешиваем
 *    с демо-типами Битрикса);
 *  - коды инфоблоков — [a-z0-9_] без префикса: news, events, books...;
 *  - коды свойств — ВЕРХНИЙ_РЕГИСТР, как в шаблонах компонентов
 *    ($arItem['PROPERTIES']['AUTHOR']);
 *  - XML_ID элементов и разделов — nlb-<iblock>-<номер>, nlb-sec-<iblock>-<код>.
 *
 * Типы свойств: S — строка, N — число, L — список, F — файл.
 * user_type: 'DateTime' — свойство «дата/время» (хранится в формате сайта).
 */

return [
    /* ------------------------------------------------------------------ */
    /* 1. Типы инфоблоков                                                 */
    /* ------------------------------------------------------------------ */

    'types' => [
        'nlb_content' => [
            'name' => 'Контент библиотеки',
            'sort' => 100,
            'sections' => 'Y',
            'in_rss' => 'N',
            'lang' => [
                'ru' => [
                    'name' => 'Контент библиотеки',
                    'section_name' => 'Разделы',
                    'element_name' => 'Материалы',
                ],
                'en' => [
                    'name' => 'Library content',
                    'section_name' => 'Sections',
                    'element_name' => 'Items',
                ],
            ],
        ],
        'nlb_catalog' => [
            'name' => 'Каталог книг',
            'sort' => 200,
            'sections' => 'Y',
            'in_rss' => 'N',
            'lang' => [
                'ru' => [
                    'name' => 'Каталог книг',
                    'section_name' => 'Жанры',
                    'element_name' => 'Книги',
                ],
                'en' => [
                    'name' => 'Book catalog',
                    'section_name' => 'Genres',
                    'element_name' => 'Books',
                ],
            ],
        ],
        'nlb_services' => [
            'name' => 'Услуги библиотеки',
            'sort' => 300,
            'sections' => 'N',
            'in_rss' => 'N',
            'lang' => [
                'ru' => [
                    'name' => 'Услуги библиотеки',
                    'section_name' => 'Разделы',
                    'element_name' => 'Услуги',
                ],
                'en' => [
                    'name' => 'Library services',
                    'section_name' => 'Sections',
                    'element_name' => 'Services',
                ],
            ],
        ],
    ],

    /* ------------------------------------------------------------------ */
    /* 2. Инфоблоки                                                       */
    /* ------------------------------------------------------------------ */

    'iblocks' => [
        'news' => [
            'type' => 'nlb_content',
            'name' => 'Новости',
            'sort' => 100,
            'list_page_url' => '/news/',
            'detail_page_url' => '/news/#ELEMENT_CODE#/',
            'section_page_url' => '/news/#SECTION_CODE#/',
            'sections' => 'Y',
            'properties' => [
                'AUTHOR' => [
                    'name' => 'Автор',
                    'type' => 'S',
                    'sort' => 100,
                    'searchable' => 'Y',
                ],
                'TAGS' => [
                    'name' => 'Теги',
                    'type' => 'L',
                    'multiple' => 'Y',
                    'sort' => 110,
                    'values' => [
                        ['xml_id' => 'books', 'value' => 'Книги', 'sort' => 10],
                        ['xml_id' => 'digital', 'value' => 'Цифровые ресурсы', 'sort' => 20],
                        ['xml_id' => 'events', 'value' => 'События', 'sort' => 30],
                        ['xml_id' => 'kids', 'value' => 'Дети', 'sort' => 40],
                        ['xml_id' => 'science', 'value' => 'Наука', 'sort' => 50],
                        ['xml_id' => 'library', 'value' => 'Библиотека', 'sort' => 60],
                    ],
                ],
                'READ_TIME' => [
                    'name' => 'Время чтения',
                    'type' => 'S',
                    'sort' => 120,
                ],
                'SOURCE_URL' => [
                    'name' => 'Источник, ссылка',
                    'type' => 'S',
                    'sort' => 130,
                ],
            ],
            'sections_data' => [
                ['code' => 'library', 'name' => 'Новости библиотеки', 'sort' => 100],
                ['code' => 'announcements', 'name' => 'Анонсы', 'sort' => 110],
            ],
        ],

        'events' => [
            'type' => 'nlb_content',
            'name' => 'События',
            'sort' => 110,
            'list_page_url' => '/events/',
            'detail_page_url' => '/events/#ELEMENT_CODE#/',
            'section_page_url' => '/events/#SECTION_CODE#/',
            'sections' => 'Y',
            'properties' => [
                'DATE' => [
                    'name' => 'Дата и время',
                    'type' => 'S',
                    'user_type' => 'DateTime',
                    'required' => 'Y',
                    'sort' => 100,
                ],
                'PLACE' => [
                    'name' => 'Место проведения',
                    'type' => 'S',
                    'sort' => 110,
                    'searchable' => 'Y',
                ],
                'CATEGORY' => [
                    'name' => 'Категория',
                    'type' => 'L',
                    'sort' => 120,
                    'values' => [
                        ['xml_id' => 'literature', 'value' => 'Литература', 'sort' => 10],
                        ['xml_id' => 'children', 'value' => 'Для детей', 'sort' => 20],
                        ['xml_id' => 'tech', 'value' => 'Технологии', 'sort' => 30],
                        ['xml_id' => 'lecture', 'value' => 'Лекции', 'sort' => 40],
                    ],
                ],
                'FORMAT' => [
                    'name' => 'Формат',
                    'type' => 'L',
                    'sort' => 130,
                    'values' => [
                        ['xml_id' => 'offline', 'value' => 'Офлайн', 'sort' => 10],
                        ['xml_id' => 'online', 'value' => 'Онлайн', 'sort' => 20],
                        ['xml_id' => 'hybrid', 'value' => 'Гибрид', 'sort' => 30],
                    ],
                ],
                'SEATS' => [
                    'name' => 'Мест',
                    'type' => 'N',
                    'sort' => 140,
                ],
                'PRICE' => [
                    'name' => 'Стоимость',
                    'type' => 'S',
                    'sort' => 150,
                ],
                'DURATION' => [
                    'name' => 'Длительность',
                    'type' => 'S',
                    'sort' => 160,
                ],
                'REGISTER_URL' => [
                    'name' => 'Ссылка на регистрацию',
                    'type' => 'S',
                    'sort' => 170,
                ],
            ],
            'sections_data' => [
                ['code' => 'literature', 'name' => 'Литература', 'sort' => 100],
                ['code' => 'children', 'name' => 'Для детей', 'sort' => 110],
                ['code' => 'tech', 'name' => 'Технологии', 'sort' => 120],
                ['code' => 'lectures', 'name' => 'Лекции', 'sort' => 130],
            ],
        ],

        'collections' => [
            'type' => 'nlb_content',
            'name' => 'Коллекции',
            'sort' => 120,
            'list_page_url' => '/collections/',
            'detail_page_url' => '/collections/#ELEMENT_CODE#/',
            'section_page_url' => '',
            'sections' => 'N',
            'properties' => [
                'COUNT' => [
                    'name' => 'Книг в подборке',
                    'type' => 'N',
                    'sort' => 100,
                ],
                'COLOR' => [
                    'name' => 'Цвет карточки',
                    'type' => 'L',
                    'sort' => 110,
                    'values' => [
                        ['xml_id' => 'primary', 'value' => 'Синий', 'sort' => 10],
                        ['xml_id' => 'green', 'value' => 'Зелёный', 'sort' => 20],
                        ['xml_id' => 'sky', 'value' => 'Голубой', 'sort' => 30],
                        ['xml_id' => 'pink', 'value' => 'Розовый', 'sort' => 40],
                        ['xml_id' => 'orange', 'value' => 'Оранжевый', 'sort' => 50],
                    ],
                ],
                'ICON' => [
                    'name' => 'Иконка (код символа)',
                    'type' => 'S',
                    'sort' => 120,
                ],
            ],
            'sections_data' => [],
        ],

        'books' => [
            'type' => 'nlb_catalog',
            'name' => 'Каталог книг',
            'sort' => 200,
            'list_page_url' => '/books/',
            'detail_page_url' => '/books/#ELEMENT_CODE#/',
            'section_page_url' => '/books/#SECTION_CODE#/',
            'sections' => 'Y',
            'properties' => [
                'AUTHOR' => [
                    'name' => 'Автор',
                    'type' => 'S',
                    'sort' => 100,
                    'searchable' => 'Y',
                ],
                'YEAR' => [
                    'name' => 'Год издания',
                    'type' => 'N',
                    'sort' => 110,
                ],
                'ISBN' => [
                    'name' => 'ISBN',
                    'type' => 'S',
                    'sort' => 120,
                ],
                'PUBLISHER' => [
                    'name' => 'Издательство',
                    'type' => 'S',
                    'sort' => 130,
                ],
                'PAGES' => [
                    'name' => 'Страниц',
                    'type' => 'N',
                    'sort' => 140,
                ],
                'AGE_LIMIT' => [
                    'name' => 'Возрастное ограничение',
                    'type' => 'L',
                    'sort' => 150,
                    'values' => [
                        ['xml_id' => '0plus', 'value' => '0+', 'sort' => 10],
                        ['xml_id' => '6plus', 'value' => '6+', 'sort' => 20],
                        ['xml_id' => '12plus', 'value' => '12+', 'sort' => 30],
                        ['xml_id' => '16plus', 'value' => '16+', 'sort' => 40],
                        ['xml_id' => '18plus', 'value' => '18+', 'sort' => 50],
                    ],
                ],
                'AVAILABLE' => [
                    'name' => 'Доступность',
                    'type' => 'L',
                    'sort' => 160,
                    'values' => [
                        ['xml_id' => 'available', 'value' => 'В наличии', 'sort' => 10],
                        ['xml_id' => 'reserved', 'value' => 'Забронирована', 'sort' => 20],
                        ['xml_id' => 'unavailable', 'value' => 'Выдана', 'sort' => 30],
                    ],
                ],
                'SHELF' => [
                    'name' => 'Шифр / полка',
                    'type' => 'S',
                    'sort' => 170,
                ],
            ],
            'sections_data' => [
                ['code' => 'fiction', 'name' => 'Художественная литература', 'sort' => 100],
                ['code' => 'history', 'name' => 'История', 'sort' => 110],
                ['code' => 'science', 'name' => 'Наука', 'sort' => 120],
                ['code' => 'children', 'name' => 'Детская литература', 'sort' => 130],
                ['code' => 'business', 'name' => 'Бизнес и саморазвитие', 'sort' => 140],
                ['code' => 'art', 'name' => 'Искусство', 'sort' => 150],
            ],
        ],

        'services' => [
            'type' => 'nlb_services',
            'name' => 'Услуги',
            'sort' => 300,
            'list_page_url' => '/services/',
            'detail_page_url' => '/services/#ELEMENT_CODE#/',
            'section_page_url' => '',
            'sections' => 'N',
            'properties' => [
                'ICON' => [
                    'name' => 'Иконка (код символа)',
                    'type' => 'S',
                    'sort' => 100,
                ],
                'COLOR' => [
                    'name' => 'Цвет',
                    'type' => 'L',
                    'sort' => 110,
                    'values' => [
                        ['xml_id' => 'primary', 'value' => 'Синий', 'sort' => 10],
                        ['xml_id' => 'green', 'value' => 'Зелёный', 'sort' => 20],
                        ['xml_id' => 'sky', 'value' => 'Голубой', 'sort' => 30],
                        ['xml_id' => 'pink', 'value' => 'Розовый', 'sort' => 40],
                        ['xml_id' => 'orange', 'value' => 'Оранжевый', 'sort' => 50],
                    ],
                ],
                'PRICE_FROM' => [
                    'name' => 'Цена от, ₽',
                    'type' => 'N',
                    'sort' => 120,
                ],
                'DURATION' => [
                    'name' => 'Режим / длительность',
                    'type' => 'S',
                    'sort' => 130,
                ],
            ],
            'sections_data' => [],
        ],

        'printing' => [
            'type' => 'nlb_services',
            'name' => 'Печатные услуги',
            'sort' => 310,
            'list_page_url' => '/printing/',
            'detail_page_url' => '/printing/#ELEMENT_CODE#/',
            'section_page_url' => '',
            'sections' => 'N',
            'properties' => [
                'ICON' => [
                    'name' => 'Иконка (код символа)',
                    'type' => 'S',
                    'sort' => 100,
                ],
                'COLOR' => [
                    'name' => 'Цвет',
                    'type' => 'L',
                    'sort' => 110,
                    'values' => [
                        ['xml_id' => 'primary', 'value' => 'Синий', 'sort' => 10],
                        ['xml_id' => 'green', 'value' => 'Зелёный', 'sort' => 20],
                        ['xml_id' => 'sky', 'value' => 'Голубой', 'sort' => 30],
                        ['xml_id' => 'pink', 'value' => 'Розовый', 'sort' => 40],
                        ['xml_id' => 'orange', 'value' => 'Оранжевый', 'sort' => 50],
                    ],
                ],
                'PRICE_FROM' => [
                    'name' => 'Цена от, ₽',
                    'type' => 'N',
                    'sort' => 120,
                ],
                'UNIT' => [
                    'name' => 'Единица измерения',
                    'type' => 'S',
                    'sort' => 130,
                ],
            ],
            'sections_data' => [],
        ],
    ],
];
