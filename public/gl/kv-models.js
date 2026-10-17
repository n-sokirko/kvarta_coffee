/* kv-models.js — hard-surface models for the Kvarta scenes, built from primitives with a small mesh builder.
   Registered into KvGL: kettle, wheel, vanD, houseH, houseW, houseDoor, city, car0..car3, cBody, cArm, cLeg, stamp.
   Also KvGL.makeCity() and KvGL.pathAt() with the city data (route, buildings, trees, lamps). */
(function (global) {
  'use strict';
  var K = global.KvGL;
  if (!K) return;
  var U = K._u, PI = U.PI, STRIDE = U.STRIDE, clamp = U.clamp, mix = U.mix, smoothstep = U.smoothstep, catmull = U.catmull;
  var ID3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

  /* ------------------------------------------------------------ mesh builder */
  function MB() { this.v = []; this.i = []; this.R = ID3; this.t = [0, 0, 0]; this.stack = []; }
  MB.prototype.push = function (R, t) {
    this.stack.push([this.R, this.t]);
    var tr = K.mulVec(this.R, t || [0, 0, 0]);
    this.t = [tr[0] + this.t[0], tr[1] + this.t[1], tr[2] + this.t[2]];
    this.R = K.mul(this.R, R || ID3);
    return this;
  };
  MB.prototype.pop = function () { var s = this.stack.pop(); this.R = s[0]; this.t = s[1]; return this; };
  MB.prototype.vtx = function (p, n, c, gl, slot, kind, h) {
    var R = this.R, t = this.t;
    this.v.push(R[0] * p[0] + R[3] * p[1] + R[6] * p[2] + t[0], R[1] * p[0] + R[4] * p[1] + R[7] * p[2] + t[1], R[2] * p[0] + R[5] * p[1] + R[8] * p[2] + t[2],
      R[0] * n[0] + R[3] * n[1] + R[6] * n[2], R[1] * n[0] + R[4] * n[1] + R[7] * n[2], R[2] * n[0] + R[5] * n[1] + R[8] * n[2],
      c[0], c[1], c[2], gl, 0, slot || 0, h == null ? 0.5 : h, kind || 0);
    return this.v.length / STRIDE - 1;
  };
  MB.prototype.tri = function (a, b, c) { this.i.push(a, b, c); };
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function nrm(a) { var l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  // planar convex polygon, flat normal n (points are flipped so the face looks along n)
  MB.prototype.poly = function (pts, n, c, gl, o) {
    o = o || {};
    var cr = cross(sub(pts[1], pts[0]), sub(pts[2], pts[0]));
    if (dot(cr, n) < 0) pts = pts.slice().reverse();
    var ids = [], self = this;
    pts.forEach(function (p, k) { var col = o.colors ? o.colors[k] || c : c; ids.push(self.vtx(p, n, col, gl, o.slot, o.kind, o.h)); });
    for (var k = 1; k < ids.length - 1; k++) this.tri(ids[0], ids[k], ids[k + 1]);
    return this;
  };
  // box with optional chamfer (o.bevel): flat faces, 12 edge strips, 8 corner triangles
  MB.prototype.box = function (cx, cy, cz, hx, hy, hz, c, gl, o) {
    o = o || {};
    var b = Math.min(o.bevel || 0, hx * 0.9, hy * 0.9, hz * 0.9), H = [hx, hy, hz], C = [cx, cy, cz], hi = [hx - b, hy - b, hz - b], self = this;
    var skip = o.skip || {};
    for (var a = 0; a < 3; a++) for (var s = -1; s <= 1; s += 2) {
      if (skip[(s > 0 ? '+' : '-') + 'xyz'[a]]) continue;
      var u = (a + 1) % 3, v = (a + 2) % 3, n = [0, 0, 0]; n[a] = s;
      var quad = [];
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (uv) { var p = [0, 0, 0]; p[a] = C[a] + s * H[a]; p[u] = C[u] + uv[0] * hi[u]; p[v] = C[v] + uv[1] * hi[v]; quad.push(p); });
      this.poly(quad, n, c, gl, o);
    }
    if (b > 0) {
      for (a = 0; a < 3; a++) {
        var u2 = (a + 1) % 3, c2 = (a + 2) % 3;
        for (var sa = -1; sa <= 1; sa += 2) for (var su = -1; su <= 1; su += 2) {
          var nn = [0, 0, 0]; nn[a] = sa; nn[u2] = su; nn = nrm(nn);
          var q = [];
          [-1, 1].forEach(function (sc) { var p = [0, 0, 0]; p[a] = C[a] + sa * H[a]; p[u2] = C[u2] + su * hi[u2]; p[c2] = C[c2] + sc * hi[c2]; q.push(p); });
          [1, -1].forEach(function (sc) { var p = [0, 0, 0]; p[a] = C[a] + sa * hi[a]; p[u2] = C[u2] + su * H[u2]; p[c2] = C[c2] + sc * hi[c2]; q.push(p); });
          this.poly(q, nn, c, gl, o);
        }
      }
      for (var sx = -1; sx <= 1; sx += 2) for (var sy = -1; sy <= 1; sy += 2) for (var sz = -1; sz <= 1; sz += 2) {
        this.poly([[cx + sx * hx, cy + sy * hi[1], cz + sz * hi[2]], [cx + sx * hi[0], cy + sy * hy, cz + sz * hi[2]], [cx + sx * hi[0], cy + sy * hi[1], cz + sz * hz]], nrm([sx, sy, sz]), c, gl, o);
      }
    }
    return this;
  };
  // surface of revolution about Y; profile [[r, y], ...] bottom -> top (outward normal); smooth shading
  MB.prototype.lathe = function (profile, seg, c, gl, o) {
    o = o || {};
    var rows = profile.length, base = this.v.length / STRIDE, cols = seg + 1;
    for (var j = 0; j < rows; j++) {
      var a = profile[Math.max(0, j - 1)], b = profile[Math.min(rows - 1, j + 1)];
      var tr = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tr, ty) || 1, nr = ty / l, ny = -tr / l;
      var col = o.colorAt ? o.colorAt(j, profile[j]) : c;
      for (var i = 0; i < cols; i++) {
        var th = 2 * PI * i / seg, ct = Math.cos(th), st = Math.sin(th);
        this.vtx([profile[j][0] * ct, profile[j][1], profile[j][0] * st], [nr * ct, ny, nr * st], col, gl, o.metal, o.kind, o.h);
      }
    }
    for (j = 0; j < rows - 1; j++) for (i = 0; i < seg; i++) { var q = base + j * cols + i; this.tri(q, q + cols, q + 1); this.tri(q + 1, q + cols, q + cols + 1); }
    return this;
  };
  MB.prototype.sphere = function (cx, cy, cz, rx, ry, rz, seg, rings, c, gl, o) {
    o = o || {};
    var base = this.v.length / STRIDE, cols = seg + 1;
    for (var j = 0; j <= rings; j++) for (var i = 0; i < cols; i++) {
      var ph = PI * j / rings, th = 2 * PI * i / seg, x = Math.sin(ph) * Math.cos(th), y = Math.cos(ph), z = Math.sin(ph) * Math.sin(th);
      var col = o.colorAt ? o.colorAt(y, x, z) : c;
      this.vtx([cx + x * rx, cy + y * ry, cz + z * rz], nrm([x / rx, y / ry, z / rz]), col, gl, o.slotAt ? o.slotAt(y) : o.slot, o.kind, o.h);
    }
    for (j = 0; j < rings; j++) for (i = 0; i < seg; i++) { var q = base + j * cols + i; this.tri(q, q + cols, q + 1); this.tri(q + 1, q + cols, q + cols + 1); }
    return this;
  };
  // cylinder with caps; axis 'x' | 'y' | 'z'
  MB.prototype.cyl = function (cx, cy, cz, r, len, axis, seg, c, gl, o) {
    o = o || {};
    var R = axis === 'x' ? K.rot(0, 0, -PI / 2) : axis === 'z' ? K.rot(PI / 2, 0, 0) : ID3;
    this.push(R, [cx, cy, cz]);
    this.lathe([[0, -len / 2], [r, -len / 2], [r, len / 2], [0, len / 2]], seg, c, gl, o);
    // lathe gave smooth caps normals; fix: flat caps are acceptable here because the profile corners average normals
    this.pop();
    return this;
  };
  // tube along a 3D path with parallel-transport frames; radius: number | function(t)
  MB.prototype.tube = function (path, radius, seg, c, gl, o) {
    o = o || {};
    var n = path.length, rows = n, cols = seg + 1, base = this.v.length / STRIDE, prevN = null;
    var tang = [];
    for (var k = 0; k < n; k++) tang.push(nrm(sub(path[Math.min(n - 1, k + 1)], path[Math.max(0, k - 1)])));
    var nn = Math.abs(tang[0][1]) < 0.9 ? cross(tang[0], [0, 1, 0]) : cross(tang[0], [1, 0, 0]);
    nn = nrm(nn);
    for (k = 0; k < n; k++) {
      var T = tang[k];
      if (k > 0) { nn = nrm(sub(nn, [T[0] * dot(nn, T), T[1] * dot(nn, T), T[2] * dot(nn, T)])); }
      var bb = nrm(cross(T, nn)), t = k / (n - 1), r = typeof radius === 'function' ? radius(t) : radius;
      var col = o.colorAt ? o.colorAt(t) : c;
      for (var i = 0; i < cols; i++) {
        var th = 2 * PI * i / seg, ct = Math.cos(th), st = Math.sin(th);
        var dir = [nn[0] * ct + bb[0] * st, nn[1] * ct + bb[1] * st, nn[2] * ct + bb[2] * st];
        this.vtx([path[k][0] + dir[0] * r, path[k][1] + dir[1] * r, path[k][2] + dir[2] * r], dir, col, gl, o.metal, o.kind, o.h);
      }
    }
    for (k = 0; k < rows - 1; k++) for (i = 0; i < seg; i++) { var q = base + k * cols + i; this.tri(q, q + cols, q + 1); this.tri(q + 1, q + cols, q + cols + 1); }
    if (o.capEnd) { // flat cap at the end
      var e = path[n - 1], T2 = tang[n - 1], ce = this.vtx(e, T2, c, gl, o.metal, o.kind, o.h), r0 = base + (rows - 1) * cols;
      for (i = 0; i < seg; i++) this.tri(ce, r0 + i + 1, r0 + i);
    }
    return this;
  };
  // vertical capsule: foot of the lower sphere at y=0
  MB.prototype.capsule = function (len, r, seg, c, gl, o) {
    var prof = [], k, N = 6;
    for (k = 0; k <= N; k++) { var a = PI / 2 * k / N; prof.push([r * Math.sin(a), r - r * Math.cos(a)]); }
    for (k = 1; k <= N; k++) { var b = PI / 2 * k / N; prof.push([r * Math.cos(b), len - r + r * Math.sin(b)]); }
    prof[0][0] = 0; prof[prof.length - 1][0] = 0;
    return this.lathe(prof, seg, c, gl, o);
  };
  // ear clipping triangulation of a simple CCW polygon [[x,y],...] -> index triples
  function earClip(P) {
    var n = P.length, idx = [], res = [], i;
    for (i = 0; i < n; i++) idx.push(i);
    function area(a, b, c) { return (P[b][0] - P[a][0]) * (P[c][1] - P[a][1]) - (P[b][1] - P[a][1]) * (P[c][0] - P[a][0]); }
    function inTri(p, a, b, c) { return area(a, b, p) >= -1e-12 && area(b, c, p) >= -1e-12 && area(c, a, p) >= -1e-12; }
    var guard = 0;
    while (idx.length > 3 && guard++ < 5000) {
      var ear = false;
      for (i = 0; i < idx.length; i++) {
        var a = idx[(i + idx.length - 1) % idx.length], b = idx[i], c = idx[(i + 1) % idx.length];
        if (area(a, b, c) <= 1e-12) continue;
        var ok = true;
        for (var k = 0; k < idx.length; k++) { var p = idx[k]; if (p === a || p === b || p === c) continue; if (inTri(p, a, b, c)) { ok = false; break; } }
        if (ok) { res.push([a, b, c]); idx.splice(i, 1); ear = true; break; }
      }
      if (!ear) break;
    }
    if (idx.length === 3) res.push([idx[0], idx[1], idx[2]]);
    return res;
  }
  function polyArea(P) { var s = 0; for (var i = 0; i < P.length; i++) { var a = P[i], b = P[(i + 1) % P.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
  function roundPoly(P, r, segs) {
    var out = [], n = P.length;
    for (var i = 0; i < n; i++) {
      var p0 = P[(i + n - 1) % n], p1 = P[i], p2 = P[(i + 1) % n];
      var ax = p1[0] - p0[0], ay = p1[1] - p0[1], bx = p2[0] - p1[0], by = p2[1] - p1[1], al = Math.hypot(ax, ay), bl = Math.hypot(bx, by);
      var rr = Math.min(r, al * 0.45, bl * 0.45);
      var s = [p1[0] - ax / al * rr, p1[1] - ay / al * rr], e = [p1[0] + bx / bl * rr, p1[1] + by / bl * rr];
      for (var k = 0; k <= segs; k++) { var t = k / segs, u = 1 - t; out.push([u * u * s[0] + 2 * u * t * p1[0] + t * t * e[0], u * u * s[1] + 2 * u * t * p1[1] + t * t * e[1]]); }
    }
    return out;
  }
  // extrude a rounded side profile along z with a chamfered edge and smooth normals around the outline
  MB.prototype.extrudeRounded = function (poly, z0, z1, bevel, radius, c, gl, o) {
    o = o || {};
    var P = roundPoly(poly, radius, 5);
    if (polyArea(P) < 0) P.reverse();
    var n = P.length, nrm2 = [], ins = [], self = this, b = bevel;
    for (var i = 0; i < n; i++) {
      var a = P[(i + n - 1) % n], p = P[i], q = P[(i + 1) % n];
      var e1 = nrm([p[0] - a[0], p[1] - a[1], 0]), e2 = nrm([q[0] - p[0], q[1] - p[1], 0]);
      var nx = e1[1] + e2[1], ny = -(e1[0] + e2[0]), l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      nrm2.push([nx, ny]); ins.push([p[0] - nx * b, p[1] - ny * b]);
    }
    [z0, z1].forEach(function (zc, side) {
      var s = side === 0 ? -1 : 1, zin = zc - s * b, A = [], B = [], k;
      for (k = 0; k < n; k++) A.push(self.vtx([P[k][0], P[k][1], zin], [nrm2[k][0], nrm2[k][1], 0], c, gl, o.slot, o.kind, o.h));
      for (k = 0; k < n; k++) B.push(self.vtx([ins[k][0], ins[k][1], zc], nrm([nrm2[k][0] * 0.7, nrm2[k][1] * 0.7, s * 0.7]), c, gl, o.slot, o.kind, o.h));
      for (k = 0; k < n; k++) { var k2 = (k + 1) % n; if (s > 0) { self.tri(A[k], A[k2], B[k]); self.tri(A[k2], B[k2], B[k]); } else { self.tri(A[k], B[k], A[k2]); self.tri(A[k2], B[k], B[k2]); } }
      var cap = []; for (k = 0; k < n; k++) cap.push(self.vtx([ins[k][0], ins[k][1], zc], [0, 0, s], c, gl, o.slot, o.kind, o.h));
      earClip(ins).forEach(function (t) { if (s > 0) self.tri(cap[t[0]], cap[t[1]], cap[t[2]]); else self.tri(cap[t[0]], cap[t[2]], cap[t[1]]); });
    });
    // side wall between the two chamfer rings
    var base0 = null;
    var W0 = [], W1 = [];
    for (i = 0; i < n; i++) { W0.push(this.vtx([P[i][0], P[i][1], z0 + b], [nrm2[i][0], nrm2[i][1], 0], c, gl, o.slot, o.kind, o.h)); W1.push(this.vtx([P[i][0], P[i][1], z1 - b], [nrm2[i][0], nrm2[i][1], 0], c, gl, o.slot, o.kind, o.h)); }
    for (i = 0; i < n; i++) { var j2 = (i + 1) % n; this.tri(W0[i], W0[j2], W1[i]); this.tri(W0[j2], W1[j2], W1[i]); }
    return this;
  };
  // flat extrusion of a simple polygon along z (hard edges), used for roofs
  MB.prototype.extrude = function (poly, z0, z1, c, gl, o) {
    o = o || {};
    var P = poly.slice();
    if (polyArea(P) < 0) P.reverse();
    var n = P.length, self = this;
    for (var i = 0; i < n; i++) {
      var a = P[i], b = P[(i + 1) % n], e = nrm([b[0] - a[0], b[1] - a[1], 0]), nn = [e[1], -e[0], 0];
      var col = o.sideColor && o.sideColor(a, b) ? o.sideColor(a, b) : c;
      this.poly([[a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1], [a[0], a[1], z1]], nn, col, gl, o);
    }
    var tris = earClip(P);
    [[z0, -1], [z1, 1]].forEach(function (zz) {
      tris.forEach(function (t) { self.poly([[P[t[0]][0], P[t[0]][1], zz[0]], [P[t[1]][0], P[t[1]][1], zz[0]], [P[t[2]][0], P[t[2]][1], zz[0]]], [0, 0, zz[1]], o.capColor || c, gl, o); });
    });
    return this;
  };
  MB.prototype.decal = function (p0, p1, p2, p3, rect, flipU, n) { // UV decal quad; uv in vertex colour r,g; rect in atlas px
    var A = 1024, u0 = rect[0] / A, v0 = rect[1] / A, u1 = rect[2] / A, v1 = rect[3] / A;
    if (flipU) { var t = u0; u0 = u1; u1 = t; }
    var pts = [p0, p1, p2, p3], uv = [[u0, v1], [u1, v1], [u1, v0], [u0, v0]];
    var cr = cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])), order = [0, 1, 2, 3];
    if (dot(cr, n) < 0) order = [0, 3, 2, 1];
    var ids = [], self = this;
    order.forEach(function (k) { ids.push(self.vtx(pts[k], n, [uv[k][0], uv[k][1], 0], 0.35, 0, 2, 0.5)); });
    this.tri(ids[0], ids[1], ids[2]); this.tri(ids[0], ids[2], ids[3]);
    return this;
  };
  MB.prototype.mesh = function () {
    if (this.v.length / STRIDE > 65000) throw new Error('mesh too big: ' + (this.v.length / STRIDE));
    return { buf: new Float32Array(this.v), idx: new Uint16Array(this.i) };
  };
  function to3(p2) { return p2.map(function (p) { return [p[0], p[1], 0]; }); }
  function rotY(a) { return K.rot(0, a, 0); }
  function rotX(a) { return K.rot(a, 0, 0); }
  function rotZ(a) { return K.rot(0, 0, a); }

  var COPPER = [0.84, 0.45, 0.27], BLACK = [0.07, 0.07, 0.08], INK = [0.12, 0.10, 0.09], FLAME = [0.89, 0.34, 0.17], CREAM = [0.95, 0.91, 0.82];
  var SILVER = [0.78, 0.79, 0.82], KRAFT = [0.80, 0.62, 0.38];

  /* ------------------------------------------------------ gooseneck kettle */
  var KETTLE_TIP = [2.06, 1.20, 0], KETTLE_DIR = [0.93, -0.37, 0];
  function buildKettle() {
    var mb = new MB();
    mb.lathe([[0, 0], [0.55, 0], [0.60, 0.02], [0.64, 0.08], [0.66, 0.18], [0.655, 0.5], [0.64, 0.8], [0.62, 0.9], [0.56, 0.96], [0.40, 0.995], [0.34, 1.0]], 40, COPPER, 0.85, { metal: 1 });
    mb.lathe([[0.62, 0.0], [0.665, 0.0], [0.672, 0.05], [0.67, 0.12], [0.664, 0.135]], 40, BLACK, 0.4);
    mb.lathe([[0.34, 1.0], [0.335, 1.02], [0.30, 1.06], [0.22, 1.11], [0.10, 1.14], [0, 1.145]], 32, COPPER, 0.85, { metal: 1 });
    mb.cyl(0, 1.16, 0, 0.03, 0.08, 'y', 12, BLACK, 0.35);
    mb.sphere(0, 1.215, 0, 0.075, 0.07, 0.075, 16, 10, BLACK, 0.4);
    var sp = to3(catmull([[0.58, 0.26], [0.84, 0.28], [1.04, 0.40], [1.15, 0.62], [1.20, 0.86], [1.30, 1.10], [1.50, 1.27], [1.74, 1.33], [1.94, 1.29], [2.06, 1.20]], 8));
    mb.tube(sp, function (t) { return mix(0.115, 0.05, Math.pow(t, 0.8)); }, 16, COPPER, 0.85, { metal: 1, capEnd: true });
    var hp = to3(catmull([[-0.55, 0.92], [-0.86, 0.98], [-1.12, 0.78], [-1.12, 0.44], [-0.86, 0.24], [-0.60, 0.22]], 8));
    mb.tube(hp, function (t) { return 0.05 + 0.028 * Math.sin(PI * t); }, 12, BLACK, 0.4, { capEnd: true });
    // thin copper rivets / collar where the spout meets the body
    mb.sphere(0.6, 0.27, 0, 0.1, 0.1, 0.1, 12, 8, COPPER, 0.85, { slot: 1 });
    return mb.mesh();
  }

  /* ------------------------------------------------------------- van wheel */
  function buildWheel() {
    var mb = new MB(), TIRE = [0.06, 0.06, 0.07];
    mb.push(K.rot(PI / 2, 0, 0));
    mb.lathe([[0.20, -0.115], [0.25, -0.12], [0.295, -0.09], [0.31, -0.035], [0.312, 0], [0.31, 0.035], [0.295, 0.09], [0.25, 0.12], [0.20, 0.115]], 32, TIRE, 0.22);
    mb.pop();
    [-1, 1].forEach(function (s) {
      mb.cyl(0, 0, s * 0.104, 0.2, 0.02, 'z', 24, SILVER, 0.9, { metal: 1 });
      mb.cyl(0, 0, s * 0.112, 0.06, 0.03, 'z', 14, [0.62, 0.63, 0.66], 0.9, { metal: 1 });
      for (var k = 0; k < 5; k++) {
        mb.push(rotZ(k * 2 * PI / 5), [0, 0, 0]);
        mb.box(0.12, 0, s * 0.114, 0.075, 0.022, 0.012, [0.66, 0.67, 0.7], 0.9, { metal: 1 });
        mb.pop();
      }
      for (var m = 0; m < 5; m++) { var a = m * 2 * PI / 5 + 0.3; mb.cyl(Math.cos(a) * 0.045, Math.sin(a) * 0.045, s * 0.118, 0.01, 0.01, 'z', 6, [0.3, 0.3, 0.32], 0.8, { metal: 1 }); }
    });
    return mb.mesh();
  }

  /* ------------------------------------------------------ detailed delivery van */
  var VAN_POLY = [[-1.64, -0.50], [-1.64, 0.78], [0.40, 0.78], [0.46, 0.60], [0.90, 0.58], [1.36, 0.04], [1.68, -0.04], [1.70, -0.50]];
  var VAN_WHEELS = [[-0.95, -0.33], [0.90, -0.33]];
  function buildVan() {
    var mb = new MB(), PAINT = [0.94, 0.93, 0.89], GLASS = [0.05, 0.07, 0.09], DARK = [0.13, 0.13, 0.15];
    var Z = 0.56;
    mb.extrudeRounded(VAN_POLY, -Z, Z, 0.055, 0.16, PAINT, 0.8);
    [1, -1].forEach(function (s) {
      var zs = s * (Z + 0.004);
      // orange stripe
      mb.poly([[-1.58, -0.31, zs], [1.64, -0.31, zs], [1.64, -0.15, zs], [-1.58, -0.15, zs]], [0, 0, s], FLAME, 0.6);
      // cab side window + frame line
      mb.poly([[0.58, 0.50, zs + s * 0.001], [0.86, 0.50, zs + s * 0.001], [1.20, 0.10, zs + s * 0.001], [0.58, 0.10, zs + s * 0.001]], [0, 0, s], GLASS, 0.97);
      // wheel arches (circle segments above the body bottom)
      VAN_WHEELS.forEach(function (w) {
        var pts = [];
        for (var k = 0; k <= 14; k++) { var a = PI * k / 14, px = w[0] + Math.cos(a) * 0.36, py = w[1] + Math.sin(a) * 0.36; if (py >= -0.5) pts.push([px, py, zs + s * 0.002]); }
        var yb = -0.5, dx = Math.sqrt(Math.max(0, 0.36 * 0.36 - (yb - w[1]) * (yb - w[1])));
        pts.unshift([w[0] + dx, yb, zs + s * 0.002]); pts.push([w[0] - dx, yb, zs + s * 0.002]);
        if (pts.length > 2) mb.poly(pts, [0, 0, s], DARK, 0.25);
      });
      // door seams and handle
      mb.box(0.50, 0.05, zs, 0.006, 0.52, 0.004, DARK, 0.3);
      mb.box(1.24, -0.12, zs, 0.006, 0.4, 0.004, DARK, 0.3);
      mb.box(0.64, -0.02, zs + s * 0.01, 0.05, 0.012, 0.01, [0.7, 0.7, 0.72], 0.9, { metal: 1 });
      mb.box(-0.55, 0.05, zs, 0.006, 0.55, 0.004, DARK, 0.3);
      // brand logo
      mb.decal([-1.35, 0.05, zs + s * 0.003], [-0.15, 0.05, zs + s * 0.003], [-0.15, 0.65, zs + s * 0.003], [-1.35, 0.65, zs + s * 0.003], K.ATLAS.logo, s < 0, [0, 0, s]);
      // mirror
      mb.box(1.03, 0.29, s * 0.64, 0.012, 0.012, 0.07, DARK, 0.3);
      mb.box(1.03, 0.30, s * 0.72, 0.03, 0.065, 0.012, [0.12, 0.13, 0.15], 0.9);
      // lights
      mb.box(1.705, -0.12, s * 0.38, 0.014, 0.06, 0.11, [1.0, 0.95, 0.78], 0.9, { kind: 3 });
      mb.box(1.70, -0.12, s * 0.38, 0.012, 0.07, 0.125, [0.7, 0.7, 0.72], 0.9, { metal: 1 });
      mb.box(-1.645, -0.08, s * 0.47, 0.014, 0.13, 0.06, [0.9, 0.1, 0.08], 0.7, { kind: 7 });
    });
    // windshield (slanted) and front grille / plate
    var wn = nrm([0.50, 0.42, 0]);
    mb.poly([[0.925, 0.55, -0.47], [0.925, 0.55, 0.47], [1.345, 0.065, 0.47], [1.345, 0.065, -0.47]].map(function (p) { return [p[0] + wn[0] * 0.004, p[1] + wn[1] * 0.004, p[2]]; }), wn, GLASS, 0.97);
    mb.box(1.69, -0.30, 0, 0.012, 0.075, 0.30, DARK, 0.3);
    mb.box(1.705, -0.38, 0, 0.012, 0.045, 0.14, [0.95, 0.95, 0.93], 0.4);
    mb.box(-1.655, -0.36, 0, 0.012, 0.045, 0.14, [0.95, 0.95, 0.93], 0.4);
    // bumpers
    mb.box(1.73, -0.46, 0, 0.05, 0.06, 0.52, DARK, 0.35, { bevel: 0.02 });
    mb.box(-1.69, -0.46, 0, 0.05, 0.06, 0.54, DARK, 0.35, { bevel: 0.02 });
    // roof rack with kraft parcels
    [0.38, -0.38].forEach(function (z) { mb.box(-0.55, 0.805, z, 1.1, 0.014, 0.014, DARK, 0.3); });
    [-1.4, -0.7, 0.0, 0.3].forEach(function (x) { mb.box(x, 0.82, 0, 0.014, 0.014, 0.4, DARK, 0.3); });
    mb.box(-1.0, 0.94, 0.0, 0.34, 0.11, 0.30, KRAFT, 0.18, { bevel: 0.012 });
    mb.box(-1.0, 0.94, 0.0, 0.012, 0.115, 0.31, INK, 0.3); mb.box(-1.0, 1.052, 0.0, 0.34, 0.004, 0.025, INK, 0.3);
    mb.box(-0.3, 0.92, 0.04, 0.28, 0.09, 0.27, KRAFT, 0.18, { bevel: 0.012 });
    mb.box(-0.3, 0.92, 0.04, 0.012, 0.095, 0.28, INK, 0.3);
    mb.box(-0.35, 1.05, -0.02, 0.2, 0.05, 0.2, [0.86, 0.68, 0.44], 0.18, { bevel: 0.01 });
    return mb.mesh();
  }

  /* ------------------------------------------------------------ the house */
  // front is +z, the door is centred; roof ridge runs along x. Units: walls 1.6 wide, 1.0 tall.
  function buildHouse(variant) {
    var mb = new MB(), W = variant === 'W';
    var WALL = W ? [0.80, 0.62, 0.40] : [0.94, 0.90, 0.80], ROOF = W ? [0.80, 0.30, 0.18] : [0.70, 0.29, 0.20], TRIM = [0.97, 0.95, 0.91];
    var STONE = [0.62, 0.60, 0.58], GLASS = [0.16, 0.22, 0.28], BRICK = [0.62, 0.35, 0.28];
    var D = 0.7, doorW = 0.17, doorH = 0.64;
    mb.box(0, 0.03, 0, 0.86, 0.03, 0.76, STONE, 0.2);
    // walls: the front wall leaves a doorway open
    mb.box(0, 0.5, -D + 0.04, 0.8, 0.47, 0.04, WALL, 0.2, { bevel: 0.012 });
    mb.box(-0.8 + 0.04, 0.5, 0, 0.04, 0.47, D, WALL, 0.2, { bevel: 0.012 });
    mb.box(0.8 - 0.04, 0.5, 0, 0.04, 0.47, D, WALL, 0.2, { bevel: 0.012 });
    mb.box(-(0.8 + doorW) / 2, 0.5, D - 0.04, (0.8 - doorW) / 2, 0.47, 0.04, WALL, 0.2, { bevel: 0.012 });
    mb.box((0.8 + doorW) / 2, 0.5, D - 0.04, (0.8 - doorW) / 2, 0.47, 0.04, WALL, 0.2, { bevel: 0.012 });
    mb.box(0, (0.06 + doorH + 0.97) / 2, D - 0.04, doorW, (0.97 - 0.06 - doorH) / 2, 0.04, WALL, 0.2, { bevel: 0.012 });
    // warm interior behind the open door
    mb.box(0, 0.38, D - 0.30, doorW + 0.05, 0.3, 0.012, [1.0, 0.82, 0.5], 0.3, { kind: 3 });
    mb.box(0, 0.075, D - 0.16, doorW + 0.03, 0.012, 0.14, [0.9, 0.62, 0.34], 0.3, { kind: 3 });
    mb.box(-doorW - 0.03, 0.38, D - 0.17, 0.012, 0.3, 0.14, [0.9, 0.62, 0.34], 0.3, { kind: 3 });
    mb.box(doorW + 0.03, 0.38, D - 0.17, 0.012, 0.3, 0.14, [0.9, 0.62, 0.34], 0.3, { kind: 3 });
    // door frame
    mb.box(-doorW - 0.016, 0.06 + doorH / 2, D, 0.016, doorH / 2, 0.05, TRIM, 0.3, { bevel: 0.006 });
    mb.box(doorW + 0.016, 0.06 + doorH / 2, D, 0.016, doorH / 2, 0.05, TRIM, 0.3, { bevel: 0.006 });
    mb.box(0, 0.06 + doorH + 0.016, D, doorW + 0.032, 0.016, 0.05, TRIM, 0.3, { bevel: 0.006 });
    // windows with frames, glass, sills and flower boxes
    [-0.5, 0.5].forEach(function (x) {
      mb.box(x, 0.6, D + 0.002, 0.15, 0.17, 0.016, TRIM, 0.3, { bevel: 0.006 });
      mb.box(x, 0.6, D + 0.014, 0.125, 0.145, 0.008, GLASS, 0.95);
      mb.box(x, 0.6, D + 0.026, 0.005, 0.145, 0.006, TRIM, 0.3); mb.box(x, 0.6, D + 0.026, 0.125, 0.005, 0.006, TRIM, 0.3);
      mb.box(x, 0.4, D + 0.04, 0.17, 0.016, 0.045, TRIM, 0.3, { bevel: 0.005 });
      mb.box(x, 0.45, D + 0.07, 0.15, 0.04, 0.04, [0.55, 0.36, 0.22], 0.25, { bevel: 0.006 });
      for (var k = 0; k < 5; k++) mb.sphere(x - 0.12 + k * 0.06, 0.505, D + 0.07, 0.03, 0.03, 0.03, 8, 6, k % 2 ? [0.9, 0.35, 0.45] : [0.35, 0.62, 0.3], 0.3);
    });
    // side windows
    [-1, 1].forEach(function (s) { mb.box(s * (0.8 + 0.002), 0.6, 0.05, 0.016, 0.16, 0.18, TRIM, 0.3); mb.box(s * (0.8 + 0.014), 0.6, 0.05, 0.008, 0.135, 0.15, GLASS, 0.95); });
    // roof: two slopes along x with an overhang
    var ox = 0.95, ridge = 1.62, eave = 1.0, ez = 0.86;
    var ang = Math.atan2(ridge - eave, ez), slopeN = nrm([0, Math.cos(ang), Math.sin(ang)]);
    [1, -1].forEach(function (s) {
      var n = [0, Math.cos(ang), s * Math.sin(ang)];
      mb.poly([[-ox, eave - 0.02, s * ez], [ox, eave - 0.02, s * ez], [ox, ridge, 0], [-ox, ridge, 0]], n, ROOF, 0.3);
      mb.poly([[-ox, eave - 0.07, s * ez], [ox, eave - 0.07, s * ez], [ox, eave - 0.02, s * ez], [-ox, eave - 0.02, s * ez]], [0, 0, s], TRIM, 0.3);
      for (var k = 1; k < 6; k++) { var t = k / 6; mb.poly([[-ox, mix(eave - 0.02, ridge, t) + 0.003, s * ez * (1 - t)], [ox, mix(eave - 0.02, ridge, t) + 0.003, s * ez * (1 - t)], [ox, mix(eave - 0.02, ridge, t) + 0.012, s * ez * (1 - t) - s * 0.012], [-ox, mix(eave - 0.02, ridge, t) + 0.012, s * ez * (1 - t) - s * 0.012]], n, [ROOF[0] * 0.78, ROOF[1] * 0.78, ROOF[2] * 0.78], 0.3); }
    });
    mb.box(0, ridge + 0.012, 0, ox + 0.01, 0.025, 0.04, [ROOF[0] * 0.7, ROOF[1] * 0.7, ROOF[2] * 0.7], 0.3, { bevel: 0.008 });
    // gable ends (triangles) closing the roof
    [-1, 1].forEach(function (s) { mb.poly([[s * 0.8, eave - 0.02, -0.76], [s * 0.8, eave - 0.02, 0.76], [s * 0.8, ridge - 0.03, 0]], [s, 0, 0], WALL, 0.2); });
    // chimney
    mb.box(0.5, 1.42, -0.2, 0.09, 0.28, 0.09, BRICK, 0.2, { bevel: 0.008 });
    mb.box(0.5, 1.72, -0.2, 0.11, 0.025, 0.11, [0.42, 0.40, 0.40], 0.25, { bevel: 0.006 });
    // step, porch lamp
    mb.box(0, 0.045, D + 0.19, 0.3, 0.03, 0.17, STONE, 0.2, { bevel: 0.006 });
    mb.box(0.3, 0.55, D + 0.03, 0.025, 0.04, 0.025, [0.2, 0.2, 0.22], 0.4);
    mb.box(0.3, 0.52, D + 0.03, 0.02, 0.02, 0.02, [1.0, 0.85, 0.5], 0.5, { kind: 3 });
    // the workshop has a sign over the door and kraft sacks by the wall
    if (W) {
      mb.decal([-0.42, 0.80, D + 0.02], [0.42, 0.80, D + 0.02], [0.42, 0.96, D + 0.02], [-0.42, 0.96, D + 0.02], K.ATLAS.sign, false, [0, 0, 1]);
      mb.box(-0.72, 0.1, D + 0.2, 0.1, 0.1, 0.07, KRAFT, 0.18, { bevel: 0.015 });
      mb.box(-0.58, 0.09, D + 0.2, 0.08, 0.09, 0.07, [0.7, 0.55, 0.34], 0.18, { bevel: 0.015 });
    }
    return mb.mesh();
  }
  // the front door leaf, hinged on its left edge; origin = hinge at floor level; leaf extends to +x
  function buildDoor() {
    var mb = new MB(), doorW = 0.17, doorH = 0.64, th = 0.022;
    mb.box(doorW, doorH / 2, 0, doorW, doorH / 2, th, FLAME, 0.55, { bevel: 0.008 });
    mb.box(doorW, doorH * 0.7, th + 0.004, doorW * 0.62, doorH * 0.18, 0.006, [0.78, 0.28, 0.14], 0.5);
    mb.box(doorW, doorH * 0.3, th + 0.004, doorW * 0.62, doorH * 0.18, 0.006, [0.78, 0.28, 0.14], 0.5);
    mb.sphere(doorW * 1.75, doorH * 0.5, th + 0.012, 0.016, 0.016, 0.016, 8, 6, [0.88, 0.72, 0.36], 0.9, { slot: 1 });
    mb.box(doorW * 0.5, doorH * 0.78, th + 0.01, 0.045, 0.012, 0.004, [0.88, 0.72, 0.36], 0.9, { metal: 1 });
    return mb.mesh();
  }

  /* ------------------------------------------------------------- the city */
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function roundedPath(pts, r, step) {
    var out = [pts[0].slice()];
    for (var i = 1; i < pts.length - 1; i++) {
      var p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1];
      var ax = p1[0] - p0[0], az = p1[1] - p0[1], al = Math.hypot(ax, az), bx = p2[0] - p1[0], bz = p2[1] - p1[1], bl = Math.hypot(bx, bz);
      ax /= al; az /= al; bx /= bl; bz /= bl;
      var s = [p1[0] - ax * r, p1[1] - az * r], e = [p1[0] + bx * r, p1[1] + bz * r];
      for (var k = 0; k <= 10; k++) { var t = k / 10, u = 1 - t; out.push([u * u * s[0] + 2 * u * t * p1[0] + t * t * e[0], u * u * s[1] + 2 * u * t * p1[1] + t * t * e[1]]); }
    }
    out.push(pts[pts.length - 1].slice());
    var cum = [0];
    for (i = 1; i < out.length; i++) cum.push(cum[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
    var total = cum[cum.length - 1], res = [], j = 0;
    for (var d = 0; d <= total + 1e-6; d += step) {
      while (j < cum.length - 2 && cum[j + 1] < d) j++;
      var f = (d - cum[j]) / Math.max(1e-9, cum[j + 1] - cum[j]);
      res.push([mix(out[j][0], out[j + 1][0], f), mix(out[j][1], out[j + 1][1], f)]);
    }
    res.push(out[out.length - 1].slice());
    return res;
  }
  var cityCache = null;
  function riverZ(x) { return -0.9 + 0.9 * Math.sin(x * 0.32 + 0.6); }
  function makeCity() {
    if (cityCache) return cityCache;
    var route = roundedPath([[-9, 8.2], [-9, 3], [3, 3], [3, -3], [9, -3], [9, -6.2]], 0.9, 0.1);
    var cum = [0];
    for (var i = 1; i < route.length; i++) cum.push(cum[i - 1] + Math.hypot(route[i][0] - route[i - 1][0], route[i][1] - route[i - 1][1]));
    var total = cum[cum.length - 1];
    var rnd = rng(7), boxes = [], trees = [], lamps = [];
    var PAL = [[0.86, 0.80, 0.68], [0.90, 0.84, 0.74], [0.78, 0.74, 0.66], [0.67, 0.74, 0.78], [0.88, 0.74, 0.64], [0.74, 0.78, 0.70]];
    var edges = [-15, -9, -3, 3, 9, 15];
    for (var bi = 0; bi < edges.length - 1; bi++) for (var bj = 0; bj < edges.length - 1; bj++) {
      var x0 = edges[bi] + 0.9, x1 = edges[bi + 1] - 0.9, z0 = edges[bj] + 0.9, z1 = edges[bj + 1] - 0.9, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      if ((Math.abs(cx + 6) < 1 && Math.abs(cz + 6) < 1) || (Math.abs(cx - 6) < 1 && Math.abs(cz - 6) < 1)) continue;
      var nx = 2, nz = 2, w = (x1 - x0) / nx, d = (z1 - z0) / nz;
      for (var a = 0; a < nx; a++) for (var b = 0; b < nz; b++) {
        if (rnd() < 0.18 || boxes.length >= 36) continue;
        var hx = w * (0.34 + rnd() * 0.12), hz = d * (0.34 + rnd() * 0.12);
        var x = x0 + w * (a + 0.5) + (rnd() - 0.5) * 0.3, z = z0 + d * (b + 0.5) + (rnd() - 0.5) * 0.3;
        if (Math.abs(z - riverZ(x)) < 1.35 + hz) continue;
        if (Math.hypot(x + 11.2, z - 8.4) < 2.6 || Math.hypot(x - 11.4, z + 8.2) < 2.6) continue;
        var dist = Math.hypot(x, z), h = (0.5 + rnd() * 1.7) * (dist < 9 ? 1.25 : 0.85), dmin = 99;
        for (var rp = 0; rp < route.length; rp += 3) dmin = Math.min(dmin, Math.hypot(x - route[rp][0], z - route[rp][1]));
        h = Math.min(h, 0.55 + 0.32 * dmin);
        boxes.push({ x: x, z: z, hx: hx, hz: hz, h: h, tint: PAL[Math.floor(rnd() * PAL.length)], seed: rnd(), delay: rnd() * 0.6, roof: Math.floor(rnd() * 3) });
      }
    }
    // trees along the pavements and in the two parks
    var roadsAt = [-9, -3, 3, 9];
    roadsAt.forEach(function (X) {
      for (var t = -13; t <= 13; t += 1.5) {
        [-1, 1].forEach(function (side) {
          if (rnd() < 0.5 || trees.length >= 56) return;
          var near = false; roadsAt.forEach(function (Z) { if (Math.abs(t - Z) < 1.5) near = true; });
          if (near) return;
          var tx = X + side * 0.66, tz = t;
          if (Math.abs(tz - riverZ(tx)) < 1.7) return;
          trees.push({ x: tx, z: tz, s: 0.85 + rnd() * 0.5, c: rnd() });
          return;
        });
        [-1, 1].forEach(function (side) {
          if (rnd() < 0.6 || trees.length >= 56) return;
          var near2 = false; roadsAt.forEach(function (Z) { if (Math.abs(t - Z) < 1.5) near2 = true; });
          if (near2) return;
          var tx2 = t, tz2 = X + side * 0.66;
          if (Math.abs(tz2 - riverZ(tx2)) < 1.7) return;
          trees.push({ x: tx2, z: tz2, s: 0.85 + rnd() * 0.5, c: rnd() });
        });
      }
    });
    [[-6, -6], [6, 6]].forEach(function (p) { for (var k = 0; k < 7; k++) trees.push({ x: p[0] + (rnd() - 0.5) * 3.4, z: p[1] + (rnd() - 0.5) * 3.4, s: 1.0 + rnd() * 0.6, c: rnd() }); });
    for (var ii = 0; ii < 4; ii++) for (var jj = 0; jj < 4; jj++) if ((ii * 4 + jj) % 3 !== 1) lamps.push({ x: roadsAt[ii] + 0.58, z: roadsAt[jj] + 0.58 });
    cityCache = { route: route, cum: cum, total: total, boxes: boxes, trees: trees, lamps: lamps, workshop: [-11.2, 8.4], home: [11.4, -8.2], riverZ: riverZ };
    return cityCache;
  }
  function pathAt(city, t) {
    var s = clamp(t, 0, 1) * city.total, c = city.cum, lo = 0, hi = c.length - 1;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (c[mid] <= s) lo = mid; else hi = mid; }
    var u = (s - c[lo]) / Math.max(1e-9, c[hi] - c[lo]), a = city.route[lo], b = city.route[hi];
    var dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
    return { x: mix(a[0], b[0], u), z: mix(a[1], b[1], u), dx: dx / l, dz: dz / l };
  }
  function buildCity() {
    var C = makeCity(), mb = new MB();
    var DARK = [0.34, 0.33, 0.35], TERRA = [0.70, 0.30, 0.21], GREY = [0.55, 0.56, 0.58];
    C.boxes.forEach(function (b) {
      var d = b.delay;
      mb.box(b.x, b.h / 2, b.z, b.hx, b.h / 2, b.hz, b.tint, 0.2, { bevel: 0.03, kind: 4, slot: b.seed, h: d });
      var top = b.h;
      if (b.roof === 0 || b.h > 1.3) { // flat roof with a parapet and some equipment
        var pt = 0.05, ph = 0.07, rc = [b.tint[0] * 0.86, b.tint[1] * 0.86, b.tint[2] * 0.86];
        mb.box(b.x, top + ph / 2, b.z - b.hz + pt / 2, b.hx, ph / 2, pt / 2, rc, 0.2, { h: d });
        mb.box(b.x, top + ph / 2, b.z + b.hz - pt / 2, b.hx, ph / 2, pt / 2, rc, 0.2, { h: d });
        mb.box(b.x - b.hx + pt / 2, top + ph / 2, b.z, pt / 2, ph / 2, b.hz, rc, 0.2, { h: d });
        mb.box(b.x + b.hx - pt / 2, top + ph / 2, b.z, pt / 2, ph / 2, b.hz, rc, 0.2, { h: d });
        mb.box(b.x + b.hx * 0.35, top + 0.09, b.z - b.hz * 0.3, b.hx * 0.22, 0.07, b.hz * 0.22, GREY, 0.3, { bevel: 0.01, h: d });
        mb.box(b.x - b.hx * 0.4, top + 0.12, b.z + b.hz * 0.35, b.hx * 0.25, 0.1, b.hz * 0.25, [0.74, 0.72, 0.68], 0.2, { bevel: 0.01, h: d });
      } else if (b.roof === 1) { // gable roof along the longer side
        var along = b.hx >= b.hz, L = along ? b.hx : b.hz, Wd = along ? b.hz : b.hx, rh = Math.min(0.55, Wd * 0.7);
        mb.push(along ? rotY(PI / 2) : ID3, [b.x, top, b.z]);
        mb.extrude([[-Wd - 0.04, 0], [Wd + 0.04, 0], [0, rh]].map(function (p) { return [p[0], p[1]]; }), -L - 0.04, L + 0.04, TERRA, 0.3, { h: d });
        mb.pop();
      } else { // low hip roof (frustum)
        var rh2 = Math.min(0.4, Math.min(b.hx, b.hz) * 0.6), sx = b.hx + 0.03, sz = b.hz + 0.03, tx = sx * 0.35, tz = sz * 0.35, y0 = top, y1 = top + rh2;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (q) {
          var pts, n;
          if (q[0] !== 0) { pts = [[b.x + q[0] * sx, y0, b.z - sz], [b.x + q[0] * sx, y0, b.z + sz], [b.x + q[0] * tx, y1, b.z + tz], [b.x + q[0] * tx, y1, b.z - tz]]; n = nrm([q[0] * rh2, sx - tx, 0]); }
          else { pts = [[b.x - sx, y0, b.z + q[1] * sz], [b.x + sx, y0, b.z + q[1] * sz], [b.x + tx, y1, b.z + q[1] * tz], [b.x - tx, y1, b.z + q[1] * tz]]; n = nrm([0, sz - tz, q[1] * rh2]); }
          mb.poly(pts, n, [0.58, 0.58, 0.60], 0.3, { h: d });
        });
        mb.poly([[b.x - tx, y1, b.z - tz], [b.x + tx, y1, b.z - tz], [b.x + tx, y1, b.z + tz], [b.x - tx, y1, b.z + tz]], [0, 1, 0], [0.58, 0.58, 0.60], 0.3, { h: d });
      }
    });
    // trees: trunk + two or three rounded crowns, sway weight in the slot channel
    var GREENS = [[0.36, 0.58, 0.28], [0.30, 0.52, 0.26], [0.45, 0.64, 0.30], [0.26, 0.46, 0.27]];
    C.trees.forEach(function (t, n) {
      var g = GREENS[Math.floor(t.c * GREENS.length) % GREENS.length], d = 0.05 + (n % 7) * 0.07, s = t.s * 0.78;
      mb.cyl(t.x, 0.17 * s * 2, t.z, 0.035 * s * 1.6, 0.34 * s * 2, 'y', 7, [0.40, 0.28, 0.18], 0.2, { h: d });
      var o = { h: d, kind: 5, slotAt: function (y) { return clamp(0.4 + y * 0.6, 0, 1); }, colorAt: function (y) { var k = 0.88 + 0.16 * y; return [g[0] * k, g[1] * k, g[2] * k]; } };
      mb.sphere(t.x, 0.52 * s * 1.5, t.z, 0.26 * s * 1.5, 0.23 * s * 1.5, 0.26 * s * 1.5, 11, 8, g, 0.12, o);
      mb.sphere(t.x + 0.1 * s, 0.7 * s * 1.5, t.z - 0.05 * s, 0.17 * s * 1.5, 0.16 * s * 1.5, 0.17 * s * 1.5, 10, 7, g, 0.12, o);
    });
    // street lamps
    C.lamps.forEach(function (l, n) {
      var d = 0.02 + (n % 5) * 0.05;
      mb.cyl(l.x, 0.5, l.z, 0.014, 1.0, 'y', 6, DARK, 0.3, { h: d });
      mb.box(l.x, 1.03, l.z, 0.05, 0.014, 0.05, DARK, 0.3, { h: d });
      mb.box(l.x, 1.012, l.z, 0.038, 0.008, 0.038, [1.0, 0.92, 0.7], 0.5, { kind: 3, h: d });
    });
    // bridges over the river on the four crossing roads: low parapets and pillars
    [-9, -3, 3, 9].forEach(function (X) {
      var zc = riverZ(X), hz = 1.1;
      [-1, 1].forEach(function (s) {
        mb.box(X + s * 0.37, 0.06, zc, 0.03, 0.06, hz, [0.55, 0.52, 0.5], 0.25, { bevel: 0.008, h: 0.01 });
        mb.box(X + s * 0.37, 0.12, zc, 0.016, 0.012, hz, [0.45, 0.43, 0.42], 0.3, { h: 0.01 });
      });
    });
    return mb.mesh();
  }

  /* ---------------------------------------------------------- small cars */
  function buildCar(color) {
    var mb = new MB(), GLASS = [0.07, 0.09, 0.12], DARK = [0.1, 0.1, 0.11];
    mb.box(0, 0.16, 0, 0.5, 0.11, 0.24, color, 0.7, { bevel: 0.05 });
    mb.box(-0.04, 0.34, 0, 0.27, 0.085, 0.215, color, 0.7, { bevel: 0.04 });
    mb.box(-0.04, 0.345, 0, 0.245, 0.06, 0.222, GLASS, 0.95);
    mb.box(0.5, 0.12, 0, 0.012, 0.045, 0.17, [1.0, 0.95, 0.78], 0.9, { kind: 3 });
    mb.box(-0.5, 0.14, 0, 0.012, 0.04, 0.17, [0.8, 0.1, 0.08], 0.8, { kind: 7 });
    [[-0.32, 0.22], [-0.32, -0.22], [0.3, 0.22], [0.3, -0.22]].forEach(function (w) {
      mb.push(ID3, [w[0], 0.075, w[1]]);
      mb.cyl(0, 0, 0, 0.075, 0.07, 'z', 12, DARK, 0.25);
      mb.cyl(0, 0, w[1] > 0 ? 0.036 : -0.036, 0.045, 0.01, 'z', 10, SILVER, 0.9, { metal: 1 });
      mb.pop();
    });
    return mb.mesh();
  }

  /* --------------------------------------------------------- the courier */
  // feet at y=0, ~1.0 tall; body pivot = hips (0, 0.40, 0); legs pivot at the hip, arms at the shoulder (written as separate meshes)
  var JACKET = [0.89, 0.34, 0.17], JEANS = [0.13, 0.17, 0.24], SKIN = [0.93, 0.74, 0.60], SHOE = [0.10, 0.08, 0.07];
  function buildCourierBody() {
    var mb = new MB();
    mb.sphere(0, 0.575, 0, 0.17, 0.2, 0.115, 16, 12, JACKET, 0.35);               // torso
    mb.box(0, 0.42, 0, 0.165, 0.035, 0.11, JEANS, 0.3, { bevel: 0.01 });          // belt line
    mb.box(0, 0.62, 0.12, 0.17, 0.015, 0.006, [0.95, 0.92, 0.86], 0.35);           // reflective stripe
    mb.sphere(0, 0.865, 0.005, 0.125, 0.135, 0.125, 18, 14, SKIN, 0.3);            // head
    mb.cyl(0, 0.77, 0, 0.045, 0.06, 'y', 10, SKIN, 0.3);                          // neck
    mb.sphere(0, 0.915, -0.005, 0.135, 0.09, 0.135, 18, 10, INK, 0.3);             // cap crown
    mb.box(0, 0.895, 0.125, 0.105, 0.012, 0.085, INK, 0.3, { bevel: 0.006 });      // visor
    mb.sphere(-0.045, 0.865, 0.118, 0.012, 0.014, 0.01, 6, 5, [0.08, 0.06, 0.06], 0.6); // eyes
    mb.sphere(0.045, 0.865, 0.118, 0.012, 0.014, 0.01, 6, 5, [0.08, 0.06, 0.06], 0.6);
    mb.sphere(0, 0.835, 0.125, 0.016, 0.014, 0.014, 6, 5, [0.88, 0.62, 0.5], 0.3);  // nose
    // delivery backpack
    mb.box(0, 0.62, -0.22, 0.18, 0.2, 0.12, [0.96, 0.92, 0.84], 0.3, { bevel: 0.02 });
    mb.box(0, 0.62, -0.22, 0.185, 0.04, 0.125, JACKET, 0.35);
    mb.box(0, 0.72, -0.33, 0.12, 0.05, 0.012, JACKET, 0.35);
    mb.decal([-0.15, 0.55, -0.337], [0.15, 0.55, -0.337], [0.15, 0.70, -0.337], [-0.15, 0.70, -0.337], K.ATLAS.logo, true, [0, 0, -1]);
    mb.box(-0.1, 0.62, -0.1, 0.012, 0.18, 0.07, INK, 0.3); mb.box(0.1, 0.62, -0.1, 0.012, 0.18, 0.07, INK, 0.3);
    return mb.mesh();
  }
  function buildCourierArm() { // pivot at the shoulder, hangs down along -y
    var mb = new MB();
    mb.push(rotX(PI), [0, 0, 0]);
    mb.capsule(0.33, 0.052, 10, JACKET, 0.35);
    mb.pop();
    mb.sphere(0, -0.345, 0, 0.05, 0.05, 0.05, 10, 8, SKIN, 0.3);
    return mb.mesh();
  }
  function buildCourierLeg() { // pivot at the hip, hangs down along -y
    var mb = new MB();
    mb.push(rotX(PI), [0, 0, 0]);
    mb.capsule(0.34, 0.07, 10, JEANS, 0.3);
    mb.pop();
    mb.box(0, -0.385, 0.035, 0.07, 0.025, 0.1, SHOE, 0.3, { bevel: 0.012 });
    return mb.mesh();
  }

  /* ----------------------------------------------------- the date stamp */
  function buildStamp() { // pivot = the middle of the rubber face, handle goes up (+y)
    var mb = new MB();
    mb.box(0, 0.012, 0, 0.17, 0.012, 0.06, [0.08, 0.08, 0.09], 0.25, { bevel: 0.004 });
    mb.box(0, 0.06, 0, 0.19, 0.036, 0.075, [0.66, 0.46, 0.27], 0.35, { bevel: 0.012 });
    mb.cyl(0, 0.2, 0, 0.045, 0.2, 'y', 14, [0.66, 0.46, 0.27], 0.35);
    mb.sphere(0, 0.31, 0, 0.065, 0.045, 0.065, 14, 10, [0.62, 0.42, 0.24], 0.4);
    return mb.mesh();
  }

  K.registerShape('kettle', buildKettle);
  K.registerShape('wheel', buildWheel);
  K.registerShape('vanD', buildVan);
  K.registerShape('houseH', function () { return buildHouse('H'); });
  K.registerShape('houseW', function () { return buildHouse('W'); });
  K.registerShape('houseDoor', buildDoor);
  K.registerShape('city', buildCity);
  K.registerShape('car0', function () { return buildCar([0.88, 0.34, 0.20]); });
  K.registerShape('car1', function () { return buildCar([0.30, 0.46, 0.62]); });
  K.registerShape('car2', function () { return buildCar([0.92, 0.88, 0.80]); });
  K.registerShape('car3', function () { return buildCar([0.40, 0.55, 0.40]); });
  K.registerShape('cBody', buildCourierBody);
  K.registerShape('cArm', buildCourierArm);
  K.registerShape('cLeg', buildCourierLeg);
  K.registerShape('stamp', buildStamp);
  K.makeCity = makeCity; K.pathAt = pathAt; K.KETTLE_TIP = KETTLE_TIP; K.KETTLE_DIR = KETTLE_DIR; K.VAN_WHEELS = VAN_WHEELS;
  K._mb = MB;
})(typeof window !== 'undefined' ? window : this);
