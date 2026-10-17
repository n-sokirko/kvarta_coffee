// Применяет текст из deck-v2.json к странице Main.dc.html (базовая версия v10).
// node apply-copy.js <base.html> <deck.json> <out.html>
const fs = require('fs');
const [base, deckPath, outPath] = process.argv.slice(2);
let html = fs.readFileSync(base, 'utf8');
const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
const slots = {};
deck.slots.forEach((s) => { slots[s.id] = s; });
const NB = ' ';

function nb(t) {
  return t
    .replace(/(\d) (кг|г|BYN|штук[а-я]*|мес)(?![\p{L}])/gu, '$1' + NB + '$2')
    .replace(/(\d) (дня|дней|день)(?![\p{L}])/gu, '$1' + NB + '$2')
    .replace(/(?<=^|[\s(«"])(в|к|с|у|о|и|а|на|по|до|за|из|от|не|ни|но|для|при|над|под|без|про|об|во|со)[ ]+(?=[\p{L}\p{N}«"(])/giu, (m, p) => p + NB)
    .replace(/ул\. /g, 'ул.' + NB)
    .replace(/Короля, 9/g, 'Короля,' + NB + '9')
    .replace(/ \/ /g, NB + '/' + NB);
}
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const T = (id) => { if (!slots[id]) throw new Error('нет слота ' + id); return nb(esc(slots[id].text)); };
const has = (id) => !!slots[id];

function replaceBlock(openRe, closeTag, newHtml) {
  const i = html.search(openRe);
  if (i < 0) throw new Error('нет якоря ' + openRe);
  const j = html.indexOf(closeTag, i);
  if (j < 0) throw new Error('нет закрытия ' + closeTag);
  html = html.slice(0, i) + newHtml + html.slice(j + closeTag.length);
}
function replaceOnce(oldS, newS) {
  const n = html.split(oldS).length - 1;
  if (n !== 1) throw new Error('ожидалась 1 замена, найдено ' + n + ': ' + oldS.slice(0, 60));
  html = html.replace(oldS, () => newS);
}

// title
replaceOnce('<title>Кварта — обжарка в Минске</title>', '<title>' + esc(slots['head.title'].text) + '</title>');

// header
replaceBlock(/<header class="hd">/, '</header>', `<header class="hd">
  <div class="wrap hd-in">
    <a class="logo" href="#top" aria-label="${esc(slots['hd.logo.aria'].text)}">
      <svg width="20" height="25" viewBox="0 0 24 30" aria-hidden="true"><ellipse cx="12" cy="15" rx="10.5" ry="13.5" fill="currentColor"/><path d="M12 2.5 C17 9 7 12 12 15 S17 21 12 27.5" fill="none" stroke="#f3eee5" stroke-width="2.4" stroke-linecap="round"/></svg>
      <span>Кварта</span>
    </a>
    <nav class="nav" aria-label="Разделы">
      <a href="#coffee">${T('hd.nav.coffee')}</a>
      <a href="#delivery">${T('hd.nav.delivery')}</a>
      <a href="#subscription">${T('hd.nav.sub')}</a>
      <a href="#about">${T('hd.nav.about')}</a>
    </nav>
    <a class="btn btn-s" href="#lead">${T('hd.btn')}</a>
  </div>
</header>`);

// hero
const stampParts = slots['hero.stamp'].text.split(' ');
const stampHtml = nb(stampParts[0] + '<br>' + stampParts.slice(1).join(' ')).replace('<br>', '<br>');
replaceBlock(/<section class="hero" id="top">/, '</section>', `<section class="hero" id="top">
  <div class="wrap hero-in">
    <div class="hero-copy">
      <p class="mono kick">${T('hero.kick')}</p>
      <h1>${T('hero.h1')}</h1>
      <p class="lead">${T('hero.lead')}</p>
      <div class="cta-row">
        <a class="btn" href="#lead">${T('hero.btn1')}</a>
        <a class="btn btn-o" href="#coffee">${T('hero.btn2')}</a>
      </div>
    </div>
    <div class="hero-art" aria-hidden="true">
      <canvas class="cv cv-hero"></canvas>
      <div class="stamp5">${stampHtml}</div>
    </div>
  </div>
</section>`);

// сцены
function steps(prefix) {
  let out = '';
  for (let k = 1; k <= 4; k++) {
    const h = prefix + '.' + k + '.h', p = prefix + '.' + k + '.p';
    out += `      <div class="st s${k}">
        <div class="sn" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
        <h2>${T(h)}</h2>${has(p) ? `
        <p class="b">${T(p)}</p>` : ''}
      </div>
`;
  }
  return out.replace(/\n$/, '');
}
replaceBlock(/<section class="scene sA"/, '</section>', `<section class="scene sA" id="story" data-scene="bean" data-step="1" aria-label="${esc(slots['sA.aria'].text)}">
  <div class="stage">
    <div class="grain gl"></div>
    <div class="art" aria-hidden="true">
      <canvas class="cv cv-a"></canvas>
    </div>
    <div class="copy">
${steps('sA')}
    </div>
  </div>
</section>`);
replaceBlock(/<section class="scene sB"/, '</section>', `<section class="scene sB" id="delivery" data-scene="delivery" data-step="1" aria-label="${esc(slots['sB.aria'].text)}">
  <div class="stage">
    <div class="grain gl"></div>
    <div class="art" aria-hidden="true">
      <canvas class="cv cv-b"></canvas>
    </div>
    <div class="copy">
${steps('sB')}
    </div>
  </div>
</section>`);

// свежесть
const bigParts = T('fresh.big');
replaceBlock(/<section class="fresh">/, '</section>', `<section class="fresh">
  <div class="wrap">
    <div class="fresh-in">
      <div>
        <p class="big">${bigParts}<small>${T('fresh.small')}</small></p>
      </div>
      <div>
        <h2>${T('fresh.h')}</h2>
        <p>${T('fresh.p1')}</p>${has('fresh.p2') ? `
        <p>${T('fresh.p2')}</p>` : ''}
      </div>
    </div>
    <div class="week" role="list" aria-label="Наша неделя">
      <div class="day" role="listitem"><b>пн</b><span></span></div>
      <div class="day" role="listitem"><b>вт</b><span></span></div>
      <div class="day" role="listitem"><b>ср</b><span></span></div>
      <div class="day t" role="listitem"><b>чт</b><span>${T('fresh.week.t')}</span></div>
      <div class="day f" role="listitem"><b>пт</b><span>${T('fresh.week.f')}</span></div>
      <div class="day" role="listitem"><b>сб</b><span></span></div>
      <div class="day" role="listitem"><b>вс</b><span></span></div>
    </div>
  </div>
</section>`);

// ассортимент: заголовок и вступление
replaceOnce('<h2>Три кофе по 250 г и дрип-пакеты</h2>', '<h2>' + T('shop.h') + '</h2>');
replaceOnce('<p class="intro">Не знаете, что выбрать, напишите об этом в заявке, и менеджер подскажет.</p>', '<p class="intro">' + T('shop.intro') + '</p>');
replaceOnce('<a class="btn" href="#lead" onClick="{{pickOrder}}">Оставить заявку</a>', '<a class="btn" href="#lead" onClick="{{pickOrder}}">' + T('shop.btn') + '</a>');

// подписка
replaceBlock(/<section class="sub" id="subscription">/, '</section>', `<section class="sub" id="subscription">
  <div class="wrap">
    <div class="tag">
      <div>
        <h2 style="margin: 0 0 14px">${T('sub.h')}</h2>
        <p class="price">54 <small>${T('sub.price').replace(/^54[^\p{L}]*/u, '')}</small></p>
      </div>
      <div style="display: grid; gap: 18px">
        <ul>
          <li>${T('sub.li1')}</li>
          <li>${T('sub.li2')}</li>
        </ul>
        <div><a class="btn" style="background: var(--ink); border-color: var(--ink); color: var(--cream)" href="#lead" onClick="{{pickSub}}">${T('sub.btn')}</a></div>
      </div>
    </div>
  </div>
</section>`);

// как получить
function li(ids) { const r = ids.filter(has).map((id) => '            <li>' + T(id) + '</li>').join('\n'); return r ? '          <ul>\n' + r + '\n          </ul>' : ''; }
replaceBlock(/<section class="meth">/, '</section>', `<section class="meth">
  <div class="wrap">
    <h2>${T('meth.h')}</h2>
    <div class="board">
      <div class="bo">
        <p class="when">${T('meth.1.when')}</p>
        <div>
          <h3>${T('meth.1.h')}</h3>
          <p class="hl">${T('meth.1.hl')}</p>
        </div>
        <div>
${li(['meth.1.li1', 'meth.1.li2', 'meth.1.li3'])}${has('meth.1.nn') ? `
          <p class="nn">${T('meth.1.nn')}</p>` : ''}
        </div>
      </div>
      <div class="bo">
        <p class="when">${T('meth.2.when')}</p>
        <div>
          <h3>${T('meth.2.h')}</h3>
          <p class="hl">${T('meth.2.hl')}</p>
        </div>
        <div>
${li(['meth.2.li1', 'meth.2.li2', 'meth.2.li3'])}${has('meth.2.nn') ? `
          <p class="nn">${T('meth.2.nn')}</p>` : ''}
        </div>
      </div>
    </div>
  </div>
</section>`);

// о нас
replaceBlock(/<section class="about" id="about">/, '</section>', `<section class="about" id="about">
  <div class="wrap about-in">
    <div>
      <h2 style="margin-bottom: 20px">${T('about.h')}</h2>
      <p>${T('about.p')}</p>${has('about.p2') ? `
      <p>${T('about.p2')}</p>` : ''}
    </div>
    <div class="seal" aria-hidden="true"><div><b>${T('about.seal.b')}</b>${T('about.seal.t')}</div></div>
  </div>
</section>`);

// заявка и контакты
replaceBlock(/<section class="lead2" id="lead">/, '</section>', `<section class="lead2" id="lead">
  <div class="wrap lead-in">
    <div>
      <h2>${T('lead.h')}</h2>
      <p class="intro">${T('lead.intro')}</p>
      <div class="ct">
        <div><b>Адрес</b><p>${T('lead.ct.addr')}</p></div>
        <div><b>Часы</b><p>${T('lead.ct.hours1')}</p><p>${T('lead.ct.hours2')}</p></div>
        <div><b>Телефон</b><p>${T('lead.ct.phone')}</p></div>
      </div>
    </div>
    <div>
      <sc-if value="{{showForm}}" hint-placeholder-val="{{ true }}">
        <form class="form" novalidate onSubmit="{{submit}}">
          <div class="fld {{f.nameBad}}">
            <label for="f-name">${T('form.name.label')}</label>
            <input id="f-name" type="text" autocomplete="given-name" placeholder="${esc(slots['form.name.ph'].text)}" value="{{f.name}}" onChange="{{setName}}" aria-describedby="e-name">
            <sc-if value="{{f.errName}}" hint-placeholder-val="{{ false }}"><p class="err" id="e-name">${T('form.name.err')}</p></sc-if>
          </div>
          <div class="fld {{f.phoneBad}}">
            <label for="f-phone">${T('form.phone.label')}</label>
            <input id="f-phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="${esc(slots['form.phone.ph'].text)}" value="{{f.phone}}" onChange="{{setPhone}}" aria-describedby="h-phone">
            <p class="hint" id="h-phone">${T('form.phone.hint')}</p>
            <p class="err" role="alert">{{f.errPhone}}</p>
          </div>
          <fieldset class="fld {{f.interestBad}}">
            <legend>${T('form.interest.legend')}</legend>
            <div class="chips">
              <sc-for list="{{interests}}" as="o" hint-placeholder-count="3">
                <label class="chip"><input type="radio" name="interest" value="{{o.id}}" checked="{{o.checked}}" onChange="{{o.pick}}"><span>{{o.label}}</span></label>
              </sc-for>
            </div>
            <sc-if value="{{f.errInterest}}" hint-placeholder-val="{{ false }}"><p class="err">${T('form.interest.err')}</p></sc-if>
          </fieldset>
          <div class="fld">
            <label for="f-comment">${T('form.comment.label')}</label>
            <textarea id="f-comment" placeholder="${esc(slots['form.comment.ph'].text)}" value="{{f.comment}}" onChange="{{setComment}}"></textarea>
          </div>
          <sc-if value="{{f.failed}}" hint-placeholder-val="{{ false }}">
            <div class="msg fail" role="alert"><b>${T('form.fail.b')}</b><p>${T('form.fail.p')}</p></div>
          </sc-if>
          <button class="btn" type="submit" disabled="{{f.sending}}">{{f.submitLabel}}</button>
        </form>
      </sc-if>
      <sc-if value="{{showOk}}" hint-placeholder-val="{{ false }}">
        <div class="form">
          <div class="msg ok" role="status"><b>${T('form.ok.b')}</b><p>${T('form.ok.p')}</p></div>
          <button type="button" class="again" onClick="{{again}}">${T('form.ok.again')}</button>
        </div>
      </sc-if>
      <sc-if value="{{showDup}}" hint-placeholder-val="{{ false }}">
        <div class="form">
          <div class="msg" role="status"><b>${T('form.dup.b')}</b><p>${T('form.dup.p')}</p></div>
          <button type="button" class="again" onClick="{{again}}">${T('form.dup.back')}</button>
        </div>
      </sc-if>
    </div>
  </div>
</section>`);

// подвал
replaceBlock(/<footer class="ft">/, '</footer>', `<footer class="ft">
  <div class="wrap ft-in">
    <p>${T('ft.copy')}</p>
  </div>
</footer>`);

// скрипт: ассортимент
const TINT = { ethiopia: '#c28a46', colombia: '#8f5a2c', brazil: '#4d2b19', drip: '#9a6a38' };
const SORTS = [['ethiopia', 'eth', '250 г', '32 BYN'], ['colombia', 'col', '250 г', '29 BYN'], ['brazil', 'bra', '250 г', '26 BYN'], ['drip', 'drip', slots['shop.drip.notes'].text, '18 BYN']];
const js = (t) => "'" + nb(t).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
let coffees = 'var COFFEES = [\n';
SORTS.forEach(([id, k, weight, price]) => {
  const notes = slots['shop.' + k + '.notes'].text;
  const name = slots['shop.' + k + '.name'].text;
  coffees += `  { id: '${id}', name: ${js(name)}, notes: ${js(notes)}, weight: ${js(weight)}, price: ${js(price)}, tint: '${TINT[id]}', words: ${js(slots['shop.' + k + '.words'].text)}, blurb: ${js(slots['shop.' + k + '.blurb'].text)} },\n`;
});
coffees += '];';
{
  const i = html.indexOf('var COFFEES = [');
  const j = html.indexOf('\n];', i);
  if (i < 0 || j < 0) throw new Error('нет COFFEES');
  html = html.slice(0, i) + coffees + html.slice(j + 3);
}

// скрипт: сообщения об ошибках телефона по причинам
const errBlockOld = `        if (!ph.ok) {
          errPhone = ph.reason === 'empty' ? 'Укажите телефон, чтобы менеджер мог перезвонить.'
            : 'Номер не распознался. Нужен белорусский, например +375 29 123-45-67.';
        }`;
replaceOnce(errBlockOld, `        if (!ph.ok) errPhone = PHONE_ERR[ph.reason] || PHONE_ERR.format;`);
const phoneErr = `var PHONE_ERR = {
  empty: ${js(slots['form.phone.err.empty'].text)},
  format: ${js(slots['form.phone.err.format'].text)},
  country: ${js(slots['form.phone.err.country'].text)},
  length: ${js(slots['form.phone.err.length'].text)},
  code: ${js(slots['form.phone.err.code'].text)},
};

`;
replaceOnce('var COFFEES = [', phoneErr + 'var COFFEES = [');

replaceOnce('.prev .bl2 { font-size: 17px;','.prev .bl2:empty { display: none; }\n.prev .bl2 { font-size: 17px;');
fs.writeFileSync(outPath, html);
console.log('записано', outPath, html.length, 'знаков');
