js_code = """

// ==========================================
// MUTUAL FUNDS TRACKING
// ==========================================
const MUTUAL_FUNDS_DB = [
  { name: 'ICICI Pru Bharat 22 FOF Dir', category: 'Large Cap', rating: 5, nav: 34.55, return3y: 22.45 },
  { name: 'Invesco India Largecap Dir', category: 'Large Cap', rating: 5, nav: 82.30, return3y: 15.24 },
  { name: 'DSP Nifty 50 Equal Weight Dir', category: 'Large Cap', rating: 5, nav: 26.78, return3y: 14.67 },
  { name: 'WhiteOak Capital Large Cap Dir', category: 'Large Cap', rating: 5, nav: 15.05, return3y: 14.59 },
  { name: 'Nippon India Large Cap Dir', category: 'Large Cap', rating: 5, nav: 97.24, return3y: 14.27 },
  { name: 'ICICI Pru Retirement Pure Eq', category: 'Flexi Cap', rating: 5, nav: 37.73, return3y: 23.87 },
  { name: 'ITI Flexi Cap Dir', category: 'Flexi Cap', rating: 5, nav: 19.35, return3y: 19.99 },
  { name: 'ICICI Pru Focused Equity Dir', category: 'Flexi Cap', rating: 5, nav: 103.33, return3y: 18.97 },
  { name: 'ICICI Pru Diversified Equity', category: 'Flexi Cap', rating: 5, nav: 31.31, return3y: 17.83 },
  { name: 'HDFC Flexi Cap Dir', category: 'Flexi Cap', rating: 5, nav: 2119.56, return3y: 17.56 },
  { name: 'WhiteOak Capital Mid Cap Dir', category: 'Mid Cap', rating: 5, nav: 21.86, return3y: 25.54 },
  { name: 'Edelweiss Mid Cap Dir', category: 'Mid Cap', rating: 5, nav: 123.01, return3y: 24.37 },
  { name: 'Nippon India Growth Mid Cap', category: 'Mid Cap', rating: 5, nav: 4777.15, return3y: 23.61 },
  { name: 'HDFC Mid Cap Dir', category: 'Mid Cap', rating: 5, nav: 220.32, return3y: 22.01 },
  { name: 'HSBC Midcap Dir', category: 'Mid Cap', rating: 4, nav: 505.54, return3y: 27.80 }
];

function renderMutualFunds() {
  const tbody = document.getElementById('mf-tbody');
  if (!tbody) return;
  tbody.innerHTML = MUTUAL_FUNDS_DB.map(mf => {
    return `
      <tr>
        <td style="font-weight: 600;">${mf.name}</td>
        <td style="color: var(--text-secondary); font-family: var(--font-mono); font-size: 11px;">${mf.category}</td>
        <td style="color: var(--amber);">${'★'.repeat(mf.rating)}</td>
        <td style="font-family: var(--font-mono);">₹${mf.nav.toFixed(2)}</td>
        <td class="positive" style="font-family: var(--font-mono);">+${mf.return3y.toFixed(2)}%</td>
      </tr>
    `;
  }).join('');
}

// Ensure mutual funds render when tab is opened
document.getElementById('tab-mutualfunds')?.addEventListener('click', () => {
  renderMutualFunds();
});

// ==========================================
// STOCHASTIC FORECASTING & MONTE CARLO
// ==========================================
let forecastingChart = null;

function runMonteCarloSim() {
  const S0 = State.indicesPrices.NIFTY.price || 22500; // Starting NIFTY price
  const mu = 0.12;  // 12% expected annual return
  const sigma = 0.185; // 18.5% historical volatility
  const T = 1; // 1 Year
  const steps = 252; // Trading days
  const dt = T / steps;
  const numPaths = 50;
  
  const paths = [];
  const finalPrices = [];

  for (let i = 0; i < numPaths; i++) {
    let path = [S0];
    let currentS = S0;
    for (let t = 1; t <= steps; t++) {
      // Box-Muller transform for normally distributed random variable Z
      let u1 = Math.random();
      let u2 = Math.random();
      let Z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      
      // Geometric Brownian Motion formula
      currentS = currentS * Math.exp((mu - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * Z);
      path.push(currentS);
    }
    paths.push(path);
    finalPrices.push(currentS);
  }

  // Calculate stats
  finalPrices.sort((a, b) => a - b);
  const p5 = finalPrices[Math.floor(numPaths * 0.05)];
  const p95 = finalPrices[Math.floor(numPaths * 0.95)];
  const ev = finalPrices.reduce((a, b) => a + b, 0) / numPaths;

  document.getElementById('fc-ev').textContent = '₹' + ev.toFixed(2);
  document.getElementById('fc-p95').textContent = '₹' + p95.toFixed(2);
  document.getElementById('fc-p5').textContent = '₹' + p5.toFixed(2);

  renderForecastingChart(paths);
}

function renderForecastingChart(paths) {
  const ctx = document.getElementById('forecasting-canvas');
  if (!ctx) return;
  
  if (forecastingChart) {
    forecastingChart.destroy();
  }

  const datasets = paths.map((path, idx) => {
    // Make the Expected Value (mean) path stand out if we wanted to, but here all paths are faint
    return {
      label: 'Path ' + idx,
      data: path,
      borderColor: 'rgba(0, 212, 255, 0.15)',
      borderWidth: 1,
      pointRadius: 0,
      fill: false,
      tension: 0.1
    };
  });

  const labels = Array.from({length: 253}, (_, i) => 'Day ' + i);

  forecastingChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      scales: {
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: 'var(--text-dim)', font: { family: 'var(--font-mono)' } }
        },
        x: {
          grid: { display: false },
          ticks: { maxTicksLimit: 12, color: 'var(--text-dim)' }
        }
      }
    }
  });
}

document.getElementById('run-monte-carlo-btn')?.addEventListener('click', runMonteCarloSim);
document.getElementById('tab-forecasting')?.addEventListener('click', () => {
  // Auto run once if not run yet
  if (!forecastingChart) {
    setTimeout(runMonteCarloSim, 300);
  }
});

"""

with open('app.js', 'a', encoding='utf-8') as f:
    f.write(js_code)

print('Appended logic successfully.')
