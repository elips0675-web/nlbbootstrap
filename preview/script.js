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
        const chatBack = chat.querySelector('[data-chat-back]');
        const chatError = doc.getElementById('nlbChatError');
        const chatOpeners = doc.querySelectorAll('[data-chat-open]');
        const chatClosers = chat.querySelectorAll('[data-chat-close]');

        const USE_REAL_AI = false;
        const API_URL = '/api/chat';

        let chatStarted = false;
        let chatMode = 'bot';
        let chatTyping = null;
        let lastUserQuestion = '';
        let chatAtStart = true;
        let chatRun = 0;

        const RULES = [
            {
                re: /часы|часов|график|режим работ|время работ|работает|санитарн|во сколько|до скольк/,
                a: 'Библиотека открыта ежедневно с 10:00 до 22:00.\nСанитарный день — последний вторник месяца.\n\nУ пространств свой график: коворкинг — с 08:00, детская комната — до 21:00. Точное время — в разделе «Услуги».',
                links: [{ path: 'services/', label: 'Услуги и пространства' }],
                chips: [
                    { label: 'Адрес и как добраться' },
                    { label: 'Услуги и пространства' }
                ]
            },
            {
                re: /адрес|находит|добрат|доехать|метро|проезд|остановк|куда|где вы/,
                a: 'Мы в Минске на проспекте Независимости, 116.\n• Вход — со стороны проспекта.\n• От метро — 7–10 минут пешком.\n• На автобусе или троллейбусе — до остановки «Библиотека».\n• Для маломобильных посетителей есть пандус и лифт.\n\nИнтерактивной карты на сайте нет: маршрут уточняйте по телефону +375 (17) 300-00-00.',
                links: [{ path: 'contacts/', label: 'Контакты' }],
                chips: [
                    { label: 'Часы работы' },
                    { label: 'Контакты' }
                ]
            },
            {
                re: /услуг|пространств|коворкинг|сауна|кафе|спортзал|детск|обзорн|площадк|лектори|концертн/,
                a: 'В библиотеке восемь услуг:\n• Обзорная площадка — бесплатно для читателей\n• Коворкинг — от 200 ₽/час\n• Детская комната — от 250 ₽/час\n• Сауна — от 500 ₽/час\n• Спортзал — от 1000 ₽/месяц\n• Кафе — средний чек 300 ₽\n• Лекторий — аренда от 5000 ₽/час\n• Концертный зал — аренда от 10 000 ₽/час\n\nРасписание и тарифы — в разделе «Услуги».',
                links: [{ path: 'services/', label: 'Услуги и пространства' }],
                chips: [
                    { label: 'Забронировать зал' },
                    { label: 'Печать и копирование' }
                ]
            },
            {
                re: /брон|аренд|снять|переговорн|забронир/,
                a: 'Залы и пространства можно забронировать:\n• Лекторий — от 5000 ₽/час\n• Концертный зал — от 10 000 ₽/час\n• Коворкинг — от 200 ₽/час\n• Детская комната — от 250 ₽/час\n• Сауна — от 500 ₽/час\n\nНапишите дату, время и число гостей. Форма бронирования есть на страницах услуг, также можно позвонить: +375 (17) 300-00-00.',
                links: [{ path: 'services/', label: 'Услуги и пространства' }],
                chips: [
                    { label: 'Услуги и пространства' },
                    { label: 'Позвать оператора', action: switchToHuman }
                ]
            },
            {
                re: /событи|мероприят|афиш|расписан|лекци|встреч|мастер-класс|экскурс|концерт|поэтич|игротек|клуб/,
                a: 'Ближайшие события:\n• 06.11, 18:30 — лекция «Как читать современную прозу», зал «Диалог»\n• 08.11, 11:00 — детский книжный клуб «Совёнок», детская комната\n• 12.11, 19:00 — мастер-класс «Нейросети для гуманитариев», компьютерный класс\n• 15.11, 17:00 — поэтический вечер «Осенние строки»\n• 21.11, 15:00 — экскурсия по фонду редких книг, по записи\n• 29.11, 12:00 — игротека настольных игр\n\nВход бесплатный. Запись на события — по телефону +375 (17) 300-00-00. Полная афиша — в разделе «События».',
                links: [{ path: 'events/', label: 'Афиша событий' }],
                chips: [
                    { label: 'Услуги и пространства' },
                    { label: 'Задать свой вопрос', action: focusQuestion }
                ]
            },
            {
                re: /печат|копир|сканир|принтер|распечат|визитк|буклет|перепл|ламинир|ксерокс/,
                a: 'Печать и копирование — от 5 ₽ за страницу, сканирование — от 10 ₽, переплёт и ламинирование — от 250 ₽, визитки — от 350 ₽ за 50 штук.\n\nВсего 37 печатных услуг: документы, визитки, брошюры, широкий формат, фото и сувениры с логотипом. Файлы принимаем на флешке, по почте или через форму на сайте.\n\nПолный каталог — в разделе «Печать».',
                links: [{ path: 'printing/', label: 'Печать' }],
                chips: [
                    { label: 'Услуги и пространства' },
                    { label: 'Контакты' }
                ]
            },
            {
                re: /запис|читательск|абонемент|билет|стать читател/,
                a: 'Читательский билет оформляется бесплатно в библиотеке.\n\nРегистрация на сайте не заменяет билет: она нужна для личного кабинета и заявок. Основные пространства доступны и без записи.\n\nПодробнее — в разделе «Услуги» или на стойке информации.',
                links: [{ path: 'services/', label: 'Услуги и пространства' }],
                chips: [
                    { label: 'Услуги и пространства' },
                    { label: 'Часы работы' }
                ]
            },
            {
                re: /книг|каталог|поиск|найти|автор|фонд|подборк|литератур|нет в наличии/,
                a: 'Искать книги удобнее через поиск по сайту: раздел «Поиск» ищет по книгам, событиям, новостям, услугам и печатному каталогу.\n\nЕсли нужной книги нет в каталоге — спросите на стойке информации: подскажем, где её найти, или оформим заказ по межбиблиотечному обмену.\n\nПодборки книг — в разделе «Подборки».',
                links: [
                    { path: 'books/', label: 'Книги' },
                    { path: 'collections/', label: 'Подборки' }
                ],
                chips: [
                    { label: 'Электронные ресурсы и Wi-Fi' },
                    { label: 'Контакты' }
                ]
            },
            {
                re: /wi-?fi|вай-?фай|интернет|электронн|компьютер|цифров|базы данных|онлайн-ресурс/,
                a: 'Wi-Fi в библиотеке бесплатный, есть компьютеры и цифровые ресурсы.\n\nДоступ к электронным ресурсам — через читательский билет: запись в библиотеку, продление книг и удалённые базы. Подробности — на стойке информации и по телефону +375 (17) 300-00-00.',
                links: [{ path: 'services/', label: 'Услуги и пространства' }],
                chips: [
                    { label: 'Как записаться в библиотеку' },
                    { label: 'Контакты' }
                ]
            },
            {
                re: /телефон|контакт|почт|e-?mail|позвон|справочн|написать|связаться/,
                a: 'Телефон справочной и записи на события: +375 (17) 300-00-00.\nE-mail: info@example.by.\n\nАдрес: Минск, пр. Независимости, 116. Работаем ежедневно с 10:00 до 22:00.\n\nВсе контакты — в разделе «Контакты».',
                links: [{ path: 'contacts/', label: 'Контакты' }],
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

        const chatNearBottom = function () {
            return chatLog.scrollHeight - chatLog.scrollTop - chatLog.clientHeight < 48;
        };

        const scrollChat = function (options) {
            const opts = options || {};
            if (!opts.force && !opts.stick) return;

            const row = opts.row;
            if (row && row.offsetHeight > chatLog.clientHeight) {
                const logRect = chatLog.getBoundingClientRect();
                const rowRect = row.getBoundingClientRect();
                const target = chatLog.scrollTop + (rowRect.top - logRect.top) - 8;
                chatLog.scrollTop = Math.max(0, target);
                return;
            }

            chatLog.scrollTop = chatLog.scrollHeight;
        };

        const chatHrefCache = {};

        const chatHref = function (path) {
            if (Object.prototype.hasOwnProperty.call(chatHrefCache, path)) return chatHrefCache[path];

            let href = path;
            const links = doc.querySelectorAll('a[href]');
            for (let i = 0; i < links.length; i++) {
                const value = links[i].getAttribute('href') || '';
                if (value.length > path.length && value.slice(-path.length) === path) {
                    href = value;
                    break;
                }
            }

            chatHrefCache[path] = href;
            return href;
        };

        const chatSaveRating = function (answer, value) {
            try {
                const raw = window.localStorage.getItem('nlbChatRating');
                const parsed = raw ? JSON.parse(raw) : [];
                const items = Array.isArray(parsed) ? parsed : [];
                items.push({
                    q: lastUserQuestion,
                    a: String(answer).slice(0, 120),
                    v: value,
                    t: Date.now()
                });
                window.localStorage.setItem('nlbChatRating', JSON.stringify(items.slice(-50)));
            } catch (error) {
                return;
            }
        };

        const chatRate = function (text) {
            const wrap = doc.createElement('div');
            wrap.className = 'nlb-chat__rate';
            wrap.setAttribute('role', 'group');
            wrap.setAttribute('aria-label', 'Оценить ответ');

            [
                { value: 1, icon: '#i-thumb-up', label: 'Ответ полезен', thanks: 'Спасибо, учту' },
                { value: -1, icon: '#i-thumb-down', label: 'Ответ не полезен', thanks: 'Спасибо, попробую иначе' }
            ].forEach(function (item) {
                const button = doc.createElement('button');
                button.type = 'button';
                button.className = 'nlb-chat__rate-btn';
                button.setAttribute('aria-label', item.label);
                button.setAttribute('aria-pressed', 'false');
                button.innerHTML = '<svg class="i" aria-hidden="true"><use href="' + item.icon + '"/></svg>';
                button.addEventListener('click', function () {
                    if (wrap.classList.contains('is-rated')) return;
                    wrap.classList.add('is-rated');
                    wrap.querySelectorAll('.nlb-chat__rate-btn').forEach(function (node) {
                        node.disabled = true;
                        node.classList.toggle('is-active', node === button);
                        node.setAttribute('aria-pressed', node === button ? 'true' : 'false');
                    });
                    const thanks = doc.createElement('span');
                    thanks.className = 'nlb-chat__rate-thanks';
                    thanks.textContent = item.thanks;
                    wrap.appendChild(thanks);
                    chatSaveRating(text, item.value);
                });
                wrap.appendChild(button);
            });

            return wrap;
        };

        const addChatMessage = function (text, who, opts) {
            const options = opts || {};
            const stick = chatNearBottom();
            const row = doc.createElement('div');
            row.className = 'nlb-chat__msg nlb-chat__msg--' + who;

            const bubble = doc.createElement('div');
            bubble.className = 'nlb-chat__bubble';
            bubble.textContent = text;
            row.appendChild(bubble);

            if (options.links && options.links.length) {
                const src = doc.createElement('div');
                src.className = 'nlb-chat__src';
                src.appendChild(doc.createTextNode('Источник: '));
                options.links.forEach(function (item, index) {
                    if (index > 0) src.appendChild(doc.createTextNode(', '));
                    const link = doc.createElement('a');
                    link.className = 'nlb-chat__src-link';
                    link.href = chatHref(item.path);
                    link.textContent = item.label;
                    src.appendChild(link);
                });
                row.appendChild(src);
            }

            if (options.rate && who === 'bot') {
                row.appendChild(chatRate(text));
            }

            const time = doc.createElement('div');
            time.className = 'nlb-chat__time';
            time.textContent = chatTime();
            row.appendChild(time);

            chatLog.appendChild(row);
            scrollChat({ row: row, force: who === 'user', stick: stick });
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
            const stick = chatNearBottom();
            const row = doc.createElement('div');
            row.className = 'nlb-chat__msg nlb-chat__msg--bot nlb-chat__typing';
            row.innerHTML = '<div class="nlb-chat__bubble"><span></span><span></span><span></span></div>';
            chatLog.appendChild(row);
            chatTyping = row;
            scrollChat({ stick: stick });
        };

        const chatLater = function (fn, delay) {
            const run = chatRun;
            window.setTimeout(function () {
                if (run === chatRun) fn();
            }, delay);
        };

        const chatReply = function (text, delay, done, links, rate) {
            showChatTyping();
            chatLater(function () {
                hideChatTyping();
                addChatMessage(text, 'bot', { links: links, rate: rate });
                if (done) done();
            }, delay);
        };

        const addChatChips = function (items) {
            const stick = chatNearBottom();
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
            scrollChat({ stick: stick });
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

        const pageSection = function () {
            const path = String(window.location.pathname || '/').toLowerCase();
            const sections = ['services', 'printing', 'events', 'news', 'books', 'collections', 'contacts', 'feedback'];
            for (let i = 0; i < sections.length; i++) {
                if (path.indexOf('/' + sections[i] + '/') !== -1) return sections[i];
            }
            return 'home';
        };

        const sectionGreeting = function () {
            const section = pageSection();

            if (section === 'services') {
                return {
                    text: 'Здравствуйте! Я Татьяна Петровна, ИИ-помощник библиотеки. Вижу, вы смотрите услуги и пространства, — подскажу тарифы, график и бронирование. Чем помочь?',
                    chips: [
                        { label: 'Услуги и пространства' },
                        { label: 'Часы работы' },
                        { label: 'Забронировать зал' },
                        { label: 'Задать свой вопрос', accent: true, action: focusQuestion },
                        { label: 'Позвать оператора', action: switchToHuman }
                    ]
                };
            }

            if (section === 'printing') {
                return {
                    text: 'Здравствуйте! Я Татьяна Петровна, ИИ-помощник библиотеки. Вижу, вы в разделе «Печать», — подскажу цены, форматы и как передать файл. Чем помочь?',
                    chips: [
                        { label: 'Печать и копирование' },
                        { label: 'Визитки' },
                        { label: 'Часы работы' },
                        { label: 'Задать свой вопрос', accent: true, action: focusQuestion },
                        { label: 'Позвать оператора', action: switchToHuman }
                    ]
                };
            }

            if (section === 'events') {
                return {
                    text: 'Здравствуйте! Я Татьяна Петровна, ИИ-помощник библиотеки. Вижу, вы смотрите афишу, — подскажу ближайшие события и как на них записаться. Чем помочь?',
                    chips: [
                        { label: 'Ближайшие события' },
                        { label: 'Как записаться на событие' },
                        { label: 'Часы работы' },
                        { label: 'Задать свой вопрос', accent: true, action: focusQuestion },
                        { label: 'Позвать оператора', action: switchToHuman }
                    ]
                };
            }

            if (section === 'news') {
                return {
                    text: 'Здравствуйте! Я Татьяна Петровна, ИИ-помощник библиотеки. Вижу, вы читаете новости, — подскажу, что нового в библиотеке и куда прийти. Чем помочь?',
                    chips: [
                        { label: 'Афиша событий' },
                        { label: 'Услуги и пространства' },
                        { label: 'Часы работы' },
                        { label: 'Задать свой вопрос', accent: true, action: focusQuestion }
                    ]
                };
            }

            if (section === 'books' || section === 'collections') {
                return {
                    text: 'Здравствуйте! Я Татьяна Петровна, ИИ-помощник библиотеки. Вижу, вы выбираете книги, — подскажу, как искать по каталогу и где выдают. Чем помочь?',
                    chips: [
                        { label: 'Поиск по каталогу' },
                        { label: 'Как записаться в библиотеку' },
                        { label: 'Электронные ресурсы и Wi-Fi' },
                        { label: 'Задать свой вопрос', accent: true, action: focusQuestion }
                    ]
                };
            }

            if (section === 'contacts') {
                return {
                    text: 'Здравствуйте! Я Татьяна Петровна, ИИ-помощник библиотеки. Вижу, вы на странице контактов, — подскажу телефон, адрес и часы работы. Чем помочь?',
                    chips: [
                        { label: 'Часы работы' },
                        { label: 'Адрес и как добраться' },
                        { label: 'Позвать оператора', action: switchToHuman }
                    ]
                };
            }

            if (section === 'feedback') {
                return {
                    text: 'Здравствуйте! Я Татьяна Петровна, ИИ-помощник библиотеки. Помогу сформулировать вопрос или соединю с оператором. Чем помочь?',
                    chips: [
                        { label: 'Задать свой вопрос', accent: true, action: focusQuestion },
                        { label: 'Позвать оператора', action: switchToHuman },
                        { label: 'Часы работы' }
                    ]
                };
            }

            return {
                text: 'Здравствуйте! Меня зовут Татьяна Петровна, я ИИ-помощник ТП НББ. Чем могу помочь?',
                chips: startChips()
            };
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
                }, rule.links, true);
                return;
            }

            chatReply('Не нашёл ответа на этот вопрос 🤔 Я подсказываю про часы и адрес, запись, услуги, печать, бронирование, афишу, книги, электронные ресурсы и контакты.\n\nМожно отправить вопрос библиотекарю — он ответит в течение рабочего дня.', 900, function () {
                addChatChips([
                    { label: 'Отправить вопрос библиотекарю', accent: true, action: askQuestion },
                    { label: 'Позвать оператора', action: switchToHuman },
                    { label: 'Задать другой вопрос', action: focusQuestion }
                ]);
            }, [{ path: 'contacts/', label: 'Контакты' }], true);
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

        const chatTranscript = function () {
            const lines = [];
            chatLog.querySelectorAll('.nlb-chat__msg').forEach(function (node) {
                if (node.classList.contains('nlb-chat__typing')) return;
                const bubble = node.querySelector('.nlb-chat__bubble');
                if (!bubble) return;
                const who = node.classList.contains('nlb-chat__msg--user') ? 'Вы' : 'ИИ-помощник';
                lines.push(who + ': ' + bubble.textContent);
            });
            return lines.join('\n\n');
        };

        const chatCopyStatus = function (ok) {
            const message = ok ? 'диалог скопирован' : 'не удалось скопировать';
            const previous = chatStatus.textContent;
            chatStatus.textContent = message;
            window.setTimeout(function () {
                if (chatStatus.textContent === message) chatStatus.textContent = previous;
            }, 1800);
        };

        function copyChat() {
            const text = chatTranscript();
            if (!text) {
                chatCopyStatus(false);
                return;
            }

            const fallback = function () {
                const area = doc.createElement('textarea');
                area.value = text;
                area.setAttribute('readonly', 'readonly');
                area.style.position = 'fixed';
                area.style.top = '-1000px';
                doc.body.appendChild(area);
                area.select();

                let ok = false;
                try {
                    ok = doc.execCommand('copy');
                } catch (error) {
                    ok = false;
                }

                area.remove();
                chatCopyStatus(ok);
            };

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function () {
                    chatCopyStatus(true);
                }).catch(fallback);
                return;
            }

            fallback();
        }

        function switchToHuman() {
            if (chatMode === 'human') return;
            chatMode = 'human';

            chatTitle.textContent = 'Анна';
            chatStatus.textContent = 'оператор · печатает…';
            if (chatAvatar) chatAvatar.classList.add('is-human');
            chatAtStart = false;
            updateChatBack();

            clearChatChips();
            hideChatError();
            chatLog.querySelectorAll('.nlb-chat__msg--greeting').forEach(function (node) {
                node.remove();
            });

            addChatMessage('⏳ Соединяю вас с оператором…', 'bot');

            chatLater(function () {
                if (!chatTyping) chatStatus.textContent = 'онлайн';
                addChatMessage('Здравствуйте! Меня зовут Анна, я администратор библиотеки. Чем могу помочь?', 'bot');
                if (chat.classList.contains('is-open')) chatInput.focus();
            }, 500);
        }

        function switchToBot() {
            if (chatMode === 'bot') return;
            chatMode = 'bot';

            chatTitle.textContent = 'Татьяна Петровна';
            chatStatus.textContent = 'ИИ-помощник ТП НББ · онлайн';
            if (chatAvatar) chatAvatar.classList.remove('is-human');
            chatAtStart = false;
            updateChatBack();

            clearChatChips();
            hideChatError();
            chatReply('Снова на связи ИИ-помощник библиотеки. Чем помочь?', 400, function () {
                addChatChips(startChips());
            });
        }

        const updateChatBack = function () {
            if (!chatBack) return;
            chatBack.hidden = chatMode === 'bot' && chatAtStart;
            chatBack.setAttribute('aria-label', chatMode === 'human' ? 'Вернуться к ИИ-помощнику' : 'Вернуться в начало диалога');
        };

        const chatMic = doc.getElementById('nlbChatMic');
        const ChatRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        let chatRecognition = null;

        const showMicError = function (message) {
            if (!chatError) return;
            chatError.textContent = message;
            chatError.hidden = false;
        };

        const setChatMicState = function (listening) {
            if (!chatMic) return;
            chatMic.classList.toggle('is-listening', listening);
            chatMic.setAttribute('aria-pressed', listening ? 'true' : 'false');
            chatMic.setAttribute('aria-label', listening ? 'Остановить голосовой ввод' : 'Голосовой ввод');
        };

        const stopChatMic = function () {
            if (!chatRecognition) return;
            try {
                chatRecognition.stop();
            } catch (error) {
                setChatMicState(false);
            }
            setChatMicState(false);
        };

        if (chatMic && ChatRecognition) {
            chatMic.hidden = false;
            chatRecognition = new ChatRecognition();
            chatRecognition.lang = 'ru-RU';
            chatRecognition.interimResults = false;
            chatRecognition.maxAlternatives = 1;
            chatRecognition.continuous = false;

            chatRecognition.addEventListener('start', function () {
                setChatMicState(true);
            });

            chatRecognition.addEventListener('result', function (event) {
                const result = event.results && event.results[0] && event.results[0][0];
                const text = result ? String(result.transcript || '').trim() : '';
                if (!text) return;
                const current = chatInput.value.trim();
                chatInput.value = current ? current + ' ' + text : text;
                chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                chatInput.focus();
            });

            chatRecognition.addEventListener('end', function () {
                setChatMicState(false);
            });

            chatRecognition.addEventListener('error', function (event) {
                setChatMicState(false);
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    showMicError('Нет доступа к микрофону: разрешите его в настройках браузера или наберите вопрос текстом.');
                } else if (event.error === 'no-speech') {
                    showMicError('Не расслышал — попробуйте ещё раз или наберите вопрос текстом.');
                } else {
                    showMicError('Голосовой ввод не сработал — наберите вопрос текстом.');
                }
            });

            chatMic.addEventListener('click', function () {
                if (chatMic.classList.contains('is-listening')) {
                    stopChatMic();
                    return;
                }
                hideChatError();
                try {
                    chatRecognition.start();
                } catch (error) {
                    setChatMicState(false);
                    showMicError('Голосовой ввод сейчас недоступен — наберите вопрос текстом.');
                }
            });
        }

        function resetChat() {
            stopChatMic();
            chatRun++;
            chatMode = 'bot';
            chatAtStart = true;
            lastUserQuestion = '';
            chatTitle.textContent = 'Татьяна Петровна';
            chatStatus.textContent = 'ИИ-помощник ТП НББ · онлайн';
            if (chatAvatar) chatAvatar.classList.remove('is-human');
            hideChatTyping();
            hideChatError();
            clearChatChips();
            chatLog.innerHTML = '';
            chatLog.scrollTop = 0;
            chatInput.value = '';
            chatInput.placeholder = 'Напишите сообщение…';
            greetChat();
            updateChatBack();
            if (chat.classList.contains('is-open')) chatInput.focus();
        }

        const operatorAnswers = [
            {
                re: /печат|копир|скан|принтер|визитк|буклет|ламинар|перепл/,
                a: 'Печать — от 5 ₽ за страницу, сканирование — от 10 ₽, визитки — от 350 ₽ за 50 штук, переплёт и ламинирование — от 250 ₽. Файл можно принести на флешке или прислать на info@example.by. Сколько страниц и в каком формате?'
            },
            {
                re: /цен|стоим|сколько сто|тариф|прайс|руб/,
                a: 'Тарифы: коворкинг — от 200 ₽/час, детская комната — от 250 ₽/час, сауна — от 500 ₽/час, спортзал — от 1000 ₽/месяц, лекторий — от 5000 ₽/час, концертный зал — от 10 000 ₽/час. Печать — от 5 ₽ за страницу. Что именно считаем?'
            },
            {
                re: /брон|аренд|зал|лектори|концертн|коворкинг|сауна|переговорн|пространств/,
                a: 'Залы бронируем по телефону +375 (17) 300-00-00 или через форму на странице услуги. Подскажите дату, время и число гостей — проверю свободные окна. Лекторий — от 5000 ₽/час, концертный зал — от 10 000 ₽/час, коворкинг — от 200 ₽/час.'
            },
            {
                re: /час|график|режим|работает|санитарн|во сколько|до скольк/,
                a: 'Библиотека работает ежедневно с 10:00 до 22:00, санитарный день — последний вторник месяца. У коворкинга и детской комнаты свой график. Какое пространство вас интересует?'
            },
            {
                re: /адрес|находит|добрат|метро|где вы|проезд|остановк/,
                a: 'Мы на проспекте Независимости, 116, вход со стороны проспекта. От метро 7–10 минут пешком, для маломобильных посетителей есть пандус и лифт. Подсказать маршрут от конкретной станции?'
            },
            {
                re: /событи|афиш|лекци|мастер-класс|экскурс|концерт|клуб|игротек|вечер/,
                a: 'Ближайшие события: 06.11 — лекция «Как читать современную прозу», 08.11 — детский клуб «Совёнок», 12.11 — мастер-класс по нейросетям, 15.11 — поэтический вечер, 21.11 — экскурсия по фонду редких книг, 29.11 — игротека. Вход бесплатный. Записать вас на какое-то из них?'
            },
            {
                re: /билет|запис|абонемент|читательск|стать читател/,
                a: 'Читательский билет оформляется бесплатно на стойке информации, нужен паспорт. Регистрация на сайте его не заменяет — она для личного кабинета и заявок. Подсказать, что взять с собой?'
            },
            {
                re: /книг|каталог|поиск|найти|автор|фонд|наличи/,
                a: 'Проверю по каталогу. Напишите автора и название — посмотрю, есть ли книга в фонде, и подскажу, в каком зале её выдают.'
            },
            {
                re: /wi-?fi|вай-?фай|интернет|компьютер|электронн|базы/,
                a: 'Wi-Fi бесплатный, компьютеры — в читальных залах. Удалённые базы и продление книг открываются по читательскому билету. Нужен доступ к конкретной базе?'
            },
            {
                re: /телефон|контакт|почт|e-?mail|позвон|связаться/,
                a: 'Телефон справочной: +375 (17) 300-00-00, почта info@example.by. Работаем ежедневно с 10:00 до 22:00. Что ещё подсказать?'
            },
            {
                re: /жалоб|плохо|не работает|проблем|ошибк|недовол/,
                a: 'Спасибо, что сообщили. Передам замечание коллегам и вернусь с ответом. Если вопрос срочный — позвоните: +375 (17) 300-00-00.'
            },
            {
                re: /спасибо|благодар|понятно|окей|хорошо|до свидан|пока/,
                a: 'Пожалуйста! Если появятся вопросы — пишите, я на связи.'
            }
        ];

        const operatorFallbacks = [
            'Уточню у коллег и вернусь с ответом. Пока могу подсказать часы работы, адрес, услуги, печать и афишу — что интересует?',
            'Хороший вопрос, мне нужно проверить. Оставьте, пожалуйста, телефон или e-mail — ответим в течение рабочего дня.',
            'Сейчас посмотрю в расписании. Если вопрос не срочный, его можно оставить в форме обратной связи — я передам библиотекарю.'
        ];

        const operatorReply = function (text) {
            const value = text.toLowerCase().replace(/ё/g, 'е');
            const isGreeting = value.length <= 24 && /^(привет|здравств|добрый|доброе утро|хай|hello)/.test(value);

            let answer;
            if (isGreeting) {
                answer = 'Здравствуйте! Анна, администратор библиотеки. Слушаю вас.';
            } else {
                const rule = operatorAnswers.find(function (item) {
                    return item.re.test(value);
                });
                answer = rule
                    ? rule.a
                    : operatorFallbacks[Math.floor(Math.random() * operatorFallbacks.length)];
            }

            chatStatus.textContent = 'оператор · печатает…';
            showChatTyping();
            chatLater(function () {
                hideChatTyping();
                chatStatus.textContent = 'онлайн';
                addChatMessage(answer, 'bot', { rate: true });
            }, 700 + Math.min(value.length * 12, 900));
        };

        const CHAT_BLOCKED = [
            'хуй', 'хуи', 'хуе', 'хуя', 'хую', 'пизд', 'ебан', 'ебал', 'ебл', 'бля',
            'сука', 'залуп', 'уеб', 'пидор', 'гандон', 'шлюх', 'мраз', 'дебил',
            'кретин', 'идиот', 'дурак', 'дура', 'чмо', 'урод', 'говн', 'дерьм',
            'жоп', 'сран', 'срак', 'жидок', 'жиды', 'жидов',
            'fuck', 'shit', 'bitch', 'cunt', 'asshole', 'dick', 'bastard', 'slut',
            'whore', 'nigger'
        ];

        const CHAT_SENSITIVE = [
            'убий', 'убить', 'убил', 'убью', 'убива', 'насил', 'террор', 'экстрем',
            'взорв', 'взрыв', 'расправ', 'оружи', 'нарко', 'порно', 'секс',
            'проститут', 'kill', 'murder', 'terror', 'violen', 'weapon', 'drug', 'porn'
        ];

        const CHAT_SPAM = [
            'казино', 'бинарн', 'пирамид', 'опцион', 'мошенн', 'спам',
            'криптовалют', 'casino', 'crypto', 'pyramid'
        ];

        const CHAT_STUDY = /книг|литератур|роман|повест|учебник|пособ|истор|биограф|энциклопед|автор|издани|почита|найти|фонд|каталог|реферат|курсов|диплом|исследован|стать/;
        const CHAT_LINK = /(https?:\/\/|www\.|t\.me\/|vk\.com\/)/;
        const CHAT_MASH = [
            'asdf', 'sdfg', 'dfgh', 'fghj', 'ghjk', 'hjkl', 'zxcv', 'xcvb',
            'йцук', 'цуке', 'укен', 'фыва', 'ывап', 'вапр', 'апро', 'олдж', 'ячсм', 'чсми'
        ];

        const chatHit = function (value, roots) {
            for (let i = 0; i < roots.length; i++) {
                if (value.indexOf(roots[i]) !== -1) return true;
            }
            return false;
        };

        const chatGibberish = function (value) {
            if (!value) return false;
            if (/(.)\1{4,}/.test(value)) return true;

            const letters = value.replace(/[^a-zа-я]/g, '');
            if (letters.length >= 6) {
                const unique = {};
                let count = 0;
                for (let i = 0; i < letters.length; i++) {
                    const letter = letters.charAt(i);
                    if (!unique[letter]) {
                        unique[letter] = true;
                        count++;
                    }
                }
                if (count / letters.length < 0.35) return true;

                const triples = {};
                for (let i = 0; i <= letters.length - 3; i++) {
                    const triple = letters.slice(i, i + 3);
                    triples[triple] = (triples[triple] || 0) + 1;
                    if (triples[triple] >= 3) return true;
                }
            }

            const words = value.split(/\s+/);
            for (let i = 0; i < words.length; i++) {
                const word = words[i].replace(/[^a-zа-я]/g, '');
                if (word.length < 3) continue;
                if (!/[aeiouyаеиоуыэюя]/.test(word)) return true;
                if (/[bcdfghjklmnpqrstvwxzбвгджзйклмнпрстфхцчшщ]{6,}/.test(word)) return true;
                for (let j = 0; j < CHAT_MASH.length; j++) {
                    if (word.indexOf(CHAT_MASH[j]) !== -1) return true;
                }
            }

            return false;
        };

        const chatProblem = function (text) {
            const value = String(text || '').toLowerCase().replace(/ё/g, 'е');
            const study = CHAT_STUDY.test(value);

            if (chatHit(value, CHAT_BLOCKED) || chatHit(value, CHAT_SPAM)) return 'rude';
            if (!study && chatHit(value, CHAT_SENSITIVE)) return 'rude';

            const links = value.split('nlb.by').join('').split('example.by').join('');
            if (CHAT_LINK.test(links)) return 'spam';

            if (chatGibberish(value)) return 'gibberish';
            return '';
        };

        const CHAT_ERRORS = {
            rude: 'Давайте без грубостей, рекламы и подозрительных предложений. Напишите вопрос спокойно — помогу с книгами, залами, печатью и афишей.',
            spam: 'Ссылки в чате не принимаются. Напишите вопрос словами или оставьте его в форме обратной связи.',
            gibberish: 'Не разобрал сообщение. Напишите вопрос словами — например: «часы работы» или «как записаться».'
        };

        const showChatError = function (kind) {
            if (!chatError) return;
            chatError.textContent = CHAT_ERRORS[kind] || CHAT_ERRORS.gibberish;
            chatError.hidden = false;
            chatInput.setAttribute('aria-invalid', 'true');
            chatInput.classList.add('is-invalid');
            if (chat.classList.contains('is-open')) chatInput.focus();
        };

        const hideChatError = function () {
            if (!chatError) return;
            chatError.hidden = true;
            chatInput.removeAttribute('aria-invalid');
            chatInput.classList.remove('is-invalid');
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

            const problem = chatProblem(value);
            if (problem) {
                showChatError(problem);
                return;
            }

            hideChatError();
            clearChatChips();
            lastUserQuestion = value;
            addChatMessage(value, 'user');
            chatInput.value = '';
            chatAtStart = false;
            updateChatBack();
            handleChat(value);
        }

        const greetChat = function () {
            const greeting = sectionGreeting();
            const row = addChatMessage(greeting.text, 'bot');
            row.classList.add('nlb-chat__msg--greeting');
            addChatChips(greeting.chips);
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
            updateChatBack();
            window.setTimeout(function () {
                chatInput.focus();
            }, 220);
        };

        const closeChat = function () {
            stopChatMic();
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

        chat.querySelectorAll('[data-chat-copy]').forEach(function (button) {
            button.addEventListener('click', copyChat);
        });

        if (chatBack) {
            chatBack.addEventListener('click', function () {
                if (chatMode === 'human') switchToBot();
                else resetChat();
            });
        }

        chatForm.addEventListener('submit', function (event) {
            event.preventDefault();
            sendChat(chatInput.value);
        });

        chatInput.addEventListener('input', hideChatError);

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
