// Проверка POST /api/lead против запущенного сервера: BASE=http://localhost:3000 node test/lead-api.test.mjs
import assert from 'node:assert/strict';

const BASE = process.env.BASE || 'http://localhost:3000';
const post = (body) =>
  fetch(BASE + '/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(async (r) => ({ status: r.status, json: await r.json() }));

const rnd = () => String(1000000 + Math.floor(Math.random() * 8999999)); // 7 цифр абонента
const base = (phone) => ({ name: 'Тест', phone, interest: 'order', comment: 'проверка', items: [{ id: 'ethiopia', qty: 2 }, { id: 'drip', qty: 1 }], source: { utm_source: 'instagram', utm_campaign: 'autumn', utm_content: 'banner-2', landing: '/?utm_source=instagram' } });

// 1. неверный номер не принимается, причина названа
let r = await post(base('+7 916 123-45-67'));
assert.equal(r.status, 422); assert.equal(r.json.field, 'phone'); assert.equal(r.json.reason, 'country');
r = await post(base('+375 29 123'));
assert.equal(r.status, 422); assert.equal(r.json.reason, 'length');
r = await post(base('+375 (99) 123-45-67'));
assert.equal(r.status, 422); assert.equal(r.json.reason, 'code');
r = await post({ ...base('+375 29 123-45-67'), name: '  ' });
assert.equal(r.status, 422); assert.equal(r.json.field, 'name');
r = await post({ ...base('+375 29 123-45-67'), interest: 'x' });
assert.equal(r.status, 422); assert.equal(r.json.field, 'interest');

r = await post({ ...base('+375 29 123-45-67'), items: [] });
assert.equal(r.status, 422); assert.equal(r.json.field, 'items');
r = await post({ ...base('+375 29 123-45-67'), items: [{ id: 'nope', qty: 1 }] });
assert.equal(r.status, 422); assert.equal(r.json.field, 'items');
r = await post({ ...base('+375 29 123-45-67'), items: [{ id: 'drip', qty: 999 }] });
assert.equal(r.status, 422);

// 2. хорошая заявка проходит, повтор того же номера не создаёт вторую
const phone = '+375 (29) ' + rnd().slice(0, 3) + '-' + rnd().slice(0, 2) + '-' + rnd().slice(0, 2);
r = await post(base(phone));
assert.equal(r.status, 200); assert.equal(r.json.status, 'ok');
r = await post(base(phone.replace(/\D/g, '').replace(/^375/, '8 0')));  // тот же номер в другой записи
assert.equal(r.json.status, 'duplicate');

// 3. двойное нажатие: два запроса одновременно, ровно один создаёт заявку
const phone2 = '+375 33 ' + rnd().slice(0, 3) + '-' + rnd().slice(0, 2) + '-' + rnd().slice(0, 2);
const both = await Promise.all([post(base(phone2)), post(base(phone2))]);
const st = both.map((x) => x.json.status).sort();
assert.deepEqual(st, ['duplicate', 'ok']);

// 4. ловушка для ботов: «принято», но заявка не создаётся (следующий честный запрос того же номера проходит)
const phone3 = '+375 44 ' + rnd().slice(0, 3) + '-' + rnd().slice(0, 2) + '-' + rnd().slice(0, 2);
r = await post({ ...base(phone3), company: 'ООО Бот' });
assert.equal(r.json.status, 'ok');
r = await post(base(phone3));
assert.equal(r.json.status, 'ok');

// 5. мусор вместо JSON
const bad = await fetch(BASE + '/api/lead', { method: 'POST', body: '{oops' });
assert.equal(bad.status, 400);

console.log('lead api: все проверки прошли');
