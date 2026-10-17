export function kvNormalizePhone(raw: unknown): { ok: boolean; e164: string | null; display: string | null; reason: 'empty' | 'format' | 'country' | 'length' | 'code' | null };
export function kvFormatPhoneInput(raw: string, prev?: string): string;
export function kvMask(raw: string): string;
export function kvCreateDedupe(windowMs: number): {
  begin(e164: string, now: number): 'new' | 'duplicate' | 'in-flight';
  commit(e164: string, now: number): void;
  rollback(e164: string): void;
};
