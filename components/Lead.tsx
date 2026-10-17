'use client';

import { useEffect, useRef, useState } from 'react';
import { PHONE_ERR, TXT } from '@/lib/content';
import { kvNormalizePhone, kvFormatPhoneInput, kvCreateDedupe } from '@/lib/phone';
import { getSource } from '@/lib/source';
import { HEARD, guessHeard } from '@/lib/heard';
import { CATALOG, FREE_DELIVERY_FROM, MAX_QTY } from '@/lib/catalog';

type Status = 'form' | 'sending' | 'ok' | 'dup' | 'fail';
type Interest = '' | 'subscription' | 'order' | 'question';
const INTERESTS: { id: Exclude<Interest, ''>; label: string }[] = [
  { id: 'subscription', label: 'Подписка' },
  { id: 'order', label: 'Разовый заказ' },
  { id: 'question', label: 'Вопрос' },
];

export default function Lead() {
  const dedupe = useRef(kvCreateDedupe(10 * 60 * 1000));
  const sending = useRef(false);
  const interestRef = useRef<Interest>('order');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [interest, setInterestState] = useState<Interest>('order');
  const [comment, setComment] = useState('');
  const [heard, setHeard] = useState('');
  const [company, setCompany] = useState(''); // поле-ловушка для ботов
  const [errName, setErrName] = useState(false);
  const [errPhone, setErrPhone] = useState('');
  const [errInterest, setErrInterest] = useState(false);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [errItems, setErrItems] = useState(false);
  const [status, setStatus] = useState<Status>('form');
  // если человек пришёл из рекламы или поиска, ответ подставляется сам, его можно поменять
  useEffect(() => { setHeard((h) => h || guessHeard(getSource())); }, []);
  const total = CATALOG.reduce((sum, c) => sum + (qty[c.id] || 0) * c.price, 0);
  const chosen = CATALOG.filter((c) => (qty[c.id] || 0) > 0);
  const step = (id: string, d: number) => {
    setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(MAX_QTY, (q[id] || 0) + d)) }));
    setErrItems(false);
  };

  const setInterest = (v: Interest) => {
    interestRef.current = v;
    setInterestState(v);
  };

  // кнопки «Подписаться» и «Оставить заявку» в других секциях заранее выбирают вариант
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<{ id: Exclude<Interest, ''>; onlyIfEmpty: boolean }>).detail;
      if (d.onlyIfEmpty && interestRef.current) return;
      setInterest(d.id);
      setErrInterest(false);
    };
    window.addEventListener('kv:interest', on);
    return () => window.removeEventListener('kv:interest', on);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending.current) return; // двойное нажатие
    const badName = !name.trim();
    const ph = kvNormalizePhone(phone);
    const badPhone = ph.ok ? '' : PHONE_ERR[ph.reason || 'format'] || PHONE_ERR.format;
    const badInterest = !interest;
    const badItems = interest === 'order' && total === 0;
    if (badName || badPhone || badInterest || badItems) {
      setErrItems(badItems);
      setErrName(badName);
      setErrPhone(badPhone);
      setErrInterest(badInterest);
      const id = badName ? 'f-name' : badPhone ? 'f-phone' : badItems ? 'order-box' : '';
      if (id) document.getElementById(id)?.focus();
      return;
    }
    const e164 = ph.e164 as string;
    const verdict = dedupe.current.begin(e164, Date.now());
    if (verdict === 'in-flight') return;
    if (verdict === 'duplicate') {
      setStatus('dup');
      return;
    }
    sending.current = true;
    setStatus('sending');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, phone, interest, comment, heard, company, source: getSource(), items: interest === 'order' ? chosen.map((c) => ({ id: c.id, qty: qty[c.id] })) : [] }),
        signal: ctrl.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.status === 'ok') {
        dedupe.current.commit(e164, Date.now());
        setStatus('ok');
        setName(''); setPhone(''); setInterest('order'); setComment(''); setQty({});
      } else if (res.ok && data.status === 'duplicate') {
        dedupe.current.commit(e164, Date.now());
        setStatus('dup');
      } else if (res.status === 422 && data.field) {
        // сервер не согласился с данными: показываем ту же подсказку, что и в браузере
        dedupe.current.rollback(e164);
        if (data.field === 'phone') setErrPhone(PHONE_ERR[data.reason] || PHONE_ERR.format);
        if (data.field === 'name') setErrName(true);
        if (data.field === 'interest') setErrInterest(true);
        if (data.field === 'items') setErrItems(true);
        setStatus('form');
      } else {
        dedupe.current.rollback(e164);
        setStatus('fail');
      }
    } catch {
      dedupe.current.rollback(e164);
      setStatus('fail');
    } finally {
      clearTimeout(timer);
      sending.current = false;
    }
  }

  const showForm = status === 'form' || status === 'sending' || status === 'fail';

  return (
    <section className="lead2" id="lead">
      <div className="wrap lead-in">
        <div>
          <h2>{TXT.leadH}</h2>
          <p className="intro">{TXT.leadIntro}</p>
          <div className="ct">
            <div><b>Адрес</b><p>{TXT.addr}</p></div>
            <div><b>Часы</b>{TXT.hours.map((h) => <p key={h}>{h}</p>)}</div>
            <div><b>Телефон</b><p>{TXT.phone}</p></div>
          </div>
        </div>
        <div>
          {showForm && (
            <form className="form" noValidate onSubmit={submit}>
              <div className={'fld' + (errName ? ' bad' : '')}>
                <label htmlFor="f-name">{TXT.nameLabel}</label>
                <input id="f-name" name="name" type="text" autoComplete="given-name" placeholder={TXT.namePh} value={name} onChange={(e) => { setName(e.target.value); setErrName(false); }} aria-describedby="e-name" />
                {errName && <p className="err" id="e-name">{TXT.nameErr}</p>}
              </div>
              <div className={'fld' + (errPhone ? ' bad' : '')}>
                <label htmlFor="f-phone">{TXT.phoneLabel}</label>
                <input id="f-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder={TXT.phonePh} value={phone} onChange={(e) => { setPhone(kvFormatPhoneInput(e.target.value, phone)); setErrPhone(''); }} aria-describedby="h-phone" />
                <p className="hint" id="h-phone">{TXT.phoneHint}</p>
                <p className="err" role="alert">{errPhone}</p>
              </div>
              <fieldset className={'fld' + (errInterest ? ' bad' : '')}>
                <legend>{TXT.legend}</legend>
                <div className="chips">
                  {INTERESTS.map((o) => (
                    <label className="chip" key={o.id}>
                      <input type="radio" name="interest" value={o.id} checked={interest === o.id} onChange={() => { setInterest(o.id); setErrInterest(false); }} />
                      <span>{o.label}</span>
                    </label>
                  ))}
                </div>
                {errInterest && <p className="err">{TXT.interestErr}</p>}
              </fieldset>
              {interest === 'order' && (
                <fieldset className={'fld order' + (errItems ? ' bad' : '')} id="order-box" tabIndex={-1}>
                  <legend>Что заказать</legend>
                  <div className="ord">
                    {CATALOG.map((c) => {
                      const n = qty[c.id] || 0;
                      return (
                        <div className={'oi' + (n ? ' on' : '')} key={c.id}>
                          <div className="oi-t"><b>{c.name}</b><span>{c.unit}, {c.price}{' '}BYN</span></div>
                          <div className="oi-q" role="group" aria-label={'Количество: ' + c.name}>
                            <button type="button" onClick={() => step(c.id, -1)} disabled={n === 0} aria-label="Убрать одну">−</button>
                            <output aria-live="polite">{n}</output>
                            <button type="button" onClick={() => step(c.id, 1)} disabled={n >= MAX_QTY} aria-label="Добавить одну">+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="ord-sum">
                    {total > 0 ? 'Итого ' + total + ' BYN. ' + (total >= FREE_DELIVERY_FROM ? 'Доставка бесплатно.' : 'Бесплатная доставка от ' + FREE_DELIVERY_FROM + ' BYN.') : 'Бесплатная доставка от ' + FREE_DELIVERY_FROM + ' BYN.'}
                  </p>
                  {errItems && <p className="err">Выберите хотя бы одну позицию.</p>}
                </fieldset>
              )}
              <fieldset className="fld">
                <legend>{TXT.heardLegend}</legend>
                <div className="chips">
                  {HEARD.map((o) => (
                    <label className="chip" key={o.id}>
                      <input type="radio" name="heard" value={o.id} checked={heard === o.id} onChange={() => setHeard(o.id)} />
                      <span>{o.label}</span>
                    </label>
                  ))}
                </div>
                <p className="hint">{TXT.heardHint}</p>
              </fieldset>
              <div className="fld">
                <label htmlFor="f-comment">{TXT.commentLabel}</label>
                <textarea id="f-comment" name="comment" placeholder={TXT.commentPh} value={comment} onChange={(e) => setComment(e.target.value)} />
              </div>
              <div className="hp" aria-hidden="true">
                <label>Компания<input type="text" name="company" tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} /></label>
              </div>
              {status === 'fail' && (
                <div className="msg fail" role="alert"><b>{TXT.failB}</b><p>{TXT.failP}</p></div>
              )}
              <button className="btn" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Отправляем' : 'Отправить заявку'}</button>
            </form>
          )}
          {status === 'ok' && (
            <div className="form">
              <div className="msg ok" role="status"><b>{TXT.okB}</b><p>{TXT.okP}</p></div>
              <button type="button" className="again" onClick={() => setStatus('form')}>{TXT.okAgain}</button>
            </div>
          )}
          {status === 'dup' && (
            <div className="form">
              <div className="msg" role="status"><b>{TXT.dupB}</b><p>{TXT.dupP}</p></div>
              <button type="button" className="again" onClick={() => setStatus('form')}>{TXT.dupBack}</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
