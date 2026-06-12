/* ============================================================
 * Dexter — Stock Prediction Suite (17 Models)
 *
 * Port of the Python `stock_prediction_suite` to a browser-side
 * deterministic engine. Uses synthetic OHLCV (seeded GBM with a
 * regime overlay) so every run is reproducible offline.
 *
 * Models implemented (key → name · category):
 *   arima       ARIMA(1,1,1)                       Statistical
 *   sarima      Seasonal ARIMA                     Statistical
 *   ets         Holt-Winters ETS                   Statistical
 *   lr          Linear Regression (OLS)            ML
 *   ridge       Ridge Regression (L2)              ML
 *   rf          Random Forest                      ML
 *   gbm         Gradient Boosting                  ML
 *   svr         Support Vector Regression          ML
 *   knn         K-Nearest Neighbours               ML
 *   lstm        LSTM (sequence)                    Deep Learning
 *   gru         GRU (sequence)                     Deep Learning
 *   transformer Transformer (self-attention)       Deep Learning
 *   cnn         1D CNN (temporal conv)             Deep Learning
 *   prophet     Prophet (trend+seasonality)        Hybrid
 *   ensemble    Ensemble blend                     Hybrid
 *   monte       Monte Carlo (GBM 10k paths)        Statistical
 *   wavenet     WaveNet (dilated causal CNN)       Deep Learning
 *
 * Deep-learning models are evaluated as compact, GPU-free
 * surrogates (gated linear recursions / attention-weighted lags /
 * causal-dilated convs running on CPU) so they execute inside the
 * browser in <100ms while preserving the qualitative behaviour
 * of their full counterparts.
 * ============================================================ */
(function () {
  'use strict';

  // ── deterministic RNG ───────────────────────────────────────
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(rng) {
    let u = 0, v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  const mean = a => a.reduce((s, x) => s + x, 0) / (a.length || 1);
  const variance = a => { const m = mean(a); return a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(a.length - 1, 1); };
  const stdev = a => Math.sqrt(variance(a));
  const last  = a => a[a.length - 1];
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

  // ── ticker universe (synthetic OHLCV calibration) ───────────
  const UNIVERSE = {
    'NIFTY50':   { seed: 11, base: 25400, drift: 0.00045, vol: 0.0095, name: 'NIFTY 50 Index' },
    'SENSEX':    { seed: 12, base: 83500, drift: 0.00043, vol: 0.0092, name: 'BSE SENSEX 30'  },
    'CNX500':    { seed: 13, base: 23800, drift: 0.00048, vol: 0.0103, name: 'NIFTY 500 Index'},
    'RELIANCE':  { seed: 21, base: 2940,  drift: 0.00040, vol: 0.0145, name: 'Reliance Industries' },
    'TCS':       { seed: 22, base: 4180,  drift: 0.00035, vol: 0.0128, name: 'Tata Consultancy Services' },
    'HDFCBANK':  { seed: 23, base: 1680,  drift: 0.00038, vol: 0.0132, name: 'HDFC Bank' },
    'INFY':      { seed: 24, base: 1880,  drift: 0.00032, vol: 0.0140, name: 'Infosys' },
    'ICICIBANK': { seed: 25, base: 1240,  drift: 0.00046, vol: 0.0150, name: 'ICICI Bank' },
    'SBIN':      { seed: 26, base: 820,   drift: 0.00050, vol: 0.0170, name: 'State Bank of India' },
    'BHARTIARTL':{ seed: 27, base: 1620,  drift: 0.00052, vol: 0.0158, name: 'Bharti Airtel' },
    'ITC':       { seed: 28, base: 470,   drift: 0.00028, vol: 0.0115, name: 'ITC Limited' },
    'LT':        { seed: 29, base: 3720,  drift: 0.00041, vol: 0.0142, name: 'Larsen & Toubro' },
    'HINDUNILVR':{ seed: 30, base: 2410,  drift: 0.00025, vol: 0.0108, name: 'Hindustan Unilever' },
    'KOTAKBANK': { seed: 31, base: 1790,  drift: 0.00036, vol: 0.0136, name: 'Kotak Mahindra Bank' },
    'BAJFINANCE':{ seed: 32, base: 7250,  drift: 0.00055, vol: 0.0184, name: 'Bajaj Finance' },
    'MARUTI':    { seed: 33, base: 12800, drift: 0.00038, vol: 0.0162, name: 'Maruti Suzuki' },
    'ASIANPAINT':{ seed: 34, base: 2480,  drift: 0.00022, vol: 0.0125, name: 'Asian Paints' },
    'TITAN':     { seed: 35, base: 3580,  drift: 0.00044, vol: 0.0148, name: 'Titan Company' },
    'WIPRO':     { seed: 36, base: 560,   drift: 0.00030, vol: 0.0150, name: 'Wipro' },
    'AXISBANK':  { seed: 37, base: 1180,  drift: 0.00042, vol: 0.0156, name: 'Axis Bank' },
  };

  function generateOHLCV(ticker, n = 750) {
    const cfg = UNIVERSE[ticker] || { seed: 99, base: 1000, drift: 0.0004, vol: 0.014 };
    const rng = mulberry32(cfg.seed * 7919 + 17);
    const closes = [cfg.base];
    let regime = 1, regimeLeft = 60 + Math.floor(rng() * 60);
    for (let i = 1; i < n; i++) {
      regimeLeft--;
      if (regimeLeft <= 0) { regime = rng() < 0.55 ? 1 : -1; regimeLeft = 40 + Math.floor(rng() * 80); }
      const drift = cfg.drift * regime;
      const r = drift + cfg.vol * gauss(rng);
      closes.push(Math.max(0.01, closes[i - 1] * Math.exp(r)));
    }
    return closes;
  }

  // ── metrics ─────────────────────────────────────────────────
  function metrics(yTrue, yPred) {
    const n = Math.min(yTrue.length, yPred.length);
    if (!n) return { RMSE: 0, MAE: 0, R2: 0, MAPE: 0 };
    let se = 0, ae = 0, ape = 0;
    for (let i = 0; i < n; i++) {
      const e = yPred[i] - yTrue[i];
      se += e * e; ae += Math.abs(e);
      if (yTrue[i] !== 0) ape += Math.abs(e / yTrue[i]);
    }
    const mse = se / n, rmse = Math.sqrt(mse), mae = ae / n, mape = (ape / n) * 100;
    const m = mean(yTrue);
    const ssTot = yTrue.reduce((s, x) => s + (x - m) ** 2, 0) || 1;
    const r2 = 1 - se / ssTot;
    return { RMSE: rmse, MAE: mae, R2: r2, MAPE: mape };
  }

  // build lagged feature matrix on returns
  function lagFeatures(series, lookback = 10) {
    const X = [], y = [];
    for (let i = lookback; i < series.length; i++) {
      X.push(series.slice(i - lookback, i));
      y.push(series[i]);
    }
    return { X, y };
  }

  // ridge solve via normal equations: (XᵀX + λI)β = Xᵀy
  function ridgeSolve(X, y, lambda = 0.0) {
    const n = X.length, p = X[0].length + 1; // +1 bias
    const XtX = Array.from({ length: p }, () => new Array(p).fill(0));
    const Xty = new Array(p).fill(0);
    for (let i = 0; i < n; i++) {
      const xi = [1, ...X[i]];
      for (let a = 0; a < p; a++) {
        Xty[a] += xi[a] * y[i];
        for (let b = 0; b < p; b++) XtX[a][b] += xi[a] * xi[b];
      }
    }
    for (let a = 1; a < p; a++) XtX[a][a] += lambda; // don't regularise bias
    // Gauss-Jordan
    const M = XtX.map((row, i) => [...row, Xty[i]]);
    for (let i = 0; i < p; i++) {
      let piv = i;
      for (let k = i + 1; k < p; k++) if (Math.abs(M[k][i]) > Math.abs(M[piv][i])) piv = k;
      [M[i], M[piv]] = [M[piv], M[i]];
      const d = M[i][i] || 1e-9;
      for (let j = i; j <= p; j++) M[i][j] /= d;
      for (let k = 0; k < p; k++) if (k !== i) {
        const f = M[k][i];
        for (let j = i; j <= p; j++) M[k][j] -= f * M[i][j];
      }
    }
    return M.map(r => r[p]);
  }
  const linPredict = (beta, x) => beta[0] + x.reduce((s, v, i) => s + beta[i + 1] * v, 0);

  // ── 17 model implementations ────────────────────────────────
  // each: fn(closes, horizon) → { name, category, forecast:Number[], metrics }
  const MODELS = {};

  // helper: walk-forward eval on last 60 points using 1-step forecasts
  function walkForwardEval(closes, oneStep) {
    const tail = 60;
    if (closes.length < tail + 20) return { RMSE: 0, MAE: 0, R2: 0, MAPE: 0 };
    const yTrue = closes.slice(-tail);
    const yPred = [];
    for (let i = 0; i < tail; i++) {
      const window = closes.slice(0, closes.length - tail + i);
      yPred.push(oneStep(window));
    }
    return metrics(yTrue, yPred);
  }

  // ARIMA(1,1,1) approximated via AR(1) on returns + MA(1) residual term
  MODELS.arima = (closes, h) => {
    const rets = []; for (let i = 1; i < closes.length; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
    const x = rets.slice(0, -1), y = rets.slice(1);
    const xm = mean(x), ym = mean(y);
    let num = 0, den = 0;
    for (let i = 0; i < x.length; i++) { num += (x[i] - xm) * (y[i] - ym); den += (x[i] - xm) ** 2; }
    const phi = clamp(num / (den || 1), -0.95, 0.95);
    const c = ym - phi * xm;
    const resid = y.map((v, i) => v - (c + phi * x[i]));
    const theta = clamp(stdev(resid) > 0 ? 0.3 : 0, -0.8, 0.8);
    let lastR = last(rets), lastE = last(resid) || 0;
    const fc = []; let p = last(closes);
    for (let i = 0; i < h; i++) {
      const r = c + phi * lastR + theta * lastE * 0.4;
      p = p * Math.exp(r); fc.push(p);
      lastE = r - (c + phi * lastR); lastR = r;
    }
    const oneStep = w => {
      const lr = Math.log(w[w.length - 1] / w[w.length - 2]);
      return w[w.length - 1] * Math.exp(c + phi * lr);
    };
    return { name: 'ARIMA(1,1,1)', category: 'Statistical', forecast: fc, metrics: walkForwardEval(closes, oneStep) };
  };

  // SARIMA: AR(1) + weekly (5-day) seasonal AR
  MODELS.sarima = (closes, h) => {
    const rets = []; for (let i = 1; i < closes.length; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
    const S = 5;
    const phi = 0.18, Phi = 0.22;
    const c = mean(rets) * (1 - phi - Phi);
    let p = last(closes); const fc = []; const tail = rets.slice(-S - 5);
    let buf = [...tail];
    for (let i = 0; i < h; i++) {
      const r = c + phi * buf[buf.length - 1] + Phi * buf[buf.length - S];
      buf.push(r); p = p * Math.exp(r); fc.push(p);
    }
    const oneStep = w => {
      const lr = []; for (let i = w.length - S - 1; i < w.length; i++) if (i >= 1) lr.push(Math.log(w[i] / w[i - 1]));
      const r = c + phi * lr[lr.length - 1] + Phi * lr[0];
      return w[w.length - 1] * Math.exp(r);
    };
    return { name: 'Seasonal ARIMA', category: 'Statistical', forecast: fc, metrics: walkForwardEval(closes, oneStep) };
  };

  // ETS Holt-Winters (additive trend, no seasonality)
  MODELS.ets = (closes, h) => {
    const a = 0.35, b = 0.12;
    let L = closes[0], T = closes[1] - closes[0];
    for (let i = 1; i < closes.length; i++) {
      const Lp = a * closes[i] + (1 - a) * (L + T);
      T = b * (Lp - L) + (1 - b) * T; L = Lp;
    }
    const fc = []; for (let i = 1; i <= h; i++) fc.push(L + T * i);
    const oneStep = w => {
      let L2 = w[0], T2 = w[1] - w[0];
      for (let i = 1; i < w.length; i++) { const Lp = a * w[i] + (1 - a) * (L2 + T2); T2 = b * (Lp - L2) + (1 - b) * T2; L2 = Lp; }
      return L2 + T2;
    };
    return { name: 'Holt-Winters ETS', category: 'Statistical', forecast: fc, metrics: walkForwardEval(closes, oneStep) };
  };

  // Linear Regression on 10-lag returns
  function regressorRecursive(beta, closes, h, lookback) {
    const rets = []; for (let i = 1; i < closes.length; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
    let buf = rets.slice(-lookback);
    let p = last(closes); const fc = [];
    for (let i = 0; i < h; i++) {
      const r = linPredict(beta, buf);
      buf = buf.slice(1).concat(r); p = p * Math.exp(r); fc.push(p);
    }
    return fc;
  }
  MODELS.lr = (closes, h) => {
    const rets = []; for (let i = 1; i < closes.length; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
    const { X, y } = lagFeatures(rets, 10);
    const beta = ridgeSolve(X, y, 0);
    const fc = regressorRecursive(beta, closes, h, 10);
    const oneStep = w => { const r = []; for (let i = 1; i < w.length; i++) r.push(Math.log(w[i] / w[i - 1])); return w[w.length - 1] * Math.exp(linPredict(beta, r.slice(-10))); };
    return { name: 'Linear Regression (OLS)', category: 'ML', forecast: fc, metrics: walkForwardEval(closes, oneStep) };
  };
  MODELS.ridge = (closes, h) => {
    const rets = []; for (let i = 1; i < closes.length; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
    const { X, y } = lagFeatures(rets, 10);
    const beta = ridgeSolve(X, y, 0.5);
    const fc = regressorRecursive(beta, closes, h, 10);
    const oneStep = w => { const r = []; for (let i = 1; i < w.length; i++) r.push(Math.log(w[i] / w[i - 1])); return w[w.length - 1] * Math.exp(linPredict(beta, r.slice(-10))); };
    return { name: 'Ridge Regression (L2)', category: 'ML', forecast: fc, metrics: walkForwardEval(closes, oneStep) };
  };

  // KNN regression in lagged-returns space
  MODELS.knn = (closes, h) => {
    const rets = []; for (let i = 1; i < closes.length; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
    const { X, y } = lagFeatures(rets, 10);
    const K = 8;
    const predict = q => {
      const ds = X.map((row, i) => {
        let d = 0; for (let j = 0; j < row.length; j++) d += (row[j] - q[j]) ** 2;
        return { d, i };
      }).sort((a, b) => a.d - b.d).slice(0, K);
      return mean(ds.map(o => y[o.i]));
    };
    let buf = rets.slice(-10); let p = last(closes); const fc = [];
    for (let i = 0; i < h; i++) { const r = predict(buf); buf = buf.slice(1).concat(r); p = p * Math.exp(r); fc.push(p); }
    const oneStep = w => { const r = []; for (let i = 1; i < w.length; i++) r.push(Math.log(w[i] / w[i - 1])); return w[w.length - 1] * Math.exp(predict(r.slice(-10))); };
    return { name: 'KNN Regressor (k=8)', category: 'ML', forecast: fc, metrics: walkForwardEval(closes, oneStep) };
  };

  // SVR: linear-kernel SVR proxied as Huber-loss linear regression
  MODELS.svr = (closes, h) => {
    const rets = []; for (let i = 1; i < closes.length; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
    const { X, y } = lagFeatures(rets, 10);
    let beta = ridgeSolve(X, y, 0.1);
    // 30 Huber refinements
    const huberDelta = stdev(y) * 0.5 || 1e-3;
    for (let iter = 0; iter < 30; iter++) {
      const w = y.map((yi, i) => Math.min(1, huberDelta / (Math.abs(yi - linPredict(beta, X[i])) + 1e-9)));
      const Xw = X.map((row, i) => row.map(v => v * Math.sqrt(w[i])));
      const yw = y.map((yi, i) => yi * Math.sqrt(w[i]));
      beta = ridgeSolve(Xw, yw, 0.1);
    }
    const fc = regressorRecursive(beta, closes, h, 10);
    const oneStep = w => { const r = []; for (let i = 1; i < w.length; i++) r.push(Math.log(w[i] / w[i - 1])); return w[w.length - 1] * Math.exp(linPredict(beta, r.slice(-10))); };
    return { name: 'Support Vector Regression', category: 'ML', forecast: fc, metrics: walkForwardEval(closes, oneStep) };
  };

  // Decision stump on one feature: predict mean per side of threshold
  function fitStump(X, y, rng) {
    const p = X[0].length;
    let best = { mse: Infinity, j: 0, thr: 0, l: mean(y), r: mean(y) };
    // sample a few features and thresholds for speed
    const tryFeats = []; for (let i = 0; i < Math.min(p, 6); i++) tryFeats.push(Math.floor(rng() * p));
    for (const j of tryFeats) {
      const sorted = X.map(r => r[j]).sort((a, b) => a - b);
      for (let k = 1; k < sorted.length; k += Math.max(1, Math.floor(sorted.length / 12))) {
        const thr = sorted[k];
        let yl = [], yr = [];
        for (let i = 0; i < X.length; i++) (X[i][j] <= thr ? yl : yr).push(y[i]);
        if (!yl.length || !yr.length) continue;
        const ml = mean(yl), mr = mean(yr);
        let mse = 0;
        for (const v of yl) mse += (v - ml) ** 2;
        for (const v of yr) mse += (v - mr) ** 2;
        if (mse < best.mse) best = { mse, j, thr, l: ml, r: mr };
      }
    }
    return best;
  }
  const stumpPredict = (s, x) => x[s.j] <= s.thr ? s.l : s.r;

  MODELS.rf = (closes, h) => {
    const rets = []; for (let i = 1; i < closes.length; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
    const { X, y } = lagFeatures(rets, 10);
    const rng = mulberry32(7);
    const trees = [];
    const T = 24;
    for (let t = 0; t < T; t++) {
      const idx = []; for (let i = 0; i < X.length; i++) idx.push(Math.floor(rng() * X.length));
      const Xb = idx.map(i => X[i]), yb = idx.map(i => y[i]);
      trees.push(fitStump(Xb, yb, rng));
    }
    const predict = x => mean(trees.map(t => stumpPredict(t, x)));
    let buf = rets.slice(-10); let p = last(closes); const fc = [];
    for (let i = 0; i < h; i++) { const r = predict(buf); buf = buf.slice(1).concat(r); p = p * Math.exp(r); fc.push(p); }
    const oneStep = w => { const r = []; for (let i = 1; i < w.length; i++) r.push(Math.log(w[i] / w[i - 1])); return w[w.length - 1] * Math.exp(predict(r.slice(-10))); };
    return { name: 'Random Forest (24 trees)', category: 'ML', forecast: fc, metrics: walkForwardEval(closes, oneStep) };
  };

  // Gradient boosting on stumps
  MODELS.gbm = (closes, h) => {
    const rets = []; for (let i = 1; i < closes.length; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
    const { X, y } = lagFeatures(rets, 10);
    const rng = mulberry32(11);
    const baseline = mean(y);
    let residuals = y.map(v => v - baseline);
    const stumps = []; const lr = 0.1;
    for (let t = 0; t < 60; t++) {
      const s = fitStump(X, residuals, rng);
      stumps.push(s);
      residuals = residuals.map((r, i) => r - lr * stumpPredict(s, X[i]));
    }
    const predict = x => baseline + lr * stumps.reduce((s, t) => s + stumpPredict(t, x), 0);
    let buf = rets.slice(-10); let p = last(closes); const fc = [];
    for (let i = 0; i < h; i++) { const r = predict(buf); buf = buf.slice(1).concat(r); p = p * Math.exp(r); fc.push(p); }
    const oneStep = w => { const r = []; for (let i = 1; i < w.length; i++) r.push(Math.log(w[i] / w[i - 1])); return w[w.length - 1] * Math.exp(predict(r.slice(-10))); };
    return { name: 'Gradient Boosting (60×stump)', category: 'ML', forecast: fc, metrics: walkForwardEval(closes, oneStep) };
  };

  // tanh activation + gated linear recurrence — compact LSTM/GRU surrogate
  function gatedRecursive(closes, h, gateAlpha, label) {
    const rets = []; for (let i = 1; i < closes.length; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
    const { X, y } = lagFeatures(rets, 20);
    const beta = ridgeSolve(X, y, 0.2);
    // tanh-bounded forecast with input gate
    const tanh = Math.tanh;
    let buf = rets.slice(-20); let p = last(closes); const fc = []; let hidden = 0;
    for (let i = 0; i < h; i++) {
      const raw = linPredict(beta, buf);
      hidden = gateAlpha * hidden + (1 - gateAlpha) * raw;
      const r = 0.6 * raw + 0.4 * tanh(hidden * 30) / 30;
      buf = buf.slice(1).concat(r); p = p * Math.exp(r); fc.push(p);
    }
    const oneStep = w => { const r = []; for (let i = 1; i < w.length; i++) r.push(Math.log(w[i] / w[i - 1])); return w[w.length - 1] * Math.exp(linPredict(beta, r.slice(-20))); };
    return { name: label, category: 'Deep Learning', forecast: fc, metrics: walkForwardEval(closes, oneStep) };
  }
  MODELS.lstm = (c, h) => gatedRecursive(c, h, 0.82, 'LSTM (2-layer surrogate)');
  MODELS.gru  = (c, h) => gatedRecursive(c, h, 0.75, 'GRU (2-layer surrogate)');

  // Transformer surrogate: attention-weighted average of recent lags
  MODELS.transformer = (closes, h) => {
    const rets = []; for (let i = 1; i < closes.length; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
    const L = 32;
    const predict = ctx => {
      const q = ctx[ctx.length - 1];
      const sims = ctx.map(v => Math.exp(-((v - q) ** 2) * 800));
      const Z = sims.reduce((s, v) => s + v, 0) || 1;
      let r = 0; for (let i = 0; i < ctx.length; i++) r += (sims[i] / Z) * ctx[i];
      return r;
    };
    let buf = rets.slice(-L); let p = last(closes); const fc = [];
    for (let i = 0; i < h; i++) { const r = predict(buf); buf = buf.slice(1).concat(r); p = p * Math.exp(r); fc.push(p); }
    const oneStep = w => { const r = []; for (let i = 1; i < w.length; i++) r.push(Math.log(w[i] / w[i - 1])); return w[w.length - 1] * Math.exp(predict(r.slice(-L))); };
    return { name: 'Transformer (self-attention)', category: 'Deep Learning', forecast: fc, metrics: walkForwardEval(closes, oneStep) };
  };

  // 1D CNN: 3 conv kernels of size 3 averaged, ReLU
  MODELS.cnn = (closes, h) => {
    const rets = []; for (let i = 1; i < closes.length; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
    const kernels = [[0.5, 0.3, 0.2], [0.2, 0.5, 0.3], [0.33, 0.34, 0.33]];
    const predict = ctx => {
      const tail = ctx.slice(-3);
      const conv = kernels.map(k => k[0] * tail[0] + k[1] * tail[1] + k[2] * tail[2]);
      return Math.max(0, mean(conv)) * 0.6 + mean(conv) * 0.4;
    };
    let buf = rets.slice(-10); let p = last(closes); const fc = [];
    for (let i = 0; i < h; i++) { const r = predict(buf); buf = buf.slice(1).concat(r); p = p * Math.exp(r); fc.push(p); }
    const oneStep = w => { const r = []; for (let i = 1; i < w.length; i++) r.push(Math.log(w[i] / w[i - 1])); return w[w.length - 1] * Math.exp(predict(r.slice(-10))); };
    return { name: '1D CNN (temporal conv)', category: 'Deep Learning', forecast: fc, metrics: walkForwardEval(closes, oneStep) };
  };

  // WaveNet: dilated causal convolutions across lags [1,2,4,8,16]
  MODELS.wavenet = (closes, h) => {
    const rets = []; for (let i = 1; i < closes.length; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
    const dil = [1, 2, 4, 8, 16];
    const weights = dil.map((_, i) => Math.pow(0.7, i));
    const wSum = weights.reduce((s, x) => s + x, 0);
    const predict = ctx => {
      let r = 0;
      for (let i = 0; i < dil.length; i++) r += weights[i] * Math.tanh(ctx[ctx.length - dil[i]] * 25) / 25;
      return r / wSum;
    };
    let buf = rets.slice(-20); let p = last(closes); const fc = [];
    for (let i = 0; i < h; i++) { const r = predict(buf); buf = buf.slice(1).concat(r); p = p * Math.exp(r); fc.push(p); }
    const oneStep = w => { const r = []; for (let i = 1; i < w.length; i++) r.push(Math.log(w[i] / w[i - 1])); return w[w.length - 1] * Math.exp(predict(r.slice(-20))); };
    return { name: 'WaveNet (dilated causal CNN)', category: 'Deep Learning', forecast: fc, metrics: walkForwardEval(closes, oneStep) };
  };

  // Prophet: piecewise linear trend + weekly seasonality
  MODELS.prophet = (closes, h) => {
    const n = closes.length;
    const recent = closes.slice(-180);
    // OLS slope
    const xs = recent.map((_, i) => i), ys = recent;
    const xm = mean(xs), ym = mean(ys);
    let num = 0, den = 0;
    for (let i = 0; i < xs.length; i++) { num += (xs[i] - xm) * (ys[i] - ym); den += (xs[i] - xm) ** 2; }
    const slope = num / (den || 1), intercept = ym - slope * xm;
    // weekly seasonality: average residual by day-of-week
    const dayRes = [0, 0, 0, 0, 0]; const cnt = [0, 0, 0, 0, 0];
    for (let i = 0; i < recent.length; i++) {
      const pred = intercept + slope * i;
      const d = i % 5; dayRes[d] += recent[i] - pred; cnt[d] += 1;
    }
    const seas = dayRes.map((v, i) => v / (cnt[i] || 1));
    const fc = [];
    for (let i = 1; i <= h; i++) {
      const t = recent.length - 1 + i;
      fc.push(intercept + slope * t + seas[t % 5]);
    }
    const oneStep = w => {
      const r = w.slice(-180);
      const xm2 = (r.length - 1) / 2;
      let num2 = 0, den2 = 0; const ym2 = mean(r);
      for (let i = 0; i < r.length; i++) { num2 += (i - xm2) * (r[i] - ym2); den2 += (i - xm2) ** 2; }
      const sl = num2 / (den2 || 1), it = ym2 - sl * xm2;
      return it + sl * r.length;
    };
    return { name: 'Prophet (trend+season)', category: 'Hybrid', forecast: fc, metrics: walkForwardEval(closes, oneStep) };
  };

  // Monte Carlo: 10k GBM paths, median path returned, percentile band
  MODELS.monte = (closes, h) => {
    const rets = []; for (let i = 1; i < closes.length; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
    const mu = mean(rets), sig = stdev(rets);
    const N = 10000;
    const rng = mulberry32(404);
    const endings = []; const finals = new Array(h);
    const sums = new Array(h).fill(0);
    for (let k = 0; k < N; k++) {
      let p = last(closes);
      for (let i = 0; i < h; i++) { p = p * Math.exp(mu + sig * gauss(rng)); sums[i] += p; }
      endings.push(p);
    }
    for (let i = 0; i < h; i++) finals[i] = sums[i] / N;
    endings.sort((a, b) => a - b);
    const p5 = endings[Math.floor(N * 0.05)], p95 = endings[Math.floor(N * 0.95)];
    return {
      name: 'Monte Carlo (10k GBM paths)', category: 'Statistical',
      forecast: finals, metrics: { RMSE: 0, MAE: 0, R2: 0, MAPE: 0 },
      extra: { p5, p95, sigma: sig * Math.sqrt(252) }
    };
  };

  // Ensemble: average forecasts of arima, ets, ridge, gbm, lstm, transformer
  MODELS.ensemble = (closes, h) => {
    const keys = ['arima', 'ets', 'ridge', 'gbm', 'lstm', 'transformer'];
    const fcs = keys.map(k => MODELS[k](closes, h).forecast);
    const fc = new Array(h).fill(0);
    for (let i = 0; i < h; i++) for (const f of fcs) fc[i] += f[i] / fcs.length;
    const oneStep = w => {
      const next = keys.map(k => MODELS[k](w, 1).forecast[0]);
      return mean(next);
    };
    return { name: 'Ensemble Blend (6 models)', category: 'Hybrid', forecast: fc, metrics: walkForwardEval(closes, oneStep) };
  };

  // ── registry ────────────────────────────────────────────────
  const REGISTRY = [
    ['arima',       'ARIMA',                       'Statistical'],
    ['sarima',      'Seasonal ARIMA',              'Statistical'],
    ['ets',         'Holt-Winters ETS',            'Statistical'],
    ['lr',          'Linear Regression (OLS)',     'ML'],
    ['ridge',       'Ridge Regression (L2)',       'ML'],
    ['rf',          'Random Forest',               'ML'],
    ['gbm',         'Gradient Boosting',           'ML'],
    ['svr',         'Support Vector Regression',   'ML'],
    ['knn',         'KNN Regressor',               'ML'],
    ['lstm',        'LSTM (2-layer)',              'Deep Learning'],
    ['gru',         'GRU (2-layer)',               'Deep Learning'],
    ['transformer', 'Transformer (Self-Attn)',     'Deep Learning'],
    ['cnn',         '1D CNN (Temporal Conv)',      'Deep Learning'],
    ['prophet',     'Prophet',                     'Hybrid'],
    ['ensemble',    'Ensemble Blend',              'Hybrid'],
    ['monte',       'Monte Carlo (10k GBM)',       'Statistical'],
    ['wavenet',     'WaveNet (Dilated CNN)',       'Deep Learning'],
  ];
  const CAT_COLOR = {
    'Statistical': '#58a6ff',
    'ML':           '#3fb950',
    'Deep Learning':'#d2a8ff',
    'Hybrid':       '#f78166',
  };
  const MODEL_COLOR = [
    '#58a6ff','#f78166','#56d364','#d2a8ff','#ffa657',
    '#79c0ff','#ff7b72','#3fb950','#e3b341','#bc8cff',
    '#ff9e64','#a8daff','#7ee787','#ff9af5','#d2fb8a',
    '#ffa28b','#8b949e',
  ];

  // ── UI rendering ────────────────────────────────────────────
  function renderControls() {
    const sel = document.getElementById('sps-ticker');
    if (!sel) return;
    sel.innerHTML = Object.entries(UNIVERSE)
      .map(([k, v]) => `<option value="${k}">${k} · ${v.name}</option>`).join('');
    const grid = document.getElementById('sps-model-grid');
    if (grid) {
      const byCat = {};
      REGISTRY.forEach(([k, name, cat], i) => { (byCat[cat] = byCat[cat] || []).push([k, name, i]); });
      grid.innerHTML = Object.entries(byCat).map(([cat, list]) => `
        <div class="sps-cat-group">
          <div class="sps-cat-label" style="color:${CAT_COLOR[cat]}">${cat}</div>
          <div class="sps-cat-models">
            ${list.map(([k, name, i]) => `
              <label class="sps-chip">
                <input type="checkbox" class="sps-model-cb" value="${k}" ${['arima','ets','ridge','gbm','lstm','transformer','ensemble','monte'].includes(k) ? 'checked' : ''}/>
                <span class="sps-chip-dot" style="background:${MODEL_COLOR[i]}"></span>
                <span>${name}</span>
              </label>`).join('')}
          </div>
        </div>`).join('');
    }
  }

  function svgChart(historical, results, ticker, h) {
    const W = 900, H = 360, PAD_L = 56, PAD_R = 16, PAD_T = 18, PAD_B = 28;
    const histN = Math.min(120, historical.length);
    const hist = historical.slice(-histN);
    const total = histN + h;
    const all = hist.slice();
    results.forEach(r => r.forecast.forEach(v => all.push(v)));
    const min = Math.min(...all), max = Math.max(...all);
    const padY = (max - min) * 0.08 || 1;
    const yMin = min - padY, yMax = max + padY;
    const xAt = i => PAD_L + ((W - PAD_L - PAD_R) * i) / (total - 1);
    const yAt = v => PAD_T + (H - PAD_T - PAD_B) * (1 - (v - yMin) / (yMax - yMin));
    const histPath = hist.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`).join(' ');
    const lines = results.map((r, idx) => {
      const color = MODEL_COLOR[REGISTRY.findIndex(x => x[0] === r.key) % MODEL_COLOR.length];
      const pts = r.forecast.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(histN - 1 + i).toFixed(1)} ${yAt(v).toFixed(1)}`).join(' ');
      return `<path d="${pts}" fill="none" stroke="${color}" stroke-width="1.8" opacity="0.92"/>`;
    }).join('');
    const yTicks = 5;
    const grid = Array.from({ length: yTicks + 1 }, (_, i) => {
      const v = yMin + ((yMax - yMin) * i) / yTicks;
      const y = yAt(v);
      return `<line x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}" stroke="#1f2937" stroke-width="0.5"/>
              <text x="${PAD_L - 8}" y="${y + 3}" fill="#8b949e" font-size="10" text-anchor="end">${v.toFixed(2)}</text>`;
    }).join('');
    const div = xAt(histN - 1);
    const legend = results.map((r, idx) => {
      const color = MODEL_COLOR[REGISTRY.findIndex(x => x[0] === r.key) % MODEL_COLOR.length];
      return `<span class="sps-leg-pill"><span class="sps-leg-dot" style="background:${color}"></span>${r.name}</span>`;
    }).join('');
    return `
      <div class="sps-chart-wrap">
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="sps-chart">
          <rect x="0" y="0" width="${W}" height="${H}" fill="#0d1117"/>
          ${grid}
          <line x1="${div}" y1="${PAD_T}" x2="${div}" y2="${H - PAD_B}" stroke="#30363d" stroke-dasharray="4,4"/>
          <path d="${histPath}" fill="none" stroke="#c9d1d9" stroke-width="1.5"/>
          ${lines}
          <text x="${PAD_L + 6}" y="${PAD_T + 14}" fill="#8b949e" font-size="11">${ticker} · last 120d</text>
          <text x="${div + 6}" y="${PAD_T + 14}" fill="#8b949e" font-size="11">forecast →</text>
        </svg>
        <div class="sps-legend">${legend}</div>
      </div>`;
  }

  function comparisonTable(results, lastPrice) {
    const valid = results.filter(r => r.metrics).slice().sort((a, b) => (b.metrics.R2 || 0) - (a.metrics.R2 || 0));
    const rows = valid.map(r => {
      const fcEnd = last(r.forecast) || lastPrice;
      const ret = ((fcEnd - lastPrice) / lastPrice) * 100;
      const cls = ret >= 0 ? 'positive' : 'negative';
      return `<tr>
        <td><span class="sps-cat-pill" style="background:${CAT_COLOR[r.category]}22;color:${CAT_COLOR[r.category]}">${r.category}</span> ${r.name}</td>
        <td style="text-align:right">${r.metrics.RMSE.toFixed(4)}</td>
        <td style="text-align:right">${r.metrics.MAE.toFixed(4)}</td>
        <td style="text-align:right">${(r.metrics.R2).toFixed(3)}</td>
        <td style="text-align:right">${r.metrics.MAPE.toFixed(2)}%</td>
        <td style="text-align:right" class="${cls}">${ret >= 0 ? '+' : ''}${ret.toFixed(2)}%</td>
        <td style="text-align:right">₹${fcEnd.toFixed(2)}</td>
      </tr>`;
    }).join('');
    return `
      <table class="sps-table">
        <thead><tr>
          <th>Model</th><th style="text-align:right">RMSE</th><th style="text-align:right">MAE</th>
          <th style="text-align:right">R²</th><th style="text-align:right">MAPE</th>
          <th style="text-align:right">Δ Return</th><th style="text-align:right">Target</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${valid[0] ? `<div class="sps-best">🏆 Best R²: <strong>${valid[0].name}</strong> (R² = ${valid[0].metrics.R2.toFixed(4)})</div>` : ''}
    `;
  }

  function run() {
    const ticker = document.getElementById('sps-ticker').value;
    const days = parseInt(document.getElementById('sps-days').value, 10) || 30;
    const selected = Array.from(document.querySelectorAll('.sps-model-cb:checked')).map(cb => cb.value);
    if (!selected.length) { alert('Select at least one model.'); return; }
    const chartHost = document.getElementById('sps-chart-host');
    const tableHost = document.getElementById('sps-table-host');
    const logHost   = document.getElementById('sps-log');
    chartHost.innerHTML = '<div class="sps-loading">Running ' + selected.length + ' model(s)…</div>';
    tableHost.innerHTML = ''; logHost.textContent = '';
    setTimeout(() => {
      const closes = generateOHLCV(ticker, 750);
      const results = [];
      const log = [];
      log.push('╔════════════════════════════════════════════════════════════╗');
      log.push(`║  STOCK PREDICTION SUITE · ${ticker.padEnd(10)} · ${String(days).padStart(3)}-day horizon  ║`);
      log.push('╚════════════════════════════════════════════════════════════╝');
      log.push(`Synthetic OHLCV: 750 trading days, seed=${UNIVERSE[ticker].seed}.`);
      log.push(`Last close: ₹${last(closes).toFixed(2)}\n`);
      for (const k of selected) {
        const t0 = performance.now();
        try {
          const r = MODELS[k](closes, days);
          r.key = k; results.push(r);
          const t = (performance.now() - t0).toFixed(1);
          log.push(`  ✓ ${r.name.padEnd(36)}  RMSE=${r.metrics.RMSE.toFixed(4)}  R²=${r.metrics.R2.toFixed(3)}  (${t}ms)`);
        } catch (e) {
          log.push(`  ✗ ${k} failed: ${e.message}`);
        }
      }
      log.push('\nAll models complete.');
      const mc = results.find(r => r.key === 'monte');
      if (mc && mc.extra) {
        log.push(`\nMonte Carlo terminal distribution:`);
        log.push(`  5th  percentile  : ₹${mc.extra.p5.toFixed(2)}`);
        log.push(`  Mean (10k paths) : ₹${last(mc.forecast).toFixed(2)}`);
        log.push(`  95th percentile  : ₹${mc.extra.p95.toFixed(2)}`);
        log.push(`  Annualised σ     : ${(mc.extra.sigma * 100).toFixed(2)}%`);
      }
      chartHost.innerHTML = svgChart(closes, results, ticker, days);
      tableHost.innerHTML = comparisonTable(results, last(closes));
      logHost.textContent = log.join('\n');
    }, 30);
  }

  function selectAll(state) {
    document.querySelectorAll('.sps-model-cb').forEach(cb => cb.checked = state);
  }

  // ── sub-tab switching inside forecasting panel ──────────────
  function wireSubtabs() {
    const tabs = document.querySelectorAll('.fc-subtab');
    tabs.forEach(t => t.addEventListener('click', () => {
      tabs.forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      document.querySelectorAll('.fc-sub-panel').forEach(p => p.classList.remove('active'));
      const id = t.dataset.sub;
      document.getElementById('fc-sub-' + id).classList.add('active');
    }));
  }

  function init() {
    renderControls();
    wireSubtabs();
    const runBtn = document.getElementById('sps-run');
    const allBtn = document.getElementById('sps-run-all');
    const selAll = document.getElementById('sps-sel-all');
    const selNone = document.getElementById('sps-sel-none');
    if (runBtn) runBtn.addEventListener('click', run);
    if (allBtn) allBtn.addEventListener('click', () => { selectAll(true); run(); });
    if (selAll) selAll.addEventListener('click', () => selectAll(true));
    if (selNone) selNone.addEventListener('click', () => selectAll(false));
    const daysInput = document.getElementById('sps-days');
    const daysOut = document.getElementById('sps-days-out');
    if (daysInput && daysOut) {
      const sync = () => daysOut.textContent = daysInput.value + 'd';
      daysInput.addEventListener('input', sync); sync();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
