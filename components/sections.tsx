import { PickLink } from './PickLink';
// Сгенерировано из прототипа artifact/Main.dc.html (статические секции), дальше правится вручную.

export function Header() {
  return (
    <header className="hd">
      <div className="wrap hd-in">
        <a className="logo" href="#top" aria-label="Кварта, на главную">
          <svg width="20" height="25" viewBox="0 0 24 30" aria-hidden="true"><ellipse cx="12" cy="15" rx="10.5" ry="13.5" fill="currentColor"/><path d="M12 2.5 C17 9 7 12 12 15 S17 21 12 27.5" fill="none" stroke="#f3eee5" strokeWidth="2.4" strokeLinecap="round"/></svg>
          <span>Кварта</span>
        </a>
        <nav className="nav" aria-label="Разделы">
          <a href="#coffee">Кофе</a>
          <a href="#delivery">Доставка</a>
          <a href="#subscription">Подписка</a>
          <a href="#about">О нас</a>
        </nav>
        <a className="btn btn-s" href="#lead">Оставить заявку</a>
      </div>
    </header>
  );
}

export function Hero() {
  return (
    <section className="hero" id="top">
      <div className="wrap hero-in">
        <div className="hero-copy">
          <p className="mono kick">Обжарка кофе в Минске</p>
          <h1>Жарим в четверг, привозим в пятницу</h1>
          <p className="lead">Привозим по Минску, кофе у вас через 1–3 дня после обжарки. Оставьте заявку, мы перезвоним.</p>
          <div className="cta-row">
            <a className="btn" href="#lead">Оставить заявку</a>
            <a className="btn btn-o" href="#coffee">Выбрать кофе</a>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <canvas className="cv cv-hero"></canvas>
          <div className="stamp5">жарим<br />по 5 кг</div>
        </div>
      </div>
    </section>
  );
}

export function SceneA() {
  return (
    <section className="scene sA" id="story" data-scene="bean" data-step="1" aria-label="Как зерно становится кофе">
      <div className="stage">
        <div className="grain gl"></div>
        <div className="art" aria-hidden="true">
          <canvas className="cv cv-a"></canvas>
        </div>
        <div className="copy">
          <div className="st s1">
            <div className="sn" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
            <h2>Зерно из трёх стран</h2>
            <p className="b">Эфиопия, Колумбия и Бразилия.</p>
          </div>
          <div className="st s2">
            <div className="sn" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
            <h2>Жарим партиями по 5 кг</h2>
          </div>
          <div className="st s3">
            <div className="sn" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
            <h2>Во вкусе: цветы, карамель, орех</h2>
          </div>
          <div className="st s4">
            <div className="sn" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
            <h2>Кофе у вас через 1–3 дня</h2>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Fresh() {
  return (
    <section className="fresh">
      <div className="wrap">
        <div className="fresh-in">
          <div>
            <p className="big">1–3<small>дня от обжарки до вас</small></p>
          </div>
          <div>
            <h2>Кофе быстро выдыхается</h2>
            <p>Жарим по четвергам, а в пятницу уже развозим по Минску.</p>
          </div>
        </div>
        <div className="week" role="list" aria-label="Наша неделя">
          <div className="day" role="listitem"><b>пн</b><span></span></div>
          <div className="day" role="listitem"><b>вт</b><span></span></div>
          <div className="day" role="listitem"><b>ср</b><span></span></div>
          <div className="day t" role="listitem"><b>чт</b><span>жарим</span></div>
          <div className="day f" role="listitem"><b>пт</b><span>везём</span></div>
          <div className="day" role="listitem"><b>сб</b><span></span></div>
          <div className="day" role="listitem"><b>вс</b><span></span></div>
        </div>
      </div>
    </section>
  );
}

export function Sub() {
  return (
    <section className="sub" id="subscription">
      <div className="wrap">
        <div className="tag">
          <div>
            <h2 style={{ margin: "0 0 14px" }}>Две пачки по 250 г раз в месяц</h2>
            <p className="price">54 <small>BYN / мес</small></p>
          </div>
          <div style={{ display: "grid", gap: "18px" }}>
            <ul>
              <li>Доставка бесплатно</li>
              <li>Оставьте заявку, а какой кофе вам привозить, обсудим по телефону.</li>
            </ul>
            <div><PickLink interest="subscription" className="btn" style={{ background: "var(--ink)", borderColor: "var(--ink)", color: "var(--cream)" }}>Подписаться</PickLink></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SceneB() {
  return (
    <section className="scene sB" id="delivery" data-scene="delivery" data-step="1" aria-label="Как кофе добирается до вас">
      <div className="stage">
        <div className="grain gl"></div>
        <div className="art" aria-hidden="true">
          <canvas className="cv cv-b"></canvas>
        </div>
        <div className="copy">
          <div className="st s1">
            <div className="sn" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
            <h2>Сначала заявка и звонок</h2>
            <p className="b">Адрес в заявке не нужен: позвоним и спросим, куда ехать.</p>
          </div>
          <div className="st s2">
            <div className="sn" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
            <h2>В пятницу развозим по Минску</h2>
          </div>
          <div className="st s3">
            <div className="sn" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
            <h2>От 50 BYN доставка бесплатная</h2>
            <p className="b">Если заказ меньше, условия доставки назовём по телефону.</p>
          </div>
          <div className="st s4">
            <div className="sn" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
            <h2>Привезли, можно заваривать</h2>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Meth() {
  return (
    <section className="meth">
      <div className="wrap">
        <h2>Доставка и самовывоз</h2>
        <div className="board">
          <div className="bo">
            <p className="when">По пятницам</p>
            <div>
              <h3>Доставка по Минску</h3>
              <p className="hl">Бесплатно от 50 BYN</p>
            </div>
            <div>
    
              <p className="nn">Если заказ меньше 50 BYN, условия доставки назовём по телефону.</p>
            </div>
          </div>
          <div className="bo">
            <p className="when">Каждый день</p>
            <div>
              <h3>Самовывоз</h3>
              <p className="hl">ул. Короля, 9</p>
            </div>
            <div>
              <ul>
                <li>Пн–пт: 8:00–20:00</li>
                <li>Сб–вс: 10:00–18:00</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function About() {
  return (
    <section className="about" id="about">
      <div className="wrap about-in">
        <div>
          <h2 style={{ marginBottom: "20px" }}>Мы, Аня и Дмитрий, раньше работали бариста</h2>
          <p>С 2019 года жарим кофе партиями по 5 кг.</p>
        </div>
        <div className="seal" aria-hidden="true"><div><b>2019</b>Минск</div></div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="ft">
      <div className="wrap ft-in">
        <p>© «Кварта», Минск</p>
      </div>
    </footer>
  );
}
