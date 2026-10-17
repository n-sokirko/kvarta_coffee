const fs = require('fs');
const path = require('path');
const vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, 'kv-lead.js'), 'utf8');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(src + ';this.kvNormalizePhone=kvNormalizePhone;this.kvFormatPhoneInput=kvFormatPhoneInput;this.kvCreateDedupe=kvCreateDedupe;', ctx);
const { kvNormalizePhone: norm, kvFormatPhoneInput: fmt, kvCreateDedupe: mk } = ctx;
const assert = require('assert');

const ok = (raw, e164) => { const r = norm(raw); assert.strictEqual(r.ok, true, 'ok? ' + raw + ' ' + JSON.stringify(r)); assert.strictEqual(r.e164, e164, raw); };
const bad = (raw, reason) => { const r = norm(raw); assert.strictEqual(r.ok, false, 'bad? ' + raw); assert.strictEqual(r.reason, reason, raw + ' -> ' + r.reason); };

ok('+375 29 123-45-67', '+375291234567');
ok('375291234567', '+375291234567');
ok('80291234567', '+375291234567');
ok('8 029 123-45-67', '+375291234567');
ok('029 1234567', '+375291234567');
ok('(029) 123.45.67', '+375291234567');
ok('+375 (44) 555-00-11', '+375445550011');
ok('+375 25 000-00-00', '+375250000000');
ok('+375 33 765 43 21', '+375337654321');
ok('+375 17 234-56-78', '+375172345678');
ok('291234567', '+375291234567');
assert.strictEqual(norm('+375 29 123-45-67').display, '+375 (29) 123-45-67');

bad('', 'empty');
bad('   ', 'empty');
bad('+7 912 345-67-89', 'country');
bad('+380 50 123 45 67', 'country');
bad('89123456789', 'country');
bad('+375 28 123-45-67', 'code');
bad('+375 29 123-45-6', 'length');
bad('+375 29 123-45-678', 'length');
bad('+375 2', 'length');
bad('29x1234567', 'format');
bad('телефон', 'format');

// mask
assert.strictEqual(fmt(''), '');
assert.strictEqual(fmt('+'), '');
assert.strictEqual(fmt('3'), '+3');
assert.strictEqual(fmt('37'), '+37');
assert.strictEqual(fmt('375'), '+375');
assert.strictEqual(fmt('+375 2'), '+375 (2');
assert.strictEqual(fmt('+375 29'), '+375 (29)');
assert.strictEqual(fmt('+375 29 1'), '+375 (29) 1');
assert.strictEqual(fmt('+375 29 123 4'), '+375 (29) 123-4');
assert.strictEqual(fmt('+375291234567'), '+375 (29) 123-45-67');
assert.strictEqual(fmt('80291234567'), '+375 (29) 123-45-67');
assert.strictEqual(fmt('8 029 123-45-67'), '+375 (29) 123-45-67');
assert.strictEqual(fmt('+375 (29) 123-45-67999'), '+375 (29) 123-45-67');
assert.strictEqual(fmt('291234567'), '+375 (29) 123-45-67');
assert.strictEqual(fmt(fmt('+375 29 123')), '+375 (29) 123');
assert.strictEqual(norm(fmt('80291234567')).ok, true);
// deleting back through the mask never yields junk
let s = '+375 (29) 123-45-67';
const seen = [];
while (s) { s = fmt(s.slice(0, -1), s); seen.push(s); if (seen.length > 40) break; }
assert.ok(seen.length < 40, 'delete loop terminates: ' + seen.join(' | '));
assert.strictEqual(seen[seen.length-1], '');
assert.strictEqual(fmt('+375 (29', '+375 (29)'), '+375 (2');
assert.strictEqual(fmt('+375 (29) 123-', '+375 (29) 123-4'), '+375 (29) 123');

// dedupe
const W = 10 * 60 * 1000;
let d = mk(W);
const P = '+375291234567', Q = '+375441112233';
assert.strictEqual(d.begin(P, 0), 'new');
assert.strictEqual(d.begin(P, 5), 'in-flight');           // double click
d.commit(P, 1000);
assert.strictEqual(d.begin(P, 2000), 'duplicate');
assert.strictEqual(d.begin(Q, 2000), 'new');               // another number
d.rollback(Q);
assert.strictEqual(d.begin(Q, 2100), 'new');               // retry after failure
d.rollback(Q);
assert.strictEqual(d.begin(P, 1000 + W - 1), 'duplicate'); // just inside the window
assert.strictEqual(d.begin(P, 1000 + W), 'new');           // exactly at the window: free again
d.rollback(P);
d = mk(W);
d.begin(P, 0); d.rollback(P);
assert.strictEqual(d.begin(P, 10), 'new');                 // rollback allows retry
d.commit(P, 20);
d.commit(Q, 30);
assert.strictEqual(d.begin(Q, W + 40), 'new');             // expired key swept

console.log('all kv-lead tests passed');
