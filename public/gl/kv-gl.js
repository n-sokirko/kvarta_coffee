/* kv-gl.js (core) — a small WebGL1 renderer for the Kvarta site.
   One shared (theta, phi) grid is baked into several shapes (bean, mug, coffee bag, delivery van, house),
   so any shape can morph into any other by vertex interpolation. Plus a lit city ground, buildings, a route ribbon,
   liquid and a pour. No dependencies.
   window.KvGL.create(canvas, opts) -> renderer | null */
(function (global) {
  'use strict';
  var PI = Math.PI;

  /* ------------------------------------------------------------------ math */
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function smoothstep(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function mix(a, b, t) { return a + (b - a) * t; }

  function rotMat3(rx, ry, rz) { // R = Rz * Rx * Ry, column-major
    var cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
    return new Float32Array([
      cz * cy - sz * sx * sy, sz * cy + cz * sx * sy, -cx * sy,
      -sz * cx, cz * cx, sx,
      cz * sy + sz * sx * cy, sz * sy - cz * sx * cy, cx * cy]);
  }
  function mat3mul(A, B) { // A * B, column-major
    var o = new Float32Array(9);
    for (var c = 0; c < 3; c++) for (var r = 0; r < 3; r++) {
      o[c * 3 + r] = A[r] * B[c * 3] + A[3 + r] * B[c * 3 + 1] + A[6 + r] * B[c * 3 + 2];
    }
    return o;
  }
  function mulVec(R, v) {
    return [R[0] * v[0] + R[3] * v[1] + R[6] * v[2], R[1] * v[0] + R[4] * v[1] + R[7] * v[2], R[2] * v[0] + R[5] * v[1] + R[8] * v[2]];
  }
  function mulVecT(R, v) { // R^T * v
    return [R[0] * v[0] + R[1] * v[1] + R[2] * v[2], R[3] * v[0] + R[4] * v[1] + R[5] * v[2], R[6] * v[0] + R[7] * v[1] + R[8] * v[2]];
  }
  function perspective(fovy, aspect, n, f) {
    var t = 1 / Math.tan(fovy / 2);
    return new Float32Array([t / aspect, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]);
  }

  /* ------------------------------------------------------- shared param grid */
  // vertex layout (14 floats): pos3 nor3 col3 gloss | bean groove h decal
  var STRIDE = 14;
  var GRIDS = {};
  function getGrid(q) {
    if (GRIDS[q]) return GRIDS[q];
    var nu = q === 'hi' ? 200 : 64, nv = q === 'hi' ? 150 : 48;
    var cols = nu + 1, rows = nv + 1, th = new Float64Array(cols), ph = new Float64Array(rows), eps = 0.004;
    for (var i = 0; i < cols; i++) {
      var tau = -PI + 2 * PI * i / nu;
      th[i] = PI / 2 + tau * (0.25 + 0.75 * Math.pow(Math.abs(tau) / PI, 2));
    }
    for (var j = 0; j < rows; j++) ph[j] = eps + (PI - 2 * eps) * j / nv;
    var idx = new Uint16Array(nu * nv * 6), m = 0;
    for (j = 0; j < nv; j++) for (i = 0; i < nu; i++) {
      var a = j * cols + i, b = a + 1, c = a + cols, d = c + 1;
      idx[m++] = a; idx[m++] = c; idx[m++] = b; idx[m++] = b; idx[m++] = c; idx[m++] = d;
    }
    return (GRIDS[q] = { nu: nu, nv: nv, cols: cols, rows: rows, th: th, ph: ph, idx: idx });
  }
  function dirOf(th, ph, o) { var sp = Math.sin(ph); o[0] = sp * Math.cos(th); o[1] = Math.cos(ph); o[2] = sp * Math.sin(th); }

  function normalsAnalytic(g, posFn, N) {
    var h = 0.0007, a = [0, 0, 0], b = [0, 0, 0], c = [0, 0, 0], d = [0, 0, 0];
    for (var j = 0; j < g.rows; j++) for (var i = 0; i < g.cols; i++) {
      posFn(g.th[i] + h, g.ph[j], a); posFn(g.th[i] - h, g.ph[j], b);
      posFn(g.th[i], g.ph[j] + h, c); posFn(g.th[i], g.ph[j] - h, d);
      var tx = a[0] - b[0], ty = a[1] - b[1], tz = a[2] - b[2], ux = c[0] - d[0], uy = c[1] - d[1], uz = c[2] - d[2];
      var nx = ty * uz - tz * uy, ny = tz * ux - tx * uz, nz = tx * uy - ty * ux, l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      var k = (j * g.cols + i) * 3;
      N[k] = nx / l; N[k + 1] = ny / l; N[k + 2] = nz / l;
    }
  }
  function normalsGrid(g, P, N) {
    var cols = g.cols, rows = g.rows, nu = g.nu;
    for (var j = 0; j < rows; j++) {
      var j0 = Math.max(0, j - 1), j1 = Math.min(rows - 1, j + 1);
      for (var i = 0; i < cols; i++) {
        var ii = i % nu, ia = (ii + 1) % nu, ib = (ii - 1 + nu) % nu;
        var a = (j * cols + ia) * 3, b = (j * cols + ib) * 3;
        var c = (j1 * cols + ii) * 3, d = (j0 * cols + ii) * 3;
        var tx = P[a] - P[b], ty = P[a + 1] - P[b + 1], tz = P[a + 2] - P[b + 2];
        var ux = P[c] - P[d], uy = P[c + 1] - P[d + 1], uz = P[c + 2] - P[d + 2];
        var nx = ty * uz - tz * uy, ny = tz * ux - tx * uz, nz = tx * uy - ty * ux, l = Math.sqrt(nx * nx + ny * ny + nz * nz);
        var k = (j * cols + i) * 3;
        if (l < 1e-9) { N[k] = 0; N[k + 1] = 0; N[k + 2] = 0; } else { N[k] = nx / l; N[k + 1] = ny / l; N[k + 2] = nz / l; }
      }
    }
    // poles: use the mean of the neighbouring ring
    [0, rows - 1].forEach(function (j) {
      var jr = j === 0 ? 1 : rows - 2, sx = 0, sy = 0, sz = 0;
      for (var i = 0; i < nu; i++) { var k = (jr * cols + i) * 3; sx += N[k]; sy += N[k + 1]; sz += N[k + 2]; }
      var l = Math.sqrt(sx * sx + sy * sy + sz * sz) || 1;
      for (i = 0; i < cols; i++) { var kk = (j * cols + i) * 3; N[kk] = sx / l; N[kk + 1] = sy / l; N[kk + 2] = sz / l; }
    });
  }
  function smoothGrid(g, P, iters) {
    var cols = g.cols, rows = g.rows, nu = g.nu, T = new Float32Array(P.length);
    for (var it = 0; it < iters; it++) {
      T.set(P);
      for (var j = 1; j < rows - 1; j++) for (var i = 0; i < nu; i++) {
        var k = (j * cols + i) * 3, a = (j * cols + (i + 1) % nu) * 3, b = (j * cols + (i - 1 + nu) % nu) * 3, c = ((j + 1) * cols + i) * 3, d = ((j - 1) * cols + i) * 3;
        for (var q = 0; q < 3; q++) T[k + q] = P[k + q] * 0.5 + 0.125 * (P[a + q] + P[b + q] + P[c + q] + P[d + q]);
      }
      for (j = 0; j < rows; j++) { var s = (j * cols + nu) * 3, z = (j * cols) * 3; T[s] = T[z]; T[s + 1] = T[z + 1]; T[s + 2] = T[z + 2]; }
      P.set(T);
    }
  }
  function pack(g, P, N, attr) {
    var n = g.cols * g.rows, buf = new Float32Array(n * STRIDE), o = [0, 0, 0, 0, 0, 0, 0, 0];
    for (var j = 0; j < g.rows; j++) for (var i = 0; i < g.cols; i++) {
      var v = j * g.cols + i, k = v * 3, b = v * STRIDE;
      attr(i, j, P[k], P[k + 1], P[k + 2], N[k], N[k + 1], N[k + 2], o);
      buf[b] = P[k]; buf[b + 1] = P[k + 1]; buf[b + 2] = P[k + 2];
      buf[b + 3] = N[k]; buf[b + 4] = N[k + 1]; buf[b + 5] = N[k + 2];
      buf[b + 6] = o[0]; buf[b + 7] = o[1]; buf[b + 8] = o[2]; buf[b + 9] = o[3];
      buf[b + 10] = o[4]; buf[b + 11] = o[5]; buf[b + 12] = j / (g.rows - 1); buf[b + 13] = o[7];
    }
    return buf;
  }
  function bakeAnalytic(g, posFn, attr, smooth) {
    var n = g.cols * g.rows, P = new Float32Array(n * 3), N = new Float32Array(n * 3), t = [0, 0, 0];
    for (var j = 0; j < g.rows; j++) for (var i = 0; i < g.cols; i++) { posFn(g.th[i], g.ph[j], t); var k = (j * g.cols + i) * 3; P[k] = t[0]; P[k + 1] = t[1]; P[k + 2] = t[2]; }
    if (smooth) { smoothGrid(g, P, smooth); normalsGrid(g, P, N); } else normalsAnalytic(g, posFn, N);
    return pack(g, P, N, attr);
  }

  /* ----------------------------------------------------------------- shapes */
  // a coffee bean: egg-shaped, flat face with an S-shaped crease, domed back
  var beanGroove = 0;
  function beanPoint(nx, ny, nz, out) {
    var A = 0.60, B = 1.0, CB = 0.50, CF = 0.30;
    var f = smoothstep(-0.15, 0.55, nz), c = CB + (CF - CB) * f;
    var zz = (nz < 0 ? -1 : 1) * Math.pow(Math.abs(nz), 1 - 0.32 * f) * c;
    var x = A * (1 - 0.07 * ny) * nx, y = B * ny, z = zz;
    var wf = smoothstep(0.08, 0.5, nz), cs = 0.07 * Math.sin(2.7 * y + 0.5), d = x - cs;
    var end = 1 - smoothstep(0.62, 0.93, Math.abs(ny)), gw = 0.024;
    var g = Math.exp(-(d * d) / (gw * gw)) * end * wf;
    var lip = Math.exp(-Math.pow((Math.abs(d) - 0.055) / 0.032, 2)) * end * wf;
    z += -0.115 * g + 0.02 * lip;
    x *= 1 + 0.03 * Math.sin(3.1 * ny + 1.3); z *= 1 + 0.04 * Math.sin(2.3 * nx + 4 * ny);
    out[0] = x; out[1] = y; out[2] = z;
    beanGroove = Math.exp(-(d * d) / (gw * gw * 6)) * end * wf;
  }
  function beanPos(th, ph, o) { var n = [0, 0, 0]; dirOf(th, ph, n); beanPoint(n[0], n[1], n[2], o); }
  function bakeBean(g) {
    var gr = new Float32Array(g.cols * g.rows), t = [0, 0, 0];
    for (var j = 0; j < g.rows; j++) for (var i = 0; i < g.cols; i++) { beanPos(g.th[i], g.ph[j], t); gr[j * g.cols + i] = beanGroove; }
    return bakeAnalytic(g, beanPos, function (i, j, x, y, z, nx, ny, nz, o) {
      o[0] = 0.42; o[1] = 0.26; o[2] = 0.14; o[3] = 0.3; o[4] = 1; o[5] = gr[j * g.cols + i]; o[7] = 0;
    });
  }

  // mug profile: inner bottom -> inner wall -> rim -> outer wall -> outer bottom (so that cross(dTheta,dPhi) points outward)
  var MUG_H = 1.48, MUG_MID = 0.74, MUG_BOTTOM = 0.10, MUG_RIM_IN = 1.38, profCache = null;
  function catmull(pts, perSeg) {
    var out = [], n = pts.length;
    for (var s = 0; s < n - 1; s++) {
      var p0 = pts[Math.max(0, s - 1)], p1 = pts[s], p2 = pts[s + 1], p3 = pts[Math.min(n - 1, s + 2)];
      for (var t = 0; t < perSeg; t++) {
        var u = t / perSeg, u2 = u * u, u3 = u2 * u;
        out.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
          0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3)]);
      }
    }
    out.push(pts[n - 1]);
    return out;
  }
  function getProfile() {
    if (profCache) return profCache;
    var inner = [[0, 0.1], [0.55, 0.1], [0.72, 0.125], [0.765, 0.2], [0.79, 0.45], [0.83, 0.9], [0.875, 1.36], [0.885, 1.43]];
    var rim = [[0.885, 1.43], [0.91, 1.468], [0.94, 1.478], [0.975, 1.455]];
    var outer = [[0.975, 1.455], [0.985, 1.4], [0.975, 1.3], [0.94, 0.9], [0.895, 0.4], [0.86, 0.1], [0.78, 0.02], [0.55, 0], [0, 0]];
    var pr = catmull(inner, 10), rr = catmull(rim, 8), orr = catmull(outer, 10), all = [], rimIdx = 0;
    pr.forEach(function (p) { all.push([p[0], p[1], 1]); });
    rr.forEach(function (p, i) { all.push([p[0], p[1], 1 - i / (rr.length - 1)]); });
    orr.forEach(function (p) { all.push([p[0], p[1], 0]); });
    var cum = [0];
    for (var i = 1; i < all.length; i++) cum.push(cum[i - 1] + Math.hypot(all[i][0] - all[i - 1][0], all[i][1] - all[i - 1][1]));
    return (profCache = { pts: all, cum: cum, total: cum[cum.length - 1] });
  }
  function profAt(t, out) {
    var P = getProfile(), s = clamp(t, 0, 1) * P.total, lo = 0, hi = P.cum.length - 1;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (P.cum[mid] <= s) lo = mid; else hi = mid; }
    var u = (s - P.cum[lo]) / Math.max(1e-9, P.cum[hi] - P.cum[lo]), a = P.pts[lo], b = P.pts[hi];
    out[0] = mix(a[0], b[0], u); out[1] = mix(a[1], b[1], u); out[2] = mix(a[2], b[2], u);
  }
  var MUG_OUT = [0.89, 0.34, 0.17], MUG_IN = [0.95, 0.91, 0.82];
  function mugPos(th, ph, o) {
    var pr = [0, 0, 0]; profAt(ph / PI, pr);
    o[0] = pr[0] * Math.cos(th); o[1] = pr[1] - MUG_MID; o[2] = pr[0] * Math.sin(th);
  }
  function bakeMug(g) {
    return bakeAnalytic(g, mugPos, function (i, j, x, y, z, nx, ny, nz, o) {
      var pr = [0, 0, 0]; profAt(g.ph[j] / PI, pr);
      var f = pr[2], yg = pr[1], ao = 1 - f * (1 - smoothstep(0.08, 1.35, yg)) * 0.6;   // the inside of the cup gets darker towards the bottom
      o[0] = mix(MUG_OUT[0], MUG_IN[0], f) * ao; o[1] = mix(MUG_OUT[1], MUG_IN[1], f) * ao; o[2] = mix(MUG_OUT[2], MUG_IN[2], f) * ao; o[3] = 0.95; o[4] = 0; o[5] = 0; o[7] = 0;
    });
  }

  function softPoly(n, planes, p) {
    var s = 0;
    for (var k = 0; k < planes.length; k++) { var pl = planes[k], den = (n[0] * pl[0] + n[1] * pl[1] + n[2] * pl[2]) / pl[3]; if (den > 0) s += Math.pow(den, p); }
    return 1 / Math.pow(s, 1 / p);
  }

  /* ------------------------------------------------- registry for extra shapes */
  var REG = {};
  function registerShape(name, fn) { REG[name] = fn; }

  /* ---------------------------------------- coffee pouch (kraft bag), detailed */
  // box pinched towards the top, with pleated side gussets, a rolled-over top, a metal tie and a valve on the back
  var BAG_PLANES = [[1, 0, 0, 0.62], [-1, 0, 0, 0.62], [0, 1, 0, 0.92], [0, -1, 0, 0.92], [0, 0, 1, 0.30], [0, 0, -1, 0.30],
    [0, 0.214, 0.977, 0.314], [0, 0.214, -0.977, 0.314], [0.7, 0.7, 0, 1.12], [-0.7, 0.7, 0, 1.12]];
  var BAG_INK = [0.085, 0.085, 0.092], BAG_INK_B = [0.07, 0.07, 0.077];
  function bagPos(th, ph, o) {
    var n = [0, 0, 0]; dirOf(th, ph, n);
    var r = softPoly(n, BAG_PLANES, 16), x = n[0] * r, y = n[1] * r, z = n[2] * r;
    var side = smoothstep(0.50, 0.60, Math.abs(x)) * (1 - smoothstep(0.64, 0.9, Math.abs(y)));
    x -= (x < 0 ? -1 : 1) * 0.055 * Math.exp(-(z * z) / 0.0049) * side;
    var sz = z < 0 ? -1 : 1, fz = smoothstep(0.02, 0.2, Math.abs(z));
    // верх пакета сплющен в плоский шов; под ним зип-молния: канавка и две дорожки
    z *= 1 - 0.86 * smoothstep(0.70, 0.86, y);
    z -= sz * 0.022 * Math.exp(-Math.pow((y - 0.585) / 0.011, 2)) * fz;
    z += sz * 0.016 * Math.exp(-Math.pow((y - 0.615) / 0.012, 2)) * fz;
    z += sz * 0.012 * Math.exp(-Math.pow((y - 0.66) / 0.010, 2)) * fz;
    // рифление термошва и мягкие складки плёнки
    z += sz * 0.006 * Math.sin(x * 64) * smoothstep(0.84, 0.87, y) * fz;
    z += sz * 0.011 * Math.sin(5.3 * x + 3.1 * y) * Math.sin(6.4 * y - 2.2 * x + 1.3) * smoothstep(-0.45, 0.45, y) * (1 - smoothstep(0.55, 0.7, y)) * fz;
    if (z < 0) z -= 0.022 * (1 - smoothstep(0.075, 0.09, Math.hypot(x, y - 0.38)));
    o[0] = x; o[1] = y; o[2] = z;
  }
  function bakeBag(g) {
    return bakeAnalytic(g, bagPos, function (i, j, x, y, z, nx, ny, nz, o) {
      var k = nz > 0 ? BAG_INK : BAG_INK_B, c = [k[0], k[1], k[2]], gl = 0.22, metal = 0;
      var zip = smoothstep(0.575, 0.585, y) * (1 - smoothstep(0.67, 0.68, y));
      if (zip > 0) { c = [mix(c[0], 0.25, zip), mix(c[1], 0.25, zip), mix(c[2], 0.26, zip)]; gl = mix(gl, 0.5, zip); }
      var seal = smoothstep(0.8, 0.86, y);
      if (seal > 0) { c = [mix(c[0], 0.11, seal), mix(c[1], 0.11, seal), mix(c[2], 0.115, seal)]; gl = mix(gl, 0.34, seal); }
      var vm = nz < 0 ? 1 - smoothstep(0.075, 0.09, Math.hypot(x, y - 0.38)) : 0;
      if (vm > 0) { c = [mix(c[0], 0.36, vm), mix(c[1], 0.36, vm), mix(c[2], 0.37, vm)]; gl = mix(gl, 0.6, vm); }
      o[0] = c[0]; o[1] = c[1]; o[2] = c[2]; o[3] = gl; o[4] = 0; o[5] = metal;
      o[7] = (nz > 0.55 && Math.abs(x) < 0.6 && y < 0.57) ? 1 : 0;
    });
  }

  /* ----------------------------------------------- delivery van (morph target) */
  // radial extrusion of the van's side profile: same silhouette as the detailed van mesh
  var VAN_POLY = [[-1.64, -0.50], [-1.64, 0.78], [0.40, 0.78], [0.46, 0.60], [0.90, 0.58], [1.36, 0.04], [1.68, -0.04], [1.70, -0.50]];
  var VAN_HZ = 0.56;
  function polyExit(dx, dy) { // first crossing of the ray (0,0)+t*(dx,dy) with the polygon (it is star-shaped around the origin)
    var best = 1e9, n = VAN_POLY.length;
    for (var i = 0; i < n; i++) {
      var a = VAN_POLY[i], b = VAN_POLY[(i + 1) % n], ex = b[0] - a[0], ey = b[1] - a[1];
      var den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-9) continue;
      var t = (a[0] * ey - a[1] * ex) / den, u = (a[0] * dy - a[1] * dx) / den;
      if (t > 1e-6 && u >= -1e-6 && u <= 1 + 1e-6 && t < best) best = t;
    }
    return best;
  }
  function vanRadius(n) {
    var m = Math.hypot(n[0], n[1]), rz = Math.abs(n[2]) > 1e-6 ? VAN_HZ / Math.abs(n[2]) : 1e9;
    if (m < 1e-6) return rz;
    return Math.min(polyExit(n[0] / m, n[1] / m) / m, rz);
  }
  var VAN_PAINT = [0.94, 0.93, 0.89], FLAME = [0.89, 0.34, 0.17];
  function bakeVan(g) {
    var n = g.cols * g.rows, P = new Float32Array(n * 3), N = new Float32Array(n * 3), d = [0, 0, 0];
    for (var j = 0; j < g.rows; j++) for (var i = 0; i < g.cols; i++) {
      dirOf(g.th[i], g.ph[j], d); var r = vanRadius(d), k = (j * g.cols + i) * 3;
      P[k] = d[0] * r; P[k + 1] = d[1] * r; P[k + 2] = d[2] * r;
    }
    smoothGrid(g, P, g === GRIDS.hi ? 7 : 4);
    normalsGrid(g, P, N);
    return pack(g, P, N, function (i, j, x, y, z, nx, ny, nz, o) {
      var c = [VAN_PAINT[0], VAN_PAINT[1], VAN_PAINT[2]], gl = 0.78;
      var stripe = smoothstep(-0.34, -0.30, y) * (1 - smoothstep(-0.16, -0.12, y)) * (1 - smoothstep(0.1, 0.2, Math.abs(ny)));
      c = [mix(c[0], FLAME[0], stripe), mix(c[1], FLAME[1], stripe), mix(c[2], FLAME[2], stripe)];
      var cab = smoothstep(0.48, 0.54, x) * smoothstep(0.02, 0.08, y) * (1 - smoothstep(0.46, 0.52, y));
      var front = smoothstep(0.35, 0.6, nx) * smoothstep(0.9, 1.1, x);
      var glass = cab * Math.max(smoothstep(0.35, 0.6, Math.abs(nz)), smoothstep(0.3, 0.55, nx)) * (front * 0 + 1);
      c = [mix(c[0], 0.07, glass), mix(c[1], 0.09, glass), mix(c[2], 0.12, glass)]; gl = mix(gl, 0.97, glass);
      var trim = 1 - smoothstep(-0.46, -0.38, y);
      c = [mix(c[0], 0.14, trim), mix(c[1], 0.14, trim), mix(c[2], 0.16, trim)]; gl = mix(gl, 0.3, trim);
      o[0] = c[0]; o[1] = c[1]; o[2] = c[2]; o[3] = gl; o[4] = 0; o[5] = 0; o[7] = 0;
    });
  }

  /* ------------------------------------------------------- simple meshes */
  function meshFrom(verts, idx) { return { buf: new Float32Array(verts), idx: new Uint16Array(idx) }; }
  function bakeHandle() {
    var path = catmull([[0.90, 1.18], [1.22, 1.23], [1.56, 1.04], [1.64, 0.7], [1.48, 0.42], [1.14, 0.3], [0.86, 0.3]], 9);
    var ring = 14, rows = path.length, cols = ring + 1, v = [], idx = [];
    for (var j = 0; j < rows; j++) {
      var a = path[Math.max(0, j - 1)], b = path[Math.min(rows - 1, j + 1)];
      var tx = b[0] - a[0], ty = b[1] - a[1], l = Math.sqrt(tx * tx + ty * ty) || 1; tx /= l; ty /= l;
      var nx = ty, ny = -tx, rr = 0.085 - 0.012 * Math.sin(PI * j / (rows - 1));
      for (var i = 0; i < cols; i++) {
        var th = 2 * PI * i / ring, ct = Math.cos(th), st = Math.sin(th), ex = nx * ct, ey = ny * ct, ez = st;
        var qx = ex / 1.15, qy = ey / 1.15, qz = ez / 0.8, ql = Math.sqrt(qx * qx + qy * qy + qz * qz) || 1;
        v.push(path[j][0] + ex * rr * 1.15, path[j][1] - MUG_MID + ey * rr * 1.15, ez * rr * 0.8, qx / ql, qy / ql, qz / ql, MUG_OUT[0], MUG_OUT[1], MUG_OUT[2], 0.95, 0, 0, 0.5, 0);
      }
    }
    for (j = 0; j < rows - 1; j++) for (i = 0; i < ring; i++) { var aa = j * cols + i, bb = aa + 1, cc = aa + cols, dd = cc + 1; idx.push(aa, cc, bb, bb, cc, dd); }
    return meshFrom(v, idx);
  }
  function bakeDisc() {
    var rings = 24, seg = 72, cols = seg + 1, v = [], idx = [];
    for (var j = 0; j <= rings; j++) for (var i = 0; i < cols; i++) {
      var th = 2 * PI * i / seg, r = j / rings; v.push(r * Math.cos(th), 0, r * Math.sin(th), 0, 1, 0, 0.2, 0.1, 0.05, 0.95, 0, 0, 0.5, 0);
    }
    for (j = 0; j < rings; j++) for (i = 0; i < seg; i++) { var a = j * cols + i, b = a + 1, c = a + cols, d = c + 1; idx.push(a, c, b, b, c, d); }
    return meshFrom(v, idx);
  }
  function bakeSphere() {
    var seg = 16, rings = 10, cols = seg + 1, v = [], idx = [];
    for (var j = 0; j <= rings; j++) for (var i = 0; i < cols; i++) {
      var ph = PI * j / rings, th = 2 * PI * i / seg, x = Math.sin(ph) * Math.cos(th), y = Math.cos(ph), z = Math.sin(ph) * Math.sin(th);
      v.push(x, y, z, x, y, z, 0.3, 0.15, 0.07, 0.95, 0, 0, 0.5, 0);
    }
    for (j = 0; j < rings; j++) for (i = 0; i < seg; i++) { var a = j * cols + i, b = a + 1, c = a + cols, d = c + 1; idx.push(a, c, b, b, c, d); }
    return meshFrom(v, idx);
  }
  function bakeQuad() {
    var s = 40, v = [];
    [[-s, -s], [s, -s], [-s, s], [s, s]].forEach(function (p) { v.push(p[0], 0, p[1], 0, 1, 0, 1, 1, 1, 0, 0, 0, 0.5, 0); });
    return meshFrom(v, [0, 2, 1, 1, 2, 3]);
  }
  function bakeQuad1() { // unit billboard / decal quad in the XY plane
    var v = [];
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (p) { v.push(p[0], p[1], 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0.5, 0); });
    return meshFrom(v, [0, 1, 2, 2, 1, 3]);
  }
  // a flat ribbon along a polyline; vertex.h = distance along the route (0..1), vertex.decal = lateral coordinate (-1..1)
  function bakeRibbon(pts, width) {
    var cum = [0];
    for (var i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    var total = cum[cum.length - 1], v = [], idx = [];
    for (i = 0; i < pts.length; i++) {
      var a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], tx = b[0] - a[0], tz = b[1] - a[1], l = Math.hypot(tx, tz) || 1;
      var nx = -tz / l, nz = tx / l, hw = width / 2, along = cum[i] / total;
      v.push(pts[i][0] + nx * hw, 0.03, pts[i][1] + nz * hw, 0, 1, 0, 1, 1, 1, 0, 0, 0, along, -1);
      v.push(pts[i][0] - nx * hw, 0.03, pts[i][1] - nz * hw, 0, 1, 0, 1, 1, 1, 0, 0, 0, along, 1);
    }
    for (i = 0; i < pts.length - 1; i++) { var q = i * 2; idx.push(q, q + 1, q + 2, q + 2, q + 1, q + 3); }
    return { mesh: meshFrom(v, idx), total: total, cum: cum };
  }

  var BAKED = {};
  function baked(name, q) {
    var key = name + ':' + (REG[name] ? '' : (q || ''));
    if (BAKED[key]) return BAKED[key];
    var g = q && !REG[name] ? getGrid(q) : null, res;
    if (REG[name]) res = REG[name]();
    else switch (name) {
      case 'bean': res = { buf: bakeBean(g), idx: g.idx }; break;
      case 'mug': res = { buf: bakeMug(g), idx: g.idx }; break;
      case 'bag': res = { buf: bakeBag(g), idx: g.idx }; break;
      case 'van': res = { buf: bakeVan(g), idx: g.idx }; break;
      case 'handle': res = bakeHandle(); break;
      case 'disc': res = bakeDisc(); break;
      case 'sphere': res = bakeSphere(); break;
      case 'quad': res = bakeQuad(); break;
      case 'quad1': res = bakeQuad1(); break;
      default: throw new Error('unknown shape ' + name);
    }
    return (BAKED[key] = res);
  }

  /* ------------------------------------------------------------- decal atlas */
  // Canvas2D art for the decals. Atlas (1024x1024) regions in px: bag label 0,0..600,890; van logo; workshop sign.
  var ATLAS = { logo: [620, 0, 1020, 200], sign: [620, 230, 1020, 430], box: [620, 450, 1020, 850], band: [620, 860, 1020, 1020] };
  function drawDecals() {
    var mk = function () { var c = document.createElement('canvas'); c.width = 1024; c.height = 1024; return c; };
    var lab = mk(), stp = mk(), a = lab.getContext('2d'), b = stp.getContext('2d');
    var DISPLAY = '"Podkova","Rockwell","Roboto Slab",Georgia,serif', MONO = '"IBM Plex Mono",ui-monospace,Consolas,monospace';
    // bag label card
    a.fillStyle = '#f8f1e3'; a.fillRect(70, 190, 460, 540);
    a.strokeStyle = 'rgba(31,22,16,.25)'; a.lineWidth = 2; a.strokeRect(84, 204, 432, 512);
    a.fillStyle = 'rgba(31,22,16,.92)'; a.textAlign = 'center';
    a.font = '800 104px ' + DISPLAY; a.fillText('Кварта', 300, 330);
    a.font = '500 22px ' + MONO; a.fillStyle = '#55463a'; a.fillText('ОБЖАРКА · МИНСК', 300, 380);
    a.fillStyle = '#1f1610'; a.fillRect(120, 410, 360, 3);
    a.save(); a.translate(300, 505); a.scale(1, 1.35);
    a.fillStyle = '#c28a46'; a.beginPath(); a.ellipse(0, 0, 44, 52, 0, 0, 2 * PI); a.fill();
    a.strokeStyle = '#1f1610'; a.lineWidth = 6; a.lineCap = 'round'; a.beginPath(); a.moveTo(0, -46); a.bezierCurveTo(24, -22, -24, -8, 0, 12); a.bezierCurveTo(14, 24, -10, 34, 0, 44); a.stroke();
    a.restore();
    a.fillStyle = '#1f1610'; a.font = '700 56px ' + DISPLAY; a.fillText('Эфиопия', 300, 630); a.fillText('Иргачеффе', 300, 690);
    a.font = '500 30px ' + MONO; a.fillText('250 г', 300, 724);
    // van side logo (transparent background)
    var L = ATLAS.logo;
    a.save(); a.translate(L[0], L[1]);
    a.fillStyle = '#e2562b'; a.textAlign = 'left'; a.font = '800 92px ' + DISPLAY; a.fillText('Кварта', 76, 118);
    a.fillStyle = '#1f1610'; a.font = '500 22px ' + MONO; a.fillText('ОБЖАРКА · МИНСК', 78, 160);
    a.translate(38, 100); a.scale(1, 1.3); a.fillStyle = '#c28a46'; a.beginPath(); a.ellipse(0, 0, 22, 26, 0, 0, 2 * PI); a.fill();
    a.strokeStyle = '#1f1610'; a.lineWidth = 3.5; a.lineCap = 'round'; a.beginPath(); a.moveTo(0, -23); a.bezierCurveTo(12, -11, -12, -4, 0, 6); a.bezierCurveTo(7, 12, -5, 17, 0, 22); a.stroke();
    a.restore();
    // workshop sign
    var Sg = ATLAS.sign;
    a.save(); a.translate(Sg[0], Sg[1]);
    a.fillStyle = '#1f1610'; a.fillRect(0, 20, 400, 150);
    a.strokeStyle = '#f8f1e3'; a.lineWidth = 4; a.strokeRect(10, 30, 380, 130);
    a.fillStyle = '#f8f1e3'; a.textAlign = 'center'; a.font = '800 84px ' + DISPLAY; a.fillText('Кварта', 200, 112);
    a.font = '500 22px ' + MONO; a.fillStyle = '#f0a07e'; a.fillText('ОБЖАРКА КОФЕ', 200, 146);
    a.restore();
    // коробка дрип-пакетов, лицевая сторона
    var Bx = ATLAS.box;
    a.save(); a.translate(Bx[0], Bx[1]);
    a.fillStyle = '#eadfc4'; a.fillRect(0, 0, 400, 400);
    a.strokeStyle = '#1f1610'; a.lineWidth = 5; a.strokeRect(16, 16, 368, 368);
    a.fillStyle = '#1f1610'; a.textAlign = 'left'; a.font = '800 92px ' + DISPLAY; a.fillText('Кварта', 38, 118);
    a.font = '500 20px ' + MONO; a.fillStyle = '#55463a'; a.fillText('ОБЖАРКА · МИНСК', 42, 152);
    a.fillStyle = '#1f1610'; a.fillRect(40, 176, 320, 3);
    a.font = '700 50px ' + DISPLAY; a.fillStyle = '#1f1610'; a.fillText('Дрип-', 38, 246); a.fillText('пакеты', 38, 298);
    a.font = '500 20px ' + MONO; a.fillStyle = '#55463a'; a.fillText('АССОРТИ · 12 Г', 42, 338);
    a.fillStyle = '#e2562b'; a.beginPath(); a.arc(305, 285, 58, 0, 2 * PI); a.fill();
    a.fillStyle = '#f8f1e3'; a.textAlign = 'center'; a.font = '800 66px ' + DISPLAY; a.fillText('10', 305, 292);
    a.font = '500 17px ' + MONO; a.fillText('ПАКЕТОВ', 305, 320);
    a.restore();
    // лента на лицевой стороне дрип-пакета
    var Bd = ATLAS.band;
    a.save(); a.translate(Bd[0], Bd[1]);
    a.fillStyle = '#f3ecdc'; a.fillRect(0, 0, 400, 160);
    a.fillStyle = '#e2562b'; a.fillRect(0, 0, 400, 12); a.fillRect(0, 148, 400, 12);
    a.textAlign = 'left'; a.fillStyle = '#1f1610'; a.font = '800 78px ' + DISPLAY; a.fillText('Кварта', 28, 98);
    a.font = '500 21px ' + MONO; a.fillStyle = '#55463a'; a.fillText('ДРИП · 12 Г · ЭФИОПИЯ', 30, 132);
    a.translate(335, 82); a.scale(1, 1.3); a.fillStyle = '#c28a46'; a.beginPath(); a.ellipse(0, 0, 26, 30, 0, 0, 2 * PI); a.fill();
    a.strokeStyle = '#1f1610'; a.lineWidth = 4; a.lineCap = 'round'; a.beginPath(); a.moveTo(0, -27); a.bezierCurveTo(14, -13, -14, -5, 0, 7); a.bezierCurveTo(8, 14, -6, 20, 0, 26); a.stroke();
    a.restore();
    // stamp layer (same mapping as the bag label)
    b.save(); b.translate(360, 560); b.rotate(-0.16);
    b.fillStyle = 'rgba(248,241,227,.0)'; b.fillRect(-170, -62, 340, 124);
    b.lineWidth = 8; b.strokeStyle = '#b8421d'; b.strokeRect(-170, -62, 340, 124);
    b.fillStyle = '#b8421d'; b.textAlign = 'center'; b.font = '500 38px ' + MONO;
    b.fillText('ОБЖАРЕНО', 0, -8); b.fillText('В ЧЕТВЕРГ', 0, 40);
    b.restore();
    // a little ink speckle so the stamp looks pressed, not printed
    var img = b.getImageData(0, 0, 1024, 1024), d = img.data, s = 7;
    for (var i = 3; i < d.length; i += 4) { if (d[i] > 0) { s = (s * 9301 + 49297) % 233280; if (s / 233280 > 0.82) d[i] = d[i] * 0.55; } }
    b.putImageData(img, 0, 0);
    return { label: lab, stamp: stp };
  }

  /* --------------------------------------------------------------- shaders */
  var VS = `
attribute vec3 aPA; attribute vec3 aNA; attribute vec4 aCA; attribute vec4 aXA;
attribute vec3 aPB; attribute vec3 aNB; attribute vec4 aCB; attribute vec4 aXB;
uniform mat3 uRot; uniform vec3 uPos; uniform vec3 uStretch; uniform float uScale;
uniform mat4 uProj; uniform vec3 uCam; uniform float uMorph; uniform float uWave; uniform float uBlob;
uniform float uTime; uniform float uGrow; uniform float uSway;
varying vec3 vN; varying vec3 vW; varying vec3 vO; varying vec4 vPAB; varying vec4 vC; varying vec4 vX; varying vec3 vKM;
void main(){
  float mv = clamp(uMorph*(1.0+uWave) - uWave*aXA.z, 0.0, 1.0);
  mv = mv*mv*(3.0-2.0*mv);
  vec3 n = normalize(mix(aNA, aNB, mv) + 1e-6);
  vec3 p = mix(aPA, aPB, mv) + n * uBlob * sin(mv*3.14159265);
  float k = aXA.w;
  if (uGrow < 0.999) { float g = clamp((uGrow*1.7 - aXA.z)/0.9, 0.0, 1.0); g = g*g*(3.0-2.0*g); p.y *= g; }
  if (uSway > 0.0 && k > 4.5 && k < 5.5) {
    p.x += sin(uTime*1.4 + p.z*2.3 + p.x*1.7) * 0.03 * aXA.y * uSway;
    p.z += cos(uTime*1.1 + p.x*2.1) * 0.02 * aXA.y * uSway;
  }
  vec3 w = uRot * (p * uStretch * uScale) + uPos;
  vW = w; vN = uRot * n; vO = p; vPAB = vec4(aPA.xy, aPB.xy);
  vC = mix(aCA, aCB, mv); vX = mix(aXA, aXB, mv); vKM = vec3(aXA.w, aXB.w, mv);
  gl_Position = uProj * vec4(w - uCam, 1.0);
}`;

  var FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec3 vN; varying vec3 vW; varying vec3 vO; varying vec4 vPAB; varying vec4 vC; varying vec4 vX; varying vec3 vKM;
uniform mat3 uRot; uniform vec3 uCam; uniform float uAlpha; uniform float uTime; uniform float uMode;
uniform float uRoast; uniform float uSeed; uniform vec3 uBase; uniform vec3 uStretch;
uniform float uPour; uniform float uStamp; uniform float uReveal; uniform float uDecal; uniform float uPaper;
uniform float uFoam; uniform vec2 uImpact; uniform vec2 uEmis; uniform vec2 uFade;
uniform sampler2D uTexL; uniform sampler2D uTexS; uniform sampler2D uTexSh;
uniform mat4 uLM; uniform float uShOn; uniform vec2 uShBias; uniform float uShTexel;
uniform vec3 uLdl; uniform vec3 uSP;

vec3 keyDir(){ return normalize(vec3(-0.55, 0.78, 0.62)); }
vec3 fillDir(){ return normalize(vec3(0.85, 0.15, 0.45)); }
vec3 rimDir(){ return normalize(vec3(0.25, 0.55, -0.85)); }
vec3 hash3(vec3 p){ p = vec3(dot(p,vec3(127.1,311.7,74.7)), dot(p,vec3(269.5,183.3,246.1)), dot(p,vec3(113.5,271.9,124.6))); return -1.0 + 2.0*fract(sin(p)*43758.5453123); }
float hash1(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
vec2 hash2(vec2 p){ return vec2(hash1(p), hash1(p + 19.19)); }
vec4 gnoise(vec3 x){
  vec3 i = floor(x); vec3 w = fract(x);
  vec3 u = w*w*w*(w*(w*6.0-15.0)+10.0);
  vec3 du = 30.0*w*w*(w*(w-2.0)+1.0);
  vec3 ga = hash3(i+vec3(0.0,0.0,0.0)); vec3 gb = hash3(i+vec3(1.0,0.0,0.0)); vec3 gc = hash3(i+vec3(0.0,1.0,0.0)); vec3 gd = hash3(i+vec3(1.0,1.0,0.0));
  vec3 ge = hash3(i+vec3(0.0,0.0,1.0)); vec3 gf = hash3(i+vec3(1.0,0.0,1.0)); vec3 gg = hash3(i+vec3(0.0,1.0,1.0)); vec3 gh = hash3(i+vec3(1.0,1.0,1.0));
  float va = dot(ga, w-vec3(0.0,0.0,0.0)); float vb = dot(gb, w-vec3(1.0,0.0,0.0)); float vc = dot(gc, w-vec3(0.0,1.0,0.0)); float vd = dot(gd, w-vec3(1.0,1.0,0.0));
  float ve = dot(ge, w-vec3(0.0,0.0,1.0)); float vf = dot(gf, w-vec3(1.0,0.0,1.0)); float vg = dot(gg, w-vec3(0.0,1.0,1.0)); float vh = dot(gh, w-vec3(1.0,1.0,1.0));
  float v = va + u.x*(vb-va) + u.y*(vc-va) + u.z*(ve-va) + u.x*u.y*(va-vb-vc+vd) + u.y*u.z*(va-vc-ve+vg) + u.z*u.x*(va-vb-ve+vf) + u.x*u.y*u.z*(-va+vb+vc-vd+ve-vf-vg+vh);
  vec3 d = ga + u.x*(gb-ga) + u.y*(gc-ga) + u.z*(ge-ga) + u.x*u.y*(ga-gb-gc+gd) + u.y*u.z*(ga-gc-ge+gg) + u.z*u.x*(ga-gb-ge+gf) + u.x*u.y*u.z*(-ga+gb+gc-gd+ge-gf-gg+gh)
    + du * (vec3(vb-va,vc-va,ve-va) + u.yzx*vec3(va-vb-vc+vd,va-vc-ve+vg,va-vb-ve+vf) + u.zxy*vec3(va-vb-ve+vf,va-vb-vc+vd,va-vc-ve+vg) + u.yzx*u.zxy*(-va+vb+vc-vd+ve-vf-vg+vh));
  return vec4(v, d);
}
vec4 packDepth(float d){ vec4 enc = vec4(1.0,255.0,65025.0,16581375.0)*d; enc = fract(enc); enc -= enc.yzww*vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0); return enc; }
float unpackDepth(vec4 c){ return dot(c, vec4(1.0,1.0/255.0,1.0/65025.0,1.0/16581375.0)); }
float shadowAt(vec3 wp, vec3 N){
  if (uShOn < 0.5) return 1.0;
  vec4 ls = uLM * vec4(wp + N*uShBias.x, 1.0);
  vec3 c = ls.xyz*0.5 + 0.5;
  if (c.x < 0.0 || c.x > 1.0 || c.y < 0.0 || c.y > 1.0 || c.z > 1.0) return 1.0;
  float cur = c.z - uShBias.y, s = 0.0;
  for (int i = -1; i <= 1; i++) {
    for (int j = -1; j <= 1; j++) {
      s += step(cur, unpackDepth(texture2D(uTexSh, c.xy + vec2(float(i), float(j))*uShTexel)));
    }
  }
  return s/9.0;
}
vec3 envMap(vec3 R){
  vec3 k = keyDir();
  vec3 sky = mix(vec3(0.07,0.06,0.055), vec3(0.85,0.87,0.93), smoothstep(-0.35, 0.95, R.y));
  float box = smoothstep(0.80, 0.93, dot(R, k));
  float box2 = smoothstep(0.86, 0.95, dot(R, fillDir()));
  return sky + vec3(2.4,2.2,1.9)*box*0.55 + vec3(0.8,1.0,1.3)*box2*0.25;
}
vec3 lightRig(vec3 N, vec3 V, vec3 alb, float gloss, float shin, float ao, float metal, float sh){
  vec3 K = keyDir(), F2 = fillDir(), RM = rimDir();
  float d1 = max(dot(N,K),0.0)*sh, d2 = max(dot(N,F2),0.0), d3 = max(dot(N,RM),0.0);
  vec3 amb = mix(vec3(0.10,0.075,0.055), vec3(0.26,0.29,0.36), N.y*0.5+0.5);
  vec3 diff = alb * (vec3(1.0,0.93,0.82)*2.3*d1 + vec3(0.55,0.66,0.85)*0.55*d2 + vec3(1.0,0.78,0.55)*1.3*d3*0.6 + amb) * ao * (1.0 - metal);
  vec3 H1 = normalize(K+V), H2 = normalize(F2+V), H3 = normalize(RM+V);
  float norm = (shin + 8.0) / 60.0;
  float s1 = pow(max(dot(N,H1),0.0), shin) * norm * sh;
  float s2 = pow(max(dot(N,H2),0.0), shin*0.7) * norm * 0.25;
  float s3 = pow(max(dot(N,H3),0.0), shin*0.8) * norm * 0.45;
  vec3 spec = (vec3(1.0,0.93,0.82)*2.3*s1 + vec3(0.55,0.66,0.85)*0.55*s2 + vec3(1.0,0.78,0.55)*1.3*s3) * gloss * 0.35 * mix(vec3(1.0), alb*1.6, metal);
  float nv = max(dot(N,V),0.0);
  float F = mix(0.035 + 0.965*pow(1.0-nv, 5.0), 0.5 + 0.5*pow(1.0-nv, 4.0), metal);
  vec3 env = envMap(reflect(-V, N)) * mix(vec3(1.0), alb*1.5, metal);
  return diff + spec*ao + env*F*gloss*ao*1.15;
}
vec3 finish(vec3 col){ col = col/(1.0+0.16*col); return pow(col, vec3(1.0/2.2)); }
vec3 roastCol(float r){
  vec3 c0 = vec3(0.50,0.57,0.37), c1 = vec3(0.77,0.65,0.33), c2 = vec3(0.55,0.35,0.17), c3 = vec3(0.34,0.19,0.095), c4 = vec3(0.15,0.075,0.04);
  vec3 c = mix(c0, c1, smoothstep(0.0,0.28,r));
  c = mix(c, c2, smoothstep(0.28,0.52,r));
  c = mix(c, c3, smoothstep(0.52,0.76,r));
  return mix(c, c4, smoothstep(0.76,1.0,r));
}
float band(float x, float c, float w){ return 1.0 - smoothstep(w-0.04, w+0.04, abs(x-c)); }
float sdBox(vec2 p, vec2 h){ vec2 d = abs(p)-h; return length(max(d,0.0)) + min(max(d.x,d.y),0.0); }

// ---------------------------------------------------------------- ground (the city map)
void groundShade(vec3 V){
  vec2 p = vO.xz;
  float rw = 0.36;
  float vr = 0.0; float hr = 0.0; float vs = 0.0; float hs = 0.0;
  for (int i = 0; i < 4; i++) {
    float c = -9.0 + 6.0*float(i);
    vr = max(vr, band(p.x, c, rw)); hr = max(hr, band(p.y, c, rw));
    vs = max(vs, band(p.x, c, rw + 0.17)); hs = max(hs, band(p.y, c, rw + 0.17));
  }
  float roads = max(vr, hr), walk = max(vs, hs);
  float rz = -0.9 + 0.9*sin(p.x*0.32+0.6);
  float rd = abs(p.y - rz);
  float river = 1.0 - smoothstep(0.88, 1.0, rd);
  float park = max(1.0 - smoothstep(-0.08,0.08,sdBox(p-vec2(-6.0,-6.0), vec2(2.3,2.3))), 1.0 - smoothstep(-0.08,0.08,sdBox(p-vec2(6.0,6.0), vec2(2.3,2.3))));
  vec3 base = vec3(0.90,0.86,0.77);
  float gn = gnoise(vec3(p*2.2, 0.0)).x;
  base *= 0.97 + 0.05*gn;
  vec3 grass = mix(vec3(0.60,0.72,0.44), vec3(0.67,0.78,0.50), 0.5 + 0.5*gnoise(vec3(p*5.0, 1.0)).x);
  base = mix(base, grass, park*0.95);
  base = mix(base, vec3(0.80,0.76,0.67), walk*0.95);
  vec3 asphalt = vec3(0.60,0.60,0.62) * (0.96 + 0.06*gnoise(vec3(p*9.0, 2.0)).x);
  // lane markings and zebra crossings
  float lineV = 0.0; float lineH = 0.0; float zebra = 0.0;
  for (int i = 0; i < 4; i++) {
    float c = -9.0 + 6.0*float(i);
    lineV = max(lineV, (1.0 - smoothstep(0.012, 0.03, abs(p.x - c))) * step(0.55, fract(p.y*1.1)));
    lineH = max(lineH, (1.0 - smoothstep(0.012, 0.03, abs(p.y - c))) * step(0.55, fract(p.x*1.1)));
    for (int j = 0; j < 4; j++) {
      float z = -9.0 + 6.0*float(j);
      float inV = (1.0 - smoothstep(rw - 0.06, rw, abs(p.x - c))) * step(rw + 0.1, abs(p.y - z)) * step(abs(p.y - z), rw + 0.4);
      float inH = (1.0 - smoothstep(rw - 0.06, rw, abs(p.y - z))) * step(rw + 0.1, abs(p.x - c)) * step(abs(p.x - c), rw + 0.4);
      zebra = max(zebra, max(inV * step(0.5, fract((p.x - c)*3.4)), inH * step(0.5, fract((p.y - z)*3.4))));
    }
  }
  float inter = vr * hr;
  vec3 road = asphalt;
  road = mix(road, vec3(0.93,0.91,0.84), max(lineV, lineH) * (1.0 - inter) * 0.85);
  road = mix(road, vec3(0.92,0.92,0.9), zebra * 0.8);
  base = mix(base, road, roads);
  // river with animated ripples and sun glints
  vec4 wn = gnoise(vec3(p.x*1.5 - uTime*0.30, p.y*1.7, uTime*0.22));
  vec4 wn2 = gnoise(vec3(p.x*3.3 + uTime*0.18, p.y*3.1 - uTime*0.12, 3.0));
  vec3 wN = normalize(vec3(wn.y*0.22 + wn2.y*0.1, 1.0, wn.w*0.22 + wn2.w*0.1));
  vec3 Ll = normalize(uLdl), Vl = normalize(V*uRot);
  float glint = pow(max(dot(wN, normalize(Ll+Vl)), 0.0), 110.0);
  vec3 water = mix(vec3(0.38,0.60,0.72), vec3(0.58,0.78,0.86), 0.5 + 0.5*wn.x);
  water = mix(water, vec3(0.80,0.90,0.94), pow(1.0 - max(dot(wN,Vl),0.0), 3.0)*0.5) + glint*vec3(1.0,0.95,0.85)*0.9;
  water = mix(water, vec3(0.86,0.92,0.92), smoothstep(0.70, 0.9, rd/1.0) * 0.45);
  base = mix(base, water, river);
  // bridge deck where a road crosses the river
  float bridge = roads * river;
  float rail = max(max(band(p.x,-9.0,rw+0.015)-band(p.x,-9.0,rw-0.05),0.0), max(max(band(p.x,-3.0,rw+0.015)-band(p.x,-3.0,rw-0.05),0.0), max(max(band(p.x,3.0,rw+0.015)-band(p.x,3.0,rw-0.05),0.0), max(band(p.x,9.0,rw+0.015)-band(p.x,9.0,rw-0.05),0.0))));
  base = mix(base, vec3(0.45,0.40,0.35), clamp(rail,0.0,1.0)*river*0.85);
  base = mix(base, vec3(0.74,0.72,0.70), bridge*0.55*(1.0 - clamp(rail,0.0,1.0)));
  vec3 N = normalize(vN);
  float sh = shadowAt(vW, N);
  vec3 lit = base * mix(vec3(0.58,0.64,0.80), vec3(1.04,1.0,0.94), sh);
  float a = 1.0 - smoothstep(14.0, 23.0, length(p));
  gl_FragColor = vec4(lit*a*uAlpha, a*uAlpha);
}
void routeShade(){
  if (vX.z > uReveal) discard;
  float lat = abs(vX.w);
  vec3 col = mix(vec3(0.93,0.33,0.13), vec3(1.0,0.93,0.82), smoothstep(0.62, 0.88, lat));
  col *= 0.94 + 0.08*sin(vX.z*140.0 - uTime*4.0);
  gl_FragColor = vec4(col*uAlpha, uAlpha);
}
void steamShade(){
  vec2 q = vO.xy;
  float r = length(q);
  float n = gnoise(vec3(q*2.4 + uSeed*13.0, uTime*0.4)).x*0.5 + 0.5;
  float n2 = gnoise(vec3(q*5.0 - uSeed*7.0, uTime*0.7)).x*0.5 + 0.5;
  float a = smoothstep(1.0, 0.12, r); a = a*a*(0.25 + 0.9*n)*(0.6 + 0.6*n2) * uAlpha;
  gl_FragColor = vec4(vec3(0.97,0.94,0.90)*a, a);
}
void blobShade(){
  float r = length(vO.xz);
  float a = smoothstep(1.0, 0.0, r); a = a*a*uAlpha*0.55;
  gl_FragColor = vec4(0.0, 0.0, 0.0, a);
}

// ---------------------------------------------------------------- coffee surface with foam
void liquidShade(vec3 V, vec3 N0){
  vec2 q = vO.xz;
  float rad = length(q);
  vec2 d = q - uImpact; float dr = length(d);
  vec2 dir = dr > 0.001 ? d/dr : vec2(0.0);
  float w1 = sin(dr*34.0 - uTime*9.0)*exp(-dr*2.6);
  float w2 = sin(dr*17.0 - uTime*5.5 + 1.3)*exp(-dr*1.5);
  float dw = (cos(dr*34.0 - uTime*9.0)*34.0*exp(-dr*2.6) - 2.6*w1 + 0.55*(cos(dr*17.0 - uTime*5.5 + 1.3)*17.0*exp(-dr*1.5) - 1.5*w2)) * uPour;
  vec2 slope = dir*dw*0.0075 + vec2(cos(q.x*3.1 + uTime*2.1), cos(q.y*2.7 - uTime*1.7))*0.010*uPour;
  // foam: accumulates at the rim and around the stream
  float nz = gnoise(vec3(q*3.0, uSeed)).x*0.5 + 0.5;
  float rimF = smoothstep(0.55, 1.0, rad);
  float hitF = exp(-dr*3.4)*uPour;
  float foam = clamp(uFoam*(0.25 + 0.9*nz)*(0.35 + 0.65*rimF) + hitF*0.8, 0.0, 1.0);
  // bubbles
  vec2 bp = q*15.0; vec2 cell = floor(bp), f = fract(bp);
  float bub = 0.0; vec2 bn = vec2(0.0);
  for (int i = -1; i <= 1; i++) {
    for (int j = -1; j <= 1; j++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = hash2(cell + g);
      vec2 c = g + 0.15 + 0.7*o - f;
      float rr = 0.20 + 0.24*hash1(cell + g + 7.0);
      float m = smoothstep(rr, rr*0.78, length(c));
      if (m > bub) { bub = m; bn = -c/rr; }
    }
  }
  float fb = foam*bub;
  slope += bn*0.55*fb;
  vec3 N = normalize(uRot * normalize(vec3(-slope.x, 1.0, -slope.y)));
  vec3 coffee = vec3(0.12,0.055,0.025);
  vec3 crema = vec3(0.66,0.42,0.21)*(0.80 + 0.35*nz);
  vec3 alb = mix(coffee, crema, clamp(foam*0.85 + fb*0.25, 0.0, 1.0));
  alb = mix(alb, vec3(0.78,0.55,0.32), rimF*0.35*uFoam);
  alb = pow(alb, vec3(2.2));
  float gloss = mix(0.95, 0.5, foam);
  float ao = 1.0 - 0.35*smoothstep(0.7, 1.0, rad);
  vec3 col = finish(lightRig(N, V, alb, gloss, mix(220.0, 70.0, foam), ao, 0.0, 1.0));
  gl_FragColor = vec4(col*uAlpha, uAlpha);
}
void streamShade(vec3 V, vec3 N){
  vec3 alb = pow(vec3(0.20,0.095,0.04), vec3(2.2));
  float nv = abs(dot(N, V));
  vec3 lin = lightRig(N, V, alb, 0.98, 240.0, 1.0, 0.0, 1.0);
  lin += pow(vec3(0.55,0.28,0.10), vec3(2.2)) * pow(1.0 - nv, 1.6) * 1.8;
  gl_FragColor = vec4(finish(lin)*uAlpha, uAlpha);
}
// facade of a building: windows in a grid, lit ones are warm
vec3 facade(vec3 base, vec3 P, vec3 no, float seed, out float win, out float litW){
  float sideW = 1.0 - smoothstep(0.35, 0.6, abs(no.y));
  float u = abs(no.x) > abs(no.z) ? P.z : P.x;
  vec2 cell = vec2(0.34, 0.30);
  vec2 q = vec2(u, P.y) / cell;
  vec2 f = fract(q); vec2 id = floor(q);
  float glassM = step(0.24, f.x)*step(f.x, 0.76)*step(0.26, f.y)*step(f.y, 0.76)*step(0.5, id.y)*sideW;
  float frameM = step(0.17, f.x)*step(f.x, 0.83)*step(0.19, f.y)*step(f.y, 0.83)*step(0.5, id.y)*sideW*(1.0 - glassM);
  litW = step(0.84, hash1(id + floor(seed*91.0)));
  win = glassM;
  vec3 wall = base * (0.94 + 0.08*hash1(id*1.7 + seed));
  wall = mix(wall, base*0.78, frameM);
  vec3 glass = mix(vec3(0.20,0.28,0.36), vec3(0.50,0.64,0.76), smoothstep(0.2, 0.8, f.y)*0.5 + 0.2*hash1(id + 3.0));
  glass = mix(glass, vec3(1.0,0.82,0.48), litW*0.9);
  return mix(wall, glass, glassM);
}

void main(){
  if (uMode > 8.5) { gl_FragColor = packDepth(gl_FragCoord.z); return; }
  float dh = hash1(gl_FragCoord.xy*1.37 + 0.5);
  if (dh < uFade.x || dh >= uFade.y) discard;
  vec3 V = normalize(uCam - vW);
  if (uMode > 0.5 && uMode < 1.5) { groundShade(V); return; }
  if (uMode > 1.5 && uMode < 2.5) { routeShade(); return; }
  if (uMode > 5.5 && uMode < 6.5) { steamShade(); return; }
  if (uMode > 6.5 && uMode < 7.5) { blobShade(); return; }
  vec3 N = normalize(vN);
  if (dot(N,V) < 0.0) N = -N;
  if (uMode > 2.5 && uMode < 3.5) { liquidShade(V, N); return; }
  if (uMode > 3.5 && uMode < 4.5) { streamShade(V, N); return; }
  float kA = floor(vKM.x + 0.5), kB = floor(vKM.y + 0.5);
  vec3 alb = vC.rgb * uBase; float gloss = vC.a; float ao = 1.0; float shin = 60.0; float metal = 0.0; float emis = 0.0; float decalA = 1.0;
  float bean = clamp(vX.x, 0.0, 1.0);
  if (bean < 0.01 && kA < 0.5) metal = clamp(vX.y, 0.0, 1.0);
  // ---- coffee bean (unchanged look)
  if (bean > 0.01) {
    vec3 Nw = N;
    vec3 sc = vec3(1.0, 0.5, 1.0);
    vec3 P = vO*sc + uSeed*17.31;
    vec4 a = gnoise(P*4.0); vec4 b = gnoise(P*11.0 + 5.1); vec4 c = gnoise(P*30.0 + 2.7);
    float rough = smoothstep(0.12, 0.62, uRoast);
    float rd = max(1.0 - abs(b.x*2.2), 0.0);
    vec3 grd = -sign(b.x) * 2.2 * b.yzw * 11.0 * sc;
    vec3 g = a.yzw*4.0*sc*0.5 + grd*0.55*rough + c.yzw*30.0*sc*0.10;
    float h = 0.5 + 0.30*a.x + 0.34*rd*(0.35+0.65*rough) + 0.10*c.x;
    float bump = mix(0.006, 0.013, rough) * bean;
    g = uRot * g;
    vec3 bN = normalize(Nw - bump*(g - dot(g,Nw)*Nw));
    vec3 ba = roastCol(uRoast) * uBase;
    ba *= 0.70 + 0.55*h;
    ba *= 0.90 + 0.20*gnoise(vO*2.1 + uSeed*5.0).x;
    float cg = smoothstep(0.22, 0.8, vX.y);
    float flake = gnoise(vO*vec3(34.0,20.0,34.0)).x*0.5 + 0.5;
    vec3 chaff = vec3(0.58,0.45,0.29)*(0.55+0.65*flake)*mix(1.0,0.5,rough);
    ba = mix(ba, chaff, cg*0.70);
    float bg = mix(0.34, 0.10, smoothstep(0.0,0.4,uRoast));
    bg = mix(bg, 0.95, smoothstep(0.55,0.95,uRoast));
    float bao = (1.0 - 0.92*smoothstep(0.10,0.85,vX.y)) * (0.72 + 0.28*h);
    alb = mix(alb, ba, bean); N = normalize(mix(N, bN, bean)); gloss = mix(gloss, bg, bean); ao = mix(1.0, bao, bean);
    shin = mix(60.0, mix(26.0, 95.0, bg), bean);
  }
  // ---- building facades
  if (kA > 3.5 && kA < 4.5) {
    vec3 no = normalize(vN * uRot);
    float win; float litW;
    alb = facade(alb, vO, no, vX.y, win, litW);
    gloss = mix(0.2, 0.85, win); shin = mix(60.0, 140.0, win);
    ao = 0.72 + 0.28*smoothstep(0.0, 0.7, vO.y);
    emis = win*litW*0.9;
  }
  // ---- paper / plaster grain on matte, non-metal surfaces
  if (bean < 0.01 && metal < 0.5 && gloss < 0.4) {
    vec4 pn = gnoise(vO*26.0 + uSeed*5.0);
    vec4 pn2 = gnoise(vO*8.5 + 3.1);
    vec3 gg = uRot * (pn.yzw*0.012 + pn2.yzw*0.010*uPaper*2.2) * (1.0 - gloss);
    N = normalize(N - (gg - dot(gg, N)*N));
    alb *= 0.96 + 0.08*pn.x;
  }
  // ---- decals: bag label + stamp (shape-space mapping), UV decals (van logo, shop sign), emissive lights
  if (uDecal > 0.5) {
    vec2 uvA = vec2((vPAB.x/1.3 + 0.5)*0.586, (0.5 - vPAB.y/1.95)*0.869);
    vec2 uvB = vec2((vPAB.z/1.3 + 0.5)*0.586, (0.5 - vPAB.w/1.95)*0.869);
    vec4 lA = texture2D(uTexL, uvA); vec4 lB = texture2D(uTexL, uvB);
    vec4 sA = texture2D(uTexS, uvA); vec4 sB = texture2D(uTexS, uvB);
    vec4 tU = texture2D(uTexL, vC.rg);
    vec4 l = mix(lA*step(0.5, kA)*step(kA, 1.5), lB*step(0.5, kB)*step(kB, 1.5), vKM.z);
    vec4 s = mix(sA*step(0.5, kA)*step(kA, 1.5), sB*step(0.5, kB)*step(kB, 1.5), vKM.z);
    alb = mix(alb, l.rgb, l.a);
    alb = mix(alb, s.rgb, s.a*uStamp);
    if (kA > 1.5 && kA < 2.5) { alb = tU.rgb; decalA = tU.a; gloss = 0.35; }
  }
  if (kA > 2.5 && kA < 3.5) emis = uEmis.x;
  if (kA > 6.5 && kA < 7.5) emis = uEmis.y;
  float sh = shadowAt(vW, N);
  vec3 alin = pow(clamp(alb, 0.0, 1.0), vec3(2.2));
  vec3 lin = lightRig(N, V, alin, gloss, shin, ao, metal, sh);
  lin += alin * emis * 2.4;
  vec3 col = finish(lin);
  float al = uAlpha * decalA;
  gl_FragColor = vec4(col*al, al);
}`;

  /* -------------------------------------------------------------- renderer */
  function compile(gl, type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { var log = gl.getShaderInfoLog(s); gl.deleteShader(s); throw new Error('shader: ' + log); }
    return s;
  }
  function makeProgram(gl) {
    var p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VS)); gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, FS));
    ['aPA', 'aNA', 'aCA', 'aXA', 'aPB', 'aNB', 'aCB', 'aXB'].forEach(function (n, i) { gl.bindAttribLocation(p, i, n); });
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(p));
    var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) { var info = gl.getActiveUniform(p, i); u[info.name.replace('[0]', '')] = gl.getUniformLocation(p, info.name); }
    return { p: p, u: u };
  }
  function cross3(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function norm3(a) { var l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }

  function create(canvas, opts) {
    opts = opts || {};
    var gl = null;
    try { gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: 'high-performance' }) || canvas.getContext('experimental-webgl'); } catch (e) { gl = null; }
    if (!gl) return null;
    var pr;
    try { pr = makeProgram(gl); } catch (err) { if (global.console) console.error('KvGL: ' + err.message); return null; }
    gl.useProgram(pr.p);
    var state = { w: 1, h: 1, fov: 26 * PI / 180, dist: 9, lost: false, cssW: 1, cssH: 1, shadowPass: false, shadowReady: false };
    var cache = {}, texL = null, texS = null, shadow = null;
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); state.lost = true; }, false);

    function upload(res, dynamic) {
      var vb = gl.createBuffer(), ib = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, res.buf, dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, res.idx, dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
      return { vb: vb, ib: ib, count: res.idx.length };
    }
    function shape(name, q) {
      var key = name + ':' + (REG[name] ? '' : (q || '')), m = cache[key];
      if (!m) m = cache[key] = upload(baked(name, q));
      return m;
    }
    // a mesh whose contents change every frame (the pour stream)
    function dyn(maxV, maxI) {
      var vb = gl.createBuffer(), ib = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, maxV * STRIDE * 4, gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, maxI * 2, gl.DYNAMIC_DRAW);
      return { vb: vb, ib: ib, count: 0, maxV: maxV, maxI: maxI };
    }
    function setDyn(d, buf, idx) {
      gl.bindBuffer(gl.ARRAY_BUFFER, d.vb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, buf);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, d.ib); gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, idx);
      d.count = idx.length;
    }
    function bindSet(m, slot) {
      gl.bindBuffer(gl.ARRAY_BUFFER, m.vb);
      var s = STRIDE * 4, o = slot * 4;
      gl.enableVertexAttribArray(o); gl.vertexAttribPointer(o, 3, gl.FLOAT, false, s, 0);
      gl.enableVertexAttribArray(o + 1); gl.vertexAttribPointer(o + 1, 3, gl.FLOAT, false, s, 12);
      gl.enableVertexAttribArray(o + 2); gl.vertexAttribPointer(o + 2, 4, gl.FLOAT, false, s, 24);
      gl.enableVertexAttribArray(o + 3); gl.vertexAttribPointer(o + 3, 4, gl.FLOAT, false, s, 40);
    }

    function setDecals(canv) {
      function mk(c) {
        var t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return t;
      }
      if (texL) gl.deleteTexture(texL); if (texS) gl.deleteTexture(texS);
      texL = mk(canv.label); texS = mk(canv.stamp);
    }
    function blankTex(v) {
      var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([v, v, v, v]));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      return t;
    }
    var blank = blankTex(0), whiteTex = blankTex(255);

    function resize() {
      var dpr = Math.min(global.devicePixelRatio || 1, opts.maxDpr || 1.75);
      var cw = canvas.clientWidth || 300, ch = canvas.clientHeight || 300;
      var w = Math.max(1, Math.round(cw * dpr)), h = Math.max(1, Math.round(ch * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      state.w = w; state.h = h; state.cssW = cw; state.cssH = ch;
      return { w: cw, h: ch };
    }

    /* ---- sun shadow map (RGBA8-packed depth, orthographic light) ---- */
    function ensureShadow() {
      if (shadow) return shadow;
      var S = opts.shadowSize || 2048, t = gl.createTexture(), fb = gl.createFramebuffer(), rb = gl.createRenderbuffer();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, S, S, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindRenderbuffer(gl.RENDERBUFFER, rb); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, S, S);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
      var ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      shadow = { S: S, tex: t, fb: fb, ok: ok };
      return shadow;
    }
    // cfg: { dir: vector towards the light, center: [x,y,z], radius, depth }
    function beginShadow(cfg) {
      var sh = ensureShadow();
      if (!sh.ok) return false;
      var L = norm3(cfg.dir), up = Math.abs(L[1]) > 0.99 ? [1, 0, 0] : [0, 1, 0];
      var xl = norm3(cross3(up, L)), yl = cross3(L, xl), r = cfg.radius, D = cfg.depth, O = cfg.center;
      // clip = M * (w - O):  x = xl.d / r, y = yl.d / r, z = -L.d / D
      var M = new Float32Array([xl[0] / r, yl[0] / r, -L[0] / D, 0, xl[1] / r, yl[1] / r, -L[1] / D, 0, xl[2] / r, yl[2] / r, -L[2] / D, 0, 0, 0, 0, 1]);
      var t = [-(xl[0] * O[0] + xl[1] * O[1] + xl[2] * O[2]) / r, -(yl[0] * O[0] + yl[1] * O[1] + yl[2] * O[2]) / r, (L[0] * O[0] + L[1] * O[1] + L[2] * O[2]) / D];
      state.LM = new Float32Array([M[0], M[1], M[2], 0, M[4], M[5], M[6], 0, M[8], M[9], M[10], 0, t[0], t[1], t[2], 1]);
      gl.useProgram(pr.p);
      gl.bindFramebuffer(gl.FRAMEBUFFER, sh.fb);
      gl.viewport(0, 0, sh.S, sh.S);
      gl.clearColor(1, 1, 1, 1); gl.clearDepth(1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.disable(gl.BLEND); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
      // while rendering into the shadow texture it must not be bound to any sampler of the program
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, blank);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, blank);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, blank);
      gl.uniform1i(pr.u.uTexL, 0); gl.uniform1i(pr.u.uTexS, 1); gl.uniform1i(pr.u.uTexSh, 2);
      gl.uniformMatrix4fv(pr.u.uProj, false, M);
      gl.uniform3f(pr.u.uCam, O[0], O[1], O[2]);
      gl.uniform1f(pr.u.uTime, cfg.time || 0);
      state.shadowPass = true; state.shadowCfg = cfg;
      return true;
    }
    function endShadow() {
      state.shadowPass = false;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      state.shadowReady = true;
    }

    var proj = null, cam = [0, 0, 9], time = 0;
    function begin(sc) {
      state.fov = (sc.fov || 26) * PI / 180; state.dist = sc.dist || 9;
      cam = [0, 0, state.dist]; time = sc.time || 0;
      proj = perspective(state.fov, state.w / state.h, 0.1, 90);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, state.w, state.h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.disable(gl.CULL_FACE);
      gl.useProgram(pr.p);
      state.shadowPass = false;
      gl.uniformMatrix4fv(pr.u.uProj, false, proj);
      gl.uniform3f(pr.u.uCam, cam[0], cam[1], cam[2]);
      gl.uniform1f(pr.u.uTime, time);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texL || blank); gl.uniform1i(pr.u.uTexL, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texS || blank); gl.uniform1i(pr.u.uTexS, 1);
      var useSh = !!(sc.shadow && state.shadowReady && shadow && shadow.ok);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, useSh ? shadow.tex : whiteTex); gl.uniform1i(pr.u.uTexSh, 2);
      gl.uniform1f(pr.u.uShOn, useSh ? 1 : 0);
      if (useSh) {
        gl.uniformMatrix4fv(pr.u.uLM, false, state.LM);
        gl.uniform2f(pr.u.uShBias, sc.shBias ? sc.shBias[0] : 0.012, sc.shBias ? sc.shBias[1] : 0.0035);
        gl.uniform1f(pr.u.uShTexel, 1.25 / shadow.S);
      }
    }
    function clearDepth() { gl.clear(gl.DEPTH_BUFFER_BIT); }

    // o: { a, b, q, mesh, meshObj, dyn, m, wave, blob, rot (mat3) | rx,ry,rz, pos, s, stretch, mode, alpha, roast, seed, base,
    //      stamp, decal, reveal, pour, foam, impact, paper, grow, sway, fadeOut, fadeIn, emis:[head,tail], ldl, sp, noCast }
    function draw(o) {
      if (state.lost) return;
      var mode = o.mode || 0;
      if (state.shadowPass) {
        if (o.noCast || mode !== 0 || (o.alpha != null && o.alpha < 0.5)) return;
        mode = 9;
      }
      var alpha = o.alpha == null ? 1 : o.alpha;
      if (alpha <= 0.003) return;
      var A = o.meshObj || o.dyn || (o.mesh ? shape(o.mesh) : shape(o.a, o.q || 'hi'));
      var B = o.b ? shape(o.b, o.q || 'hi') : A;
      if (!A.count) return;
      var R = o.rot || rotMat3(o.rx || 0, o.ry || 0, o.rz || 0), P = o.pos || [0, 0, 0], st = o.stretch || [1, 1, 1];
      gl.uniformMatrix3fv(pr.u.uRot, false, R);
      gl.uniform3f(pr.u.uPos, P[0], P[1], P[2]);
      gl.uniform3f(pr.u.uStretch, st[0], st[1], st[2]);
      gl.uniform1f(pr.u.uScale, o.s == null ? 1 : o.s);
      gl.uniform1f(pr.u.uMorph, o.m || 0); gl.uniform1f(pr.u.uWave, o.wave == null ? 0.7 : o.wave); gl.uniform1f(pr.u.uBlob, o.blob || 0);
      gl.uniform1f(pr.u.uGrow, o.grow == null ? 1 : o.grow); gl.uniform1f(pr.u.uSway, o.sway || 0);
      gl.uniform1f(pr.u.uMode, mode); gl.uniform1f(pr.u.uAlpha, alpha);
      gl.uniform2f(pr.u.uFade, o.fadeOut || 0, o.fadeIn == null ? 1 : o.fadeIn);
      if (mode !== 9) {
        gl.uniform1f(pr.u.uRoast, o.roast == null ? 0.6 : o.roast); gl.uniform1f(pr.u.uSeed, o.seed || 0);
        var bs = o.base || [1, 1, 1]; gl.uniform3f(pr.u.uBase, bs[0], bs[1], bs[2]);
        gl.uniform1f(pr.u.uPour, o.pour || 0); gl.uniform1f(pr.u.uStamp, o.stamp || 0);
        gl.uniform1f(pr.u.uReveal, o.reveal == null ? 9 : o.reveal); gl.uniform1f(pr.u.uDecal, o.decal ? 1 : 0);
        gl.uniform1f(pr.u.uPaper, o.paper || 0); gl.uniform1f(pr.u.uFoam, o.foam || 0);
        var im = o.impact || [0, 0]; gl.uniform2f(pr.u.uImpact, im[0], im[1]);
        var em = o.emis || [0, 0]; gl.uniform2f(pr.u.uEmis, em[0], em[1]);
        var ld = o.ldl || [0, 1, 0]; gl.uniform3f(pr.u.uLdl, ld[0], ld[1], ld[2]);
      }
      bindSet(A, 0); bindSet(B, 1);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, A.ib);
      gl.drawElements(gl.TRIANGLES, A.count, gl.UNSIGNED_SHORT, 0);
    }
    function ribbon(pts, width) {
      var rb = bakeRibbon(pts, width), m = upload(rb.mesh);
      return { mesh: m, total: rb.total, cum: rb.cum };
    }
    function drawRibbon(rb, o) { // o: { rot, pos, s, alpha, reveal }
      draw({ meshObj: rb.mesh, mode: 2, rot: o.rot, pos: o.pos, s: o.s, alpha: o.alpha, reveal: o.reveal, wave: 0 });
    }
    function toScreen(x, y, z) {
      var vh = 2 * state.dist * Math.tan(state.fov / 2), k = state.dist / (state.dist - z), ppu = (state.cssH || 300) / vh;
      return { x: x * k * ppu, y: -y * k * ppu };
    }
    function dispose() { try { var ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); } catch (e) { /* ignore */ } }
    return { gl: gl, resize: resize, begin: begin, draw: draw, clearDepth: clearDepth, ribbon: ribbon, drawRibbon: drawRibbon, setDecals: setDecals,
      dyn: dyn, setDyn: setDyn, beginShadow: beginShadow, endShadow: endShadow, toScreen: toScreen, dispose: dispose };
  }

  global.KvGL = {
    create: create, drawDecals: drawDecals, registerShape: registerShape, ATLAS: ATLAS,
    rot: rotMat3, mul: mat3mul, mulVec: mulVec, mulVecT: mulVecT,
    MUG_H: MUG_H, MUG_MID: MUG_MID, MUG_BOTTOM: MUG_BOTTOM, MUG_RIM_IN: MUG_RIM_IN, STRIDE: STRIDE,
    _u: { clamp: clamp, mix: mix, smoothstep: smoothstep, catmull: catmull, meshFrom: meshFrom, PI: PI, STRIDE: STRIDE },
  };
})(typeof window !== 'undefined' ? window : this);
