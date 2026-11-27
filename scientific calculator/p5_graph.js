
/* =====================================================================
   11. Graph calculator tab
   ===================================================================== */
const G = { deg: false, fns: [], nextId: 1, cx: 0, cy: 0, sx: 45, sy: 45, W: 800, H: 560, dpr: 1, auto: true, overlay: [], hover: null, ctx: null, ready: false };
const GCOLORS = ['#1565e6', '#e0492f', '#1b9e5a', '#8e44ad', '#e08a00', '#0aa6b8', '#c2185b', '#5d6d7e'];

function rpow(a, b) {
  if (a >= 0 || Number.isInteger(b)) return Math.pow(a, b);
  const f = toFrac(b, 99, 1e-9);
  if (f && f[1] % 2 === 1) { const r = Math.pow(-a, b); return f[0] % 2 === 0 ? r : -r; }
  return NaN;
}
const gAng = x => G.deg ? x * Math.PI / 180 : x;
const gAngOut = x => G.deg ? x * 180 / Math.PI : x;
function gTrig(name, x) {
  const t = gAng(x);
  if (G.deg) {
    const q = x / 90;
    if (Math.abs(q - Math.round(q)) < 1e-12) {
      const m = ((Math.round(q) % 4) + 4) % 4;
      if (name === 'sin') return [0, 1, 0, -1][m];
      if (name === 'cos') return [1, 0, -1, 0][m];
      return m % 2 === 0 ? 0 : NaN;
    }
  } else {
    const k = Math.round(x / (Math.PI / 2));
    if (k !== 0 && Math.abs(x - k * Math.PI / 2) < 1e-13 * Math.abs(x)) {
      const m = ((k % 4) + 4) % 4;
      if (name === 'sin') return [0, 1, 0, -1][m];
      if (name === 'cos') return [1, 0, -1, 0][m];
      return m % 2 === 0 ? 0 : NaN;
    }
  }
  return name === 'sin' ? Math.sin(t) : name === 'cos' ? Math.cos(t) : Math.tan(t);
}
const GF1 = {
  sin: x => gTrig('sin', x), cos: x => gTrig('cos', x), tan: x => gTrig('tan', x),
  sec: x => 1 / gTrig('cos', x), csc: x => 1 / gTrig('sin', x), cot: x => 1 / gTrig('tan', x),
  asin: x => Math.abs(x) <= 1 ? gAngOut(Math.asin(x)) : NaN, acos: x => Math.abs(x) <= 1 ? gAngOut(Math.acos(x)) : NaN, atan: x => gAngOut(Math.atan(x)),
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, asinh: Math.asinh, acosh: x => x >= 1 ? Math.acosh(x) : NaN, atanh: x => Math.abs(x) < 1 ? Math.atanh(x) : NaN,
  sqrt: x => x >= 0 ? Math.sqrt(x) : NaN, cbrt: Math.cbrt, exp: Math.exp, ln: x => x > 0 ? Math.log(x) : NaN,
  abs: Math.abs, floor: Math.floor, ceil: Math.ceil, round: Math.round, sign: Math.sign,
  fact: x => { try { return factorialReal(x); } catch (e) { return NaN; } },
  gamma: x => { const g = gammaFn(x); return Number.isFinite(g) ? g : NaN; },
  deg: x => x * 180 / Math.PI, rad: x => x * Math.PI / 180,
};
function compileReal(n) {
  switch (n.k) {
    case 'num': { const v = n.v; return () => v; }
    case 'const': {
      const v = n.n === 'pi' ? Math.PI : n.n === 'e' ? Math.E : n.n === 'tau' ? 2 * Math.PI : n.n === 'inf' ? Infinity : NaN;
      if (Number.isNaN(v)) throw new Error(`"${n.n}" cannot be used in a graph`);
      return () => v;
    }
    case 'var': {
      if (n.n === 'x') return (x) => x;
      if (n.n === 'y') return (x, y) => y;
      throw new Error(`Unknown variable "${n.n}". Graphs can use x and y`);
    }
    case 'neg': { const f = compileReal(n.a); return (x, y) => -f(x, y); }
    case 'bin': {
      const a = compileReal(n.a), b = compileReal(n.b);
      switch (n.op) {
        case '+': return (x, y) => a(x, y) + b(x, y);
        case '-': return (x, y) => a(x, y) - b(x, y);
        case '*': return (x, y) => a(x, y) * b(x, y);
        case '/': return (x, y) => a(x, y) / b(x, y);
        case '^': return (x, y) => rpow(a(x, y), b(x, y));
      }
      break;
    }
    case 'fn': {
      const args = n.args.map(compileReal), nm = n.n;
      if (GF1[nm]) { if (args.length !== 1) throw new Error(`${nm}() takes one argument`); const g = GF1[nm], a0 = args[0]; return (x, y) => g(a0(x, y)); }
      if (nm === 'ln' || nm === 'log' || nm === 'log2') {
        const a0 = args[0];
        if (nm === 'log' && args.length === 2) { const b0 = args[1]; return (x, y) => { const v = a0(x, y), b = b0(x, y); return v > 0 && b > 0 && b !== 1 ? Math.log(v) / Math.log(b) : NaN; }; }
        const base = nm === 'log2' ? Math.LN2 : Math.LN10;
        return (x, y) => { const v = a0(x, y); return v > 0 ? Math.log(v) / base : NaN; };
      }
      if (nm === 'root' && args.length === 2) return (x, y) => { const v = args[0](x, y), k = args[1](x, y); return k === 0 ? NaN : rpow(v, 1 / k); };
      if (nm === 'mod' && args.length === 2) return (x, y) => { const m = args[1](x, y); return m === 0 ? NaN : ((args[0](x, y) % m) + m) % m; };
      if (nm === 'min') return (x, y) => Math.min(...args.map(f => f(x, y)));
      if (nm === 'max') return (x, y) => Math.max(...args.map(f => f(x, y)));
      if ((nm === 'ncr' || nm === 'npr') && args.length === 2) return (x, y) => { try { const a = args[0](x, y), b = args[1](x, y); return Number.isInteger(a) && Number.isInteger(b) ? Number(nm === 'ncr' ? combBig(a, b) : permBig(a, b)) : NaN; } catch (e) { return NaN; } };
      if ((nm === 'gcd' || nm === 'lcm') && args.length >= 2) return (x, y) => { const v = args.map(f => f(x, y)); return v.every(Number.isInteger) ? v.reduce((s, q) => nm === 'gcd' ? gcdNum(s, q) : lcmNum(s, q)) : NaN; };
      throw new Error(`${nm}() is not supported in graphs`);
    }
  }
  throw new Error('Unsupported expression');
}
function checkVars(ast, allowY) {
  for (const v of varsOf(ast)) {
    if (v === 'x' || (allowY && v === 'y')) continue;
    throw new Error(`Unknown variable "${v}". Graphs can use ${allowY ? 'x and y' : 'x'}`);
  }
}
function classifyEquation(text) {
  const raw = text.trim();
  if (!raw) return { empty: true };
  const s = normalizeInput(raw);
  if (/[<>]/.test(s)) throw new Error('Inequalities cannot be graphed; enter an equation');
  const parts = s.split('=');
  if (parts.length > 2) throw new Error('Use only one "=" sign');
  if (parts.length === 1) {
    const ast = parse(parts[0]);
    if (varsOf(ast).has('y')) throw new Error('Write an equation with "=", for example x^2 + y^2 = 25');
    checkVars(ast, false);
    const f = compileReal(ast);
    return { kind: 'explicit', fn: x => f(x, NaN), label: 'y = ' + raw };
  }
  const L = parts[0].trim().toLowerCase(), R = parts[1].trim();
  if (!L || !R) throw new Error('Both sides of the equation are needed');
  if (L === 'y' || /^[a-z]\(\s*x\s*\)$/.test(L)) {
    const ast = parse(R);
    if (!varsOf(ast).has('y')) { checkVars(ast, false); const f = compileReal(ast); return { kind: 'explicit', fn: x => f(x, NaN), label: raw }; }
  }
  const la = parse(parts[0]), ra = parse(parts[1]);
  if (L === 'x') {
    const vs = varsOf(ra);
    if (!vs.size) { const c = evalNumber(R); return { kind: 'vertical', c, label: raw }; }
  }
  const ast = { k: 'bin', op: '-', a: la, b: ra };
  checkVars(ast, true);
  const F = compileReal(ast);
  return { kind: 'implicit', fn: F, label: raw };
}
function makeFn(text) {
  const f = { id: G.nextId++, text: text || '', color: GCOLORS[(G.nextId - 2) % GCOLORS.length], visible: true, kind: null, err: '', fn: null, label: '' };
  compileFn(f);
  return f;
}
function compileFn(f) {
  f.err = ''; f.kind = null; f.fn = null; f.label = '';
  try { const c = classifyEquation(f.text); if (!c.empty) Object.assign(f, c); }
  catch (e) { f.err = e.message; }
}

/* ---------- view helpers ---------- */
const gpx = x => G.W / 2 + (x - G.cx) * G.sx;
const gpy = y => G.H / 2 - (y - G.cy) * G.sy;
const gwx = px => G.cx + (px - G.W / 2) / G.sx;
const gwy = py => G.cy - (py - G.H / 2) / G.sy;
function niceStep(raw) {
  const p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}
function fmtTick(v, step) {
  if (Math.abs(v) < step * 1e-9) return '0';
  if (Math.abs(v) >= 1e6 || Math.abs(v) < 1e-4) return v.toExponential(1).replace('e+', 'e').replace('.0e', 'e');
  const dec = Math.min(8, Math.max(0, Math.ceil(-Math.log10(step) - 1e-9)));
  return v.toFixed(dec);
}
function haloText(ctx, txt, x, y) {
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.strokeText(txt, x, y);
  ctx.fillStyle = '#41576f'; ctx.fillText(txt, x, y);
}
function drawGrid(ctx) {
  const { W, H } = G;
  const xmin = gwx(0), xmax = gwx(W), ymin = gwy(H), ymax = gwy(0);
  const stepX = niceStep(75 / G.sx), stepY = niceStep(60 / G.sy);
  const minorDiv = s => { const m = s / Math.pow(10, Math.floor(Math.log10(s))); return m === 2 ? 4 : 5; };
  const lines = (min, max, step, horiz, color, lw) => {
    const k0 = Math.ceil(min / step - 1e-9), k1 = Math.floor(max / step + 1e-9);
    if (k1 - k0 > 600) return;
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = lw;
    for (let k = k0; k <= k1; k++) {
      const v = k * step;
      if (horiz) { const y = Math.round(gpy(v)) + 0.5; ctx.moveTo(0, y); ctx.lineTo(W, y); }
      else { const x = Math.round(gpx(v)) + 0.5; ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    }
    ctx.stroke();
  };
  lines(xmin, xmax, stepX / minorDiv(stepX), false, '#f0f5fb', 1);
  lines(ymin, ymax, stepY / minorDiv(stepY), true, '#f0f5fb', 1);
  lines(xmin, xmax, stepX, false, '#d9e6f5', 1);
  lines(ymin, ymax, stepY, true, '#d9e6f5', 1);
  // axes
  const ax = gpx(0), ay = gpy(0);
  ctx.strokeStyle = '#3d5a80'; ctx.lineWidth = 1.5; ctx.beginPath();
  if (ay >= -1 && ay <= H + 1) { ctx.moveTo(0, Math.round(ay) + 0.5); ctx.lineTo(W, Math.round(ay) + 0.5); }
  if (ax >= -1 && ax <= W + 1) { ctx.moveTo(Math.round(ax) + 0.5, 0); ctx.lineTo(Math.round(ax) + 0.5, H); }
  ctx.stroke();
  // labels
  ctx.font = '12px ui-monospace, Menlo, Consolas, monospace';
  ctx.textBaseline = 'top'; ctx.textAlign = 'center';
  const labY = Math.min(Math.max(ay + 5, 4), H - 18);
  let k0 = Math.ceil(xmin / stepX), k1 = Math.floor(xmax / stepX);
  for (let k = k0; k <= k1 && k1 - k0 < 600; k++) {
    if (k === 0) continue;
    haloText(ctx, fmtTick(k * stepX, stepX), gpx(k * stepX), labY);
  }
  ctx.textAlign = ax < 40 ? 'left' : 'right'; ctx.textBaseline = 'middle';
  const labX = ax < 40 ? 6 : Math.min(ax - 6, W - 6);
  k0 = Math.ceil(ymin / stepY); k1 = Math.floor(ymax / stepY);
  for (let k = k0; k <= k1 && k1 - k0 < 600; k++) {
    if (k === 0) continue;
    haloText(ctx, fmtTick(k * stepY, stepY), labX, gpy(k * stepY));
  }
  if (ax >= 0 && ax <= W && ay >= 0 && ay <= H) { ctx.textAlign = 'right'; ctx.textBaseline = 'top'; haloText(ctx, '0', ax - 5, ay + 4); }
  ctx.font = 'italic 600 13px system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
  haloText(ctx, 'x', W - 8, Math.min(Math.max(ay - 6, 16), H - 24));
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  haloText(ctx, 'y', Math.min(Math.max(ax + 8, 8), W - 20), 6);
}
function drawExplicit(ctx, f) {
  const { W, H } = G;
  ctx.beginPath(); ctx.strokeStyle = f.color; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  let prev = null;
  for (let p = 0; p <= W; p += 1) {
    const y = f.fn(gwx(p));
    if (!Number.isFinite(y)) { prev = null; continue; }
    let py = gpy(y);
    py = Math.max(-1e5, Math.min(H + 1e5, py));
    if (prev !== null && Math.abs(py - prev) > H * 1.2) { ctx.moveTo(p, py); }
    else if (prev === null) ctx.moveTo(p, py); else ctx.lineTo(p, py);
    prev = py;
  }
  ctx.stroke();
}
function drawImplicit(ctx, f) {
  const { W, H } = G, S = 4;
  const nx = Math.ceil(W / S) + 1, ny = Math.ceil(H / S) + 1;
  const vals = new Float64Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) vals[j * nx + i] = f.fn(gwx(i * S), gwy(j * S));
  ctx.beginPath(); ctx.strokeStyle = f.color; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const v0 = vals[j * nx + i], v1 = vals[j * nx + i + 1], v2 = vals[(j + 1) * nx + i + 1], v3 = vals[(j + 1) * nx + i];
      if (!(Number.isFinite(v0) && Number.isFinite(v1) && Number.isFinite(v2) && Number.isFinite(v3))) continue;
      const idx = (v0 > 0 ? 1 : 0) | (v1 > 0 ? 2 : 0) | (v2 > 0 ? 4 : 0) | (v3 > 0 ? 8 : 0);
      if (idx === 0 || idx === 15) continue;
      const mx = Math.max(Math.abs(v0), Math.abs(v1), Math.abs(v2), Math.abs(v3));
      if (mx > 1e12) continue;
      const x0 = i * S, y0 = j * S, x1 = x0 + S, y1 = y0 + S;
      const E = [
        () => [x0 + S * v0 / (v0 - v1), y0], () => [x1, y0 + S * v1 / (v1 - v2)],
        () => [x0 + S * v3 / (v3 - v2), y1], () => [x0, y0 + S * v0 / (v0 - v3)],
      ];
      let segs;
      switch (idx) {
        case 1: case 14: segs = [[3, 0]]; break;
        case 2: case 13: segs = [[0, 1]]; break;
        case 3: case 12: segs = [[3, 1]]; break;
        case 4: case 11: segs = [[1, 2]]; break;
        case 6: case 9: segs = [[0, 2]]; break;
        case 7: case 8: segs = [[3, 2]]; break;
        case 5: case 10: {
          const c = (v0 + v1 + v2 + v3) / 4;
          const pos = idx === 5 ? c > 0 : c <= 0;
          segs = pos ? [[0, 1], [3, 2]] : [[3, 0], [1, 2]];
          if (idx === 10) segs = (c > 0) ? [[3, 0], [1, 2]] : [[0, 1], [3, 2]];
          break;
        }
      }
      for (const [a, b] of segs) { const p = E[a](), q = E[b](); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); }
    }
  }
  ctx.stroke();
}
function drawArrow(ctx, x1, y1, x2, y2, color) {
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1), L = 11;
  ctx.beginPath(); ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - L * Math.cos(a - 0.4), y2 - L * Math.sin(a - 0.4));
  ctx.lineTo(x2 - L * Math.cos(a + 0.4), y2 - L * Math.sin(a + 0.4));
  ctx.closePath(); ctx.fill();
}
function drawOverlay(ctx) {
  ctx.font = '600 12px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  for (const o of G.overlay) {
    if (o.type === 'seg') {
      ctx.strokeStyle = o.color; ctx.lineWidth = 2.2; ctx.setLineDash([7, 5]);
      ctx.beginPath(); ctx.moveTo(gpx(o.x1), gpy(o.y1)); ctx.lineTo(gpx(o.x2), gpy(o.y2)); ctx.stroke(); ctx.setLineDash([]);
    } else if (o.type === 'pt') {
      ctx.fillStyle = o.color; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(gpx(o.x), gpy(o.y), 5.5, 0, 6.2832); ctx.fill(); ctx.stroke();
      haloText(ctx, o.label, gpx(o.x) + 8, gpy(o.y) - 6);
    } else if (o.type === 'vec') {
      drawArrow(ctx, gpx(0), gpy(0), gpx(o.x), gpy(o.y), o.color);
      haloText(ctx, o.label, gpx(o.x) + 8, gpy(o.y) - 6);
    }
  }
}
function drawGraph() {
  const ctx = G.ctx;
  if (!ctx || !G.ready) return;
  const { W, H, dpr } = G;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  drawGrid(ctx);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  for (const f of G.fns) {
    if (!f.visible || f.err || !f.kind) continue;
    try {
      if (f.kind === 'explicit') drawExplicit(ctx, f);
      else if (f.kind === 'vertical') { const x = Math.round(gpx(f.c)) + 0.5; ctx.beginPath(); ctx.strokeStyle = f.color; ctx.lineWidth = 2.4; ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      else drawImplicit(ctx, f);
    } catch (e) { f.err = e.message; }
  }
  drawOverlay(ctx);
  if (G.hover) {
    const hx = G.hover.x;
    ctx.strokeStyle = 'rgba(21,101,230,.35)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(gpx(hx), 0); ctx.lineTo(gpx(hx), H); ctx.stroke(); ctx.setLineDash([]);
    for (const f of G.fns) {
      if (!f.visible || f.err || f.kind !== 'explicit') continue;
      const y = f.fn(hx);
      if (!Number.isFinite(y)) continue;
      const py = gpy(y);
      if (py < -20 || py > H + 20) continue;
      ctx.fillStyle = f.color; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(gpx(hx), py, 5, 0, 6.2832); ctx.fill(); ctx.stroke();
    }
  }
  ctx.restore();
  updateRangeInputs();
}
let gRaf = 0;
function scheduleDraw() { if (!gRaf) gRaf = requestAnimationFrame(() => { gRaf = 0; drawGraph(); }); }

function updateRangeInputs() {
  const set = (id, v) => { const el = document.getElementById(id); if (el && document.activeElement !== el) el.value = fmtNum(parseFloat(v.toPrecision(6)), 6); };
  set('gxmin', gwx(0)); set('gxmax', gwx(G.W)); set('gymin', gwy(G.H)); set('gymax', gwy(0));
}
function zoomAt(px, py, fx, fy) {
  const wx = gwx(px), wy = gwy(py);
  G.sx = Math.max(1e-6, Math.min(1e8, G.sx * fx));
  G.sy = Math.max(1e-6, Math.min(1e8, G.sy * fy));
  G.cx = wx - (px - G.W / 2) / G.sx;
  G.cy = wy + (py - G.H / 2) / G.sy;
}
function manualView() { G.auto = false; const c = document.getElementById('gauto'); if (c) c.checked = false; }
function resetView() {
  G.cx = 0; G.cy = 0; G.sx = Math.max(10, G.W / 20); G.sy = G.sx;
  scheduleDraw();
}
function autoScale() {
  const ys = [];
  const xmin = gwx(0), xmax = gwx(G.W);
  for (const f of G.fns) {
    if (!f.visible || f.err || f.kind !== 'explicit') continue;
    for (let i = 0; i <= 400; i++) {
      const y = f.fn(xmin + (xmax - xmin) * i / 400);
      if (Number.isFinite(y) && Math.abs(y) < 1e9) ys.push(y);
    }
  }
  const impl = G.fns.some(f => f.visible && !f.err && (f.kind === 'implicit' || f.kind === 'vertical'));
  if (ys.length < 5) {
    if (impl && !ys.length) { /* keep the current window for implicit curves */ }
    scheduleDraw(); return;
  }
  ys.sort((a, b) => a - b);
  let lo = ys[Math.floor(ys.length * 0.03)], hi = ys[Math.ceil(ys.length * 0.97) - 1];
  if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
  const span = hi - lo;
  if (lo > 0 && lo < span * 0.5) lo = 0 - span * 0.03;
  if (hi < 0 && -hi < span * 0.5) hi = span * 0.03;
  lo -= span * 0.12; hi += span * 0.12;
  G.cy = (lo + hi) / 2; G.sy = G.H / (hi - lo);
  scheduleDraw();
}
function equalAxes() { G.sy = G.sx; scheduleDraw(); }
function afterEdit() { if (G.auto) autoScale(); else scheduleDraw(); renderLegend(); }

/* ---------- DOM ---------- */
function renderLegend() {
  const box = document.getElementById('glegend');
  if (!box) return;
  box.innerHTML = '';
  G.fns.forEach(f => {
    if (!f.visible || f.err || !f.kind) return;
    box.append(h('div', null, h('span', { class: 'sw', style: { background: f.color } }), h('span', { class: 'mono' }, f.label)));
  });
  G.overlay.filter(o => o.type === 'pt' || o.type === 'vec').forEach(o => box.append(h('div', null, h('span', { class: 'sw', style: { background: o.color } }), h('span', { class: 'mono' }, o.legend || o.label))));
}
function renderFnList() {
  const list = document.getElementById('gfnList');
  list.innerHTML = '';
  G.fns.forEach((f, idx) => {
    const inp = h('input', { type: 'text', value: f.text, placeholder: 'e.g. y = x^2, sin(x), x^2 + y^2 = 25', spellcheck: 'false', 'aria-label': 'Function ' + (idx + 1), style: { flex: '1 1 auto', minWidth: 0 } });
    const errEl = h('div', { class: 'fnerr' }, f.err);
    errEl.style.display = f.err ? 'block' : 'none';
    let t = 0;
    inp.addEventListener('input', () => {
      f.text = inp.value;
      clearTimeout(t);
      t = setTimeout(() => { compileFn(f); errEl.textContent = f.err; errEl.style.display = f.err ? 'block' : 'none'; afterEdit(); }, 140);
    });
    inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { clearTimeout(t); compileFn(f); errEl.textContent = f.err; errEl.style.display = f.err ? 'block' : 'none'; afterEdit(); } });
    const col = h('input', { type: 'color', value: f.color, title: 'Colour', 'aria-label': 'Colour' });
    col.addEventListener('input', () => { f.color = col.value; renderLegend(); scheduleDraw(); });
    const vis = h('input', { type: 'checkbox', title: 'Show or hide', 'aria-label': 'Visible' });
    vis.checked = f.visible;
    vis.addEventListener('change', () => { f.visible = vis.checked; renderLegend(); scheduleDraw(); });
    const del = h('button', { class: 'x', type: 'button', title: 'Remove', 'aria-label': 'Remove function', onclick: () => { G.fns.splice(idx, 1); renderFnList(); afterEdit(); } }, '×');
    list.append(h('div', { class: 'fnrow' }, vis, col, inp, del), errEl);
  });
}
function addFunction(text, focus) {
  const f = makeFn(text);
  G.fns.push(f);
  renderFnList();
  afterEdit();
  if (focus) { const ins = $$('#gfnList input[type=text]'); if (ins.length) ins[ins.length - 1].focus(); }
}
function parseVec(text, label) {
  let s = text.trim().replace(/^[\(\[<]+|[\)\]>]+$/g, '');
  if (!s) throw new Error(`Enter ${label}`);
  return s.split(/[,;]+/).map(p => {
    if (!p.trim()) throw new Error(`${label} has an empty component`);
    try { return evalNumber(p); } catch (e) { throw new Error(`${label}: ${e.message}`); }
  });
}
function buildGraph() {
  const root = $('#panel-graph');
  root.innerHTML = `
  <div class="graph-grid">
    <div class="side">
      <div class="card">
        <h3>Functions &amp; equations</h3>
        <div id="gfnList"></div>
        <div class="row" style="margin:8px 0 4px">
          <button class="btn primary" id="gadd" type="button">+ Add function</button>
          <div class="seg" id="gangle" title="Angle unit for trig functions"><button type="button" data-a="rad" class="on">RAD</button><button type="button" data-a="deg">DEG</button></div>
        </div>
        <div class="chips" id="gex" style="margin-top:8px">${['x^2', 'sin(x)', 'x^3 - 3x', 'tan(x)', '1/x', 'ln(x)', 'abs(x)', 'sqrt(x)', 'x^2 + y^2 = 25', 'x^2/9 + y^2/4 = 1', 'x = 2'].map(s => `<button type="button" data-ex="${esc(s)}">${esc(s)}</button>`).join('')}</div>
        <div class="small muted">Accepts <span class="mono">y = f(x)</span>, <span class="mono">f(x)</span>, vertical lines <span class="mono">x = c</span> and implicit equations such as circles.</div>
      </div>
      <div class="card" style="margin-top:14px">
        <h3>Distance between two points</h3>
        <div class="small muted">Enter 2D or 3D points: x, y or x, y, z</div>
        <label class="lab">Point P₁</label><input type="text" id="gp1" value="1, 2">
        <label class="lab">Point P₂</label><input type="text" id="gp2" value="4, 6">
        <div class="row" style="margin-top:8px"><button class="btn primary" id="gdist" type="button">Distance</button><button class="btn" id="gdistPlot" type="button">Plot on graph</button></div>
        <div class="out" id="gdOut"></div>
      </div>
      <div class="card" style="margin-top:14px">
        <h3>Angle between two vectors</h3>
        <div class="small muted">Cosine of the angle: cos θ = u·v / (|u||v|)</div>
        <label class="lab">Vector u</label><input type="text" id="gu" value="1, 2, 3">
        <label class="lab">Vector v</label><input type="text" id="gv" value="4, 5, 6">
        <div class="row" style="margin-top:8px"><button class="btn primary" id="gcos" type="button">Cosine of angle</button><button class="btn" id="gvecPlot" type="button">Plot (2D)</button></div>
        <div class="out" id="gcOut"></div>
      </div>
    </div>
    <div class="canvas-col">
      <div class="canvas-wrap" id="gwrap">
        <canvas id="gcanvas" aria-label="Graph of the entered functions"></canvas>
        <div class="glegend" id="glegend"></div>
        <div class="gtools">
          <button type="button" id="gzin" title="Zoom in" aria-label="Zoom in">+</button>
          <button type="button" id="gzout" title="Zoom out" aria-label="Zoom out">−</button>
          <button type="button" id="gauto2" title="Auto-scale to fit the curves" aria-label="Auto-scale" style="font-size:13px">Fit</button>
          <button type="button" id="geq" title="Equal axes (1:1)" aria-label="Equal axes" style="font-size:12px">1:1</button>
          <button type="button" id="ghome" title="Reset view" aria-label="Reset view">⌂</button>
        </div>
      </div>
      <div class="readout" id="greadout">Drag to pan, scroll or pinch to zoom (Shift = x only, Alt = y only).</div>
      <div class="card">
        <div class="row">
          <label class="small muted" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="gauto" checked style="accent-color:var(--b600)"> Auto-scale when equations change</label>
          <span style="flex:1"></span>
          <button class="btn sm" id="gclearOv" type="button">Clear points &amp; vectors</button>
          <button class="btn sm" id="gpng" type="button">Save PNG</button>
        </div>
        <div class="formrow" style="margin-top:8px">
          <div><label class="lab">x min</label><input type="text" id="gxmin"></div>
          <div><label class="lab">x max</label><input type="text" id="gxmax"></div>
          <div><label class="lab">y min</label><input type="text" id="gymin"></div>
          <div><label class="lab">y max</label><input type="text" id="gymax"></div>
          <div style="align-self:end"><button class="btn mid" id="grange" type="button" style="width:100%">Apply window</button></div>
        </div>
        <div class="err" id="grangeErr" style="margin-top:6px"></div>
      </div>
    </div>
  </div>`;
  const cv = $('#gcanvas'), wrap = $('#gwrap');
  G.ctx = cv.getContext('2d');
  function resizeCanvas() {
    const r = wrap.getBoundingClientRect();
    const W = Math.max(50, Math.round(r.width)), H = Math.max(50, Math.round(cv.getBoundingClientRect().height || 560));
    if (W === G.W && H === G.H && G.ready && cv.width === Math.round(W * (window.devicePixelRatio || 1))) return;
    G.dpr = Math.min(3, window.devicePixelRatio || 1);
    G.W = W; G.H = H;
    cv.width = Math.round(W * G.dpr); cv.height = Math.round(H * G.dpr);
    G.ready = true;
    scheduleDraw();
  }
  G.resize = resizeCanvas;
  if (window.ResizeObserver) new ResizeObserver(() => { if (wrap.offsetParent !== null) resizeCanvas(); }).observe(wrap);
  window.addEventListener('resize', () => { if (wrap.offsetParent !== null) resizeCanvas(); });

  /* pointer interaction */
  const ptrs = new Map();
  let lastPinch = 0;
  const local = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.addEventListener('pointerdown', e => {
    cv.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, local(e));
    cv.classList.add('dragging');
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; lastPinch = Math.hypot(a[0] - b[0], a[1] - b[1]); }
    G.hover = null;
  });
  cv.addEventListener('pointermove', e => {
    const p = local(e);
    if (ptrs.has(e.pointerId)) {
      const old = ptrs.get(e.pointerId);
      ptrs.set(e.pointerId, p);
      if (ptrs.size === 1) {
        manualView();
        G.cx -= (p[0] - old[0]) / G.sx; G.cy += (p[1] - old[1]) / G.sy;
        scheduleDraw();
      } else if (ptrs.size === 2) {
        manualView();
        const [a, b] = [...ptrs.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (lastPinch > 0 && d > 0) { const f = d / lastPinch; zoomAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, f, f); scheduleDraw(); }
        lastPinch = d;
      }
    } else {
      G.hover = { x: gwx(p[0]) };
      const parts = [`x = ${fmtNum(parseFloat(gwx(p[0]).toPrecision(6)), 6)}`, `y = ${fmtNum(parseFloat(gwy(p[1]).toPrecision(6)), 6)}`];
      G.fns.forEach((f, i) => { if (f.visible && !f.err && f.kind === 'explicit') { const y = f.fn(gwx(p[0])); parts.push(`f${i + 1}(x) = ${Number.isFinite(y) ? fmtNum(parseFloat(y.toPrecision(6)), 6) : 'undefined'}`); } });
      $('#greadout').textContent = parts.join('   ');
      scheduleDraw();
    }
  });
  const endPtr = e => { ptrs.delete(e.pointerId); lastPinch = 0; if (!ptrs.size) cv.classList.remove('dragging'); };
  cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', endPtr);
  cv.addEventListener('pointerleave', () => { if (!ptrs.size) { G.hover = null; scheduleDraw(); } });
  cv.addEventListener('wheel', e => {
    e.preventDefault();
    manualView();
    const p = local(e), f = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015));
    zoomAt(p[0], p[1], e.altKey ? 1 : f, e.shiftKey ? 1 : f);
    scheduleDraw();
  }, { passive: false });
  $('#gzin').addEventListener('click', () => { manualView(); zoomAt(G.W / 2, G.H / 2, 1.5, 1.5); scheduleDraw(); });
  $('#gzout').addEventListener('click', () => { manualView(); zoomAt(G.W / 2, G.H / 2, 1 / 1.5, 1 / 1.5); scheduleDraw(); });
  $('#gauto2').addEventListener('click', () => { G.auto = true; $('#gauto').checked = true; autoScale(); });
  $('#geq').addEventListener('click', () => { manualView(); equalAxes(); });
  $('#ghome').addEventListener('click', () => { resetView(); if (G.auto) autoScale(); });
  $('#gauto').addEventListener('change', e => { G.auto = e.target.checked; if (G.auto) autoScale(); });
  $('#grange').addEventListener('click', () => {
    const err = $('#grangeErr'); err.textContent = '';
    try {
      const v = ['gxmin', 'gxmax', 'gymin', 'gymax'].map((id, i) => { const t = document.getElementById(id).value.trim(); try { return evalNumber(t); } catch (e) { throw new Error(`${['x min', 'x max', 'y min', 'y max'][i]}: ${e.message}`); } });
      if (!(v[0] < v[1])) throw new Error('x min must be smaller than x max');
      if (!(v[2] < v[3])) throw new Error('y min must be smaller than y max');
      manualView();
      G.sx = G.W / (v[1] - v[0]); G.sy = G.H / (v[3] - v[2]);
      G.cx = (v[0] + v[1]) / 2; G.cy = (v[2] + v[3]) / 2;
      scheduleDraw();
    } catch (e) { err.textContent = e.message; }
  });
  $('#gadd').addEventListener('click', () => addFunction('', true));
  $$('#gangle button').forEach(b => b.addEventListener('click', () => {
    G.deg = b.dataset.a === 'deg';
    $$('#gangle button').forEach(x => x.classList.toggle('on', x === b));
    afterEdit();
  }));
  $$('#gex button').forEach(b => b.addEventListener('click', () => {
    const empty = G.fns.find(f => !f.text.trim());
    if (empty) { empty.text = b.dataset.ex; compileFn(empty); renderFnList(); afterEdit(); }
    else addFunction(b.dataset.ex, false);
  }));
  $('#gclearOv').addEventListener('click', () => { G.overlay = []; renderLegend(); scheduleDraw(); });
  $('#gpng').addEventListener('click', () => {
    try {
      drawGraph();
      const a = document.createElement('a');
      a.download = 'graph.png'; a.href = cv.toDataURL('image/png');
      document.body.append(a); a.click(); a.remove();
    } catch (e) { $('#grangeErr').textContent = 'Could not export the image: ' + e.message; }
  });

  /* geometry tools */
  function distance() {
    const out = $('#gdOut');
    try {
      const p = parseVec($('#gp1').value, 'P₁'), q = parseVec($('#gp2').value, 'P₂');
      if (p.length !== q.length) throw new Error(`The points must have the same dimension (P₁ has ${p.length} coordinates, P₂ has ${q.length})`);
      if (p.length < 1 || p.length > 6) throw new Error('Use between 1 and 6 coordinates');
      const diffs = p.map((v, i) => q[i] - v);
      const sumSq = diffs.reduce((s, d) => s + d * d, 0), d = Math.sqrt(sumSq);
      const names = ['x', 'y', 'z', 'w', 'v', 'u'];
      let html = rl2('Distance d', fmtNum(d, 12), true);
      html += rl2('Formula', 'd = √(' + diffs.map((_, i) => `(${names[i]}₂ − ${names[i]}₁)²`).join(' + ') + ')');
      html += rl2('Substituted', 'd = √(' + diffs.map(x => `(${fmtNum(x, 8)})²`).join(' + ') + ') = √' + fmtNum(sumSq, 10));
      const sq = closedFormHint(d);
      if (sq && /√/.test(sq)) html += rl2('Exact form', sq);
      html += rl2('Midpoint', '(' + p.map((v, i) => fmtNum((v + q[i]) / 2, 8)).join(', ') + ')');
      if (p.length === 2) html += rl2('Slope', diffs[0] === 0 ? 'undefined (vertical line)' : fmtNum(diffs[1] / diffs[0], 10));
      out.innerHTML = html;
      return { p, q, d };
    } catch (e) { out.innerHTML = errBox2(e.message); return null; }
  }
  function rl2(k, v, big) { return `<div class="rl"><span class="k">${esc(k)}</span><span class="v ${big ? 'big' : ''}">${esc(v)}</span></div>`; }
  function errBox2(m) { return `<div class="err">${esc(m)}</div>`; }
  $('#gdist').addEventListener('click', distance);
  $('#gdistPlot').addEventListener('click', () => {
    const r = distance();
    if (!r) return;
    if (r.p.length !== 2) { $('#gdOut').insertAdjacentHTML('beforeend', errBox2('Only 2D points can be plotted on the graph.')); return; }
    G.overlay = G.overlay.filter(o => !o.tag || o.tag !== 'dist');
    G.overlay.push({ type: 'seg', tag: 'dist', x1: r.p[0], y1: r.p[1], x2: r.q[0], y2: r.q[1], color: '#c2185b' });
    G.overlay.push({ type: 'pt', tag: 'dist', x: r.p[0], y: r.p[1], label: `P₁(${fmtNum(r.p[0], 4)}, ${fmtNum(r.p[1], 4)})`, legend: `P₁–P₂ distance ${fmtNum(r.d, 6)}`, color: '#c2185b' });
    G.overlay.push({ type: 'pt', tag: 'dist', x: r.q[0], y: r.q[1], label: `P₂(${fmtNum(r.q[0], 4)}, ${fmtNum(r.q[1], 4)})`, color: '#c2185b' });
    G.overlay[G.overlay.length - 1].legend = null;
    renderLegend();
    // fit both points into view if needed
    const m = 0.2, xs = [r.p[0], r.q[0]], ys = [r.p[1], r.q[1]];
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    if (x0 < gwx(0) || x1 > gwx(G.W) || y0 < gwy(G.H) || y1 > gwy(0)) {
      const dx = Math.max(x1 - x0, 1) * (1 + m * 2), dy = Math.max(y1 - y0, 1) * (1 + m * 2);
      const s = Math.min(G.W / dx, G.H / dy);
      manualView(); G.sx = G.sy = s; G.cx = (x0 + x1) / 2; G.cy = (y0 + y1) / 2;
    }
    scheduleDraw();
  });
  function cosine() {
    const out = $('#gcOut');
    try {
      const u = parseVec($('#gu').value, 'Vector u'), v = parseVec($('#gv').value, 'Vector v');
      if (u.length !== v.length) throw new Error(`The vectors must have the same dimension (u has ${u.length} components, v has ${v.length})`);
      if (u.length > 6) throw new Error('Use at most 6 components');
      const dot = u.reduce((s, a, i) => s + a * v[i], 0);
      const nu = Math.sqrt(u.reduce((s, a) => s + a * a, 0)), nv = Math.sqrt(v.reduce((s, a) => s + a * a, 0));
      if (nu === 0 || nv === 0) throw new Error('The angle is undefined because one of the vectors is the zero vector');
      let c = dot / (nu * nv);
      c = Math.max(-1, Math.min(1, c));
      const th = Math.acos(c);
      let html = rl2('cos θ', fmtNum(c, 12), true);
      html += rl2('u · v', fmtNum(dot, 12)) + rl2('|u|', fmtNum(nu, 12)) + rl2('|v|', fmtNum(nv, 12));
      html += rl2('θ', `${fmtNum(th, 10)} rad = ${fmtNum(th * 180 / Math.PI, 10)}°`);
      html += rl2('Relation', Math.abs(c) < 1e-12 ? 'perpendicular (orthogonal)' : Math.abs(c - 1) < 1e-12 ? 'same direction (parallel)' : Math.abs(c + 1) < 1e-12 ? 'opposite directions (anti-parallel)' : c > 0 ? 'acute angle' : 'obtuse angle');
      out.innerHTML = html;
      return { u, v };
    } catch (e) { out.innerHTML = errBox2(e.message); return null; }
  }
  $('#gcos').addEventListener('click', cosine);
  $('#gvecPlot').addEventListener('click', () => {
    const r = cosine();
    if (!r) return;
    if (r.u.length !== 2) { $('#gcOut').insertAdjacentHTML('beforeend', errBox2('Only 2D vectors can be plotted on the graph.')); return; }
    G.overlay = G.overlay.filter(o => o.tag !== 'vec');
    G.overlay.push({ type: 'vec', tag: 'vec', x: r.u[0], y: r.u[1], label: `u(${fmtNum(r.u[0], 4)}, ${fmtNum(r.u[1], 4)})`, legend: 'vector u', color: '#1565e6' });
    G.overlay.push({ type: 'vec', tag: 'vec', x: r.v[0], y: r.v[1], label: `v(${fmtNum(r.v[0], 4)}, ${fmtNum(r.v[1], 4)})`, legend: 'vector v', color: '#e0492f' });
    renderLegend();
    const m = Math.max(Math.abs(r.u[0]), Math.abs(r.u[1]), Math.abs(r.v[0]), Math.abs(r.v[1]), 1) * 1.4;
    if (m > Math.min(gwx(G.W), -gwx(0), gwy(0), -gwy(G.H))) { manualView(); G.sx = G.sy = Math.min(G.W, G.H) / (2 * m); G.cx = 0; G.cy = 0; }
    scheduleDraw();
  });
  enterGraph(['gp1', 'gp2'], 'gdist'); enterGraph(['gu', 'gv'], 'gcos');
  function enterGraph(ids, btn) { ids.forEach(i => document.getElementById(i).addEventListener('keydown', ev => { if (ev.key === 'Enter') document.getElementById(btn).click(); })); }

  ['sin(x)', 'x^2 / 4'].forEach(t => G.fns.push(makeFn(t)));
  renderFnList(); renderLegend();
  G.sx = G.sy = 45;
  resizeCanvas();
  if (G.auto) autoScale();
}
