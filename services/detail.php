<?php
/**
 * Услуга — детальная страница.
 *
 * Верхняя часть и контент — компонент news.detail с шаблоном nlb_service.
 * Форма бронирования подключается отдельно: у main.feedback свой sessid,
 * и держать её внутри кэшируемого компонента нельзя.
 */

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php';

$rawCode = isset($_REQUEST['CODE']) ? (string)$_REQUEST['CODE'] : '';
$code = (string)preg_replace('/[^a-z0-9_-]/i', '', $rawCode);
$name = nlb_element_name('services', $code);
$found = $code !== '' && $name !== '';

if (!$found && class_exists('CHTTP')) {
    CHTTP::SetStatus('404 Not Found');
}

$APPLICATION->SetTitle($found ? $name : 'Услуга не найдена');
$APPLICATION->SetPageProperty(
    'description',
    $found ? 'Услуга библиотеки: ' . $name : 'Запрошенная услуга не найдена.'
);

?>

<?php if ($found): ?>
    <section class="section service-detail-section">
        <div class="container">
            <?php $APPLICATION->IncludeComponent('bitrix:news.detail', 'nlb_service', [
                'IBLOCK_TYPE' => 'nlb_services',
                'IBLOCK_ID' => nlb_iblock_id('services'),
                'ELEMENT_CODE' => $code,
                'FIELD_CODE' => [
                    'NAME',
                    'PREVIEW_TEXT',
                    'DETAIL_TEXT',
                    'PREVIEW_PICTURE',
                    'DETAIL_PICTURE',
                ],
                'PROPERTY_CODE' => [
                    'ICON',
                    'COLOR',
                    'SUBTITLE',
                    'PRICE_LABEL',
                    'SCHEDULE',
                    'PHONE',
                    'EMAIL',
                    'FEATURES',
                    'TARIFFS',
                ],
                'SET_TITLE' => 'N',
                'ADD_ELEMENT_CHAIN' => 'Y',
                'SET_STATUS_404' => 'Y',
                'SHOW_404' => 'N',
                'CACHE_TYPE' => 'A',
                'CACHE_TIME' => '3600',
                'NLB_BACK_URL' => SITE_DIR . 'services/',
                'NLB_BACK_TEXT' => 'Назад к услугам',
            ], false, ['HIDE_ICONS' => 'Y']); ?>
        </div>
    </section>

    <section class="section section--booking" id="booking">
        <div class="container">
            <div class="booking-card">
                <div class="booking-head">
                    <span class="booking-icon">
                        <svg class="i" aria-hidden="true"><use href="#i-calendar"/></svg>
                    </span>
                    <h2 class="section-title">Забронировать</h2>
                    <p class="section-lead mb-0">
                        Заполните форму, и мы свяжемся с вами для подтверждения брони.
                    </p>
                </div>

                <?php $APPLICATION->IncludeComponent('bitrix:main.feedback', 'bootstrap', [
                    'USE_CAPTCHA' => 'Y',
                    'OK_TEXT' => 'Спасибо! Заявка на бронирование отправлена. Мы свяжемся с вами в течение часа.',
                    'EMAIL_TO' => 'info@example.by',
                    'REQUIRED_FIELDS' => ['NAME', 'EMAIL', 'MESSAGE'],
                    'EVENT_MESSAGE_ID' => [],
                    'AJAX_MODE' => 'N',
                    'NLB_BOOKING' => 'Y',
                    'NLB_SERVICE' => $name,
                ], false, ['HIDE_ICONS' => 'Y']); ?>

                <p class="form-hint mt-3 mb-0">
                    * Обязательные поля. Отправляя форму, вы соглашаетесь с
                    <a href="<?= SITE_DIR ?>privacy/">политикой конфиденциальности</a>.
                </p>
            </div>
        </div>
    </section>
<?php else: ?>
    <section class="section">
        <div class="container">
            <div class="empty-state">
                Услуга не найдена. Посмотрите полный список — возможно, она называется иначе.
                <div class="mt-3">
                    <a class="btn btn-nlb" href="<?= SITE_DIR ?>services/">Все услуги</a>
                </div>
            </div>
        </div>
    </section>
<?php endif; ?>

<?php require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php'; ?>
