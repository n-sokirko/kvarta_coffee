// Управление WebGL-сценами при прокрутке. Перенесено из прототипа (класс Component в artifact/Main.dc.html).
// Скрипты движка (public/gl/*.js) грузятся лениво, после загрузки страницы, чтобы не мешать первому экрану.

function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
function seg(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
function sm(t) { return t * t * (3 - 2 * t); }
function lerp(a, b, t) { return a + (b - a) * t; }
function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
function mixc(a, b, t) {
  return 'rgb(' + Math.round(lerp(a[0], b[0], t)) + ',' + Math.round(lerp(a[1], b[1], t)) + ',' + Math.round(lerp(a[2], b[2], t)) + ')';
}
var C_PAPER = hex('#e9e0cc'), C_FLAME = hex('#e2642e'), C_ESP = hex('#2a1b13'), C_DPAPER = hex('#efe8d9'), C_SKY = hex('#cddde2');

var SCRIPTS = ['/gl/kv-gl.js?v=14', '/gl/kv-models.js?v=14', '/gl/kv-scenes.js?v=14'];

function loadScript(src) {
  return new Promise(function (resolve, reject) {
    var s = document.createElement('script');
    s.src = src; s.async = false;
    s.onload = function () { resolve(); };
    s.onerror = function () { reject(new Error('не загрузился ' + src)); };
    document.head.appendChild(s);
  });
}

function loadEngine() {
  if (window.KvScenes && window.KvGL) return Promise.resolve();
  return SCRIPTS.reduce(function (p, src) { return p.then(function () { return loadScript(src); }); }, Promise.resolve());
}

/** root: элемент #kv. getSel: функция, возвращающая id выбранного кофе. Возвращает { dispose, refreshPreview }. */
export function createScenes(root, getSel) {
  var st = { dead: false, gl: {}, vis: {}, hs: 0, loopOn: false, raf: 0, raf2: 0, errs: 0, ready: false };
  var t0 = performance.now();
  var rm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var pv = root.querySelector('.prevcv');
  var hero = root.querySelector('.hero');
  var a = root.querySelector('[data-scene="bean"]');
  var b = root.querySelector('[data-scene="delivery"]');
  var A = a ? { el: a, art: a.querySelector('.art'), stage: a.querySelector('.stage'), p: -1, step: 0 } : null;
  var B = b ? { el: b, art: b.querySelector('.art'), stage: b.querySelector('.stage'), p: -1, step: 0 } : null;

  function now() { return (performance.now() - t0) / 1000; }

  function ensure(k) {
    if (st.gl[k] !== undefined) return st.gl[k];
    var KG = window.KvGL, sel = { hero: '.cv-hero', A: '.cv-a', P: '.cv-p', B: '.cv-b' }[k], dpr = { hero: 1.75, A: 1.5, P: 1.75, B: 1.5 }[k];
    if ((window.innerWidth || 1024) < 700) dpr = Math.min(dpr, 1.25);
    var c = KG ? root.querySelector(sel) : null;
    var r = c ? KG.create(c, { maxDpr: dpr, shadowSize: (window.innerWidth || 1024) < 700 ? 1024 : 2048 }) : null;
    st.gl[k] = r ? { el: c, r: r } : null;
    if (k === 'B' && r) {
      var redo = function () { if (st.gl.B) st.gl.B.r.setDecals(KG.drawDecals()); };
      redo();
      if (document.fonts && document.fonts.load) {
        Promise.all([document.fonts.load('800 60px Podkova'), document.fonts.load('700 40px Podkova'), document.fonts.load('500 20px "IBM Plex Mono"')]).then(redo, redo);
      }
    }
    return st.gl[k];
  }

  function safe(key, fn) {
    if (st.gl[key] === null) return;
    try { fn(); } catch (e) {
      st.errs++;
      if (window.console) console.error('kvarta scene ' + key + ':', e);
      if (st.errs > 6) st.gl[key] = null;
    }
  }

  function drawHero(t) {
    var g = ensure('hero');
    if (g && window.KvScenes) {
      window.KvScenes.hero(g.r, t, st.hs || 0, {});
      if (!st.heroLive) { st.heroLive = true; root.classList.add('kv-live'); } // постер уступает место живой сцене
    }
  }
  function drawP(t) { var g = ensure('P'); if (g && window.KvScenes) window.KvScenes.preview(g.r, t, getSel()); }
  function drawA(S, time) { var g = ensure('A'); if (g && S.p >= 0 && window.KvScenes) window.KvScenes.pour(g.r, S.p, time, { rm: rm }); }
  function drawB(S, time) { var g = ensure('B'); if (g && S.p >= 0 && window.KvScenes) window.KvScenes.delivery(g.r, S.p, time, { rm: rm }); }

  function kick() {
    if (st.loopOn || rm || st.dead) return;
    st.loopOn = true;
    st.raf2 = requestAnimationFrame(loop);
  }
  function loop() {
    st.loopOn = false;
    if (st.dead) return;
    var v = st.vis, t = now(), again = false;
    if (v.hero) { safe('hero', function () { drawHero(t); }); again = true; }
    if (v.P) { safe('P', function () { drawP(t); }); again = true; }
    if (v.A && A) { safe('A', function () { drawA(A, t); }); again = true; }
    if (v.B && B) { safe('B', function () { drawB(B, t); }); again = true; }
    if (again) kick();
  }

  function scene(S, top, rmP, fn) {
    var vh = window.innerHeight || 760;
    var r = S.el.getBoundingClientRect();
    var stageH = S.stage.offsetHeight;
    var p;
    if (rm) p = rmP;
    else {
      if (r.bottom < -300 || r.top > vh + 300) return;
      p = clamp((top - r.top) / Math.max(1, r.height - stageH), 0, 1);
    }
    if (Math.abs(p - S.p) < 0.0004) return;
    S.p = p;
    fn(S, p);
  }
  function tickA(S, p) {
    var el = S.el;
    el.style.setProperty('--bg', p < 0.5 ? mixc(C_PAPER, C_FLAME, sm(seg(p, 0.18, 0.4))) : mixc(C_FLAME, C_ESP, sm(seg(p, 0.52, 0.6))));
    var step = p < 0.22 ? 1 : p < 0.52 ? 2 : p < 0.72 ? 3 : 4;
    if (S.step !== step) { S.step = step; el.setAttribute('data-step', String(step)); }
    if (st.ready) safe('A', function () { drawA(S, now()); });
  }
  function tickB(S, p) {
    var el = S.el;
    el.style.setProperty('--bg', mixc(C_DPAPER, C_SKY, sm(seg(p, 0.14, 0.34))));
    var step = p < 0.22 ? 1 : p < 0.44 ? 2 : p < 0.76 ? 3 : 4;
    if (S.step !== step) { S.step = step; el.setAttribute('data-step', String(step)); }
    if (st.ready) safe('B', function () { drawB(S, now()); });
  }

  function tick() {
    var vh = window.innerHeight || 760;
    var sh = clamp(vh, 560, 940);
    if (st.sh !== sh) { st.sh = sh; root.style.setProperty('--sh', sh + 'px'); }
    var vis = { hero: false, P: false, A: false, B: false };
    if (hero) {
      var hr = hero.getBoundingClientRect();
      vis.hero = hr.bottom > 0 && hr.top < vh;
      st.hs = clamp(-hr.top / Math.max(1, hr.height), 0, 1);
    }
    if (pv) { var pr = pv.getBoundingClientRect(); vis.P = pr.bottom > 0 && pr.top < vh; }
    if (A) { var ar = A.el.getBoundingClientRect(); vis.A = ar.bottom > 0 && ar.top < vh; }
    if (B) { var br = B.el.getBoundingClientRect(); vis.B = br.bottom > 0 && br.top < vh; }
    st.vis = vis;
    if (A) scene(A, 56, 0.93, tickA);
    if (B) scene(B, 56, 0.62, tickB);
    if (!st.ready) return;
    if (rm) { safe('hero', function () { drawHero(0); }); safe('P', function () { drawP(0); }); }
    else kick();
  }

  var queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    st.raf = requestAnimationFrame(function () { queued = false; tick(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true, capture: true });
  window.addEventListener('resize', onScroll);
  tick(); // фон и номер шага работают и до загрузки движка

  function start() {
    loadEngine().then(function () {
      if (st.dead) return;
      st.ready = true;
      A && (A.p = -1);
      B && (B.p = -1);
      tick();
    }, function (e) { if (window.console) console.error(e); });
  }
  // Тяжёлую часть (движок и первый кадр) запускаем при первом действии человека или через 6 секунд:
  // до этого на первом экране стоит постер, страница быстро становится интерактивной.
  var started = false, timeoutId = 0;
  var EVENTS = ['scroll', 'pointerdown', 'touchstart', 'keydown', 'mousemove'];
  function go() {
    if (started || st.dead) return;
    started = true;
    EVENTS.forEach(function (n) { window.removeEventListener(n, go, true); });
    clearTimeout(timeoutId);
    start();
  }
  EVENTS.forEach(function (n) { window.addEventListener(n, go, { capture: true, passive: true, once: false }); });
  timeoutId = setTimeout(go, 6000);

  return {
    refreshPreview: function () { if (st.ready && rm && st.gl.P) safe('P', function () { drawP(0); }); },
    dispose: function () {
      st.dead = true;
      cancelAnimationFrame(st.raf); cancelAnimationFrame(st.raf2);
      clearTimeout(timeoutId);
      EVENTS.forEach(function (n) { window.removeEventListener(n, go, true); });
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
      ['hero', 'A', 'P', 'B'].forEach(function (k) { if (st.gl[k]) { try { st.gl[k].r.dispose(); } catch (e) { /* ignore */ } } });
    },
  };
}
