<?php
/**
 * Книга — детальная страница.
 */

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php';

$rawCode = isset($_REQUEST['CODE']) ? (string)$_REQUEST['CODE'] : '';
$code = (string)preg_replace('/[^a-z0-9_-]/i', '', $rawCode);
$name = nlb_element_name('books', $code);
$found = $code !== '' && $name !== '';

if (!$found && class_exists('CHTTP')) {
    CHTTP::SetStatus('404 Not Found');
}

$APPLICATION->SetTitle($found ? $name : 'Книга не найдена');
$APPLICATION->SetPageProperty(
    'description',
    $found ? 'Книга в каталоге библиотеки: ' . $name : 'Запрошенная книга не найдена.'
);

?>

<section class="section">
    <div class="container">
        <?php if ($found): ?>
            <?php $APPLICATION->IncludeComponent('bitrix:news.detail', 'nlb_detail', [
                'IBLOCK_TYPE' => 'nlb_catalog',
                'IBLOCK_ID' => nlb_iblock_id('books'),
                'ELEMENT_CODE' => $code,
                'FIELD_CODE' => [
                    'NAME',
                    'PREVIEW_TEXT',
                    'DETAIL_TEXT',
                    'PREVIEW_PICTURE',
                    'DETAIL_PICTURE',
                ],
                'PROPERTY_CODE' => [
                    'AUTHOR',
                    'YEAR',
                    'ISBN',
                    'PUBLISHER',
                    'PAGES',
                    'AGE_LIMIT',
                    'AVAILABLE',
                    'SHELF',
                ],
                'SET_TITLE' => 'N',
                'ADD_ELEMENT_CHAIN' => 'Y',
                'SET_STATUS_404' => 'Y',
                'SHOW_404' => 'N',
                'CACHE_TYPE' => 'A',
                'CACHE_TIME' => '3600',
                'NLB_BACK_URL' => SITE_DIR . 'books/',
                'NLB_BACK_TEXT' => 'Каталог книг',
            ], false, ['HIDE_ICONS' => 'Y']); ?>
        <?php else: ?>
            <div class="empty-state">
                Книга не найдена. Возможно, она списана или адрес изменился.
                <div class="mt-3">
                    <a class="btn btn-nlb" href="<?= SITE_DIR ?>books/">Каталог книг</a>
                </div>
            </div>
        <?php endif; ?>
    </div>
</section>

<?php require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php'; ?>
