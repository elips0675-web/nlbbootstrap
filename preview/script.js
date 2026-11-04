/*!
 * NLB Bootstrap — script.js
 * Только vanilla JS + Bootstrap 5 bundle. jQuery не требуется.
 */

(function () {
    'use strict';

    const doc = document;
    const root = doc.documentElement;

    /* ------------------------------------------------------------------
     * 1. Тень у «прилипшей» шапки
     * ------------------------------------------------------------------ */
    const header = doc.getElementById('siteHeader');
    const onScrollHeader = function () {
        if (!header) return;
        header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScrollHeader, { passive: true });
    onScrollHeader();

    /* ------------------------------------------------------------------
     * 2. Появление блоков при прокрутке
     * ------------------------------------------------------------------ */
    const revealItems = doc.querySelectorAll('[data-reveal]');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (revealItems.length && !reduceMotion && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

        revealItems.forEach(function (item, index) {
            item.classList.add('reveal');
            item.style.transitionDelay = (index % 4) * 60 + 'ms';
            observer.observe(item);
        });
    }

    /* ------------------------------------------------------------------
     * 3. Горизонтальная карусель «Печатные услуги»
     * ------------------------------------------------------------------ */
    doc.querySelectorAll('[data-scroller]').forEach(function (wrap) {
        const track = wrap.querySelector('.scroller');
        const prev = wrap.querySelector('[data-scroll-prev]');
        const next = wrap.querySelector('[data-scroll-next]');
        if (!track) return;

        const step = function () {
            const card = track.querySelector('.print-card');
            if (!card) return Math.round(track.clientWidth * 0.8);
            const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 0);
            return card.getBoundingClientRect().width + gap;
        };

        const updateButtons = function () {
            const max = track.scrollWidth - track.clientWidth - 2;
            if (prev) prev.disabled = track.scrollLeft <= 2;
            if (next) next.disabled = track.scrollLeft >= max;
        };

        if (prev) {
            prev.addEventListener('click', function () {
                track.scrollBy({ left: -step(), behavior: 'smooth' });
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                track.scrollBy({ left: step(), behavior: 'smooth' });
            });
        }

        track.addEventListener('scroll', updateButtons, { passive: true });
        window.addEventListener('resize', updateButtons);
        updateButtons();
    });

    /* ------------------------------------------------------------------
     * 4. Плавающая кнопка связи (FAB)
     * ------------------------------------------------------------------ */
    const fab = doc.querySelector('.fab');
    if (fab) {
        const toggle = fab.querySelector('.fab-toggle');

        const setFab = function (open) {
            fab.classList.toggle('is-open', open);
            if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        };

        if (toggle) {
            toggle.addEventListener('click', function (event) {
                event.stopPropagation();
                setFab(!fab.classList.contains('is-open'));
            });
        }

        // Пункт открывает мессенджер, почту или модальное окно —
        // после выбора меню не должно оставаться раскрытым
        fab.querySelectorAll('.fab-item').forEach(function (item) {
            item.addEventListener('click', function () {
                setFab(false);
            });
        });

        doc.addEventListener('click', function (event) {
            if (!fab.contains(event.target)) setFab(false);
        });

        doc.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') setFab(false);
        });
    }

    /* ------------------------------------------------------------------
     * 5. Кнопка «Наверх»
     * ------------------------------------------------------------------ */
    const toTop = doc.querySelector('.to-top');
    if (toTop) {
        const onScrollTop = function () {
            toTop.classList.toggle('is-visible', window.scrollY > 480);
        };
        window.addEventListener('scroll', onScrollTop, { passive: true });
        onScrollTop();

        toTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        });
    }

    /* ------------------------------------------------------------------
     * 6. Мобильное меню: закрываем после клика по ссылке
     * ------------------------------------------------------------------ */
    const nav = doc.getElementById('nlbNav');
    if (nav && window.bootstrap) {
        nav.querySelectorAll('a.nav-link').forEach(function (link) {
            link.addEventListener('click', function () {
                if (window.innerWidth >= 992) return;
                window.bootstrap.Collapse.getOrCreateInstance(nav).hide();
            });
        });
    }

    /* ------------------------------------------------------------------
     * 7. Автофокус в модальном поиске
     * ------------------------------------------------------------------ */
    const searchModal = doc.getElementById('searchModal');
    if (searchModal) {
        searchModal.addEventListener('shown.bs.modal', function () {
            const input = searchModal.querySelector('input[type="search"]');
            if (input) input.focus();
        });
    }

    /* ------------------------------------------------------------------
     * 8. Bootstrap-валидация форм
     * ------------------------------------------------------------------ */
    doc.querySelectorAll('form.needs-validation').forEach(function (form) {
        form.addEventListener('submit', function (event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });

    /* ------------------------------------------------------------------
     * 8.1. Формы заявок: тариф, свободные слоты, имя элемента
     *      Все данные уходят отдельными свойствами инфоблока, поэтому
     *      никакой «сборки сообщения» больше нет.
     * ------------------------------------------------------------------ */
    const setFormField = function (form, code, value) {
        form.querySelectorAll('[data-nlb-field="' + code + '"]').forEach(function (input) {
            input.value = value;
        });
    };

    const bookingName = function (form) {
        const value = function (code) {
            const input = form.querySelector('[data-nlb-field="' + code + '"]');
            return input ? String(input.value || '').trim() : '';
        };
        const service = value('SERVICE');
        const date = value('DATE');
        const time = value('TIME');
        let name = service !== '' ? 'Бронь: ' + service : 'Заявка на услугу';
        if (date !== '') name += ' — ' + date;
        if (time !== '') name += ' ' + time;
        setFormField(form, 'NAME', name);
    };

    doc.querySelectorAll('.js-choose-tariff').forEach(function (link) {
        link.addEventListener('click', function () {
            const card = link.closest('.tariff-card');
            if (card) {
                doc.querySelectorAll('.tariff-card.is-selected').forEach(function (one) {
                    one.classList.remove('is-selected');
                });
                card.classList.add('is-selected');
            }

            const form = doc.querySelector('form[data-nlb-form="booking"]');
            if (!form) return;
            setFormField(form, 'TARIFF', link.getAttribute('data-tariff') || '');
            setFormField(form, 'PRICE', link.getAttribute('data-price') || '');
            bookingName(form);
        });
    });

    doc.querySelectorAll('form[data-nlb-form="booking"]').forEach(function (form) {
        const date = form.querySelector('[data-nlb-field="DATE"]');
        const time = form.querySelector('[data-nlb-field="TIME"]');
        const hint = form.querySelector('[data-nlb-slots-hint]');
        let slots = {};
        try {
            slots = JSON.parse(form.getAttribute('data-nlb-slots') || '{}') || {};
        } catch (error) {
            slots = {};
        }

        const syncSlots = function () {
            if (!date || !time) return;
            const taken = Array.isArray(slots[date.value]) ? slots[date.value] : [];
            let available = 0;

            Array.from(time.options).forEach(function (option) {
                if (option.value === '') return;
                const busy = taken.indexOf(option.value) !== -1;
                option.disabled = busy;
                if (!busy) available++;
                if (busy && option.selected) time.value = '';
            });

            if (hint) {
                if (date.value === '') {
                    hint.textContent = '';
                } else if (available === 0) {
                    hint.textContent = 'На эту дату свободных слотов нет. Выберите другой день.';
                } else {
                    hint.textContent = 'Свободных слотов: ' + available + '.';
                }
            }
        };

        if (date) {
            date.addEventListener('change', function () {
                syncSlots();
                bookingName(form);
            });
        }
        if (time) {
            time.addEventListener('change', function () {
                bookingName(form);
            });
        }
        form.addEventListener('submit', function () {
            bookingName(form);
        });

        syncSlots();
        bookingName(form);
    });

    /* ------------------------------------------------------------------
     * 9. Подсказка «Ctrl + K» открывает поиск (как в исходном макете)
     * ------------------------------------------------------------------ */
    doc.addEventListener('keydown', function (event) {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
            const trigger = doc.querySelector('[data-bs-target="#searchModal"]');
            if (!trigger || !window.bootstrap || !searchModal) return;
            event.preventDefault();
            window.bootstrap.Modal.getOrCreateInstance(searchModal).show();
        }
    });

    /* ------------------------------------------------------------------
     * 10. Нижние уведомления: отступ для плавающих кнопок
     *     Высота стека уведомлений уходит в --nlb-notice-h, чтобы кнопка
     *     «наверх» и меню связи не перекрывали баннеры cookie и PWA.
     * ------------------------------------------------------------------ */
    const noticeStack = doc.getElementById('nlbNotices');

    window.nlbSyncNotices = function () {
        if (!noticeStack) return;
        const height = noticeStack.offsetHeight;
        root.style.setProperty('--nlb-notice-h', height > 0 ? height + 'px' : '0px');
    };

    if (noticeStack) {
        window.nlbSyncNotices();
        window.addEventListener('resize', window.nlbSyncNotices, { passive: true });

        if (typeof window.ResizeObserver === 'function') {
            new window.ResizeObserver(window.nlbSyncNotices).observe(noticeStack);
        }
    }

    // Помечаем, что JS загрузился: CSS может опираться на html.js
    root.classList.add('js');
})();
