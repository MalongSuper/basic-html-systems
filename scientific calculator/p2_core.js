'use strict';
/* =====================================================================
   1. Utilities
   ===================================================================== */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v === false || v == null) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v;
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const c of kids.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const STATE = { deg: false, ans: null, fracMode: false };

/* =====================================================================
   2. Number formatting
   ===================================================================== */
function fmtNum(x, digits) {
  digits = digits || 12;
  if (Number.isNaN(x)) return 'undefined';
  if (!Number.isFinite(x)) return x > 0 ? '∞' : '-∞';
  if (x === 0) return '0';
  const ax = Math.abs(x);
  if (Number.isInteger(x) && ax < 1e15) return String(x);
  const expo = () => x.toExponential(digits - 1).replace(/\.?0+e/, 'e').replace('e+', 'e');
  if (ax >= 1e15 || ax < 1e-6) return expo();
  const s = parseFloat(x.toPrecision(digits)).toString();
  return s.includes('e') ? expo() : s;
}
function toFrac(x, maxDen, tol) {
  maxDen = maxDen || 100000; tol = tol || 1e-12;
  if (!Number.isFinite(x)) return null;
  if (Number.isInteger(x)) return [x, 1];
  const sign = x < 0 ? -1 : 1, v = Math.abs(x);
  let h0 = 0, h1 = 1, k0 = 1, k1 = 0, b = v;
  for (let i = 0; i < 40; i++) {
    const a = Math.floor(b);
    const h2 = a * h1 + h0, k2 = a * k1 + k0;
    if (k2 > maxDen) return null;
    h0 = h1; h1 = h2; k0 = k1; k1 = k2;
    if (Math.abs(v - h1 / k1) <= tol * Math.max(1, v)) return [sign * h1, k1];
    const fr = b - a;
    if (fr < 1e-15) break;
    b = 1 / fr;
  }
  return null;
}
function fracText(x, maxDen) {
  const f = toFrac(x, maxDen || 100000, 1e-12);
  return f && f[1] !== 1 ? f[0] + '/' + f[1] : null;
}
function mixedText(x) {
  const f = toFrac(x, 100000, 1e-12);
  if (!f || f[1] === 1 || Math.abs(f[0]) < f[1]) return null;
  const w = Math.trunc(f[0] / f[1]), r = Math.abs(f[0]) - Math.abs(w) * f[1];
  return `${w} ${r}/${f[1]}`;
}

/* =====================================================================
   3. Complex numbers
   ===================================================================== */
const C = (re, im) => ({ re: re, im: im || 0 });
const cneg = a => C(-a.re, -a.im);
const cadd = (a, b) => C(a.re + b.re, a.im + b.im);
const csub = (a, b) => C(a.re - b.re, a.im - b.im);
const cmul = (a, b) => C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
function cdiv(a, b) {
  if (b.im === 0 && a.im === 0) { if (b.re === 0) throw new Error('Division by zero'); return C(a.re / b.re); }
  const d = b.re * b.re + b.im * b.im;
  if (d === 0) throw new Error('Division by zero');
  return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
}
const cabs = a => Math.hypot(a.re, a.im);
const carg = a => Math.atan2(a.im, a.re);
const cconj = a => C(a.re, -a.im);
const isReal = z => Math.abs(z.im) <= 1e-12 * Math.max(1, Math.abs(z.re));
function cleanC(z) {
  const m = Math.hypot(z.re, z.im);
  if (!Number.isFinite(m)) return z;
  const t = 1e-13 * m;
  return C(Math.abs(z.re) <= t ? 0 : z.re, Math.abs(z.im) <= t ? 0 : z.im);
}
function fmtC(z, digits) {
  z = cleanC(z);
  if (z.im === 0) return fmtNum(z.re, digits);
  const a = Math.abs(z.im);
  const ims = (a === 1 ? '' : fmtNum(a, digits)) + 'i';
  if (z.re === 0) return (z.im < 0 ? '-' : '') + ims;
  return fmtNum(z.re, digits) + (z.im < 0 ? ' - ' : ' + ') + ims;
}
function cexp(z) { const e = Math.exp(z.re); return z.im === 0 ? C(e, 0) : C(e * Math.cos(z.im), e * Math.sin(z.im)); }
function cln(z) {
  if (z.re === 0 && z.im === 0) throw new Error('ln(0) is undefined');
  return C(Math.log(cabs(z)), carg(z));
}
function csqrt(z) {
  if (z.im === 0) return z.re >= 0 ? C(Math.sqrt(z.re)) : C(0, Math.sqrt(-z.re));
  const r = cabs(z);
  return C(Math.sqrt((r + z.re) / 2), Math.sign(z.im) * Math.sqrt((r - z.re) / 2));
}
function cpow(a, b) {
  if (b.im === 0 && a.im === 0) {
    const x = a.re, y = b.re;
    if (x === 0) {
      if (y === 0) throw new Error('0^0 is undefined');
      if (y < 0) throw new Error('Division by zero');
      return C(0);
    }
    if (x > 0 || Number.isInteger(y)) return C(Math.pow(x, y));
  }
  if (b.im === 0 && Number.isInteger(b.re) && Math.abs(b.re) <= 1024) {
    let n = Math.abs(b.re), base = a, res = C(1, 0);
    while (n > 0) { if (n & 1) res = cmul(res, base); base = cmul(base, base); n >>= 1; }
    return b.re < 0 ? cdiv(C(1, 0), res) : res;
  }
  if (a.re === 0 && a.im === 0) { if (b.re > 0) return C(0); throw new Error('Division by zero'); }
  return cexp(cmul(b, cln(a)));
}
const I_ = C(0, 1);
const csin = z => C(Math.sin(z.re) * Math.cosh(z.im), Math.cos(z.re) * Math.sinh(z.im));
const ccos = z => C(Math.cos(z.re) * Math.cosh(z.im), -Math.sin(z.re) * Math.sinh(z.im));
const ctan = z => cdiv(csin(z), ccos(z));
const csinh = z => C(Math.sinh(z.re) * Math.cos(z.im), Math.cosh(z.re) * Math.sin(z.im));
const ccosh = z => C(Math.cosh(z.re) * Math.cos(z.im), Math.sinh(z.re) * Math.sin(z.im));
const ctanh = z => cdiv(csinh(z), ccosh(z));
const casinh = z => cln(cadd(z, csqrt(cadd(cmul(z, z), C(1)))));
const cacosh = z => cln(cadd(z, cmul(csqrt(cadd(z, C(1))), csqrt(csub(z, C(1))))));
const catanh = z => cmul(C(0.5), cln(cdiv(cadd(C(1), z), csub(C(1), z))));
const casin = z => cmul(cneg(I_), cln(cadd(cmul(I_, z), csqrt(csub(C(1), cmul(z, z))))));
const cacos = z => csub(C(Math.PI / 2), casin(z));
const catan = z => cmul(cmul(C(0, 0.5), C(1)), csub(cln(csub(C(1), cmul(I_, z))), cln(cadd(C(1), cmul(I_, z)))));

/* =====================================================================
   4. Special functions / integer math
   ===================================================================== */
const _factCache = [1n];
function factBig(n) {
  if (n < 0) throw new Error('Factorial of a negative integer is undefined');
  for (let i = _factCache.length; i <= n; i++) _factCache[i] = _factCache[i - 1] * BigInt(i);
  return _factCache[n];
}
function combBig(n, r) {
  n = BigInt(n); r = BigInt(r);
  if (r < 0n || r > n) return 0n;
  if (r > n - r) r = n - r;
  let res = 1n;
  for (let i = 1n; i <= r; i++) res = res * (n - r + i) / i;
  return res;
}
function permBig(n, r) {
  n = BigInt(n); r = BigInt(r);
  if (r < 0n || r > n) return 0n;
  let res = 1n;
  for (let i = 0n; i < r; i++) res *= (n - i);
  return res;
}
function bigText(b) {
  const s = b.toString();
  if (s.length <= 24) return s;
  const neg = s[0] === '-', d = neg ? s.slice(1) : s;
  return `${neg ? '-' : ''}${d[0]}.${d.slice(1, 12)}e${d.length - 1} (${d.length} digits)`;
}
function gammaFn(x) {
  if (x < 0.5) return Math.PI / (Math.sin(Math.PI * x) * gammaFn(1 - x));
  x -= 1;
  const p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  let a = p[0];
  const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += p[i] / (x + i);
  return Math.sqrt(2 * Math.PI) * Math.pow(t, x + 0.5) * Math.exp(-t) * a;
}
function factorialReal(x) {
  if (Number.isInteger(x)) {
    if (x < 0) throw new Error('Factorial of a negative integer is undefined');
    if (x > 170) throw new Error('Factorial too large (overflow above 170!)');
    return Number(factBig(x));
  }
  const g = gammaFn(x + 1);
  if (!Number.isFinite(g)) throw new Error('Factorial is undefined here');
  return g;
}
function gcdNum(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; }
function lcmNum(a, b) { if (a === 0 || b === 0) return 0; const r = Math.abs(a / gcdNum(a, b) * b); if (r > Number.MAX_SAFE_INTEGER) throw new Error('LCM too large'); return r; }
let _lnF = [0, 0];
function lnFact(n) {
  for (let i = _lnF.length; i <= n; i++) _lnF[i] = _lnF[i - 1] + Math.log(i);
  return _lnF[n];
}
function binomPmf(n, p, k) {
  if (k < 0 || k > n) return 0;
  if (p === 0) return k === 0 ? 1 : 0;
  if (p === 1) return k === n ? 1 : 0;
  if (n <= 170) return Number(combBig(n, k)) * Math.pow(p, k) * Math.pow(1 - p, n - k);
  return Math.exp(lnFact(n) - lnFact(k) - lnFact(n - k) + k * Math.log(p) + (n - k) * Math.log1p(-p));
}
function binomCdf(n, p, k) {
  if (k < 0) return 0;
  if (k >= n) return 1;
  let s = 0;
  for (let i = 0; i <= k; i++) s += binomPmf(n, p, i);
  return Math.min(1, s);
}

/* =====================================================================
   5. Tokenizer & parser
   ===================================================================== */
const FUNCS_LIST = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh', 'sec', 'csc', 'cot', 'sqrt', 'cbrt', 'root', 'exp', 'ln', 'log', 'logb', 'abs', 'fact', 'floor', 'ceil', 'round', 'sign', 'mod', 'gcd', 'lcm', 'ncr', 'npr', 'conj', 're', 'im', 'arg', 'binompdf', 'binomcdf', 'gamma', 'min', 'max', 'deg', 'rad'];
const FN_SET = new Set(FUNCS_LIST);
const PAREN_OPT = new Set(['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'sec', 'csc', 'cot', 'sqrt', 'cbrt', 'ln', 'log', 'exp']);
const CONST_LIST = ['pi', 'tau', 'ans', 'inf', 'theta', 'e', 'i'];
const NAMES_SORTED = FUNCS_LIST.concat(CONST_LIST).sort((a, b) => b.length - a.length);
const ALIAS = { arcsin: 'asin', arccos: 'acos', arctan: 'atan', logb: 'log', log10: 'log' };

function normalizeInput(s) {
  return String(s)
    .replace(/[×·∙⋅]/g, '*').replace(/÷/g, '/').replace(/[−–—]/g, '-').replace(/π/g, 'pi')
    .replace(/√/g, 'sqrt').replace(/²/g, '^2').replace(/³/g, '^3').replace(/θ/g, 'theta')
    .replace(/∞/g, 'inf').replace(/\*\*/g, '^').replace(/≤/g, '<=').replace(/≥/g, '>=');
}
function pushIdents(s, start, toks) {
  const run = /^[a-zA-Z]+/.exec(s.slice(start))[0];
  const lower = run.toLowerCase();
  let pos = 0, end = start + run.length;
  while (pos < lower.length) {
    const rest = lower.slice(pos);
    let matched = null, extra = 0;
    for (const nm of NAMES_SORTED) {
      if (!rest.startsWith(nm)) continue;
      if (FN_SET.has(nm)) {
        const atEnd = pos + nm.length === lower.length;
        const after = s[start + pos + nm.length];
        if (nm === 'log' && atEnd) {
          const m = /^(10|2)(?=\()/.exec(s.slice(end));
          if (m) { matched = 'log' + m[1]; extra = m[1].length; break; }
        }
        if ((atEnd && after === '(') || PAREN_OPT.has(nm)) { matched = nm; break; }
      } else { matched = nm; break; }
    }
    if (matched) {
      const base = matched.startsWith('log') && /\d/.test(matched) ? 'log' : matched;
      const len = base.length;
      if (FN_SET.has(base) && (matched === base || /^log(2|10)$/.test(matched))) toks.push({ t: 'id', n: matched, kind: 'fn' });
      else toks.push({ t: 'id', n: matched, kind: matched === 'theta' ? 'var' : 'const' });
      pos += len; end += extra;
    } else {
      toks.push({ t: 'id', n: lower[pos], kind: 'var' });
      pos += 1;
    }
  }
  return end;
}
function tokenize(src) {
  const s = normalizeInput(src);
  const toks = [];
  let i = 0;
  const NUM = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/;
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (/[0-9.]/.test(ch)) {
      const m = NUM.exec(s.slice(i));
      if (!m) throw new Error(`Invalid number near "${s.slice(i, i + 4)}"`);
      toks.push({ t: 'num', v: parseFloat(m[0]) });
      i += m[0].length; continue;
    }
    if (/[a-zA-Z]/.test(ch)) { i = pushIdents(s, i, toks); continue; }
    if ('+-*/^(),!'.includes(ch)) { toks.push({ t: 'op', v: ch }); i++; continue; }
    throw new Error(`Unexpected character "${ch}"`);
  }
  return toks;
}
function parse(src) {
  const toks = tokenize(src);
  if (!toks.length) throw new Error('Empty expression');
  let depth = 0;
  for (const t of toks) {
    if (t.t === 'op' && t.v === '(') depth++;
    if (t.t === 'op' && t.v === ')') { depth--; if (depth < 0) throw new Error('Mismatched parentheses: unexpected ")"'); }
  }
  for (; depth > 0; depth--) toks.push({ t: 'op', v: ')' });
  let p = 0;
  const peek = () => toks[p];
  const isOp = (t, v) => t && t.t === 'op' && t.v === v;
  const tokText = t => t ? (t.t === 'num' ? String(t.v) : t.t === 'id' ? t.n : t.v) : 'end of input';
  const startsPrimary = t => t && (t.t === 'num' || t.t === 'id' || isOp(t, '('));
  function expectOp(v) {
    if (!isOp(peek(), v)) throw new Error(`Expected "${v}" but found "${tokText(peek())}"`);
    p++;
  }
  function parseExpr() {
    let a = parseTerm();
    while (isOp(peek(), '+') || isOp(peek(), '-')) {
      const op = toks[p++].v;
      a = { k: 'bin', op, a, b: parseTerm() };
    }
    return a;
  }
  function parseTerm() {
    let a = parseUnary();
    for (;;) {
      const t = peek();
      if (!t) break;
      if (isOp(t, '*') || isOp(t, '/')) { p++; a = { k: 'bin', op: t.v, a, b: parseUnary() }; }
      else if (startsPrimary(t)) a = { k: 'bin', op: '*', a, b: parsePower() };
      else break;
    }
    return a;
  }
  function parseUnary() {
    if (isOp(peek(), '-')) { p++; return { k: 'neg', a: parseUnary() }; }
    if (isOp(peek(), '+')) { p++; return parseUnary(); }
    return parsePower();
  }
  function parsePower() {
    const base = parsePostfix();
    if (isOp(peek(), '^')) { p++; return { k: 'bin', op: '^', a: base, b: parseUnary() }; }
    return base;
  }
  function parsePostfix() {
    let a = parsePrimary();
    while (isOp(peek(), '!')) { p++; a = { k: 'fn', n: 'fact', args: [a] }; }
    return a;
  }
  function parsePrimary() {
    const t = toks[p++];
    if (!t) throw new Error('Unexpected end of expression');
    if (t.t === 'num') return { k: 'num', v: t.v };
    if (isOp(t, '(')) {
      if (isOp(peek(), ')')) throw new Error('Empty parentheses');
      const e = parseExpr(); expectOp(')'); return e;
    }
    if (t.t === 'id') {
      if (t.kind === 'const') return { k: 'const', n: t.n };
      if (t.kind === 'var') return { k: 'var', n: t.n };
      const name = ALIAS[t.n] || t.n;
      if (isOp(peek(), '(')) {
        p++;
        const args = [];
        if (isOp(peek(), ')')) p++;
        else {
          for (;;) { args.push(parseExpr()); if (isOp(peek(), ',')) { p++; continue; } break; }
          expectOp(')');
        }
        return { k: 'fn', n: name, args };
      }
      if (isOp(peek(), '^')) {            // sin^2(x)  ==  (sin(x))^2
        p++;
        const ex = parsePostfix();
        const arg = isOp(peek(), '(') ? parsePrimary() : parsePower();
        return { k: 'bin', op: '^', a: { k: 'fn', n: name, args: [arg] }, b: ex };
      }
      if (!startsPrimary(peek())) throw new Error(`Function "${t.n}" needs an argument`);
      return { k: 'fn', n: name, args: [parsePower()] };
    }
    throw new Error(`Unexpected "${tokText(t)}"`);
  }
  const ast = parseExpr();
  if (p < toks.length) {
    const t = toks[p];
    if (isOp(t, ')')) throw new Error('Mismatched parentheses: unexpected ")"');
    if (isOp(t, ',')) throw new Error('Unexpected "," (commas are only for function arguments)');
    throw new Error(`Unexpected "${tokText(t)}"`);
  }
  return ast;
}
function varsOf(n, set) {
  set = set || new Set();
  switch (n.k) {
    case 'var': set.add(n.n); break;
    case 'neg': varsOf(n.a, set); break;
    case 'bin': varsOf(n.a, set); varsOf(n.b, set); break;
    case 'fn': n.args.forEach(a => varsOf(a, set)); break;
  }
  return set;
}
function containsVar(n, v) { return varsOf(n).has(v); }
function pstr(n, prec) {
  prec = prec || 0;
  switch (n.k) {
    case 'num': return fmtNum(n.v);
    case 'const': return n.n === 'pi' ? 'π' : n.n;
    case 'var': return n.n;
    case 'neg': { const s = '-' + pstr(n.a, 3); return prec > 2 ? '(' + s + ')' : s; }
    case 'bin': {
      const P = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 4 }[n.op];
      const sym = n.op === '*' ? '×' : n.op === '/' ? '÷' : n.op;
      const l = pstr(n.a, n.op === '^' ? 5 : P), r = pstr(n.b, n.op === '^' ? 3 : P + 1);
      const s = l + (n.op === '^' ? '^' : ' ' + sym + ' ') + r;
      return P < prec ? '(' + s + ')' : s;
    }
    case 'fn':
      if (n.n === 'fact') return pstr(n.args[0], 5) + '!';
      return n.n + '(' + n.args.map(a => pstr(a, 0)).join(', ') + ')';
  }
  return '?';
}

/* =====================================================================
   6. Evaluator (complex aware)
   ===================================================================== */
function trigK(x) {
  if (x === 0) return null;
  const k = Math.round(x / (Math.PI / 2));
  if (k !== 0 && Math.abs(x - k * Math.PI / 2) <= 1e-14 * Math.abs(x)) return k;
  return null;
}
function trigReal(name, x, deg) {
  let rad = x, k = null;
  if (deg) {
    const t = x / 90;
    if (x !== 0 && Math.abs(t - Math.round(t)) < 1e-12) k = Math.round(t);
    rad = x * Math.PI / 180;
  } else k = trigK(x);
  const m = k === null ? null : ((k % 4) + 4) % 4;
  if (name === 'sin') return m === null ? Math.sin(rad) : [0, 1, 0, -1][m];
  if (name === 'cos') return m === null ? Math.cos(rad) : [1, 0, -1, 0][m];
  if (m === null) return Math.tan(rad);
  if (m % 2 === 0) return 0;
  throw new Error('tan is undefined at this angle');
}
const angOut = (r, deg) => deg ? r * 180 / Math.PI : r;
function realOf(z, name) {
  if (!isReal(z)) throw new Error(`${name}() requires a real argument`);
  return z.re;
}
function intOf(z, name) {
  const x = realOf(z, name);
  if (!Number.isInteger(x)) throw new Error(`${name}() requires integer arguments`);
  return x;
}
function constVal(n, ctx) {
  switch (n) {
    case 'pi': return C(Math.PI);
    case 'tau': return C(2 * Math.PI);
    case 'e': return C(Math.E);
    case 'i': return C(0, 1);
    case 'inf': return C(Infinity);
    case 'ans': return ctx.ans || STATE.ans || C(0);
  }
  throw new Error(`Unknown constant "${n}"`);
}
function callFn(name, a, ctx) {
  const deg = !!ctx.deg;
  const need = (min, max) => {
    max = max === undefined ? min : max;
    if (a.length < min || a.length > max) throw new Error(`${name}() takes ${min === max ? min : min + '-' + (max === Infinity ? 'n' : max)} argument${max > 1 ? 's' : ''}`);
  };
  const z = a[0];
  switch (name) {
    case 'sin': case 'cos': case 'tan':
      need(1);
      if (isReal(z)) return C(trigReal(name, z.re, deg));
      return name === 'sin' ? csin(z) : name === 'cos' ? ccos(z) : ctan(z);
    case 'sec': return cdiv(C(1), callFn('cos', a, ctx));
    case 'csc': return cdiv(C(1), callFn('sin', a, ctx));
    case 'cot': return cdiv(callFn('cos', a, ctx), callFn('sin', a, ctx));
    case 'asin': need(1); return isReal(z) && Math.abs(z.re) <= 1 ? C(angOut(Math.asin(z.re), deg)) : casin(z);
    case 'acos': need(1); return isReal(z) && Math.abs(z.re) <= 1 ? C(angOut(Math.acos(z.re), deg)) : cacos(z);
    case 'atan': need(1); return isReal(z) ? C(angOut(Math.atan(z.re), deg)) : catan(z);
    case 'sinh': need(1); return isReal(z) ? C(Math.sinh(z.re)) : csinh(z);
    case 'cosh': need(1); return isReal(z) ? C(Math.cosh(z.re)) : ccosh(z);
    case 'tanh': need(1); return isReal(z) ? C(Math.tanh(z.re)) : ctanh(z);
    case 'asinh': need(1); return isReal(z) ? C(Math.asinh(z.re)) : casinh(z);
    case 'acosh': need(1); return isReal(z) && z.re >= 1 ? C(Math.acosh(z.re)) : cacosh(z);
    case 'atanh':
      need(1);
      if (isReal(z) && Math.abs(z.re) === 1) throw new Error('atanh is undefined at ±1');
      return isReal(z) && Math.abs(z.re) < 1 ? C(Math.atanh(z.re)) : catanh(z);
    case 'sqrt': need(1); return csqrt(z);
    case 'cbrt': need(1); return isReal(z) ? C(Math.cbrt(z.re)) : cpow(z, C(1 / 3));
    case 'root': {
      need(2);
      const n = realOf(a[1], 'root');
      if (n === 0) throw new Error('root(x, 0) is undefined');
      if (isReal(z)) {
        if (z.re >= 0) return C(Math.pow(z.re, 1 / n));
        if (Number.isInteger(n) && Math.abs(n) % 2 === 1) return C(-Math.pow(-z.re, 1 / n));
      }
      return cpow(z, C(1 / n));
    }
    case 'exp': need(1); return cexp(z);
    case 'ln':
      need(1);
      if (isReal(z) && z.re > 0) return C(Math.log(z.re));
      return cln(z);
    case 'log': case 'log2': {
      need(1, name === 'log' ? 2 : 1);
      if (z.re === 0 && z.im === 0) throw new Error('log(0) is undefined');
      if (name === 'log2') return isReal(z) && z.re > 0 ? C(Math.log2(z.re)) : cdiv(cln(z), C(Math.LN2));
      if (a.length === 2) {
        const b = a[1];
        if (isReal(b) && (b.re <= 0 || b.re === 1)) throw new Error('log base must be positive and not 1');
        if (isReal(z) && isReal(b) && z.re > 0) return C(Math.log(z.re) / Math.log(b.re));
        return cdiv(cln(z), cln(b));
      }
      return isReal(z) && z.re > 0 ? C(Math.log10(z.re)) : cdiv(cln(z), C(Math.LN10));
    }
    case 'abs': need(1); return C(cabs(z));
    case 'fact': need(1); return C(factorialReal(realOf(z, 'factorial')));
    case 'gamma': { need(1); const x = realOf(z, 'gamma'); const g = gammaFn(x); if (!Number.isFinite(g)) throw new Error('gamma is undefined here'); return C(g); }
    case 'floor': need(1); return C(Math.floor(realOf(z, name)));
    case 'ceil': need(1); return C(Math.ceil(realOf(z, name)));
    case 'round': need(1); return C(Math.round(realOf(z, name)));
    case 'sign': need(1); return C(Math.sign(realOf(z, name)));
    case 'mod': {
      need(2);
      const x = realOf(a[0], 'mod'), y = realOf(a[1], 'mod');
      if (y === 0) throw new Error('mod by zero');
      return C(((x % y) + y) % y);
    }
    case 'gcd': case 'lcm': {
      need(2, 99);
      const v = a.map(q => intOf(q, name));
      return C(v.reduce((s, q) => name === 'gcd' ? gcdNum(s, q) : lcmNum(s, q)));
    }
    case 'ncr': case 'npr': {
      need(2);
      const n = intOf(a[0], name), r = intOf(a[1], name);
      if (n < 0 || r < 0) throw new Error(`${name}() needs non-negative integers`);
      return C(Number(name === 'ncr' ? combBig(n, r) : permBig(n, r)));
    }
    case 'conj': need(1); return cconj(z);
    case 're': need(1); return C(z.re);
    case 'im': need(1); return C(z.im);
    case 'arg':
      need(1);
      if (z.re === 0 && z.im === 0) throw new Error('arg(0) is undefined');
      return C(angOut(carg(z), deg));
    case 'min': case 'max': { need(1, 99); const v = a.map(q => realOf(q, name)); return C(Math[name](...v)); }
    case 'deg': need(1); return C(realOf(z, name) * 180 / Math.PI);
    case 'rad': need(1); return C(realOf(z, name) * Math.PI / 180);
    case 'binompdf': case 'binomcdf': {
      need(3);
      const n = intOf(a[0], name), p = realOf(a[1], name), k = intOf(a[2], name);
      if (n < 0 || n > 100000 || p < 0 || p > 1) throw new Error(`${name}(n, p, k): n must be a non-negative integer, 0 ≤ p ≤ 1`);
      return C(name === 'binompdf' ? binomPmf(n, p, k) : binomCdf(n, p, k));
    }
  }
  throw new Error(`Unknown function "${name}"`);
}
function evalC(n, ctx) {
  let r;
  switch (n.k) {
    case 'num': return C(n.v);
    case 'const': return constVal(n.n, ctx);
    case 'var': {
      const v = ctx.vars && ctx.vars[n.n];
      if (v === undefined) throw new Error(`Unknown variable "${n.n}"`);
      return typeof v === 'number' ? C(v) : v;
    }
    case 'neg': r = cneg(evalC(n.a, ctx)); break;
    case 'bin': {
      const a = evalC(n.a, ctx), b = evalC(n.b, ctx);
      switch (n.op) {
        case '+': r = cadd(a, b); break;
        case '-': r = csub(a, b); break;
        case '*': r = cmul(a, b); break;
        case '/': r = cdiv(a, b); break;
        case '^': r = cpow(a, b); break;
      }
      break;
    }
    case 'fn': r = callFn(n.n, n.args.map(a => evalC(a, ctx)), ctx); break;
    default: throw new Error('Bad expression');
  }
  if (ctx.trace && !(n.k === 'neg' && n.a.k === 'num')) ctx.trace.push({ e: pstr(n), v: fmtC(r) });
  return r;
}
function evalNumber(text, vars) {
  const z = evalC(parse(text), { deg: false, vars: vars || {} });
  if (!isReal(z)) throw new Error(`"${text}" is not a real number`);
  if (Number.isNaN(z.re)) throw new Error(`"${text}" is undefined`);
  return z.re;
}
function constEval(n) {
  const z = evalC(n, { deg: false, vars: {} });
  if (!isReal(z)) throw new Error('Coefficients must be real numbers');
  return z.re;
}

/* =====================================================================
   7. Polynomials, equations & inequalities
   ===================================================================== */
const padd = (a, b) => { const r = []; for (let i = 0; i < Math.max(a.length, b.length); i++) r[i] = (a[i] || 0) + (b[i] || 0); return r; };
const psub = (a, b) => padd(a, b.map(x => -x));
function pmul(a, b) { const r = new Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { r[i + j] += x * y; })); return r; }
function ptrim(p) {
  const m = Math.max(0, ...p.map(Math.abs));
  const q = p.slice();
  while (q.length > 1 && Math.abs(q[q.length - 1]) <= 1e-12 * Math.max(m, 1e-300)) q.pop();
  if (q.length === 1 && Math.abs(q[0]) <= 1e-14) q[0] = 0;
  return q;
}
function polyFromAst(n, v) {
  function go(n) {
    if (!containsVar(n, v)) return [constEval(n)];
    switch (n.k) {
      case 'var': return [0, 1];
      case 'neg': return go(n.a).map(c => -c);
      case 'bin':
        if (n.op === '+') return padd(go(n.a), go(n.b));
        if (n.op === '-') return psub(go(n.a), go(n.b));
        if (n.op === '*') return pmul(go(n.a), go(n.b));
        if (n.op === '/') {
          if (containsVar(n.b, v)) throw new Error('Not a polynomial: division by the variable');
          const d = constEval(n.b);
          if (d === 0) throw new Error('Division by zero');
          return go(n.a).map(c => c / d);
        }
        if (n.op === '^') {
          if (containsVar(n.b, v)) throw new Error('Not a polynomial: variable in an exponent');
          const e = constEval(n.b);
          if (!Number.isInteger(e) || e < 0 || e > 30) throw new Error('Exponents must be whole numbers from 0 to 30');
          let r = [1]; const b = go(n.a);
          for (let i = 0; i < e; i++) r = pmul(r, b);
          return r;
        }
    }
    throw new Error(`Not a polynomial in ${v} (contains ${n.k === 'fn' ? n.n + '()' : 'an unsupported term'})`);
  }
  return go(n);
}
const polyEval = (p, x) => { let r = 0; for (let i = p.length - 1; i >= 0; i--) r = r * x + p[i]; return r; };
function polyEvalC(p, z) { let r = C(0); for (let i = p.length - 1; i >= 0; i--) r = cadd(cmul(r, z), C(p[i])); return r; }
function polyDeriv(p) { return p.slice(1).map((c, i) => c * (i + 1)); }
function newtonPolish(p, z) {
  const dp = polyDeriv(p);
  for (let i = 0; i < 6; i++) {
    const f = polyEvalC(p, z), d = polyEvalC(dp, z);
    if (d.re === 0 && d.im === 0) break;
    const step = cdiv(f, d);
    const nz = csub(z, step);
    if (!Number.isFinite(nz.re) || !Number.isFinite(nz.im)) break;
    if (cabs(polyEvalC(p, nz)) > cabs(f)) break;
    z = nz;
  }
  return z;
}
function dkRoots(p) {
  const n = p.length - 1, a = p.map(c => c / p[n]);
  const r0 = Math.max(Math.pow(Math.abs(a[0]), 1 / n), 0.5);
  let z = [];
  for (let k = 0; k < n; k++) { const ang = 2 * Math.PI * k / n + 0.7; z.push(C(r0 * Math.cos(ang), r0 * Math.sin(ang))); }
  for (let it = 0; it < 800; it++) {
    let md = 0;
    for (let k = 0; k < n; k++) {
      let den = C(1);
      for (let j = 0; j < n; j++) if (j !== k) den = cmul(den, csub(z[k], z[j]));
      if (den.re === 0 && den.im === 0) den = C(1e-12, 1e-12);
      const d = cdiv(polyEvalC(a, z[k]), den);
      z[k] = csub(z[k], d);
      md = Math.max(md, cabs(d) / (1 + cabs(z[k])));
    }
    if (md < 1e-15) break;
  }
  return z.map(r => newtonPolish(p, r));
}
function cubicRoots(p) {
  const [d, c, b, a] = p;
  const B = b / a, Cc = c / a, Dd = d / a;
  const pp = Cc - B * B / 3, q = 2 * B * B * B / 27 - B * Cc / 3 + Dd, sh = -B / 3;
  const disc = q * q / 4 + pp * pp * pp / 27;
  const scale = q * q / 4 + Math.abs(pp * pp * pp / 27) + 1e-300;
  let t;
  if (Math.abs(disc) <= 1e-13 * scale) {
    if (Math.abs(pp) < 1e-12 && Math.abs(q) < 1e-12) t = [C(0), C(0), C(0)];
    else t = [C(3 * q / pp), C(-3 * q / (2 * pp)), C(-3 * q / (2 * pp))];
  } else if (disc > 0) {
    const sd = Math.sqrt(disc), u = Math.cbrt(-q / 2 + sd), v = Math.cbrt(-q / 2 - sd);
    t = [C(u + v), C(-(u + v) / 2, (Math.sqrt(3) / 2) * (u - v)), C(-(u + v) / 2, -(Math.sqrt(3) / 2) * (u - v))];
  } else {
    const r = 2 * Math.sqrt(-pp / 3);
    const arg = Math.max(-1, Math.min(1, (3 * q / (2 * pp)) * Math.sqrt(-3 / pp)));
    const phi = Math.acos(arg);
    t = [0, 1, 2].map(k => C(r * Math.cos((phi - 2 * Math.PI * k) / 3)));
  }
  return t.map(z => newtonPolish(p, C(z.re + sh, z.im)));
}
function polyRoots(p) {
  p = ptrim(p);
  const n = p.length - 1;
  if (n < 1) return [];
  let roots;
  if (n === 1) roots = [C(-p[0] / p[1])];
  else if (n === 2) {
    const [c, b, a] = p, D = b * b - 4 * a * c;
    if (D >= 0) {
      const s = Math.sqrt(D), q = -0.5 * (b + (b < 0 ? -s : s));
      if (q === 0) roots = [C(0), C(0)];
      else roots = [C(q / a), C(c / q)];
    } else {
      const re = -b / (2 * a), im = Math.sqrt(-D) / (2 * Math.abs(a));
      roots = [C(re, -im), C(re, im)];
    }
  } else if (n === 3) roots = cubicRoots(p);
  else roots = dkRoots(p);
  roots = roots.map(z => (Math.abs(z.im) < 1e-9 * (1 + Math.abs(z.re)) ? C(z.re, 0) : z));
  roots.sort((x, y) => (x.im === 0) === (y.im === 0) ? (x.re - y.re) || (x.im - y.im) : (x.im === 0 ? -1 : 1));
  // symmetrise conjugate pairs
  for (let i = 0; i < roots.length; i++) {
    if (roots[i].im > 0) {
      const j = roots.findIndex(z => z.im < 0 && Math.abs(z.re - roots[i].re) < 1e-7 * (1 + Math.abs(z.re)) && Math.abs(z.im + roots[i].im) < 1e-7 * (1 + Math.abs(z.im)));
      if (j >= 0) { const re = (roots[i].re + roots[j].re) / 2, im = (roots[i].im - roots[j].im) / 2; roots[i] = C(re, im); roots[j] = C(re, -im); }
    }
  }
  return roots;
}
function rootText(z) {
  z = cleanC(z);
  if (z.im === 0) {
    const f = fracText(z.re, 1000);
    return f ? `${f}  (= ${fmtNum(z.re, 10)})` : fmtNum(z.re, 10);
  }
  return fmtC(z, 10);
}
function splitEquation(str) {
  const s = normalizeInput(str);
  const parts = s.split('=');
  if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim())
    throw new Error('Enter an equation with exactly one "=" (for example x^2 - 5x + 6 = 0)');
  return parts;
}
function polyOfSides(L, R) {
  const a = parse(L), b = parse(R);
  const vs = new Set(); varsOf(a, vs); varsOf(b, vs);
  if (vs.size > 1) throw new Error(`Only one variable is supported (found: ${[...vs].join(', ')})`);
  const v = vs.size ? [...vs][0] : 'x';
  return { v, p: ptrim(psub(polyFromAst(a, v), polyFromAst(b, v))) };
}
function intScale(coefs) {
  const fr = coefs.map(c => toFrac(c, 1000000, 1e-12));
  if (fr.some(f => !f)) return null;
  let L = 1;
  for (const f of fr) L = lcmNum(L, f[1]);
  const ints = fr.map(f => f[0] * (L / f[1]));
  let g = 0;
  for (const x of ints) g = gcdNum(g, x);
  return g > 1 ? ints.map(x => x / g) : ints;
}
function sqrtSplit(n) {      // n>0 integer -> [s, m] with n = s^2 * m
  let s = 1, m = n;
  for (let f = 2; f * f <= m; f++) while (m % (f * f) === 0) { m /= f * f; s *= f; }
  return [s, m];
}
function quadExact(a, b, c) {
  const ints = intScale([a, b, c]);
  if (!ints) return null;
  let [A, B, Cc] = ints;
  if (Math.abs(A) > 1e6 || Math.abs(B) > 1e6 || Math.abs(Cc) > 1e6) return null;
  const D = B * B - 4 * A * Cc;
  let d = 2 * A, n0 = -B;
  if (d < 0) { d = -d; n0 = -n0; }
  if (D === 0) { const f = toFrac(n0 / d); return `x = ${f[1] === 1 ? f[0] : f[0] + '/' + f[1]}`; }
  const [s, m] = sqrtSplit(Math.abs(D));
  if (D > 0 && m === 1) return null;
  let g = gcdNum(gcdNum(n0, s), d);
  const nn = n0 / g, ss = s / g, dd = d / g;
  const rad = (ss === 1 ? '' : ss) + (m === 1 ? '' : '√' + m) + (D < 0 ? 'i' : '');
  const radStr = (m === 1 && D < 0 && ss === 1) ? 'i' : rad;
  let out;
  if (nn === 0) out = dd === 1 ? `±${radStr}` : `±${radStr}/${dd}`;
  else out = dd === 1 ? `${nn} ± ${radStr}` : `(${nn} ± ${radStr})/${dd}`;
  return 'x = ' + out;
}
function solveEquation(str) {
  const [L, R] = splitEquation(str);
  const { v, p } = polyOfSides(L, R);
  const deg = p.length - 1;
  const res = { v, p, deg, roots: [], steps: [], exact: null, note: '' };
  const pretty = poly => poly.map((c, i) => [c, i]).filter(([c]) => Math.abs(c) > 0).reverse()
    .map(([c, i], idx) => {
      const sgn = c < 0 ? '-' : '+', ac = Math.abs(c);
      const body = i === 0 ? fmtNum(ac, 8) : (ac === 1 ? '' : fmtNum(ac, 8)) + v + (i > 1 ? '^' + i : '');
      return idx === 0 ? (c < 0 ? '-' : '') + body : ` ${sgn} ${body}`;
    }).join('') || '0';
  res.standard = pretty(p) + ' = 0';
  if (deg === 0) {
    res.kind = p[0] === 0 ? 'identity' : 'contradiction';
    res.note = p[0] === 0 ? 'Both sides are equal for every value: infinitely many solutions.' : 'The equation reduces to a false statement: no solution.';
    return res;
  }
  res.kind = ['', 'linear', 'quadratic', 'cubic'][deg] || `degree-${deg}`;
  res.steps.push(`Move everything to one side: ${res.standard}`);
  if (deg === 1) {
    res.steps.push(`a = ${fmtNum(p[1], 8)}, b = ${fmtNum(p[0], 8)}  →  ${v} = −b/a = ${fmtNum(-p[0] / p[1], 10)}`);
  } else if (deg === 2) {
    const [c, b, a] = p, D = b * b - 4 * a * c;
    res.steps.push(`a = ${fmtNum(a, 8)}, b = ${fmtNum(b, 8)}, c = ${fmtNum(c, 8)}`);
    res.steps.push(`Discriminant Δ = b² − 4ac = ${fmtNum(D, 10)} ${D > 0 ? '(two real roots)' : D === 0 ? '(one repeated real root)' : '(two complex conjugate roots)'}`);
    res.steps.push(`${v} = (−b ± √Δ) / (2a)`);
    res.exact = quadExact(a, b, c);
  } else if (deg === 3) {
    const [d, c, b, a] = p;
    res.steps.push(`a = ${fmtNum(a, 8)}, b = ${fmtNum(b, 8)}, c = ${fmtNum(c, 8)}, d = ${fmtNum(d, 8)}`);
    const B = b / a, Cc = c / a, Dd = d / a, pp = Cc - B * B / 3, q = 2 * B * B * B / 27 - B * Cc / 3 + Dd;
    res.steps.push(`Depress the cubic with ${v} = t − b/(3a): t³ + pt + q = 0 with p = ${fmtNum(pp, 8)}, q = ${fmtNum(q, 8)}`);
    const disc = q * q / 4 + pp * pp * pp / 27;
    res.steps.push(`Cardano discriminant Δ = q²/4 + p³/27 = ${fmtNum(disc, 8)} → ${Math.abs(disc) < 1e-12 ? 'repeated root(s)' : disc > 0 ? 'one real root and two complex roots' : 'three distinct real roots (trigonometric method)'}`);
  } else {
    res.steps.push('Degree above 3: roots found numerically (Durand–Kerner iteration with Newton polishing).');
  }
  res.roots = polyRoots(p);
  return res;
}
function solveInequality(str) {
  const s = normalizeInput(str);
  const m = /^(.*?)(<=|>=|<|>)(.*)$/.exec(s);
  if (!m || /(<=|>=|<|>|=)/.test(m[3])) throw new Error('Enter exactly one inequality, for example x^2 - 5x + 6 < 0');
  if (!m[1].trim() || !m[3].trim()) throw new Error('Both sides of the inequality are needed');
  const op = m[2], incl = op.includes('=');
  const { v, p } = polyOfSides(m[1], m[3]);
  const deg = p.length - 1;
  const test = val => op[0] === '<' ? val < 0 : val > 0;
  const res = { v, p, op, deg, roots: [], text: '', interval: '', ineq: '' };
  if (deg === 0) {
    const ok = p[0] === 0 ? incl : test(p[0]);
    res.interval = ok ? '(-∞, ∞)' : '∅';
    res.ineq = ok ? `all real numbers (true for every ${v})` : 'no solution';
    return res;
  }
  let rts = polyRoots(p).filter(z => z.im === 0).map(z => z.re).sort((a, b) => a - b);
  const pts = [];
  for (const r of rts) if (!pts.length || Math.abs(r - pts[pts.length - 1]) > 1e-9 * (1 + Math.abs(r))) pts.push(r);
  res.roots = pts;
  const nP = pts.length, cells = [];
  for (let i = 0; i <= nP; i++) {
    const lo = i === 0 ? null : pts[i - 1], hi = i === nP ? null : pts[i];
    const t = lo === null && hi === null ? 0 : lo === null ? hi - 1 : hi === null ? lo + 1 : (lo + hi) / 2;
    cells.push(test(polyEval(p, t)));
    if (i < nP) cells.push(incl);
  }
  const num = r => fracText(r, 1000) || fmtNum(r, 8);
  const runs = [];
  for (let i = 0; i < cells.length;) {
    if (!cells[i]) { i++; continue; }
    let j = i;
    while (j + 1 < cells.length && cells[j + 1]) j++;
    runs.push([i, j]); i = j + 1;
  }
  if (!runs.length) { res.interval = '∅'; res.ineq = 'no real solution'; return res; }
  const ints = [], txt = [];
  for (const [i, j] of runs) {
    if (i === j && i % 2 === 1) { const r = pts[(i - 1) / 2]; ints.push(`{${num(r)}}`); txt.push(`${v} = ${num(r)}`); continue; }
    const leftInf = i === 0, rightInf = j === cells.length - 1;
    const lc = i % 2 === 1, rc = j % 2 === 1;
    const lv = leftInf ? null : (lc ? pts[(i - 1) / 2] : pts[i / 2 - 1]);
    const rv = rightInf ? null : (rc ? pts[(j - 1) / 2] : pts[j / 2]);
    ints.push(`${leftInf ? '(' : lc ? '[' : '('}${leftInf ? '-∞' : num(lv)}, ${rightInf ? '∞' : num(rv)}${rightInf ? ')' : rc ? ']' : ')'}`);
    if (leftInf && rightInf) txt.push('all real numbers');
    else if (leftInf) txt.push(`${v} ${rc ? '≤' : '<'} ${num(rv)}`);
    else if (rightInf) txt.push(`${v} ${lc ? '≥' : '>'} ${num(lv)}`);
    else txt.push(`${num(lv)} ${lc ? '≤' : '<'} ${v} ${rc ? '≤' : '<'} ${num(rv)}`);
  }
  res.interval = ints.join(' ∪ ');
  res.ineq = txt.join('  or  ');
  return res;
}

/* =====================================================================
   8. Calculator front-end helpers
   ===================================================================== */
function evaluateExpression(text) {
  const ast = parse(text);
  const ctx = { deg: STATE.deg, ans: STATE.ans, vars: {}, trace: [] };
  const z = evalC(ast, ctx);
  if (Number.isNaN(z.re) || Number.isNaN(z.im)) throw new Error('Result is undefined');
  return { z, trace: ctx.trace, ast };
}
