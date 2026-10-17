import { NextResponse } from 'next/server';
import { parseLead } from '@/lib/lead';
import { getStore, type Lead } from '@/lib/store';
import { notifyTelegram } from '@/lib/telegram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WINDOW_SEC = 10 * 60;

/**
 * POST /api/lead
 *   200 { status: 'ok' }         заявка принята
 *   200 { status: 'duplicate' }  с этого номера заявка уже была меньше 10 минут назад, вторая не создаётся
 *   422 { status: 'invalid', field, reason }  неверные данные
 *   500 { status: 'error' }      не удалось сохранить, номер освобождён, можно повторить
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > 20_000) return NextResponse.json({ status: 'invalid', field: 'body', reason: 'size' }, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ status: 'invalid', field: 'body', reason: 'format' }, { status: 400 });
  }
  const p = parseLead(body);
  if (!p.ok) return NextResponse.json({ status: 'invalid', field: p.field, reason: p.reason }, { status: 422 });
  if (p.bot) return NextResponse.json({ status: 'ok' }); // боту говорим «принято» и ничего не сохраняем

  const store = getStore();
  let claimed = false;
  try {
    claimed = await store.claim(p.e164, WINDOW_SEC);
    if (!claimed) return NextResponse.json({ status: 'duplicate' });
    const lead: Lead = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      name: p.name,
      phone: p.e164,
      interest: p.interest,
      comment: p.comment,
      heard: p.heard,
      items: p.items,
      total: p.total,
      source: p.source,
      userAgent: (req.headers.get('user-agent') || '').slice(0, 200),
    };
    await store.save(lead);
    await notifyTelegram(lead);
    return NextResponse.json({ status: 'ok' });
  } catch (e) {
    // не сохранили: снимаем блокировку, чтобы повтор прошёл
    if (claimed) {
      try {
        await store.release(p.e164);
      } catch {
        // ignore
      }
    }
    console.error('lead save failed', e);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}

/** GET /api/lead: список заявок для менеджера, только с заголовком x-admin-token (переменная ADMIN_TOKEN). */
export async function GET(req: Request) {
  const token = process.env.ADMIN_TOKEN;
  if (!token || req.headers.get('x-admin-token') !== token) return new NextResponse('Not found', { status: 404 });
  const leads = await getStore().list(100);
  return NextResponse.json({ count: leads.length, leads }, { headers: { 'cache-control': 'no-store' } });
}
