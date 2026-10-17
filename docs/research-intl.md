# Как пишут небольшие зарубежные обжарки: приёмы для русского лендинга «Кварты»

Чтение: 16–17 октября 2026. Только чтение и исследование: ничего не публиковал, формы не отправлял, заказы, аккаунты и рассылки не создавал.
Цитаты на английском, каждая до 10 слов, каждая сверена с текстом страницы по указанному URL (метод и ограничения в разделе 2).

Состав: 13 небольших и средних обжарок + 2 «громких» бренда для контраста (15 сайтов) + одно кафе, исключённое из анализа.

## 0. Главное за минуту

1. В «тихих» текстах (Tim Wendelboe, Heart, FAQ у Square Mile, Coava, Counter Culture, Onyx, Gardelli) в каждом абзаце есть проверяемая вещь: дата, число, имя, место, срок. Оценочных слов там 0–6 на 1000, а в условиях доставки и FAQ цифр обычно 15–40 на 1000 (длинные FAQ Onyx, Counter Culture и Passenger дают 7–9).
2. «Глянец» живёт в блоках «О нас», в промо подписки и в футерах, даже у хороших обжарок: 15–39 оценочных слов на 1000 против 0–4 в FAQ того же сайта. У Blue Bottle в истории бренда 59 на 1000 при 1 цифре на 1000. Простой тест: если абзац можно перенести на сайт любой другой обжарки без правок, это глянец.
3. Расписание подают как недельный цикл с порогом заказа (Heart, Coava, Gardelli, Ozone), а ближайшую дату выводят на страницу (Tim Wendelboe: две даты прямо на карточке подписки).
4. Про свежесть честные бренды говорят окном, а не лозунгом: когда жарим, когда отправляем, сколько зерну отдыхать. Окна у разных обжарок: около 7 дней (Heart), 5–10 дней (Tim Wendelboe), от 10 дней (La Cabra), 2 недели (Passenger). У «Кварты» зерно приезжает на 1–3 день, а по рекомендациям этих обжарок зерну после обжарки ещё нужно отдохнуть (дегазация), поэтому честный текст должен сказать, когда лучше варить. Цифру надо взять у основателей.
5. Условия (доставка, возврат, подписка) пишут как вопросы клиента и короткие ответы, которые начинаются с «да» или «нет». Неудобное стоит прямо в тексте: «возврата кофе нет», «трек придёт раньше посылки», «после старта обжарки заказ не отменить».
6. Вкус: три слова-существительных из быта плюс одна шкала или одна фраза. Не «яркий букет», а “cherry, sweet cream, fudge” (Heart, https://www.heartroasters.com/products/stereo-seasonal-blend). Строки вкуса в ТЗ «Кварты» уже такие, их стоит сохранить.
7. Громкие бренды (Death Wish, Blue Bottle) вместо дат и фермеров ставят миллиграммы кофеина, сертификаты, «#1», «100 дней». Против доверия работают: недоказуемые превосходные степени, выдуманные «клубы», шутки на месте условий, противоречия в числах (Death Wish: гарантия 60 дней и 30 дней на одной странице).
8. Хорошие обжарки тоже путают собственные числа: Square Mile (доставка «1–3» и «2–3» дня), La Cabra (бесплатная доставка от $79, $89 и $99), Coava (отправка за 72 и за 48 часов). Для лендинга: один список чисел, оттуда они попадают везде.
9. При переносе на русский переносить приёмы, а не слова. Ловушки: «мы верим / мы гордимся», «откройте для себя», «ваш» через слово, цепочки деепричастий, «кислотность» (по-русски читается как дефект), «подписаться» (как на канал), идиомы вроде “Get the kettle on!” (Ozone, ссылка в 2.9).
10. В ТЗ нет фактов, которые на хороших сайтах названы всегда: до какого дня и часа заявка попадает в ближайшую обжарку, стоит ли дата обжарки на пачке, окно «когда варить», что значит «1–3 день», какие сорта в подписке, как её приостановить и отменить, что с возвратом, когда перезвонит менеджер. Эти пункты надо уточнить или записать допущениями в README (ТЗ это разрешает).

## 1. Что и как читал

- WebFetch (как просили) отдавал HTTP 429 («Too Many Requests») на первые же попытки по Tim Wendelboe, Square Mile, La Cabra, Onyx, Counter Culture, Death Wish, Passenger, позже и на подстраницы Heart; Blue Bottle ответил 403. Прочитать через WebFetch удалось только главные страницы Heart и Coava. Его выдача к тому же пересказ небольшой модели, дословность не гарантирована.
- Поэтому основной метод: обычный HTTP GET (curl) в stdout без сохранения страниц и локальное извлечение видимого текста. Без обхода защит: сайты отдали страницы сразу, без проверок.
- Blue Bottle не открылся ни через WebFetch, ни через curl (403). Страницы открыл как обычный посетитель во встроенном браузере и прочитал текст оттуда. Ничего не нажимал и не вводил, вкладку закрыл.
- WebSearch использовал только для поиска адресов страниц. Фразы из поисковых пересказов не цитирую.
- Из файлов проекта читал только ТЗ (4 PNG в scratchpad\brief), чтобы привязать примеры к фактам «Кварты». Один раз сохранил страницу во временный файл в /tmp (Git Bash) и сразу удалил. Других файлов, кроме этого отчёта, не создавал и не менял.
- Проверка цитат: все английские цитаты из этого файла (в кавычках “ ”) сверены программно с текстом страниц (подстрока без учёта регистра и типа апострофа и дефиса, длина не больше 10 слов); подписи кнопок и полей карточек сверены так же. Цитаты Blue Bottle сверены в браузере тем же способом. Итог проверки и список неподтверждённых мест (если есть) в конце файла.
- Не открылось: адрес gardellispecialitycoffees.com из списка не соединяется; настоящий сайт Gardelli (shop.gardellicoffee.com) нашёл через поиск. Prufrock открылся, но это кафе, которое варит чужой кофе (в том числе Square Mile): как обжарка не годится, в анализ не включён.
- Не видел: транзакционных писем (подтверждение заказа, напоминание о списании, трекинг). Видны только описания, когда они приходят (см. раздел 4е). Не читал страницы, где текст подгружается скриптом: помощь Origin, часть подписки Onyx, каталог Passenger, дату «next roasting date» у Gardelli (о ней знаю только из FAQ).
- Ограничения: по одной–две страницы каждого типа на сайт; статистика грубая (приложение А); цены и даты на момент чтения.

## 2. Разбор по сайтам

Шесть строк на сайт: голос и ритм, факты, вкус, свежесть и расписание, кнопки и подписка, чего нет. Затем цитаты. Расшифровка метрик в приложении А.

### 2.1 Tim Wendelboe, Осло: https://timwendelboe.no/
Читал: /pages/our-story, /pages/faq, /products/tatmara, /products/gachatha-espresso, /products/tims-choice-coffee-subscription, шапку сайта. Как: curl.
1. Голос и ритм. «Мы» (обжарка), а внутри истории Тим в третьем лице («Tim started working as a barista»); в заметках на карточках «я». Среднее предложение около 16 слов в истории, 18 в FAQ; рядом с длинными стоят совсем короткие («He was nineteen.»). Восклицательных знаков нет.
2. Факты. Годы (2007; 2018 переезд; 2019 собственная ферма), адрес, страны закупки, «мы ездим к ним каждый год», «мы публикуем, сколько платим». На карточке поля Cultivar, Flavour notes, Producer (имя фермера), Country, Region, Process, Harvest date; пачка 250 g. В FAQ сроки по зонам (Европа 2–3 рабочих дня, остальной мир 3–4), список стран, куда не отправляют, и то, что цена на кассе уже включает пошлины.
3. Вкус. Одна строка на карточке (“A clean and expressive coffee with floral, citrus…”, https://timwendelboe.no/products/tatmara) и поле “Flavour notes: Citrus, floral & stone fruits”. Длинный текст про сорт, ферму и обработку, а не про вкус.
4. Свежесть и расписание. Жарят под заказ каждую неделю; подписка уходит в первую среду месяца; на карточке подписки две даты: когда уйдёт следующая партия (“When will we ship the next batch of coffee?”, на момент чтения 4 ноября) и последний день заказа (“Sign up deadline for the next shipment”, 31 октября). Окно: от 1 недели после обжарки до 5 недель (“1 week after roasting to within 5 weeks”, FAQ), лучший результат после 5–10 дней отдыха, и к моменту, когда посылка пришла, кофе готов; отправляют в течение недели после обжарки; пакеты с азотом.
5. Кнопки и подписка. “Add to cart - 235 kr” (цена прямо на кнопке), “Buy Tatmara”, “Explore our coffees”, “Check out”. Подписка: авто-продление, пропуск или отмена в любой момент, обязательного срока нет; количество и профиль меняют письмом до даты продления, иначе изменение уйдёт в следующий месяц. Объясняют через бытовое сравнение (“Just like a magazine subscription – or Netflix”, FAQ) и отдельным ответом про трек-номер, который приходит раньше посылки (в вопросе клиента: “my package is not moving”).
6. Чего нет. Оценочных слов: 0 и 1,1 на 1000 слов (история / FAQ). Нет лозунгов про «лучший кофе», шуток в условиях. На вопрос “Do your prices include shipping?” отвечают «нет» и объясняют, что доставка считается на кассе.

Цитаты:
- “We have been roasting to order every week since 2007” — https://timwendelboe.no/pages/our-story
- “we were not going to become bakers” — https://timwendelboe.no/pages/our-story
- “Auto-renews, skip or cancel anytime.” — https://timwendelboe.no/products/tims-choice-coffee-subscription
- (все остальные английские фрагменты этого раздела с адресами страниц: /pages/faq, /pages/our-story, /products/tatmara, главная https://timwendelboe.no/)

### 2.2 Square Mile, Лондон: https://shop.squaremilecoffee.com/
Читал: главная, /pages/about-us, /pages/faq, /pages/shipping, /pages/new-subscription, /products/red-brick, /products/chepsangor. Как: curl.
1. Голос и ритм. «Мы», два регистра. About корпоративный: в среднем 21 слово, 43% предложений длиннее 25. FAQ разговорный: 16–17 слов, вопросы с интонацией («Why 350g bags, you ask?»).
2. Факты. Основатели и год (2008). Вес пачки 350 g и объяснение числа: взяли американские 12 унций (341 g) и округлили до 350. На карточке цена за 100 g (£7.35/100g), страна, сорт, обработка, имя производителя, рецепт (доза 19 g, вода 94 °C, 28–32 секунды). Заказ до 8:30 по Лондону в рабочий день уходит в тот же день.
3. Вкус. Через слэш, 3–4 слова: “BLACKCURRANT / RHUBARB / SYRUPY” (https://shop.squaremilecoffee.com/products/chepsangor), “Cherry / CHOCOLATE mousse / forest fruits / caramel” (https://shop.squaremilecoffee.com/products/red-brick). Ниже 2–3 предложения про лот.
4. Свежесть и расписание. Жарят и отправляют с понедельника по пятницу, отправка в течение 24 часов после обжарки. Честная оговорка: кофе хранится долго, но лучше выпить за 3 месяца с обжарки и за месяц после вскрытия.
5. Кнопки и подписка. “Add to cart”, “Add 350g”, “Read More”, “Shop Now”, “Book Now”. Подписка из 7 шагов; над формой подпись “Treat yourself to better mornings with a coffee subscription.”; частоту объясняют в чашках в день, с вопросом “Always out over weekends?”. После того как заказ ушёл в обжарку, отмену не принимают (“cannot accept cancellations on coffee or subscription orders”, FAQ); пауза и отмена через личный кабинет.
6. Чего нет. В FAQ и Shipping оценочных слов почти нет (0,6 на 1000), в About их 24 на 1000 (“committed to excellence”, “obsessed with flavour”). Числа расходятся: срок доставки на странице Shipping «2–3 дня», в FAQ «1–3 дня» (фраза про «48 часов не гарантировано», “delivery within 48 hours isn’t guaranteed”, одинаковая на обеих).

Цитаты:
- “Why 350g bags, you ask?” — https://shop.squaremilecoffee.com/pages/faq
- “Not too little, not too much.” — https://shop.squaremilecoffee.com/pages/faq
- “Always out over weekends?” — https://shop.squaremilecoffee.com/pages/new-subscription

### 2.3 La Cabra, Орхус и Копенгаген: https://us.lacabra.com/ (читал американский магазин)
Читал: главная, /pages/about-la-cabra, /pages/shipping, /products/rituals-subscription, /products/karimikui, /policies/subscription-policy. Как: curl.
1. Голос и ритм. «Мы», самый абстрактный About в выборке: в среднем 24 слова, 44% предложений длиннее 25; повторяются experience, transparent, intentional, journey. Страницы доставки и политик сухие: около 14 слов.
2. Факты. На карточке блок «Technical Data»: Producer, Region, Altitude (1800 masl), Varietal, Process, Harvest (December 2025). Рядом «Brewing Advice»: мягкая вода (TDS ниже 150 ppm) и отдых зерна не меньше 10 дней после обжарки. Цена «From $26.00», 250 g или 1 kg.
3. Вкус. Одна фраза в верхней части карточки (“Crisp blackcurrant and fresh sugarcane in this returning favourite from…”) и поле «Coffee Expression» с фразой “A typical washed Kenyan profile” (оба на https://us.lacabra.com/products/karimikui).
4. Свежесть и расписание. Карточка: “Ships within 1-3 days from Brooklyn, New York”. Страница доставки: обработка 1–3 рабочих дня, дорога 2–6, до жалобы ждать до 10 дней, и правило не отправлять кофе старше 14 дней от обжарки.
5. Кнопки и подписка. “Shop now”, “Learn more”, “Add to cart”, “Send as gift”, “Sign Up Now”. Подписка: четыре коротких обещания в заголовках (“No commitment”, “Free shipping”, “15% storewide discount”, “For all brew methods”) и честная оговорка про вес пачки. В политике: подписка продолжается, пока вы сами не отмените, это ваша ответственность.
6. Чего нет. В About почти нет цифр (3,9 на 1000) при 22 оценочных словах на 1000; о ценах и расписании там ни слова. Числа расходятся: порог бесплатной доставки $79 на карточке, $89+ в баннере, $99 на странице доставки. Самый «глянцевый» абзац выборки: описание рассылки Rituals.

Цитаты:
- “beyond 14 days from roast” — https://us.lacabra.com/pages/shipping
- “you’ll get 200g of something special instead of 250g” — https://us.lacabra.com/products/rituals-subscription
- “a memoir in constant motion” — https://us.lacabra.com/products/rituals-subscription

### 2.4 Heart, Портленд: https://www.heartroasters.com/
Читал: главная (WebFetch), /pages/about, /pages/faq, /pages/shipping-returns, /products/roasters-choice-subscription, /products/stereo-seasonal-blend. Как: WebFetch для главной, остальное curl.
1. Голос и ритм. «Мы»; бренд пишет себя строчными и иногда в третьем лице (“heart is in it for the long-run”). FAQ короткий: в среднем 14,5 слова, медиана 12; ответы без вступлений.
2. Факты. На каждой пачке дата обжарки и номер партии; партии, не прошедшие контроль качества, отдают в фудбанк. В карточке бленда доли и ферма (“50% Colombia, Piendamó” и “50% Ethiopia, Habtamu Fikadu Danche”), цена закупки зелёного кофе (“FOB cost: $5.95lb / $13.11kg”) с расшифровкой, что в неё входит (все три на https://www.heartroasters.com/products/stereo-seasonal-blend).
3. Вкус. Три слова строчными: “cherry, sweet cream, fudge” (та же страница). Уровни light/medium/dark не называют и объясняют почему: каждый кофе жарят индивидуально.
4. Свежесть и расписание. Заказ до 12:00 по тихоокеанскому времени в будний день уходит на следующий день (пн–чт); заказы с четверга 12:00 до воскресенья 12:00 уходят в понедельник. Отдых: около 7 дней после обжарки, лучшее окно 7–30 дней. Срок доставки считают как обработка плюс дорога и разбирают пример по дням недели.
5. Кнопки и подписка. “buy”, “Subscribe”, “Add to cart”, “View New Arrivals”, “SEE BREW RECIPES”. Подписка Roasters Choice: ротация раз в две недели; что придёт при 1 и при 2 пакетах; как частота доставки влияет на повторы кофе; подмену сортов не делают (“We cannot accommodate substitutions for Roasters Choice subscription.”, FAQ). Перед оплатой юридическая строка согласия на списания.
6. Чего нет. Оценочных слов в FAQ нет вообще (0 на 812 слов). Гарантий «не понравится, вернём деньги» нет (“We cannot guarantee refunds on coffee purchases.”); заказ, который трекинг считает доставленным, не возмещают (“We cannot refund orders that are marked as delivered”); при пропаже есть пошаговая инструкция под заголовком “Where is my package?”.

Цитаты:
- “tagged with a roast date and batch number” — https://www.heartroasters.com/pages/about
- “Processing Time + Transit Time” — https://www.heartroasters.com/pages/faq
- “We cannot guarantee refunds on coffee purchases.” — https://www.heartroasters.com/pages/shipping-returns

### 2.5 Coava, Портленд: https://coavacoffee.com/
Читал: главная (WebFetch и curl), /our-story, /shipping-and-returns, /subscription-faq. Как: WebFetch и curl.
1. Голос и ритм. «Мы»; история про основателя Мэтта в третьем лице, в шапке словарная шутка (“coava noun”, https://coavacoffee.com/our-story). FAQ подписки: 15 слов в среднем, ответы начинаются с “Yes!” и “Absolutely.”. История общая и длиннее: 20 слов, 14,6 оценочных на 1000.
2. Факты. 2008, гараж в Северном Портленде, основатель чинил мотоциклы, чтобы открыть дело. В подписке выбирают количество пачек, частоту, способ заваривания (drip или espresso) и вкусовой профиль (Classic, Unique, Combined); доставка по подписке плоская $6.95; автоотправка раз в 2, 4, 6 или 8 недель со скидкой 5%.
3. Вкус. Две корзины вместо описаний: Classic (баланс, привычное, шоколад, карамель, орехи) и Unique (фрукты, цветы, неожиданное). Вкусовых заметок на главной нет.
4. Свежесть и расписание. Жарят “five days a week, Sunday through Thursday” (FAQ подписки); заказы обычно уходят в течение 48 часов после заказа или 24 часов после обжарки; заказ после 12:00 PT в пятницу уходит во вторник. Отправка пн–чт.
5. Кнопки и подписка. “Shop Coffee”, “Learn More”, “Shop Now”, “Subscribe Now”. Предпочтения и ближайшие сорта можно менять в кабинете до обработки заказа. Возврат зерна не принимают, но просят написать в течение 15 дней после статуса «доставлено» и приложить фото упаковки и повреждения. Не забранный за 30 дней самовывоз считается “considered abandoned and discarded” (то есть выбрасывают).
6. Чего нет. На главной нет цен и описаний вкуса. Блок для старых подписчиков честно называет дату перехода на новую программу (8 сентября) и что условия меняются. Числа расходятся: «в течение 72 часов» на странице доставки и «48 часов» в FAQ подписки (возможно, разные потоки заказов).

Цитаты:
- “Specialty coffee roasted to order & shipped to your door.” — https://coavacoffee.com/
- “Classic coffees tend to be balanced, familiar, and comforting” — https://coavacoffee.com/subscription-faq
- “notoriously fueled by good folks and Led Zeppelin” — https://coavacoffee.com/our-story

### 2.6 Onyx, Арканзас: https://onyxcoffeelab.com/
Читал: главная, /pages/our-story, /pages/faq, /products/honduras-fredy-perez. Страница подписки и часть главной подгружаются скриптом, не читал. Как: curl.
1. Голос и ритм. «Мы». About с лозунгами (“Never Settle for Good Enough”) и длинным списком наград; FAQ разговорный: “We’re human, but we want to strive to be better”. В FAQ 15,5 слов в среднем, около 6 восклицательных знаков на 1000 слов.
2. Факты. На карточке (https://onyxcoffeelab.com/products/honduras-fredy-perez): высота (“1800 MASL”), сорта, обработка, сезон урожая, степень обжарки в Agtron (Ultra Light, #133), производственный ростер, даже остаток на складе. На странице истории обещано, что у каждого кофе есть данные о цене закупки и баллах: видно, сколько заплатили, на сколько баллов оценён и у кого куплен (“you can see what we paid for it”).
3. Вкус. Слова столбиком, 3–4 штуки (Tart Apple, Pecan, Fig, Allspice) и шкала, описанная в FAQ как “Traditional to Modern Scale”: на одном конце орех, сухое вино, горький шоколад; на другом цитрус, цветы, фрукты.
4. Свежесть и расписание. Жарят под заказ и отправляют с понедельника по пятницу, самое позднее через 24 часа после обжарки. Вскрытая пачка “good for about 30 days”.
5. Кнопки и подписка. “Explore This Offering”, “Add to Cart”, “Explore Coffee Subscriptions”, “See Box Sets”. FAQ написан вопросами клиента о проблемах: “Why was my card charged twice?”, про задержку, про заказ “marked as delivered but it was not”. Возврат кофе: “We do not accept coffee returns at this time.”, но если проблема, просят написать.
6. Чего нет. В FAQ оценочных слов почти нет (0,4 на 1000), зато в тексте приглашения на рассылку в футере собрано всё сразу (elevate, journey, meticulous, relentless pursuit, excellence): глянец и честный FAQ живут на одном сайте.

Цитаты:
- “We’re human, but we want to strive to be better” — https://onyxcoffeelab.com/pages/faq
- “We do not accept coffee returns at this time.” — https://onyxcoffeelab.com/pages/faq
- “Never Settle for Good Enough” — https://onyxcoffeelab.com/pages/our-story

### 2.7 Counter Culture, Дарем: https://counterculturecoffee.com/
Читал: главная, /pages/history, /pages/help-faq. Как: curl.
1. Голос и ритм. «Мы»; письмо основателя от первого лица, с короткой точкой в конце (“There is no finish line.”). FAQ: 15,5 слов в среднем и много пошаговых инструкций (начинаются с “Log into your account and select”, дальше пункты меню).
2. Факты. Таймлайн (1995, 1997, 2002, 2003); на карточках название, происхождение, цена, три слова вкуса, степень обжарки словом; в FAQ числа Agtron (самая тёмная 48, средняя 58–65, светлая выше 70); бесплатная доставка от $30; обжарка в Дареме.
3. Вкус. Три слова через вертикальную черту: “molasses | cocoa | smooth”, “sweet tea | apricot | honeysuckle”, рядом уровень обжарки (“light roast”). Все на главной странице https://counterculturecoffee.com/.
4. Свежесть и расписание. “Our roasting facility operates Monday through Friday”, в выходные закрыта; первый заказ подписки уходит в ближайший рабочий день. Даты обжарки и окна отдыха в прочитанных страницах нет.
5. Кнопки и подписка. “Add to Cart”, “SHOP NOW”, “START A SUBSCRIPTION”. Три шага: выберите кофе, выберите частоту, “Enjoy fresh coffee on repeat!”. Условия: платёж только в день отправки, письмо-напоминание перед каждым заказом, кнопка отмены «внизу справа» на странице подписки. Заказ после оформления не изменить (“Please triple-check your address, order, quantity, and billing details.”). Возврат кофе не принимают из-за скоропортящегося продукта (“returns on coffee due to its perishable nature”).
6. Чего нет. «О нас» построено на четырёх ценностях (качество, устойчивость, образование, прозрачность) без цифр. Расписания по дням для заказа нет, только «пн–пт».

Цитаты:
- “There is no finish line.” — https://counterculturecoffee.com/pages/history
- “Please triple-check your address, order, quantity, and billing details.” — https://counterculturecoffee.com/pages/help-faq
- “only be billed on the day the order is shipped” — https://counterculturecoffee.com/pages/help-faq

### 2.8 Dark Woods, Западный Йоркшир: https://darkwoodscoffee.co.uk/
Читал: главная, /pages/about, /pages/delivery. Как: curl.
1. Голос и ритм. «Мы» и три основателя по именам, у каждого короткая биография. About длинный (среднее 24,6 слова, 35% длиннее 25), но с самоиронией: сайт критикует «generic messaging» всей отрасли.
2. Факты. Основана в 2014 году тремя друзьями; больше 100 наград Great Taste (и объяснение, как судят: вслепую). Доставка: бесплатно от £35, отправка «в течение 3 рабочих дней», ждать до 5; возврат 7 дней; за пределы Великобритании не отправляют.
3. Вкус. Короткие бытовые сравнения прямо в карточке (главная): “Melts to rich caramel in milk”, “Tastes of pure, dark chocolate”, “French toast on a summer's morning”, “Flavours of rich fruit cake”. У редких лотов список вроде “Notes Of Port Wine And Malted Chocolate”.
4. Свежесть и расписание. Дней обжарки в прочитанном нет, только “dispatched within 3 working days” (Delivery) и “delivered fresh” (подписка на главной). Слабое место относительно остальных.
5. Кнопки и подписка. “Quick Add”, “Shop all”, “Read More Here”, “ENTER THE DARK WOODS”. Подписка: “SUBSCRIPTIONS MADE EASY”, три шага Choose / Edit / Enjoy, скидка 5%, “easily pause/cancel at any time”.
6. Чего нет. Страница Delivery написана юридическим языком (“All risk in the products you order” и дальше про переход риска), без живых формулировок. Но про «только Великобритания» сказано прямо и с извинением.

Цитаты:
- “the generic messaging makes it hard to differentiate” — https://darkwoodscoffee.co.uk/pages/about
- “Melts to rich caramel in milk” — https://darkwoodscoffee.co.uk/
- “Unfortunately at the moment we only ship within the UK” — https://darkwoodscoffee.co.uk/pages/delivery

### 2.9 Ozone, Стаффорд: https://ozonecoffee.co.uk/
Читал: /pages/about-us, /policies/shipping-policy, /pages/coffee-subscriptions. Карточки кофе не читал. Как: curl.
1. Голос и ритм. «Мы», шутливый; в FAQ подписки около 31 восклицательного знака на 1000 слов (максимум выборки); названа по имени сотрудница (“Louisa in the online team will cry at her desk”, https://ozonecoffee.co.uk/pages/coffee-subscriptions). About с приветствием-слоганом.
2. Факты. Ростеры на 2, 12, 25 и 60 кг; больше 25 лет; порог заказа 07:30 по Гринвичу; доставка по уровням суммы (£30–149.99: Tracked 48, 2–4 рабочих дня; £150–199.99: Tracked 24; от £200: DPD); подписка In My Mug: жарят и отправляют по пятницам, чтобы кофе пришёл с обычной почтой в субботу утром.
3. Вкус. В прочитанных страницах карточек нет, вкус не оценивал.
4. Свежесть и расписание. “We freshly roast all our coffee” (Shipping); заказ до 07:30 уходит в тот же рабочий день; подписка In My Mug по пятницам (“every Friday”).
5. Кнопки и подписка. “Start a subscription”, “Start your In My Mug journey”, “Get started now”. Блок вопросов (пропуск, отмена, подарок, помол, переработка пакета) с ответами “Yes!” и шутками; ожидаемые сроки названы оценкой, не гарантией; объяснено, зачем нужен телефон (“Why Do We Ask for Your Phone Number?”, Shipping).
6. Чего нет. На странице доставки шуток нет вообще (0,7 оценочных слов на 1000), юмор живёт в About и FAQ подписки. About при этом перегружен оценками (26,8 на 1000: uncompromising, world-class).

Цитаты:
- “Let’s put some colour in that cup, shall we?” — https://ozonecoffee.co.uk/pages/about-us
- “all delivery timeframes are estimates, not guarantees” — https://ozonecoffee.co.uk/policies/shipping-policy
- “Get the kettle on!” — https://ozonecoffee.co.uk/pages/coffee-subscriptions

### 2.10 Origin, Корнуолл: https://www.origincoffee.co.uk/
Читал: главная, /pages/story, /products/filter-coffee-subscription, /products/resolute. Центр помощи подгружается скриптом, не читал. Как: curl.
1. Голос и ритм. «Мы» плюс цитаты основателя и директора по кофе. В Story короткие фрагменты-цепочки (“Blending science and senses, ritual and experimentation.”, “Quality first. Always.”): 35% предложений до 8 слов, ритм слогана. На странице подписки списки.
2. Факты. Год 2004, основатель; 25 000+ отзывов и рейтинг 4.8; в карточке бленда страна, регион, высота (1,000 / 1,600 masl), сорт, обработка, параметры эспрессо (18 g на 33 g, 29–32 секунды); подписка: 25% на первые три заказа, потом 10%; график ротации по месяцам.
3. Вкус. Три слова в заголовке (“Stone Fruit, Caramel, Milk Chocolate”, https://www.origincoffee.co.uk/products/resolute) и шкала Acidity / Body / Finish с уровнем и словом (“Medium, Stone-Fruit”; “Medium, Creamy”; “Medium, Nutty”). В описании прилагательные (“timeless, balanced and full-bodied”).
4. Свежесть и расписание. “Free UK delivery and next day despatch”: заказ до 23:59 (“Order before 23:59”) уходит на следующий день, кроме выходных. О дате обжарки в прочитанном нет.
5. Кнопки и подписка. “Add to Cart”, “Order Now”, “Subscribe now”, “Take the quiz”, “Find Your Flavour”. “Pause, cancel or modify at anytime”; письмо за три дня до списания; управление через приложение.
6. Чего нет. В Story нет ни цены, ни срока, ни имени фермера (цифр 3 на 1000, оценочных слов 15 на 1000); всё конкретное вынесено на страницы подписки и карточки.

Цитаты:
- “Fully tracked delivery that actually fits through your letterbox” — https://www.origincoffee.co.uk/products/filter-coffee-subscription
- “Pause, cancel or modify at anytime” — https://www.origincoffee.co.uk/products/filter-coffee-subscription
- “Quality first. Always.” — https://www.origincoffee.co.uk/pages/story

### 2.11 Passenger, Ланкастер (Пенсильвания): https://drinkpassenger.com/
Читал: /our-story, /faqs, /subscribe, /products/cusco. Часть страниц отдаёт текст не внутри основного блока, читал из HTML. Как: curl.
1. Голос и ритм. «Мы». Our Story и Subscribe самые «гладкие» тексты выборки (27 и 39 оценочных слов на 1000: thoughtfully, seamlessly, extraordinary), а FAQ написан иначе: 18,6 слова в среднем, 1,9 оценочных на 1000.
2. Факты. Карточка Cusco (https://drinkpassenger.com/products/cusco?Size=250+g): поле Purchase History со значением “Since 2019”. В FAQ конкретные рекомендации: отдых две недели от даты на дне пакета; вода (обратный осмос плюс 30 ppm карбоната кальция); если вы любите темнее, идите к сестринскому бренду Necessary.
3. Вкус. Страна и три слова (“Bergamot, Peach, Meyer Lemon”, та же карточка в списке «Keep exploring»). В FAQ рекомендации по принципу «если вам нравится X, берите Y» (шоколад и жжёный сахар: Cusco или Montecarlos; более живая кислинка и фрукты: Divino Niño, африканские).
4. Свежесть и расписание. Кофе “taste great the day they arrive” (FAQ); рекомендация 2 недели от даты обжарки на дне пакета. На странице подписки “freshly roasted” без дат.
5. Кнопки и подписка. “Subscribe Now”, “Shop Now”, “Explore Cusco”, “Add”. Подписка: пауза, замена, смена графика в любой момент, “No hassle, no commitments.” Отзывы подписчиков с городом и штатом и бытовой деталью (“I never have to think about running out”).
6. Чего нет. На странице подписки в прочитанном нет цен и сроков; вместо них “delivered seamlessly to your door” и “designed to elevate your daily routine”.

Цитаты:
- “our recommendation is 2 weeks from the roast date” — https://drinkpassenger.com/faqs
- “check out our sister brand Necessary Coffee Roasters” — https://drinkpassenger.com/faqs
- “delivered seamlessly to your door” — https://drinkpassenger.com/subscribe

### 2.12 Coffee Collective, Копенгаген: https://coffeecollective.dk/
Читал: шапка сайта, /pages/collective-subscription, /policies/shipping-policy. Как: curl.
1. Голос и ритм. «Мы»; промо-блок “A coffee journey” глянцевый (19 оценочных слов на 1000), сразу под ним FAQ простыми вопросами (среднее 15 слов). Условия магазина написаны юридически, в третьем лице.
2. Факты. 250 g (иногда 200 g); платёж “on the Monday of shipment weeks”, отправка по четвергам; доставка в Европу 10–14 дней, в остальной мир 2–3 недели; в шапке сайта (https://coffeecollective.dk/) “Weekday orders placed by 13:00 will ship the same day.” и “Free shipping in Denmark over 400kr”; вместо коробок конверты (и объяснено, зачем).
3. Вкус. На прочитанных страницах описаний вкуса нет, фермеры и страны перечислены списком.
4. Свежесть и расписание. “Our coffee is roasted within 8 days before dispatch”; отправка во все рабочие дни, подписки по четвергам.
5. Кнопки и подписка. “Subscribe”, “Add to cart”, “Subscribe now”. Преимущества списком из пяти пунктов, в том числе “Flexibility to pause or cancel anytime”. Честно: при бесплатной международной доставке отследить посылку нельзя.
6. Чего нет. Блок ошибки на странице подписки “Something went wrong, please try again later” ничего не советует сделать (слабый образец для форм). Точные сроки доставки прямо не гарантируют.

Цитаты:
- “Directly sourced, freshly roasted, free delivery” — https://coffeecollective.dk/pages/collective-subscription
- “Our coffee is roasted within 8 days before dispatch” — https://coffeecollective.dk/policies/shipping-policy
- “you will not be able to track the shipment” — https://coffeecollective.dk/pages/collective-subscription

### 2.13 Gardelli, Форли (Италия): https://shop.gardellicoffee.com/
Читал: главная, /content/faq, /content/shipping, /coffees/836-kianyangi-kenya. Как: curl.
1. Голос и ритм. «Мы» и Рубенс Гарделли в третьем лице (чемпион по обжарке). Английский, видимо, переводной (на странице рядом итальянский оригинал; ближайшую обжарку называют “the upper left angle” сайта), но текст работает, потому что полон конкретики. Разделы FAQ с заглавными заголовками, а в ответе про стиль обжарки первое предложение целиком заглавными (“YES, WE HAVE A SINGLE ROASTING STYLE…”).
2. Факты. На карточке (https://shop.gardellicoffee.com/coffees/836-kianyangi-kenya): Altitude 1700–1900 masl, Picked in Nov 25 – Mar 26, Arrived in September 2026, Shipped in Jute + GrainPro, Roasted on Customised solid-drum roaster; рецепт заваривания с цифрами (17 g, 250 g воды, 94 °C, 2:30). Цена в евро прямо на карточке.
3. Вкус. “Cup Notes: Blackcurrant, Lemon, Rhubarb, Black Tea”, дальше абзац с оценками (“vibrant and intensely expressive”, “pristine, juicy acidity”): тот же глянец внутри хорошей карточки. Рядом пометка “Suggested for espresso and filter”.
4. Свежесть и расписание. Жарят по понедельникам, средам и пятницам и отправляют в тот же день; на карточке блок “when we roast” с порогом заказа; в FAQ сказано, что ближайшая дата обжарки стоит на сайте слева вверху; трек-номер приходит в день обжарки.
5. Кнопки и подписка. “SHOP”, “Add to cart”. Подписки нет (есть рассылка со скидкой 5%). Перед покупкой просят прочитать FAQ (“read our FAQ before making a purchase”), чтобы не было недоразумений.
6. Чего нет. «Фиксированных рецептов» не дают и объясняют почему; единственный «стабильный» кофе называют прямо (бленд), остальные меняются; отдельный ответ «не судите по внешнему виду зёрен» снимает типичное сомнение. Часть уверенности держится на титулах (чемпион мира), этот приём «Кварте» не подходит.

Цитаты:
- “We roast on Mondays, Wednesdays and Fridays” — https://shop.gardellicoffee.com/content/faq
- “Cut-off time is 11:59pm (UTC+1)” — https://shop.gardellicoffee.com/coffees/836-kianyangi-kenya
- “We do not put any margin on shipping cost” — https://shop.gardellicoffee.com/content/faq

### 2.14 Death Wish (для контраста), Саратога-Спрингс: https://www.deathwishcoffee.com/
Читал: главная, /pages/about, /pages/subscription, /pages/help, /products/power-surge-coffee, /products/pumpkin-chai. Как: curl.
1. Голос и ритм. «Мы» и «клуб» (“Society of Strong Coffee”), заглавные заголовки-каламбуры, рубленые фразы с повтором (“Life doesn’t build. It hits.”, https://www.deathwishcoffee.com/products/power-surge-coffee). About: среднее 22,6 слова, 40% предложений длиннее 25.
2. Факты. Цифр мало и не тех: кофеин в мг (около 210 мг, “20% more than our Dark Roast”, страница Power Surge), размер скидки (30% на первую подписку), цены, сертификаты Organic и Fair Trade. Ферм, высоты, даты обжарки нет; поиск по прочитанным страницам слов roast date, roasted, ship within ничего не нашёл.
3. Вкус. На карточке аккуратная таблица (Aroma, Taste Profile, Acidity, Body, Aftertaste) и шкалы Light–Dark, Low–High. Вокруг неё текст про «жизнь» и «характер», а не про вкус.
4. Свежесть и расписание. Слово fresh встречается как каламбур (“fresh ways to provide bold, smooth cups of coffee”, About), не как утверждение о дате.
5. Кнопки и подписка. “Shop New Arrivals”, “Choose Your Coffee”, “Join the Society”, “Quick Shop”. Подписка оформлена как клуб: “elite realm of caffeinators”, “ride or dies”; условия сказаны одной фразой (“swap or cancel whenever you please”); частота 30, 60 или 90 дней.
6. Что работает против доверия. Противоречие в гарантии на одной странице (60 дней “no questions asked” и “within 30 days of purchase from our website”); #1 в заголовке главной страницы; отзыв “THE GREATEST COFFEE ON EARTH” в роли заголовка; шутки на месте условий.

Цитаты:
- “DESSERT CALLED. COFFEE ANSWERED.” — https://www.deathwishcoffee.com/
- “You’ve entered the elite realm of caffeinators.” — https://www.deathwishcoffee.com/pages/subscription
- “60 day money back guarantee, no questions asked” и “within 30 days of purchase from our website” — оба на https://www.deathwishcoffee.com/pages/help

### 2.15 Blue Bottle (для контраста), Окленд: https://bluebottlecoffee.com/us/eng
Читал: /us/eng, /us/eng/our-story, /us/eng/FAQ (часть FAQ, вывод был обрезан). Как: браузер (403 для WebFetch и curl).
1. Голос и ритм. «Мы», сверхгладкий корпоративный голос. В «Our Story» 59 оценочных слов на 1000 и 1,2 цифры на 1000 (максимум глянца в выборке), среднее предложение 20 слов. Заголовки заглавными (“EVERY BLEND, ITS OWN COMPOSITION”, главная).
2. Факты. Единичные и яркие среди абстракций: “70 prototypes” (дриппер, Our Story), “tasted at least 50 times by our team” (FAQ), партнёрство в среднем “five years or more” (FAQ). Цены на карточках ($19, $22). Имён фермеров на главной нет.
3. Вкус. На карточке те же три слова, что у тихих брендов (“Caramel, Vanilla, Orange Zest”) и степень обжарки; глянец в рамке вокруг (“Experience fall comfort, reimagined”), всё на главной.
4. Свежесть и расписание. Свежесть утверждается упаковкой: “up to 100 days after roasting”, после вскрытия “we recommend brewing within 14 days” (оба в FAQ). Дня обжарки и графика в прочитанном нет.
5. Кнопки и подписка. “Add to Cart”, “Shop Subscriptions”, “Explore Subscriptions”, “Shop the Vinyl”. Подписка: “pause, change, or cancel anytime” (главная), бесплатная доставка, скидка на несколько пакетов, ранний доступ.
6. Что работает против доверия. Абстракции без проверяемых деталей (“animated by a deep desire”, Our Story), в прочитанных страницах нет ответа на вопрос «когда приедет мой кофе». Единственное запоминающееся в истории бренда это “70 prototypes”.

Цитаты:
- “EVERY BLEND, ITS OWN COMPOSITION” — https://bluebottlecoffee.com/us/eng
- “crafted for moments that matter” — https://bluebottlecoffee.com/us/eng/our-story
- “tasted at least 50 times by our team” — https://bluebottlecoffee.com/us/eng/FAQ

### 2.16 Prufrock, Лондон: https://prufrockcoffee.com/ (исключён)
Открылся, но это кафе, которое варит кофе других обжарок (Square Mile и других). Текст сайта около ста слов, прочитаны главная и About. Как образец для обжарки не годится.

## 3. Сводка

### 3а. Пятнадцать приёмов ясного живого текста

1. **Факт вместо оценки.** В абзаце стоит проверяемая вещь: дата, число, имя, место. Tim Wendelboe: год открытия, «мы ездим к ним каждый год», «мы публикуем, сколько платим»; Heart: дата обжарки и номер партии на каждой пачке. По-русски: «С 2019 года», «партия 5 кг», «на пачке дата обжарки» (если так и есть).
2. **Люди с биографией вместо «команды профессионалов».** Tim Wendelboe: “He was nineteen.” (https://timwendelboe.no/pages/our-story); Coava: основатель чинил мотоциклы, чтобы открыть дело (“bootstrapped the company by repairing motorcycles”, https://coavacoffee.com/our-story); Dark Woods: у каждого из трёх основателей по 2–4 предложения. По-русски: Аня и Дмитрий, раньше бариста; дополнительные факты (сколько лет, где работали) брать у клиента, не придумывать.
3. **Расписание как недельный цикл с порогом.** «Заказ до X, жарим Y, отправляем Z, выходные уходят в понедельник»: Heart, Coava, Gardelli, Ozone, Coffee Collective. По-русски: «Жарим по четвергам, по пятницам развозим по Минску. Заявка до [день, час] попадёт в ближайшую обжарку».
4. **Ближайшая дата, написанная датой.** Tim Wendelboe: две даты на карточке подписки; Gardelli: ближайшая обжарка в верхнем углу сайта; Coffee Collective: полоса в шапке «заказ до 13:00 уходит сегодня». По-русски: полоса вверху «Ближайшая обжарка: четверг, 22 октября. Заявки до среды, 18:00» (дата и час условные).
5. **Срок = обработка + дорога, без гарантий-обещаний.** Heart пишет формулу и считает пример; Square Mile и Ozone называют сроки ожидаемыми, не гарантированными. По-русски: «Жарим в четверг, привозим в пятницу. Если заявка пришла позже, поедет со следующей обжаркой».
6. **Неудобное прямо в тексте.** Tim Wendelboe: трек-номер приходит раньше посылки; Coava: невыкупленный самовывоз выбрасывают через 30 дней; La Cabra: не отправляют кофе старше 14 дней от обжарки; Counter Culture: “triple-check your address”; Heart: доставленное по трекингу не возмещают. По-русски: «Возврат зерна не принимаем: это еда. Если что-то не так, напишите, заменим».
7. **Объяснять странное число и «зачем просим».** Square Mile: откуда пачка 350 g; Ozone: зачем нужен телефон; Onyx: “Why was my card charged twice?”. По-русски: любое нестандартное число (размер пачки, порог доставки) и каждое поле формы одной фразой.
8. **Вопросы голосом клиента, ответ начинается с «да» или «нет».** Tim Wendelboe: “my package is not moving. What is happening?” (https://timwendelboe.no/pages/faq); Coava: “Yes!”, “Absolutely.”; Onyx: про двойное списание и про заказ “marked as delivered but it was not”. По-русски: «Можно смолоть? Нет, только зерно» (если это правда).
9. **Вкус: три слова плюс одна шкала или фраза.** См. 3в.
10. **Карточка «поле: значение».** Tim Wendelboe, La Cabra, Origin, Gardelli: страна, регион, высота, обработка, урожай, обжарка. На телефоне по одной паре на строку.
11. **Бытовые меры и сравнения.** Square Mile: пачка в чашках в день; Tim Wendelboe: подписка как журнал или Netflix; Heart: пропорция 1:16 и список из пяти условий хорошей чашки. По-русски: «Пачка 250 г это примерно [N] чашек фильтра» (N посчитать по дозе, которую рекомендуют основатели).
12. **Кнопка = действие плюс предмет или цена.** Tim Wendelboe: “Add to cart - 235 kr”; Square Mile: “Add 350g”; Counter Culture: “START A SUBSCRIPTION”. Расплывчатые глаголы “Discover” и “Explore” (Blue Bottle: “Explore Subscriptions”; Onyx: “Explore This Offering”) ничего не обещают. По-русски: «В корзину», «Выбрать», «Оформить подписку»; для потока «заявка» подпись под кнопкой, что будет дальше.
13. **Условия подписки блоком из 4–5 пунктов.** Что приходит, как часто, когда списывают, как поставить на паузу и отменить, до какого срока можно менять. Counter Culture (платёж в день отправки), Coffee Collective (платёж в понедельник, отправка в четверг), Origin (письмо за три дня до списания), Square Mile (после старта обжарки отмену не принимают).
14. **Честное «не подойдёт» и «этого не делаем».** Passenger: любите темнее, смотрите сестринский бренд; Heart не делит обжарку на light/medium/dark; Onyx не принимает возвраты кофе; Gardelli продаёт только зерно; Dark Woods: “we only ship within the UK”.
15. **Одна цифра, одно место.** Square Mile (доставка 1–3 и 2–3 дня), La Cabra (порог бесплатной доставки $79, $89, $99), Death Wish (гарантия 60 и 30 дней), Coava (отправка за 72 и 48 часов). Решение: числа живут в одном списке (расписание, порог, срок, цена), оттуда подставляются в первый экран, FAQ, форму и письмо.

Ещё две вещи, которые видны в выборке, но не вошли в пятнадцать:
- Ритм. В FAQ и условиях средняя длина предложения 13–18 слов, предложений длиннее 25 слов 5–14%. В «глянцевых» About их 35–44% (La Cabra 44%, Square Mile 43%, Death Wish 40%, Dark Woods 35%). Длинные фразы стоят в историях, короткие в условиях.
- Юмор. Коротко и конкретно (словарная шутка Coava, Louisa у Ozone) и не в условиях: у Ozone на странице доставки шуток нет вообще.

### 3б. Чем «громкие» бренды звучат иначе и что у них работает против доверия

Громкость бывает двух видов.
- Громкий характер (Death Wish): заглавные, каламбуры, клуб с мифологией (“Society of Strong Coffee”, “elite realm of caffeinators”; https://www.deathwishcoffee.com/pages/subscription), рубленые повторы (“That’s not a routine. That’s a surge.”; https://www.deathwishcoffee.com/products/power-surge-coffee), героический читатель.
- Глянцевая гладкость (Blue Bottle, но и абзацы Passenger, Ozone, Origin, La Cabra, Square Mile About): абстрактные существительные (intention, ritual, experience, craft), цепочки вроде “utmost care, consideration, and exacting standards” и “crafted for moments that matter” (оба на https://bluebottlecoffee.com/us/eng/our-story).

Что у них на месте фактов: кофеин в мг, сертификаты, награды, «#1» в заголовке страницы, “up to 100 days after roasting” (https://bluebottlecoffee.com/us/eng/FAQ). Чего не нашёл в прочитанных страницах: дня обжарки и расписания (Death Wish, Blue Bottle), имён ферм и высоты (Death Wish), понятного ответа на «когда приедет мой кофе».

Что работает против доверия:
1. Недоказуемые превосходные степени (#1 в заголовке страницы, “THE GREATEST COFFEE ON EARTH” как заголовок отзыва на главной Death Wish, “unparalleled” на главной Blue Bottle, “world-class” у Origin и Ozone). Читатель не может это проверить и считывает как рекламу.
2. Выдуманная иерархия (общество, элита, “ride or dies” на странице подписки Death Wish) на месте простой услуги. Подписка описана как вступление в клуб, а не как «что, когда и сколько».
3. Шутка там, где человек ищет условия: он должен расшифровать тон, чтобы добраться до смысла.
4. Противоречия в числах (гарантия 60 и 30 дней на одной странице). Мелочь, но она подрывает веру во все остальные цифры.
5. Взаимозаменяемость. Абзац про “moments that matter” подходит любому бренду; на этом держится ощущение «сгенерировано». Простой тест: подставьте название конкурента, и если текст остаётся верным, это глянец.
6. Скидки и «эксклюзивы» вместо описания услуги (30% на первую подписку, ранний доступ, “society-only benefits” на странице подписки Death Wish).

Нюанс: «тихие» бренды тоже срываются в глянец, но в определённых местах: About, промо подписки, текст приглашения на рассылку, описание цели бренда. Практический вывод для лендинга: проверять глянцем именно эти блоки.

Цифры (приложение А) показывают тот же контраст. Оценочные слова на 1000: у блоков «о бренде» 15–39 (Square Mile About 24, La Cabra About 22, Passenger Subscribe 39, Ozone About 27, Blue Bottle Story 59), у FAQ и доставки 0–4. Цифры на 1000: у FAQ и доставки обычно 15–40 (Square Mile FAQ 33, La Cabra Shipping 27, Tim Wendelboe FAQ 20, Heart FAQ 21), у блоков «о бренде» 1–13. Исключение в лучшую сторону: история Tim Wendelboe (0 оценочных слов, 38 цифр на 1000).

### 3в. Шаблоны описания вкуса без поэзии

Шаблоны, которые встретились (с примерами из выборки):
1. **Три слова.** Heart: “cherry, sweet cream, fudge” (https://www.heartroasters.com/products/stereo-seasonal-blend); Counter Culture: “molasses | cocoa | smooth” (https://counterculturecoffee.com/); Square Mile: “BLACKCURRANT / RHUBARB / SYRUPY” (https://shop.squaremilecoffee.com/products/chepsangor); Origin: “Stone Fruit, Caramel, Milk Chocolate” (https://www.origincoffee.co.uk/products/resolute); Blue Bottle: “Caramel, Vanilla, Orange Zest” (https://bluebottlecoffee.com/us/eng). Слова из быта (ягода, фрукт, шоколад, орех), не абстракции.
2. **Шкала со словом.** Origin: Acidity / Body / Finish: уровень плюс слово (“Medium, Stone-Fruit”). Death Wish: Aroma, Taste Profile, Acidity, Body, Aftertaste (https://www.deathwishcoffee.com/products/power-surge-coffee). Onyx: “Traditional to Modern Scale” с объяснением, какие вкусы на одном конце, какие на другом (https://onyxcoffeelab.com/pages/faq).
3. **Одна фраза «что в чашке, откуда, как обработан».** Tim Wendelboe: “A clean and expressive coffee with floral, citrus…” (https://timwendelboe.no/products/tatmara); La Cabra: “Crisp blackcurrant and fresh sugarcane in this returning favourite from…” (https://us.lacabra.com/products/karimikui).
4. **Бытовое сравнение или «с молоком».** Dark Woods: “Melts to rich caramel in milk”, “French toast on a summer's morning” (https://darkwoodscoffee.co.uk/); Passenger: что хорошо с молоком и сахаром (https://drinkpassenger.com/faqs).
5. **Две корзины для выбора.** Coava: Classic (шоколад, карамель, орехи) и Unique (фрукты, цветы, неожиданное), https://coavacoffee.com/subscription-faq. Для трёх сортов «Кварты» это уже готовая раскладка: орех и шоколад / карамель и яблоко / цветы и бергамот.
6. **«Если вам нравится X, берите Y».** Passenger FAQ: шоколад и жжёный сахар (Cusco, Montecarlos) против живой кислинки и фруктов (Divino Niño, африканские).
7. **Под что.** Gardelli: “Suggested for espresso and filter” (https://shop.gardellicoffee.com/coffees/836-kianyangi-kenya); в ТЗ у бразильского кофе «под эспрессо».

Что делать по-русски:
- Держать строку вкуса отдельным полем: «Вкус: цветочный, бергамот. Обжарка: светлая. Пачка: 250 г». В ТЗ вкус, обжарка и размер сливаются в одну строку; на карточке их стоит развести, как делает Tim Wendelboe.
- Не больше трёх слов вкуса; каждое слово из еды или природы. Не использовать: «богатый букет», «играет гранями», «бархатистый», «гармоничный баланс», «нотки» в плотных цепочках.
- «Кислотность» писать осторожно: по-русски это читается как дефект. Использовать «кислинка», «сочность» и одну поясняющую фразу («как в яблоке или ягодах, не как у кислого кофе»). Tim Wendelboe в FAQ разделяет «яркость» и «кислоту недожаренного».
- Слова вкуса для «Кварты» брать из ТЗ (цветочный, бергамот, карамель, красное яблоко, орех, шоколад). Если нужны дополнительные, подтвердить у обжарщиков; в выборке даже хорошие обжарки не придумывают вкусы «для красоты».
- Тот же глянец внутри хорошей карточки встречается у Gardelli (“vibrant and intensely expressive”, “pristine, juicy acidity”; https://shop.gardellicoffee.com/coffees/836-kianyangi-kenya): после трёх слов абзац прилагательных ничего не добавляет, его лучше не писать.

### 3г. Как честно и коротко писать про доставку, сроки, возврат, подписку

**Доставка и сроки** (порядок, который повторяется на хороших сайтах):
1. Первое предложение: когда жарим и когда отправляем (день недели плюс порог заказа). Heart: “Get your order in by 12pm PST on weekdays” (https://www.heartroasters.com/pages/shipping-returns); Coava и Gardelli: дни обжарки и порог.
2. Формула обработка плюс дорога, один пример на конкретных днях (Heart).
3. Что не гарантируем и что делаем при задержке (Square Mile: “delivery within 48 hours isn’t guaranteed”, а при задержке просят написать; Ozone: ждать 7 рабочих дней, потом писать).
4. Цена и порог бесплатной доставки в шапке сайта (Origin, Dark Woods, Coffee Collective, Gardelli).
5. Как узнает человек о статусе: письмо с трек-номером (Tim Wendelboe, Heart), письмо-напоминание перед каждым заказом подписки (Counter Culture), письмо за три дня до списания (Origin). У «Кварты» заявку обрабатывает менеджер по телефону: этот шаг и его срок нужно назвать так же ясно.
6. Объяснить, зачем нужны данные (Ozone: телефон).

**Свежесть:**
- Называть окно, а не «чем свежее, тем лучше»: Tim Wendelboe (“1 week after roasting to within 5 weeks”, лучше после 5–10 дней отдыха; /pages/faq), Heart (“about 7 days after roasting”, лучшее окно 7–30 дней; /pages/faq), La Cabra (“at least 10 days after the roast date”; /products/karimikui), Passenger (“2 weeks from the roast date”; /faqs), Square Mile (“within 3 months of its roast date”; /pages/faq), Blue Bottle (“up to 100 days after roasting”; /us/eng/FAQ). Адреса: https://timwendelboe.no, https://www.heartroasters.com, https://us.lacabra.com, https://drinkpassenger.com, https://shop.squaremilecoffee.com, https://bluebottlecoffee.com.
- Зерно «Кварты» приезжает на 1–3 день после обжарки. По данным выше это ещё период отдыха: честная фраза должна сказать, когда варить, например: «в первые дни зерно отдаёт газ; фильтру лучше [N] дней, эспрессо [M]». N и M взять у основателей; пока их нет, записать допущение в README, как разрешает ТЗ.
- Если на пачке стоит дата обжарки (Heart, Passenger, La Cabra), сказать об этом: это самый проверяемый признак свежести. Если не стоит, предложить поставить.
- «Свежеобжаренный» без даты ничего не сообщает. Даты и дни недели сообщают.

**Возврат.** Все крупные обжарки в выборке не принимают возврат кофе (Counter Culture: скоропортящийся продукт; Coava; Onyx; Heart: “cannot guarantee refunds”), но дают канал на случай проблемы. Структура, которую можно повторить:
1. Что не принимаем и почему, одной фразой (Counter Culture: “returns on coffee due to its perishable nature”, /pages/help-faq).
2. Что делаем, если проблема: заменим или вернём деньги, и в какой срок надо написать (Coava: 15 дней после статуса «доставлено»).
3. Что приложить (Coava: фото упаковки и повреждения).
4. Что точно не делаем (Heart: не возмещают заказ, который трекинг показывает как доставленный).
Юридическую формулировку возврата для Беларуси нужно сверить отдельно: в этом исследовании не охвачено.

**Подписка.** Блок из пяти пунктов:
1. Что приходит и как часто (у «Кварты» по ТЗ: 2 пачки по 250 г раз в месяц за 54 BYN, доставка бесплатно).
2. Какие сорта: выбор клиента или ротация, повторяются ли (Heart объясняет, как частота влияет на повторы; Counter Culture: ротация раз в две недели).
3. Когда списывают (Counter Culture: в день отправки; Coffee Collective: в понедельник, отправка в четверг).
4. Как поставить на паузу и отменить, с точным местом или контактом (Counter Culture: кнопка внизу справа на странице подписки) и до какого срока можно менять (Square Mile: до старта обжарки).
5. Что нельзя: подмена сортов (Heart), выбор кофе при ротации (Coffee Collective).
Без шуток и без «клуба». Если выгода есть, показать цифрами (Square Mile и Origin считают её); если нет, не называть подписку выгодной (см. 3ж).

### 3д. Как переносить на русский без кальки

В первой колонке либо дословная цитата из выборки (со ссылкой в разделе 2), либо пометка «типовое», если это обобщённая формулировка, а не цитата.

| Английский приём | Типичная калька | Что делать вместо этого |
|---|---|---|
| “Specialty coffee roasted to order & shipped to your door.” (Coava, https://coavacoffee.com/) | «Свежеобжаренный спешелти-кофе с доставкой прямо к вашей двери» | Факты ТЗ: «Жарим по четвергам, по пятницам привозим по Минску» |
| типовое: «We believe…», «We’re passionate about…» | «Мы верим, что каждая чашка…», «Мы увлечены качеством» | Не заявлять убеждение, показывать действие: «Партия 5 кг», «жарим по четвергам» |
| типовое: «Discover», «Explore», «Shop now» (Explore у Blue Bottle и Onyx) | «Откройте для себя», «Исследуйте», «Купить сейчас» | «Выбрать кофе», «В корзину»; в потоке «заявка» подпись под кнопкой, что будет дальше |
| типовое: повторяющееся «your» | «ваш кофе, ваш путь, ваша чашка» | «ваш» только там, где без него неясно; чаще убирать |
| “Pause, cancel or modify at anytime” (Origin) | «Приостановите, отмените или измените в любой момент» | «Пауза или отмена: позвоните или напишите менеджеру [как именно, уточнить]» |
| “Why 350g bags, you ask?” (Square Mile) | «Вы спросите, почему 350 г?» | «Почему пачка 250 г?» и одно предложение причины; ремарку «вы спросите» убрать |
| “Get the kettle on!” (Ozone) | «Ставьте чайник!» | Британская идиома про чай; убрать или придумать своё |
| типовое: «Orders are processed at 8:30» (страдательный залог; у Square Mile “processed daily at 8:30 AM UK time”, /pages/faq) | «Заказы обрабатываются с 8:30» | «С 8:30 берём заказы в работу» |
| типовое: «Sourcing directly…, roasting in small batches…, delivering…» | «Закупая напрямую…, обжаривая небольшими партиями…» | Три коротких предложения; вместо «небольшими» число: «Партия 5 кг» |
| типовое: «Delivery typically arrives within 1–3 days» | «Доставка осуществляется в течение 1–3 дней» | «Привозим через 1–3 дня после обжарки» (не «на 1–3 день») |
| типовое: «Acidity: medium» (у Origin “Medium, Stone-Fruit”) | «Умеренная кислотность» | «Кислинка средняя» и фраза, что это ягодная или яблочная, не кислый кофе |
| типовое: «Subscribe» | «Подписаться» (как на канал) | «Оформить подписку на кофе» и три строки «как это работает» |
| “Quality first. Always.” (Origin, https://www.origincoffee.co.uk/pages/story) | «Качество прежде всего. Всегда.» | Лозунг не заменяет условия; если нужен, то с числом |
| типовое: Title Case («Our Story») | «Наша История», «Как Это Работает» | Только первое слово с заглавной |

Где русский сам по себе хуже или ломается:
1. **Длина строки на телефоне.** Русские слова в среднем длиннее английских, а в строку на экране в 360 px влезает порядка 35–40 знаков (грубая прикидка для шрифта 16 px). Длинные существительные и цепочки родительных падежей («осуществление доставки заказов по городу Минску») разваливаются на строки хуже, чем английское «Delivery in Minsk».
2. **Числа и падежи.** «1 день, 2 дня, 5 дней», «на 1–3-й день» или «через 1–3 дня». Фраза «на 1–3 день» из ТЗ грамматически неловкая: писать «через 1–3 дня после обжарки». Любые счётчики в интерфейсе («2 пачки» и «5 пачек») надо собирать функцией склонения, а не вставкой числа в шаблон.
3. **Деепричастные цепочки** (английские «-ing»: «sourcing, roasting, delivering») по-русски превращаются в тяжёлые обороты. Нужны короткие предложения с глаголом.
4. **Пассив и канцелярит** («осуществляется», «производится», «в случае наличия»): по-русски они звучат официально и холодно. Активные глаголы с «мы» или безличные («привозим», «жарим») тёплее.
5. **Манифесты** («мы верим», «мы гордимся», «мы здесь, чтобы»): по-русски читаются как перевод корпоративного слогана. Тёплое звучание даёт конкретика и небольшое признание («мы тоже ошибаемся, если что, напишите»), а не восклицания.
6. **Термины.** «Спешелти», «каппинг», «экстракция», «дрип-пакет» читатель 25–45 может не знать. Один термин, одно пояснение в скобках. «Фильтр» и «эспрессо» тоже стоит пояснить одной фразой (для воронки, аэропресса, кемекса или для кофемашины).
7. **Слово «подписка».** Одно значение для канала и другое для кофе. Давать «как это работает» тремя строками.
8. **Юмор и идиомы не переносятся.** Шутка про «носки лучше цветов» или «чайник» держится на британском быте. Свой юмор допустим только короткий и в безопасных местах, не в условиях.
9. **Маркеры «сгенерировано» по-русски** (мои критерии, не из выборки): «это не просто X, а Y», тройки однородных членов («быстро, удобно, вкусно»), длинные тире там, где хватило бы запятой, «в мире, где…», вопрос-зачин («Хотите…?»), слова «идеальный», «уникальный», «погрузитесь», «тщательно отобранные», «с любовью к деталям», «Ключевые преимущества:». Самопроверка перед публикацией: в абзаце есть число, дата, имя или место? средняя длина предложения не больше 15–16 слов? предложений длиннее 25 слов не больше одного на абзац? можно ли подставить название конкурента?

### 3е. Формы и письма (микротексты)

Видно только публичное: подписи полей, подсказки, ошибки, строки согласия, описания писем. Самих писем не видел.

- Поле комментария к заказу в виде вопроса к клиенту: у Tim Wendelboe плейсхолдер “Anything we should know about your order?” (https://timwendelboe.no/).
- Приглашение на рассылку говорит, что именно придёт: La Cabra (“coffee releases, local events and selected online offers”, https://us.lacabra.com/), Onyx (“weekly release newsletter”, https://onyxcoffeelab.com/), Gardelli (“You will be able to unsubscribe at anytime”, https://shop.gardellicoffee.com/).
- Объяснение, зачем поле: Ozone, “Why Do We Ask for Your Phone Number?” (https://ozonecoffee.co.uk/policies/shipping-policy).
- Строка согласия на списания у Heart формальная и длинная (в ней “authorize you to charge my payment method”, https://www.heartroasters.com/products/roasters-choice-subscription): образец обязательного юридического текста, который лучше выносить в мелкий шрифт под кнопку.
- Ошибка без совета (Coffee Collective): “Something went wrong, please try again later” (https://coffeecollective.dk/pages/collective-subscription). Не повторять: после неудачной отправки сказать, что делать (позвонить, написать, повторить).
- Описания писем: у Tim Wendelboe письмо с трек-номером приходит раньше посылки (и это объяснено в FAQ); у Counter Culture письмо-напоминание перед каждым заказом; у Origin письмо за три дня до списания; у Onyx подтверждение иногда попадает в спам или приходит как SMS (и это объяснено в FAQ).

Применительно к форме «Кварты» (иллюстрации приёма, не финальный текст): подсказка у телефона «Нужен, чтобы перезвонить и подтвердить заказ»; ошибка номера «Проверьте номер: нужен белорусский, например +375 29 123-45-67» (что не так и пример); ошибка отправки «Не получилось отправить. Позвоните [номер] или попробуйте ещё раз»; повтор в течение 10 минут «Заявка уже у нас, перезвоним на этот номер»; после отправки «Заявка принята. Перезвоним [когда, уточнить]». Согласие на обработку персональных данных, вероятно, потребуется; формулировку надо проверить отдельно (вне выборки).

### 3ж. Что из этого применимо к «Кварте» и чего не хватает в ТЗ

Факты из ТЗ, на которые можно опереться (прочитано в brief): с 2019 года; партии по 5 кг; Аня и Дмитрий, раньше бариста; жарят по четвергам, по пятницам развозят по Минску; зерно приходит на 1–3 день; Эфиопия Иргачеффе 32 BYN (цветочный, бергамот, светлая обжарка, 250 г), Колумбия Уила 29 BYN (карамель, красное яблоко, 250 г), Бразилия Серрадо 26 BYN (орех, шоколад, под эспрессо, 250 г); дрип-пакеты ассорти, 10 штук, 18 BYN; подписка 54 BYN в месяц (2 пачки по 250 г раз в месяц, доставка бесплатно); самовывоз: Минск, ул. Короля, 9, пн–пт 8:00–20:00, сб–вс 10:00–18:00; доставка по Минску в пятницу, от 50 BYN бесплатно; заявка, менеджер перезванивает, корзины и оплаты нет.

Иллюстрации приёма (не готовый текст): полоса в шапке «Жарим по четвергам · по пятницам везём по Минску · от 50 BYN бесплатно» (шапки такого типа у Tim Wendelboe, Coffee Collective, Gardelli, Origin). Порог 50 BYN можно перевести на язык покупателя: любые две пачки уже дают 52 BYN и больше (26 + 26 = 52), а пачка 32 BYN плюс дрип-пакеты 18 BYN ровно 50.

Чего в ТЗ нет, а хорошие сайты это всегда называют (уточнить у «клиента» или записать допущением в README):
1. До какого дня и часа заявка попадает в ближайшую обжарку (порог).
2. Стоит ли дата обжарки на пачке.
3. Окно «когда лучше варить» (отдых после обжарки) для фильтра и эспрессо.
4. Что значит «1–3 день»: пятничная доставка после четверговой обжарки это 1-й день, а как считать самовывоз и более поздние дни?
5. Какие сорта входят в подписку: выбор клиента или ротация, повторяются ли. Выгоду подписки называть только после этого: две пачки по отдельности стоят от 52 до 64 BYN, а подписка 54 BYN; доставка бесплатна и так при заказе от 50 BYN.
6. Как приостановить и отменить подписку (позвонить, написать), как оплачивать (оплаты онлайн нет).
7. Что с заменой или возвратом, если проблема с кофе.
8. Когда перезвонит менеджер.
9. Можно ли молоть (в выборке почти все продают только зерно).
10. Время и окно доставки, стоимость до 50 BYN.

## Приложение А. Цифры по страницам

Метод: видимый текст страницы без меню и подвала, строки короче 8 слов отброшены, предложения делятся по точке, вопросительному и восклицательному знакам. «Глянец» = слова из моего списка (ниже) на 1000 слов; цифры = слова с цифрой на 1000 слов. Показывает направление, не статистическую значимость: одна страница на тип, список слов мой, слово experience бывает нейтральным, в истории Onyx список наград искажает цифры и длину предложения.

| Страница | Слов | Глянец на 1000 | Цифр на 1000 | Ср. длина предл. | Доля >25 слов |
|---|---|---|---|---|---|
| Tim Wendelboe: история | 584 | 0,0 | 37,7 | 16,5 | 17% |
| Tim Wendelboe: FAQ | 1780 | 1,1 | 20,2 | 18,4 | 14% |
| Square Mile: About | 492 | 24,4 | 8,1 | 21,4 | 43% |
| Square Mile: FAQ | 1659 | 0,6 | 33,2 | 16,7 | 10% |
| La Cabra: About | 770 | 22,1 | 3,9 | 24,1 | 44% |
| La Cabra: Shipping | 256 | 0,0 | 27,3 | 14,2 | 6% |
| Heart: About | 699 | 5,7 | 7,2 | 16,5 | 5% |
| Heart: FAQ | 812 | 0,0 | 20,9 | 14,5 | 9% |
| Coava: история | 548 | 14,6 | 3,6 | 19,6 | 25% |
| Coava: FAQ подписки | 1216 | 2,5 | 15,6 | 15,3 | 5% |
| Onyx: история | 1226 | 4,9 | 38,3 (награды) | 13,0 | 10% |
| Onyx: FAQ | 2434 | 0,4 | 9,0 | 15,5 | 9% |
| Counter Culture: history | 1065 | 1,9 | 9,4 | 18,6 | 12% |
| Counter Culture: FAQ | 3312 | 3,6 | 7,2 | 15,5 | 11% |
| Dark Woods: About | 760 | 3,9 | 13,2 | 24,6 | 35% |
| Dark Woods: Delivery | 433 | 0,0 | 25,4 | 19,6 | 36% |
| Origin: Story | 657 | 15,2 | 3,0 | 14,1 | 13% |
| Origin: карточка подписки | 837 | 7,2 | 39,4 | 12,9 | 6% |
| Passenger: Our Story | 333 | 27,0 | 18,0 | 17,4 | 21% |
| Passenger: FAQ | 2116 | 1,9 | 6,6 | 18,6 | 22% |
| Passenger: Subscribe | 387 | 38,8 | 10,3 | 12,1 | 6% |
| Ozone: About | 411 | 26,8 | 12,2 | 17,2 | 17% |
| Ozone: Shipping | 1524 | 0,7 | 19,0 | 16,9 | 12% |
| Coffee Collective: подписка | 464 | 19,4 | 12,9 | 14,9 | 10% |
| Death Wish: About | 340 | 8,8 | 8,8 | 22,6 | 40% |
| Death Wish: Help | 1403 | 0,7 | 17,8 | 17,9 | 19% |
| Blue Bottle: Our Story | 826 | 59,3 | 1,2 | 20,3 | 27% |
| Blue Bottle: FAQ | 1223 | 9,0 | 6,5 | не считал | не считал |

Замечание про Death Wish: громкость этого бренда в другом регистре (заглавные, каламбуры, клуб), поэтому по списку «глянцевых» слов он выглядит скромнее, чем звучит. Восклицательные знаки на 1000 слов: Ozone (FAQ подписки) 31; Onyx FAQ 6; Coava FAQ 6; Gardelli FAQ 5; у Tim Wendelboe, La Cabra, Origin и Passenger (прочитанные страницы) 0.

## Приложение Б. Итог проверки цитат

Программно сверено 266 английских фрагментов в кавычках “ ” с текстом страниц (64 страницы, все открылись, HTTP 200): не найдено 5, из них 2 подписи кнопок Ozone (“Start a subscription”, “Start your In My Mug journey”) подтверждены отдельно на главной https://ozonecoffee.co.uk/, и 3 фрагмента Blue Bottle (“Explore Subscriptions”, “unparalleled”, “moments that matter”) подтверждены в браузере. Цитат длиннее 10 слов нет. Все остальные фрагменты Blue Bottle (32 строки) тоже сверены в браузере на страницах /us/eng, /us/eng/our-story, /us/eng/FAQ. Тексты на сайтах меняются; сверка сделана 17 октября 2026.

Список слов «глянца»: exceptional(ly), extraordinary, unparalleled, world-class, finest, experience(s), journey, crafted, craft, craftsmanship, curated, elevate, seamless(ly), thoughtful(ly), intention(al/ally), passion(ate), premium, delicious(ly), delight(s/ful/ed), ritual(s), meticulous(ly), perfect(ly), perfection, obsess(ed/ion/ing), relentless(ly), uncompromising, excellence, remarkable, stunning, exquisite, bliss, magical, essence, elegant(ly), artful, artisanal.
