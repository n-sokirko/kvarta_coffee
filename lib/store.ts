import fs from 'node:fs';
import path from 'node:path';
import { Redis } from '@upstash/redis';

export type Lead = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  interest: 'subscription' | 'order' | 'question';
  comment: string;
  heard: string;
  items: { id: string; name: string; qty: number; price: number }[];
  total: number;
  source: Record<string, string>;
  userAgent: string;
};

export interface Store {
  kind: 'redis' | 'file';
  /** Занять номер на ttlSec секунд. true, если номера ещё не было (атомарно). */
  claim(e164: string, ttlSec: number): Promise<boolean>;
  release(e164: string): Promise<void>;
  save(lead: Lead): Promise<void>;
  list(limit: number): Promise<Lead[]>;
}

function redisStore(url: string, token: string): Store {
  const r = new Redis({ url, token });
  return {
    kind: 'redis',
    // SET NX EX: одна атомарная команда, поэтому два одновременных запроса не пройдут оба
    async claim(e164, ttl) {
      const res = await r.set('dedupe:' + e164, '1', { nx: true, ex: ttl });
      return res === 'OK';
    },
    async release(e164) {
      await r.del('dedupe:' + e164);
    },
    async save(lead) {
      await r.lpush('leads', JSON.stringify(lead));
    },
    async list(limit) {
      const rows = await r.lrange<unknown>('leads', 0, limit - 1);
      return rows.map((x) => (typeof x === 'string' ? JSON.parse(x) : x)) as Lead[];
    },
  };
}

// Локальный режим без внешних сервисов: файл data/leads.jsonl и таблица занятых номеров в памяти процесса.
function fileStore(): Store {
  const dir = path.join(process.cwd(), 'data');
  const file = path.join(dir, 'leads.jsonl');
  const g = globalThis as unknown as { __kvClaims?: Map<string, number> };
  const claims = (g.__kvClaims ||= new Map<string, number>());
  return {
    kind: 'file',
    async claim(e164, ttl) {
      const now = Date.now();
      const until = claims.get(e164);
      if (until && until > now) return false;
      claims.set(e164, now + ttl * 1000);
      return true;
    },
    async release(e164) {
      claims.delete(e164);
    },
    async save(lead) {
      fs.mkdirSync(dir, { recursive: true });
      fs.appendFileSync(file, JSON.stringify(lead) + '\n');
    },
    async list(limit) {
      if (!fs.existsSync(file)) return [];
      const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
      return lines.slice(-limit).reverse().map((l) => JSON.parse(l));
    },
  };
}

let cached: Store | null = null;
export function getStore(): Store {
  if (cached) return cached;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  cached = url && token ? redisStore(url, token) : fileStore();
  return cached;
}
