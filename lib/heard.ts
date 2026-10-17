// «Откуда о нас узнали»: варианты ответа в форме. Список один и для страницы, и для проверки на сервере.
export const HEARD = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'yandex', label: 'Яндекс' },
  { id: 'google', label: 'Google' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'friends', label: 'Посоветовали' },
  { id: 'other', label: 'Другое' },
] as const;

export type HeardId = (typeof HEARD)[number]['id'];

export const heardLabel = (id: string): string => HEARD.find((h) => h.id === id)?.label || '';

/** Подсказка по метке рекламы или реферреру: человек может её поправить. */
export function guessHeard(src: Record<string, string>): HeardId | '' {
  const s = ((src.utm_source || '') + ' ' + (src.referrer || '')).toLowerCase();
  if (/instagram|ig\b|l\.instagram/.test(s)) return 'instagram';
  if (/yandex|ya\.ru|yclid/.test(s) || src.yclid) return 'yandex';
  if (/google|gclid/.test(s) || src.gclid) return 'google';
  if (/telegram|t\.me/.test(s)) return 'telegram';
  return '';
}
