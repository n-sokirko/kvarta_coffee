/* kv-scenes.js — choreography for the Kvarta page: hero, assortment preview, the pour (bean -> mug -> coffee) and the delivery
   (pouch -> van -> city -> courier at the door). Each function draws one frame for a given scroll progress p and time.
   window.KvScenes = { hero, preview, pour, delivery } */
(function (global) {
  'use strict';
  var K = global.KvGL;
  if (!K) return;
  var PI = Math.PI, TAU = PI * 2;
  var VIS_H = 2 * 9 * Math.tan(13 * PI / 180);
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function seg(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
  function sm(t) { return t * t * (3 - 2 * t); }
  function eo(t) { return 1 - Math.pow(1 - t, 3); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpAng(a, b, w) { return a + ((((b - a + PI) % TAU) + TAU) % TAU - PI) * w; }
  function kf(p, keys) { // smooth keyframes [[t, value], ...]
    if (p <= keys[0][0]) return keys[0][1];
    for (var i = 1; i < keys.length; i++) if (p <= keys[i][0]) { var a = keys[i - 1], b = keys[i]; return lerp(a[1], b[1], sm((p - a[0]) / (b[0] - a[0]))); }
    return keys[keys.length - 1][1];
  }
  function st(r) { return r.__kv || (r.__kv = {}); }
  function add3(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function norm3(a) { var l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  var ID3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  var KEY = [-0.55, 0.78, 0.62];

  /* ------------------------------------------------------------------ hero */
  function hero(r, t, hs, o) {
    var d = r.resize(), visW = VIS_H * d.w / Math.max(1, d.h), k = clamp(visW / 4.3, 0.6, 1.2);
    r.begin({ time: t });
    r.draw({ a: 'bean', q: 'hi', pos: [-0.2 * k, 0.05 * k + 0.06 * Math.sin(t * 0.9), 0.4], rx: -0.5 + 0.1 * Math.sin(t * 0.37), ry: 0.45 + t * 0.55 + hs * 2.2, rz: -0.55, s: 1.2 * k, roast: 0.7, seed: 1 });
    r.draw({ a: 'bean', q: 'hi', pos: [1.55 * k, -1.05 * k, -0.9], rx: -0.3, ry: 2.4 + t * 0.4 + hs * 1.5, rz: 0.7, s: 0.62 * k, roast: 0.34, seed: 2 });
    r.draw({ a: 'bean', q: 'hi', pos: [-1.6 * k, 1.15 * k, -1.2], rx: 0.4, ry: -0.6 + t * 0.3 - hs * 1.2, rz: 0.4, s: 0.6 * k, roast: 0.92, seed: 3 });
  }

  /* --------------------------------------------------------------- preview */
  var PREVIEW_ROAST = { ethiopia: 0.38, colombia: 0.62, brazil: 0.88 };
  function preview(r, t, sel) {
    r.resize();
    var ry = 0.35 + t * 0.6, rz = -0.35 + 0.06 * Math.sin(t * 0.4);
    r.begin({ time: t });
    if (sel === 'drip') {
      r.draw({ a: 'bean', q: 'hi', pos: [-1.15, 0.25, 0], rx: -0.25, ry: ry, rz: rz, s: 0.78, roast: 0.38, seed: 11 });
      r.draw({ a: 'bean', q: 'hi', pos: [0.05, -0.15, 0.3], rx: -0.2, ry: ry * 0.8 + 0.4, rz: rz + 0.2, s: 0.78, roast: 0.62, seed: 12 });
      r.draw({ a: 'bean', q: 'hi', pos: [1.2, 0.2, 0], rx: -0.25, ry: ry * 1.2 - 0.3, rz: rz + 0.5, s: 0.78, roast: 0.88, seed: 13 });
    } else {
      r.draw({ a: 'bean', q: 'hi', pos: [0, 0, 0], rx: -0.25, ry: ry, rz: rz, s: 1.2, roast: PREVIEW_ROAST[sel] == null ? 0.6 : PREVIEW_ROAST[sel], seed: 5 });
    }
  }

  /* ------------------------------------------------------------------ pour */
  // the 5 kg batch: x, y, z, rest rotation x, y, z, size
  var BATCH = [
    [-1.55, 0.9, -0.8, 0.5, 2.1, 0.7, 0.62], [1.5, 1.35, -1.2, -0.4, 0.3, -0.5, 0.58], [-1.3, -1.25, 0.2, 1.0, -0.8, 0.2, 0.64], [1.45, -0.95, -0.4, -0.7, 1.6, 0.9, 0.6],
    [-0.5, 1.7, -1.8, 0.2, 0.9, -0.9, 0.5], [0.7, -1.75, -1.0, 0.8, -1.4, 0.4, 0.55], [-2.0, -0.2, -1.6, -0.3, 2.6, 0.3, 0.52], [2.0, 0.2, -1.8, 0.9, 0.6, -0.2, 0.5],
    [-0.95, 0.15, 1.1, 0.3, -2.0, 0.6, 0.5], [1.0, -0.3, 1.2, -0.6, 1.0, -0.3, 0.5], [-0.3, -1.35, 0.8, 1.2, 0.4, 0.8, 0.48], [0.45, 1.3, 0.9, -0.2, -1.1, -0.7, 0.5],
    [-1.75, 1.7, -0.2, 0.6, 1.8, 0.2, 0.55], [1.7, -1.7, -0.5, -0.5, -0.2, 1.1, 0.55], [-1.9, -1.6, -1.1, 0.1, 0.5, -0.4, 0.5], [1.9, 1.75, -0.9, 0.7, 2.2, 0.3, 0.52],
    [0.1, -2.0, -1.6, 0.4, 1.4, 0.5, 0.46], [-0.1, 2.0, -1.5, -0.9, 0.7, -0.6, 0.46],
  ];
  function hash(i, s) { var x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); }

  function streamMesh(S, tip, v0, g, tHit, head, tail, r0, time) {
    var N = 20, seg = 10, cols = seg + 1, ST = 14;
    if (!S.sbuf) { S.sbuf = new Float32Array(N * cols * ST); var idx = new Uint16Array((N - 1) * seg * 6), m = 0; for (var j = 0; j < N - 1; j++) for (var i = 0; i < seg; i++) { var a = j * cols + i; idx[m++] = a; idx[m++] = a + cols; idx[m++] = a + 1; idx[m++] = a + 1; idx[m++] = a + cols; idx[m++] = a + cols + 1; } S.sidx = idx; }
    var b = S.sbuf, k = 0, ta = tHit * tail, tb = tHit * head, sp0 = Math.hypot(v0[0], v0[1]);
    for (var r = 0; r < N; r++) {
      var tau = lerp(ta, tb, r / (N - 1)), vx = v0[0], vy = v0[1] - g * tau;
      var px = tip[0] + v0[0] * tau + 0.0004 * Math.sin(tau * 40 - time * 22) * tau, py = tip[1] + v0[1] * tau - 0.5 * g * tau * tau, pz = tip[2] + 0.006 * Math.sin(tau * 31 + time * 13) * tau;
      var vl = Math.hypot(vx, vy) || 1, T = [vx / vl, vy / vl, 0];
      var n1 = [0, 0, 1], n2 = [T[1] * 1 - 0, -T[0], 0]; // n2 = T x n1
      var rad = r0 * clamp(Math.sqrt(sp0 / vl), 0.45, 1) * (1 + 0.1 * Math.sin(tau * 60 - time * 28));
      for (var i = 0; i < cols; i++) {
        var th = TAU * i / seg, c = Math.cos(th), s = Math.sin(th), dx = n1[0] * c + n2[0] * s, dy = n1[1] * c + n2[1] * s, dz = n1[2] * c + n2[2] * s;
        b[k++] = px + dx * rad; b[k++] = py + dy * rad; b[k++] = pz + dz * rad; b[k++] = dx; b[k++] = dy; b[k++] = dz;
        b[k++] = 0.2; b[k++] = 0.1; b[k++] = 0.04; b[k++] = 0.98; b[k++] = 0; b[k++] = 0; b[k++] = 0.5; b[k++] = 0;
      }
    }
    return { buf: b, idx: S.sidx };
  }

  function pour(r, p, time, o) {
    o = o || {};
    var S = st(r), d = r.resize(), t = o.rm ? 0 : time;
    var visW = VIS_H * d.w / Math.max(1, d.h);
    var k = clamp(visW / 3.6, 0.62, 1.15), kx = clamp(visW / 4.0, 0.7, 1.15);
    var roast = sm(seg(p, 0.2, 0.5));
    var spread = sm(seg(p, 0.22, 0.46)) * (1 - sm(seg(p, 0.5, 0.6))), u = 1 - spread;
    var sbo = sm(seg(p, 0.22, 0.3)) * (1 - sm(seg(p, 0.54, 0.6)));
    var morph = sm(seg(p, 0.56, 0.72)), settle = sm(seg(p, 0.62, 0.76)), tilt = sm(seg(p, 0.64, 0.8));
    var spin = t * 0.8 + TAU * sm(seg(p, 0.2, 0.5)), rest = -0.55;
    var ang = ((spin % TAU) + TAU) % TAU, dl = ((((rest - ang + PI) % TAU) + TAU) % TAU) - PI;
    var ry = ang + dl * settle + 0.1 * Math.sin(t * 0.7) * settle;
    var rx = lerp(-0.2, 0.86, tilt), rz = lerp(-0.45, 0, sm(seg(p, 0.5, 0.64)));
    var wide = visW > 3.7, yawF = -0.5;
    var ksl = wide ? 0.82 : 0.64, extL = 0.45 + 3.18 * ksl * Math.cos(yawF), extR = 1.7;
    var mugS = clamp(visW / (extL + extR + 0.3), 0.62, 1.12);
    var s = lerp(1.2 * k, mugS, morph);
    var kin = sm(seg(p, 0.68, 0.78));
    var cxk = (extR - extL) / 2;                       // centre of the mug + kettle composition, in mug units
    var pos = [lerp(-0.33 * mugS * settle, -cxk * mugS, kin), 0.05 * Math.sin(t * 1.1) * (1 - morph) - 0.5 * s * kin, 0];
    var R = K.rot(rx, ry, rz), F = K.rot(rx, yawF, rz);
    function toW(v) { var q = K.mulVec(F, [v[0] * s, v[1] * s, v[2] * s]); return [pos[0] + q[0], pos[1] + q[1], pos[2] + q[2]]; }

    r.begin({ time: time });
    // table shadow first (it sits under everything)
    if (morph > 0.9) {
      var Lf = norm3(K.mulVecT(F, KEY));
      r.draw({ mesh: 'disc', mode: 7, rot: F, pos: toW([-Lf[0] * 0.22, -0.742, -Lf[2] * 0.22]), s: 1.55 * s, alpha: 0.65 * morph });
    }
    if (sbo > 0.004) {
      for (var i = 0; i < BATCH.length; i++) {
        var bb = BATCH[i];
        r.draw({
          a: 'bean', q: 'lo', pos: [bb[0] * kx * spread, bb[1] * kx * spread, bb[2] * spread - 0.4 * u],
          rx: bb[3] + u * (2.4 + i * 0.17) + p * 0.9 + t * 0.2, ry: bb[4] + u * (3.1 - i * 0.11) + p * 1.3 + t * (0.3 + i * 0.02), rz: bb[5] + u * 1.7,
          s: bb[6] * k, roast: clamp(roast + ((i * 37) % 11 - 5) * 0.012, 0, 1), alpha: sbo, seed: i + 1,
        });
      }
    }
    r.draw({ a: 'bean', b: 'mug', q: 'hi', m: morph, wave: 0.7, blob: 0.08, rot: R, pos: pos, s: s, roast: roast, seed: 7 });
    if (morph > 0.55) r.draw({ mesh: 'handle', rot: R, pos: pos, s: s * sm(seg(morph, 0.55, 0.9)) });

    // ---- the pour
    var lv = sm(seg(p, 0.8, 0.945));
    var ly = lerp(K.MUG_BOTTOM + 0.02, K.MUG_RIM_IN - 0.16, lv) - K.MUG_MID;                 // liquid height (mug-local, centred)
    var rIn = lerp(0.715, 0.875, (ly + K.MUG_MID - 0.12) / (1.36 - 0.12)) - 0.012;
    var flow = sm(seg(p, 0.79, 0.83)) * (1 - sm(seg(p, 0.935, 0.955)));
    var head = sm(seg(p, 0.785, 0.812)), tail = sm(seg(p, 0.948, 0.97));
    var foamK = sm(seg(p, 0.82, 0.985)) * 0.9;
    var imp = [0.05, 0];
    if (morph > 0.98 && kin > 0.002) {
      // kettle pose: tilt about the spout lip; the lip hovers so that the arc lands in the middle of the cup
      var theta = kf(p, [[0.70, 0.0], [0.78, 0.16], [0.82, 0.44], [0.94, 0.6], [0.968, 0.2], [1.0, 0.0]]);
      var ct = Math.cos(theta), sn = Math.sin(theta);
      var dir0 = [K.KETTLE_DIR[0] * ct + K.KETTLE_DIR[1] * sn, -K.KETTLE_DIR[0] * sn + K.KETTLE_DIR[1] * ct];
      var speed = 0.55 + 0.5 * flow, v0 = [dir0[0] * speed, dir0[1] * speed], g = 3.4;
      var tipY = kf(p, [[0.70, 2.5], [0.78, 1.75], [0.945, 1.7], [0.995, 2.7]]);
      var H = tipY - ly, tauHit = (v0[1] + Math.sqrt(v0[1] * v0[1] + 2 * g * H)) / g;
      var pourBlend = sm(seg(p, 0.77, 0.81)) * (1 - sm(seg(p, 0.945, 0.97)));
      var tipX = lerp(kf(p, [[0.70, -3.6], [0.78, -0.45], [0.945, -0.45], [0.995, -3.6]]), imp[0] - v0[0] * tauHit, pourBlend);
      var tl = [K.KETTLE_TIP[0] * ksl, K.KETTLE_TIP[1] * ksl];
      var og = [tipX - (tl[0] * ct + tl[1] * sn), tipY - (-tl[0] * sn + tl[1] * ct), 0];
      var Rk = K.mul(F, K.rot(0, 0, -theta));
      r.draw({ mesh: 'kettle', rot: Rk, pos: toW(og), s: s * ksl });
      // stream along a parabola from the lip
      if (head > 0.01 && tail < 0.99 && (flow > 0.02 || tail > 0)) {
        if (!S.stream) S.stream = r.dyn(20 * 11, 19 * 10 * 6);
        var tip = [tipX, tipY, 0], sm0 = streamMesh(S, tip, v0, g, tauHit, head, tail, 0.034 * Math.sqrt(Math.max(flow, 0.3)), time);
        r.setDyn(S.stream, sm0.buf, sm0.idx);
        r.draw({ dyn: S.stream, mode: 4, rot: F, pos: toW([0, 0, 0]), s: s });
        imp = [tip[0] + v0[0] * tauHit, 0];
      }
      // splash droplets where the stream lands
      if (flow > 0.12 && head > 0.95) {
        var nd = Math.floor(22 * flow);
        for (var q = 0; q < nd; q++) {
          var life = 0.5 + 0.3 * hash(q, 1), a = (((t * 1.3 + q * 0.618) % 1) * life), ang2 = q * 2.4, vup = 0.9 + 1.0 * hash(q, 2), vh = 0.2 + 0.4 * hash(q, 3);
          var dy = vup * a - 0.5 * 4.4 * a * a;
          if (dy < 0) continue;
          var rr = 0.016 + 0.02 * hash(q, 4);
          r.draw({ mesh: 'sphere', mode: 4, rot: F, pos: toW([imp[0] + Math.cos(ang2) * vh * a, ly + dy, Math.sin(ang2) * vh * a]), s: rr * s, alpha: 1 - a / life * 0.4 });
        }
      }
    }
    if (morph > 0.98 && lv > 0.001) {
      r.draw({ mesh: 'disc', mode: 3, rot: F, pos: toW([0, ly, 0]), s: rIn * s, pour: flow * (head > 0.9 ? 1 : head), foam: foamK, impact: [imp[0] / rIn, imp[1] / rIn], seed: 3 });
    }
    // steam rises from the cup once there is hot coffee in it
    var steamK = sm(seg(p, 0.84, 0.97)) * (0.4 + 0.6 * lv);
    if (morph > 0.98 && steamK > 0.01) {
      for (var n = 0; n < 30; n++) {
        var age = (t * 0.17 + n / 30) % 1, sw = Math.sin(age * 5.5 + n * 1.7) * (0.06 + 0.2 * age);
        var sz = (0.2 + 0.6 * age) * s, al = steamK * Math.pow(Math.sin(PI * age), 1.4) * 0.5;
        r.draw({ mesh: 'quad1', mode: 6, rot: ID3, pos: toW([sw, 0.78 + age * 1.9, Math.cos(age * 4 + n) * 0.1]), s: sz, alpha: al, seed: n * 0.37 });
      }
    }
  }

  /* -------------------------------------------------------------- delivery */
  // van speed along the route: slow in the corners, eases in and out, so scroll time -> distance is not linear
  function speedProfile(C) {
    var n = C.route.length, psi = [], kap = [], v = [], i;
    for (i = 0; i < n; i++) { var a = C.route[Math.max(0, i - 1)], b = C.route[Math.min(n - 1, i + 1)]; psi.push(Math.atan2(-(b[1] - a[1]), b[0] - a[0])); }
    for (i = 0; i < n; i++) {
      var i0 = Math.max(0, i - 5), i1 = Math.min(n - 1, i + 5), dpsi = ((psi[i1] - psi[i0] + PI) % TAU + TAU) % TAU - PI;
      kap.push(dpsi / Math.max(1e-6, C.cum[i1] - C.cum[i0]));
    }
    for (i = 0; i < n; i++) {
      var e = sm(clamp(C.cum[i] / 2.2, 0, 1)) * sm(clamp((C.total - C.cum[i]) / 3.0, 0, 1));
      v.push((0.38 + 0.62 * Math.exp(-1.5 * Math.abs(kap[i]))) * Math.max(0.12, e));
    }
    var T = [0];
    for (i = 1; i < n; i++) T.push(T[i - 1] + (C.cum[i] - C.cum[i - 1]) / ((v[i - 1] + v[i]) / 2));
    var tot = T[n - 1];
    function at(u) { // progress 0..1 (time) -> index + fraction
      var tt = clamp(u, 0, 1) * tot, lo = 0, hi = n - 1;
      while (hi - lo > 1) { var m = (lo + hi) >> 1; if (T[m] <= tt) lo = m; else hi = m; }
      return [lo, (tt - T[lo]) / Math.max(1e-9, T[hi] - T[lo])];
    }
    return {
      at: function (u) {
        var q = at(u), lo = q[0], hi = Math.min(n - 1, lo + 1), f = q[1];
        var s = lerp(C.cum[lo], C.cum[hi], f), vv = lerp(v[lo], v[hi], f), kk = lerp(kap[lo], kap[hi], f);
        var dv = (v[hi] - v[lo]) / Math.max(1e-6, C.cum[hi] - C.cum[lo]);
        return { s: s, v: vv, k: kk, a: vv * dv };
      },
    };
  }
  var LOOPS = [ // traffic: closed paths on the roads, right-hand lane
    { pts: [[-3.17, -8.83], [3.17, -8.83], [3.17, -3.17], [-3.17, -3.17]], car: 'car1', speed: 0.55, off: 0.0 },
    { pts: [[8.83, 3.17], [8.83, 8.83], [3.17, 8.83], [3.17, 3.17]], car: 'car0', speed: 0.5, off: 0.3 },
    { pts: [[-8.83, -3.17], [-3.17, -3.17], [-3.17, 3.17], [-8.83, 3.17]], car: 'car2', speed: 0.6, off: 0.55 },
    { pts: [[3.17, -8.83], [8.83, -8.83], [8.83, -3.17], [3.17, -3.17]], car: 'car3', speed: 0.45, off: 0.8 },
  ];
  function loopPose(L, t) {
    var P = L.pts, n = P.length, tot = 0, seg = [], i;
    for (i = 0; i < n; i++) { var a = P[i], b = P[(i + 1) % n]; seg.push(Math.hypot(b[0] - a[0], b[1] - a[1])); tot += seg[i]; }
    var d = (((t * L.speed + L.off * tot * 0.2) % tot) + tot) % tot;
    for (i = 0; i < n; i++) { if (d <= seg[i]) break; d -= seg[i]; }
    var a2 = P[i], b2 = P[(i + 1) % n], f = d / seg[i], dx = (b2[0] - a2[0]) / seg[i], dz = (b2[1] - a2[1]) / seg[i];
    // round the corners a little by easing the heading near the end of a segment
    return { x: lerp(a2[0], b2[0], f), z: lerp(a2[1], b2[1], f), ang: Math.atan2(-dz, dx) };
  }

  function delivery(r, p, time, o) {
    o = o || {};
    var S = st(r), d = r.resize(), t = o.rm ? 0 : time;
    var visW = VIS_H * d.w / Math.max(1, d.h), k = clamp(visW / 3.6, 0.62, 1.15);
    var C = K.makeCity();
    if (!S.rb) S.rb = r.ribbon(C.route, 0.34);
    if (!S.prof) S.prof = speedProfile(C);
    var ca = sm(seg(p, 0.2, 0.34)), dolly = sm(seg(p, 0.24, 0.44));
    var m = sm(seg(p, 0.22, 0.4)), vanSolid = sm(seg(m, 0.86, 1.0));
    var rt = sm(seg(p, 0.44, 0.76)), glide = sm(seg(p, 0.76, 0.9)), arrive = glide;
    var zoomIn = sm(seg(p, 0.9, 0.965));                         // closer on the doorstep for the hand-over
    var Sc = lerp(0.06, 0.46, dolly) * (1 + 1.15 * arrive) * (1 + 0.45 * zoomIn);
    var vanS = 0.55 * Sc, bagS = 1.25 * k, objS = lerp(bagS, vanS, dolly);
    var tilt = lerp(lerp(0.75, 0.95, dolly), 0.5, arrive), yaw = lerp(-0.7, -0.2, rt) + (PI / 2 + 0.2) * arrive;
    var Rw = K.mul(K.rot(tilt, 0, 0), K.rot(0, yaw, 0)), up = K.mulVec(Rw, [0, 1, 0]);

    // van along the road
    var pose = S.prof.at(rt), pa = K.pathAt(C, pose.s / C.total), pb = K.pathAt(C, Math.min(1, (pose.s + 0.25) / C.total)), pc = K.pathAt(C, Math.max(0, (pose.s - 0.25) / C.total));
    var psi = Math.atan2(-(pb.z - pc.z), pb.x - pc.x);
    var vx = pa.x, vz = pa.z;
    var roll = clamp(pose.k * pose.v * pose.v * 0.06, -0.05, 0.05) * vanSolid, pitch = clamp(pose.a * 0.18, -0.05, 0.05) * vanSolid;
    var bump = 0.004 * Math.sin(pose.s * 7.3) * Math.sin(pose.s * 2.1) * vanSolid;
    var steer = clamp(Math.atan(1.1 * pose.k), -0.5, 0.5);
    var braking = pose.a < -0.03 ? 1 : 0;
    // camera target glides from the van to the porch
    var porch = [9.8, -7.45];
    var tx = lerp(lerp(vx, porch[0], glide), 10.2, zoomIn), tz = lerp(lerp(vz, porch[1], glide), -7.95, zoomIn);
    var m2 = m * (1 - 0);
    var lift = objS * lerp(0.92, 0.60, m);
    function W(x, y, z) { var q = K.mulVec(Rw, [(x - tx) * Sc, y * Sc, (z - tz) * Sc]); return [q[0] - up[0] * lift, q[1] - up[1] * lift, q[2] - up[2] * lift]; }
    function Wl(x, y, z, lf) { var q = W(x, y, z); return [q[0] + up[0] * lf, q[1] + up[1] * lf, q[2] + up[2] * lf]; }

    // heading: the pouch spins, the van follows the road
    var spin = t * 0.9, vv = K.mulVecT(Rw, [0, 0, 1]), face = Math.atan2(vv[0], vv[2]);
    var hold = sm(seg(p, 0.02, 0.06)) * (1 - sm(seg(p, 0.17, 0.21)));
    var angBag = lerpAng(spin, face - 0.12, hold);
    var ang = lerpAng(angBag, psi, sm(seg(p, 0.32, 0.44)));
    var Rbody = K.mul(K.rot(0, ang, 0), K.mul(K.rot(roll, 0, 0), K.rot(0, 0, pitch)));
    var Robj = K.mul(Rw, Rbody);
    var objPos = Wl(vx, 0, vz, lift + bump * objS);

    var key = norm3(KEY), keyC = K.mulVecT(Rw, key), ld = [-keyC[0], -keyC[2]], ll = Math.hypot(ld[0], ld[1]) || 1;
    var EM = [0.9, braking ? 0.95 : 0.3];
    var items = [];
    function add(it) { if (!it.emis) it.emis = EM; items.push(it); }

    // ---- city
    if (ca > 0.003) {
      add({ mesh: 'quad', mode: 1, rot: Rw, pos: W(0, 0, 0), s: Sc, alpha: ca, ldl: [keyC[0], keyC[1], keyC[2]] });
      var reveal = clamp(pose.s / C.total, 0, 1) + 0.002;
      items.push({ ribbon: true, rot: Rw, pos: W(0, 0, 0), s: Sc, alpha: ca, reveal: reveal });
      add({ mesh: 'city', rot: Rw, pos: W(0, 0, 0), s: Sc, grow: clamp(ca * 1.0, 0, 1), sway: 1, seed: 1 });
      // the two houses
      var Rh = K.mul(Rw, K.rot(0, -PI / 2, 0)), Rwk = K.mul(Rw, K.rot(0, PI / 2, 0));
      add({ mesh: 'houseW', rot: Rwk, pos: W(C.workshop[0], 0, C.workshop[1]), s: 1.3 * Sc, grow: clamp(ca * 1.6 - 0.2, 0, 1) });
      add({ mesh: 'houseH', rot: Rh, pos: W(C.home[0], 0, C.home[1]), s: 1.3 * Sc, grow: clamp(ca * 1.6 - 0.2, 0, 1) });
      var doorAng = -1.3 * sm(seg(p, 0.905, 0.94));
      var hing = [C.home[0] - 1.3 * 0.7, 0.06 * 1.3, C.home[1] + 1.3 * (-0.17)];
      add({ mesh: 'houseDoor', rot: K.mul(Rh, K.rot(0, doorAng, 0)), pos: W(hing[0], hing[1], hing[2]), s: 1.3 * Sc });
      // traffic
      if (!o.rm) LOOPS.forEach(function (L) {
        var lp = loopPose(L, t);
        add({ mesh: L.car, rot: K.mul(Rw, K.rot(0, lp.ang, 0)), pos: W(lp.x, 0.075 * 0.55, lp.z), s: 0.55 * Sc * 0.95 });
      });
    }

    // ---- the pouch / the van
    var bagAlpha = 1;
    var stampK = sm(seg(p, 0.098, 0.106)) * 1;
    add({ a: 'bag', b: 'van', q: 'hi', m: m, wave: 0.6, blob: 0.07, rot: Robj, pos: objPos, s: objS, decal: true, stamp: stampK, paper: 1, fadeOut: vanSolid >= 0.999 ? 1 : vanSolid, alpha: vanSolid >= 0.999 ? 0 : 1, emis: EM });
    if (vanSolid > 0.002) {
      add({ mesh: 'vanD', rot: Robj, pos: objPos, s: objS, decal: true, fadeIn: vanSolid, emis: EM });
      var ws = sm(seg(m, 0.8, 1));
      var rollA = pose.s / (0.31 * 0.87 * 0.55);
      K.VAN_WHEELS.forEach(function (w, wi) {
        [1, -1].forEach(function (zz) {
          var off = K.mulVec(Robj, [w[0] * objS, w[1] * objS, zz * 0.5 * objS]);
          var steerA = wi === 1 ? steer : 0;
          add({ mesh: 'wheel', rot: K.mul(Robj, K.mul(K.rot(0, steerA, 0), K.rot(0, 0, -rollA))), pos: add3(objPos, off), s: 0.87 * objS * ws, emis: EM });
        });
      });
    }
    // ---- the date stamp pressing onto the label
    var stampPres = sm(seg(p, 0.03, 0.06)) * (1 - sm(seg(p, 0.15, 0.18)));
    if (stampPres > 0.01 && m < 0.05) {
      var hgt = kf(p, [[0.03, 2.6], [0.065, 0.55], [0.092, 0.55], [0.10, 0.0], [0.112, 0.0], [0.13, 0.55], [0.18, 2.6]]);
      var loc = [0.13, -0.25, 0.32 + hgt];
      var off2 = K.mulVec(Robj, [loc[0] * objS, loc[1] * objS, loc[2] * objS]);
      add({ mesh: 'stamp', rot: K.mul(Robj, K.mul(K.rot(PI / 2, 0, 0), K.rot(0, 0, 0.16))), pos: add3(objPos, off2), s: objS * 0.9 });
    }

    // ---- the courier brings the pouch to the door
    var cP = sm(seg(p, 0.8, 0.83));
    if (p > 0.795) {
      var WP = [[9.52, -6.78], [9.7, -7.9], [10.0, -8.2]], segL = [Math.hypot(WP[1][0] - WP[0][0], WP[1][1] - WP[0][1]), Math.hypot(WP[2][0] - WP[1][0], WP[2][1] - WP[1][1])], totL = segL[0] + segL[1];
      var walkIn = sm(seg(p, 0.835, 0.9)), walkOut = sm(seg(p, 0.968, 1.0)), knock = seg(p, 0.9, 0.925), place = sm(seg(p, 0.935, 0.965));
      function wpAt(dd) { // distance along the path
        dd = clamp(dd, 0, totL);
        if (dd <= segL[0]) { var f = dd / segL[0]; return [lerp(WP[0][0], WP[1][0], f), lerp(WP[0][1], WP[1][1], f)]; }
        var g2 = (dd - segL[0]) / segL[1]; return [lerp(WP[1][0], WP[2][0], g2), lerp(WP[1][1], WP[2][1], g2)];
      }
      var dNow = walkIn * totL - walkOut * segL[1] * 0.8;
      var cpos = wpAt(dNow), cx = cpos[0], cz = cpos[1];
      var cA = wpAt(dNow - 0.04), cB = wpAt(dNow + 0.04);
      var moving = (walkIn > 0.001 && walkIn < 0.999) || (walkOut > 0.001 && walkOut < 0.999);
      var phase = dNow / 0.11 * 3.14;
      var headC = Math.atan2(cB[0] - cA[0], cB[1] - cA[1]);
      if (!moving) headC = walkOut > 0.5 ? lerpAng(PI / 2, -PI / 2.6, sm(seg(p, 0.962, 0.985))) : (walkIn >= 0.999 ? PI / 2 : headC);
      var cs = 0.55, swing = moving ? Math.sin(phase) * 0.55 : 0, bob = moving ? Math.abs(Math.sin(phase)) * 0.018 : 0;
      var Rc = K.mul(Rw, K.rot(0, headC, 0)), bend = 0.5 * place * (1 - sm(seg(p, 0.955, 0.972)));
      var Rt = K.mul(Rc, K.rot(bend, 0, 0));
      var b0 = Wl(cx, 0, cz, lift);
      function cAt(lx, ly, lz, R) { return add3(b0, K.mulVec(R, [lx * cs * Sc, ly * cs * Sc, lz * cs * Sc])); }
      var fade = cP < 0.999 ? cP : 1, cscale = cs * Sc;
      add({ mesh: 'cBody', rot: Rt, pos: cAt(0, bob, 0, Rc), s: cscale, fadeIn: fade });
      [[0.075, 1], [-0.075, -1]].forEach(function (l) { add({ mesh: 'cLeg', rot: K.mul(Rc, K.rot(swing * l[1], 0, 0)), pos: cAt(l[0], 0.41 + bob, 0, Rc), s: cscale, fadeIn: fade }); });
      // right arm carries the pouch, knocks, then lowers it onto the mat; the left arm swings and waves at the end
      var carry = 1 - sm(seg(p, 0.938, 0.962));
      var armRight = moving ? -0.9 * carry - swing * 0.35 * (1 - carry) : (-0.9 * carry + ((knock > 0 && knock < 1) ? (-0.5 + Math.sin(knock * PI * 6) * 0.25) * carry : 0) + 0.7 * (1 - carry));
      var wave = sm(seg(p, 0.978, 0.99));
      var armLeft = moving ? swing * 0.8 : (-0.1 - wave * 2.3 + Math.sin(t * 7) * 0.25 * wave);
      add({ mesh: 'cArm', rot: K.mul(Rt, K.rot(armLeft, 0, 0)), pos: cAt(-0.19, 0.7, 0, Rt), s: cscale, fadeIn: fade });
      var shoulderR = cAt(0.19, 0.7, 0, Rt), Rarm = K.mul(Rt, K.rot(armRight, 0, 0));
      add({ mesh: 'cArm', rot: Rarm, pos: shoulderR, s: cscale, fadeIn: fade });
      // the pouch: in the hand while carried, then on the doormat
      var hand = add3(shoulderR, K.mulVec(Rarm, [0, -0.36 * cscale, 0.06 * cscale]));
      var matW = Wl(C.home[0] - 1.3 * 0.89, 0.1 * 1.3, C.home[1], 0.92 * 0.13 * Sc);
      var bagS2 = 0.13 * Sc;
      var bagPosW = [lerp(hand[0], matW[0], place), lerp(hand[1], matW[1], place) + Math.sin(place * PI) * 0.1 * Sc, lerp(hand[2], matW[2], place)];
      var bagYaw = lerpAng(headC, face, sm(seg(place, 0.4, 1)));
      add({ a: 'bag', q: 'hi', rot: K.mul(Rw, K.rot(0, bagYaw, 0)), pos: bagPosW, s: bagS2, decal: true, stamp: 1, paper: 1, fadeIn: fade });
    }

    // ---- shadows then the frame
    var shadowOn = ca > 0.05 && o.shadows !== false;
    if (shadowOn && r.beginShadow({ dir: key, center: [0, 0, 0], radius: 6.5, depth: 10, time: time })) {
      items.forEach(function (it) { if (!it.ribbon) r.draw(it); });
      r.endShadow();
    }
    r.begin({ time: time, shadow: shadowOn, shBias: [0.01, 0.0014] });
    items.forEach(function (it) { if (it.ribbon) r.drawRibbon(S.rb, it); else r.draw(it); });
  }

  global.KvScenes = { hero: hero, preview: preview, pour: pour, delivery: delivery, PREVIEW_ROAST: PREVIEW_ROAST };
})(typeof window !== 'undefined' ? window : this);
