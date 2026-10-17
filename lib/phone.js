// Belarus phone normalisation, input mask and 10-minute dedupe. Plain JS, no deps.
var KV_MOBILE = { '25': 1, '29': 1, '33': 1, '44': 1 };
var KV_CITY = { '15': 1, '16': 1, '17': 1, '21': 1, '22': 1, '23': 1 };

// Returns the national significant digits (code + subscriber) or a failure reason.
function kvNationalDigits(raw) {
  var s = String(raw == null ? '' : raw).trim();
  if (!s) return { reason: 'empty' };
  if (/[^\d\s()+\-.]/.test(s)) return { reason: 'format' };
  var plus = s.charAt(0) === '+';
  var d = s.replace(/\D/g, '');
  if (!d) return { reason: 'empty' };
  if (plus) {
    if (d.indexOf('375') !== 0) return { reason: 'country' };
    return { digits: d.slice(3) };
  }
  if (d.indexOf('375') === 0) return { digits: d.slice(3) };
  if (d.indexOf('80') === 0) return { digits: d.slice(2) };
  if (d.charAt(0) === '8' && d.charAt(1) !== '0') return { reason: 'country' };
  if (d.charAt(0) === '0') return { digits: d.slice(1) };
  return { digits: d };
}

function kvNormalizePhone(raw) {
  var r = kvNationalDigits(raw);
  if (r.reason) return { ok: false, e164: null, display: null, reason: r.reason };
  var n = r.digits;
  var code = n.slice(0, 2);
  if (n.length < 2) return { ok: false, e164: null, display: null, reason: 'length' };
  if (!KV_MOBILE[code] && !KV_CITY[code]) return { ok: false, e164: null, display: null, reason: 'code' };
  if (n.length !== 9) return { ok: false, e164: null, display: null, reason: 'length' };
  var s = n.slice(2);
  return {
    ok: true,
    e164: '+375' + n,
    display: '+375 (' + code + ') ' + s.slice(0, 3) + '-' + s.slice(3, 5) + '-' + s.slice(5, 7),
    reason: null,
  };
}

// Mask while typing: "+375 (29) 123-45-67". Survives pasting in any accepted format.
function kvFormatPhoneInput(raw, prev) {
  var out = kvMask(raw);
  // The user deleted a mask character (")", "-", " "): the mask would restore it and the
  // caret gets stuck, so drop the last digit instead.
  if (prev && String(raw).length < String(prev).length && out === prev) {
    out = kvMask(String(raw).replace(/\D+$/, '').slice(0, -1));
  }
  return out;
}

function kvMask(raw) {
  var s = String(raw == null ? '' : raw);
  var d = s.replace(/\D/g, '');
  if (!d) return '';
  var n;
  if (d.indexOf('375') === 0) n = d.slice(3);
  else if (d.indexOf('80') === 0 && d.length > 2) n = d.slice(2);
  else if (d.charAt(0) === '0' && d.length > 1) n = d.slice(1);
  else if (d.charAt(0) === '8' && d.length > 1 && s.charAt(0) !== '+') n = d.slice(1);
  else n = d;
  // a lone "3", "37" typed at the start is the beginning of 375
  if ('375'.indexOf(d) === 0 && d.length < 3) return '+' + d;
  n = n.slice(0, 9);
  var out = '+375';
  if (!n.length) return out;
  out += ' (' + n.slice(0, 2);
  if (n.length >= 2) out += ')';
  if (n.length > 2) out += ' ' + n.slice(2, 5);
  if (n.length > 5) out += '-' + n.slice(5, 7);
  if (n.length > 7) out += '-' + n.slice(7, 9);
  return out;
}

// begin -> 'new' | 'in-flight' | 'duplicate'. commit after success, rollback after failure.
function kvCreateDedupe(windowMs) {
  var sent = {};
  var flying = {};
  function sweep(now) {
    for (var k in sent) if (now - sent[k] >= windowMs) delete sent[k];
  }
  return {
    begin: function (e164, now) {
      sweep(now);
      if (flying[e164]) return 'in-flight';
      if (sent[e164] !== undefined && now - sent[e164] < windowMs) return 'duplicate';
      flying[e164] = true;
      return 'new';
    },
    commit: function (e164, now) {
      delete flying[e164];
      sent[e164] = now;
    },
    rollback: function (e164) {
      delete flying[e164];
    },
  };
}

export { kvNormalizePhone, kvFormatPhoneInput, kvMask, kvCreateDedupe };
