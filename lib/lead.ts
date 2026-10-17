import { kvNormalizePhone } from './phone';

export const INTERESTS = ['subscription', 'order', 'question'] as const;
export type Interest = (typeof INTERESTS)[number];

export const SOURCE_KEYS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'gclid', 'fbclid', 'yclid', 'referrer', 'landing', 'page', 'first_seen',
] as const;

// убираем управляющие символы и режем по длине
const clip = (v: unknown, n: number) =>
  typeof v === 'string' ? v.replace(/[\x00-\x1f\x7f]/g, ' ').trim().slice(0, n) : '';

export type Parsed =
  | { ok: true; name: string; e164: string; interest: Interest; comment: string; source: Record<string, string>; bot: boolean }
  | { ok: false; field: 'name' | 'phone' | 'interest' | 'body'; reason: string };

/** Проверка тела заявки. Сервер не доверяет браузеру: всё проверяется заново. */
export function parseLead(body: unknown): Parsed {
  if (!body || typeof body !== 'object') return { ok: false, field: 'body', reason: 'format' };
  const b = body as Record<string, unknown>;
  const name = clip(b.name, 80);
  if (!name) return { ok: false, field: 'name', reason: 'empty' };
  const ph = kvNormalizePhone(typeof b.phone === 'string' ? b.phone : '');
  if (!ph.ok || !ph.e164) return { ok: false, field: 'phone', reason: ph.reason || 'format' };
  const interest = INTERESTS.find((x) => x === b.interest);
  if (!interest) return { ok: false, field: 'interest', reason: 'empty' };
  const src = (b.source && typeof b.source === 'object' ? b.source : {}) as Record<string, unknown>;
  const source: Record<string, string> = {};
  for (const k of SOURCE_KEYS) {
    const v = clip(src[k], 300);
    if (v) source[k] = v;
  }
  return {
    ok: true, name, e164: ph.e164, interest, comment: clip(b.comment, 1000), source,
    // скрытое поле-ловушка: человек его не видит и не заполняет
    bot: typeof b.company === 'string' && b.company.trim() !== '',
  };
}
