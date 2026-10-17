// Структурный и словарный линтер текста «Кварты».
// node lint2.js [deck.json] [linter-spec.json]
const fs = require('fs');
const path = require('path');
const deckPath = process.argv[2] || path.join(__dirname, 'deck-v2.json');
const specPath = process.argv[3] || path.join(__dirname, 'linter-spec.json');
const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
const slots = deck.slots;
const out = [];
const warn = (id, kind, msg) => out.push({ id, kind, msg });
const clean = (s) => s.replace(/ /g, ' ');

// Unicode-aware границы слова: B(...) оборачивает шаблон
const B = (src, extra) => new RegExp('(?<![\\p{L}\\p{N}])(?:' + src + ')(?![\\p{L}\\p{N}])', 'iu' + (extra || ''));
const P = (src) => new RegExp(src, 'iu'); // подстрока без границ

// 1. бюджеты длины
for (const s of slots) {
  const t = clean(s.text);
  if (s.max && t.length > s.max) warn(s.id, 'длина', t.length + ' > ' + s.max);
}

// 2. знаки
let dashTotal = 0;
for (const s of slots) {
  const t = clean(s.text);
  const n = (t.match(/—/g) || []).length;
  dashTotal += n;
  if (n) warn(s.id, 'тире', 'длинное тире: ' + n);
  if (/!/.test(t)) warn(s.id, 'знак', 'восклицательный знак');
  if (/\?/.test(t)) warn(s.id, 'знак', 'вопросительный знак (проверь: не крючок ли)');
  if (/\.\.\.|…/.test(t)) warn(s.id, 'знак', 'многоточие');
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(t)) warn(s.id, 'знак', 'эмодзи');
  if (/\s[-–]\s/.test(t) && !/\d\s[–-]\s\d/.test(t)) warn(s.id, 'тире', 'тире-связка с пробелами');
}

// 3. словарь
const STOP = [
  P('уникальн'), P('премиальн'), P('эксклюзивн'), P('идеальн'), P('настоящ'), P('истинн'), P('подлинн'), B('живо[йеа]я?'),
  P('ритуал'), P('магия|магическ'), B('душ[аеуиой]'), B('истори[яиейю]'), P('атмосфер'), P('погруз'), P('вдохнов'),
  P('страст'), P('мастерств'), B('подход(ом|у|а|ы|ов)?'), B('опыт\\p{L}*'), P('забот'), B('ритм\\p{L}*'), P('философ'), P('секрет'),
  P('бережн'), P('тщательн'), P('гармони'), P('симфони'), B('букет\\p{L}*'), P('нюанс'), B('уют\\p{L}*'), P('бодрящ'),
  P('утончённ'), P('изыскан'), P('ценител'), P('наслажд'), P('насладит'), P('откройте для себя'), P('в мире,? где'),
  P('важно отметить'), P('не просто'), P('не только'), P('это не\\s'), P('представьте'), P('добро пожаловать'),
  P('по-настоящему'), P('по-честному'), P('без пафоса'), P('просто и честно'), B('является'), P('осуществля'),
  B('данн(ый|ая|ое|ые|ого|ому)'), B('позволяет'), P('в рамках'), P('каждый глоток'), P('с любовью'), P('от плантации до чашки'),
  P('первоклассн'), P('высококачествен'), B('менеджер\\p{L}*'), B('курьер\\p{L}*'), P('оформит'), P('оформл')
];
for (const s of slots) {
  const t = clean(s.text);
  for (const re of STOP) { const m = t.match(re); if (m) warn(s.id, 'слово', String(re).slice(0, 40) + ' → «' + m[0] + '»'); }
}

// 4. ритм
function sentences(t) { return clean(t).split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean); }
const words = (t) => (clean(t).match(/[\p{L}\p{N}][\p{L}\p{N}\-–]*/gu) || []);
const allLens = [];
const paraRe = /(\.p\d?$|\.lead$|\.intro$|\.blurb$|\.li2$|\.nn$)/;
for (const s of slots) {
  if (!paraRe.test(s.id)) continue;
  const ss = sentences(s.text);
  const lens = ss.map((x) => words(x).length);
  lens.forEach((n) => allLens.push(n));
  let run = 0;
  for (const n of lens) { run = n <= 6 ? run + 1 : 0; if (run >= 3) { warn(s.id, 'ритм', 'три коротких предложения подряд'); break; } }
  if (ss.length === 2 && lens.every((n) => n <= 6)) warn(s.id, 'ритм', 'два коротких обрубка подряд');
}
const mean = allLens.reduce((a, b) => a + b, 0) / (allLens.length || 1);
const sd = Math.sqrt(allLens.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (allLens.length || 1));
const short = allLens.filter((n) => n <= 8).length / (allLens.length || 1);

// 5. частоты фактов
const joined = slots.map((s) => clean(s.text)).join('\n');
const FACTS = {
  '5 кг': /5 кг/g, '1–3': /1–3/g, 'четверг': /четверг/gi, 'пятниц': /пятниц/gi, 'Короля': /Короля/g,
  'перезвон/звон': /(пере)?звон/gi, 'заявк': /заявк/gi, 'пачк': /пачк/gi, 'доставк': /доставк/gi, '50 BYN': /50 BYN/g,
  '2019': /2019/g, 'кофе': /кофе/gi,
  'вы/ваш': B('вы|вас|вам|вами|ваш\\p{L}*', 'g'), 'мы/наш': B('мы|нас|нам|нами|наш\\p{L}*', 'g')
};
const factCount = {};
for (const k in FACTS) factCount[k] = (joined.match(FACTS[k]) || []).length;

// 6. повторяющиеся трёхсловные куски между слотами
const shingles = new Map();
for (const s of slots) {
  if (s.status === 'ui' && /\.(aria|label)/.test(s.id)) continue;
  const w = words(s.text).map((x) => x.toLowerCase());
  const seen = new Set();
  for (let i = 0; i + 3 <= w.length; i++) {
    const sh = w.slice(i, i + 3).join(' ');
    if (seen.has(sh)) continue; seen.add(sh);
    if (!shingles.has(sh)) shingles.set(sh, []);
    shingles.get(sh).push(s.id);
  }
}
const dups = [...shingles.entries()].filter(([, v]) => v.length >= 2);

// 7. регулярки из спецификации агента (если есть)
let specHits = 0, specRules = 0;
if (fs.existsSync(specPath)) {
  try {
    const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
    const rules = Array.isArray(spec) ? spec : (spec.rules || []);
    for (const r of rules) {
      let re; try { re = new RegExp(r.pattern, r.flags || 'u'); } catch (e) { continue; }
      specRules++;
      for (const s of slots) {
        if (s.status === 'placeholder') continue;
        if (re.test(clean(s.text))) { specHits++; warn(s.id, 'spec:' + (r.severity || '?'), (r.id || '') + ' ' + (r.message || '')); }
      }
    }
  } catch (e) { out.push({ id: '-', kind: 'spec', msg: 'не удалось прочитать спецификацию: ' + e.message }); }
}

console.log('Слотов:', slots.length, '| знаков:', slots.reduce((a, s) => a + clean(s.text).length, 0));
console.log('Длинных тире (—):', dashTotal);
console.log('Предложений в абзацах:', allLens.length, '| среднее слов:', mean.toFixed(1), '| sd:', sd.toFixed(1), '| доля ≤8 слов:', Math.round(short * 100) + '%');
console.log('Частоты:', JSON.stringify(factCount));
console.log('Повторяющиеся трёхсловные куски (между слотами):');
dups.forEach(([sh, ids]) => console.log('  «' + sh + '» → ' + ids.join(', ')));
console.log('Правил из спецификации:', specRules, '| срабатываний:', specHits);
console.log('--- замечания (' + out.length + ') ---');
out.forEach((o) => console.log('[' + o.kind + '] ' + o.id + ': ' + o.msg));
