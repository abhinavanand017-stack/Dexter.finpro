/* ============================================================
   DEXTER — Add-on widgets (additive, no edits to app.js)
   Dexter Score v2 · Shadow Portfolio v2 · Circuit Breaker v2 ·
   Portfolio Optimizer · Demo Mode · Polish (status bar etc.)
   ============================================================ */
(function () {
  'use strict';

  // Indian number formatter
  function fmtINR(v, opts) {
    opts = opts || {};
    const sign = v < 0 ? '-' : (opts.sign ? '+' : '');
    const a = Math.abs(v);
    if (opts.lakhs) return `${sign}₹${(a / 1e5).toFixed(2)} L`;
    if (a >= 1e7) return `${sign}₹${(a / 1e7).toFixed(2)} Cr`;
    if (a >= 1e5) return `${sign}₹${(a / 1e5).toFixed(2)} L`;
    if (a >= 1e3) return `${sign}₹${a.toLocaleString('en-IN')}`;
    return `${sign}₹${a.toFixed(2)}`;
  }
  window.fmtINR = window.fmtINR || fmtINR;

  // ───── 1. Dexter Score v2 hero ─────────────────────────────
  function colorForScore(s) {
    if (s > 70) return { c: '#22c55e', tone: 'green' };
    if (s >= 40) return { c: '#f59e0b', tone: 'amber' };
    return { c: '#ef4444', tone: 'red' };
  }

  function buildScoreHero() {
    const dash = document.getElementById('panel-dashboard');
    if (!dash || document.getElementById('dx-score-hero')) return;
    const wrap = document.createElement('div');
    wrap.id = 'dx-score-hero';
    wrap.className = 'dx-score-hero';
    wrap.innerHTML = `
      <div class="dx-gauge-wrap">
        <svg viewBox="0 0 180 180" width="180" height="180">
          <circle cx="90" cy="90" r="78" stroke="rgba(255,255,255,0.06)" stroke-width="14" fill="none"/>
          <circle id="dx-gauge-fill" cx="90" cy="90" r="78" stroke="#22c55e" stroke-width="14" fill="none"
            stroke-linecap="round" stroke-dasharray="490" stroke-dashoffset="490"
            style="transition:stroke-dashoffset 1.6s cubic-bezier(.2,.7,.2,1),stroke .4s"/>
        </svg>
        <div class="dx-gauge-num">
          <div class="dx-gauge-val" id="dx-gauge-val">0</div>
          <div class="dx-gauge-cap">Dexter Score</div>
        </div>
      </div>
      <div class="dx-score-info">
        <h3>Dexter Score
          <span style="color:#64748b;">ⓘ</span>
          <span class="dx-tip">Your Dexter Score combines risk-adjusted returns, emotional discipline, and behavioral improvement over time.</span>
        </h3>
        <div class="dx-score-sub">Composite cognitive-financial health index, updated in real time.</div>
        <div class="dx-pills">
          <div class="dx-pill blue"><span class="ic">📈</span><span class="lab">Sharpe Ratio</span><span class="val" id="dx-pill-sharpe">1.84</span></div>
          <div class="dx-pill amber"><span class="ic">🎚️</span><span class="lab">Override Frequency</span><span class="val" id="dx-pill-over">12%</span></div>
          <div class="dx-pill green"><span class="ic">🧠</span><span class="lab">Behavioral Improvement</span><span class="val" id="dx-pill-bi">+23%</span></div>
        </div>
      </div>`;
    dash.insertBefore(wrap, dash.firstChild);
  }

  function animateScore(target) {
    const hero = document.getElementById('dx-score-hero');
    const fill = document.getElementById('dx-gauge-fill');
    const valEl = document.getElementById('dx-gauge-val');
    if (!hero || !fill || !valEl) return;
    const { c, tone } = colorForScore(target);
    hero.dataset.tone = tone;
    fill.setAttribute('stroke', c);
    const C = 490;
    fill.style.strokeDashoffset = C * (1 - target / 100);
    const start = parseInt(valEl.textContent, 10) || 0;
    const dur = 1400, t0 = performance.now();
    function step(t) {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      valEl.textContent = Math.round(start + (target - start) * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ───── 2. Shadow Portfolio v2 ──────────────────────────────
  const SHADOW_RANGES = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };
  function genShadowSeries(days) {
    const algo = [], you = [];
    let a = 1000000, y = 1000000;
    const start = new Date(2025, 0, 1);
    const step = days <= 7 ? 1 : Math.max(1, Math.floor(days / 60));
    for (let i = 0; i <= days; i += step) {
      const t = i / days;
      a = 1000000 * (1 + 0.18 * t + 0.04 * Math.sin(i / 9));
      y = 1000000 * (1 + 0.13 * t + 0.05 * Math.sin(i / 11) - 0.012 * t);
      const d = new Date(start.getTime() + i * 86400000);
      algo.push({ d, v: a });
      you.push({ d, v: y });
    }
    return { algo, you };
  }

  function buildShadowCard() {
    const dash = document.getElementById('panel-dashboard');
    if (!dash || document.getElementById('dx-shadow-card')) return;
    const card = document.createElement('div');
    card.className = 'dx-shadow-card card';
    card.id = 'dx-shadow-card';
    card.innerHTML = `
      <div class="dx-shadow-head">
        <div>
          <h3>Shadow Portfolio</h3>
          <div style="font-size:12px;color:#94a3b8;margin-top:2px">Algorithmic execution vs. your real account</div>
        </div>
        <div class="dx-range-btns" id="dx-range-btns">
          ${['1W','1M','3M','6M','1Y'].map(r=>`<button data-r="${r}"${r==='6M'?' class="active"':''}>${r}</button>`).join('')}
        </div>
        <span class="dx-drag-badge" id="dx-drag-badge">Behavioral Drag: ₹47,320</span>
      </div>
      <div style="position:relative">
        <svg class="dx-shadow-svg" id="dx-shadow-svg" viewBox="0 0 900 300" preserveAspectRatio="none"></svg>
        <div id="dx-shadow-tip" class="dx-tooltip" style="display:none"></div>
      </div>
      <div class="dx-shadow-legend">
        <span><span class="dot" style="background:#3b82f6"></span>Algorithm Portfolio</span>
        <span><span class="dot" style="background:#ef4444"></span>Your Portfolio</span>
        <span style="margin-left:auto;color:#64748b;font-family:'JetBrains Mono',monospace">Y-axis in ₹ lakhs</span>
      </div>
      <div class="dx-shadow-foot">Every manual override has a cost. This is yours.</div>`;
    // insert after dexter score hero (before existing top-row)
    const after = document.getElementById('dx-score-hero');
    if (after && after.nextSibling) dash.insertBefore(card, after.nextSibling);
    else dash.appendChild(card);

    card.querySelectorAll('#dx-range-btns button').forEach(b => {
      b.addEventListener('click', () => {
        card.querySelectorAll('#dx-range-btns button').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        renderShadowSVG(b.dataset.r, true);
      });
    });
  }

  let _shadowData = null;
  function renderShadowSVG(rangeKey, animate) {
    const svg = document.getElementById('dx-shadow-svg');
    if (!svg) return;
    const days = SHADOW_RANGES[rangeKey] || 180;
    const data = genShadowSeries(days);
    _shadowData = data;
    const W = 900, H = 300, padL = 60, padR = 30, padT = 20, padB = 36;
    const xs = data.algo.map(p => p.d.getTime());
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const allY = data.algo.concat(data.you).map(p => p.v);
    const yMin = Math.min(...allY) * 0.98;
    const yMax = Math.max(...allY) * 1.02;
    const X = t => padL + (W - padL - padR) * (t - xMin) / (xMax - xMin || 1);
    const Y = v => H - padB - (H - padT - padB) * (v - yMin) / (yMax - yMin);

    function path(arr) {
      if (!arr.length) return '';
      let d = `M ${X(arr[0].d.getTime())} ${Y(arr[0].v)}`;
      for (let i = 1; i < arr.length; i++) {
        const x0 = X(arr[i - 1].d.getTime()), y0 = Y(arr[i - 1].v);
        const x1 = X(arr[i].d.getTime()), y1 = Y(arr[i].v);
        const cx = (x0 + x1) / 2;
        d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
      }
      return d;
    }

    // grid
    let grid = '';
    for (let g = 0; g <= 4; g++) {
      const y = padT + (H - padT - padB) * g / 4;
      const v = yMax - (yMax - yMin) * g / 4;
      grid += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="rgba(255,255,255,0.05)"/>
               <text x="${padL - 8}" y="${y + 4}" text-anchor="end" fill="#64748b" font-size="10" font-family="JetBrains Mono">${(v / 1e5).toFixed(1)}L</text>`;
    }
    // x axis labels
    const ticks = 5; let xax = '';
    for (let i = 0; i <= ticks; i++) {
      const tt = xMin + (xMax - xMin) * i / ticks;
      const d = new Date(tt);
      xax += `<text x="${X(tt)}" y="${H - 14}" text-anchor="middle" fill="#64748b" font-size="10" font-family="JetBrains Mono">${d.toLocaleDateString('en-IN',{month:'short',day:'2-digit'})}</text>`;
    }

    const lastA = data.algo[data.algo.length - 1];
    const lastY = data.you[data.you.length - 1];
    const gap = lastA.v - lastY.v;
    const dragEl = document.getElementById('dx-drag-badge');
    if (dragEl) dragEl.textContent = `Behavioral Drag: ${fmtINR(gap)}`;

    svg.innerHTML = `
      ${grid}${xax}
      <path d="${path(data.algo)}" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" id="dx-line-algo"/>
      <path d="${path(data.you)}" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-dasharray="6 4" stroke-linecap="round" id="dx-line-you"/>
      <line x1="${X(lastA.d.getTime())}" y1="${Y(lastA.v)}" x2="${X(lastY.d.getTime())}" y2="${Y(lastY.v)}" stroke="rgba(239,68,68,0.7)" stroke-width="1.5"/>
      <circle cx="${X(lastA.d.getTime())}" cy="${Y(lastA.v)}" r="4" fill="#3b82f6"/>
      <circle cx="${X(lastY.d.getTime())}" cy="${Y(lastY.v)}" r="4" fill="#ef4444"/>
      <rect class="dx-shadow-hot" x="${padL}" y="${padT}" width="${W - padL - padR}" height="${H - padT - padB}" fill="transparent"/>
    `;

    if (animate) {
      [['dx-line-algo'],['dx-line-you']].forEach(([id]) => {
        const p = svg.querySelector('#' + id);
        if (!p) return;
        const len = p.getTotalLength();
        p.style.strokeDasharray = id === 'dx-line-you' ? `6 4` : len;
        if (id === 'dx-line-algo') {
          p.style.strokeDashoffset = len;
          p.getBoundingClientRect();
          p.style.transition = 'stroke-dashoffset 1.4s ease-out';
          p.style.strokeDashoffset = '0';
        } else {
          p.style.opacity = 0;
          p.getBoundingClientRect();
          p.style.transition = 'opacity 1.4s ease-out';
          p.style.opacity = 1;
        }
      });
    }

    // hover tooltip
    const tip = document.getElementById('dx-shadow-tip');
    const hot = svg.querySelector('.dx-shadow-hot');
    const rect = svg.getBoundingClientRect();
    svg.onmousemove = e => {
      const r = svg.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width * W;
      if (px < padL || px > W - padR) { tip.style.display = 'none'; return; }
      const tt = xMin + (xMax - xMin) * (px - padL) / (W - padL - padR);
      let bestI = 0, best = Infinity;
      for (let i = 0; i < data.algo.length; i++) {
        const dd = Math.abs(data.algo[i].d.getTime() - tt);
        if (dd < best) { best = dd; bestI = i; }
      }
      const a = data.algo[bestI], y = data.you[bestI];
      const gap2 = a.v - y.v;
      tip.style.display = 'block';
      tip.innerHTML = `<div style="color:#94a3b8;margin-bottom:4px">${a.d.toLocaleDateString('en-IN')}</div>
        <div style="color:#3b82f6">Algo: ${fmtINR(a.v)}</div>
        <div style="color:#ef4444">You: ${fmtINR(y.v)}</div>
        <div style="color:#fca5a5;margin-top:2px">Gap: ${fmtINR(gap2)}</div>`;
      tip.style.left = (e.clientX - rect.left + 12) + 'px';
      tip.style.top = (e.clientY - rect.top + 12) + 'px';
    };
    svg.onmouseleave = () => { tip.style.display = 'none'; };
  }

  // ───── 3. Circuit Breaker v2 (augment existing overlay) ─────
  function upgradeCircuitBreaker() {
    const modal = document.querySelector('#circuit-breaker-overlay .circuit-modal');
    if (!modal || modal.dataset.v2) return;
    modal.dataset.v2 = '1';
    const cb2 = document.createElement('div');
    cb2.className = 'cb2';
    cb2.innerHTML = `
      <div class="cb2-icon">🧠</div>
      <div style="font-size:13px;color:#cbd5e1;text-align:center;max-width:380px">Your biometrics indicate elevated stress. Manual overrides are locked.</div>
      <div class="cb2-arousal">
        <div class="cb2-arousal-lbl"><span>Arousal</span><span id="cb2-arousal-val">0.82 / 1.0</span></div>
        <div class="cb2-arousal-bar"><div class="cb2-arousal-fill" id="cb2-arousal-fill" style="width:82%"></div></div>
      </div>
      <textarea class="cb2-textarea" id="cb2-textarea" placeholder="Justify this trade in 50 words..."></textarea>
      <div class="cb2-words" id="cb2-words">0 / 50 words</div>
      <div class="cb2-actions">
        <button class="cb2-btn cb2-override" id="cb2-override" disabled>Override Anyway</button>
        <button class="cb2-btn cb2-trust" id="cb2-trust">Trust the Algorithm</button>
      </div>`;
    modal.appendChild(cb2);

    const ta = cb2.querySelector('#cb2-textarea');
    const wc = cb2.querySelector('#cb2-words');
    const ov = cb2.querySelector('#cb2-override');
    function evalState() {
      const words = (ta.value.trim().match(/\S+/g) || []).length;
      wc.textContent = `${words} / 50 words`;
      wc.classList.toggle('ok', words >= 50);
      const countdownEl = document.getElementById('countdown-number');
      const remaining = countdownEl ? parseInt(countdownEl.textContent, 10) : 60;
      ov.disabled = !(words >= 50 && remaining <= 0);
    }
    ta.addEventListener('input', evalState);
    setInterval(evalState, 500);

    cb2.querySelector('#cb2-trust').addEventListener('click', dismissCircuit);
    cb2.querySelector('#cb2-override').addEventListener('click', () => {
      ta.value = ''; evalState(); dismissCircuit();
    });
  }
  function dismissCircuit() {
    const overlay = document.getElementById('circuit-breaker-overlay');
    if (!overlay) return;
    clearInterval(window.State && window.State.countdownInterval);
    overlay.classList.add('hidden');
    if (window.State) window.State.circuitBreakerActive = false;
    document.body.dataset.arousal = 'low';
    if (typeof window.updateBiometricVisuals === 'function') window.updateBiometricVisuals(0.23);
  }

  // ───── 4. Portfolio Optimizer tab ──────────────────────────
  function addOptimizerTab() {
    const navCenter = document.getElementById('nav-center');
    const main = document.querySelector('main.main-content');
    if (!navCenter || !main || document.getElementById('tab-optimizer')) return;
    const btn = document.createElement('button');
    btn.className = 'nav-tab';
    btn.id = 'tab-optimizer';
    btn.dataset.tab = 'optimizer';
    btn.textContent = 'Portfolio Optimizer';
    navCenter.appendChild(btn);

    const panel = document.createElement('div');
    panel.className = 'tab-panel';
    panel.id = 'panel-optimizer';
    panel.innerHTML = `
      <div class="panel-header">
        <h2>Portfolio Optimizer — Efficient Frontier</h2>
        <p>Mean-variance optimization with biometric-aware risk aversion. Drag λ to explore alternative optimal allocations.</p>
      </div>
      <div class="dx-opt-wrap">
        <div class="dx-opt-chart-card">
          <svg class="dx-opt-svg" id="dx-opt-svg" viewBox="0 0 700 420"></svg>
        </div>
        <div class="dx-opt-side">
          <h4>Current Portfolio</h4>
          <div class="dx-opt-metric"><span>Expected Return</span><strong id="opt-ret">11.2%</strong></div>
          <div class="dx-opt-metric"><span>Volatility</span><strong id="opt-vol">14.8%</strong></div>
          <div class="dx-opt-metric"><span>Sharpe Ratio</span><strong id="opt-sharpe">1.84</strong></div>
          <div class="dx-opt-metric"><span>Lambda (λ)</span><strong id="opt-lambda">3.2</strong></div>
          <h4 style="margin-top:20px">Biometric Risk Aversion</h4>
          <div class="dx-opt-lambda" id="opt-lambda-big">λ = 3.2</div>
          <input class="dx-opt-slider" type="range" min="2" max="10" step="0.1" value="3.2" id="opt-slider"/>
          <div style="font-size:11px;color:#94a3b8;display:flex;justify-content:space-between;margin-top:4px"><span>2.0 (aggressive)</span><span>10.0 (defensive)</span></div>
          <div style="margin-top:16px;padding:10px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:8px;font-size:12px;color:#fde68a">
            <strong>Rebalance to close gap</strong><br/><span style="color:#cbd5e1">Your portfolio sits below the frontier — capturing the same return at lower volatility is possible.</span>
          </div>
        </div>
      </div>`;
    main.appendChild(panel);

    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      panel.classList.add('active');
      renderFrontier(parseFloat(document.getElementById('opt-slider').value));
    });
    document.getElementById('opt-slider').addEventListener('input', e => {
      const lam = parseFloat(e.target.value);
      document.getElementById('opt-lambda').textContent = lam.toFixed(1);
      document.getElementById('opt-lambda-big').textContent = 'λ = ' + lam.toFixed(1);
      renderFrontier(lam);
    });
  }

  function frontierPoint(t) {
    // parametric efficient frontier: t in [0,1]
    const vol = 2 + t * 23; // 2%..25%
    const ret = 2 + 18 * Math.sqrt(t) - 2 * t; // concave
    return { vol, ret };
  }
  function renderFrontier(lambda) {
    const svg = document.getElementById('dx-opt-svg');
    if (!svg) return;
    const W = 700, H = 420, padL = 60, padR = 30, padT = 20, padB = 50;
    const X = v => padL + (W - padL - padR) * v / 25;
    const Y = r => H - padB - (H - padT - padB) * r / 20;
    let grid = '';
    for (let i = 0; i <= 5; i++) {
      const x = padL + (W - padL - padR) * i / 5;
      const y = padT + (H - padT - padB) * i / 5;
      grid += `<line x1="${x}" y1="${padT}" x2="${x}" y2="${H - padB}" stroke="rgba(255,255,255,0.04)"/>`;
      grid += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="rgba(255,255,255,0.04)"/>`;
      grid += `<text x="${x}" y="${H - padB + 16}" text-anchor="middle" fill="#64748b" font-size="10" font-family="JetBrains Mono">${(i * 5)}%</text>`;
      grid += `<text x="${padL - 8}" y="${y + 4}" text-anchor="end" fill="#64748b" font-size="10" font-family="JetBrains Mono">${(20 - i * 4)}%</text>`;
    }
    grid += `<text x="${W/2}" y="${H-10}" text-anchor="middle" fill="#94a3b8" font-size="11">Portfolio Volatility</text>`;
    grid += `<text x="14" y="${H/2}" text-anchor="middle" fill="#94a3b8" font-size="11" transform="rotate(-90 14 ${H/2})">Expected Return</text>`;

    const pts = [];
    for (let i = 0; i <= 19; i++) pts.push(frontierPoint(i / 19));
    let line = `M ${X(pts[0].vol)} ${Y(pts[0].ret)}`;
    pts.slice(1).forEach(p => { line += ` L ${X(p.vol)} ${Y(p.ret)}`; });

    // gradient color dots
    const dots = pts.map((p, i) => {
      const t = i / (pts.length - 1);
      const r = Math.round(59 + (34 - 59) * t);
      const g = Math.round(130 + (197 - 130) * t);
      const b = Math.round(246 + (94 - 246) * t);
      return `<circle cx="${X(p.vol)}" cy="${Y(p.ret)}" r="4" fill="rgb(${r},${g},${b})"/>`;
    }).join('');

    // labelled points
    const minVar = pts[0];
    // max sharpe depends on lambda: pick t that maximizes ret - lambda*vol^2/100
    let best = 0, bestI = 0;
    pts.forEach((p, i) => {
      const u = p.ret - lambda * p.vol * p.vol / 100;
      if (u > best || i === 0) { best = u; bestI = i; }
    });
    const optimal = pts[bestI];
    const current = { vol: 14.8, ret: 11.2 };

    const labels = `
      <circle cx="${X(minVar.vol)}" cy="${Y(minVar.ret)}" r="7" fill="#3b82f6" stroke="#fff" stroke-width="1.5"/>
      <text x="${X(minVar.vol)+10}" y="${Y(minVar.ret)+4}" fill="#93c5fd" font-size="11">Minimum Variance</text>
      <g><polygon points="${X(optimal.vol)},${Y(optimal.ret)-9} ${X(optimal.vol)+3},${Y(optimal.ret)-3} ${X(optimal.vol)+9},${Y(optimal.ret)-3} ${X(optimal.vol)+4},${Y(optimal.ret)+1} ${X(optimal.vol)+6},${Y(optimal.ret)+7} ${X(optimal.vol)},${Y(optimal.ret)+3} ${X(optimal.vol)-6},${Y(optimal.ret)+7} ${X(optimal.vol)-4},${Y(optimal.ret)+1} ${X(optimal.vol)-9},${Y(optimal.ret)-3} ${X(optimal.vol)-3},${Y(optimal.ret)-3}" fill="#fbbf24" stroke="#fff" stroke-width="1"/>
        <text x="${X(optimal.vol)+12}" y="${Y(optimal.ret)+4}" fill="#fde68a" font-size="11" font-weight="700">Optimal (Max Sharpe)</text></g>
      <circle cx="${X(current.vol)}" cy="${Y(current.ret)}" r="8" fill="#fff" opacity="0.9">
        <animate attributeName="r" values="8;12;8" dur="1.8s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.9;0.4;0.9" dur="1.8s" repeatCount="indefinite"/>
      </circle>
      <text x="${X(current.vol)+12}" y="${Y(current.ret)+18}" fill="#fff" font-size="11" font-weight="600">Current Portfolio</text>
      <line x1="${X(current.vol)}" y1="${Y(current.ret)}" x2="${X(optimal.vol)}" y2="${Y(optimal.ret)}" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4 3" marker-end="url(#arrowR)"/>
      <text x="${(X(current.vol)+X(optimal.vol))/2}" y="${(Y(current.ret)+Y(optimal.ret))/2 - 6}" fill="#fca5a5" font-size="10">Rebalance to close gap</text>
    `;
    svg.innerHTML = `<defs><marker id="arrowR" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6 z" fill="#ef4444"/></marker></defs>${grid}<path d="${line}" fill="none" stroke="url(#frontGrad)" stroke-width="2" opacity="0.4"/>
      <defs><linearGradient id="frontGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3b82f6"/><stop offset="1" stop-color="#22c55e"/></linearGradient></defs>
      ${dots}${labels}`;

    // update side metrics for optimal
    document.getElementById('opt-sharpe').textContent = (optimal.ret / optimal.vol).toFixed(2);
  }

  // ───── 5. Demo Mode ─────────────────────────────────────────
  const Demo = {
    on: false, scoreTimer: null, arousalTimer: null, t0: 0,
    enable() {
      this.on = true;
      document.body.classList.add('demo-on');
      localStorage.setItem('dx-demo', '1');
      this.scoreTimer = setInterval(() => {
        const v = Math.round(70 + 9 * Math.sin(Date.now() / 1300));
        animateScore(v);
      }, 4000);
      this.t0 = Date.now();
      this.arousalTimer = setInterval(() => {
        const elapsed = (Date.now() - this.t0) / 1000;
        const cycle = elapsed % 20;
        const arousal = 0.3 + (0.85 - 0.3) * (cycle / 20);
        if (typeof window.updateBiometricVisuals === 'function') window.updateBiometricVisuals(arousal);
        const cbFill = document.getElementById('cb2-arousal-fill');
        const cbVal = document.getElementById('cb2-arousal-val');
        if (cbFill) cbFill.style.width = (arousal * 100) + '%';
        if (cbVal) cbVal.textContent = arousal.toFixed(2) + ' / 1.0';
        if (arousal >= 0.82 && window.State && !window.State.circuitBreakerActive && typeof window.triggerCircuitBreaker === 'function') {
          window.triggerCircuitBreaker();
          this.t0 = Date.now(); // reset cycle
        }
      }, 500);
      // redraw shadow with animation
      renderShadowSVG(document.querySelector('#dx-range-btns .active')?.dataset.r || '6M', true);
    },
    disable() {
      this.on = false;
      document.body.classList.remove('demo-on');
      localStorage.removeItem('dx-demo');
      clearInterval(this.scoreTimer);
      clearInterval(this.arousalTimer);
      animateScore(74);
      if (typeof window.updateBiometricVisuals === 'function') window.updateBiometricVisuals(0.23);
    }
  };

  function setupDemoToggle() {
    const tog = document.getElementById('demo-toggle');
    if (!tog) return;
    tog.addEventListener('click', () => Demo.on ? Demo.disable() : Demo.enable());

    // floating badge + banner
    if (!document.querySelector('.demo-badge')) {
      const b = document.createElement('div'); b.className = 'demo-badge'; b.textContent = '● DEMO';
      document.body.appendChild(b);
      const banner = document.createElement('div'); banner.className = 'demo-banner';
      banner.innerHTML = '⚡ <strong>Demo Mode Active</strong> — Simulating a market crash scenario. Biometrics are synthetic.';
      document.body.appendChild(banner);
    }
    if (localStorage.getItem('dx-demo') === '1') Demo.enable();
  }

  // ───── 6. Polish: engine pill, status bar ──────────────────
  function addEnginePill() {
    const brand = document.querySelector('.nav-brand .brand-name');
    if (brand && !brand.querySelector('.engine-active-pill')) {
      const pill = document.createElement('span');
      pill.className = 'engine-active-pill';
      pill.innerHTML = '<span class="engine-active-dot"></span>Engine Active';
      brand.appendChild(pill);
    }
  }

  function addStatusBar() {
    if (document.querySelector('.dx-statusbar')) return;
    const bar = document.createElement('div');
    bar.className = 'dx-statusbar';
    bar.innerHTML = `
      <span>Last rebalance: <strong id="sb-rebal">2 mins ago</strong></span>
      <span>Next cycle: <strong id="sb-next">47s</strong></span>
      <span>Biometric: <strong class="ok">Apple Watch ✓</strong></span>
      <span>Market: <strong id="sb-market" class="ok">NSE Open</strong></span>`;
    document.body.appendChild(bar);
    let n = 47, rb = 2;
    setInterval(() => {
      n--; if (n <= 0) { n = 60; rb = 0; }
      document.getElementById('sb-next').textContent = n + 's';
      document.getElementById('sb-rebal').textContent = (rb === 0 ? 'just now' : rb + ' min' + (rb>1?'s':'') + ' ago');
    }, 1000);
    setInterval(() => { rb++; }, 60000);
    function updateMkt() {
      // NSE: Mon-Fri 09:15–15:30 IST
      const now = new Date();
      const istMs = now.getTime() + (now.getTimezoneOffset() + 330) * 60000;
      const ist = new Date(istMs);
      const dow = ist.getUTCDay(); // since we offset already as UTC-style
      const mins = ist.getUTCHours() * 60 + ist.getUTCMinutes();
      const open = dow >= 1 && dow <= 5 && mins >= 555 && mins <= 930;
      const el = document.getElementById('sb-market');
      el.textContent = open ? 'NSE Open' : 'NSE Closed';
      el.className = open ? 'ok' : 'warn';
    }
    updateMkt(); setInterval(updateMkt, 30000);
  }

  // ───── boot ────────────────────────────────────────────────
  function boot() {
    buildScoreHero();
    buildShadowCard();
    upgradeCircuitBreaker();
    addOptimizerTab();
    addEnginePill();
    addStatusBar();
    setupDemoToggle();
    // wire simulate button
    const sim = document.getElementById('simulate-cb-btn');
    if (sim) sim.addEventListener('click', () => window.triggerCircuitBreaker && window.triggerCircuitBreaker());
    // initial animations
    setTimeout(() => animateScore(74), 250);
    setTimeout(() => renderShadowSVG('6M', true), 350);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
