import type { Lead } from './store';

const LABEL = { subscription: 'Подписка', order: 'Разовый заказ', question: 'Вопрос' } as const;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Дублирует заявку в Telegram, если заданы TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID. Ошибка не ломает заявку. */
export async function notifyTelegram(lead: Lead): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  const s = lead.source;
  const from =
    [s.utm_source, s.utm_medium, s.utm_campaign, s.utm_content].filter(Boolean).join(' / ') || s.referrer || 'прямой заход';
  const text = [
    '<b>Новая заявка</b>',
    'Имя: ' + esc(lead.name),
    'Телефон: ' + esc(lead.phone),
    'Интересует: ' + LABEL[lead.interest],
    lead.comment ? 'Комментарий: ' + esc(lead.comment) : '',
    'Откуда: ' + esc(from),
    s.landing ? 'Страница входа: ' + esc(s.landing) : '',
  ]
    .filter(Boolean)
    .join('\n');
  try {
    await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML' }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // заявка уже сохранена, уведомление необязательное
  }
}
