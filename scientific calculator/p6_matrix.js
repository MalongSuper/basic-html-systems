
/* =====================================================================
   12. Matrix calculator tab
   ===================================================================== */
const SUBD = '₀₁₂₃₄₅₆₇₈₉';
const subs = n => String(n).split('').map(d => SUBD[+d]).join('');

/* ---------- number fields: exact rationals (BigInt) or floating point ---------- */
const QF = {
  exact: true,
  zero: { n: 0n, d: 1n }, one: { n: 1n, d: 1n },
  make(n, d) { if (d < 0n) { n = -n; d = -d; } const g = bgcd(n, d) || 1n; return { n: n / g, d: d / g }; },
  from(x) {
    if (!Number.isFinite(x)) return null;
    const f = toFrac(x, 1e9, 1e-13);
    if (!f) return null;
    return QF.make(BigInt(f[0]), BigInt(f[1]));
  },
  int(k) { return { n: BigInt(k), d: 1n }; },
  add: (a, b) => QF.make(a.n * b.d + b.n * a.d, a.d * b.d),
  sub: (a, b) => QF.make(a.n * b.d - b.n * a.d, a.d * b.d),
  mul: (a, b) => QF.make(a.n * b.n, a.d * b.d),
  div: (a, b) => { if (b.n === 0n) throw new Error('Division by zero'); return QF.make(a.n * b.d, a.d * b.n); },
  neg: a => ({ n: -a.n, d: a.d }),
  isZero: a => a.n === 0n,
  eq: (a, b) => a.n === b.n && a.d === b.d,
  sgn: a => (a.n > 0n ? 1 : a.n < 0n ? -1 : 0),
  abs: a => ({ n: a.n < 0n ? -a.n : a.n, d: a.d }),
  toNum: a => { const x = Number(a.n) / Number(a.d); return Number.isFinite(x) ? x : Number(a.n * 1000000000000n / a.d) / 1e12; },
  str(a, digits) {
    if (a.d === 1n) { const s = a.n.toString(); return s.length > 16 ? fmtNum(Number(a.n), digits || 10) : s; }
    const s = a.n + '/' + a.d;
    return s.length > 18 ? '≈' + fmtNum(QF.toNum(a), digits || 8) : s;
  },
};
const FF = {
  exact: false, eps: 1e-11,
  zero: 0, one: 1,
  from: x => x, int: k => k,
  add: (a, b) => a + b, sub: (a, b) => a - b, mul: (a, b) => a * b,
  div: (a, b) => { if (Math.abs(b) <= FF.eps) throw new Error('Division by zero'); return a / b; },
  neg: a => -a,
  isZero: a => Math.abs(a) <= FF.eps,
  eq: (a, b) => Math.abs(a - b) <= FF.eps,
  sgn: a => (Math.abs(a) <= FF.eps ? 0 : a > 0 ? 1 : -1),
  abs: Math.abs,
  toNum: a => a,
  str: (a, digits) => { const t = Math.abs(a) <= FF.eps * 10 ? 0 : a; return fmtNum(t, digits || 10); },
};
function pickField(numMats) {
  let big = 0;
  for (const M of numMats) for (const r of M) for (const x of r) big = Math.max(big, Math.abs(x));
  FF.eps = 1e-11 * Math.max(1, big);
  for (const M of numMats) for (const r of M) for (const x of r) if (!QF.from(x)) return FF;
  return QF;
}
const toField = (M, F) => M.map(r => r.map(x => F.from(x)));
const fromField = (M, F) => M.map(r => r.map(x => F.toNum(x)));

/* ---------- basic matrix algebra (generic over the field) ---------- */
const mZeros = (m, n, F) => Array.from({ length: m }, () => Array.from({ length: n }, () => F.zero));
const mIdent = (n, F) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? F.one : F.zero)));
const mClone = M => M.map(r => r.slice());
const mT = M => M[0].map((_, j) => M.map(r => r[j]));
function mAddF(A, B, F, sign) { return A.map((r, i) => r.map((x, j) => (sign > 0 ? F.add(x, B[i][j]) : F.sub(x, B[i][j])))); }
function mMulF(A, B, F) {
  const m = A.length, k = B.length, n = B[0].length;
  const R = mZeros(m, n, F);
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) { let s = F.zero; for (let t = 0; t < k; t++) s = F.add(s, F.mul(A[i][t], B[t][j])); R[i][j] = s; }
  return R;
}
function rowOpText(i, r, k, F) {
  const neg = F.sgn(k) < 0, a = F.abs(k);
  const coef = F.eq(a, F.one) ? '' : `${F.str(a)}·`;
  return `R${subs(i + 1)} ← R${subs(i + 1)} ${neg ? '+' : '−'} ${coef}R${subs(r + 1)}`;
}
/* Gaussian / Gauss-Jordan elimination; pivots are searched only in the first nc columns. */
function eliminate(M0, F, o) {
  o = o || {};
  const M = mClone(M0), m = M.length, ncols = M[0].length, nc = o.nc || ncols;
  const steps = [];
  const snap = d => { if (o.record) steps.push({ d, M: mClone(M) }); };
  snap('Start');
  let r = 0; const piv = []; let swaps = 0;
  for (let c = 0; c < nc && r < m; c++) {
    let p = -1;
    for (let i = r; i < m; i++) if (!F.isZero(M[i][c])) { p = i; break; }
    if (p < 0) continue;
    if (p !== r) { [M[p], M[r]] = [M[r], M[p]]; swaps++; snap(`R${subs(r + 1)} ↔ R${subs(p + 1)}`); }
    piv.push([r, c]);
    if (o.jordan) {
      const pv = M[r][c];
      if (!F.eq(pv, F.one)) {
        for (let j = 0; j < ncols; j++) M[r][j] = F.div(M[r][j], pv);
        M[r][c] = F.one;
        snap(`R${subs(r + 1)} ← R${subs(r + 1)} ÷ ${F.str(pv)}`);
      }
    }
    for (let i = o.jordan ? 0 : r + 1; i < m; i++) {
      if (i === r) continue;
      const f = M[i][c];
      if (F.isZero(f)) continue;
      const k = o.jordan ? f : F.div(f, M[r][c]);
      for (let j = 0; j < ncols; j++) M[i][j] = F.sub(M[i][j], F.mul(k, M[r][j]));
      M[i][c] = F.zero;
      snap(rowOpText(i, r, k, F));
    }
    r++;
  }
  return { M, piv, rank: piv.length, steps, swaps };
}
function detOf(A, F) {
  const n = A.length, M = mClone(A);
  let det = F.one;
  for (let c = 0; c < n; c++) {
    let p = -1;
    if (F.exact) { for (let i = c; i < n; i++) if (!F.isZero(M[i][c])) { p = i; break; } }
    else { let best = 0; for (let i = c; i < n; i++) { const a = Math.abs(M[i][c]); if (a > best) { best = a; p = i; } } if (best <= F.eps) p = -1; }
    if (p < 0) return F.zero;
    if (p !== c) { [M[p], M[c]] = [M[c], M[p]]; det = F.neg(det); }
    det = F.mul(det, M[c][c]);
    for (let i = c + 1; i < n; i++) {
      if (F.isZero(M[i][c])) continue;
      const k = F.div(M[i][c], M[c][c]);
      for (let j = c; j < n; j++) M[i][j] = F.sub(M[i][j], F.mul(k, M[c][j]));
    }
  }
  return det;
}
function inverseOf(A, F, record) {
  const n = A.length;
  const aug = A.map((r, i) => r.concat(mIdent(n, F)[i]));
  const e = eliminate(aug, F, { jordan: true, nc: n, record });
  if (e.rank < n) return { singular: true, steps: e.steps, rank: e.rank };
  return { inv: e.M.map(r => r.slice(n)), steps: e.steps };
}
function luDecomp(A, F) {
  const n = A.length, U = mClone(A), L = mIdent(n, F), perm = [...Array(n).keys()];
  let swaps = 0;
  for (let k = 0; k < n; k++) {
    let p = -1;
    for (let i = k; i < n; i++) if (!F.isZero(U[i][k])) { p = i; break; }
    if (p < 0) continue;
    if (p !== k) {
      [U[p], U[k]] = [U[k], U[p]];
      for (let j = 0; j < k; j++) { const t = L[p][j]; L[p][j] = L[k][j]; L[k][j] = t; }
      [perm[p], perm[k]] = [perm[k], perm[p]]; swaps++;
    }
    for (let i = k + 1; i < n; i++) {
      if (F.isZero(U[i][k])) continue;
      const f = F.div(U[i][k], U[k][k]);
      L[i][k] = f;
      for (let j = k; j < n; j++) U[i][j] = F.sub(U[i][j], F.mul(f, U[k][j]));
      U[i][k] = F.zero;
    }
  }
  const P = perm.map(pi => Array.from({ length: n }, (_, j) => (j === pi ? F.one : F.zero)));
  return { L, U, P, swaps };
}
function qrDecomp(A) {         // A: plain numbers (m x n); Householder, diag(R) >= 0
  const m = A.length, n = A[0].length;
  const R = A.map(r => r.slice());
  const Q = Array.from({ length: m }, (_, i) => Array.from({ length: m }, (_, j) => (i === j ? 1 : 0)));
  let scale = 0; A.forEach(r => r.forEach(x => { scale = Math.max(scale, Math.abs(x)); }));
  const tiny = 1e-13 * Math.max(1, scale);
  for (let k = 0; k < Math.min(m - 1, n); k++) {
    let norm = 0; for (let i = k; i < m; i++) norm += R[i][k] * R[i][k];
    norm = Math.sqrt(norm);
    if (norm <= tiny) continue;
    const alpha = R[k][k] > 0 ? -norm : norm;
    const v = new Array(m).fill(0);
    for (let i = k; i < m; i++) v[i] = R[i][k];
    v[k] -= alpha;
    let vn = 0; for (let i = k; i < m; i++) vn += v[i] * v[i];
    vn = Math.sqrt(vn);
    if (vn <= tiny) continue;
    for (let i = k; i < m; i++) v[i] /= vn;
    for (let j = 0; j < n; j++) { let d = 0; for (let i = k; i < m; i++) d += v[i] * R[i][j]; for (let i = k; i < m; i++) R[i][j] -= 2 * v[i] * d; }
    for (let i = 0; i < m; i++) { let d = 0; for (let j = k; j < m; j++) d += Q[i][j] * v[j]; for (let j = k; j < m; j++) Q[i][j] -= 2 * d * v[j]; }
  }
  for (let i = 0; i < Math.min(m, n); i++) {
    if (R[i][i] < 0) { for (let j = 0; j < n; j++) R[i][j] = -R[i][j]; for (let r = 0; r < m; r++) Q[r][i] = -Q[r][i]; }
  }
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (j < i && Math.abs(R[i][j]) <= tiny) R[i][j] = 0;
  for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) if (Math.abs(Q[i][j]) <= 1e-15) Q[i][j] = 0;
  return { Q, R };
}

/* ---------- eigenvalues & eigenvectors ---------- */
function charPoly(A, F) {
  const n = A.length, c = new Array(n + 1);
  c[n] = F.one;
  let Mprev = mZeros(n, n, F);
  for (let k = 1; k <= n; k++) {
    const AM = mMulF(A, Mprev, F);
    const Mk = AM.map((r, i) => r.map((x, j) => (i === j ? F.add(x, c[n - k + 1]) : x)));
    const AMk = mMulF(A, Mk, F);
    let tr = F.zero; for (let i = 0; i < n; i++) tr = F.add(tr, AMk[i][i]);
    c[n - k] = F.neg(F.div(tr, F.int(k)));
    Mprev = Mk;
  }
  return c;
}
function bigDivisors(n) {
  n = Number(n < 0n ? -n : n);
  if (n === 0) return [];
  const fs = primeFactors(n), m = new Map();
  fs.forEach(p => m.set(p, (m.get(p) || 0) + 1));
  let ds = [1];
  for (const [p, e] of m) { const nd = []; for (const d of ds) { let q = d; for (let i = 0; i <= e; i++) { nd.push(q); q *= p; } } ds = nd; if (ds.length > 5000) break; }
  return ds;
}
function evalIntPoly(a, P, Q) {
  const deg = a.length - 1; let s = 0n;
  for (let i = 0; i <= deg; i++) s += a[i] * (P ** BigInt(i)) * (Q ** BigInt(deg - i));
  return s;
}
function divideByLinear(a, P, Q) {
  const deg = a.length - 1, b = new Array(deg);
  b[deg - 1] = a[deg] / Q;
  for (let i = deg - 1; i >= 1; i--) b[i - 1] = (a[i] + P * b[i]) / Q;
  return b;
}
function rationalRootsOf(a0) {
  let a = a0.slice(); const roots = [];
  for (;;) {
    while (a.length > 1 && a[a.length - 1] === 0n) a.pop();
    if (a.length <= 1) break;
    if (a[0] === 0n) { roots.push({ n: 0n, d: 1n }); a = a.slice(1); continue; }
    const c0 = a[0] < 0n ? -a[0] : a[0], cn = a[a.length - 1] < 0n ? -a[a.length - 1] : a[a.length - 1];
    if (c0 > 10n ** 12n || cn > 10n ** 12n) break;
    const ps = bigDivisors(c0), qs = bigDivisors(cn);
    let found = null;
    outer: for (const q of qs) for (const p of ps) {
      if (gcdNum(p, q) !== 1) continue;
      for (const s of [1, -1]) { const P = BigInt(s * p), Q = BigInt(q); if (evalIntPoly(a, P, Q) === 0n) { found = [P, Q]; break outer; } }
    }
    if (!found) break;
    roots.push({ n: found[0], d: found[1] });
    a = divideByLinear(a, found[0], found[1]);
  }
  return { roots, rest: a };
}
function intScaleBig(cp) {
  let L = 1n;
  for (const x of cp) L = L / bgcd(L, x.d) * x.d;
  let ints = cp.map(x => x.n * (L / x.d));
  let g = 0n; for (const x of ints) g = bgcd(g, x);
  if (g > 1n) ints = ints.map(x => x / g);
  return ints;
}
function cNullspace(Ar, Ai, n, tol) {         // complex matrix (re/im arrays) -> basis of null space
  const re = Ar.map(r => r.slice()), im = Ai.map(r => r.slice());
  const m = re.length; let r = 0; const piv = [];
  for (let c = 0; c < n && r < m; c++) {
    let p = -1, best = tol;
    for (let i = r; i < m; i++) { const a = Math.hypot(re[i][c], im[i][c]); if (a > best) { best = a; p = i; } }
    if (p < 0) continue;
    [re[p], re[r]] = [re[r], re[p]]; [im[p], im[r]] = [im[r], im[p]];
    const pr = re[r][c], pi = im[r][c], d = pr * pr + pi * pi;
    for (let j = 0; j < n; j++) { const a = re[r][j], b = im[r][j]; re[r][j] = (a * pr + b * pi) / d; im[r][j] = (b * pr - a * pi) / d; }
    for (let i = 0; i < m; i++) {
      if (i === r) continue;
      const fr = re[i][c], fi = im[i][c];
      if (Math.hypot(fr, fi) === 0) continue;
      for (let j = 0; j < n; j++) { re[i][j] -= fr * re[r][j] - fi * im[r][j]; im[i][j] -= fr * im[r][j] + fi * re[r][j]; }
    }
    piv.push(c); r++;
  }
  const free = []; for (let j = 0; j < n; j++) if (!piv.includes(j)) free.push(j);
  return free.map(f => {
    const v = Array.from({ length: n }, () => C(0, 0));
    v[f] = C(1, 0);
    piv.forEach((pc, row) => { v[pc] = C(-re[row][f], -im[row][f]); });
    return v;
  });
}
function eigenAnalysis(A, F) {
  const n = A.length;
  const cp = charPoly(A, F);
  const entries = [];     // {z, q?, exactText?}
  let poly = null;
  if (F.exact) {
    const ints = intScaleBig(cp);
    if (ints.every(x => (x < 0n ? -x : x) < 2n ** 53n)) {
      const { roots, rest } = rationalRootsOf(ints);
      roots.forEach(q => entries.push({ z: C(Number(q.n) / Number(q.d)), q: QF.make(q.n, q.d) }));
      if (rest.length > 1) {
        const restN = rest.map(Number);
        let ex = null;
        if (restN.length === 3) ex = quadExact(restN[2], restN[1], restN[0], 'λ');
        polyRoots(restN).forEach(z => entries.push({ z, exactText: ex }));
      }
    } else poly = cp.map(F.toNum);
  } else poly = cp.map(F.toNum);
  if (poly) polyRoots(poly).forEach(z => entries.push({ z }));
  // group equal eigenvalues
  entries.sort((a, b) => (a.z.re - b.z.re) || (a.z.im - b.z.im));
  const groups = [];
  for (const e of entries) {
    const g = groups.find(x => (e.q && x.q ? QF.eq(e.q, x.q) : Math.hypot(x.z.re - e.z.re, x.z.im - e.z.im) < 1e-6 * (1 + cabs(x.z))));
    if (g) g.mult++; else groups.push({ z: e.z, q: e.q || null, mult: 1, exactText: e.exactText || null });
  }
  return { groups, cp, n };
}
function eigenVectors(A, F, g) {
  const n = A.length;
  if (g.q) {
    const M = A.map((r, i) => r.map((x, j) => (i === j ? F.sub(x, g.q) : x)));
    const e = eliminate(M, F, { jordan: true });
    const pivCols = e.piv.map(p => p[1]), free = [];
    for (let j = 0; j < n; j++) if (!pivCols.includes(j)) free.push(j);
    return free.map(f => {
      const v = Array.from({ length: n }, () => QF.zero);
      v[f] = QF.one;
      e.piv.forEach(([r, c]) => { v[c] = QF.neg(e.M[r][f]); });
      let L = 1n; v.forEach(x => { L = L / bgcd(L, x.d) * x.d; });
      let ints = v.map(x => x.n * (L / x.d));
      let gg = 0n; ints.forEach(x => { gg = bgcd(gg, x); });
      if (gg > 1n) ints = ints.map(x => x / gg);
      const first = ints.find(x => x !== 0n);
      if (first < 0n) ints = ints.map(x => -x);
      return ints.map(x => ({ str: x.toString(), z: C(Number(x)) }));
    });
  }
  const An = A.map(r => r.map(F.toNum));
  let scale = 1; An.forEach(r => r.forEach(x => { scale = Math.max(scale, Math.abs(x)); }));
  const Ar = An.map((r, i) => r.map((x, j) => x - (i === j ? g.z.re : 0)));
  const Ai = An.map((r, i) => r.map((x, j) => (i === j ? -g.z.im : 0)));
  for (const tol of [1e-8, 1e-6, 1e-4]) {
    const basis = cNullspace(Ar, Ai, n, tol * scale);
    if (basis.length) {
      return basis.map(v => {
        let nrm = Math.sqrt(v.reduce((s, z) => s + z.re * z.re + z.im * z.im, 0));
        let ph = v.find(z => Math.hypot(z.re, z.im) > 1e-9 * nrm);
        const rot = ph ? cdiv(C(cabs(ph), 0), ph) : C(1, 0);
        return v.map(z => { const w = cleanC(cmul(cdiv(z, C(nrm, 0)), rot)); return { str: fmtC(w, 6), z: w }; });
      });
    }
  }
  return [];
}

/* ---------- rendering helpers ---------- */
function mxHTML(rows, o) {
  o = o || {};
  const n = rows[0].length;
  const cells = [];
  rows.forEach(r => r.forEach((s, j) => {
    const aug = o.aug && j === n - o.aug ? ' style="border-left:1px solid var(--line2);padding-left:10px"' : '';
    const t = s && typeof s === 'object' ? s.title : '';
    cells.push(`<span${aug}${t ? ` title="${esc(t)}"` : ''}>${esc(typeof s === 'object' ? s.s : s)}</span>`);
  }));
  return `<div class="mx" style="grid-template-columns:repeat(${n},auto)">${cells.join('')}</div>`;
}
function fieldStrs(M, F, digits) {
  return M.map(r => r.map(x => {
    const s = F.str(x, digits);
    return F.exact && x.d !== 1n ? { s, title: '≈ ' + fmtNum(F.toNum(x), 10) } : s;
  }));
}
function mblock(label, htmlOrMx) { return `<div class="mblock"><div class="ml">${esc(label)}</div>${htmlOrMx}</div>`; }
function stepsHTML(steps, F, auggAt, open) {
  if (!steps.length) return '';
  const items = steps.map((s, i) => `<div class="step"><div class="sd">${i === 0 ? 'Start' : `Step ${i}: ${esc(s.d)}`}</div>${mxHTML(fieldStrs(s.M, F, 8), { aug: auggAt })}</div>`).join('');
  return `<details class="steps"${open ? ' open' : ''}><summary>${steps.length - 1} row operation${steps.length === 2 ? '' : 's'} (step by step)</summary><div class="stepbox">${items}</div></details>`;
}
function systemSolution(R, nvar, F, nm) {
  nm = nm || 'x';
  for (const row of R) if (row.slice(0, nvar).every(F.isZero) && !F.isZero(row[nvar])) return { type: 'none', lines: ['The system is inconsistent: a row reduces to 0 = ' + F.str(row[nvar]) + ', so there is no solution.'] };
  const piv = []; R.forEach((row, r) => { const c = row.findIndex((x, j) => j < nvar && !F.isZero(x)); if (c >= 0) piv.push([r, c]); });
  const pc = piv.map(p => p[1]), free = []; for (let j = 0; j < nvar; j++) if (!pc.includes(j)) free.push(j);
  if (!free.length) {
    const x = Array(nvar).fill(F.zero); piv.forEach(([r, c]) => { x[c] = R[r][nvar]; });
    return { type: 'unique', x, lines: x.map((v, i) => `${nm}${subs(i + 1)} = ${F.str(v)}`) };
  }
  const lines = [];
  for (let j = 0; j < nvar; j++) {
    if (free.includes(j)) { lines.push(`${nm}${subs(j + 1)} = t${subs(free.indexOf(j) + 1)}   (free variable)`); continue; }
    const row = piv.find(p => p[1] === j)[0];
    let s = F.isZero(R[row][nvar]) ? '' : F.str(R[row][nvar]);
    free.forEach((fj, k) => {
      const co = F.neg(R[row][fj]);
      if (F.isZero(co)) return;
      const neg = F.sgn(co) < 0, a = F.abs(co);
      const cs = F.eq(a, F.one) ? '' : (/\//.test(F.str(a)) ? `(${F.str(a)})` : F.str(a));
      const term = `${cs}t${subs(k + 1)}`;
      s += s ? (neg ? ' − ' : ' + ') + term : (neg ? '−' : '') + term;
    });
    lines.push(`${nm}${subs(j + 1)} = ${s || '0'}`);
  }
  return { type: 'infinite', free, lines };
}

/* ---------- UI ---------- */
const MX = {
  A: { r: 3, c: 3, v: [['2', '1', '-1', '', '', ''], ['-3', '-1', '2', '', '', ''], ['-2', '1', '2', '', '', '']] },
  B: { r: 3, c: 3, v: [['1', '2', '0'], ['0', '1', '3'], ['4', '0', '1']] },
  b: ['8', '-11', '-3', '0', '0'],
  last: null,
};
function ensure(name) {
  const m = MX[name];
  while (m.v.length < 5) m.v.push([]);
  m.v.forEach(r => { while (r.length < 5) r.push('0'); });
  m.v.forEach(r => r.forEach((x, j) => { if (x === '') r[j] = '0'; }));
}
['A', 'B'].forEach(ensure);

function readMat(name) {
  const m = MX[name], rows = [];
  for (let i = 0; i < m.r; i++) {
    const row = [];
    for (let j = 0; j < m.c; j++) {
      const t = (m.v[i][j] || '').trim();
      if (t === '') { row.push(0); continue; }
      try { row.push(evalNumber(t)); } catch (e) { throw new Error(`${name}[${i + 1},${j + 1}]: ${e.message}`); }
    }
    rows.push(row);
  }
  return rows;
}
function readB() {
  const b = [];
  for (let i = 0; i < MX.A.r; i++) {
    const t = (MX.b[i] || '').trim();
    if (t === '') { b.push(0); continue; }
    try { b.push(evalNumber(t)); } catch (e) { throw new Error(`b[${i + 1}]: ${e.message}`); }
  }
  return b;
}
function buildMatrix() {
  const root = $('#panel-matrix');
  const sel = (id, v) => `<select id="${id}" style="width:auto">${[1, 2, 3, 4, 5].map(k => `<option value="${k}"${k === v ? ' selected' : ''}>${k}</option>`).join('')}</select>`;
  const matCard = (nm, extra) => `
    <div class="card" id="card${nm}">
      <div class="row" style="justify-content:space-between"><h3 style="margin:0">Matrix ${nm}</h3>
        <div class="row" style="gap:6px"><span class="small muted">rows</span>${sel('r' + nm, MX[nm].r)}<span class="small muted">cols</span>${sel('c' + nm, MX[nm].c)}</div></div>
      <div class="row" style="margin-top:8px;gap:6px">
        <button class="btn sm" type="button" data-fill="${nm}:id">Identity</button><button class="btn sm" type="button" data-fill="${nm}:zero">Zeros</button>
        <button class="btn sm" type="button" data-fill="${nm}:rand">Random</button>${extra || ''}
      </div>
      <div class="mrow"><div class="mgrid" id="grid${nm}"></div>${nm === 'A' ? `<div class="bcol"><div class="small muted" style="text-align:center">b</div><div class="mgrid" id="gridb"></div></div>` : ''}</div>
    </div>`;
  root.innerHTML = `
    <div class="mx-top">${matCard('A', '<button class="btn sm" type="button" id="mswap">Swap A ↔ B</button>')}${matCard('B')}</div>
    <div class="card" style="margin-top:18px">
      <h3>Operations</h3>
      <div class="opgroup"><div class="gl">Two matrices (A and B)</div><div class="row">
        <button class="opbtn two" data-op="add" type="button">A + B</button><button class="opbtn two" data-op="sub" type="button">A − B</button>
        <button class="opbtn two" data-op="mulAB" type="button">A × B</button><button class="opbtn two" data-op="mulBA" type="button">B × A</button>
        <button class="opbtn two" data-op="divAB" type="button">A ÷ B &nbsp;(A·B⁻¹)</button><button class="opbtn two" data-op="divBA" type="button">B ÷ A &nbsp;(B·A⁻¹)</button></div></div>
      <div class="opgroup"><div class="gl">Single matrix &nbsp;<span style="text-transform:none;letter-spacing:0;font-weight:500">acting on</span>
        <select id="mtarget" style="width:auto;display:inline-block;padding:3px 8px;margin-left:4px"><option value="A">A</option><option value="B">B</option></select></div><div class="row">
        <button class="opbtn" data-op="det" type="button">Determinant</button><button class="opbtn" data-op="inv" type="button">Inverse</button>
        <button class="opbtn" data-op="T" type="button">Transpose</button><button class="opbtn" data-op="rank" type="button">Rank</button><button class="opbtn" data-op="trace" type="button">Trace</button>
        <button class="opbtn" data-op="ref" type="button">REF</button><button class="opbtn" data-op="rref" type="button">RREF</button>
        <button class="opbtn" data-op="gauss" type="button">Gaussian elimination</button><button class="opbtn" data-op="gj" type="button">Gauss–Jordan</button>
        <button class="opbtn" data-op="lu" type="button">LU</button><button class="opbtn" data-op="qr" type="button">QR</button>
        <button class="opbtn" data-op="eigval" type="button">Eigenvalues</button><button class="opbtn" data-op="eigvec" type="button">Eigenvectors</button></div>
        <label class="small muted" style="display:flex;gap:6px;align-items:center;margin-top:8px"><input type="checkbox" id="maug" style="accent-color:var(--b600)"> Use the augmented matrix [A | b] for REF, RREF, Gaussian elimination and Gauss–Jordan</label></div>
      <div class="opgroup"><div class="gl">Linear system Ax = b (uses matrix A and the b column)</div><div class="row">
        <button class="opbtn eqb" data-op="solve" type="button">Solve Ax = b</button></div></div>
    </div>
    <div class="card mresult" id="mres"><div class="muted">Results appear here. Enter matrices above (fractions like 1/2 and expressions like sqrt(2) are allowed), then choose an operation.</div></div>
    <div class="card" style="margin-top:18px">
      <h3>Jacobian matrix</h3>
      <div class="small muted">One function per line (for example <span class="mono">x^2*y</span>). Each row of the Jacobian holds the partial derivatives of one function.</div>
      <div class="formrow" style="margin-top:6px">
        <div style="grid-column:span 2">${'<label class="lab">Functions f₁, f₂, …</label>'}<textarea id="jfns" rows="3" spellcheck="false">x^2*y
5*x + sin(y)</textarea></div>
        <div><label class="lab">Variables (optional)</label><input type="text" id="jvars" placeholder="x, y"><label class="lab">Evaluate at (optional)</label><input type="text" id="jpt" placeholder="x=1, y=2"></div>
      </div>
      <div class="row" style="margin-top:8px"><button class="opbtn eqb" id="jgo" type="button">Compute Jacobian</button></div>
      <div class="out" id="jout"></div>
    </div>`;

  function renderGrid(nm) {
    const m = MX[nm], g = document.getElementById('grid' + nm);
    g.style.gridTemplateColumns = `repeat(${m.c}, minmax(54px, 1fr))`;
    g.innerHTML = '';
    for (let i = 0; i < m.r; i++) for (let j = 0; j < m.c; j++) {
      const inp = h('input', { type: 'text', value: m.v[i][j], inputmode: 'text', 'aria-label': `${nm} row ${i + 1} column ${j + 1}`, spellcheck: 'false', autocomplete: 'off', 'data-i': i, 'data-j': j });
      inp.addEventListener('input', () => { m.v[i][j] = inp.value; });
      inp.addEventListener('focus', () => inp.select());
      inp.addEventListener('keydown', ev => navKey(ev, g, i, j, m.r, m.c));
      g.append(inp);
    }
    if (nm === 'A') {
      const gb = document.getElementById('gridb');
      gb.style.gridTemplateColumns = 'minmax(54px,1fr)';
      gb.innerHTML = '';
      for (let i = 0; i < m.r; i++) {
        const inp = h('input', { type: 'text', value: MX.b[i] || '0', 'aria-label': `b row ${i + 1}`, spellcheck: 'false', autocomplete: 'off', 'data-i': i, 'data-j': 'b' });
        inp.addEventListener('input', () => { MX.b[i] = inp.value; });
        inp.addEventListener('focus', () => inp.select());
        inp.addEventListener('keydown', ev => { if (ev.key === 'ArrowDown' || ev.key === 'Enter') { ev.preventDefault(); const nx = gb.children[(i + 1) % m.r]; nx && nx.focus(); } else if (ev.key === 'ArrowUp') { ev.preventDefault(); const nx = gb.children[(i + m.r - 1) % m.r]; nx && nx.focus(); } else if (ev.key === 'ArrowLeft' && inp.selectionStart === 0) { const nx = g.children[i * m.c + m.c - 1]; nx && nx.focus(); } });
        gb.append(inp);
      }
    }
  }
  function navKey(ev, g, i, j, R, Cn) {
    let ni = i, nj = j;
    if (ev.key === 'ArrowDown' || ev.key === 'Enter') ni = (i + 1) % R;
    else if (ev.key === 'ArrowUp') ni = (i + R - 1) % R;
    else if (ev.key === 'ArrowRight' && ev.target.selectionStart === ev.target.value.length) nj = j + 1;
    else if (ev.key === 'ArrowLeft' && ev.target.selectionStart === 0) nj = j - 1;
    else return;
    if (nj < 0 || nj >= Cn) {
      if (nj >= Cn && g.id === 'gridA') { const gb = document.getElementById('gridb'); gb.children[i] && gb.children[i].focus(); ev.preventDefault(); }
      return;
    }
    ev.preventDefault();
    const t = g.children[ni * Cn + nj];
    if (t) t.focus();
  }
  ['A', 'B'].forEach(nm => {
    renderGrid(nm);
    document.getElementById('r' + nm).addEventListener('change', e => { MX[nm].r = +e.target.value; renderGrid(nm); });
    document.getElementById('c' + nm).addEventListener('change', e => { MX[nm].c = +e.target.value; renderGrid(nm); });
  });
  $$('[data-fill]').forEach(b => b.addEventListener('click', () => {
    const [nm, kind] = b.dataset.fill.split(':'), m = MX[nm];
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) m.v[i][j] = kind === 'id' ? (i === j ? '1' : '0') : kind === 'zero' ? '0' : String(Math.floor(Math.random() * 19) - 9);
    if (nm === 'A' && kind === 'rand') for (let i = 0; i < 5; i++) MX.b[i] = String(Math.floor(Math.random() * 19) - 9);
    if (nm === 'A' && kind === 'zero') for (let i = 0; i < 5; i++) MX.b[i] = '0';
    renderGrid(nm);
  }));
  $('#mswap').addEventListener('click', () => {
    const t = MX.A; MX.A = { r: MX.B.r, c: MX.B.c, v: MX.B.v }; MX.B = { r: t.r, c: t.c, v: t.v };
    ['A', 'B'].forEach(nm => { document.getElementById('r' + nm).value = MX[nm].r; document.getElementById('c' + nm).value = MX[nm].c; renderGrid(nm); });
  });

  /* ----- operations ----- */
  const res = $('#mres');
  function sizeText(M) { return `${M.length}×${M[0].length}`; }
  function useButtons(M, F) {
    MX.last = { M, F };
    return `<div class="row" style="margin-top:10px"><span class="small muted">Use the result as</span><button class="btn sm" type="button" data-use="A">Matrix A</button><button class="btn sm" type="button" data-use="B">Matrix B</button></div>`;
  }
  function show(title, body, M, F) {
    res.innerHTML = `<h3>${esc(title)}</h3>${body}${M ? useButtons(M, F) : ''}`;
    $$('[data-use]', res).forEach(b => b.addEventListener('click', () => {
      const nm = b.dataset.use, { M: LM, F: LF } = MX.last;
      MX[nm].r = LM.length; MX[nm].c = LM[0].length;
      for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) MX[nm].v[i][j] = i < LM.length && j < LM[0].length ? (LF.exact ? LF.str(LM[i][j]).replace('≈', '') : fmtNum(LM[i][j], 12)) : '0';
      document.getElementById('r' + nm).value = MX[nm].r; document.getElementById('c' + nm).value = MX[nm].c;
      renderGrid(nm);
    }));
  }
  function showErr(msg, title) { res.innerHTML = `<h3>${esc(title || 'Cannot compute')}</h3><div class="err">${esc(msg)}</div>`; }
  const needSquare = (nm, M, what) => { if (M.length !== M[0].length) throw new Error(`${what} requires a square matrix, but ${nm} is ${sizeText(M)}.`); };
  const num = (F, x) => F.str(x, 12);

  function run(op) {
    try {
      const target = $('#mtarget').value;
      const needB = ['add', 'sub', 'mulAB', 'mulBA', 'divAB', 'divBA'].includes(op);
      const nmS = op === 'solve' ? 'A' : target;
      const An = readMat('A'), Bn = readMat('B');
      const Sn = nmS === 'A' ? An : Bn;
      const lists = needB ? [An, Bn] : [Sn];
      let bv = null;
      if (op === 'solve' || (nmS === 'A' && $('#maug').checked && ['ref', 'rref', 'gauss', 'gj'].includes(op))) { bv = readB(); lists.push(bv.map(x => [x])); }
      const F = pickField(lists);
      const A = toField(An, F), B = toField(Bn, F), S = nmS === 'A' ? A : B;
      const nm = nmS;
      const mode = F.exact ? 'Exact fractions' : 'Floating point (decimal results)';
      const note = `<div class="small muted" style="margin-bottom:6px">Arithmetic: ${mode}.</div>`;
      switch (op) {
        case 'add': case 'sub': {
          if (An.length !== Bn.length || An[0].length !== Bn[0].length) throw new Error(`${op === 'add' ? 'Addition' : 'Subtraction'} requires matrices of the same size, but A is ${sizeText(An)} and B is ${sizeText(Bn)}.`);
          const R = mAddF(A, B, F, op === 'add' ? 1 : -1);
          return show(op === 'add' ? 'A + B' : 'A − B', note + `<div class="mblocks">${mblock('A', mxHTML(fieldStrs(A, F)))}<div style="align-self:center;font-size:22px">${op === 'add' ? '+' : '−'}</div>${mblock('B', mxHTML(fieldStrs(B, F)))}<div style="align-self:center;font-size:22px">=</div>${mblock('Result', mxHTML(fieldStrs(R, F)))}</div>`, R, F);
        }
        case 'mulAB': case 'mulBA': {
          const [X, Y, xn, yn, Xn, Yn] = op === 'mulAB' ? [A, B, 'A', 'B', An, Bn] : [B, A, 'B', 'A', Bn, An];
          if (Xn[0].length !== Yn.length) throw new Error(`${xn} × ${yn} is undefined: the number of columns of ${xn} (${Xn[0].length}) must equal the number of rows of ${yn} (${Yn.length}). Here ${xn} is ${sizeText(Xn)} and ${yn} is ${sizeText(Yn)}.`);
          const R = mMulF(X, Y, F);
          return show(`${xn} × ${yn}`, note + `<div class="mblocks">${mblock(xn, mxHTML(fieldStrs(X, F)))}<div style="align-self:center;font-size:22px">×</div>${mblock(yn, mxHTML(fieldStrs(Y, F)))}<div style="align-self:center;font-size:22px">=</div>${mblock('Result ' + sizeText(R), mxHTML(fieldStrs(R, F)))}</div>`, R, F);
        }
        case 'divAB': case 'divBA': {
          const [X, Y, xn, yn, Xn, Yn] = op === 'divAB' ? [A, B, 'A', 'B', An, Bn] : [B, A, 'B', 'A', Bn, An];
          needSquare(yn, Yn, `Dividing by ${yn} (multiplying by its inverse)`);
          if (Xn[0].length !== Yn.length) throw new Error(`${xn} ÷ ${yn} = ${xn}·${yn}⁻¹ is undefined: ${xn} has ${Xn[0].length} columns but ${yn}⁻¹ has ${Yn.length} rows.`);
          const inv = inverseOf(Y, F, false);
          if (inv.singular) throw new Error(`${yn} is singular (its determinant is 0, rank ${inv.rank} < ${Yn.length}), so ${yn}⁻¹ does not exist and the division ${xn} ÷ ${yn} is undefined.`);
          const R = mMulF(X, inv.inv, F);
          return show(`${xn} ÷ ${yn}  =  ${xn} · ${yn}⁻¹`, note + `<div class="mblocks">${mblock(xn, mxHTML(fieldStrs(X, F)))}<div style="align-self:center;font-size:22px">×</div>${mblock(yn + '⁻¹', mxHTML(fieldStrs(inv.inv, F)))}<div style="align-self:center;font-size:22px">=</div>${mblock('Result', mxHTML(fieldStrs(R, F)))}</div>`, R, F);
        }
        case 'det': {
          needSquare(nm, Sn, 'The determinant');
          const d = detOf(S, F), n = S.length;
          let body = note + `<div class="mblocks">${mblock(nm, mxHTML(fieldStrs(S, F)))}</div>` + `<div class="tline">det(${nm}) = <b class="ok">${esc(num(F, d))}</b></div>`;
          if (F.exact && d.d !== 1n) body += `<div class="tline muted">≈ ${esc(fmtNum(F.toNum(d), 12))}</div>`;
          if (n === 1) body += `<div class="tline muted">1×1: det = the single entry.</div>`;
          if (n === 2) body += `<div class="tline muted">det = ad − bc = (${esc(F.str(S[0][0]))})(${esc(F.str(S[1][1]))}) − (${esc(F.str(S[0][1]))})(${esc(F.str(S[1][0]))})</div>`;
          if (n >= 3) body += `<div class="tline muted">Computed by row reduction: the product of the pivots, with a sign change for each row swap.</div>`;
          body += F.sgn(d) === 0 ? `<div class="tline err">The determinant is 0, so ${esc(nm)} is singular (not invertible).</div>` : `<div class="tline muted">The determinant is non-zero, so ${esc(nm)} is invertible.</div>`;
          return show(`Determinant of ${nm}`, body);
        }
        case 'inv': {
          needSquare(nm, Sn, 'The inverse');
          const r = inverseOf(S, F, true);
          if (r.singular) throw new Error(`${nm} is singular: its determinant is 0 (rank ${r.rank} < ${Sn.length}), so the inverse does not exist.`);
          const chk = mMulF(S, r.inv, F);
          const isI = chk.every((row, i) => row.every((x, j) => F.eq(x, i === j ? F.one : F.zero)));
          return show(`Inverse of ${nm}`, note + `<div class="mblocks">${mblock(nm, mxHTML(fieldStrs(S, F)))}${mblock(nm + '⁻¹', mxHTML(fieldStrs(r.inv, F)))}</div>` + `<div class="tline muted">Check: ${nm} × ${nm}⁻¹ ${isI ? '= I ✓' : '≈ I (rounding)'} — found by Gauss–Jordan on [${nm} | I].</div>` + stepsHTML(r.steps, F, Sn.length, false), r.inv, F);
        }
        case 'T': { const R = mT(S); return show(`Transpose of ${nm}`, `<div class="mblocks">${mblock(nm, mxHTML(fieldStrs(S, F)))}${mblock(nm + 'ᵀ', mxHTML(fieldStrs(R, F)))}</div>`, R, F); }
        case 'trace': {
          needSquare(nm, Sn, 'The trace');
          let t = F.zero; for (let i = 0; i < S.length; i++) t = F.add(t, S[i][i]);
          return show(`Trace of ${nm}`, `<div class="mblocks">${mblock(nm, mxHTML(fieldStrs(S, F)))}</div><div class="tline">tr(${nm}) = ${S.map((_, i) => esc(F.str(S[i][i]))).join(' + ')} = <b class="ok">${esc(num(F, t))}</b></div>`);
        }
        case 'rank': {
          const e = eliminate(S, F, {});
          return show(`Rank of ${nm}`, note + `<div class="mblocks">${mblock(nm, mxHTML(fieldStrs(S, F)))}${mblock('Echelon form', mxHTML(fieldStrs(e.M, F)))}</div><div class="tline">rank(${nm}) = <b class="ok">${e.rank}</b> &nbsp;<span class="muted">(${e.rank} pivot${e.rank === 1 ? '' : 's'}; ${Sn[0].length - e.rank} free column${Sn[0].length - e.rank === 1 ? '' : 's'})</span></div>`);
        }
        case 'ref': case 'rref': case 'gauss': case 'gj': {
          let M = S, augN = 0, nc = null, label = nm;
          if (bv) { M = S.map((r, i) => r.concat([F.from(bv[i])])); augN = 1; nc = S[0].length; label = `[${nm} | b]`; }
          const jordan = op === 'rref' || op === 'gj';
          const e = eliminate(M, F, { jordan, nc: nc || undefined, record: true });
          const titles = { ref: 'Row echelon form (REF)', rref: 'Reduced row echelon form (RREF)', gauss: 'Gaussian elimination', gj: 'Gauss–Jordan elimination' };
          let body = note + `<div class="mblocks">${mblock(label, mxHTML(fieldStrs(M, F), { aug: augN }))}<div style="align-self:center;font-size:20px">→</div>${mblock(jordan ? 'RREF' : 'REF', mxHTML(fieldStrs(e.M, F), { aug: augN }))}</div>`;
          body += `<div class="tline muted">Rank ${e.rank}; pivot columns: ${e.piv.map(p => p[1] + 1).join(', ') || 'none'}.${jordan ? ' Leading entries are 1 with zeros above and below.' : ' Pivots are not scaled to 1 (use RREF or Gauss–Jordan for that).'}</div>`;
          if (augN && (op === 'gauss' || op === 'gj')) {
            const nv = S[0].length;
            const R2 = jordan ? e.M : eliminate(M, F, { jordan: true, nc }).M;
            const sol = systemSolution(R2, nv, F);
            if (!jordan && sol.type === 'unique' && Sn.length === nv && e.rank === nv) {
              const U = e.M, xs = Array(nv).fill(F.zero), bl = [];
              for (let i = nv - 1; i >= 0; i--) {
                let acc = U[i][nv], terms = '';
                for (let j = i + 1; j < nv; j++) { acc = F.sub(acc, F.mul(U[i][j], xs[j])); terms += ` − (${F.str(U[i][j])})(${F.str(xs[j])})`; }
                xs[i] = F.div(acc, U[i][i]);
                bl.unshift(`x${subs(i + 1)} = (${F.str(U[i][nv])}${terms}) / ${F.str(U[i][i])} = ${F.str(xs[i])}`);
              }
              body += `<h4>Back substitution</h4>${bl.map(l => `<div class="tline">${esc(l)}</div>`).join('')}`;
            }
            body += `<h4>${sol.type === 'none' ? 'No solution' : sol.type === 'unique' ? 'Unique solution' : 'Infinitely many solutions'}</h4>${sol.lines.map(l => `<div class="tline ${sol.type === 'none' ? 'err' : ''}">${esc(l)}</div>`).join('')}`;
          }
          body += stepsHTML(e.steps, F, augN, op === 'gauss' || op === 'gj');
          return show(`${titles[op]} of ${label}`, body, augN ? null : e.M, F);
        }
        case 'solve': {
          const n = A[0].length, M = A.map((r, i) => r.concat([F.from(bv[i])]));
          const e = eliminate(M, F, { jordan: true, nc: n, record: true });
          const sol = systemSolution(e.M, n, F);
          let body = note + `<div class="mblocks">${mblock('[A | b]', mxHTML(fieldStrs(M, F), { aug: 1 }))}<div style="align-self:center;font-size:20px">→</div>${mblock('RREF', mxHTML(fieldStrs(e.M, F), { aug: 1 }))}</div>`;
          body += `<div class="tline muted">${A.length} equation${A.length === 1 ? '' : 's'}, ${n} unknown${n === 1 ? '' : 's'}; rank(A) = ${e.rank}.</div>`;
          body += `<h4>${sol.type === 'none' ? 'No solution (inconsistent system)' : sol.type === 'unique' ? 'Unique solution' : 'Infinitely many solutions'}</h4>${sol.lines.map(l => `<div class="tline ${sol.type === 'none' ? 'err' : ''}">${esc(l)}</div>`).join('')}`;
          if (sol.type === 'unique') {
            const xv = sol.x.map(v => [v]);
            body += `<div class="mblocks">${mblock('x', mxHTML(fieldStrs(xv, F)))}</div>`;
            if (A.length === n) { const chk = mMulF(A, xv, F), ok = chk.every((r, i) => F.eq(r[0], F.from(bv[i]))); body += `<div class="tline muted">Check: A·x ${ok ? '= b ✓' : '≈ b (rounding)'}</div>`; }
          }
          body += stepsHTML(e.steps, F, 1, false);
          return show('Solve Ax = b', body, sol.type === 'unique' ? sol.x.map(v => [v]) : null, F);
        }
        case 'lu': {
          needSquare(nm, Sn, 'LU decomposition');
          const { L, U, P, swaps } = luDecomp(S, F);
          const PA = mMulF(P, S, F), LU = mMulF(L, U, F);
          const ok = LU.every((r, i) => r.every((x, j) => F.eq(x, PA[i][j])));
          const eqTxt = swaps ? `P·${nm} = L·U` : `${nm} = L·U`;
          let body = note + `<div class="tline"><b>${eqTxt}</b></div><div class="mblocks">`;
          if (swaps) body += mblock('P (row swaps)', mxHTML(fieldStrs(P, F)));
          body += mblock('L (unit lower triangular)', mxHTML(fieldStrs(L, F))) + mblock('U (upper triangular)', mxHTML(fieldStrs(U, F))) + `</div>`;
          body += `<div class="tline muted">Check: ${swaps ? 'P·' : ''}${nm} = L·U ${ok ? '✓' : '(within rounding)'} — Doolittle elimination${swaps ? `, with ${swaps} row swap${swaps > 1 ? 's' : ''} because a pivot was zero` : ', no row swaps needed'}.</div>`;
          return show(`LU decomposition of ${nm}`, body);
        }
        case 'qr': {
          const Mn = fromField(S, F), { Q, R } = qrDecomp(Mn);
          const fmt = M => M.map(r => r.map(x => FF.str(x, 8)));
          const m = Mn.length, n = Mn[0].length;
          let err = 0; const QRm = Q.map((qr, i) => R[0].map((_, j) => qr.reduce((s, qv, k) => s + qv * R[k][j], 0)));
          for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) err = Math.max(err, Math.abs(QRm[i][j] - Mn[i][j]));
          const body = `<div class="small muted" style="margin-bottom:6px">Householder reflections; Q is orthogonal (QᵀQ = I) and R is upper triangular with a non-negative diagonal. Values are decimals.</div>
            <div class="tline"><b>${nm} = Q·R</b></div><div class="mblocks">${mblock(`Q (${m}×${m})`, mxHTML(fmt(Q)))}${mblock(`R (${m}×${n})`, mxHTML(fmt(R)))}</div>
            <div class="tline muted">Check: largest entry of |Q·R − ${nm}| = ${esc(err.toExponential(1))}</div>`;
          return show(`QR decomposition of ${nm}`, body);
        }
        case 'eigval': case 'eigvec': {
          needSquare(nm, Sn, 'Eigenvalues and eigenvectors');
          const ea = eigenAnalysis(S, F);
          const tr = S.reduce((s, r, i) => F.add(s, r[i]), F.zero), det = detOf(S, F);
          const sumL = ea.groups.reduce((s, g) => s + g.mult * g.z.re, 0);
          const lamText = g => g.q ? F.exact && QF.str(g.q) + (g.q.d !== 1n ? `  (= ${fmtNum(g.z.re, 8)})` : '') : fmtC(g.z, 10);
          let body = note + `<div class="mblocks">${mblock(nm, mxHTML(fieldStrs(S, F)))}</div>`;
          body += `<div class="tline muted">Characteristic polynomial: ${esc(polyText(ea.cp.map(F.toNum), 'λ'))} = 0</div>`;
          if (op === 'eigval') {
            body += ea.groups.map((g, i) => `<div class="tline">λ${subs(i + 1)} = <b class="ok">${esc(lamText(g))}</b> <span class="muted">(algebraic multiplicity ${g.mult})</span>${g.exactText ? `<div class="muted">exact: ${esc(g.exactText)}</div>` : ''}</div>`).join('');
          } else {
            body += ea.groups.map((g, i) => {
              const vecs = eigenVectors(S, F, g);
              const vh = vecs.length ? vecs.map((v, k) => mblock(`v${vecs.length > 1 ? subs(k + 1) : ''}`, mxHTML(v.map(c => [c.str])))).join('') : '<div class="err">No eigenvector found numerically.</div>';
              const defect = vecs.length < g.mult ? `<div class="tline err">Geometric multiplicity ${vecs.length} < algebraic multiplicity ${g.mult}: the matrix is defective for this eigenvalue.</div>` : '';
              return `<div class="tline" style="margin-top:10px">λ${subs(i + 1)} = <b class="ok">${esc(lamText(g))}</b> <span class="muted">(multiplicity ${g.mult}, ${vecs.length} independent eigenvector${vecs.length === 1 ? '' : 's'})</span></div><div class="mblocks">${vh}</div>${defect}`;
            }).join('');
            body += `<div class="tline muted">${F.exact ? 'Rational eigenvectors are shown with integer entries; ' : ''}complex or irrational eigenvectors are normalised to unit length.</div>`;
          }
          body += `<div class="tline muted">Check: Σλ = ${esc(fmtNum(sumL, 10))} vs trace ${esc(F.str(tr))}; det ${esc(F.str(det))}.</div>`;
          return show(op === 'eigval' ? `Eigenvalues of ${nm}` : `Eigenvectors of ${nm}`, body);
        }
      }
    } catch (e) { showErr(e.message || String(e)); }
  }
  function polyText(c, v) {
    const parts = [];
    for (let k = c.length - 1; k >= 0; k--) {
      const x = c[k];
      if (Math.abs(x) < 1e-12) continue;
      const ax = Math.abs(x), body = k === 0 ? fmtNum(ax, 8) : (Math.abs(ax - 1) < 1e-12 ? '' : fmtNum(ax, 8)) + v + (k > 1 ? '^' + k : '');
      parts.push((parts.length ? (x < 0 ? ' − ' : ' + ') : (x < 0 ? '−' : '')) + body);
    }
    return parts.join('') || '0';
  }
  $$('[data-op]').forEach(b => b.addEventListener('click', () => run(b.dataset.op)));

  /* ----- Jacobian ----- */
  $('#jgo').addEventListener('click', () => {
    const out = $('#jout');
    try {
      const lines = $('#jfns').value.split('\n').map(s => s.trim()).filter(Boolean);
      if (!lines.length) throw new Error('Enter at least one function, one per line');
      const vt = $('#jvars').value.trim();
      const vars = vt ? vt.split(/[,\s;]+/).filter(Boolean).map(s => s.toLowerCase()) : null;
      if (vars && vars.some(v => !/^[a-z]+$/.test(v))) throw new Error('Variables must be letters, e.g. x, y');
      const { asts, vars: vs, J } = jacobianOf(lines, vars);
      let html = `<div class="small muted">f${subs(1)}…f${subs(lines.length)} with respect to (${esc(vs.join(', '))}): a ${lines.length}×${vs.length} matrix.</div>`;
      html += `<div class="mblocks">${mblock('J (symbolic)', mxHTML(J.map(r => r.map(d => fx(d)))))}</div>`;
      const pt = $('#jpt').value;
      if (pt.trim()) {
        const vals = parsePoint(pt);
        const Jn = J.map(r => r.map(d => cleanC(evalAt(d, vals))));
        if (Jn.some(r => r.some(z => !isReal(z)))) throw new Error('The Jacobian is not real at this point');
        const nums = Jn.map(r => r.map(z => z.re));
        const F = pickField([nums]);
        const Fm = toField(nums, F);
        html += `<div class="mblocks">${mblock('J at ' + Object.entries(vals).map(([k, v]) => `${k}=${fmtNum(v, 6)}`).join(', '), mxHTML(fieldStrs(Fm, F)))}</div>`;
        if (nums.length === nums[0].length) { const d = detOf(Fm, F); html += `<div class="tline">det J = <b class="ok">${esc(F.str(d, 10))}</b></div>`; }
      } else if (J.length === J[0].length) html += `<div class="tline muted">Square Jacobian: enter a point to also get its numeric value and determinant.</div>`;
      out.innerHTML = html;
    } catch (e) { out.innerHTML = `<div class="err">${esc(e.message)}</div>`; }
  });
}
