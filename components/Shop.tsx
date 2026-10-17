'use client';

import { useMemo, useState } from 'react';
import { COFFEES, TXT } from '@/lib/content';
import { setSelectedCoffee } from '@/lib/bus';
import { PickLink } from './PickLink';

export default function Shop() {
  const [sel, setSel] = useState('ethiopia');
  const cur = useMemo(() => COFFEES.find((c) => c.id === sel) || COFFEES[0], [sel]);
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
            <div className="prevcv" aria-hidden="true"><canvas className="cv cv-p" /></div>
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
