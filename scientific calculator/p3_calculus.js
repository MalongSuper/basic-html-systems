
/* =====================================================================
   9. Symbolic calculus (derivatives, integrals, gradients)
   ===================================================================== */
const N = v => ({ k: 'num', v });
const Vr = n => ({ k: 'var', n });
const isNum = (n, v) => n.k === 'num' && (v === undefined || n.v === v);
function ck(n) {
  switch (n.k) {
    case 'num': return 'n' + n.v;
    case 'const': return 'c' + n.n;
    case 'var': return 'v' + n.n;
    case 'neg': return '-(' + ck(n.a) + ')';
    case 'bin': return '(' + ck(n.a) + n.op + ck(n.b) + ')';
    case 'fn': return n.n + '[' + n.args.map(ck).join(',') + ']';
  }
  return '?';
}
const same = (a, b) => ck(a) === ck(b);
const hasConst = n => n.k === 'const' || (n.k === 'neg' && hasConst(n.a)) || (n.k === 'bin' && (hasConst(n.a) || hasConst(n.b))) || (n.k === 'fn' && n.args.some(hasConst));

function basExp(n) {
  if (n.k === 'bin' && n.op === '^' && n.b.k === 'num') return [n.a, n.b];
  if (n.k === 'var' || n.k === 'fn') return [n, N(1)];
  return null;
}
const nneg = a => a.k === 'num' ? N(-a.v) : a.k === 'neg' ? a.a : { k: 'neg', a };
function nadd(a, b) {
  if (isNum(a, 0)) return b;
  if (isNum(b, 0)) return a;
  if (a.k === 'num' && b.k === 'num') return N(a.v + b.v);
  if (b.k === 'neg') return nsub(a, b.a);
  if (b.k === 'num' && b.v < 0) return nsub(a, N(-b.v));
  if (same(a, b)) return nmul(N(2), a);
  return { k: 'bin', op: '+', a, b };
}
function nsub(a, b) {
  if (isNum(b, 0)) return a;
  if (isNum(a, 0)) return nneg(b);
  if (a.k === 'num' && b.k === 'num') return N(a.v - b.v);
  if (b.k === 'neg') return nadd(a, b.a);
  if (same(a, b)) return N(0);
  return { k: 'bin', op: '-', a, b };
}
function nmul(a, b) {
  if (isNum(a, 0) || isNum(b, 0)) return N(0);
  if (isNum(a, 1)) return b;
  if (isNum(b, 1)) return a;
  if (isNum(a, -1)) return nneg(b);
  if (isNum(b, -1)) return nneg(a);
  if (a.k === 'num' && b.k === 'num') return N(a.v * b.v);
  if (a.k === 'neg') return nneg(nmul(a.a, b));
  if (b.k === 'neg') return nneg(nmul(a, b.a));
  if (b.k === 'num') return nmul(b, a);
  if (a.k === 'num' && b.k === 'bin' && b.op === '*' && b.a.k === 'num') return nmul(N(a.v * b.a.v), b.b);
  if (a.k === 'num' && b.k === 'bin' && b.op === '/' && b.a.k === 'num') return ndiv(N(a.v * b.a.v), b.b);
  if (a.k === 'bin' && a.op === '/' && a.a.k === 'num' && a.b.k === 'num' && b.k !== 'num') return ndiv(nmul(a.a, b), a.b);
  const pa = basExp(a), pb = basExp(b);
  if (pa && pb && same(pa[0], pb[0])) return npow(pa[0], nadd(pa[1], pb[1]));
  return { k: 'bin', op: '*', a, b };
}
function ndiv(a, b) {
  if (isNum(b, 0)) throw new Error('Division by zero');
  if (isNum(a, 0)) return N(0);
  if (isNum(b, 1)) return a;
  if (a.k === 'num' && b.k === 'num') {
    if (Number.isInteger(a.v) && Number.isInteger(b.v)) {
      const g = gcdNum(a.v, b.v) || 1;
      let p = a.v / g, q = b.v / g;
      if (q < 0) { p = -p; q = -q; }
      return q === 1 ? N(p) : { k: 'bin', op: '/', a: N(p), b: N(q) };
    }
    return N(a.v / b.v);
  }
  if (b.k === 'neg') return nneg(ndiv(a, b.a));
  if (a.k === 'neg') return nneg(ndiv(a.a, b));
  if (same(a, b)) return N(1);
  const pa = basExp(a), pb = basExp(b);
  if (pa && pb && same(pa[0], pb[0])) return npow(pa[0], nsub(pa[1], pb[1]));
  if (a.k === 'bin' && a.op === '*' && a.a.k === 'num' && b.k === 'num') {
    const r = ndiv(a.a, b);
    if (r.k === 'num') return nmul(r, a.b);
  }
  return { k: 'bin', op: '/', a, b };
}
function npow(a, b) {
  if (isNum(b, 0)) return N(1);
  if (isNum(b, 1)) return a;
  if (isNum(a, 1)) return N(1);
  if (a.k === 'num' && b.k === 'num') {
    if (Number.isInteger(b.v) && b.v < 0) return ndiv(N(1), npow(a, N(-b.v)));
    const r = Math.pow(a.v, b.v);
    if (Number.isFinite(r) && Number.isInteger(r)) return N(r);
  }
  if (a.k === 'bin' && a.op === '^' && a.b.k === 'num' && b.k === 'num' && Number.isInteger(b.v)) return npow(a.a, N(a.b.v * b.v));
  return { k: 'bin', op: '^', a, b };
}
function nfn(n, ...args) {
  const a = args[0];
  if (n === 'ln' && a.k === 'const' && a.n === 'e') return N(1);
  if (n === 'ln' && isNum(a, 1)) return N(0);
  if (n === 'exp' && isNum(a, 0)) return N(1);
  if ((n === 'sin' || n === 'tan' || n === 'asin' || n === 'atan' || n === 'sinh' || n === 'tanh') && isNum(a, 0)) return N(0);
  if ((n === 'cos' || n === 'cosh') && isNum(a, 0)) return N(1);
  return { k: 'fn', n, args };
}
function numNode(c) {
  if (Number.isInteger(c)) return N(c);
  const f = toFrac(c, 10000, 1e-10);
  if (f && f[1] !== 1) return ndiv(N(f[0]), N(f[1]));
  return N(c);
}
function substVar(n, from, to) {
  switch (n.k) {
    case 'var': return n.n === from ? to : n;
    case 'neg': return nneg(substVar(n.a, from, to));
    case 'bin': {
      const a = substVar(n.a, from, to), b = substVar(n.b, from, to);
      return n.op === '+' ? nadd(a, b) : n.op === '-' ? nsub(a, b) : n.op === '*' ? nmul(a, b) : n.op === '/' ? ndiv(a, b) : npow(a, b);
    }
    case 'fn': return nfn(n.n, ...n.args.map(a => substVar(a, from, to)));
  }
  return n;
}

/* ---------- printing ---------- */
function fx(n, prec) {
  prec = prec || 0;
  switch (n.k) {
    case 'num': { const s = fmtNum(n.v, 10); return (n.v < 0 && prec >= 4) ? '(' + s + ')' : s; }
    case 'const': return n.n === 'pi' ? 'π' : n.n;
    case 'var': return n.n === '#' ? 'u' : n.n;
    case 'neg': { const s = '-' + fx(n.a, 2); return prec >= 2 ? '(' + s + ')' : s; }
    case 'fn': return n.n + '(' + n.args.map(a => fx(a, 0)).join(', ') + ')';
    case 'bin': {
      const { op, a, b } = n;
      let s, P;
      if (op === '+') { P = 1; const r = fx(b, 1); s = fx(a, 1) + (r[0] === '-' ? ' - ' + r.slice(1) : ' + ' + r); }
      else if (op === '-') { P = 1; s = fx(a, 1) + ' - ' + fx(b, 2); }
      else if (op === '*') {
        P = 2;
        const bs = fx(b, 3);
        if (a.k === 'num' && /^[A-Za-zπ(]/.test(bs)) s = fx(a, 3) + bs;
        else s = fx(a, 2) + ' · ' + bs;
      }
      else if (op === '/') { P = 2; s = fx(a, 2) + ' / ' + fx(b, 3); }
      else { P = 4; s = fx(a, 5) + '^' + fx(b, 4); }
      return P < prec ? '(' + s + ')' : s;
    }
  }
  return '?';
}

/* ---------- differentiation ---------- */
function dd(n, v) {
  switch (n.k) {
    case 'num': case 'const': return N(0);
    case 'var': return N(n.n === v ? 1 : 0);
    case 'neg': return nneg(dd(n.a, v));
    case 'bin': {
      const { a, b, op } = n;
      if (op === '+') return nadd(dd(a, v), dd(b, v));
      if (op === '-') return nsub(dd(a, v), dd(b, v));
      if (op === '*') return nadd(nmul(dd(a, v), b), nmul(a, dd(b, v)));
      if (op === '/') {
        const da = dd(a, v), db = dd(b, v);
        if (isNum(db, 0)) return ndiv(da, b);
        return ndiv(nsub(nmul(da, b), nmul(a, db)), npow(b, N(2)));
      }
      const hasA = containsVar(a, v), hasB = containsVar(b, v);
      if (!hasB) return nmul(nmul(b, npow(a, nsub(b, N(1)))), dd(a, v));
      if (!hasA) return nmul(nmul(npow(a, b), nfn('ln', a)), dd(b, v));
      return nmul(npow(a, b), nadd(nmul(dd(b, v), nfn('ln', a)), ndiv(nmul(b, dd(a, v)), a)));
    }
    case 'fn': {
      const u = n.args[0];
      if (n.n === 'log' && n.args.length === 2 && containsVar(n.args[1], v)) return dd(ndiv(nfn('ln', u), nfn('ln', n.args[1])), v);
      const du = dd(u, v);
      if (isNum(du, 0)) return N(0);
      let outer;
      switch (n.n) {
        case 'sin': outer = nfn('cos', u); break;
        case 'cos': outer = nneg(nfn('sin', u)); break;
        case 'tan': outer = ndiv(N(1), npow(nfn('cos', u), N(2))); break;
        case 'sec': outer = nmul(nfn('sec', u), nfn('tan', u)); break;
        case 'csc': outer = nneg(nmul(nfn('csc', u), nfn('cot', u))); break;
        case 'cot': outer = nneg(ndiv(N(1), npow(nfn('sin', u), N(2)))); break;
        case 'asin': outer = ndiv(N(1), nfn('sqrt', nsub(N(1), npow(u, N(2))))); break;
        case 'acos': outer = nneg(ndiv(N(1), nfn('sqrt', nsub(N(1), npow(u, N(2)))))); break;
        case 'atan': outer = ndiv(N(1), nadd(N(1), npow(u, N(2)))); break;
        case 'sinh': outer = nfn('cosh', u); break;
        case 'cosh': outer = nfn('sinh', u); break;
        case 'tanh': outer = ndiv(N(1), npow(nfn('cosh', u), N(2))); break;
        case 'asinh': outer = ndiv(N(1), nfn('sqrt', nadd(npow(u, N(2)), N(1)))); break;
        case 'acosh': outer = ndiv(N(1), nfn('sqrt', nsub(npow(u, N(2)), N(1)))); break;
        case 'atanh': outer = ndiv(N(1), nsub(N(1), npow(u, N(2)))); break;
        case 'sqrt': outer = ndiv(N(1), nmul(N(2), nfn('sqrt', u))); break;
        case 'cbrt': outer = ndiv(N(1), nmul(N(3), npow(nfn('cbrt', u), N(2)))); break;
        case 'exp': outer = n; break;
        case 'ln': outer = ndiv(N(1), u); break;
        case 'log': outer = n.args.length === 1 ? ndiv(N(1), nmul(u, nfn('ln', N(10)))) : ndiv(N(1), nmul(u, nfn('ln', n.args[1]))); break;
        case 'abs': outer = ndiv(u, nfn('abs', u)); break;
        default: throw new Error(`Differentiation of ${n.n}() is not supported`);
      }
      return nmul(du, outer);
    }
  }
  throw new Error('Cannot differentiate this expression');
}
function deriveN(ast, v, order) {
  let d = ast;
  for (let i = 0; i < order; i++) d = dd(d, v);
  return d;
}

/* ---------- integration ---------- */
function polyNode(p, v) {
  let res = N(0);
  for (let k = p.length - 1; k >= 0; k--) {
    if (!p[k]) continue;
    res = nadd(res, nmul(numNode(p[k]), npow(Vr(v), N(k))));
  }
  return res;
}
function integPoly(p, v) {
  let res = N(0);
  const X = Vr(v);
  for (let k = p.length - 1; k >= 0; k--) {
    const c = p[k];
    if (!c) continue;
    const q = c / (k + 1);
    const f = toFrac(q, 1000000, 1e-12);
    const pw = npow(X, N(k + 1));
    const term = f ? ndiv(nmul(N(f[0]), pw), N(f[1])) : nmul(N(q), pw);
    res = nadd(res, term);
  }
  return res;
}
function affine(u, v) {
  if (!containsVar(u, v)) return null;
  const a = dd(u, v);
  if (containsVar(a, v) || isNum(a, 0)) return null;
  return a;
}
function numPoly(n, v) {
  if (hasConst(n)) return null;
  try { return polyFromAst(n, v); } catch (e) { return null; }
}
function intRecip(b, v) {                // integral of 1/b
  const a = affine(b, v);
  if (a) return ndiv(nfn('ln', nfn('abs', b)), a);
  const p = numPoly(b, v);
  if (p && p.length === 3) {
    const [c, bb, aa] = p, D = bb * bb - 4 * aa * c;
    const lin = N(0);
    if (Math.abs(D) < 1e-12) {
      return ndiv(N(-2), polyNode([bb, 2 * aa], v));
    }
    const X = Vr(v);
    const t = polyNode([bb, 2 * aa], v);               // 2a x + b
    if (D < 0) {
      const s = Math.sqrt(-D);
      return nmul(numNode(2 / s), nfn('atan', ndiv(t, N(s))));
    }
    const s = Math.sqrt(D);
    return nmul(numNode(1 / s), nfn('ln', nfn('abs', ndiv(nsub(t, N(s)), nadd(t, N(s))))));
  }
  return null;
}
function ratioConst(rest, dg, v) {
  const vs = new Set(); varsOf(rest, vs); varsOf(dg, vs);
  for (const x of vs) if (x !== v) return null;
  const f = ast0 => ast0;
  let r0 = null, good = 0;
  for (const x of [0.37, 1.13, 2.41, 0.83, 1.71]) {
    try {
      const A = evalC(rest, { deg: false, vars: { [v]: x } });
      const B = evalC(dg, { deg: false, vars: { [v]: x } });
      if (!isReal(A) || !isReal(B) || !Number.isFinite(A.re) || !Number.isFinite(B.re) || Math.abs(B.re) < 1e-12) continue;
      const r = A.re / B.re;
      if (r0 === null) r0 = r;
      else if (Math.abs(r - r0) > 1e-9 * (1 + Math.abs(r0))) return null;
      good++;
    } catch (e) { /* skip sample */ }
  }
  return good >= 3 ? r0 : null;
}
function factorsOf(n, out) {
  if (n.k === 'bin' && n.op === '*') { factorsOf(n.a, out); factorsOf(n.b, out); }
  else if (n.k === 'bin' && n.op === '/') {
    factorsOf(n.a, out);
    const f = []; factorsOf(n.b, f);
    f.forEach(x => out.push(recipFactor(x)));
  }
  else if (n.k === 'neg') { out.push(N(-1)); factorsOf(n.a, out); }
  else out.push(n);
}
function recipFactor(x) {
  if (x.k === 'bin' && x.op === '^') return npow(x.a, nneg(x.b));
  if (x.k === 'fn' && x.n === 'sqrt') return npow(x.args[0], N(-0.5));
  return npow(x, N(-1));
}
function trySubst(n, v, depth) {
  const fs = []; factorsOf(n, fs);
  if (fs.length < 2) return null;
  for (let i = 0; i < fs.length; i++) {
    const A = fs[i];
    if (!containsVar(A, v)) continue;
    const cands = [];
    if (A.k === 'fn' && A.args.length === 1) cands.push([A.args[0], w => nfn(A.n, w)]);
    if (A.k === 'bin' && A.op === '^' && !containsVar(A.b, v)) cands.push([A.a, w => npow(w, A.b)]);
    if (A.k === 'bin' && A.op === '^' && !containsVar(A.a, v)) cands.push([A.b, w => npow(A.a, w)]);
    cands.push([A, w => w]);
    for (const [g, build] of cands) {
      if (g.k === 'var' || !containsVar(g, v)) continue;
      const dg = dd(g, v);
      const rest = fs.filter((_, j) => j !== i).reduce((p, f) => nmul(p, f), N(1));
      const c = ratioConst(rest, dg, v);
      if (c === null) continue;
      const inner = integ(build(Vr('#')), '#', depth + 1);
      if (!inner) continue;
      return nmul(numNode(c), substVar(inner, '#', g));
    }
  }
  return null;
}
function tryParts(n, v, depth) {
  const fs = []; factorsOf(n, fs);
  let P = [1], others = [];
  for (const f of fs) {
    const p = containsVar(f, v) ? numPoly(f, v) : null;
    if (p) P = pmul(P, p); else others.push(f);
  }
  if (others.length !== 1 || P.length < 2) { if (!(others.length === 1 && P.length === 1)) return null; }
  const G = others[0];
  const Pn = polyNode(P, v);
  const isExpLike = G.k === 'fn' && ['exp', 'sin', 'cos', 'sinh', 'cosh'].includes(G.n) && G.args.length === 1 && affine(G.args[0], v)
    || (G.k === 'bin' && G.op === '^' && !containsVar(G.a, v) && affine(G.b, v));
  if (isExpLike) {
    const v1 = integ(G, v, depth + 1);
    if (!v1) return null;
    const rest = integ(nmul(dd(Pn, v), v1), v, depth + 1);
    if (!rest) return null;
    return nsub(nmul(Pn, v1), rest);
  }
  if (G.k === 'fn' && G.n === 'ln' && G.args[0].k === 'var' && G.args[0].n === v) {
    const q = [0].concat(P.map((c, k) => c / (k + 1)));
    return nsub(nmul(polyNode(q, v), G), integPoly(q.slice(1), v));
  }
  return null;
}
function ratIntegrate(num, den, v) {
  // num, den numeric polynomial arrays; denominator degree 1 or 2
  const dn = den.length - 1;
  if (dn < 1 || dn > 2) return null;
  // long division
  let rem = num.slice(), q = [];
  const lead = den[dn];
  while (rem.length - 1 >= dn) {
    const k = rem.length - 1 - dn, c = rem[rem.length - 1] / lead;
    q[k] = c;
    for (let i = 0; i <= dn; i++) rem[k + i] -= c * den[i];
    rem.pop();
  }
  for (let i = 0; i < q.length; i++) if (q[i] === undefined) q[i] = 0;
  rem = ptrim(rem.length ? rem : [0]);
  let res = q.length ? integPoly(q, v) : N(0);
  const D = polyNode(den, v);
  if (rem.length === 1) {
    if (rem[0] !== 0) { const r = intRecip(D, v); if (!r) return null; res = nadd(res, nmul(numNode(rem[0]), r)); }
    return res;
  }
  // linear remainder over a quadratic: alpha x + beta
  const alpha = rem[1], beta = rem[0], a2 = den[2], b1 = den[1];
  res = nadd(res, nmul(numNode(alpha / (2 * a2)), nfn('ln', nfn('abs', D))));
  const rest = beta - alpha * b1 / (2 * a2);
  if (Math.abs(rest) > 1e-14) { const r = intRecip(D, v); if (!r) return null; res = nadd(res, nmul(numNode(rest), r)); }
  return res;
}
function integPow(n, v, depth) {
  const { a: u, b: e } = n;
  if (!containsVar(e, v)) {
    const A = affine(u, v);
    if (u.k === 'fn' && u.args.length === 1 && e.k === 'num' && e.v === 2) {
      const w = u.args[0], B = affine(w, v);
      if (B) {
        let F = null;
        if (u.n === 'sin') F = nsub(ndiv(w, N(2)), ndiv(nfn('sin', nmul(N(2), w)), N(4)));
        if (u.n === 'cos') F = nadd(ndiv(w, N(2)), ndiv(nfn('sin', nmul(N(2), w)), N(4)));
        if (u.n === 'tan') F = nsub(nfn('tan', w), w);
        if (u.n === 'sec') F = nfn('tan', w);
        if (u.n === 'csc') F = nneg(nfn('cot', w));
        if (u.n === 'cot') F = nneg(nadd(nfn('cot', w), w));
        if (F) return ndiv(F, B);
      }
    }
    if (A) {
      if (e.k === 'num' && e.v === -1) return ndiv(nfn('ln', nfn('abs', u)), A);
      const e1 = nadd(e, N(1));
      return ndiv(npow(u, e1), nmul(A, e1));
    }
    return null;
  }
  if (!containsVar(u, v)) {
    const A = affine(e, v);
    if (!A) return null;
    return ndiv(ndiv(n, nfn('ln', u)), A);
  }
  return null;
}
function integFn(n, v) {
  if (n.args.length !== 1) return null;
  const u = n.args[0], a = affine(u, v);
  if (!a) return null;
  let F = null;
  switch (n.n) {
    case 'sin': F = nneg(nfn('cos', u)); break;
    case 'cos': F = nfn('sin', u); break;
    case 'tan': F = nneg(nfn('ln', nfn('abs', nfn('cos', u)))); break;
    case 'sec': F = nfn('ln', nfn('abs', nadd(nfn('sec', u), nfn('tan', u)))); break;
    case 'csc': F = nneg(nfn('ln', nfn('abs', nadd(nfn('csc', u), nfn('cot', u))))); break;
    case 'cot': F = nfn('ln', nfn('abs', nfn('sin', u))); break;
    case 'exp': F = n; break;
    case 'sinh': F = nfn('cosh', u); break;
    case 'cosh': F = nfn('sinh', u); break;
    case 'tanh': F = nfn('ln', nfn('cosh', u)); break;
    case 'ln': F = nsub(nmul(u, n), u); break;
    case 'log': F = ndiv(nsub(nmul(u, nfn('ln', u)), u), nfn('ln', N(10))); break;
    case 'sqrt': F = ndiv(nmul(N(2), npow(u, ndiv(N(3), N(2)))), N(3)); break;
    case 'cbrt': F = ndiv(nmul(N(3), npow(u, ndiv(N(4), N(3)))), N(4)); break;
    case 'abs': F = ndiv(nmul(u, n), N(2)); break;
    case 'atan': F = nsub(nmul(u, n), ndiv(nfn('ln', nadd(N(1), npow(u, N(2)))), N(2))); break;
    case 'asin': F = nadd(nmul(u, n), nfn('sqrt', nsub(N(1), npow(u, N(2))))); break;
    case 'acos': F = nsub(nmul(u, n), nfn('sqrt', nsub(N(1), npow(u, N(2))))); break;
    case 'asinh': F = nsub(nmul(u, n), nfn('sqrt', nadd(npow(u, N(2)), N(1)))); break;
    case 'acosh': F = nsub(nmul(u, n), nfn('sqrt', nsub(npow(u, N(2)), N(1)))); break;
    case 'atanh': F = nadd(nmul(u, n), ndiv(nfn('ln', nsub(N(1), npow(u, N(2)))), N(2))); break;
    default: return null;
  }
  return ndiv(F, a);
}
function integ(n, v, depth) {
  depth = depth || 0;
  if (depth > 12) return null;
  const X = Vr(v);
  if (!containsVar(n, v)) return nmul(n, X);
  const poly = numPoly(n, v);
  if (poly) return integPoly(poly, v);
  switch (n.k) {
    case 'neg': { const r = integ(n.a, v, depth + 1); return r && nneg(r); }
    case 'fn': return integFn(n, v);
    case 'bin': {
      const { op, a, b } = n;
      if (op === '+' || op === '-') {
        const l = integ(a, v, depth + 1), r = integ(b, v, depth + 1);
        if (!l || !r) return null;
        return op === '+' ? nadd(l, r) : nsub(l, r);
      }
      if (op === '^') return integPow(n, v, depth);
      if (op === '*' && !containsVar(a, v)) { const r = integ(b, v, depth + 1); return r && nmul(a, r); }
      if (op === '*' && !containsVar(b, v)) { const r = integ(a, v, depth + 1); return r && nmul(b, r); }
      if (op === '/' && !containsVar(b, v)) { const r = integ(a, v, depth + 1); return r && ndiv(r, b); }
      if (op === '/' && !containsVar(a, v)) {
        const r = intRecip(b, v);
        if (r) return nmul(a, r);
        if (b.k === 'fn' && b.n === 'sqrt') {
          const q = numPoly(b.args[0], v);
          if (q && q.length === 3 && q[1] === 0 && q[0] > 0) {
            const [c, , al] = q;
            if (al < 0) return nmul(ndiv(a, N(Math.sqrt(-al))), nfn('asin', nmul(numNode(Math.sqrt(-al / c)), X)));
            if (al > 0) return nmul(ndiv(a, N(Math.sqrt(al))), nfn('asinh', nmul(numNode(Math.sqrt(al / c)), X)));
          }
        }
      }
      if (op === '/') {
        const pn = numPoly(a, v), pd = numPoly(b, v);
        if (pn && pd) { const r = ratIntegrate(pn, pd, v); if (r) return r; }
      }
      const s = trySubst(n, v, depth);
      if (s) return s;
      return tryParts(n, v, depth);
    }
  }
  return null;
}
function antiderivative(ast, v) {
  try { return integ(ast, v, 0); } catch (e) { return null; }
}

/* ---------- numeric definite integration (adaptive Gauss-Kronrod 7-15) ---------- */
const GK_X = [0.991455371120812639, 0.949107912342758525, 0.864864423359769073, 0.741531185599394440, 0.586087235467691130, 0.405845151377397167, 0.207784955007898468, 0];
const GK_WK = [0.022935322010529225, 0.063092092629978553, 0.104790010322250184, 0.140653259715525919, 0.169004726639267903, 0.190350578064785410, 0.204432940075298892, 0.209482141084727828];
const GK_WG = [0.129484966168869693, 0.279705391489276668, 0.381830050505118945, 0.417959183673469388];
function gk15(f, a, b) {
  const c = (a + b) / 2, hh = (b - a) / 2;
  const fc = f(c);
  let rk = fc * GK_WK[7], rg = fc * GK_WG[3];
  for (let j = 0; j < 7; j++) {
    const x = hh * GK_X[j], s = f(c - x) + f(c + x);
    rk += GK_WK[j] * s;
    if (j % 2 === 1) rg += GK_WG[(j - 1) / 2] * s;
  }
  return [rk * hh, Math.abs(rk - rg) * Math.abs(hh)];
}
function adaptiveIntegrate(f, a, b) {
  const safe = x => {
    const y = f(x);
    if (!Number.isFinite(y)) throw new Error('The function is undefined or infinite inside the interval of integration');
    return y;
  };
  let segs = [];
  const N0 = 8;
  for (let i = 0; i < N0; i++) {
    const lo = a + (b - a) * i / N0, hi = a + (b - a) * (i + 1) / N0;
    const [I, E] = gk15(safe, lo, hi);
    segs.push({ lo, hi, I, E });
  }
  for (let it = 0; it < 600; it++) {
    const tot = segs.reduce((s, q) => s + q.I, 0), err = segs.reduce((s, q) => s + q.E, 0);
    if (err <= 1e-11 * Math.max(1, Math.abs(tot))) break;
    let mi = 0;
    for (let i = 1; i < segs.length; i++) if (segs[i].E > segs[mi].E) mi = i;
    const s = segs[mi], mid = (s.lo + s.hi) / 2;
    if (mid === s.lo || mid === s.hi) break;
    const [I1, E1] = gk15(safe, s.lo, mid), [I2, E2] = gk15(safe, mid, s.hi);
    segs.splice(mi, 1, { lo: s.lo, hi: mid, I: I1, E: E1 }, { lo: mid, hi: s.hi, I: I2, E: E2 });
  }
  return { value: segs.reduce((s, q) => s + q.I, 0), err: segs.reduce((s, q) => s + q.E, 0) };
}
function definiteIntegral(ast, v, lo, hi) {
  if (Number.isNaN(lo) || Number.isNaN(hi)) throw new Error('Limits must be numbers');
  if (lo === hi) return { value: 0, err: 0 };
  if (lo > hi) { const r = definiteIntegral(ast, v, hi, lo); return { value: -r.value, err: r.err }; }
  const fx0 = x => {
    try { const z = evalC(ast, { deg: false, vars: { [v]: x } }); return isReal(z) ? z.re : NaN; } catch (e) { return NaN; }
  };
  if (Number.isFinite(lo) && Number.isFinite(hi)) return adaptiveIntegrate(fx0, lo, hi);
  if (Number.isFinite(lo)) return adaptiveIntegrate(t => fx0(lo + t / (1 - t)) / ((1 - t) * (1 - t)), 0, 1);
  if (Number.isFinite(hi)) return adaptiveIntegrate(t => fx0(hi - (1 - t) / t) / (t * t), 0, 1);
  return adaptiveIntegrate(t => fx0(t / (1 - t * t)) * (1 + t * t) / ((1 - t * t) * (1 - t * t)), -1, 1);
}

/* ---------- front-end helpers ---------- */
function stripLhs(text) {
  const s = normalizeInput(text);
  const m = /^\s*([a-zA-Z]\s*(\(\s*[a-zA-Z](\s*,\s*[a-zA-Z])*\s*\))?)\s*=([^=<>]+)$/.exec(s);
  return m ? m[4] : text;
}
function parseFunction(text) {
  const body = stripLhs(text);
  const ast = parse(body);
  return ast;
}
function pickVariable(ast, wanted) {
  const vs = [...varsOf(ast)].sort();
  if (wanted) {
    const w = wanted.trim().toLowerCase();
    if (!/^[a-z]+$/.test(w)) throw new Error('The variable must be a letter such as x');
    return w;
  }
  if (vs.includes('x')) return 'x';
  return vs.length ? vs[0] : 'x';
}
function parsePoint(text) {
  const vars = {};
  if (!text || !text.trim()) return vars;
  for (const part of text.split(/[,;]+/)) {
    if (!part.trim()) continue;
    const m = /^\s*([a-zA-Z]+)\s*=\s*(.+)$/.exec(part);
    if (!m) throw new Error(`Write the point as x=1, y=2 (problem near "${part.trim()}")`);
    vars[m[1].toLowerCase()] = evalNumber(m[2]);
  }
  return vars;
}
function evalAt(ast, vars) {
  const z = evalC(ast, { deg: false, vars });
  return z;
}
function closedFormHint(x) {
  if (!Number.isFinite(x) || x === 0) return null;
  const fp = toFrac(x / Math.PI, 360, 1e-11);
  if (fp && fp[1] !== 1 || (fp && Math.abs(fp[0]) !== 1 && Math.abs(fp[0]) < 50)) {
    const [p, q] = fp;
    return `${p === 1 ? '' : p === -1 ? '-' : p}π${q === 1 ? '' : '/' + q}`;
  }
  if (fp && Math.abs(fp[0]) === 1) return `${fp[0] < 0 ? '-' : ''}π`;
  const f = toFrac(x, 100000, 1e-11);
  if (f && f[1] !== 1) return `${f[0]}/${f[1]}`;
  const fe = toFrac(x / Math.E, 100, 1e-11);
  if (fe && fe[0] !== 0 && Math.abs(fe[0]) < 50) return `${fe[0] === 1 ? '' : fe[0]}e${fe[1] === 1 ? '' : '/' + fe[1]}`;
  const sq = toFrac(x * x, 1000, 1e-10);
  if (sq && sq[1] === 1 && sq[0] > 0 && !Number.isInteger(x)) { const [s, m] = sqrtSplit(sq[0]); return `${x < 0 ? '-' : ''}${s === 1 ? '' : s}√${m}`; }
  return null;
}
function jacobianOf(lines, varNames) {
  const asts = lines.map(parseFunction);
  let vars = varNames;
  if (!vars || !vars.length) {
    const s = new Set(); asts.forEach(a => varsOf(a, s));
    vars = [...s].sort();
  }
  if (!vars.length) throw new Error('No variables found. Use letters such as x and y');
  const J = asts.map(a => vars.map(v => dd(a, v)));
  return { asts, vars, J };
}
