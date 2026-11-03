<?php
/**
 * Личный кабинет.
 *
 * Профиль — bitrix:main.profile; подписка — bitrix:subscribe.edit.
 * Доступ только для авторизованных.
 */

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php';

$APPLICATION->SetPageProperty('robots', 'noindex, follow');

if (!$USER->IsAuthorized()) {
    LocalRedirect(SITE_DIR . 'auth/');
}

$APPLICATION->SetTitle('Личный кабинет');
$APPLICATION->SetPageProperty(
    'description',
    'Профиль читателя, подписка на рассылку и настройки аккаунта.'
);

?>

<section class="page-hero">
    <div class="container">
        <span class="eyebrow eyebrow--green">Кабинет</span>
        <h1 class="page-title">Личный кабинет</h1>
        <p class="page-lead">
            Вы вошли как <strong><?= htmlspecialcharsbx($USER->GetLogin()) ?></strong>.
            Здесь можно обновить профиль и управлять подпиской.
        </p>
    </div>
</section>

<section class="section pt-0">
    <div class="container">
        <div class="row g-4 g-lg-5">
            <div class="col-lg-8" data-reveal>
                <div class="info-card">
                    <h2 class="h4 mb-3">Профиль</h2>
                    <?php $APPLICATION->IncludeComponent('bitrix:main.profile', '', [
                        'SET_TITLE' => 'N',
                        'SEND_INFO' => 'N',
                        'CHECK_RIGHTS' => 'Y',
                        'USER_PROPERTY' => ['PERSONAL_PHONE', 'PERSONAL_CITY'],
                    ], false, ['HIDE_ICONS' => 'Y']); ?>
                </div>
            </div>

            <div class="col-lg-4" data-reveal>
                <div class="info-card mb-4">
                    <h2 class="h5">Быстрые ссылки</h2>
                    <ul class="list-unstyled mb-0">
                        <li class="mb-2"><a href="<?= SITE_DIR ?>auth/change/">Сменить пароль</a></li>
                        <li class="mb-2"><a href="<?= SITE_DIR ?>books/">Каталог книг</a></li>
                        <li class="mb-2"><a href="<?= SITE_DIR ?>events/">Афиша событий</a></li>
                        <li class="mb-2"><a href="<?= SITE_DIR ?>feedback/">Обратная связь</a></li>
                        <li>
                            <a href="<?= SITE_DIR ?>auth/?logout=yes&amp;<?= htmlspecialcharsbx(bitrix_sessid_get()) ?>">
                                Выйти из аккаунта
                            </a>
                        </li>
                    </ul>
                </div>

                <div class="info-card">
                    <h2 class="h5">Подписка</h2>
                    <p class="text-muted small">
                        Управление рассылкой по e-mail аккаунта.
                    </p>
                    <?php $APPLICATION->IncludeComponent('bitrix:subscribe.edit', '', [
                        'SHOW_HIDDEN' => 'N',
                        'SET_TITLE' => 'N',
                        'CACHE_TYPE' => 'A',
                        'CACHE_TIME' => '3600',
                    ], false, ['HIDE_ICONS' => 'Y']); ?>
                </div>
            </div>
        </div>
    </div>
</section>

<?php require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php'; ?>
