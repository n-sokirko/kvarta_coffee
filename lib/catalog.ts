// Позиции и цены из ТЗ. Сервер пересчитывает сумму сам и не доверяет цифрам из браузера.
export const CATALOG = [
  { id: 'ethiopia', name: 'Эфиопия Иргачеффе', unit: '250 г', price: 32 },
  { id: 'colombia', name: 'Колумбия Уила', unit: '250 г', price: 29 },
  { id: 'brazil', name: 'Бразилия Серрадо', unit: '250 г', price: 26 },
  { id: 'drip', name: 'Дрип-пакеты, ассорти', unit: '10 пакетов', price: 18 },
] as const;

export const FREE_DELIVERY_FROM = 50;
export const MAX_QTY = 20;

export type OrderItem = { id: string; name: string; qty: number; price: number };

/** Разбирает позиции заказа. Возвращает null, если формат неверный. */
export function parseItems(raw: unknown): { items: OrderItem[]; total: number } | null {
  if (raw == null) return { items: [], total: 0 };
  if (!Array.isArray(raw) || raw.length > 10) return null;
  const items: OrderItem[] = [];
  for (const r of raw) {
    const row = r as { id?: unknown; qty?: unknown };
    const p = CATALOG.find((c) => c.id === row.id);
    const qty = Number(row.qty);
    if (!p || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return null;
    const ex = items.find((i) => i.id === p.id);
    if (ex) ex.qty = Math.min(MAX_QTY, ex.qty + qty);
    else items.push({ id: p.id, name: p.name, qty, price: p.price });
  }
  return { items, total: items.reduce((s, i) => s + i.qty * i.price, 0) };
}
