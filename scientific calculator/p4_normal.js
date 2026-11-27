
/* =====================================================================
   10. Normal calculator tab
   ===================================================================== */
function bgcd(a, b) { if (a < 0n) a = -a; if (b < 0n) b = -b; while (b) { const t = a % b; a = b; b = t; } return a; }
function ratEval(n) {
  const NR = new Error('not rational');
  const norm = (p, q) => { if (q < 0n) { p = -p; q = -q; } const g = bgcd(p, q) || 1n; return [p / g, q / g]; };
  switch (n.k) {
    case 'num': { const f = toFrac(n.v, 1e9, 1e-14); if (!f) throw NR; return norm(BigInt(f[0]), BigInt(f[1])); }
    case 'neg': { const [p, q] = ratEval(n.a); return [-p, q]; }
    case 'bin': {
      const [p1, q1] = ratEval(n.a), [p2, q2] = ratEval(n.b);
      if (n.op === '+') return norm(p1 * q2 + p2 * q1, q1 * q2);
      if (n.op === '-') return norm(p1 * q2 - p2 * q1, q1 * q2);
      if (n.op === '*') return norm(p1 * p2, q1 * q2);
      if (n.op === '/') { if (p2 === 0n) throw new Error('Division by zero'); return norm(p1 * q2, q1 * p2); }
      if (n.op === '^') {
        if (q2 !== 1n || p2 > 1000n || p2 < -1000n) throw NR;
        if (p1 === 0n && p2 <= 0n) throw NR;
        const e = p2 < 0n ? -p2 : p2;
        const a = p1 ** e, b = q1 ** e;
        return p2 < 0n ? norm(b, a) : norm(a, b);
      }
      throw NR;
    }
    default: throw NR;
  }
}
function exactFractionText(ast) {
  try {
    const [p, q] = ratEval(ast);
    if (q === 1n) return null;
    const ps = p.toString(), qs = q.toString();
    if (ps.length > 28 || qs.length > 28) return null;
    let s = `${ps}/${qs}`;
    const ap = p < 0n ? -p : p;
    if (ap > q) { const w = p / q, r = (ap % q); s += `  =  ${w} ${r}/${qs}`; }
    return s;
  } catch (e) { return null; }
}
function primeFactors(n) {
  const out = [];
  for (let p = 2; p * p <= n && p < 1e6 + 1; p++) while (n % p === 0) { out.push(p); n /= p; }
  if (n > 1) out.push(n);
  return out;
}
function factorText(n) {
  if (!Number.isInteger(n) || Math.abs(n) > 1e12) return 'too large to factor here';
  if (n === 0) return '0';
  const f = primeFactors(Math.abs(n)), m = new Map();
  f.forEach(p => m.set(p, (m.get(p) || 0) + 1));
  const s = [...m].map(([p, e]) => e > 1 ? `${p}^${e}` : `${p}`).join(' × ');
  return (n < 0 ? '-1 × ' : '') + (s || '1');
}
const sup = { a: 'ᵃ' };
function polarText(z, deg) {
  const r = cabs(z), th = carg(z);
  const thr = fmtNum(th, 10), thd = fmtNum(th * 180 / Math.PI, 10);
  return { r, th, text: `${fmtNum(r, 10)} ∠ ${thr} rad (${thd}°)` };
}

function buildNormal() {
  const root = $('#panel-normal');
  root.innerHTML = `
  <div class="normal-grid">
    <div class="card">
      <div class="display">
        <div class="row" style="justify-content:space-between"><span class="small muted" id="angleBadge">RAD</span><span class="small muted">Enter or = to calculate</span></div>
        <input type="text" id="expr" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Expression" placeholder="e.g. (3+4i)*(2-i), sin(30), 3/4+5/6">
        <div id="result" aria-live="polite"></div>
        <div id="resultExtra"></div>
      </div>
      <div id="stepsBox"></div>
      <div class="keypad" id="keypad"></div>
      <div class="history" id="history"></div>
    </div>
    <div class="card">
      <h3>Tools</h3>
      <div class="chips" id="toolChips"></div>
      <div id="toolPanes"></div>
    </div>
  </div>`;

  /* ----- keypad ----- */
  const expr = $('#expr'), resEl = $('#result'), extraEl = $('#resultExtra'), stepsBox = $('#stepsBox');
  const KEYS = [
    { t: 'RAD', a: 'mode', c: 'k-ctl' }, { t: '(', i: '(', c: 'k-op' }, { t: ')', i: ')', c: 'k-op' }, { t: '⌫', a: 'bs', c: 'k-ctl' }, { t: 'AC', a: 'ac', c: 'k-ctl' },
    { t: 'sin', i: 'sin(', c: 'k-fn' }, { t: 'cos', i: 'cos(', c: 'k-fn' }, { t: 'tan', i: 'tan(', c: 'k-fn' }, { t: 'π', i: 'π', c: 'k-fn' }, { t: 'e', i: 'e', c: 'k-fn', mul: true },
    { t: 'sin⁻¹', i: 'asin(', c: 'k-fn' }, { t: 'cos⁻¹', i: 'acos(', c: 'k-fn' }, { t: 'tan⁻¹', i: 'atan(', c: 'k-fn' }, { t: 'i', i: 'i', c: 'k-fn' }, { t: 'Ans', i: 'ans', c: 'k-fn' },
    { t: 'ln', i: 'ln(', c: 'k-fn' }, { t: 'log', i: 'log(', c: 'k-fn' }, { t: '√', i: 'sqrt(', c: 'k-fn' }, { t: 'x²', i: '^2', c: 'k-fn', op: true }, { t: 'xʸ', i: '^', c: 'k-fn', op: true },
    { t: 'x!', i: '!', c: 'k-fn', op: true }, { t: '|x|', i: 'abs(', c: 'k-fn' }, { t: 'ⁿ√', i: 'root(', c: 'k-fn' }, { t: 'nCr', i: 'nCr(', c: 'k-fn' }, { t: 'nPr', i: 'nPr(', c: 'k-fn' },
    { t: '7', i: '7', c: 'k-num' }, { t: '8', i: '8', c: 'k-num' }, { t: '9', i: '9', c: 'k-num' }, { t: '÷', i: '÷', c: 'k-op', op: true }, { t: '×', i: '×', c: 'k-op', op: true },
    { t: '4', i: '4', c: 'k-num' }, { t: '5', i: '5', c: 'k-num' }, { t: '6', i: '6', c: 'k-num' }, { t: '−', i: '-', c: 'k-op', op: true }, { t: '+', i: '+', c: 'k-op', op: true },
    { t: '1', i: '1', c: 'k-num' }, { t: '2', i: '2', c: 'k-num' }, { t: '3', i: '3', c: 'k-num' }, { t: ',', i: ',', c: 'k-op' }, { t: '=', a: 'eq', c: 'k-eq' },
    { t: '0', i: '0', c: 'k-num' }, { t: '.', i: '.', c: 'k-num' }, { t: '×10ˣ', i: '×10^', c: 'k-op', op: true }, { t: '%', i: '/100', c: 'k-op', op: true },
  ];
  let justEvaluated = false;
  const kp = $('#keypad');
  KEYS.forEach(k => {
    const b = h('button', { class: 'key ' + k.c, type: 'button', 'data-act': k.a || '', 'aria-label': k.t }, k.t);
    b.addEventListener('click', () => pressKey(k, b));
    kp.append(b);
  });
  const modeBtn = $('.key[data-act="mode"]');
  function refreshMode() { const m = STATE.deg ? 'DEG' : 'RAD'; modeBtn.textContent = m; $('#angleBadge').textContent = m + ' mode'; }
  refreshMode();
  function insertText(t, back) {
    const s = expr.selectionStart == null ? expr.value.length : expr.selectionStart;
    const e = expr.selectionEnd == null ? s : expr.selectionEnd;
    expr.value = expr.value.slice(0, s) + t + expr.value.slice(e);
    const pos = s + t.length - (back || 0);
    if (!matchMedia('(pointer:coarse)').matches) expr.focus({ preventScroll: true });
    try { expr.setSelectionRange(pos, pos); } catch (err) { /* ignore */ }
  }
  function pressKey(k) {
    if (k.a === 'mode') { STATE.deg = !STATE.deg; refreshMode(); return; }
    if (k.a === 'ac') { expr.value = ''; resEl.textContent = ''; extraEl.textContent = ''; extraEl.className = ''; stepsBox.innerHTML = ''; justEvaluated = false; if (!matchMedia('(pointer:coarse)').matches) expr.focus(); return; }
    if (k.a === 'bs') {
      justEvaluated = false;
      const s = expr.selectionStart, e = expr.selectionEnd;
      if (s !== e) { expr.value = expr.value.slice(0, s) + expr.value.slice(e); expr.setSelectionRange(s, s); }
      else if (s > 0) { expr.value = expr.value.slice(0, s - 1) + expr.value.slice(s); expr.setSelectionRange(s - 1, s - 1); }
      return;
    }
    if (k.a === 'eq') { doEquals(); return; }
    if (justEvaluated) {
      if (k.op) expr.value = 'ans'; else expr.value = '';
      justEvaluated = false;
    }
    let text = k.i;
    if (k.mul) { const s = expr.selectionStart || 0; if (/[\d.)]$/.test(expr.value.slice(0, s))) text = '×' + text; }
    insertText(text);
  }
  expr.addEventListener('input', () => { justEvaluated = false; });
  expr.addEventListener('keydown', ev => {
    if (ev.key === 'Enter') { ev.preventDefault(); doEquals(); }
    else if (ev.key === 'Escape') pressKey({ a: 'ac' });
  });

  const history = [];
  function renderHistory() {
    const box = $('#history');
    box.innerHTML = '';
    if (!history.length) { box.append(h('div', { class: 'muted small', style: { cursor: 'default' } }, 'History appears here. Click an entry to reuse it.')); return; }
    history.slice().reverse().slice(0, 30).forEach(it => {
      box.append(h('div', { title: 'Click to reuse', onclick: () => { expr.value = it.e; justEvaluated = false; } }, h('span', null, it.e), h('span', { class: 'hr' }, '= ' + it.r)));
    });
  }
  renderHistory();

  function showError(msg) {
    resEl.textContent = '';
    extraEl.className = 'err';
    extraEl.textContent = msg;
    stepsBox.innerHTML = '';
  }
  function doEquals() {
    const text = expr.value.trim();
    if (!text) return;
    extraEl.className = '';
    try {
      const norm = normalizeInput(text);
      if (/[<>]/.test(norm)) { goTool('ineq', text); return; }
      if (/=/.test(norm)) { goTool('eq', text); return; }
      const { z, trace, ast } = evaluateExpression(text);
      const c = cleanC(z);
      STATE.ans = c;
      let main, extra = '';
      if (c.im === 0) {
        main = fmtNum(c.re, 12);
        const ex = exactFractionText(ast);
        if (ex) extra = '= ' + ex;
        else if (!Number.isFinite(c.re)) extra = '';
      } else {
        main = fmtC(c, 12);
        const pt = polarText(c);
        extra = `|z| = ${fmtNum(pt.r, 10)},  arg = ${fmtNum(pt.th, 8)} rad (${fmtNum(pt.th * 180 / Math.PI, 8)}°)`;
      }
      resEl.textContent = main;
      extraEl.textContent = extra;
      history.push({ e: text, r: main });
      renderHistory();
      justEvaluated = true;
      const seen = new Set(), items = [];
      trace.forEach(t => { if (t.e !== t.v && !seen.has(t.e)) { seen.add(t.e); items.push(t); } });
      stepsBox.innerHTML = '';
      if (items.length > 1) {
        const ol = h('ol', null, items.slice(0, 60).map(t => h('li', null, `${t.e}  =  ${t.v}`)));
        stepsBox.append(h('details', { class: 'steps' }, h('summary', null, 'Show evaluation steps'), ol));
      }
    } catch (err) {
      showError(err.message || String(err));
    }
  }

  /* ----- tools ----- */
  const TOOLS = [
    ['eq', 'Equations'], ['ineq', 'Inequalities'], ['cx', 'Complex'], ['calc', 'Calculus'],
    ['nt', 'GCD / LCM / nPr / nCr'], ['prob', 'Probability'], ['frac', 'Fractions'],
  ];
  const chips = $('#toolChips'), panes = $('#toolPanes');
  const paneEls = {};
  TOOLS.forEach(([id, label]) => {
    const b = h('button', { type: 'button', 'data-tool': id }, label);
    b.addEventListener('click', () => selectTool(id));
    chips.append(b);
    const p = h('div', { id: 'tool-' + id, style: { display: 'none' } });
    panes.append(p);
    paneEls[id] = p;
  });
  function selectTool(id) {
    $$('#toolChips button').forEach(b => b.classList.toggle('on', b.dataset.tool === id));
    Object.keys(paneEls).forEach(k => { paneEls[k].style.display = k === id ? 'block' : 'none'; });
  }
  function goTool(id, text) {
    selectTool(id);
    const inp = $('#tool-' + id + ' input[type=text]');
    if (inp && text) inp.value = text;
    const btn = $('#tool-' + id + ' .btn.primary');
    if (btn) btn.click();
  }
  const lab = (t) => `<label class="lab">${t}</label>`;
  const exChips = (id, list) => `<div class="chips" id="${id}">${list.map(s => `<button type="button" data-ex="${esc(s)}">${esc(s)}</button>`).join('')}</div>`;
  const rl = (k, v, extraCls) => `<div class="rl"><span class="k">${k}</span><span class="v ${extraCls || ''}">${v}</span></div>`;
  const errBox = m => `<div class="err">${esc(m)}</div>`;
  function numField(id, what) {
    const el = document.getElementById(id);
    const t = el.value.trim();
    if (!t) throw new Error(`Enter a value for ${what}`);
    try { return evalNumber(t); } catch (e) { throw new Error(`${what}: ${e.message}`); }
  }
  function intField(id, what) {
    const x = numField(id, what);
    if (!Number.isInteger(x)) throw new Error(`${what} must be a whole number`);
    return x;
  }
  function wireEx(boxId, inputId, runBtnId) {
    $$('#' + boxId + ' button').forEach(b => b.addEventListener('click', () => { document.getElementById(inputId).value = b.dataset.ex; document.getElementById(runBtnId).click(); }));
  }
  function enterRuns(inputIds, btnId) {
    inputIds.forEach(i => document.getElementById(i).addEventListener('keydown', ev => { if (ev.key === 'Enter') document.getElementById(btnId).click(); }));
  }

  /* --- equations --- */
  paneEls.eq.innerHTML = `
    ${lab('Equation in one variable (linear, quadratic, cubic or higher)')}
    <div class="row"><input type="text" id="eqIn" class="grow" value="x^2 - 5x + 6 = 0" spellcheck="false"><button class="btn primary" id="eqGo" type="button">Solve</button></div>
    ${exChips('eqEx', ['2x + 3 = 7', 'x^2 - 5x + 6 = 0', 'x^2 + 2x + 5 = 0', '2x^2 - 4x - 3 = 0', 'x^3 - 6x^2 + 11x - 6 = 0', 'x^3 - 1 = 0', 'x^4 - 1 = 0'])}
    <details class="steps"><summary>Solve from coefficients</summary>
      <div class="row" style="margin-top:8px"><span class="small muted">Degree</span>
        <select id="coefDeg" style="width:auto"><option value="1">Linear</option><option value="2" selected>Quadratic</option><option value="3">Cubic</option></select></div>
      <div class="formrow" id="coefRow"></div>
      <div class="row" style="margin-top:8px"><button class="btn" id="coefGo" type="button">Solve coefficients</button></div>
    </details>
    <div class="out" id="eqOut"></div>`;
  function coefInputs() {
    const d = +$('#coefDeg').value, names = ['a', 'b', 'c', 'd'].slice(0, d + 1);
    const vals = { a: '1', b: '-3', c: '2', d: '1' };
    $('#coefRow').innerHTML = names.map(n => `<div>${lab(n + (d === 1 ? (n === 'a' ? ' (x)' : ' (const)') : ''))}<input type="text" data-coef="${n}" value="${vals[n]}"></div>`).join('');
  }
  $('#coefDeg').addEventListener('change', coefInputs); coefInputs();
  function solveEqUI(str) {
    const out = $('#eqOut');
    try {
      const res = solveEquation(str);
      let html = '';
      if (res.kind === 'identity' || res.kind === 'contradiction') {
        html = `<div class="big">${res.kind === 'identity' ? 'Infinitely many solutions' : 'No solution'}</div><div class="small muted">${esc(res.note)}</div>`;
      } else {
        const real = res.roots.filter(z => z.im === 0).length;
        html += rl('Type', `${res.kind} (degree ${res.deg})`);
        html += rl('Standard form', esc(res.standard));
        html += res.roots.map((z, i) => rl(`${esc(res.v)}<sub>${i + 1}</sub>`, esc(rootText(z)), 'big')).join('');
        html += rl('Roots', `${real} real, ${res.roots.length - real} complex`);
        if (res.exact) html += rl('Exact form', esc(res.exact));
        html += `<details class="steps"><summary>Show method</summary><ol>${res.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol></details>`;
      }
      out.innerHTML = html;
    } catch (e) { out.innerHTML = errBox(e.message); }
  }
  $('#eqGo').addEventListener('click', () => solveEqUI($('#eqIn').value));
  $('#coefGo').addEventListener('click', () => {
    try {
      const d = +$('#coefDeg').value, vals = $$('#coefRow input').map(i => {
        const t = i.value.trim() || '0';
        return `(${t})`;
      });
      const terms = vals.map((c, i) => d - i === 0 ? c : `${c}*x${d - i > 1 ? '^' + (d - i) : ''}`);
      const eqs = terms.join(' + ') + ' = 0';
      if (vals[0] === '(0)') throw new Error('The leading coefficient a must not be 0');
      $('#eqIn').value = eqs.replace(/\(([^()]*)\)\*/g, '($1)');
      solveEqUI(eqs);
    } catch (e) { $('#eqOut').innerHTML = errBox(e.message); }
  });
  wireEx('eqEx', 'eqIn', 'eqGo'); enterRuns(['eqIn'], 'eqGo');

  /* --- inequalities --- */
  paneEls.ineq.innerHTML = `
    ${lab('Linear or polynomial inequality (use <, >, <= or >=)')}
    <div class="row"><input type="text" id="inIn" class="grow" value="x^2 - 5x + 6 < 0" spellcheck="false"><button class="btn primary" id="inGo" type="button">Solve</button></div>
    ${exChips('inEx', ['2x - 4 > 0', 'x^2 - 5x + 6 < 0', 'x^2 - 4 >= 0', '-x^2 + 4 > 0', 'x^3 - x > 0', '(x-1)^2 <= 0'])}
    <div class="out" id="inOut"></div>`;
  function solveIneqUI(str) {
    const out = $('#inOut');
    try {
      const res = solveInequality(str);
      let html = rl('Interval notation', esc(res.interval), 'big') + rl('Inequality form', esc(res.ineq));
      if (res.deg >= 1) {
        const pts = res.roots, incl = res.op.includes('=');
        const test = val => res.op[0] === '<' ? val < 0 : val > 0;
        const num = r => fracText(r, 1000) || fmtNum(r, 6);
        const rows = [];
        for (let i = 0; i <= pts.length; i++) {
          const lo = i === 0 ? null : pts[i - 1], hi = i === pts.length ? null : pts[i];
          const t = lo === null && hi === null ? 0 : lo === null ? hi - 1 : hi === null ? lo + 1 : (lo + hi) / 2;
          const fv = polyEval(res.p, t);
          rows.push([`(${lo === null ? '-∞' : num(lo)}, ${hi === null ? '∞' : num(hi)})`, fmtNum(t, 6), fmtNum(fv, 6), fv > 0 ? '+' : fv < 0 ? '−' : '0', test(fv) ? '✓' : '✗']);
          if (i < pts.length) rows.push([`${res.v} = ${num(pts[i])}`, num(pts[i]), '0', '0', incl ? '✓' : '✗']);
        }
        html += `<details class="steps" open><summary>Sign analysis</summary><div style="overflow-x:auto"><table><tr><th>Region</th><th>Test ${esc(res.v)}</th><th>f(test)</th><th>Sign</th><th>Holds</th></tr>${rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table></div>
          <div class="small muted" style="margin-top:6px">f(${esc(res.v)}) = left side − right side. Real critical points: ${pts.length ? pts.map(num).join(', ') : 'none'}.</div></details>`;
      }
      out.innerHTML = html;
    } catch (e) { out.innerHTML = errBox(e.message); }
  }
  $('#inGo').addEventListener('click', () => solveIneqUI($('#inIn').value));
  wireEx('inEx', 'inIn', 'inGo'); enterRuns(['inIn'], 'inGo');

  /* --- complex --- */
  paneEls.cx.innerHTML = `
    <div class="formrow">
      <div>${lab('z₁')}<input type="text" id="z1" value="3+4i"></div>
      <div>${lab('z₂')}<input type="text" id="z2" value="1-2i"></div>
    </div>
    <div class="row" style="margin-top:10px">
      <button class="btn mid" data-cx="add" type="button">z₁ + z₂</button><button class="btn mid" data-cx="sub" type="button">z₁ − z₂</button>
      <button class="btn mid" data-cx="mul" type="button">z₁ × z₂</button><button class="btn mid" data-cx="div" type="button">z₁ ÷ z₂</button>
    </div>
    <div class="row" style="margin-top:8px">
      <button class="btn" data-cx="conj" type="button">conj(z₁)</button><button class="btn" data-cx="abs" type="button">|z₁|</button>
      <button class="btn" data-cx="arg" type="button">arg(z₁)</button><button class="btn primary" data-cx="polar" type="button">Rectangular → Polar</button>
    </div>
    <div class="sub">
      <div class="small muted" style="margin-bottom:4px">Polar → rectangular</div>
      <div class="row">
        <div class="grow">${lab('r')}<input type="text" id="pr" value="5"></div>
        <div class="grow">${lab('θ')}<input type="text" id="pth" value="53.1301"></div>
        <div style="width:90px">${lab('unit')}<select id="punit"><option value="deg">degrees</option><option value="rad">radians</option></select></div>
        <button class="btn primary" id="pgo" type="button" style="margin-top:20px">Convert</button>
      </div>
    </div>
    <div class="out" id="cxOut"></div>`;
  const cz = id => {
    const t = document.getElementById(id).value.trim();
    if (!t) throw new Error('Enter a complex number such as 3+4i');
    return cleanC(evalC(parse(t), { deg: false, vars: {} }));
  };
  const cxLines = (label, z) => {
    z = cleanC(z);
    let html = rl(label, esc(fmtC(z, 12)), 'big');
    if (Number.isFinite(z.re) && Number.isFinite(z.im)) {
      if (z.re === 0 && z.im === 0) html += rl('Polar form', '0');
      else { const p = polarText(z); html += rl('Magnitude |z|', esc(fmtNum(p.r, 12))) + rl('Argument', esc(`${fmtNum(p.th, 10)} rad = ${fmtNum(p.th * 180 / Math.PI, 10)}°`)) + rl('Polar form', esc(p.text)); }
    }
    return html;
  };
  $$('[data-cx]').forEach(b => b.addEventListener('click', () => {
    const out = $('#cxOut');
    try {
      const a = cz('z1'), op = b.dataset.cx;
      if (['add', 'sub', 'mul', 'div'].includes(op)) {
        const c = cz('z2');
        const r = op === 'add' ? cadd(a, c) : op === 'sub' ? csub(a, c) : op === 'mul' ? cmul(a, c) : cdiv(a, c);
        const sym = { add: '+', sub: '−', mul: '×', div: '÷' }[op];
        out.innerHTML = rl('Expression', esc(`(${fmtC(a)}) ${sym} (${fmtC(c)})`)) + cxLines('Result', r);
      } else if (op === 'conj') out.innerHTML = rl('Expression', esc(`conj(${fmtC(a)})`)) + cxLines('Conjugate', cconj(a));
      else if (op === 'abs') out.innerHTML = rl('|z₁|', esc(fmtNum(cabs(a), 12)), 'big') + rl('Formula', esc(`√(${fmtNum(a.re, 8)}² + ${fmtNum(a.im, 8)}²)`));
      else if (op === 'arg') {
        if (a.re === 0 && a.im === 0) throw new Error('The argument of 0 is undefined');
        const th = carg(a);
        out.innerHTML = rl('arg(z₁)', esc(`${fmtNum(th, 12)} rad`), 'big') + rl('In degrees', esc(fmtNum(th * 180 / Math.PI, 12) + '°'));
      } else {
        if (a.re === 0 && a.im === 0) throw new Error('0 has no polar angle');
        const p = polarText(a);
        out.innerHTML = rl('Rectangular', esc(fmtC(a, 12))) + rl('Polar', esc(p.text), 'big') + rl('Exponential', esc(`${fmtNum(p.r, 10)}·e^(${fmtNum(p.th, 10)}i)`))
          + rl('Trig form', esc(`${fmtNum(p.r, 10)}(cos ${fmtNum(p.th, 8)} + i sin ${fmtNum(p.th, 8)})`));
      }
    } catch (e) { out.innerHTML = errBox(e.message); }
  }));
  $('#pgo').addEventListener('click', () => {
    const out = $('#cxOut');
    try {
      const r = numField('pr', 'r'), th0 = numField('pth', 'θ');
      const isDeg = $('#punit').value === 'deg';
      const z = C(r * trigReal('cos', th0, isDeg), r * trigReal('sin', th0, isDeg));
      out.innerHTML = rl('Polar input', esc(`${fmtNum(r, 10)} ∠ ${fmtNum(th0, 10)}${isDeg ? '°' : ' rad'}`)) + rl('Rectangular', esc(fmtC(z, 10)), 'big');
    } catch (e) { out.innerHTML = errBox(e.message); }
  });
  enterRuns(['z1', 'z2'], 'pgo');

  /* --- calculus --- */
  paneEls.calc.innerHTML = `
    ${lab('Function (any variables; trig functions use radians)')}
    <input type="text" id="cf" value="x^2*sin(x)" spellcheck="false">
    ${exChips('cEx', ['x^3 + 2x', 'x^2*sin(x)', 'exp(x)*cos(x)', 'ln(x^2+1)', 'x*exp(x^2)', 'x^2*y + sin(y)*x', '1/(x^2+1)'])}
    <div class="formrow">
      <div>${lab('Variable')}<input type="text" id="cv" placeholder="auto" style="text-align:center"></div>
      <div>${lab('Order (derivative)')}<input type="text" id="cord" value="1"></div>
      <div>${lab('Evaluate at (optional)')}<input type="text" id="cpt" placeholder="x=2, y=1"></div>
    </div>
    <div class="row" style="margin-top:10px">
      <button class="btn primary" id="cDer" type="button">d/dx Derivative</button>
      <button class="btn mid" id="cPar" type="button">∂/∂x Partial</button>
      <button class="btn mid" id="cInt" type="button">∫ Indefinite</button>
      <button class="btn mid" id="cGrad" type="button">∇ Gradient</button>
    </div>
    <div class="sub">
      <div class="small muted">Definite integral (limits may be expressions such as pi, or ±inf)</div>
      <div class="row">
        <div class="grow">${lab('Lower limit a')}<input type="text" id="ca" value="0"></div>
        <div class="grow">${lab('Upper limit b')}<input type="text" id="cb" value="pi"></div>
        <button class="btn primary" id="cDef" type="button" style="margin-top:20px">∫ₐᵇ Definite</button>
      </div>
    </div>
    <div class="out" id="cOut"></div>`;
  function calcCommon() {
    const f = $('#cf').value.trim();
    if (!f) throw new Error('Enter a function first');
    const ast = parseFunction(f);
    const v = pickVariable(ast, $('#cv').value);
    return { ast, v, ptTxt: $('#cpt').value };
  }
  function atPointLine(ast, ptTxt, extraVars) {
    if (!ptTxt.trim()) return '';
    const vars = parsePoint(ptTxt);
    const z = evalAt(ast, vars);
    if (!isReal(z) && Math.abs(z.im) > 0) return rl('At point', esc(fmtC(z, 10)));
    const e = fmtNum(cleanC(z).re, 12);
    return rl(`Value at (${Object.entries(vars).map(([k, x]) => `${k}=${fmtNum(x, 6)}`).join(', ')})`, esc(e), 'big');
  }
  function derivUI(partial) {
    const out = $('#cOut');
    try {
      const { ast, v, ptTxt } = calcCommon();
      const order = Math.round(+$('#cord').value || 1);
      if (order < 1 || order > 6) throw new Error('Order must be between 1 and 6');
      const others = [...varsOf(ast)].filter(x => x !== v);
      const d = deriveN(ast, v, order);
      const sym = order === 1 ? `∂f/∂${v}` : `∂${order}f/∂${v}${order}`;
      const name = (partial || others.length) ? sym : (order === 1 ? `df/d${v}` : `d${order}f/d${v}${order}`);
      let html = rl('f', esc(fx(ast))) + rl(name, esc(fx(d)), 'big');
      if (others.length) html += `<div class="small muted">Other variables (${others.join(', ')}) are treated as constants.</div>`;
      html += atPointLine(d, ptTxt);
      out.innerHTML = html;
    } catch (e) { out.innerHTML = errBox(e.message); }
  }
  $('#cDer').addEventListener('click', () => derivUI(false));
  $('#cPar').addEventListener('click', () => derivUI(true));
  $('#cInt').addEventListener('click', () => {
    const out = $('#cOut');
    try {
      const { ast, v, ptTxt } = calcCommon();
      const F = antiderivative(ast, v);
      if (!F) throw new Error('No closed-form antiderivative was found with the built-in rules (it handles polynomials, rational functions with linear or quadratic denominators, exp/log/trig, substitution and simple integration by parts). Use the definite integral for a numeric value.');
      let html = rl('f', esc(fx(ast))) + rl(`∫ f d${v}`, esc(fx(F) + ' + C'), 'big');
      html += `<div class="small muted">Check: d/d${v} of the result simplifies back to the integrand.</div>`;
      html += atPointLine(F, ptTxt);
      out.innerHTML = html;
    } catch (e) { out.innerHTML = errBox(e.message); }
  });
  $('#cDef').addEventListener('click', () => {
    const out = $('#cOut');
    try {
      const { ast, v } = calcCommon();
      const others = [...varsOf(ast)].filter(x => x !== v);
      if (others.length) throw new Error(`The definite integral needs a function of one variable (found ${others.join(', ')} too). Substitute numbers for them first.`);
      const a = numField('ca', 'Lower limit'), b = numField('cb', 'Upper limit');
      const r = definiteIntegral(ast, v, a, b);
      const val = Math.abs(r.value) < 1e-13 && r.err < 1e-9 ? 0 : r.value;
      const hint = closedFormHint(val);
      let html = rl('f', esc(fx(ast))) + rl(`∫ from ${fmtNum(a, 8)} to ${fmtNum(b, 8)}`, esc(fmtNum(val, 12)), 'big');
      if (hint) html += rl('Closed form (likely)', esc(hint));
      html += `<div class="small muted">Computed numerically (adaptive Gauss–Kronrod), estimated error ≈ ${r.err.toExponential(1)}.</div>`;
      const F = antiderivative(ast, v);
      if (F) html += rl('Antiderivative', esc(fx(F)));
      out.innerHTML = html;
    } catch (e) { out.innerHTML = errBox(e.message); }
  });
  $('#cGrad').addEventListener('click', () => {
    const out = $('#cOut');
    try {
      const { ast, ptTxt } = calcCommon();
      const vars = [...varsOf(ast)].sort();
      if (!vars.length) throw new Error('The gradient needs a function with at least one variable');
      const parts = vars.map(v => dd(ast, v));
      let html = rl('f', esc(fx(ast)));
      html += vars.map((v, i) => rl(`∂f/∂${v}`, esc(fx(parts[i])), 'big')).join('');
      html += rl('∇f', esc('(' + parts.map(p => fx(p)).join(',  ') + ')'));
      if (ptTxt.trim()) {
        const pt = parsePoint(ptTxt);
        const vals = parts.map(p => cleanC(evalAt(p, pt)));
        html += rl('∇f at point', esc('(' + vals.map(z => fmtC(z, 8)).join(', ') + ')'), 'big');
        const mag = Math.sqrt(vals.reduce((s, z) => s + z.re * z.re, 0));
        html += rl('|∇f|', esc(fmtNum(mag, 10)));
      }
      out.innerHTML = html;
    } catch (e) { out.innerHTML = errBox(e.message); }
  });
  wireEx('cEx', 'cf', 'cDer');
  enterRuns(['cf'], 'cDer');

  /* --- number theory & combinatorics --- */
  paneEls.nt.innerHTML = `
    ${lab('GCD and LCM of two or more integers (comma separated)')}
    <div class="row"><input type="text" id="ntList" class="grow" value="12, 18, 30"><button class="btn primary" id="ntGo" type="button">GCD / LCM</button></div>
    <div class="out" id="ntOut"></div>
    <div class="sub">
      <div class="small muted">Permutations, combinations and factorial</div>
      <div class="row">
        <div class="grow">${lab('n')}<input type="text" id="cn" value="10"></div>
        <div class="grow">${lab('r')}<input type="text" id="cr" value="3"></div>
        <button class="btn primary" id="ncrGo" type="button" style="margin-top:20px">nPr, nCr, n!</button>
      </div>
      <div class="out" id="ncrOut"></div>
    </div>`;
  $('#ntGo').addEventListener('click', () => {
    const out = $('#ntOut');
    try {
      const parts = $('#ntList').value.split(/[,;\s]+/).filter(Boolean);
      if (parts.length < 2) throw new Error('Enter at least two integers separated by commas');
      const nums = parts.map(p => { const x = evalNumber(p); if (!Number.isInteger(x)) throw new Error(`"${p}" is not an integer`); return x; });
      if (nums.some(x => Math.abs(x) > Number.MAX_SAFE_INTEGER)) throw new Error('Numbers are too large');
      const g = nums.reduce((s, q) => gcdNum(s, q));
      const l = nums.reduce((s, q) => lcmNum(s, q));
      let html = rl('GCD', esc(String(g)), 'big') + rl('LCM', esc(String(l)), 'big');
      html += `<details class="steps" open><summary>Prime factorizations</summary><ul>${nums.map(x => `<li>${x} = ${esc(factorText(x))}</li>`).join('')}</ul></details>`;
      if (nums.length === 2 && nums[0] !== 0 && nums[1] !== 0) html += `<div class="small muted">Check: gcd × lcm = ${g} × ${l} = ${g * l} = |a × b|</div>`;
      out.innerHTML = html;
    } catch (e) { out.innerHTML = errBox(e.message); }
  });
  $('#ncrGo').addEventListener('click', () => {
    const out = $('#ncrOut');
    try {
      const n = intField('cn', 'n'), r = intField('cr', 'r');
      if (n < 0 || r < 0) throw new Error('n and r must be non-negative integers');
      if (n > 5000) throw new Error('n is limited to 5000 here');
      if (r > n) throw new Error(`r (${r}) cannot be larger than n (${n}) for nPr and nCr`);
      let html = rl(`${n}P${r}`, esc(bigText(permBig(n, r))), 'big') + rl('Formula', esc(`n! / (n − r)! = ${n}! / ${n - r}!`));
      html += rl(`${n}C${r}`, esc(bigText(combBig(n, r))), 'big') + rl('Formula', esc(`n! / (r! (n − r)!)`));
      html += rl(`${n}!`, esc(bigText(factBig(n))));
      html += rl(`${r}!`, esc(bigText(factBig(r))));
      out.innerHTML = html;
    } catch (e) { out.innerHTML = errBox(e.message); }
  });
  enterRuns(['ntList'], 'ntGo'); enterRuns(['cn', 'cr'], 'ncrGo');

  /* --- probability --- */
  paneEls.prob.innerHTML = `
    <div class="small muted">Conditional probability</div>
    <div class="formrow">
      <div>${lab('P(A)')}<input type="text" id="pA" value="0.5"></div>
      <div>${lab('P(B)')}<input type="text" id="pB" value="0.4"></div>
      <div>${lab('P(A ∩ B)')}<input type="text" id="pAB" value="0.2"></div>
    </div>
    <div class="row" style="margin-top:8px"><button class="btn primary" id="cpGo" type="button">Compute</button><span class="small muted">Fractions such as 1/6 are accepted.</span></div>
    <div class="out" id="cpOut"></div>
    <div class="sub">
      <div class="small muted">Binomial distribution X ~ Bin(n, p)</div>
      <div class="formrow">
        <div>${lab('n (trials)')}<input type="text" id="bn" value="10"></div>
        <div>${lab('p (success)')}<input type="text" id="bp" value="0.5"></div>
        <div>${lab('k (successes)')}<input type="text" id="bk" value="4"></div>
        <div>${lab('k₂ (optional, for a ≤ X ≤ b)')}<input type="text" id="bk2" placeholder="blank = off"></div>
      </div>
      <div class="row" style="margin-top:8px"><button class="btn primary" id="bnGo" type="button">Compute</button></div>
      <div class="out" id="bnOut"></div>
    </div>`;
  const pf = x => fmtNum(x, 10);
  $('#cpGo').addEventListener('click', () => {
    const out = $('#cpOut');
    try {
      const A = numField('pA', 'P(A)'), B = numField('pB', 'P(B)'), AB = numField('pAB', 'P(A ∩ B)');
      for (const [nm, x] of [['P(A)', A], ['P(B)', B], ['P(A ∩ B)', AB]]) if (x < 0 || x > 1) throw new Error(`${nm} must be between 0 and 1`);
      if (AB > Math.min(A, B) + 1e-12) throw new Error('P(A ∩ B) cannot exceed P(A) or P(B)');
      const U = A + B - AB;
      if (U > 1 + 1e-12) throw new Error('These values are inconsistent: P(A ∪ B) would exceed 1');
      let html = '';
      html += B > 0 ? rl('P(A | B)', esc(`${pf(AB / B)}   = P(A∩B) / P(B)`), 'big') : rl('P(A | B)', 'undefined because P(B) = 0');
      html += A > 0 ? rl('P(B | A)', esc(`${pf(AB / A)}   = P(A∩B) / P(A)`), 'big') : rl('P(B | A)', 'undefined because P(A) = 0');
      html += rl('P(A ∪ B)', esc(`${pf(U)}   = P(A) + P(B) − P(A∩B)`));
      html += rl('P(A | not B)', B < 1 ? esc(pf((A - AB) / (1 - B))) : 'undefined because P(B) = 1');
      const indep = Math.abs(AB - A * B) < 1e-12;
      html += rl('Independent?', indep ? 'Yes: P(A∩B) = P(A)·P(B)' : `No: P(A)·P(B) = ${pf(A * B)} ≠ ${pf(AB)}`);
      out.innerHTML = html;
    } catch (e) { out.innerHTML = errBox(e.message); }
  });
  $('#bnGo').addEventListener('click', () => {
    const out = $('#bnOut');
    try {
      const n = intField('bn', 'n'), p = numField('bp', 'p'), k = intField('bk', 'k');
      if (n < 0 || n > 100000) throw new Error('n must be a whole number from 0 to 100000');
      if (p < 0 || p > 1) throw new Error('p must be between 0 and 1');
      if (k < 0 || k > n) throw new Error(`k must be between 0 and n (${n})`);
      const eq = binomPmf(n, p, k), le = binomCdf(n, p, k), lt = k > 0 ? binomCdf(n, p, k - 1) : 0;
      let html = rl(`P(X = ${k})`, esc(pf(eq)), 'big') + rl(`P(X ≤ ${k})`, esc(pf(le))) + rl(`P(X < ${k})`, esc(pf(lt)))
        + rl(`P(X ≥ ${k})`, esc(pf(1 - lt))) + rl(`P(X > ${k})`, esc(pf(1 - le)));
      const k2t = $('#bk2').value.trim();
      if (k2t) {
        const k2 = intField('bk2', 'k₂');
        if (k2 < k || k2 > n) throw new Error(`k₂ must satisfy k ≤ k₂ ≤ n`);
        html += rl(`P(${k} ≤ X ≤ ${k2})`, esc(pf(binomCdf(n, p, k2) - lt)), 'big');
      }
      html += rl('Mean μ = np', esc(pf(n * p))) + rl('Variance σ² = np(1−p)', esc(pf(n * p * (1 - p)))) + rl('Std. dev. σ', esc(pf(Math.sqrt(n * p * (1 - p)))));
      if (n <= 400) {
        const sd = Math.sqrt(n * p * (1 - p));
        let lo = Math.max(0, Math.floor(n * p - 4 * sd)), hi = Math.min(n, Math.ceil(n * p + 4 * sd));
        if (hi - lo > 40) { lo = Math.max(0, k - 20); hi = Math.min(n, lo + 40); }
        let mx = 0; const rows = [];
        for (let i = lo; i <= hi; i++) { const q = binomPmf(n, p, i); mx = Math.max(mx, q); rows.push([i, q, binomCdf(n, p, i)]); }
        html += `<details class="steps"><summary>Distribution table (k = ${lo}…${hi})</summary><div style="overflow-x:auto;max-height:260px;overflow-y:auto"><table><tr><th>k</th><th>P(X=k)</th><th>P(X≤k)</th><th style="width:140px">&nbsp;</th></tr>${rows.map(([i, q, c]) => `<tr${i === k ? ' style="background:var(--b200)"' : ''}><td>${i}</td><td>${esc(fmtNum(q, 6))}</td><td>${esc(fmtNum(c, 6))}</td><td style="text-align:left"><div class="bar" style="width:${mx ? Math.round(120 * q / mx) : 0}px"></div></td></tr>`).join('')}</table></div></details>`;
      }
      out.innerHTML = html;
    } catch (e) { out.innerHTML = errBox(e.message); }
  });
  enterRuns(['pA', 'pB', 'pAB'], 'cpGo'); enterRuns(['bn', 'bp', 'bk', 'bk2'], 'bnGo');

  /* --- fractions --- */
  paneEls.frac.innerHTML = `
    <div class="small muted">Simplify a fraction</div>
    <div class="row">
      <div class="grow">${lab('Numerator')}<input type="text" id="fn" value="84"></div>
      <div class="grow">${lab('Denominator')}<input type="text" id="fd" value="126"></div>
      <button class="btn primary" id="fGo" type="button" style="margin-top:20px">Simplify</button>
    </div>
    <div class="out" id="fOut"></div>
    <div class="sub">
      <div class="small muted">Exact fraction arithmetic (and decimal → fraction)</div>
      <div class="row"><input type="text" id="fe" class="grow" value="3/4 + 5/6 * 2" spellcheck="false"><button class="btn primary" id="feGo" type="button">Calculate exactly</button></div>
      ${exChips('fEx', ['3/4 + 5/6 * 2', '(2/3)^3', '0.125', '7/8 - 1/12', '1/3 + 1/6 + 1/9'])}
      <div class="out" id="feOut"></div>
    </div>`;
  $('#fGo').addEventListener('click', () => {
    const out = $('#fOut');
    try {
      const p = intField('fn', 'Numerator'), q = intField('fd', 'Denominator');
      if (q === 0) throw new Error('The denominator cannot be 0');
      const g = gcdNum(p, q) || 1;
      let sp = p / g, sq = q / g;
      if (sq < 0) { sp = -sp; sq = -sq; }
      let html = rl('Simplified', esc(sq === 1 ? String(sp) : `${sp}/${sq}`), 'big') + rl('GCD', String(g)) + rl('Decimal', esc(fmtNum(p / q, 12)));
      const mx = mixedText(p / q);
      if (mx && sq !== 1) html += rl('Mixed number', esc(mx));
      html += rl('Percent', esc(fmtNum(100 * p / q, 10) + '%'));
      out.innerHTML = html;
    } catch (e) { out.innerHTML = errBox(e.message); }
  });
  $('#feGo').addEventListener('click', () => {
    const out = $('#feOut');
    try {
      const t = $('#fe').value.trim();
      if (!t) throw new Error('Enter an expression such as 3/4 + 5/6');
      const ast = parse(t);
      const z = evalC(ast, { deg: false, vars: {}, ans: STATE.ans });
      if (!isReal(z)) throw new Error('The result is not a real number');
      let html = '';
      let exact = null;
      try { const [p, q] = ratEval(ast); exact = [p, q]; } catch (e) { if (e.message === 'Division by zero') throw e; }
      if (exact) {
        const [p, q] = exact;
        html += rl('Exact result', esc(q === 1n ? p.toString() : `${p}/${q}`), 'big');
        const ap = p < 0n ? -p : p;
        if (q !== 1n && ap > q) html += rl('Mixed number', esc(`${p / q} ${ap % q}/${q}`));
      } else {
        const f = fracText(z.re, 100000);
        html += rl('Closest fraction', f ? esc(f) : 'no simple fraction (irrational or too large)', 'big');
      }
      html += rl('Decimal', esc(fmtNum(z.re, 14)));
      out.innerHTML = html;
    } catch (e) { out.innerHTML = errBox(e.message); }
  });
  wireEx('fEx', 'fe', 'feGo'); enterRuns(['fn', 'fd'], 'fGo'); enterRuns(['fe'], 'feGo');

  selectTool('eq');
  $('#eqGo').click(); $('#inGo').click();
  expr.focus && !matchMedia('(pointer:coarse)').matches && expr.focus({ preventScroll: true });
}
