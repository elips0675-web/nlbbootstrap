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
     * 4.1. Чат ИИ-помощника
     *      Разметка — footer.php (.nlb-chat), стили — styles.css.
     *      Ответы — локальные правила; USE_REAL_AI переключает на бэкенд.
     * ------------------------------------------------------------------ */
    const chat = doc.getElementById('nlbChat');
    if (chat) {
        const chatLog = doc.getElementById('nlbChatLog');
        const chatForm = doc.getElementById('nlbChatForm');
        const chatInput = doc.getElementById('nlbChatInput');
        const chatStatus = doc.getElementById('nlbChatStatus');
        const chatTitle = doc.getElementById('nlbChatTitle');
        const chatAvatar = chat.querySelector('.nlb-chat__avatar');
        const chatOpeners = doc.querySelectorAll('[data-chat-open]');
        const chatClosers = chat.querySelectorAll('[data-chat-close]');

        const USE_REAL_AI = false;
        const API_URL = '/api/chat';

        let chatStarted = false;
        let chatMode = 'bot';
        let chatTyping = null;

        const RULES = [
            {
                re: /запис|регистрац|участи|билет|место|свободн/,
                a: 'Запись занимает минуту 📝 Напишите название события и своё имя — подскажу, куда нажать, чтобы оформить заявку.'
            },
            {
                re: /событи|мероприят|афиш|расписан|лекци|встреч/,
                a: 'Ближайшие события:\n• 06.11 — Лекция «Современная проза»\n• 08.11 — Детский клуб «Совёнок»\n• 12.11 — Встреча с писателем\n\nПолная афиша — в разделе «События».'
            },
            {
                re: /адрес|находит|добрат|метро|куда/,
                a: 'Мы находимся по адресу: пр-т Независимости, 116. Вход для посетителей со стороны парка.'
            },
            {
                re: /спасибо|благодар|понятно|окей/,
                a: 'Всегда рад помочь 😊 Если появятся вопросы — пишите.'
            }
        ];

        const HUMAN_TRIGGER = /оператор|человек|менеджер|живой|позов|позват|соедин|жалоб|не понял/;
        const GREETING = /привет|здравств|добрый|хай|hello|hi\b/;

        const chatTime = function () {
            return new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        };

        const scrollChat = function () {
            chatLog.scrollTop = chatLog.scrollHeight;
        };

        const addChatMessage = function (text, who) {
            const row = doc.createElement('div');
            row.className = 'nlb-chat__msg nlb-chat__msg--' + who;

            const bubble = doc.createElement('div');
            bubble.className = 'nlb-chat__bubble';
            bubble.textContent = text;
            row.appendChild(bubble);

            const time = doc.createElement('div');
            time.className = 'nlb-chat__time';
            time.textContent = chatTime();
            row.appendChild(time);

            chatLog.appendChild(row);
            scrollChat();
            return row;
        };

        const hideChatTyping = function () {
            if (chatTyping) {
                chatTyping.remove();
                chatTyping = null;
            }
        };

        const showChatTyping = function () {
            hideChatTyping();
            const row = doc.createElement('div');
            row.className = 'nlb-chat__msg nlb-chat__msg--bot nlb-chat__typing';
            row.innerHTML = '<div class="nlb-chat__bubble"><span></span><span></span><span></span></div>';
            chatLog.appendChild(row);
            chatTyping = row;
            scrollChat();
        };

        const chatReply = function (text, delay, done) {
            showChatTyping();
            window.setTimeout(function () {
                hideChatTyping();
                addChatMessage(text, 'bot');
                if (done) done();
            }, delay);
        };

        const addChatChips = function (items) {
            const wrap = doc.createElement('div');
            wrap.className = 'nlb-chat__chips';
            items.forEach(function (item) {
                const chip = doc.createElement('button');
                chip.type = 'button';
                chip.className = 'nlb-chat__chip' + (item.accent ? ' nlb-chat__chip--accent' : '');
                chip.textContent = item.label;
                chip.addEventListener('click', function () {
                    wrap.remove();
                    if (item.action) item.action();
                    else sendChat(item.label);
                });
                wrap.appendChild(chip);
            });
            chatLog.appendChild(wrap);
            scrollChat();
        };

        const clearChatChips = function () {
            chatLog.querySelectorAll('.nlb-chat__chips').forEach(function (node) {
                node.remove();
            });
        };

        const askBackend = function (text) {
            if (!USE_REAL_AI) return Promise.resolve(null);
            return fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: 'nlb_chat', message: text, history: [] })
            }).then(function (response) {
                return response.ok ? response.json() : null;
            }).then(function (data) {
                return data && data.reply ? String(data.reply) : null;
            }).catch(function () {
                return null;
            });
        };

        const answerLocally = function (value) {
            if (GREETING.test(value)) {
                chatReply('Здравствуйте! Я Татьяна Петровна, ИИ-помощник библиотеки. Подскажу афишу, запись на событие и адрес. Что вас интересует?', 500, function () {
                    addChatChips([
                        { label: 'Какие события скоро?' },
                        { label: 'Адрес и время работы' },
                        { label: 'Позвать оператора', accent: true, action: switchToHuman }
                    ]);
                });
                return;
            }

            const rule = RULES.find(function (item) {
                return item.re.test(value);
            });

            if (rule) {
                chatReply(rule.a, 700, function () {
                    if (/событи|мероприят|афиш|запис/.test(value)) {
                        addChatChips([
                            { label: 'Оформить запись' },
                            { label: 'Позвать оператора', accent: true, action: switchToHuman }
                        ]);
                    }
                });
                return;
            }

            chatReply('Хм, не уверен, что понял 🤔 Я помогаю с афишей, записью на события и адресом. Хотите, позову живого оператора?', 900, function () {
                addChatChips([
                    { label: 'Да, позовите оператора', accent: true, action: switchToHuman },
                    { label: 'Нет, спасибо' }
                ]);
            });
        };

        function switchToHuman() {
            if (chatMode === 'human') return;
            chatMode = 'human';

            chatTitle.textContent = 'Анна';
            chatStatus.textContent = 'оператор · печатает…';
            if (chatAvatar) chatAvatar.classList.add('is-human');

            addChatMessage('⏳ Соединяю вас с оператором…', 'bot');

            showChatTyping();
            window.setTimeout(function () {
                hideChatTyping();
                chatStatus.textContent = 'онлайн';
                addChatMessage('Здравствуйте! Меня зовут Анна, я администратор библиотеки. Вижу вашу переписку. Чем могу помочь?', 'bot');
            }, 2000);
        }

        const operatorReplies = [
            'Секунду, уточню информацию и вернусь к вам.',
            'Да, конечно! Сейчас всё проверю в расписании.',
            'Поняла вас, сейчас оформлю.'
        ];

        const operatorReply = function (text) {
            const value = text.toLowerCase();
            let answer;

            if (/запис|регистрац|билет|место/.test(value)) {
                answer = 'Конечно, запишу вас! Напишите, пожалуйста, имя и номер телефона, и я забронирую место.';
            } else if (/цен|стоим|сколько|руб/.test(value)) {
                answer = 'Секунду, уточню стоимость именно по вашему событию…';
            } else {
                answer = operatorReplies[Math.floor(Math.random() * operatorReplies.length)];
            }

            showChatTyping();
            window.setTimeout(function () {
                hideChatTyping();
                addChatMessage(answer, 'bot');
            }, 1500 + Math.random() * 1000);
        };

        const handleChat = function (text) {
            const value = text.toLowerCase().replace(/ё/g, 'е');

            if (chatMode === 'human') {
                operatorReply(text);
                return;
            }

            if (HUMAN_TRIGGER.test(value)) {
                switchToHuman();
                return;
            }

            askBackend(text).then(function (answer) {
                if (answer) {
                    chatReply(answer, 800);
                    return;
                }
                answerLocally(value);
            });
        };

        function sendChat(text) {
            const value = String(text || '').trim();
            if (!value) return;

            clearChatChips();
            addChatMessage(value, 'user');
            chatInput.value = '';
            handleChat(value);
        }

        const greetChat = function () {
            addChatMessage('Здравствуйте! Меня зовут Татьяна Петровна, я ИИ-помощник ТП НББ. Чем могу помочь?', 'bot');
            addChatChips([
                { label: 'Какие события скоро?' },
                { label: 'Как записаться?' },
                { label: 'Адрес и время работы' },
                { label: 'Позвать оператора', accent: true, action: switchToHuman }
            ]);
        };

        const openChat = function () {
            chat.classList.add('is-open');
            chat.setAttribute('aria-hidden', 'false');
            chatOpeners.forEach(function (opener) {
                opener.setAttribute('aria-expanded', 'true');
            });
            if (!chatStarted) {
                chatStarted = true;
                greetChat();
            }
            window.setTimeout(function () {
                chatInput.focus();
            }, 220);
        };

        const closeChat = function () {
            chat.classList.remove('is-open');
            chat.setAttribute('aria-hidden', 'true');
            chatOpeners.forEach(function (opener) {
                opener.setAttribute('aria-expanded', 'false');
            });
        };

        chatOpeners.forEach(function (opener) {
            opener.addEventListener('click', openChat);
        });

        chatClosers.forEach(function (closer) {
            closer.addEventListener('click', closeChat);
        });

        chatForm.addEventListener('submit', function (event) {
            event.preventDefault();
            sendChat(chatInput.value);
        });

        doc.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && chat.classList.contains('is-open')) closeChat();
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
     * 6. Мобильное меню: закрываем после клика по ссылке.
     *    Пункт с выпадающим списком не закрываем: иначе на телефоне
     *    нажатие «Услуги»/«Печать» сворачивало всё меню вместо того,
     *    чтобы показать подпункты.
     * ------------------------------------------------------------------ */
    const nav = doc.getElementById('nlbNav');
    if (nav && window.bootstrap) {
        nav.querySelectorAll('a.nav-link:not(.dropdown-toggle)').forEach(function (link) {
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
