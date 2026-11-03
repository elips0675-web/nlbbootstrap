<?php
/**
 * Коллекция — детальная страница.
 */

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php';

$rawCode = isset($_REQUEST['CODE']) ? (string)$_REQUEST['CODE'] : '';
$code = (string)preg_replace('/[^a-z0-9_-]/i', '', $rawCode);
$name = nlb_element_name('collections', $code);
$found = $code !== '' && $name !== '';

if (!$found && class_exists('CHTTP')) {
    CHTTP::SetStatus('404 Not Found');
}

$APPLICATION->SetTitle($found ? $name : 'Коллекция не найдена');
$APPLICATION->SetPageProperty(
    'description',
    $found ? 'Тематическая подборка книг: ' . $name : 'Запрошенная коллекция не найдена.'
);

?>

<section class="section">
    <div class="container">
        <?php if ($found): ?>
            <?php $APPLICATION->IncludeComponent('bitrix:news.detail', 'nlb_detail', [
                'IBLOCK_TYPE' => 'nlb_content',
                'IBLOCK_ID' => nlb_iblock_id('collections'),
                'ELEMENT_CODE' => $code,
                'FIELD_CODE' => ['NAME', 'PREVIEW_TEXT', 'DETAIL_TEXT'],
                'PROPERTY_CODE' => ['COUNT', 'COLOR', 'ICON'],
                'SET_TITLE' => 'N',
                'ADD_ELEMENT_CHAIN' => 'Y',
                'SET_STATUS_404' => 'Y',
                'SHOW_404' => 'N',
                'CACHE_TYPE' => 'A',
                'CACHE_TIME' => '3600',
                'NLB_BACK_URL' => SITE_DIR . 'collections/',
                'NLB_BACK_TEXT' => 'Все коллекции',
            ], false, ['HIDE_ICONS' => 'Y']); ?>
        <?php else: ?>
            <div class="empty-state">
                Коллекция не найдена. Посмотрите другие подборки.
                <div class="mt-3">
                    <a class="btn btn-nlb" href="<?= SITE_DIR ?>collections/">Все коллекции</a>
                </div>
            </div>
        <?php endif; ?>
    </div>
</section>

<?php require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php'; ?>
