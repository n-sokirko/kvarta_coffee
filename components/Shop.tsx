'use client';

import { useEffect, useMemo, useState } from 'react';
import { COFFEES, TXT } from '@/lib/content';
import { setSelectedCoffee } from '@/lib/bus';
import { PickLink } from './PickLink';

const PHOTO_ALT: Record<string, string> = {
  ethiopia: 'Крафтовая пачка Эфиопия Иргачеффе, чаша с зёрнами, цветы и бергамот',
  colombia: 'Чёрная пачка Колумбия Уила, зёрна, карамель и красное яблоко',
  brazil: 'Крафтовая пачка Бразилия Серрадо, зёрна, орехи и тёмный шоколад',
  drip: 'Коробка дрип-пакетов, три пакета разных цветов и кружка с подвешенным пакетом',
};

export default function Shop() {
  const [sel, setSel] = useState('ethiopia');
  const cur = useMemo(() => COFFEES.find((c) => c.id === sel) || COFFEES[0], [sel]);
  // остальные фото подгружаем, когда браузер освободится, чтобы переключение не мигало
  useEffect(() => {
    const load = () => COFFEES.forEach((c) => { const i = new Image(); i.src = '/menu/' + c.id + '.webp'; });
    const w = window as unknown as { requestIdleCallback?: (f: () => void) => void };
    if (w.requestIdleCallback) w.requestIdleCallback(load); else setTimeout(load, 2500);
  }, []);
  const pick = (id: string) => {
    setSel(id);
    setSelectedCoffee(id);
  };
  return (
    <section className="shop" id="coffee">
      <div className="wrap">
        <h2>{TXT.shopH}</h2>
        <p className="intro">{TXT.shopIntro}</p>
        <div className="shop-in">
          <div className="rows" role="group" aria-label="Выбор кофе">
            {COFFEES.map((c) => (
              <button key={c.id} type="button" className={'row' + (sel === c.id ? ' on' : '')} aria-pressed={sel === c.id} onClick={() => pick(c.id)}>
                <span className="nm">{c.name}</span>
                <span className="pr">{c.price}</span>
                <span className="nt">{c.notes}</span>
              </button>
            ))}
          </div>
          <div className="prev" aria-live="polite">
            <p className="mono">{cur.weight}</p>
            <img className="prevph" key={cur.id} src={'/menu/' + cur.id + '.webp'} alt={PHOTO_ALT[cur.id] || cur.name} width={640} height={cur.id === 'drip' ? 568 : 640} decoding="async" />
            <p className="words">{cur.words}</p>
            <p className="bl2">{cur.blurb}</p>
            <p className="pp"><span>{cur.name}</span><b>{cur.price}</b></p>
            <PickLink interest="order" className="btn">{TXT.shopBtn}</PickLink>
          </div>
        </div>
      </div>
    </section>
  );
}
