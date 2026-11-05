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
        let lastUserQuestion = '';

        const RULES = [
            {
                re: /часы|часов|график|режим работ|время работ|работает|санитарн|во сколько|до скольк/,
                a: 'Библиотека открыта ежедневно с 10:00 до 22:00.\nСанитарный день — последний вторник месяца.\n\nУ пространств свой график: коворкинг — с 08:00, детская комната — до 21:00. Точное время — в разделе «Услуги».',
                chips: [
                    { label: 'Адрес и как добраться' },
                    { label: 'Услуги и пространства' }
                ]
            },
            {
                re: /адрес|находит|добрат|доехать|метро|проезд|остановк|куда|где вы/,
                a: 'Мы в Минске на проспекте Независимости, 116.\n• Вход — со стороны проспекта.\n• От метро — 7–10 минут пешком.\n• На автобусе или троллейбусе — до остановки «Библиотека».\n• Для маломобильных посетителей есть пандус и лифт.\n\nИнтерактивной карты на сайте нет: маршрут уточняйте по телефону +375 (17) 300-00-00.',
                chips: [
                    { label: 'Часы работы' },
                    { label: 'Контакты' }
                ]
            },
            {
                re: /услуг|пространств|коворкинг|сауна|кафе|спортзал|детск|обзорн|площадк|лектори|концертн/,
                a: 'В библиотеке восемь услуг:\n• Обзорная площадка — бесплатно для читателей\n• Коворкинг — от 200 ₽/час\n• Детская комната — от 250 ₽/час\n• Сауна — от 500 ₽/час\n• Спортзал — от 1000 ₽/месяц\n• Кафе — средний чек 300 ₽\n• Лекторий — аренда от 5000 ₽/час\n• Концертный зал — аренда от 10 000 ₽/час\n\nРасписание и тарифы — в разделе «Услуги».',
                chips: [
                    { label: 'Забронировать зал' },
                    { label: 'Печать и копирование' }
                ]
            },
            {
                re: /брон|аренд|снять|переговорн|забронир/,
                a: 'Залы и пространства можно забронировать:\n• Лекторий — от 5000 ₽/час\n• Концертный зал — от 10 000 ₽/час\n• Коворкинг — от 200 ₽/час\n• Детская комната — от 250 ₽/час\n• Сауна — от 500 ₽/час\n\nНапишите дату, время и число гостей. Форма бронирования есть на страницах услуг, также можно позвонить: +375 (17) 300-00-00.',
                chips: [
                    { label: 'Услуги и пространства' },
                    { label: 'Позвать оператора', action: switchToHuman }
                ]
            },
            {
                re: /событи|мероприят|афиш|расписан|лекци|встреч|мастер-класс|экскурс|концерт|поэтич|игротек|клуб/,
                a: 'Ближайшие события:\n• 06.11, 18:30 — лекция «Как читать современную прозу», зал «Диалог»\n• 08.11, 11:00 — детский книжный клуб «Совёнок», детская комната\n• 12.11, 19:00 — мастер-класс «Нейросети для гуманитариев», компьютерный класс\n• 15.11, 17:00 — поэтический вечер «Осенние строки»\n• 21.11, 15:00 — экскурсия по фонду редких книг, по записи\n• 29.11, 12:00 — игротека настольных игр\n\nВход бесплатный. Запись на события — по телефону +375 (17) 300-00-00. Полная афиша — в разделе «События».',
                chips: [
                    { label: 'Услуги и пространства' },
                    { label: 'Задать свой вопрос', action: focusQuestion }
                ]
            },
            {
                re: /печат|копир|сканир|принтер|распечат|визитк|буклет|перепл|ламинир|ксерокс/,
                a: 'Печать и копирование — от 5 ₽ за страницу, сканирование — от 10 ₽, переплёт и ламинирование — от 250 ₽, визитки — от 350 ₽ за 50 штук.\n\nВсего 37 печатных услуг: документы, визитки, брошюры, широкий формат, фото и сувениры с логотипом. Файлы принимаем на флешке, по почте или через форму на сайте.\n\nПолный каталог — в разделе «Печать».',
                chips: [
                    { label: 'Услуги и пространства' },
                    { label: 'Контакты' }
                ]
            },
            {
                re: /запис|читательск|абонемент|билет|стать читател/,
                a: 'Читательский билет оформляется бесплатно в библиотеке.\n\nРегистрация на сайте не заменяет билет: она нужна для личного кабинета и заявок. Основные пространства доступны и без записи.\n\nПодробнее — в разделе «Услуги» или на стойке информации.',
                chips: [
                    { label: 'Услуги и пространства' },
                    { label: 'Часы работы' }
                ]
            },
            {
                re: /книг|каталог|поиск|найти|автор|фонд|подборк|литератур|нет в наличии/,
                a: 'Искать книги удобнее через поиск по сайту: раздел «Поиск» ищет по книгам, событиям, новостям, услугам и печатному каталогу.\n\nЕсли нужной книги нет в каталоге — спросите на стойке информации: подскажем, где её найти, или оформим заказ по межбиблиотечному обмену.\n\nПодборки книг — в разделе «Подборки».',
                chips: [
                    { label: 'Электронные ресурсы и Wi-Fi' },
                    { label: 'Контакты' }
                ]
            },
            {
                re: /wi-?fi|вай-?фай|интернет|электронн|компьютер|цифров|базы данных|онлайн-ресурс/,
                a: 'Wi-Fi в библиотеке бесплатный, есть компьютеры и цифровые ресурсы.\n\nДоступ к электронным ресурсам — через читательский билет: запись в библиотеку, продление книг и удалённые базы. Подробности — на стойке информации и по телефону +375 (17) 300-00-00.',
                chips: [
                    { label: 'Как записаться в библиотеку' },
                    { label: 'Контакты' }
                ]
            },
            {
                re: /телефон|контакт|почт|e-?mail|позвон|справочн|написать|связаться/,
                a: 'Телефон справочной и записи на события: +375 (17) 300-00-00.\nE-mail: info@example.by.\n\nАдрес: Минск, пр. Независимости, 116. Работаем ежедневно с 10:00 до 22:00.\n\nВсе контакты — в разделе «Контакты».',
                chips: [
                    { label: 'Часы работы' },
                    { label: 'Адрес и как добраться' }
                ]
            }
        ];

        const THANKS = /спасибо|благодар|понятно|окей/;

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

        const startChips = function () {
            return [
                { label: 'Часы работы' },
                { label: 'Адрес и как добраться' },
                { label: 'Услуги и пространства' },
                { label: 'Афиша событий' },
                { label: 'Задать свой вопрос', accent: true, action: focusQuestion },
                { label: 'Позвать оператора', action: switchToHuman }
            ];
        };

        const answerLocally = function (value) {
            if (GREETING.test(value)) {
                chatReply('Здравствуйте! Я Татьяна Петровна, ИИ-помощник библиотеки. Подскажу часы работы, как записаться, услуги и пространства, печать, бронирование, афишу, книги, Wi-Fi и контакты. Чем помочь?', 500, function () {
                    addChatChips(startChips());
                });
                return;
            }

            if (THANKS.test(value)) {
                chatReply('Всегда рад помочь 😊 Если появятся вопросы — пишите.', 400, function () {
                    addChatChips([
                        { label: 'Задать свой вопрос', accent: true, action: focusQuestion },
                        { label: 'Позвать оператора', action: switchToHuman }
                    ]);
                });
                return;
            }

            const rule = RULES.find(function (item) {
                return item.re.test(value);
            });

            if (rule) {
                chatReply(rule.a, 700, function () {
                    if (rule.chips) addChatChips(rule.chips);
                });
                return;
            }

            chatReply('Не нашёл ответа на этот вопрос 🤔 Я подсказываю про часы и адрес, запись, услуги, печать, бронирование, афишу, книги, электронные ресурсы и контакты.\n\nМожно отправить вопрос библиотекарю — он ответит в течение рабочего дня.', 900, function () {
                addChatChips([
                    { label: 'Отправить вопрос библиотекарю', accent: true, action: askQuestion },
                    { label: 'Позвать оператора', action: switchToHuman },
                    { label: 'Задать другой вопрос', action: focusQuestion }
                ]);
            });
        };

        function focusQuestion() {
            chatReply('Напишите вопрос — постараюсь ответить. Если не найду ответ, предложу передать его библиотекарю.', 400, function () {
                chatInput.focus();
                chatInput.placeholder = 'Ваш вопрос…';
            });
        }

        function askQuestion() {
            const text = String(lastUserQuestion || '').trim();
            const modal = doc.getElementById('feedbackModal');

            closeChat();

            if (!modal) {
                window.location.href = 'feedback/';
                return;
            }

            const message = modal.querySelector('textarea[name="MESSAGE"]');
            if (message && text && (!message.value.trim() || message.dataset.nlbChat === '1')) {
                message.value = text;
                message.dataset.nlbChat = '1';
            }

            const subject = modal.querySelector('input[name="SUBJECT"]');
            if (subject && !subject.value.trim()) {
                subject.value = 'Вопрос из чата';
            }

            if (window.bootstrap && window.bootstrap.Modal) {
                window.bootstrap.Modal.getOrCreateInstance(modal).show();
                window.setTimeout(function () {
                    if (message) message.focus();
                }, 400);
                return;
            }

            const form = modal.querySelector('form');
            window.location.href = form ? form.getAttribute('action') : 'feedback/';
        }

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
            lastUserQuestion = value;
            addChatMessage(value, 'user');
            chatInput.value = '';
            handleChat(value);
        }

        const greetChat = function () {
            addChatMessage('Здравствуйте! Меня зовут Татьяна Петровна, я ИИ-помощник ТП НББ. Чем могу помочь?', 'bot');
            addChatChips(startChips());
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

        chat.querySelectorAll('[data-chat-question]').forEach(function (button) {
            button.addEventListener('click', askQuestion);
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
