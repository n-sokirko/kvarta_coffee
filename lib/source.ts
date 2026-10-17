// Откуда пришёл человек: метки рекламы (UTM, клик-идентификаторы), реферер и страница входа.
// Хранится в localStorage, чтобы заявка, отправленная через несколько минут и после перехода по якорям, не потеряла источник.
const KEY = 'kv_source';
const PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid', 'yclid'] as const;

type Src = Record<string, string>;

function read(): Src {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') || {};
  } catch {
    return {};
  }
}
function write(s: Src) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // приватный режим или запрет хранилища: источник будет взят из текущего адреса
  }
}

/** Вызывать один раз при загрузке страницы. */
export function captureSource(): void {
  const q = new URLSearchParams(location.search);
  const fresh: Src = {};
  for (const k of PARAMS) {
    const v = q.get(k);
    if (v) fresh[k] = v.slice(0, 300);
  }
  const stored = read();
  const external = document.referrer && !document.referrer.startsWith(location.origin) ? document.referrer : '';
  if (Object.keys(fresh).length) {
    // новый рекламный заход заменяет прежние метки
    write({ ...fresh, referrer: external || stored.referrer || '', landing: location.pathname + location.search, first_seen: new Date().toISOString() });
  } else if (!stored.landing) {
    write({ referrer: external, landing: location.pathname + location.search, first_seen: new Date().toISOString() });
  }
}

/** Источник на момент отправки заявки. */
export function getSource(): Src {
  const s = { ...read() };
  const q = new URLSearchParams(location.search);
  for (const k of PARAMS) {
    const v = q.get(k);
    if (v && !s[k]) s[k] = v.slice(0, 300);
  }
  s.page = location.pathname + location.search + location.hash;
  if (!s.landing) s.landing = location.pathname + location.search;
  for (const k of Object.keys(s)) if (!s[k]) delete s[k];
  return s;
}
