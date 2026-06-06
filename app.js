/* ============================================================
   DEXTER — Bio-Algorithmic Trading Engine
   Core Application Logic
   ============================================================ */

'use strict';

// ─── State ───────────────────────────────────────────────────────
window.State = {
  arousal: 0.23,
  hrv: 72,
  sleepQuality: 0.82,
  cursorSigma: 0.15,
  lambda: 0.63,
  dexterScore: 87,
  circuitBreakerActive: false,
  countdownInterval: null,
  activeTab: 'dashboard',
  pnlHistory: [],
  hrvHistory: [],
  lambdaHistory: [],

  // Backtester State
  btState: 'idle',
  btProgress: 0,
  btInterval: null,
  btTrades: [],
  btCurrentIndex: 0,
  btStats: {
    tradesCount: 0,
    stressOverlap: 0,
    savedCapital: 0,
    cogAlpha: 0.0
  },

  // Pitch Deck State
  pitchSlideIndex: 0,

  // Market Scanner & Watchlist State
  currentMarketFilter: 'ALL',
  currentMarketSearch: '',
  myWatchlist: ['RELIANCE', 'INFY', 'SBIN'],
  marketFeedSource: 'Connecting...',
  marketRegime: 'nominal', // 'nominal', 'gapdown', 'crash', 'hedge'
  lastActualPrices: {},   // Cache for actual prices
  indicesPrices: {
    NIFTY: { price: 23366.70, chg: -0.21 },
    SENSEX: { price: 74243.34, chg: -0.16 }
  },
  putsHedged: false,

  // Demat Gateway State
  dematConnected: false,
  bioGuardEnabled: true,
  brokerType: 'zerodha',
  freeCapital: 500000,
  usedMargin: 0,
  collateral: 320000
};

// ─── Market Database Constituents ─────────────────────────────────
const MARKET_DIRECTORY = [
  { sym: 'BAJFINANCE', name: 'BAJFINANCE', price: 889.55, chg: 1.73, vol: 15420, bid: 888.66, ask: 890.44, idx: 'NIFTY 500' },
  { sym: 'TCS', name: 'TCS', price: 2196.0, chg: -2.01, vol: 15420, bid: 2193.8, ask: 2198.2, idx: 'NIFTY 500' },
  { sym: 'INFY', name: 'INFY', price: 1199.0, chg: -0.19, vol: 15420, bid: 1197.8, ask: 1200.2, idx: 'NIFTY 500' },
  { sym: 'IDEA', name: 'IDEA', price: 14.96, chg: 0.2, vol: 15420, bid: 14.95, ask: 14.97, idx: 'NIFTY 500' },
  { sym: 'OLAELEC', name: 'OLAELEC', price: 45.0, chg: 3.88, vol: 15420, bid: 44.95, ask: 45.04, idx: 'NIFTY 500' },
  { sym: 'AXISBANK', name: 'AXISBANK', price: 1273.3, chg: 1.6, vol: 15420, bid: 1272.03, ask: 1274.57, idx: 'NIFTY 500' },
  { sym: 'NETWEB', name: 'NETWEB', price: 4670.0, chg: -5.35, vol: 15420, bid: 4665.33, ask: 4674.67, idx: 'NIFTY 500' },
  { sym: 'ETERNAL', name: 'ETERNAL', price: 256.75, chg: 0.94, vol: 15420, bid: 256.49, ask: 257.01, idx: 'NIFTY 500' },
  { sym: 'ADANIENSOL', name: 'ADANIENSOL', price: 1578.8, chg: 3.87, vol: 15420, bid: 1577.22, ask: 1580.38, idx: 'NIFTY 500' },
  { sym: 'WIPRO', name: 'WIPRO', price: 198.05, chg: -3.07, vol: 15420, bid: 197.85, ask: 198.25, idx: 'NIFTY 500' },
  { sym: 'TEJASNET', name: 'TEJASNET', price: 579.1, chg: -3.8, vol: 15420, bid: 578.52, ask: 579.68, idx: 'NIFTY 500' },
  { sym: 'HFCL', name: 'HFCL', price: 187.23, chg: -5.0, vol: 15420, bid: 187.04, ask: 187.42, idx: 'NIFTY 500' },
  { sym: 'ATGL', name: 'ATGL', price: 761.6, chg: 2.36, vol: 15420, bid: 760.84, ask: 762.36, idx: 'NIFTY 500' },
  { sym: 'TATASTEEL', name: 'TATASTEEL', price: 206.8, chg: -1.79, vol: 15420, bid: 206.59, ask: 207.01, idx: 'NIFTY 500' },
  { sym: 'ADANIPOWER', name: 'ADANIPOWER', price: 232.7, chg: 1.16, vol: 15420, bid: 232.47, ask: 232.93, idx: 'NIFTY 500' },
  { sym: 'BHARTIARTL', name: 'BHARTIARTL', price: 1798.0, chg: -1.15, vol: 15420, bid: 1796.2, ask: 1799.8, idx: 'NIFTY 500' },
  { sym: 'SCI', name: 'SCI', price: 302.65, chg: -0.53, vol: 15420, bid: 302.35, ask: 302.95, idx: 'NIFTY 500' },
  { sym: 'BHEL', name: 'BHEL', price: 386.55, chg: -0.68, vol: 15420, bid: 386.16, ask: 386.94, idx: 'NIFTY 500' },
  { sym: 'POLICYBZR', name: 'POLICYBZR', price: 1540.0, chg: 0.24, vol: 15420, bid: 1538.46, ask: 1541.54, idx: 'NIFTY 500' },
  { sym: 'VEDL', name: 'VEDL', price: 317.05, chg: -3.19, vol: 15420, bid: 316.73, ask: 317.37, idx: 'NIFTY 500' },
  { sym: 'WOCKPHARMA', name: 'WOCKPHARMA', price: 1924.2, chg: -7.17, vol: 15420, bid: 1922.28, ask: 1926.12, idx: 'NIFTY 500' },
  { sym: 'CANBK', name: 'CANBK', price: 136.4, chg: 2.46, vol: 15420, bid: 136.26, ask: 136.54, idx: 'NIFTY 500' },
  { sym: 'IFCI', name: 'IFCI', price: 79.61, chg: -2.89, vol: 15420, bid: 79.53, ask: 79.69, idx: 'NIFTY 500' },
  { sym: 'SHRIRAMFIN', name: 'SHRIRAMFIN', price: 922.6, chg: 0.74, vol: 15420, bid: 921.68, ask: 923.52, idx: 'NIFTY 500' },
  { sym: 'M&M', name: 'M&M', price: 3039.0, chg: 0.76, vol: 15420, bid: 3035.96, ask: 3042.04, idx: 'NIFTY 500' },
  { sym: 'LT', name: 'LT', price: 3962.1, chg: 0.51, vol: 15420, bid: 3958.14, ask: 3966.06, idx: 'NIFTY 500' },
  { sym: 'HINDALCO', name: 'HINDALCO', price: 1092.0, chg: -2.99, vol: 15420, bid: 1090.91, ask: 1093.09, idx: 'NIFTY 500' },
  { sym: 'DATAPATTNS', name: 'DATAPATTNS', price: 4215.0, chg: 0.54, vol: 15420, bid: 4210.78, ask: 4219.21, idx: 'NIFTY 500' },
  { sym: 'JYOTICNC', name: 'JYOTICNC', price: 635.4, chg: 6.25, vol: 15420, bid: 634.76, ask: 636.04, idx: 'NIFTY 500' },
  { sym: 'SAMMAANCAP', name: 'SAMMAANCAP', price: 184.2, chg: 0.59, vol: 15420, bid: 184.02, ask: 184.38, idx: 'NIFTY 500' },
  { sym: 'GODIGIT', name: 'GODIGIT', price: 306.95, chg: 1.37, vol: 15420, bid: 306.64, ask: 307.26, idx: 'NIFTY 500' },
  { sym: 'PFC', name: 'PFC', price: 431.5, chg: 1.66, vol: 15420, bid: 431.07, ask: 431.93, idx: 'NIFTY 500' },
  { sym: 'ULTRACEMCO', name: 'ULTRACEMCO', price: 10919.0, chg: -0.71, vol: 15420, bid: 10908.08, ask: 10929.92, idx: 'NIFTY 500' },
  { sym: 'COALINDIA', name: 'COALINDIA', price: 472.05, chg: -1.99, vol: 15420, bid: 471.58, ask: 472.52, idx: 'NIFTY 500' },
  { sym: 'BEL', name: 'BEL', price: 408.0, chg: -0.46, vol: 15420, bid: 407.59, ask: 408.41, idx: 'NIFTY 500' },
  { sym: 'ITC', name: 'ITC', price: 280.95, chg: 0.23, vol: 15420, bid: 280.67, ask: 281.23, idx: 'NIFTY 500' },
  { sym: 'GVT&D', name: 'GVT&D', price: 5026.0, chg: -1.19, vol: 15420, bid: 5020.97, ask: 5031.03, idx: 'NIFTY 500' },
  { sym: 'SUNPHARMA', name: 'SUNPHARMA', price: 1783.1, chg: 0.17, vol: 15420, bid: 1781.32, ask: 1784.88, idx: 'NIFTY 500' },
  { sym: 'ANGELONE', name: 'ANGELONE', price: 333.35, chg: -1.29, vol: 15420, bid: 333.02, ask: 333.68, idx: 'NIFTY 500' },
  { sym: 'ATHERENERG', name: 'ATHERENERG', price: 1039.0, chg: 5.15, vol: 15420, bid: 1037.96, ask: 1040.04, idx: 'NIFTY 500' },
  { sym: 'DIXON', name: 'DIXON', price: 11450.0, chg: -0.33, vol: 15420, bid: 11438.55, ask: 11461.45, idx: 'NIFTY 500' },
  { sym: 'CGPOWER', name: 'CGPOWER', price: 938.15, chg: 0.03, vol: 15420, bid: 937.21, ask: 939.09, idx: 'NIFTY 500' },
  { sym: 'ASIANPAINT', name: 'ASIANPAINT', price: 2677.0, chg: 0.58, vol: 15420, bid: 2674.32, ask: 2679.68, idx: 'NIFTY 500' },
  { sym: 'RVNL', name: 'RVNL', price: 235.65, chg: -0.34, vol: 15420, bid: 235.41, ask: 235.89, idx: 'NIFTY 500' },
  { sym: '360ONE', name: '360ONE', price: 1073.8, chg: 0.19, vol: 15420, bid: 1072.73, ask: 1074.87, idx: 'NIFTY 500' },
  { sym: 'PNB', name: 'PNB', price: 107.0, chg: 1.26, vol: 15420, bid: 106.89, ask: 107.11, idx: 'NIFTY 500' },
  { sym: 'BAJAJ-AUTO', name: 'BAJAJ-AUTO', price: 10350.0, chg: -0.12, vol: 15420, bid: 10339.65, ask: 10360.35, idx: 'NIFTY 500' },
  { sym: 'POLYCAB', name: 'POLYCAB', price: 9670.0, chg: -0.49, vol: 15420, bid: 9660.33, ask: 9679.67, idx: 'NIFTY 500' },
  { sym: 'ANANTRAJ', name: 'ANANTRAJ', price: 567.0, chg: -3.79, vol: 15420, bid: 566.43, ask: 567.57, idx: 'NIFTY 500' },
  { sym: 'BAJAJFINSV', name: 'BAJAJFINSV', price: 1700.0, chg: -0.57, vol: 15420, bid: 1698.3, ask: 1701.7, idx: 'NIFTY 500' },
  { sym: 'KAYNES', name: 'KAYNES', price: 3124.5, chg: -2.07, vol: 15420, bid: 3121.38, ask: 3127.62, idx: 'NIFTY 500' },
  { sym: 'ACMESOLAR', name: 'ACMESOLAR', price: 354.1, chg: 2.39, vol: 15420, bid: 353.75, ask: 354.45, idx: 'NIFTY 500' },
  { sym: 'LUPIN', name: 'LUPIN', price: 2260.0, chg: 0.45, vol: 15420, bid: 2257.74, ask: 2262.26, idx: 'NIFTY 500' },
  { sym: 'TATATECH', name: 'TATATECH', price: 775.0, chg: 3.56, vol: 15420, bid: 774.23, ask: 775.77, idx: 'NIFTY 500' },
  { sym: 'HCLTECH', name: 'HCLTECH', price: 1155.1, chg: -1.13, vol: 15420, bid: 1153.94, ask: 1156.26, idx: 'NIFTY 500' },
  { sym: 'HDFCLIFE', name: 'HDFCLIFE', price: 574.8, chg: 0.18, vol: 15420, bid: 574.23, ask: 575.37, idx: 'NIFTY 500' },
  { sym: 'TMCV', name: 'TMCV', price: 368.5, chg: -1.37, vol: 15420, bid: 368.13, ask: 368.87, idx: 'NIFTY 500' },
  { sym: 'RITES', name: 'RITES', price: 209.95, chg: 4.86, vol: 15420, bid: 209.74, ask: 210.16, idx: 'NIFTY 500' },
  { sym: 'PATANJALI', name: 'PATANJALI', price: 422.05, chg: -1.22, vol: 15420, bid: 421.63, ask: 422.47, idx: 'NIFTY 500' },
  { sym: 'WAAREEENER', name: 'WAAREEENER', price: 3051.0, chg: -0.67, vol: 15420, bid: 3047.95, ask: 3054.05, idx: 'NIFTY 500' },
  { sym: 'FIRSTCRY', name: 'FIRSTCRY', price: 219.4, chg: -0.14, vol: 15420, bid: 219.18, ask: 219.62, idx: 'NIFTY 500' },
  { sym: 'CUMMINSIND', name: 'CUMMINSIND', price: 5776.0, chg: -0.2, vol: 15420, bid: 5770.22, ask: 5781.78, idx: 'NIFTY 500' },
  { sym: 'LAURUSLABS', name: 'LAURUSLABS', price: 1445.5, chg: 1.28, vol: 15420, bid: 1444.05, ask: 1446.95, idx: 'NIFTY 500' },
  { sym: 'UNIONBANK', name: 'UNIONBANK', price: 167.04, chg: 0.3, vol: 15420, bid: 166.87, ask: 167.21, idx: 'NIFTY 500' },
  { sym: 'GMRAIRPORT', name: 'GMRAIRPORT', price: 101.93, chg: -0.06, vol: 15420, bid: 101.83, ask: 102.03, idx: 'NIFTY 500' },
  { sym: 'GRASIM', name: 'GRASIM', price: 3092.0, chg: -0.37, vol: 15420, bid: 3088.91, ask: 3095.09, idx: 'NIFTY 500' },
  { sym: 'HYUNDAI', name: 'HYUNDAI', price: 1905.0, chg: -1.42, vol: 15420, bid: 1903.1, ask: 1906.9, idx: 'NIFTY 500' },
  { sym: 'PERSISTENT', name: 'PERSISTENT', price: 5023.0, chg: -1.92, vol: 15420, bid: 5017.98, ask: 5028.02, idx: 'NIFTY 500' },
  { sym: 'LTF', name: 'LTF', price: 268.8, chg: 0.79, vol: 15420, bid: 268.53, ask: 269.07, idx: 'NIFTY 500' },
  { sym: 'HAL', name: 'HAL', price: 4216.0, chg: 0.6, vol: 15420, bid: 4211.78, ask: 4220.22, idx: 'NIFTY 500' },
  { sym: 'INDUSTOWER', name: 'INDUSTOWER', price: 429.5, chg: -0.22, vol: 15420, bid: 429.07, ask: 429.93, idx: 'NIFTY 500' },
  { sym: 'JSWSTEEL', name: 'JSWSTEEL', price: 1286.6, chg: -1.11, vol: 15420, bid: 1285.31, ask: 1287.89, idx: 'NIFTY 500' },
  { sym: 'IDFCFIRSTB', name: 'IDFCFIRSTB', price: 72.4, chg: 0.33, vol: 15420, bid: 72.33, ask: 72.47, idx: 'NIFTY 500' },
  { sym: 'VMM', name: 'VMM', price: 118.55, chg: 0.25, vol: 15420, bid: 118.43, ask: 118.67, idx: 'NIFTY 500' },
  { sym: 'ONGC', name: 'ONGC', price: 264.3, chg: -1.21, vol: 15420, bid: 264.04, ask: 264.56, idx: 'NIFTY 500' },
  { sym: 'POWERGRID', name: 'POWERGRID', price: 285.4, chg: 0.28, vol: 15420, bid: 285.11, ask: 285.69, idx: 'NIFTY 500' },
  { sym: 'MOTHERSON', name: 'MOTHERSON', price: 143.41, chg: -0.62, vol: 15420, bid: 143.27, ask: 143.55, idx: 'NIFTY 500' },
  { sym: 'OFSS', name: 'OFSS', price: 9968.5, chg: -1.28, vol: 15420, bid: 9958.53, ask: 9978.47, idx: 'NIFTY 500' },
  { sym: 'LENSKART', name: 'LENSKART', price: 506.0, chg: -1.37, vol: 15420, bid: 505.49, ask: 506.51, idx: 'NIFTY 500' },
  { sym: 'DLF', name: 'DLF', price: 577.9, chg: 0.02, vol: 15420, bid: 577.32, ask: 578.48, idx: 'NIFTY 500' },
  { sym: 'AUBANK', name: 'AUBANK', price: 969.0, chg: 0.72, vol: 15420, bid: 968.03, ask: 969.97, idx: 'NIFTY 500' },
  { sym: 'GRSE', name: 'GRSE', price: 2653.1, chg: -0.87, vol: 15420, bid: 2650.45, ask: 2655.75, idx: 'NIFTY 500' },
  { sym: 'TATACOMM', name: 'TATACOMM', price: 1970.0, chg: -0.8, vol: 15420, bid: 1968.03, ask: 1971.97, idx: 'NIFTY 500' },
  { sym: 'SOLARINDS', name: 'SOLARINDS', price: 18415.0, chg: 0.67, vol: 15420, bid: 18396.58, ask: 18433.41, idx: 'NIFTY 500' },
  { sym: 'AUROPHARMA', name: 'AUROPHARMA', price: 1458.0, chg: -0.38, vol: 15420, bid: 1456.54, ask: 1459.46, idx: 'NIFTY 500' },
  { sym: 'SAREGAMA', name: 'SAREGAMA', price: 474.0, chg: 4.73, vol: 15420, bid: 473.53, ask: 474.47, idx: 'NIFTY 500' },
  { sym: 'TORNTPHARM', name: 'TORNTPHARM', price: 4416.0, chg: 1.75, vol: 15420, bid: 4411.58, ask: 4420.42, idx: 'NIFTY 500' },
  { sym: 'RPOWER', name: 'RPOWER', price: 28.71, chg: 4.82, vol: 15420, bid: 28.68, ask: 28.74, idx: 'NIFTY 500' },
  { sym: 'NESTLEIND', name: 'NESTLEIND', price: 1391.0, chg: 0.59, vol: 15420, bid: 1389.61, ask: 1392.39, idx: 'NIFTY 500' },
  { sym: 'SCHNEIDER', name: 'SCHNEIDER', price: 1167.0, chg: 5.15, vol: 15420, bid: 1165.83, ask: 1168.17, idx: 'NIFTY 500' },
  { sym: 'VOLTAS', name: 'VOLTAS', price: 1301.0, chg: 1.13, vol: 15420, bid: 1299.7, ask: 1302.3, idx: 'NIFTY 500' },
  { sym: 'BDL', name: 'BDL', price: 1207.5, chg: -0.44, vol: 15420, bid: 1206.29, ask: 1208.71, idx: 'NIFTY 500' },
  { sym: 'APLAPOLLO', name: 'APLAPOLLO', price: 1825.0, chg: 0.92, vol: 15420, bid: 1823.17, ask: 1826.82, idx: 'NIFTY 500' },
  { sym: 'BANKINDIA', name: 'BANKINDIA', price: 141.6, chg: 1.37, vol: 15420, bid: 141.46, ask: 141.74, idx: 'NIFTY 500' },
  { sym: 'ABB', name: 'ABB', price: 7160.0, chg: 0.06, vol: 15420, bid: 7152.84, ask: 7167.16, idx: 'NIFTY 500' },
  { sym: 'EMMVEE', name: 'EMMVEE', price: 334.25, chg: 1.46, vol: 15420, bid: 333.92, ask: 334.58, idx: 'NIFTY 500' },
  { sym: 'HINDCOPPER', name: 'HINDCOPPER', price: 529.0, chg: -2.29, vol: 15420, bid: 528.47, ask: 529.53, idx: 'NIFTY 500' },
  { sym: 'MUTHOOTFIN', name: 'MUTHOOTFIN', price: 3154.0, chg: -0.5, vol: 15420, bid: 3150.85, ask: 3157.15, idx: 'NIFTY 500' },
  { sym: 'JPPOWER', name: 'JPPOWER', price: 19.04, chg: 0.0, vol: 15420, bid: 19.02, ask: 19.06, idx: 'NIFTY 500' },
  { sym: 'FORCEMOT', name: 'FORCEMOT', price: 18250.0, chg: -1.84, vol: 15420, bid: 18231.75, ask: 18268.25, idx: 'NIFTY 500' },
  { sym: 'INDUSINDBK', name: 'INDUSINDBK', price: 903.1, chg: -0.01, vol: 15420, bid: 902.2, ask: 904.0, idx: 'NIFTY 500' },
  { sym: 'KIMS', name: 'KIMS', price: 790.0, chg: 3.28, vol: 15420, bid: 789.21, ask: 790.79, idx: 'NIFTY 500' },
  { sym: 'VBL', name: 'VBL', price: 521.9, chg: -1.23, vol: 15420, bid: 521.38, ask: 522.42, idx: 'NIFTY 500' },
  { sym: 'LICHSGFIN', name: 'LICHSGFIN', price: 548.0, chg: 0.45, vol: 15420, bid: 547.45, ask: 548.55, idx: 'NIFTY 500' },
  { sym: 'UPL', name: 'UPL', price: 637.0, chg: -0.34, vol: 15420, bid: 636.36, ask: 637.64, idx: 'NIFTY 500' },
  { sym: 'BPCL', name: 'BPCL', price: 295.15, chg: 0.0, vol: 15420, bid: 294.85, ask: 295.45, idx: 'NIFTY 500' },
  { sym: 'COCHINSHIP', name: 'COCHINSHIP', price: 1433.1, chg: -2.67, vol: 15420, bid: 1431.67, ask: 1434.53, idx: 'NIFTY 500' },
  { sym: 'APOLLOHOSP', name: 'APOLLOHOSP', price: 8314.5, chg: 0.79, vol: 15420, bid: 8306.19, ask: 8322.81, idx: 'NIFTY 500' },
  { sym: 'DMART', name: 'DMART', price: 4142.0, chg: 0.07, vol: 15420, bid: 4137.86, ask: 4146.14, idx: 'NIFTY 500' },
  { sym: 'TTML', name: 'TTML', price: 46.09, chg: 4.32, vol: 15420, bid: 46.04, ask: 46.14, idx: 'NIFTY 500' },
  { sym: 'ICICIAMC', name: 'ICICIAMC', price: 3260.0, chg: -1.64, vol: 15420, bid: 3256.74, ask: 3263.26, idx: 'NIFTY 500' },
  { sym: 'FORTIS', name: 'FORTIS', price: 961.1, chg: 2.17, vol: 15420, bid: 960.14, ask: 962.06, idx: 'NIFTY 500' },
  { sym: 'IOC', name: 'IOC', price: 138.3, chg: -0.47, vol: 15420, bid: 138.16, ask: 138.44, idx: 'NIFTY 500' },
  { sym: 'CIPLA', name: 'CIPLA', price: 1402.0, chg: 1.18, vol: 15420, bid: 1400.6, ask: 1403.4, idx: 'NIFTY 500' },
  { sym: 'MARICO', name: 'MARICO', price: 810.1, chg: -0.83, vol: 15420, bid: 809.29, ask: 810.91, idx: 'NIFTY 500' },
  { sym: 'NAUKRI', name: 'NAUKRI', price: 986.0, chg: -2.26, vol: 15420, bid: 985.01, ask: 986.99, idx: 'NIFTY 500' },
  { sym: 'PAYTM', name: 'PAYTM', price: 1066.0, chg: 0.71, vol: 15420, bid: 1064.93, ask: 1067.07, idx: 'NIFTY 500' },
  { sym: 'MAZDOCK', name: 'MAZDOCK', price: 2425.0, chg: -0.83, vol: 15420, bid: 2422.57, ask: 2427.42, idx: 'NIFTY 500' },
  { sym: 'RBLBANK', name: 'RBLBANK', price: 351.45, chg: -0.65, vol: 15420, bid: 351.1, ask: 351.8, idx: 'NIFTY 500' },
  { sym: 'CHENNPETRO', name: 'CHENNPETRO', price: 1180.0, chg: -0.89, vol: 15420, bid: 1178.82, ask: 1181.18, idx: 'NIFTY 500' },
  { sym: 'APARINDS', name: 'APARINDS', price: 13823.0, chg: 0.83, vol: 15420, bid: 13809.18, ask: 13836.82, idx: 'NIFTY 500' },
  { sym: 'CDSL', name: 'CDSL', price: 1216.7, chg: -0.02, vol: 15420, bid: 1215.48, ask: 1217.92, idx: 'NIFTY 500' },
  { sym: 'ABCAPITAL', name: 'ABCAPITAL', price: 357.0, chg: 0.95, vol: 15420, bid: 356.64, ask: 357.36, idx: 'NIFTY 500' },
  { sym: 'GAIL', name: 'GAIL', price: 168.0, chg: 0.27, vol: 15420, bid: 167.83, ask: 168.17, idx: 'NIFTY 500' },
  { sym: 'PWL', name: 'PWL', price: 102.51, chg: -3.71, vol: 15420, bid: 102.41, ask: 102.61, idx: 'NIFTY 500' },
  { sym: 'DIVISLAB', name: 'DIVISLAB', price: 6615.5, chg: 0.29, vol: 15420, bid: 6608.88, ask: 6622.12, idx: 'NIFTY 500' },
  { sym: 'ICICIGI', name: 'ICICIGI', price: 1755.6, chg: 1.31, vol: 15420, bid: 1753.84, ask: 1757.36, idx: 'NIFTY 500' },
  { sym: 'CEMPRO', name: 'CEMPRO', price: 1102.9, chg: -2.16, vol: 15420, bid: 1101.8, ask: 1104.0, idx: 'NIFTY 500' },
  { sym: 'ENRIN', name: 'ENRIN', price: 3646.0, chg: -1.48, vol: 15420, bid: 3642.35, ask: 3649.65, idx: 'NIFTY 500' },
  { sym: 'MAXHEALTH', name: 'MAXHEALTH', price: 977.0, chg: 1.12, vol: 15420, bid: 976.02, ask: 977.98, idx: 'NIFTY 500' },
  { sym: 'SBILIFE', name: 'SBILIFE', price: 1785.0, chg: 1.14, vol: 15420, bid: 1783.21, ask: 1786.78, idx: 'NIFTY 500' },
  { sym: 'LICI', name: 'LICI', price: 400.0, chg: 0.34, vol: 15420, bid: 399.6, ask: 400.4, idx: 'NIFTY 500' },
  { sym: 'CROMPTON', name: 'CROMPTON', price: 268.0, chg: -0.48, vol: 15420, bid: 267.73, ask: 268.27, idx: 'NIFTY 500' },
  { sym: 'SIEMENS', name: 'SIEMENS', price: 3700.0, chg: 0.36, vol: 15420, bid: 3696.3, ask: 3703.7, idx: 'NIFTY 500' },
  { sym: 'BANDHANBNK', name: 'BANDHANBNK', price: 205.92, chg: 0.23, vol: 15420, bid: 205.71, ask: 206.13, idx: 'NIFTY 500' },
  { sym: 'RRKABEL', name: 'RRKABEL', price: 2220.0, chg: -0.13, vol: 15420, bid: 2217.78, ask: 2222.22, idx: 'NIFTY 500' },
  { sym: 'PREMIERENE', name: 'PREMIERENE', price: 1080.4, chg: 0.24, vol: 15420, bid: 1079.32, ask: 1081.48, idx: 'NIFTY 500' },
  { sym: 'OIL', name: 'OIL', price: 483.4, chg: -1.12, vol: 15420, bid: 482.92, ask: 483.88, idx: 'NIFTY 500' },
  { sym: 'LODHA', name: 'LODHA', price: 895.6, chg: 1.57, vol: 15420, bid: 894.7, ask: 896.5, idx: 'NIFTY 500' },
  { sym: 'JINDALSTEL', name: 'JINDALSTEL', price: 1183.0, chg: -1.19, vol: 15420, bid: 1181.82, ask: 1184.18, idx: 'NIFTY 500' },
  { sym: 'PRESTIGE', name: 'PRESTIGE', price: 1385.0, chg: 2.08, vol: 15420, bid: 1383.62, ask: 1386.38, idx: 'NIFTY 500' },
  { sym: 'INOXWIND', name: 'INOXWIND', price: 87.01, chg: 1.43, vol: 15420, bid: 86.92, ask: 87.1, idx: 'NIFTY 500' },
  { sym: 'HINDPETRO', name: 'HINDPETRO', price: 385.25, chg: -0.45, vol: 15420, bid: 384.86, ask: 385.64, idx: 'NIFTY 500' },
  { sym: 'UNOMINDA', name: 'UNOMINDA', price: 1095.0, chg: 1.13, vol: 15420, bid: 1093.9, ask: 1096.09, idx: 'NIFTY 500' },
  { sym: 'EXIDEIND', name: 'EXIDEIND', price: 399.2, chg: -1.04, vol: 15420, bid: 398.8, ask: 399.6, idx: 'NIFTY 500' },
  { sym: 'TATACONSUM', name: 'TATACONSUM', price: 1131.8, chg: -1.52, vol: 15420, bid: 1130.67, ask: 1132.93, idx: 'NIFTY 500' },
  { sym: 'NLCINDIA', name: 'NLCINDIA', price: 336.8, chg: -0.53, vol: 15420, bid: 336.46, ask: 337.14, idx: 'NIFTY 500' },
  { sym: 'GLENMARK', name: 'GLENMARK', price: 2165.0, chg: -0.72, vol: 15420, bid: 2162.84, ask: 2167.16, idx: 'NIFTY 500' },
  { sym: 'NATCOPHARM', name: 'NATCOPHARM', price: 893.0, chg: -2.8, vol: 15420, bid: 892.11, ask: 893.89, idx: 'NIFTY 500' },
  { sym: 'GLAND', name: 'GLAND', price: 2287.0, chg: 3.04, vol: 15420, bid: 2284.71, ask: 2289.29, idx: 'NIFTY 500' },
  { sym: 'GODREJPROP', name: 'GODREJPROP', price: 1703.7, chg: 0.55, vol: 15420, bid: 1702.0, ask: 1705.4, idx: 'NIFTY 500' },
  { sym: 'IIFL', name: 'IIFL', price: 517.0, chg: -2.51, vol: 15420, bid: 516.48, ask: 517.52, idx: 'NIFTY 500' },
  { sym: 'KEI', name: 'KEI', price: 5336.0, chg: 0.76, vol: 15420, bid: 5330.66, ask: 5341.34, idx: 'NIFTY 500' },
  { sym: 'GMDCLTD', name: 'GMDCLTD', price: 658.55, chg: -2.7, vol: 15420, bid: 657.89, ask: 659.21, idx: 'NIFTY 500' },
  { sym: 'KFINTECH', name: 'KFINTECH', price: 867.0, chg: 1.6, vol: 15420, bid: 866.13, ask: 867.87, idx: 'NIFTY 500' },
  { sym: 'TATAPOWER', name: 'TATAPOWER', price: 409.0, chg: -0.44, vol: 15420, bid: 408.59, ask: 409.41, idx: 'NIFTY 500' },
  { sym: 'BIOCON', name: 'BIOCON', price: 413.45, chg: -0.62, vol: 15420, bid: 413.04, ask: 413.86, idx: 'NIFTY 500' },
  { sym: 'PIRAMALFIN', name: 'PIRAMALFIN', price: 1979.0, chg: 0.69, vol: 15420, bid: 1977.02, ask: 1980.98, idx: 'NIFTY 500' },
  { sym: 'PNBHOUSING', name: 'PNBHOUSING', price: 998.9, chg: -0.05, vol: 15420, bid: 997.9, ask: 999.9, idx: 'NIFTY 500' },
  { sym: 'MAHABANK', name: 'MAHABANK', price: 79.25, chg: 0.7, vol: 15420, bid: 79.17, ask: 79.33, idx: 'NIFTY 500' },
  { sym: 'LTM', name: 'LTM', price: 4025.9, chg: -1.03, vol: 15420, bid: 4021.87, ask: 4029.93, idx: 'NIFTY 500' },
  { sym: 'ZYDUSLIFE', name: 'ZYDUSLIFE', price: 1090.5, chg: 0.54, vol: 15420, bid: 1089.41, ask: 1091.59, idx: 'NIFTY 500' },
  { sym: 'OLECTRA', name: 'OLECTRA', price: 1291.0, chg: -2.29, vol: 15420, bid: 1289.71, ask: 1292.29, idx: 'NIFTY 500' },
  { sym: 'BOSCHLTD', name: 'BOSCHLTD', price: 37200.0, chg: 0.54, vol: 15420, bid: 37162.8, ask: 37237.2, idx: 'NIFTY 500' },
  { sym: 'DRREDDY', name: 'DRREDDY', price: 1283.0, chg: 1.22, vol: 15420, bid: 1281.72, ask: 1284.28, idx: 'NIFTY 500' },
  { sym: 'THERMAX', name: 'THERMAX', price: 4836.0, chg: -0.82, vol: 15420, bid: 4831.16, ask: 4840.84, idx: 'NIFTY 500' },
  { sym: 'AIAENG', name: 'AIAENG', price: 4630.0, chg: 0.73, vol: 15420, bid: 4625.37, ask: 4634.63, idx: 'NIFTY 500' },
  { sym: 'SONACOMS', name: 'SONACOMS', price: 604.0, chg: 0.47, vol: 15420, bid: 603.4, ask: 604.6, idx: 'NIFTY 500' },
  { sym: 'PGEL', name: 'PGEL', price: 487.15, chg: -1.17, vol: 15420, bid: 486.66, ask: 487.64, idx: 'NIFTY 500' },
  { sym: 'SYRMA', name: 'SYRMA', price: 1230.1, chg: 0.7, vol: 15420, bid: 1228.87, ask: 1231.33, idx: 'NIFTY 500' },
  { sym: 'MRF', name: 'MRF', price: 123400.0, chg: -1.05, vol: 15420, bid: 123276.6, ask: 123523.4, idx: 'NIFTY 500' },
  { sym: 'SAILIFE', name: 'SAILIFE', price: 1188.0, chg: 2.48, vol: 15420, bid: 1186.81, ask: 1189.19, idx: 'NIFTY 500' },
  { sym: 'JSWENERGY', name: 'JSWENERGY', price: 581.0, chg: -1.2, vol: 15420, bid: 580.42, ask: 581.58, idx: 'NIFTY 500' },
  { sym: 'LLOYDSME', name: 'LLOYDSME', price: 1777.0, chg: 0.08, vol: 15420, bid: 1775.22, ask: 1778.78, idx: 'NIFTY 500' },
  { sym: 'HAVELLS', name: 'HAVELLS', price: 1152.1, chg: -1.23, vol: 15420, bid: 1150.95, ask: 1153.25, idx: 'NIFTY 500' },
  { sym: 'NAM-INDIA', name: 'NAM-INDIA', price: 1111.0, chg: -1.6, vol: 15420, bid: 1109.89, ask: 1112.11, idx: 'NIFTY 500' },
  { sym: 'HBLENGINE', name: 'HBLENGINE', price: 793.55, chg: -0.39, vol: 15420, bid: 792.76, ask: 794.34, idx: 'NIFTY 500' },
  { sym: 'CONCOR', name: 'CONCOR', price: 450.6, chg: -0.83, vol: 15420, bid: 450.15, ask: 451.05, idx: 'NIFTY 500' },
  { sym: 'CARTRADE', name: 'CARTRADE', price: 1970.0, chg: 2.96, vol: 15420, bid: 1968.03, ask: 1971.97, idx: 'NIFTY 500' },
  { sym: 'PHOENIXLTD', name: 'PHOENIXLTD', price: 1742.6, chg: 0.77, vol: 15420, bid: 1740.86, ask: 1744.34, idx: 'NIFTY 500' },
  { sym: 'BRITANNIA', name: 'BRITANNIA', price: 5129.0, chg: 0.77, vol: 15420, bid: 5123.87, ask: 5134.13, idx: 'NIFTY 500' },
  { sym: 'M&MFIN', name: 'M&MFIN', price: 290.35, chg: 0.45, vol: 15420, bid: 290.06, ask: 290.64, idx: 'NIFTY 500' },
  { sym: 'JAINREC', name: 'JAINREC', price: 344.2, chg: -3.77, vol: 15420, bid: 343.86, ask: 344.54, idx: 'NIFTY 500' },
  { sym: 'SARDAEN', name: 'SARDAEN', price: 550.0, chg: 3.34, vol: 15420, bid: 549.45, ask: 550.55, idx: 'NIFTY 500' },
  { sym: 'MPHASIS', name: 'MPHASIS', price: 2330.5, chg: 0.63, vol: 15420, bid: 2328.17, ask: 2332.83, idx: 'NIFTY 500' },
  { sym: 'ICICIPRULI', name: 'ICICIPRULI', price: 485.3, chg: 2.07, vol: 15420, bid: 484.81, ask: 485.79, idx: 'NIFTY 500' },
  { sym: 'DABUR', name: 'DABUR', price: 425.05, chg: 0.09, vol: 15420, bid: 424.62, ask: 425.48, idx: 'NIFTY 500' },
  { sym: 'PETRONET', name: 'PETRONET', price: 269.6, chg: 0.2, vol: 15420, bid: 269.33, ask: 269.87, idx: 'NIFTY 500' },
  { sym: 'IRFC', name: 'IRFC', price: 96.37, chg: 0.32, vol: 15420, bid: 96.27, ask: 96.47, idx: 'NIFTY 500' },
  { sym: 'KARURVYSYA', name: 'KARURVYSYA', price: 280.45, chg: -1.23, vol: 15420, bid: 280.17, ask: 280.73, idx: 'NIFTY 500' },
  { sym: 'CAMS', name: 'CAMS', price: 761.4, chg: 0.3, vol: 15420, bid: 760.64, ask: 762.16, idx: 'NIFTY 500' },
  { sym: 'BLUESTARCO', name: 'BLUESTARCO', price: 1587.0, chg: -1.28, vol: 15420, bid: 1585.41, ask: 1588.59, idx: 'NIFTY 500' },
  { sym: 'VIJAYA', name: 'VIJAYA', price: 1355.0, chg: -0.32, vol: 15420, bid: 1353.64, ask: 1356.35, idx: 'NIFTY 500' },
  { sym: 'INDHOTEL', name: 'INDHOTEL', price: 656.95, chg: -0.7, vol: 15420, bid: 656.29, ask: 657.61, idx: 'NIFTY 500' },
  { sym: 'JBMA', name: 'JBMA', price: 675.0, chg: -2.57, vol: 15420, bid: 674.33, ask: 675.67, idx: 'NIFTY 500' },
  { sym: 'ALKEM', name: 'ALKEM', price: 5250.0, chg: -0.5, vol: 15420, bid: 5244.75, ask: 5255.25, idx: 'NIFTY 500' },
  { sym: 'BHARATFORG', name: 'BHARATFORG', price: 1930.5, chg: -0.36, vol: 15420, bid: 1928.57, ask: 1932.43, idx: 'NIFTY 500' },
  { sym: 'MANAPPURAM', name: 'MANAPPURAM', price: 308.5, chg: -0.77, vol: 15420, bid: 308.19, ask: 308.81, idx: 'NIFTY 500' },
  { sym: 'FINCABLES', name: 'FINCABLES', price: 1055.1, chg: 3.63, vol: 15420, bid: 1054.04, ask: 1056.16, idx: 'NIFTY 500' },
  { sym: 'TATAELXSI', name: 'TATAELXSI', price: 4292.0, chg: -0.07, vol: 15420, bid: 4287.71, ask: 4296.29, idx: 'NIFTY 500' },
];

const BEST_PERFORMERS = [
  { sym: 'NIFTYBEES', name: 'Nippon India Nifty 50 ETF', price: 265.36, chg: -0.09, type: 'ETF' },
  { sym: 'GOLDBEES', name: 'Nippon India Gold ETF', price: 127.78, chg: -0.56, type: 'ETF' },
  { sym: 'JUNIORBEES', name: 'Nippon India Junior Nifty ETF', price: 757.76, chg: 0.22, type: 'ETF' },
  { sym: 'LIQUIDBEES', name: 'Nippon India Liquid ETF', price: 1000.00, chg: 0.00, type: 'ETF' },
  { sym: 'TATASTEEL', name: 'Tata Steel Limited', price: 206.77, chg: -1.80, type: 'Stock' },
  { sym: 'ZOMATO', name: 'Zomato Limited', price: 82.40, chg: 3.92, type: 'Stock' }
];

// ─── Utility ──────────────────────────────────────────────────────
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rand = (lo, hi) => lo + Math.random() * (hi - lo);
const randInt = (lo, hi) => Math.floor(rand(lo, hi + 1));

function formatINR(val) {
  const abs = Math.abs(val);
  if (abs >= 100000) return `${val < 0 ? '-' : '+'}₹${(abs / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `${val < 0 ? '-' : '+'}₹${(abs / 1000).toFixed(1)}K`;
  return `${val < 0 ? '-' : '+'}₹${abs}`;
}

// ─── Neural Canvas Background ─────────────────────────────────────
(function initNeuralCanvas() {
  const canvas = document.getElementById('neural-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, nodes = [], animId;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createNodes(n) {
    nodes = [];
    for (let i = 0; i < n; i++) {
      nodes.push({
        x: rand(0, W), y: rand(0, H),
        vx: rand(-0.18, 0.18), vy: rand(-0.18, 0.18),
        r: rand(1.5, 3),
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          const alpha = (1 - dist / 140) * 0.25;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(0, 180, 255, ${alpha})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    nodes.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 212, 255, 0.4)';
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(0,212,255,0.6)';
      ctx.fill();
      ctx.shadowBlur = 0;

      // Move
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
    });

    animId = requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); createNodes(60); });
  resize();
  createNodes(60);
  draw();
})();

// ─── Tab Navigation ───────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`panel-${tab}`).classList.add('active');
      State.activeTab = tab;

      // Render components dynamically
      if (tab === 'market') { renderMarketScannerTable(State.currentMarketFilter, State.currentMarketSearch); renderWatchlist(); renderBestPerformers(); }
      if (tab === 'shadow') { renderShadowChart(); renderContagionChart(); }
      if (tab === 'behavioral') { renderHeatmap(); renderFeatureChart(); renderAlphaImprovementChart(); }
      if (tab === 'biometric') { renderHRVChart(); renderArousalDist(); renderLambdaHistory(); drawBacktestInit(); }
      if (tab === 'demat') { renderDematGateway(); }
    });
  });

  document.querySelectorAll('.chart-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chart-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderPerformanceChart(btn.dataset.range);
    });
  });
}

// ─── Circuit Breaker ─────────────────────────────────────────────
function triggerCircuitBreaker() {
  if (State.circuitBreakerActive) return;
  State.circuitBreakerActive = true;

  const overlay = document.getElementById('circuit-breaker-overlay');
  const numEl = document.getElementById('countdown-number');
  const ringEl = document.getElementById('countdown-ring-progress');
  const TOTAL = 60;
  const CIRCUM = 264;
  let remaining = TOTAL;

  overlay.classList.remove('hidden');
  document.body.dataset.arousal = 'critical';
  updateBiometricVisuals(0.92);

  // Update circuit status
  const badge = document.getElementById('circuit-status-badge');
  if (badge) {
    badge.textContent = '⚠ Circuit Breaker: ACTIVE';
    badge.className = 'circuit-status active';
  }

  State.countdownInterval = setInterval(() => {
    remaining--;
    numEl.textContent = remaining;
    const offset = CIRCUM * (remaining / TOTAL);
    ringEl.style.strokeDashoffset = offset;

    if (remaining <= 0) {
      clearInterval(State.countdownInterval);
      overlay.classList.add('hidden');
      State.circuitBreakerActive = false;
      document.body.dataset.arousal = 'low';
      updateBiometricVisuals(0.23);
      if (badge) {
        badge.textContent = '✓ Circuit Breakers: NOMINAL';
        badge.className = 'circuit-status calm';
      }
    }
  }, 1000);
}

document.getElementById('trigger-circuit-breaker-btn').addEventListener('click', triggerCircuitBreaker);
document.getElementById('circuit-breaker-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) {
    clearInterval(State.countdownInterval);
    e.currentTarget.classList.add('hidden');
    State.circuitBreakerActive = false;
    document.body.dataset.arousal = 'low';
    updateBiometricVisuals(0.23);
    const badge = document.getElementById('circuit-status-badge');
    if (badge) {
      badge.textContent = '✓ Circuit Breakers: NOMINAL';
      badge.className = 'circuit-status calm';
    }
  }
});

// ─── Biometric Simulation ─────────────────────────────────────────
function updateBiometricVisuals(arousal) {
  State.arousal = arousal;
  const hrv = clamp(Math.round(lerp(95, 42, arousal) + rand(-3, 3)), 38, 100);
  const sleep = State.sleepQuality;
  const cursor = clamp(arousal * 0.8 + rand(-0.05, 0.05), 0.05, 0.95);

  State.hrv = hrv;
  State.cursorSigma = cursor;

  // Nav pill
  const navHrv = document.getElementById('nav-hrv');
  if (navHrv) navHrv.textContent = `${hrv} ms`;
  const navArousal = document.getElementById('nav-arousal-fill');
  if (navArousal) navArousal.style.width = `${arousal * 100}%`;

  // Gauges
  const hrvPct = ((hrv - 38) / 62) * 100;
  const hrvGauge = document.getElementById('hrv-gauge');
  if (hrvGauge) hrvGauge.style.width = `${hrvPct}%`;
  const arousalGauge = document.getElementById('arousal-gauge');
  if (arousalGauge) arousalGauge.style.width = `${arousal * 100}%`;
  const sleepGauge = document.getElementById('sleep-gauge');
  if (sleepGauge) sleepGauge.style.width = `${sleep * 100}%`;
  const cursorGauge = document.getElementById('cursor-gauge');
  if (cursorGauge) cursorGauge.style.width = `${cursor * 100}%`;

  const hrvVal = document.getElementById('hrv-val');
  if (hrvVal) hrvVal.textContent = `${hrv}ms`;
  const arousalVal = document.getElementById('arousal-val');
  if (arousalVal) arousalVal.textContent = arousal.toFixed(2);
  const sleepVal = document.getElementById('sleep-val');
  if (sleepVal) sleepVal.textContent = `${Math.round(sleep * 100)}%`;
  const cursorVal = document.getElementById('cursor-val');
  if (cursorVal) cursorVal.textContent = cursor.toFixed(2);

  // State orb & label
  const orb = document.getElementById('orb-inner');
  const emoji = document.getElementById('state-emoji');
  const label = document.getElementById('state-label');

  if (orb && emoji && label) {
    if (arousal < 0.3) {
      emoji.textContent = '😌'; label.textContent = 'CALM & FOCUSED';
      label.style.color = 'var(--green)';
      orb.style.background = 'radial-gradient(circle at 35% 35%, rgba(0,229,160,0.4), rgba(0,212,255,0.1))';
      orb.style.borderColor = 'rgba(0,229,160,0.4)';
      orb.style.boxShadow = '0 0 24px rgba(0,229,160,0.25)';
    } else if (arousal < 0.6) {
      emoji.textContent = '😐'; label.textContent = 'MILDLY ELEVATED';
      label.style.color = 'var(--amber)';
      orb.style.background = 'radial-gradient(circle at 35% 35%, rgba(245,166,35,0.4), rgba(255,107,53,0.1))';
      orb.style.borderColor = 'rgba(245,166,35,0.4)';
      orb.style.boxShadow = '0 0 24px rgba(245,166,35,0.3)';
    } else {
      emoji.textContent = '😰'; label.textContent = 'HIGH STRESS — OVERRIDE LOCKED';
      label.style.color = 'var(--red)';
      orb.style.background = 'radial-gradient(circle at 35% 35%, rgba(255,71,87,0.5), rgba(200,0,30,0.15))';
      orb.style.borderColor = 'rgba(255,71,87,0.5)';
      orb.style.boxShadow = '0 0 32px rgba(255,71,87,0.4)';
    }
  }

  // Lambda
  const lambda = clamp(0.35 + arousal * 0.55, 0.35, 0.92);
  State.lambda = lambda;
  const lVal = document.getElementById('lambda-val');
  if (lVal) lVal.textContent = lambda.toFixed(2);
  renderLambdaArc(lambda);

  // Dexter Score dips slightly with high arousal
  const score = clamp(Math.round(87 - arousal * 12 + rand(-1, 1)), 60, 97);
  State.dexterScore = score;
  updateDexterScore(score);

  document.body.dataset.arousal = arousal > 0.75 ? 'critical' : arousal > 0.45 ? 'elevated' : 'low';
}

// ─── Dexter Score Ring ─────────────────────────────────────────────
function updateDexterScore(score) {
  const CIRCUM = 534;
  const offset = CIRCUM * (1 - score / 100);
  const fill = document.getElementById('score-ring-fill');
  if (fill) fill.style.strokeDashoffset = offset;
  const num = document.getElementById('dexter-score-number');
  if (num) num.textContent = score;

  const grades = [[90, 'ELITE'], [75, 'PROFICIENT'], [60, 'DEVELOPING'], [0, 'AT RISK']];
  const g = grades.find(([t]) => score >= t);
  const gr = document.querySelector('.score-grade');
  if (gr) gr.textContent = g[1];
}

// ─── Lambda Arc Canvas ────────────────────────────────────────────
function renderLambdaArc(lambda) {
  const canvas = document.getElementById('lambda-arc');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2, cy = H - 10;
  const r = 80;
  const startA = Math.PI;
  const endA = 2 * Math.PI;

  // Track
  ctx.beginPath();
  ctx.arc(cx, cy, r, startA, endA);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Gradient fill
  const grad = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
  grad.addColorStop(0, '#FF6B35');
  grad.addColorStop(0.45, '#00D4FF');
  grad.addColorStop(1, '#7B2FBE');

  const fillEnd = startA + (endA - startA) * lambda;
  ctx.beginPath();
  ctx.arc(cx, cy, r, startA, fillEnd);
  ctx.strokeStyle = grad;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.shadowBlur = 14;
  ctx.shadowColor = '#00D4FF';
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Thumb dot
  const thumbA = fillEnd;
  ctx.beginPath();
  ctx.arc(cx + Math.cos(thumbA) * r, cy + Math.sin(thumbA) * r, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#00D4FF';
  ctx.fill();
  ctx.shadowBlur = 0;
}

// ─── PnL Sparkline ────────────────────────────────────────────────
function initPnLSparkline() {
  const pts = 32;
  let v = 12000;
  for (let i = 0; i < pts; i++) {
    v += rand(-800, 1100);
    State.pnlHistory.push(v);
  }
  renderSparkline();
}

function renderSparkline() {
  const canvas = document.getElementById('pnl-sparkline');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const data = State.pnlHistory;
  const min = Math.min(...data), max = Math.max(...data);
  const scaleX = W / (data.length - 1);
  const scaleY = (H - 16) / (max - min);

  const pts = data.map((v, i) => [i * scaleX, H - 8 - (v - min) * scaleY]);

  // Gradient fill
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(0,229,160,0.3)');
  grad.addColorStop(1, 'rgba(0,229,160,0)');

  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    const mx = (pts[i - 1][0] + pts[i][0]) / 2;
    ctx.bezierCurveTo(mx, pts[i - 1][1], mx, pts[i][1], pts[i][0], pts[i][1]);
  }
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    const mx = (pts[i - 1][0] + pts[i][0]) / 2;
    ctx.bezierCurveTo(mx, pts[i - 1][1], mx, pts[i][1], pts[i][0], pts[i][1]);
  }
  ctx.strokeStyle = '#00E5A0';
  ctx.lineWidth = 2;
  ctx.shadowBlur = 6;
  ctx.shadowColor = '#00E5A0';
  ctx.stroke();
  ctx.shadowBlur = 0;
}

// ─── Performance Chart ────────────────────────────────────────────
function generatePerformanceSeries(days) {
  const dexter = [], nifty = [], labels = [];
  let aV = 0, nV = 0;
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    labels.push(`${d.getDate()}/${d.getMonth() + 1}`);
    aV += rand(-1.2, 2.1); nV += rand(-1.5, 1.8);
    dexter.push(aV); nifty.push(nV);
  }
  return { dexter, nifty, labels };
}

function renderPerformanceChart(range = '6M') {
  const days = range === '1M' ? 30 : range === '3M' ? 90 : 180;
  const canvas = document.getElementById('performance-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height;

  const { dexter, nifty, labels } = generatePerformanceSeries(days);
  const allVals = [...dexter, ...nifty];
  const minV = Math.min(...allVals) - 2;
  const maxV = Math.max(...allVals) + 2;

  const pad = { l: 50, r: 20, t: 20, b: 36 };
  const iW = W - pad.l - pad.r;
  const iH = H - pad.t - pad.b;

  ctx.clearRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = pad.t + (iH / 5) * i;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    const val = maxV - ((maxV - minV) / 5) * i;
    ctx.fillStyle = 'rgba(138,163,199,0.6)';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(val.toFixed(1) + '%', pad.l - 6, y + 4);
  }

  function drawLine(data, color, shadowColor, dashed = false) {
    const n = data.length;
    const pts = data.map((v, i) => [
      pad.l + (i / (n - 1)) * iW,
      pad.t + ((maxV - v) / (maxV - minV)) * iH,
    ]);

    // Area fill
    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + iH);
    const m = color.match(/\\d+/g);
    if (m && m.length >= 3) {
      grad.addColorStop(0, `rgba(${m[0]}, ${m[1]}, ${m[2]}, 0.18)`);
      grad.addColorStop(1, `rgba(${m[0]}, ${m[1]}, ${m[2]}, 0)`);
    } else {
      grad.addColorStop(0, 'rgba(138, 163, 199, 0.18)');
      grad.addColorStop(1, 'rgba(138, 163, 199, 0)');
    }

    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const mx = (pts[i - 1][0] + pts[i][0]) / 2;
      ctx.bezierCurveTo(mx, pts[i - 1][1], mx, pts[i][1], pts[i][0], pts[i][1]);
    }
    ctx.lineTo(pts[pts.length - 1][0], pad.t + iH);
    ctx.lineTo(pts[0][0], pad.t + iH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    if (dashed) ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const mx = (pts[i - 1][0] + pts[i][0]) / 2;
      ctx.bezierCurveTo(mx, pts[i - 1][1], mx, pts[i][1], pts[i][0], pts[i][1]);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 10;
    ctx.shadowColor = shadowColor;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);
  }

  drawLine(nifty, 'rgba(138,163,199,0.7)', 'rgba(138,163,199,0.3)', true);
  drawLine(dexter, '#00E5A0', '#00E5A0');

  // X labels (sampled)
  ctx.fillStyle = 'rgba(138,163,199,0.5)';
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'center';
  const step = Math.ceil(labels.length / 8);
  labels.forEach((l, i) => {
    if (i % step === 0) {
      ctx.fillText(l, pad.l + (i / (labels.length - 1)) * iW, H - 8);
    }
  });

  // Legend
  ctx.fillStyle = '#00E5A0';
  ctx.fillRect(W - 180, 8, 12, 3);
  ctx.fillStyle = 'rgba(138,163,199,0.8)';
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Dexter Portfolio', W - 163, 12);
  ctx.fillStyle = 'rgba(138,163,199,0.5)';
  ctx.fillRect(W - 180, 22, 12, 3);
  ctx.fillStyle = 'rgba(138,163,199,0.6)';
  ctx.fillText('Nifty 50', W - 163, 26);
}

// ─── Holdings Table ───────────────────────────────────────────────
const HOLDINGS = [
  { sym: 'RELIANCE', wt: '14.2%', qty: 25, buyPrice: 2400.00, risk: 'low', bio: '✅', bioTip: 'Algo-placed', pnl: 0 },
  { sym: 'INFY', wt: '11.8%', qty: 60, buyPrice: 1400.00, risk: 'low', bio: '✅', bioTip: 'Algo-placed', pnl: 0 },
  { sym: 'HDFCBANK', wt: '10.1%', qty: 40, buyPrice: 1560.00, risk: 'low', bio: '✅', bioTip: 'Algo-placed', pnl: 0 },
  { sym: 'TATAMOTORS', wt: '8.4%', qty: 80, buyPrice: 630.00, risk: 'mid', bio: '⚠️', bioTip: 'Manual override (high HRV)', pnl: 0 },
  { sym: 'WIPRO', wt: '7.7%', qty: 100, buyPrice: 390.00, risk: 'mid', bio: '✅', bioTip: 'Algo-placed', pnl: 0 },
  { sym: 'BAJFINANCE', wt: '6.5%', qty: 5, buyPrice: 7200.00, risk: 'high', bio: '🚨', bioTip: 'Social contagion flag: Reddit spike', pnl: 0 },
  { sym: 'SBIN', wt: '5.9%', qty: 70, buyPrice: 570.00, risk: 'low', bio: '✅', bioTip: 'Algo-placed', pnl: 0 },
  { sym: 'ITC', wt: '5.2%', qty: 150, buyPrice: 430.00, risk: 'low', bio: '✅', bioTip: 'Algo-placed', pnl: 0 },
];

function renderHoldings() {
  const tbody = document.getElementById('holdings-tbody');
  if (!tbody) return;
  tbody.innerHTML = HOLDINGS.map(h => {
    const isHedged = State.putsHedged || State.marketRegime === 'crash';
    const hedgeTag = isHedged ? '<span class="hedge-badge">🛡️ Hedged</span>' : '';

    return `
      <tr>
        <td>${h.sym}${hedgeTag}</td>
        <td style="font-family:var(--font-mono);color:var(--text-mono)">${h.wt}</td>
        <td class="${h.pnl >= 0 ? 'positive' : 'negative'}" style="font-family:var(--font-mono)">
          ${formatINR(h.pnl)}
        </td>
        <td>
          <span class="risk-badge risk-${h.risk}">
            ${h.risk === 'low' ? '● LOW' : h.risk === 'mid' ? '● MID' : '▲ HIGH'}
          </span>
        </td>
        <td>
          <span class="bio-flag" title="${h.bioTip}">${h.bio}</span>
        </td>
      </tr>
    `;
  }).join('');
}

function updateDashboardPnL() {
  let totalPnL = 0;
  HOLDINGS.forEach(h => {
    const match = MARKET_DIRECTORY.find(st => st.sym === h.sym);
    if (match) {
      h.pnl = (match.price - h.buyPrice) * h.qty;
      totalPnL += h.pnl;
    }
  });

  const pnlEl = document.getElementById('pnl-main');
  if (pnlEl) {
    pnlEl.textContent = formatINR(totalPnL);
    pnlEl.className = `pnl-number ${totalPnL >= 0 ? 'positive' : 'negative'}`;
  }

  // Also update holdings table rendering
  renderHoldings();
}

// ─── Activity Feed ────────────────────────────────────────────────
const FEED_ITEMS = [
  { type: 'buy', title: 'BUY RELIANCE 45 shares', sub: 'Algo-executed · λ=0.63 · Arousal: 0.21', time: '11:42 AM' },
  { type: 'info', title: 'Pre-Market Brief Delivered', sub: 'HRV +8% above baseline · Full autonomy active', time: '09:05 AM' },
  { type: 'override', title: 'OVERRIDE: Sold TATAMOTORS', sub: '⚠ Biometric flag: HRV=55ms · Circuit bypassed manually', time: '08:51 AM' },
  { type: 'circuit', title: 'Circuit Breaker Armed', sub: 'Arousal score crossed 0.75 threshold', time: 'Yesterday' },
  { type: 'sell', title: 'SELL ZOMATO 120 shares', sub: 'Social contagion flag · Reddit spike detected', time: 'Yesterday' },
  { type: 'info', title: 'Lambda Auto-adjusted', sub: 'Sleep quality 61% → λ bumped from 0.58 → 0.74', time: '2d ago' },
  { type: 'buy', title: 'BUY SBIN 200 shares', sub: 'Institutional mimicry · 13-F pattern match', time: '2d ago' },
];

function renderFeed() {
  const el = document.getElementById('activity-feed');
  if (!el) return;
  el.innerHTML = FEED_ITEMS.map(f => `
    <div class="feed-item">
      <div class="feed-dot ${f.type}"></div>
      <div class="feed-text">
        <div class="feed-title">${f.title}</div>
        <div class="feed-sub">${f.sub}</div>
      </div>
      <div class="feed-time">${f.time}</div>
    </div>
  `).join('');
}

// ─── Shadow Portfolio Chart ───────────────────────────────────────
function renderShadowChart() {
  const canvas = document.getElementById('shadow-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 900;
  const H = canvas.height;

  const days = 365;
  const labels = [], algo = [], actual = [];
  let aV = 0, mV = 0;
  for (let i = days; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if (i % 30 === 0) labels.push(`${d.toLocaleString('default', { month: 'short' })}`);
    else labels.push('');
    aV += rand(-1.0, 2.0); mV += rand(-1.4, 1.7);
    algo.push(aV); actual.push(mV);
  }

  const allV = [...algo, ...actual];
  const minV = Math.min(...allV) - 2, maxV = Math.max(...allV) + 2;
  const pad = { l: 52, r: 20, t: 20, b: 36 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;

  ctx.clearRect(0, 0, W, H);

  // Grid
  for (let i = 0; i <= 5; i++) {
    const y = pad.t + (iH / 5) * i;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = 'rgba(138,163,199,0.5)';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    const val = maxV - ((maxV - minV) / 5) * i;
    ctx.fillText(val.toFixed(1) + '%', pad.l - 6, y + 4);
  }

  function drawSeries(data, color, shadow, dashed = false) {
    const pts = data.map((v, i) => [
      pad.l + (i / (data.length - 1)) * iW,
      pad.t + ((maxV - v) / (maxV - minV)) * iH,
    ]);
    if (dashed) ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const mx = (pts[i - 1][0] + pts[i][0]) / 2;
      ctx.bezierCurveTo(mx, pts[i - 1][1], mx, pts[i][1], pts[i][0], pts[i][1]);
    }
    ctx.strokeStyle = color; ctx.lineWidth = 2.5;
    ctx.shadowBlur = 10; ctx.shadowColor = shadow;
    ctx.stroke(); ctx.shadowBlur = 0; ctx.setLineDash([]);
  }

  // Shade gap area
  ctx.beginPath();
  const algoP = algo.map((v, i) => [pad.l + (i / (algo.length - 1)) * iW, pad.t + ((maxV - v) / (maxV - minV)) * iH]);
  const actP = actual.map((v, i) => [pad.l + (i / (actual.length - 1)) * iW, pad.t + ((maxV - v) / (maxV - minV)) * iH]);
  ctx.moveTo(algoP[0][0], algoP[0][1]);
  algoP.forEach(p => ctx.lineTo(p[0], p[1]));
  for (let i = actP.length - 1; i >= 0; i--) ctx.lineTo(actP[i][0], actP[i][1]);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,71,87,0.06)';
  ctx.fill();

  drawSeries(actual, 'rgba(245,166,35,0.85)', 'rgba(245,166,35,0.4)', true);
  drawSeries(algo, '#00E5A0', '#00E5A0');

  // X labels
  ctx.fillStyle = 'rgba(138,163,199,0.5)'; ctx.font = '10px Inter, sans-serif'; ctx.textAlign = 'center';
  labels.forEach((l, i) => {
    if (l) ctx.fillText(l, pad.l + (i / (labels.length - 1)) * iW, H - 8);
  });

  // Legend
  ctx.fillStyle = '#00E5A0'; ctx.fillRect(20, 8, 14, 3);
  ctx.fillStyle = 'rgba(138,163,199,0.8)'; ctx.font = '11px Inter'; ctx.textAlign = 'left';
  ctx.fillText('Algorithm Portfolio', 40, 12);
  ctx.fillStyle = 'rgba(245,166,35,0.85)'; ctx.fillRect(20, 22, 14, 3);
  ctx.fillStyle = 'rgba(138,163,199,0.7)';
  ctx.fillText('Your Actual Portfolio', 40, 26);
  ctx.fillStyle = 'rgba(255,71,87,0.4)'; ctx.fillRect(20, 36, 14, 8);
  ctx.fillStyle = 'rgba(138,163,199,0.5)';
  ctx.fillText('Behavioral Drag', 40, 43);
}

// ─── Override List ────────────────────────────────────────────────
const OVERRIDES = [
  { date: '2026-05-18', desc: 'Sold BAJFINANCE at ₹6,120 — panic sell after Reddit thread', cost: '-₹8,400 vs algo' },
  { date: '2026-04-29', desc: 'Bought TATAMOTORS during Nifty correction — emotional bottom-pick', cost: '-₹12,600 vs algo' },
  { date: '2026-04-03', desc: 'Held ZOMATO through earnings loss (algo issued sell signal)', cost: '-₹9,100 vs algo' },
  { date: '2026-03-15', desc: 'Bypassed circuit breaker — traded during 76 ms HRV session', cost: '-₹5,200 vs algo' },
  { date: '2026-02-28', desc: 'FOMO buy ADANI after media coverage spike', cost: '-₹14,800 vs algo' },
];

function renderOverrides() {
  const el = document.getElementById('override-list');
  if (!el) return;
  el.innerHTML = OVERRIDES.map(o => `
    <div class="override-item">
      <div class="override-date">${o.date}</div>
      <div class="override-desc">${o.desc}</div>
      <div class="override-cost">${o.cost}</div>
    </div>
  `).join('');
}

// ─── Social Contagion Chart ───────────────────────────────────────
function renderContagionChart() {
  const canvas = document.getElementById('contagion-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 400;
  const H = canvas.height;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const contam = [0.18, 0.22, 0.45, 0.31, 0.28, 0.52, 0.41, 0.19, 0.38, 0.29, 0.34, 0.21];
  const pad = { l: 36, r: 16, t: 20, b: 36 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  const barW = iW / months.length * 0.6;

  ctx.clearRect(0, 0, W, H);

  // Threshold line at 0.35
  const threshY = pad.t + (1 - 0.35) * iH;
  ctx.beginPath(); ctx.moveTo(pad.l, threshY); ctx.lineTo(W - pad.r, threshY);
  ctx.strokeStyle = 'rgba(255,71,87,0.4)'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
  ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,71,87,0.6)'; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'left';
  ctx.fillText('threshold 0.35', pad.l + 4, threshY - 4);

  contam.forEach((v, i) => {
    const x = pad.l + (i / months.length) * iW + (iW / months.length) * 0.2;
    const bH = v * iH;
    const y = pad.t + iH - bH;
    const isHigh = v >= 0.35;

    const grad = ctx.createLinearGradient(0, y, 0, y + bH);
    if (isHigh) {
      grad.addColorStop(0, 'rgba(255,71,87,0.8)');
      grad.addColorStop(1, 'rgba(255,71,87,0.2)');
    } else {
      grad.addColorStop(0, 'rgba(0,212,255,0.7)');
      grad.addColorStop(1, 'rgba(0,212,255,0.15)');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, bH, 3);
    ctx.fill();

    ctx.fillStyle = 'rgba(138,163,199,0.6)';
    ctx.font = '9px Inter'; ctx.textAlign = 'center';
    ctx.fillText(months[i], x + barW / 2, H - 8);

    ctx.fillStyle = isHigh ? 'rgba(255,71,87,0.9)' : 'rgba(0,212,255,0.8)';
    ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'center';
    ctx.fillText(v.toFixed(2), x + barW / 2, y - 4);
  });

  ctx.fillStyle = 'rgba(138,163,199,0.4)'; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'right';
  for (let i = 0; i <= 5; i++) {
    const y = pad.t + (iH / 5) * i;
    ctx.fillText((1 - i * 0.2).toFixed(1), pad.l - 4, y + 3);
  }
}

// ─── Behavioral Heatmap ────────────────────────────────────────────
function renderHeatmap() {
  const canvas = document.getElementById('heatmap-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 700;
  const H = canvas.height;

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const hours = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm'];

  const raw = [
    [0.22, 0.18, 0.41, 0.25, 0.52, 0.31, 0.67, 0.44],
    [0.19, 0.14, 0.38, 0.21, 0.48, 0.29, 0.62, 0.41],
    [0.24, 0.20, 0.44, 0.27, 0.55, 0.33, 0.71, 0.48],
    [0.16, 0.12, 0.35, 0.18, 0.44, 0.26, 0.59, 0.38],
    [0.31, 0.28, 0.55, 0.36, 0.68, 0.47, 0.79, 0.61],
  ];

  const pad = { l: 48, r: 20, t: 32, b: 36 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  const cW = iW / hours.length, cH = iH / days.length;

  ctx.clearRect(0, 0, W, H);

  days.forEach((d, di) => {
    hours.forEach((h, hi) => {
      const v = raw[di][hi];
      const x = pad.l + hi * cW, y = pad.t + di * cH;
      const r = Math.round(lerp(0, 255, v));
      const g = Math.round(lerp(229, 71, v));
      const b = Math.round(lerp(160, 87, v));
      ctx.fillStyle = `rgba(${r},${g},${b},${0.3 + v * 0.65})`;
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 2, cW - 4, cH - 4, 4);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'center';
      ctx.fillText((v * 100).toFixed(0) + '%', x + cW / 2, y + cH / 2 + 4);
    });
    ctx.fillStyle = 'rgba(138,163,199,0.6)'; ctx.font = '11px Inter';
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(d, pad.l - 6, pad.t + di * cH + cH / 2);
  });

  hours.forEach((h, hi) => {
    ctx.fillStyle = 'rgba(138,163,199,0.6)'; ctx.font = '10px Inter';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(h, pad.l + hi * cW + cW / 2, pad.t - 20);
  });

  // Title annotation
  ctx.fillStyle = 'rgba(255,71,87,0.7)'; ctx.font = '10px Inter'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('↑ Fri close + late afternoon = highest bad-trade probability', pad.l, H - 18);
}

// ─── Risk Conditions ─────────────────────────────────────────────
const RISK_CONDITIONS = [
  { label: 'Friday 3–4pm trading session', pct: 79 },
  { label: 'HRV below 55ms (2σ stress zone)', pct: 71 },
  { label: 'Trade within 5min of viral Reddit post', pct: 68 },
  { label: 'Sleep quality below 65%', pct: 63 },
  { label: 'Day after portfolio loss >2%', pct: 57 },
];

function renderRiskConditions() {
  const el = document.getElementById('risk-conditions');
  if (!el) return;
  el.innerHTML = RISK_CONDITIONS.map(r => `
    <div class="risk-cond-item">
      <div class="risk-cond-label">${r.label}</div>
      <div class="risk-cond-bar-wrap">
        <div class="risk-cond-bar"><div class="risk-cond-fill" style="width:${r.pct}%"></div></div>
        <span class="risk-cond-pct">${r.pct}%</span>
      </div>
    </div>
  `).join('');
}

// ─── Feature Importance Chart ─────────────────────────────────────
function renderFeatureChart() {
  const canvas = document.getElementById('feature-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 500;
  const H = canvas.height;

  const features = [
    { label: 'HRV Z-Score', val: 0.31, color: '#00D4FF' },
    { label: 'Time of Day', val: 0.22, color: '#7B2FBE' },
    { label: 'Social Sentiment', val: 0.18, color: '#FF6B35' },
    { label: 'Sleep Quality', val: 0.14, color: '#00E5A0' },
    { label: 'Days Since Loss', val: 0.09, color: '#F5A623' },
    { label: 'Cursor Erraticity', val: 0.06, color: '#FF4757' },
  ];

  const pad = { l: 140, r: 40, t: 20, b: 30 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  const barH = iH / features.length * 0.6;

  ctx.clearRect(0, 0, W, H);

  features.forEach((f, i) => {
    const y = pad.t + (i / features.length) * iH + (iH / features.length) * 0.2;
    const bW = f.val * iW;
    const grad = ctx.createLinearGradient(pad.l, 0, pad.l + bW, 0);
    grad.addColorStop(0, f.color);
    grad.addColorStop(1, 'rgba(0,212,255,0.05)');

    ctx.fillStyle = `${f.color}22`;
    ctx.beginPath(); ctx.roundRect(pad.l, y, iW, barH, 3); ctx.fill();

    ctx.fillStyle = f.color;
    ctx.shadowBlur = 8; ctx.shadowColor = f.color;
    ctx.beginPath(); ctx.roundRect(pad.l, y, bW, barH, 3); ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(232,240,254,0.85)'; ctx.font = '11px Inter';
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(f.label, pad.l - 8, y + barH / 2);

    ctx.fillStyle = 'rgba(232,240,254,0.7)'; ctx.textAlign = 'left';
    ctx.fillText((f.val * 100).toFixed(0) + '%', pad.l + bW + 6, y + barH / 2);
  });

  ctx.fillStyle = 'rgba(138,163,199,0.4)'; ctx.font = '10px Inter';
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText('Feature Importance Score (SHAP)', W / 2, H);
}

// ─── Alpha Improvement Chart ──────────────────────────────────────
function renderAlphaImprovementChart() {
  const canvas = document.getElementById('alpha-improvement-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 500;
  const H = canvas.height;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const drag = [38000, 34200, 29500, 26800, 24100, 20400, 18700, 15200, 12900, 10500, 8200, 5100];
  const maxV = 40000;
  const pad = { l: 52, r: 20, t: 20, b: 36 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  const barW = iW / months.length * 0.6;

  ctx.clearRect(0, 0, W, H);

  drag.forEach((v, i) => {
    const x = pad.l + (i / months.length) * iW + (iW / months.length) * 0.2;
    const bH = (v / maxV) * iH;
    const y = pad.t + iH - bH;
    const t = 1 - v / maxV;
    const grad = ctx.createLinearGradient(0, y, 0, y + bH);
    grad.addColorStop(0, `rgba(${Math.round(255 * t)},${Math.round(229 * (1 - t) + 71 * t)},${Math.round(160 * t + 87 * (1 - t))},0.85)`);
    grad.addColorStop(1, 'rgba(0,0,0,0.1)');

    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(x, y, barW, bH, 3); ctx.fill();

    ctx.fillStyle = 'rgba(138,163,199,0.6)'; ctx.font = '9px Inter';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(months[i], x + barW / 2, H - 6);

    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(232,240,254,0.6)'; ctx.font = '8px JetBrains Mono';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`₹${(v / 1000).toFixed(0)}K`, x + barW / 2, y - 2);
    }
  });

  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (iH / 4) * i;
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    ctx.fillStyle = 'rgba(138,163,199,0.4)'; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'right';
    ctx.fillText(`₹${(maxV * (1 - i / 4) / 1000).toFixed(0)}K`, pad.l - 4, y + 3);
  }

  ctx.fillStyle = 'rgba(0,229,160,0.7)'; ctx.font = '10px Inter'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('↓ Behavioral drag shrinking as you trust the system more', pad.l + 4, pad.t + 4);
}

// ─── HRV Chart (Biometrics Tab) ───────────────────────────────────
function initHRVHistory() {
  let v = 70;
  const n = 96; // 15-min intervals over a day
  for (let i = 0; i < n; i++) {
    v = clamp(v + rand(-3, 3), 45, 100);
    State.hrvHistory.push(v);
  }
}

function renderHRVChart() {
  const canvas = document.getElementById('hrv-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 700;
  const H = canvas.height;

  const data = State.hrvHistory;
  const minV = Math.min(...data) - 5, maxV = Math.max(...data) + 5;
  const pad = { l: 44, r: 20, t: 20, b: 30 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;

  ctx.clearRect(0, 0, W, H);

  // Stress zone
  const stressY = pad.t + ((maxV - 55) / (maxV - minV)) * iH;
  ctx.fillStyle = 'rgba(255,71,87,0.05)';
  ctx.fillRect(pad.l, stressY, iW, pad.t + iH - stressY);
  ctx.strokeStyle = 'rgba(255,71,87,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(pad.l, stressY); ctx.lineTo(W - pad.r, stressY); stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,71,87,0.6)'; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'left';
  ctx.fillText('circuit threshold (HRV < 55ms)', pad.l + 4, stressY - 4);

  // Baseline
  const baseY = pad.t + ((maxV - 68.4) / (maxV - minV)) * iH;
  ctx.strokeStyle = 'rgba(0,212,255,0.25)'; ctx.lineWidth = 1; ctx.setLineDash([6, 4]);
  ctx.beginPath(); ctx.moveTo(pad.l, baseY); ctx.lineTo(W - pad.r, baseY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(0,212,255,0.5)'; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'right';
  ctx.fillText('30d baseline 68.4ms', W - pad.r - 4, baseY - 4);

  // Grid Y
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (iH / 4) * i;
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    ctx.fillStyle = 'rgba(138,163,199,0.5)'; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'right';
    ctx.fillText(Math.round(maxV - ((maxV - minV) / 4) * i), pad.l - 4, y + 3);
  }

  const pts = data.map((v, i) => [
    pad.l + (i / (data.length - 1)) * iW,
    pad.t + ((maxV - v) / (maxV - minV)) * iH,
  ]);

  const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + iH);
  grad.addColorStop(0, 'rgba(0,212,255,0.2)');
  grad.addColorStop(1, 'rgba(0,212,255,0)');
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    const mx = (pts[i - 1][0] + pts[i][0]) / 2;
    ctx.bezierCurveTo(mx, pts[i - 1][1], mx, pts[i][1], pts[i][0], pts[i][1]);
  }
  ctx.lineTo(W - pad.r, pad.t + iH); ctx.lineTo(pad.l, pad.t + iH); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();

  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    const mx = (pts[i - 1][0] + pts[i][0]) / 2;
    ctx.bezierCurveTo(mx, pts[i - 1][1], mx, pts[i][1], pts[i][0], pts[i][1]);
  }
  ctx.strokeStyle = '#00D4FF'; ctx.lineWidth = 2;
  ctx.shadowBlur = 8; ctx.shadowColor = '#00D4FF'; ctx.stroke(); ctx.shadowBlur = 0;

  // X labels
  const timeLabels = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm'];
  timeLabels.forEach((l, i) => {
    const x = pad.l + (i / (timeLabels.length - 1)) * iW;
    ctx.fillStyle = 'rgba(138,163,199,0.5)'; ctx.font = '9px Inter';
    ctx.textAlign = 'center'; ctx.fillText(l, x, H - 6);
  });
}

// ─── Arousal Distribution Chart ───────────────────────────────────
function renderArousalDist() {
  const canvas = document.getElementById('arousal-dist-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 460;
  const H = canvas.height;

  const bins = 20;
  const data = Array(bins).fill(0);
  for (let i = 0; i < 2000; i++) {
    const v = clamp(Math.abs(rand(0, 0.6) + rand(-0.1, 0.1)), 0, 1);
    const b = Math.floor(v * bins);
    if (b < bins) data[b]++;
  }
  const maxD = Math.max(...data);
  const pad = { l: 36, r: 16, t: 20, b: 36 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  const bW = iW / bins;

  ctx.clearRect(0, 0, W, H);

  data.forEach((v, i) => {
    const x = pad.l + i * bW;
    const bH = (v / maxD) * iH;
    const y = pad.t + iH - bH;
    const t = i / bins;
    const r = Math.round(lerp(0, 255, t));
    const g = Math.round(lerp(229, 71, t));
    const b = Math.round(lerp(160, 87, t));
    ctx.fillStyle = `rgba(${r},${g},${b},0.75)`;
    ctx.beginPath(); ctx.roundRect(x + 1, y, bW - 2, bH, 2); ctx.fill();
  });

  // Vertical line at current arousal
  const curX = pad.l + State.arousal * iW;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(curX, pad.t); ctx.lineTo(curX, pad.t + iH); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '9px Inter';
  ctx.textAlign = 'center'; ctx.fillText(`Current: ${State.arousal.toFixed(2)}`, curX, pad.t + 10);

  // X axis
  ['0', '0.25', '0.5', '0.75', '1.0'].forEach((l, i) => {
    ctx.fillStyle = 'rgba(138,163,199,0.5)'; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'center';
    ctx.fillText(l, pad.l + i * (iW / 4), H - 8);
  });
  ctx.fillStyle = 'rgba(138,163,199,0.4)'; ctx.font = '10px Inter'; ctx.textAlign = 'center';
  ctx.fillText('Arousal Score Distribution (30 days)', W / 2, H);
}

function initLambdaHistory() {
  let v = 0.63;
  for (let i = 0; i < 30; i++) {
    v = clamp(v + rand(-0.04, 0.04), 0.35, 0.92);
    State.lambdaHistory.push(v);
  }
}

// ─── Lambda History Chart ─────────────────────────────────────────
function renderLambdaHistory() {
  const canvas = document.getElementById('lambda-history-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 460;
  const H = canvas.height;

  const data = State.lambdaHistory;
  const minV = 0.3, maxV = 1.0;
  const pad = { l: 44, r: 20, t: 20, b: 30 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;

  ctx.clearRect(0, 0, W, H);

  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (iH / 4) * i;
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    ctx.fillStyle = 'rgba(138,163,199,0.4)'; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'right';
    ctx.fillText((maxV - ((maxV - minV) / 4) * i).toFixed(2), pad.l - 4, y + 3);
  }

  const pts = data.map((v, i) => [
    pad.l + (i / (data.length - 1)) * iW,
    pad.t + ((maxV - v) / (maxV - minV)) * iH,
  ]);

  const grad = ctx.createLinearGradient(0, 0, iW, 0);
  grad.addColorStop(0, '#FF6B35');
  grad.addColorStop(0.5, '#00D4FF');
  grad.addColorStop(1, '#7B2FBE');

  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    const mx = (pts[i - 1][0] + pts[i][0]) / 2;
    ctx.bezierCurveTo(mx, pts[i - 1][1], mx, pts[i][1], pts[i][0], pts[i][1]);
  }
  ctx.strokeStyle = grad; ctx.lineWidth = 2.5;
  ctx.shadowBlur = 8; ctx.shadowColor = '#00D4FF'; ctx.stroke(); ctx.shadowBlur = 0;

  pts.forEach(([x, y]) => {
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#00D4FF'; ctx.shadowBlur = 6; ctx.shadowColor = '#00D4FF'; ctx.fill(); ctx.shadowBlur = 0;
  });

  ctx.fillStyle = 'rgba(138,163,199,0.4)'; ctx.font = '10px Inter';
  ctx.textAlign = 'center'; ctx.fillText('Daily λ Value (bio-adjusted)', W / 2, H);
}

// ─── Demat Execution Firewall Gateway ─────────────────────────────
function logToBrokerTerminal(msg, type = 'info') {
  const terminal = document.getElementById('broker-terminal');
  if (!terminal) return;
  const entry = document.createElement('div');
  entry.className = `term-entry ${type}`;
  const now = new Date().toLocaleTimeString();
  entry.textContent = `[${now}] ${msg}`;
  terminal.appendChild(entry);
  terminal.scrollTop = terminal.scrollHeight;
}

function executeBrokerOrder(order) {
  // Check if Bio-Guard Firewall blocks it
  if (State.bioGuardEnabled && State.arousal > 0.75) {
    logToBrokerTerminal(`[BIO-GUARD BLOCK] Intercepted order: ${order.action} ${order.qty} ${order.sym}. Reason: Arousal Z-score (${State.arousal.toFixed(2)}) above threshold.`, 'err');

    // Add override/blocked activity to feed
    const blockFeed = {
      type: 'override',
      title: `FIREWALL BLOCK: ${order.sym} ${order.action}`,
      sub: `Biometric threat detected. Intercepted outgoing broker call.`,
      time: 'Just Now'
    };
    FEED_ITEMS.unshift(blockFeed);
    renderFeed();

    // Trigger physical countdown warning
    triggerCircuitBreaker();
    return false;
  }

  // Else proceed to route to Demat broker API
  const orderRef = randInt(204901, 804918);
  logToBrokerTerminal(`[ORDER SEND] Routing ${order.action} ${order.qty} shares of ${order.sym} to broker REST gateway...`, 'send');

  setTimeout(() => {
    if (!State.dematConnected) {
      logToBrokerTerminal(`[GATEWAY ERROR] Connection timed out. Broker session validation failed. Please check credentials.`, 'err');
      return;
    }

    // Success response
    const cost = order.qty * order.price;
    if (order.action === 'BUY' && cost > State.freeCapital) {
      logToBrokerTerminal(`[BROKER REJECT] Insufficient margin. Order value ₹${cost.toLocaleString()} exceeds free capital.`, 'err');
      return;
    }

    if (order.action === 'BUY') {
      State.freeCapital -= cost;
      State.usedMargin += cost;
    } else {
      State.freeCapital += cost;
      State.usedMargin = Math.max(0, State.usedMargin - cost);
    }

    logToBrokerTerminal(`[ORDER RECV] Order executed successfully. Ref: ${orderRef}. Filled at average price ₹${order.price.toFixed(2)}.`, 'recv');

    // Update margins panels if visible
    updateMarginsDisplay();

    // Add activity log to dashboard
    const actFeed = {
      type: order.action === 'BUY' ? 'buy' : 'sell',
      title: `${order.action} ${order.sym} ${order.qty} shares`,
      sub: `Gateway routed · Filled via Demat API · Ref ID: ${orderRef}`,
      time: 'Just Now'
    };
    FEED_ITEMS.unshift(actFeed);
    renderFeed();

  }, 400);

  return true;
}

function updateMarginsDisplay() {
  const fCap = document.getElementById('margin-free-capital');
  const uMar = document.getElementById('margin-used');
  const avail = document.getElementById('margin-available');
  if (fCap && uMar && avail) {
    fCap.textContent = `₹${State.freeCapital.toLocaleString()}`;
    uMar.textContent = `₹${State.usedMargin.toLocaleString()}`;
    avail.textContent = `₹${(State.freeCapital + State.collateral).toLocaleString()}`;
  }
}

// ─── Yahoo Finance Live Web Quote Gateway ─────────────────────────
async function fetchWithProxy(yahooUrl) {
  const proxies = [
    {
      name: 'CorsProxy.io',
      getUrl: (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
      parse: (text) => JSON.parse(text)
    },
    {
      name: 'AllOrigins',
      getUrl: (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      parse: (text) => {
        const wrapper = JSON.parse(text);
        return JSON.parse(wrapper.contents);
      }
    },
    {
      name: 'CodeTabs',
      getUrl: (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
      parse: (text) => JSON.parse(text)
    }
  ];

  let lastError = null;
  for (const proxy of proxies) {
    const proxyUrl = proxy.getUrl(yahooUrl);

    // Use Promise.race resolving to an object to completely avoid throwing exceptions and debugger pauses
    const fetchPromise = fetch(proxyUrl).catch(() => ({ isError: true }));
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ isTimeout: true }), 5000));

    const res = await Promise.race([fetchPromise, timeoutPromise]);

    if (res.isTimeout) {
      lastError = 'Timeout after 5000ms';
      continue;
    }

    if (res.isError) {
      lastError = 'Network or CORS error';
      continue;
    }

    if (!res.ok) {
      lastError = `HTTP ${res.status}`;
      continue;
    }

    try {
      const text = await res.text();
      const data = proxy.parse(text);

      if (!data.quoteResponse || !data.quoteResponse.result) {
        lastError = 'Invalid response structure';
        continue;
      }

      return { data, proxyName: proxy.name };
    } catch (err) {
      lastError = 'Parse error';
    }
  }
  return { error: lastError || 'All proxies failed' };
}

async function refreshLiveMarketFeed() {
  if (State.marketRegime === 'crash' || State.marketRegime === 'gapdown') {
    applyRegimeMetrics();
    return;
  }

  const badge = document.getElementById('market-source-badge');
  if (badge) {
    badge.textContent = 'Source: Syncing live NSE quotes...';
    badge.style.color = 'var(--cyan)';
  }

  const tickers = ['^NSEI', '^BSESN'];
  MARKET_DIRECTORY.forEach(st => {
    if (st.sym === 'M&M') {
      tickers.push('M%26M.NS');
    } else {
      tickers.push(`${st.sym}.NS`);
    }
  });
  BEST_PERFORMERS.forEach(st => {
    tickers.push(`${st.sym}.NS`);
  });

  const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${tickers.join(',')}`;
  const fetchResult = await fetchWithProxy(yahooUrl);

  if (!fetchResult.error) {
    const { data, proxyName } = fetchResult;
    const results = data.quoteResponse?.result || [];

    const quoteMap = {};
    results.forEach(q => {
      const baseSym = q.symbol.replace('.NS', '');
      quoteMap[baseSym] = q;
    });

    let successCount = 0;

    // Update indices
    if (quoteMap['^NSEI']) {
      State.indicesPrices.NIFTY.price = quoteMap['^NSEI'].regularMarketPrice ?? State.indicesPrices.NIFTY.price;
      State.indicesPrices.NIFTY.chg = quoteMap['^NSEI'].regularMarketChangePercent ?? State.indicesPrices.NIFTY.chg;
      State.lastActualPrices['NIFTY'] = State.indicesPrices.NIFTY.price;
      State.lastActualPrices['NIFTY_CHG'] = State.indicesPrices.NIFTY.chg;
    }
    if (quoteMap['^BSESN']) {
      State.indicesPrices.SENSEX.price = quoteMap['^BSESN'].regularMarketPrice ?? State.indicesPrices.SENSEX.price;
      State.indicesPrices.SENSEX.chg = quoteMap['^BSESN'].regularMarketChangePercent ?? State.indicesPrices.SENSEX.chg;
      State.lastActualPrices['SENSEX'] = State.indicesPrices.SENSEX.price;
      State.lastActualPrices['SENSEX_CHG'] = State.indicesPrices.SENSEX.chg;
    }

    // Update stocks
    MARKET_DIRECTORY.forEach(st => {
      const quote = quoteMap[st.sym];
      if (quote) {
        st.price = quote.regularMarketPrice ?? st.price;
        st.chg = quote.regularMarketChangePercent ?? st.chg;
        st.bid = quote.bid && quote.bid > 0 ? quote.bid : st.price - rand(0.05, 0.25);
        st.ask = quote.ask && quote.ask > 0 ? quote.ask : st.price + rand(0.05, 0.25);

        State.lastActualPrices[st.sym] = st.price;
        successCount++;
      }
    });

    BEST_PERFORMERS.forEach(st => {
      const quote = quoteMap[st.sym];
      if (quote) {
        st.price = quote.regularMarketPrice ?? st.price;
        st.chg = quote.regularMarketChangePercent ?? st.chg;

        State.lastActualPrices[st.sym] = st.price;
        successCount++;
      }
    });

    if (successCount > 0) {
      const displayRegime = State.marketRegime === 'hedge' ? ' + Delta Puts Active' : '';
      State.marketFeedSource = `Yahoo Finance Live (via ${proxyName})${displayRegime}`;
      if (badge) {
        badge.textContent = `Source: ${State.marketFeedSource}`;
        badge.style.color = 'var(--green)';
      }

      // Update index tags to Nominal
      const nTag = document.getElementById('nifty-status-tag');
      const sTag = document.getElementById('sensex-status-tag');
      if (State.marketRegime === 'hedge') {
        if (nTag) nTag.textContent = '🛡️ DELTA PUTS ARMED';
        if (sTag) sTag.textContent = '🛡️ DELTA PUTS ARMED';
      } else {
        if (nTag) nTag.textContent = '✓ LIVE INDEX UPDATES';
        if (sTag) sTag.textContent = '✓ LIVE INDEX UPDATES';
      }
    } else {
      fetchResult.error = 'No quotes matched our symbols';
    }

  }

  if (fetchResult.error) {
    console.warn('Batch fetch failed, running fallback simulated ticks:', fetchResult.error);
    MARKET_DIRECTORY.forEach(st => {
      const changeFactor = rand(-0.0005, 0.0005);
      st.price *= (1 + changeFactor);
      st.chg = clamp(st.chg + changeFactor * 100, -8, 8);
      st.bid = st.price - rand(0.02, 0.15);
      st.ask = st.price + rand(0.02, 0.15);
    });

    BEST_PERFORMERS.forEach(st => {
      const changeFactor = rand(-0.0005, 0.0005);
      st.price *= (1 + changeFactor);
      st.chg = clamp(st.chg + changeFactor * 100, -8, 8);
    });

    const changeFactor = rand(-0.0002, 0.0002);
    State.indicesPrices.NIFTY.price *= (1 + changeFactor);
    State.indicesPrices.SENSEX.price *= (1 + changeFactor);

    State.marketFeedSource = 'Dexter Simulated Feed (Offline)';
    if (badge) {
      badge.textContent = 'Source: Dexter Simulated Feed (Offline)';
      badge.style.color = 'var(--amber)';
    }

    const nTag = document.getElementById('nifty-status-tag');
    const sTag = document.getElementById('sensex-status-tag');
    if (State.marketRegime === 'nominal') {
      if (nTag) nTag.textContent = '✓ OFFLINE TICK SIMULATION';
      if (sTag) sTag.textContent = '✓ OFFLINE TICK SIMULATION';
    } else if (State.marketRegime === 'hedge') {
      if (nTag) nTag.textContent = '🛡️ DELTA PUTS ARMED';
      if (sTag) sTag.textContent = '🛡️ DELTA PUTS ARMED';
    }
  }

  updateIndicesUI();
  updateDashboardPnL();
  if (State.activeTab === 'market') {
    renderMarketScannerTable(State.currentMarketFilter, State.currentMarketSearch);
    renderWatchlist();
    renderBestPerformers();
  }
}

function updateMarketFeedLabel() {
  const badge = document.getElementById('market-source-badge');
  if (badge) {
    badge.textContent = `Source: ${State.marketFeedSource}`;
    if (State.marketFeedSource.includes('Yahoo')) badge.style.color = 'var(--green)';
    else if (State.marketFeedSource.includes('Simulated')) badge.style.color = 'var(--amber)';
    else badge.style.color = 'var(--text-dim)';
  }
}

window.setMarketRegime = function (regime) {
  State.marketRegime = regime;

  document.querySelectorAll('.regime-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.getElementById(`regime-${regime}`);
  if (activeBtn) activeBtn.classList.add('active');

  document.body.classList.remove('crisis-panic');

  if (regime === 'crash') {
    document.body.classList.add('crisis-panic');
    State.arousal = 0.93;
    State.hrv = 41;
    updateBiometricVisuals(0.93);
    triggerCircuitBreaker();

    logToBrokerTerminal(`[CRITICAL REGIME] FLASH CRASH DETECTED. Nifty 50 falls -5.52%. Panic selling signal high.`, 'err');
    logToBrokerTerminal(`[FIREWALL BLOCK] Bio-Guard locked manual broker orders. Intercepted override attempts.`, 'err');
    logToBrokerTerminal(`[HEDGE AUTO-PLACE] Out-of-the-money put options activated at delta -0.25. Downside protection locked.`, 'recv');

    const alertFeed = {
      type: 'override',
      title: 'CRISIS ALERT: FLASH CRASH',
      sub: 'Bio-Guard locked execution. Portfolio delta hedge automatically deployed.',
      time: 'Just Now'
    };
    FEED_ITEMS.unshift(alertFeed);
    renderFeed();

    applyRegimeMetrics();
  } else if (regime === 'gapdown') {
    State.arousal = 0.68;
    State.hrv = 51;
    updateBiometricVisuals(0.68);

    logToBrokerTerminal(`[MARKET REGIME] Projected gap down opening of -3.2% detected. Staggering execution collars.`, 'warn');
    logToBrokerTerminal(`[COLLAR HEURISTIC] Risk Lambda adjusted to defensive level: 0.82.`, 'info');

    const warnFeed = {
      type: 'info',
      title: 'Gap Down Protocol Engaged',
      sub: 'Lambda increased to 0.82. Order collars tightened dynamically.',
      time: 'Just Now'
    };
    FEED_ITEMS.unshift(warnFeed);
    renderFeed();

    applyRegimeMetrics();
  } else if (regime === 'hedge') {
    State.putsHedged = true;
    logToBrokerTerminal(`[HEDGE ENGAGED] Delta-neutral portfolio hedging active. Put protection overlay validated.`, 'recv');

    const hedgeFeed = {
      type: 'buy',
      title: 'Delta Hedge Puts Purchased',
      sub: 'Portfolio downside risk capped. Defensive overlay enabled.',
      time: 'Just Now'
    };
    FEED_ITEMS.unshift(hedgeFeed);
    renderFeed();

    applyRegimeMetrics();
  } else {
    State.putsHedged = false;
    logToBrokerTerminal(`[MARKET REGIME] Reconnecting to nominal live Yahoo Finance NSE quote feed...`, 'info');

    // Restore base prices immediately so offline fallback starts from nominal
    MARKET_DIRECTORY.forEach(st => {
      if (State.lastActualPrices[st.sym]) {
        st.price = State.lastActualPrices[st.sym];
      }
    });
    BEST_PERFORMERS.forEach(st => {
      if (State.lastActualPrices[st.sym]) {
        st.price = State.lastActualPrices[st.sym];
      }
    });
    if (State.lastActualPrices['NIFTY']) {
      State.indicesPrices.NIFTY.price = State.lastActualPrices['NIFTY'];
      State.indicesPrices.NIFTY.chg = State.lastActualPrices['NIFTY_CHG'];
    }
    if (State.lastActualPrices['SENSEX']) {
      State.indicesPrices.SENSEX.price = State.lastActualPrices['SENSEX'];
      State.indicesPrices.SENSEX.chg = State.lastActualPrices['SENSEX_CHG'];
    }

    refreshLiveMarketFeed();
  }
};

function applyRegimeMetrics() {
  const badge = document.getElementById('market-source-badge');

  if (State.marketRegime === 'crash') {
    MARKET_DIRECTORY.forEach(st => {
      if (!State.lastActualPrices[st.sym]) {
        State.lastActualPrices[st.sym] = st.price;
      }
      const drop = rand(0.052, 0.078);
      st.price = State.lastActualPrices[st.sym] * (1 - drop);
      st.chg = -drop * 100;
      st.bid = st.price - rand(0.1, 0.5);
      st.ask = st.price + rand(0.1, 0.5);
    });

    BEST_PERFORMERS.forEach(st => {
      if (!State.lastActualPrices[st.sym]) {
        State.lastActualPrices[st.sym] = st.price;
      }
      const drop = rand(0.045, 0.065);
      st.price = State.lastActualPrices[st.sym] * (1 - drop);
      st.chg = -drop * 100;
    });

    State.indicesPrices.NIFTY.price = 21992.40;
    State.indicesPrices.NIFTY.chg = -5.52;
    State.indicesPrices.SENSEX.price = 72124.50;
    State.indicesPrices.SENSEX.chg = -5.84;

    if (badge) {
      badge.textContent = 'Source: Crash Simulation Regime (Offline)';
      badge.style.color = 'var(--red)';
    }

    const nTag = document.getElementById('nifty-status-tag');
    const sTag = document.getElementById('sensex-status-tag');
    if (nTag) nTag.textContent = '🚨 FLASH CRASH LOCK';
    if (sTag) sTag.textContent = '🚨 FLASH CRASH LOCK';

  } else if (State.marketRegime === 'gapdown') {
    MARKET_DIRECTORY.forEach(st => {
      if (!State.lastActualPrices[st.sym]) {
        State.lastActualPrices[st.sym] = st.price;
      }
      st.price = State.lastActualPrices[st.sym] * 0.968;
      st.chg = -3.20;
      st.bid = st.price - rand(0.05, 0.35);
      st.ask = st.price + rand(0.05, 0.35);
    });

    BEST_PERFORMERS.forEach(st => {
      if (!State.lastActualPrices[st.sym]) {
        State.lastActualPrices[st.sym] = st.price;
      }
      st.price = State.lastActualPrices[st.sym] * 0.968;
      st.chg = -3.20;
    });

    State.indicesPrices.NIFTY.price = 22545.10;
    State.indicesPrices.NIFTY.chg = -3.20;
    State.indicesPrices.SENSEX.price = 73752.40;
    State.indicesPrices.SENSEX.chg = -3.50;

    if (badge) {
      badge.textContent = 'Source: Gap Down Simulation Regime (Offline)';
      badge.style.color = 'var(--amber)';
    }

    const nTag = document.getElementById('nifty-status-tag');
    const sTag = document.getElementById('sensex-status-tag');
    if (nTag) nTag.textContent = '⚠ OPENING GAP LIMIT';
    if (sTag) sTag.textContent = '⚠ OPENING GAP LIMIT';

  } else if (State.marketRegime === 'hedge') {
    MARKET_DIRECTORY.forEach(st => {
      if (State.lastActualPrices[st.sym]) {
        st.price = State.lastActualPrices[st.sym];
      }
    });
    BEST_PERFORMERS.forEach(st => {
      if (State.lastActualPrices[st.sym]) {
        st.price = State.lastActualPrices[st.sym];
      }
    });

    if (badge) {
      badge.textContent = 'Source: Live Batch Feed + Delta Puts Active';
      badge.style.color = 'var(--cyan)';
    }

    const nTag = document.getElementById('nifty-status-tag');
    const sTag = document.getElementById('sensex-status-tag');
    if (nTag) nTag.textContent = '🛡️ DELTA PUTS ARMED';
    if (sTag) sTag.textContent = '🛡️ DELTA PUTS ARMED';
  }

  updateIndicesUI();
  updateDashboardPnL();
  if (State.activeTab === 'market') {
    renderMarketScannerTable(State.currentMarketFilter, State.currentMarketSearch);
    renderWatchlist();
    renderBestPerformers();
  }
}

function updateIndicesUI() {
  const nVal = document.getElementById('nifty-index-val');
  const nChg = document.getElementById('nifty-index-chg');
  const sVal = document.getElementById('sensex-index-val');
  const sChg = document.getElementById('sensex-index-chg');

  if (nVal && nChg && sVal && sChg) {
    nVal.textContent = State.indicesPrices.NIFTY.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    sVal.textContent = State.indicesPrices.SENSEX.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const nC = State.indicesPrices.NIFTY.chg;
    const sC = State.indicesPrices.SENSEX.chg;

    nChg.textContent = `${nC >= 0 ? '+' : ''}${nC.toFixed(2)}%`;
    nChg.className = `idx-chg ${nC >= 0 ? 'positive' : 'negative'}`;

    sChg.textContent = `${sC >= 0 ? '+' : ''}${sC.toFixed(2)}%`;
    sChg.className = `idx-chg ${sC >= 0 ? 'positive' : 'negative'}`;
  }
}

// ─── Live Biometric Simulation Loop ───────────────────────────────
let simTick = 0;
function simulateLiveBiometrics() {
  if (State.circuitBreakerActive) return;
  simTick++;

  const drift = rand(-0.015, 0.015);
  const newArousal = clamp(State.arousal + drift, 0.05, 0.95);
  updateBiometricVisuals(newArousal);

  // Re-render HRV chart if biometric tab active
  if (State.activeTab === 'biometric' && simTick % 5 === 0) {
    const lastHRV = State.hrvHistory[State.hrvHistory.length - 1];
    State.hrvHistory.push(clamp(lastHRV + rand(-2, 2), 45, 100));
    if (State.hrvHistory.length > 96) State.hrvHistory.shift();
    renderHRVChart();
    renderArousalDist();
  }

  // Refresh Market Quotes / Micro-tick prices
  if (simTick % 5 === 0) {
    refreshLiveMarketFeed();
  } else {
    if (State.marketRegime === 'nominal' || State.marketRegime === 'hedge') {
      MARKET_DIRECTORY.forEach(st => {
        const changeFactor = rand(-0.0003, 0.0003);
        st.price = clamp(st.price * (1 + changeFactor), 10, 10000);
        st.chg = clamp(st.chg + changeFactor * 100, -8, 8);
        st.bid = st.price - rand(0.01, 0.06);
        st.ask = st.price + rand(0.01, 0.06);
      });

      BEST_PERFORMERS.forEach(st => {
        const changeFactor = rand(-0.0003, 0.0003);
        st.price = clamp(st.price * (1 + changeFactor), 1, 10000);
        st.chg = clamp(st.chg + changeFactor * 100, -8, 8);
      });

      const changeFactor = rand(-0.0001, 0.0001);
      State.indicesPrices.NIFTY.price *= (1 + changeFactor);
      State.indicesPrices.NIFTY.chg += changeFactor * 100;
      State.indicesPrices.SENSEX.price *= (1 + changeFactor);
      State.indicesPrices.SENSEX.chg += changeFactor * 100;
    } else {
      MARKET_DIRECTORY.forEach(st => {
        const driftFactor = rand(-0.0008, 0.0002);
        st.price = clamp(st.price * (1 + driftFactor), 10, 10000);
        const base = State.lastActualPrices[st.sym] || st.price;
        st.chg = ((st.price - base) / base) * 100;
        st.bid = st.price - rand(0.05, 0.25);
        st.ask = st.price + rand(0.05, 0.25);
      });

      BEST_PERFORMERS.forEach(st => {
        const driftFactor = rand(-0.0008, 0.0002);
        st.price = clamp(st.price * (1 + driftFactor), 1, 10000);
        const base = State.lastActualPrices[st.sym] || st.price;
        st.chg = ((st.price - base) / base) * 100;
      });

      const nDrift = rand(-0.0005, 0.0001);
      State.indicesPrices.NIFTY.price *= (1 + nDrift);
      State.indicesPrices.NIFTY.chg = State.marketRegime === 'crash' ? -5.52 + nDrift * 100 : -3.20 + nDrift * 100;

      const sDrift = rand(-0.0005, 0.0001);
      State.indicesPrices.SENSEX.price *= (1 + sDrift);
      State.indicesPrices.SENSEX.chg = State.marketRegime === 'crash' ? -5.84 + sDrift * 100 : -3.50 + sDrift * 100;
    }

    updateIndicesUI();
    updateDashboardPnL();

    if (State.activeTab === 'market') {
      renderMarketScannerTable(State.currentMarketFilter, State.currentMarketSearch);
      renderWatchlist();
      renderBestPerformers();
    }
  }

  // Update P&L sparkline based on computed holdings P&L
  let totalPnL = 0;
  HOLDINGS.forEach(h => {
    const match = MARKET_DIRECTORY.find(st => st.sym === h.sym);
    if (match) {
      h.pnl = (match.price - h.buyPrice) * h.qty;
      totalPnL += h.pnl;
    }
  });
  State.pnlHistory.push(totalPnL);
  if (State.pnlHistory.length > 64) State.pnlHistory.shift();
  renderSparkline();

  // Simulate external Webhook trade alerts to show active Bio-Guard interception
  if (simTick % 11 === 0) {
    const sampleTicker = MARKET_DIRECTORY[randInt(0, MARKET_DIRECTORY.length - 1)];
    const act = randInt(0, 1) === 0 ? 'BUY' : 'SELL';
    logToBrokerTerminal(`[WEBHOOK ALERT] External trading signal received: ${act} 50 ${sampleTicker.sym}. Querying biometrics...`, 'warn');

    // Route it through firewall
    executeBrokerOrder({
      sym: sampleTicker.sym,
      action: act,
      qty: 50,
      price: sampleTicker.price
    });
  }
}

// ─── Mouse Tracking (Cursor Erraticity) ───────────────────────────
(function initCursorTracking() {
  let velocities = [];
  let lastX = 0, lastY = 0, lastT = 0;
  document.addEventListener('mousemove', e => {
    const now = e.timeStamp;
    const dt = Math.max(1, now - lastT);
    if (dt > 0 && lastT > 0) {
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      const speed = Math.sqrt(dx * dx + dy * dy) / dt;
      velocities.push(speed);
      if (velocities.length > 30) velocities.shift();
      if (velocities.length >= 5) {
        const mean = velocities.reduce((a, b) => a + b, 0) / velocities.length;
        const std = Math.sqrt(velocities.reduce((a, b) => a + (b - mean) ** 2, 0) / velocities.length);
        const cov = std / (mean + 1e-9);
        const gauge = document.getElementById('cursor-gauge');
        if (gauge) gauge.style.width = `${clamp(cov * 100, 5, 100)}%`;
        const val = document.getElementById('cursor-val');
        if (val) val.textContent = cov.toFixed(2);
      }
    }
    lastX = e.clientX; lastY = e.clientY; lastT = now;
  });
})();

// ─── Audio Pre-Market Brief (SpeechSynthesis) ────────────────────
function speakBrief() {
  if ('speechSynthesis' in window) {
    const btn = document.getElementById('audio-brief-btn');
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      btn.classList.remove('speaking');
      btn.textContent = '🎙️ Listen';
      return;
    }

    const text = `Pre Market Brief. Dexter biological diagnostics indicate your physiological markers are stable. Your HRV Z-score is positive point five-eight sigma, which is eight percent above your thirty-day baseline. Full cognitive autonomy is active. Recommended posture is Active - trust the trading engine today. On the asset side, three earnings disclosures occur today for Infosys, Wipro, and Tata Consultancy Services. Historical volatility triggers collars at plus or minus three point two percent deviation. Social contagion index reads zero point two-one, marking low public sentiment contamination risk. Maintain passive oversight.`;

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Zira') || v.name.includes('David')));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => {
      btn.classList.remove('speaking');
      btn.textContent = '🎙️ Listen';
    };
    utterance.onerror = () => {
      btn.classList.remove('speaking');
      btn.textContent = '🎙️ Listen';
    };

    btn.classList.add('speaking');
    btn.textContent = '⏹️ Stop';
    window.speechSynthesis.speak(utterance);
  } else {
    alert("Speech Synthesis is not supported in your browser.");
  }
}

document.getElementById('audio-brief-btn').addEventListener('click', speakBrief);

// ─── Institutional Mimicry Layer Actions ──────────────────────────
document.getElementById('mimicry-exec-btn').addEventListener('click', () => {
  const btn = document.getElementById('mimicry-exec-btn');
  btn.textContent = 'Routing...';
  btn.disabled = true;

  const ok = executeBrokerOrder({
    sym: 'INFY',
    action: 'BUY',
    qty: 100,
    price: 1420.80
  });

  setTimeout(() => {
    btn.textContent = ok ? '✓ Collar Hedged' : '⚠ Blocked';
    btn.style.background = ok ? 'rgba(0, 229, 160, 0.3)' : 'rgba(255, 71, 87, 0.3)';
    btn.style.color = '#fff';

    setTimeout(() => {
      btn.textContent = 'Execute Institutional Collar';
      btn.style.background = 'rgba(0, 229, 160, 0.12)';
      btn.style.color = 'var(--green)';
      btn.disabled = false;
    }, 4000);
  }, 600);
});

// ─── Pitch Deck Mode Overlay ──────────────────────────────────────
const pitchOverlay = document.getElementById('pitch-deck-overlay');
const pitchBtn = document.getElementById('pitch-deck-btn');
const pitchClose = document.getElementById('pitch-close-btn');
const pitchPrev = document.getElementById('pitch-prev-btn');
const pitchNext = document.getElementById('pitch-next-btn');
const pitchDotsContainer = document.getElementById('pitch-dots-container');

function updatePitchSlides() {
  const slides = document.querySelectorAll('.pitch-slide');
  slides.forEach((slide, idx) => {
    if (idx === State.pitchSlideIndex) {
      slide.classList.add('active');
    } else {
      slide.classList.remove('active');
    }
  });

  const dots = document.querySelectorAll('.pitch-dot');
  dots.forEach((dot, idx) => {
    if (idx === State.pitchSlideIndex) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });

  pitchPrev.disabled = State.pitchSlideIndex === 0;
  pitchNext.textContent = State.pitchSlideIndex === slides.length - 1 ? 'Finish' : 'Next →';
}

function initPitchDeck() {
  const slides = document.querySelectorAll('.pitch-slide');

  pitchDotsContainer.innerHTML = '';
  slides.forEach((_, idx) => {
    const dot = document.createElement('div');
    dot.className = 'pitch-dot' + (idx === 0 ? ' active' : '');
    dot.addEventListener('click', () => {
      State.pitchSlideIndex = idx;
      updatePitchSlides();
    });
    pitchDotsContainer.appendChild(dot);
  });

  pitchBtn.addEventListener('click', () => {
    State.pitchSlideIndex = 0;
    updatePitchSlides();
    pitchOverlay.classList.remove('hidden');
  });

  pitchClose.addEventListener('click', () => {
    pitchOverlay.classList.add('hidden');
  });

  pitchPrev.addEventListener('click', () => {
    if (State.pitchSlideIndex > 0) {
      State.pitchSlideIndex--;
      updatePitchSlides();
    }
  });

  pitchNext.addEventListener('click', () => {
    if (State.pitchSlideIndex < slides.length - 1) {
      State.pitchSlideIndex++;
      updatePitchSlides();
    } else {
      pitchOverlay.classList.add('hidden');
    }
  });

  pitchOverlay.addEventListener('click', e => {
    if (e.target === e.currentTarget) {
      pitchOverlay.classList.add('hidden');
    }
  });
}

// ─── Biometric Backtester Simulation ──────────────────────────────
const btLoadBtn = document.getElementById('bt-load-btn');
const btRunBtn = document.getElementById('bt-run-btn');
const btResetBtn = document.getElementById('bt-reset-btn');
const btProgressFill = document.getElementById('bt-progress-fill');
const btLogFeed = document.getElementById('bt-log-feed');
const btCanvas = document.getElementById('backtest-canvas');

const BT_SIM_DATA_POINTS = 100;
let btHrvLog = [];

function generateBacktestData() {
  btHrvLog = [];
  let hrv = 70;
  for (let i = 0; i < BT_SIM_DATA_POINTS; i++) {
    if (i > 20 && i < 35) hrv = clamp(hrv - rand(1.5, 3.5), 35, 52);
    else if (i > 60 && i < 75) hrv = clamp(hrv - rand(1.8, 4.0), 38, 50);
    else hrv = clamp(hrv + rand(-3, 4.2), 58, 92);
    btHrvLog.push({ index: i, hrv });
  }

  State.btTrades = [
    { idx: 12, sym: 'RELIANCE', action: 'BUY', hrv: 74, status: 'nominal', notes: 'Executed cleanly by algorithm.', gain: 1800 },
    { idx: 24, sym: 'INFY', action: 'SELL', hrv: 46, status: 'override-blocked', notes: 'Panic sell overridden by Dexter. Position preserved.', gain: 14200 },
    { idx: 28, sym: 'WIPRO', action: 'BUY', hrv: 41, status: 'override-blocked', notes: 'Overriding buy block during deep stress. Prevented slip.', gain: 6400 },
    { idx: 45, sym: 'HDFCBANK', action: 'BUY', hrv: 78, status: 'nominal', notes: 'Standard execution. Normal Lambda parameter.', gain: 2100 },
    { idx: 62, sym: 'TATAMOTORS', action: 'SELL', hrv: 47, status: 'override-blocked', notes: 'Arousal threshold exceeded. Override locked. Loss averted.', gain: 11800 },
    { idx: 68, sym: 'BAJFINANCE', action: 'BUY', hrv: 42, status: 'override-blocked', notes: 'Reddit social panic trigger blocked. Position held.', gain: 8700 },
    { idx: 88, sym: 'SBIN', action: 'BUY', hrv: 82, status: 'nominal', notes: 'Calm execution. Institutional mimicry collar placed.', gain: 3200 }
  ];
}

function drawBacktestInit() {
  if (!btCanvas) return;
  const ctx = btCanvas.getContext('2d');
  const W = btCanvas.width = btCanvas.offsetWidth || 700;
  const H = btCanvas.height = 200;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(138,163,199,0.3)';
  ctx.font = '12px var(--font-mono)';
  ctx.textAlign = 'center';
  ctx.fillText('Backtester offline. Click Load Trades.', W / 2, H / 2 + 5);
}

function drawBacktesterChart(currentPoint = -1) {
  if (!btCanvas) return;
  const ctx = btCanvas.getContext('2d');
  const W = btCanvas.width = btCanvas.offsetWidth || 700;
  const H = btCanvas.height = 200;
  ctx.clearRect(0, 0, W, H);

  const pad = { l: 40, r: 20, t: 20, b: 24 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;

  ctx.fillStyle = 'rgba(255, 71, 87, 0.04)';
  const stressLineY = pad.t + ((100 - 55) / 65) * iH;
  ctx.fillRect(pad.l, stressLineY, iW, pad.t + iH - stressLineY);

  ctx.strokeStyle = 'rgba(255, 71, 87, 0.25)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(pad.l, stressLineY); ctx.lineTo(W - pad.r, stressLineY); ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  btHrvLog.forEach((pt, i) => {
    if (currentPoint !== -1 && i > currentPoint) return;
    const x = pad.l + (i / (BT_SIM_DATA_POINTS - 1)) * iW;
    const y = pad.t + ((100 - pt.hrv) / 65) * iH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = 'rgba(0, 212, 255, 0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();

  State.btTrades.forEach(tr => {
    if (currentPoint !== -1 && tr.idx > currentPoint) return;
    const x = pad.l + (tr.idx / (BT_SIM_DATA_POINTS - 1)) * iW;
    const y = pad.t + ((100 - tr.hrv) / 65) * iH;

    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    if (tr.status === 'nominal') {
      ctx.fillStyle = 'var(--green)';
      ctx.shadowColor = 'var(--green)';
    } else {
      ctx.fillStyle = 'var(--red)';
      ctx.shadowColor = 'var(--red)';
    }
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(232, 240, 254, 0.8)';
    ctx.font = '8px var(--font-mono)';
    ctx.textAlign = 'center';
    ctx.fillText(tr.sym, x, y - 10);
  });

  if (currentPoint !== -1) {
    const scanX = pad.l + (currentPoint / (BT_SIM_DATA_POINTS - 1)) * iW;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(scanX, pad.t); ctx.lineTo(scanX, pad.t + iH); ctx.stroke();
  }

  ctx.fillStyle = 'rgba(138,163,199,0.5)';
  ctx.font = '9px var(--font-mono)';
  ctx.textAlign = 'right';
  ctx.fillText('100ms', pad.l - 4, pad.t + 4);
  ctx.fillText('55ms', pad.l - 4, stressLineY + 3);
  ctx.fillText('35ms', pad.l - 4, pad.t + iH);
}

function loadBacktest() {
  generateBacktestData();
  State.btState = 'loaded';
  State.btProgress = 0;
  State.btCurrentIndex = 0;
  State.btStats = { tradesCount: 0, stressOverlap: 0, savedCapital: 0, cogAlpha: 0.0 };

  btLoadBtn.disabled = true;
  btRunBtn.disabled = false;
  btResetBtn.disabled = false;
  btProgressFill.style.width = '0%';

  document.getElementById('bt-trades-count').textContent = '0';
  document.getElementById('bt-stress-overlap').textContent = '0%';
  document.getElementById('bt-saved-capital').textContent = '₹0';
  document.getElementById('bt-cog-alpha').textContent = '0.0%';

  btLogFeed.innerHTML = `<div class="bt-log-entry info">[SYSTEM] Simulated trade history parsed. 7 target positions found. Ready for replay.</div>`;
  drawBacktesterChart();
}

function runBacktestReplay() {
  if (State.btState === 'running') {
    clearInterval(State.btInterval);
    State.btState = 'paused';
    btRunBtn.textContent = '▶ Resume';
  } else {
    State.btState = 'running';
    btRunBtn.textContent = '⏸ Pause';
    btResetBtn.disabled = false;

    State.btInterval = setInterval(() => {
      State.btCurrentIndex++;
      State.btProgress = (State.btCurrentIndex / (BT_SIM_DATA_POINTS - 1)) * 100;
      btProgressFill.style.width = `${State.btProgress}%`;

      drawBacktesterChart(State.btCurrentIndex);

      const trade = State.btTrades.find(t => t.idx === State.btCurrentIndex);
      if (trade) {
        State.btStats.tradesCount++;
        document.getElementById('bt-trades-count').textContent = State.btStats.tradesCount;

        const logEntry = document.createElement('div');
        if (trade.status === 'nominal') {
          logEntry.className = 'bt-log-entry success';
          logEntry.innerHTML = `[NOMINAL] ${trade.action} ${trade.sym} at HRV ${trade.hrv}ms. ${trade.notes}`;
        } else {
          logEntry.className = 'bt-log-entry danger';
          logEntry.innerHTML = `[INTERCEPT] ${trade.sym} ${trade.action} BLOCKED. HRV: ${trade.hrv}ms. saved ₹${(trade.gain / 1000).toFixed(1)}K.`;

          State.btStats.savedCapital += trade.gain;
          document.getElementById('bt-saved-capital').textContent = `₹${(State.btStats.savedCapital / 1000).toFixed(0)}K`;
        }
        btLogFeed.appendChild(logEntry);
        btLogFeed.scrollTop = btLogFeed.scrollHeight;

        const blockedTrades = State.btTrades.filter(t => t.idx <= State.btCurrentIndex && t.status === 'override-blocked').length;
        const totalSimulated = State.btStats.tradesCount;
        State.btStats.stressOverlap = Math.round((blockedTrades / totalSimulated) * 100);
        document.getElementById('bt-stress-overlap').textContent = `${State.btStats.stressOverlap}%`;

        State.btStats.cogAlpha = ((State.btStats.savedCapital / 42000) * 100).toFixed(1);
        document.getElementById('bt-cog-alpha').textContent = `${State.btStats.cogAlpha}%`;
      }

      if (State.btCurrentIndex >= BT_SIM_DATA_POINTS - 1) {
        clearInterval(State.btInterval);
        State.btState = 'finished';
        btRunBtn.disabled = true;
        btRunBtn.textContent = '▶ Run Replay';
        const finalLog = document.createElement('div');
        finalLog.className = 'bt-log-entry info';
        finalLog.innerHTML = `[FINISH] Replay completed. Cognitive Alpha Fingerprint verified. Total Saved Capital: ₹${State.btStats.savedCapital.toLocaleString()}.`;
        btLogFeed.appendChild(finalLog);
        btLogFeed.scrollTop = btLogFeed.scrollHeight;
      }
    }, 100);
  }
}

function resetBacktest() {
  clearInterval(State.btInterval);
  State.btState = 'idle';
  State.btProgress = 0;
  State.btCurrentIndex = 0;

  btLoadBtn.disabled = false;
  btRunBtn.disabled = true;
  btRunBtn.textContent = '▶ Run Replay';
  btResetBtn.disabled = true;
  btProgressFill.style.width = '0%';

  btLogFeed.innerHTML = `<div class="bt-log-placeholder">Click 'Load Trades' to initialize simulation...</div>`;
  drawBacktestInit();

  document.getElementById('bt-trades-count').textContent = '0';
  document.getElementById('bt-stress-overlap').textContent = '0%';
  document.getElementById('bt-saved-capital').textContent = '₹0';
  document.getElementById('bt-cog-alpha').textContent = '0.0%';
}

function initBacktester() {
  if (btLoadBtn) btLoadBtn.addEventListener('click', loadBacktest);
  if (btRunBtn) btRunBtn.addEventListener('click', runBacktestReplay);
  if (btResetBtn) btResetBtn.addEventListener('click', resetBacktest);
  drawBacktestInit();
}

// ─── Market Scanner & Watchlists Renderers ───────────────────────
function renderMarketScannerTable(filter = 'ALL', search = '') {
  const tbody = document.getElementById('market-tbody');
  if (!tbody) return;

  const filtered = MARKET_DIRECTORY.filter(st => {
    const matchesFilter = filter === 'ALL' || st.idx.includes(filter);
    const matchesSearch = st.sym.toLowerCase().includes(search.toLowerCase()) || st.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  tbody.innerHTML = filtered.map(st => {
    const isWatched = State.myWatchlist.includes(st.sym);
    const bioTradeable = State.arousal < 0.75;

    return `
      <tr>
        <td>${st.sym}</td>
        <td>${st.name}</td>
        <td style="font-family:var(--font-mono); font-size:10.5px; color:var(--text-secondary)">${st.idx}</td>
        <td style="font-family:var(--font-mono); font-weight:600">₹${st.price.toFixed(2)}</td>
        <td class="${st.chg >= 0 ? 'positive' : 'negative'}" style="font-family:var(--font-mono)">
          ${st.chg >= 0 ? '+' : ''}${st.chg.toFixed(2)}%
        </td>
        <td style="font-family:var(--font-mono); color:var(--text-dim)">
          ₹${st.bid.toFixed(2)} / ₹${st.ask.toFixed(2)}
        </td>
        <td>
          <span class="risk-badge ${bioTradeable ? 'risk-low' : 'risk-high'}">
            ${bioTradeable ? '✅ Active' : '🚨 Lock (0.75+)'}
          </span>
        </td>
        <td>
          <button class="watch-toggle-btn ${isWatched ? 'watching' : ''}" onclick="toggleWatch('${st.sym}')">
            ${isWatched ? '★ Tracked' : '☆ Track'}
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.toggleWatch = function (symbol) {
  const idx = State.myWatchlist.indexOf(symbol);
  if (idx === -1) {
    State.myWatchlist.push(symbol);
    logToBrokerTerminal(`[WATCHLIST] Added ${symbol} to active watch stream.`, 'recv');
  } else {
    State.myWatchlist.splice(idx, 1);
    logToBrokerTerminal(`[WATCHLIST] Untracked ${symbol} from watchlist.`, 'warn');
  }
  renderWatchlist();
  renderMarketScannerTable(State.currentMarketFilter, State.currentMarketSearch);
};

function renderWatchlist() {
  const container = document.getElementById('watchlist-list');
  if (!container) return;

  if (State.myWatchlist.length === 0) {
    container.innerHTML = `<div class="bt-log-placeholder">No tracked tickers. Track stocks from directory.</div>`;
    return;
  }

  const items = State.myWatchlist.map(sym => {
    const match = MARKET_DIRECTORY.find(st => st.sym === sym);
    const price = match ? match.price : 150.0;
    const chg = match ? match.chg : 0.00;
    const name = match ? match.name : 'Constituent Share';

    return `
      <div class="watchlist-item">
        <div class="wl-left">
          <span class="wl-sym">${sym}</span>
          <span class="wl-name">${name}</span>
        </div>
        <div class="wl-right">
          <div class="wl-metrics">
            <span class="wl-price">₹${price.toFixed(2)}</span>
            <span class="wl-chg ${chg >= 0 ? 'positive' : 'negative'}">
              ${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%
            </span>
          </div>
          <button class="unwatch-btn" onclick="toggleWatch('${sym}')" title="Untrack ticker">&times;</button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = items;
}

function renderBestPerformers() {
  const container = document.getElementById('performers-list');
  if (!container) return;

  const sorted = [...MARKET_DIRECTORY].sort((a, b) => b.chg - a.chg);
  const top3 = sorted.slice(0, 3).map(st => ({ ...st, type: 'TOP GAINER' }));
  const bottom3 = sorted.slice(-3).reverse().map(st => ({ ...st, type: 'TOP LOSER' }));
  const displayItems = [...top3, ...bottom3];

  container.innerHTML = displayItems.map(perf => `
    <div class="performer-item">
      <div class="perf-left">
        <span class="perf-sym">${perf.sym}</span>
        <span class="perf-name">${perf.name}</span>
      </div>
      <div class="perf-right">
        <div class="perf-metrics">
          <span class="perf-price">₹${perf.price.toFixed(2)}</span>
          <span class="perf-chg ${perf.chg >= 0 ? 'positive' : 'negative'}">
            ${perf.chg >= 0 ? '+' : ''}${perf.chg.toFixed(2)}%
          </span>
        </div>
        <span style="font-size:9px; background:${perf.chg >= 0 ? 'rgba(0,212,255,0.1)' : 'rgba(255,71,87,0.1)'}; border:1px solid ${perf.chg >= 0 ? 'rgba(0,212,255,0.3)' : 'rgba(255,71,87,0.3)'}; padding:2px 5px; border-radius:4px; color:${perf.chg >= 0 ? 'var(--cyan)' : 'var(--pink)'}; font-weight:600">${perf.type}</span>
      </div>
    </div>
  `).join('');
}

function initMarketTabHandlers() {
  const searchInput = document.getElementById('market-search');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      State.currentMarketSearch = e.target.value;
      renderMarketScannerTable(State.currentMarketFilter, State.currentMarketSearch);
    });
  }

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.currentMarketFilter = btn.dataset.index;
      renderMarketScannerTable(State.currentMarketFilter, State.currentMarketSearch);
    });
  });
}

// ─── Demat Settings Linkage Integration ───────────────────────────
function renderDematGateway() {
  updateMarginsDisplay();
}

function initDematTabHandlers() {
  const connectBtn = document.getElementById('connect-broker-btn');
  const statusBanner = document.getElementById('gateway-status-banner');
  const statusText = document.getElementById('gateway-status-text');

  if (connectBtn) {
    connectBtn.addEventListener('click', () => {
      if (State.dematConnected) {
        State.dematConnected = false;
        connectBtn.textContent = 'Validate & Link Demat Account';
        connectBtn.classList.remove('connected');
        statusBanner.className = 'connection-status-banner disconnected';
        statusText.textContent = 'GATEWAY STATUS: DISCONNECTED';

        logToBrokerTerminal('[GATEWAY] Session closed manually. Demat account detached.', 'warn');
      } else {
        connectBtn.textContent = 'Linking...';
        logToBrokerTerminal('[GATEWAY] Initializing OAuth handshake on port 8080...', 'info');

        setTimeout(() => {
          logToBrokerTerminal('[GATEWAY] Verifying Client credentials and TOTP Pin...', 'info');

          setTimeout(() => {
            State.dematConnected = true;
            connectBtn.textContent = 'Detach Linked Account';
            connectBtn.classList.add('connected');
            statusBanner.className = 'connection-status-banner connected';

            const bSelect = document.getElementById('broker-select');
            const client = document.getElementById('broker-client-id').value;
            const brokerName = bSelect ? bSelect.options[bSelect.selectedIndex].text : 'Broker';
            statusText.textContent = `GATEWAY STATUS: CONNECTED TO ${brokerName.toUpperCase()} (${client})`;

            logToBrokerTerminal(`[GATEWAY] Validation complete. Linked to demat gateway for client ${client}.`, 'recv');
            logToBrokerTerminal('[GATEWAY] Active Session validated. Webhook trade gateway listening...', 'recv');
          }, 800);
        }, 600);
      }
    });
  }

  const clearBtn = document.getElementById('console-clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const term = document.getElementById('broker-terminal');
      if (term) term.innerHTML = `<div class="term-entry">[GATEWAY] API gateway console buffer flushed.</div>`;
    });
  }

  const copyBtn = document.getElementById('copy-webhook-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const urlText = document.getElementById('webhook-url-text').textContent;
      navigator.clipboard.writeText(urlText).then(() => {
        copyBtn.textContent = '✓';
        setTimeout(() => { copyBtn.textContent = '📋'; }, 2000);
      });
    });
  }

  const bioToggle = document.getElementById('bioguard-toggle');
  const bioBox = document.getElementById('bioguard-status-box');
  const bioLbl = document.getElementById('bioguard-status-lbl');

  if (bioToggle && bioBox && bioLbl) {
    bioToggle.addEventListener('change', e => {
      State.bioGuardEnabled = e.target.checked;
      if (State.bioGuardEnabled) {
        bioBox.className = 'bioguard-status-box active';
        bioLbl.textContent = 'BIO-GUARD SHIELD: ACTIVE & ARMED';
        logToBrokerTerminal('[GATEWAY] Dexter Bio-Guard Interceptor ARMED.', 'warn');
      } else {
        bioBox.className = 'bioguard-status-box inactive';
        bioLbl.textContent = 'BIO-GUARD SHIELD: BYPASSED';
        logToBrokerTerminal('[GATEWAY WARNING] Bio-Guard disabled. Outgoing orders bypassing local biometric gatekeeper.', 'warn');
      }
    });
  }
}

// ─── Animate Dexter Score on load ──────────────────────────────────
function animateScoreOnLoad() {
  let v = 0;
  const target = 87;
  const CIRCUM = 534;
  const el = document.getElementById('score-ring-fill');
  const num = document.getElementById('dexter-score-number');
  if (!el || !num) {
    console.warn('Score ring elements missing from DOM');
    return;
  }
  // Set the final stroke offset once and let CSS transition animate the ring smoothly
  const finalOffset = CIRCUM * (100 - target) / 100;
  el.style.strokeDashoffset = finalOffset + 'px';

  function step() {
    v += 2;
    if (v > target) v = target;
    num.textContent = Math.round(v).toString();
    if (v < target) {
      window.requestAnimationFrame(step);
    }
  }
  window.setTimeout(() => {
    window.requestAnimationFrame(step);
  }, 400);
}

// ─── Boot ─────────────────────────────────────────────────────────
function boot() {
  initTabs();
  initPnLSparkline();
  initHRVHistory();
  initLambdaHistory();
  renderHoldings();
  renderFeed();
  renderOverrides();
  renderRiskConditions();
  renderLambdaArc(State.lambda);
  renderPerformanceChart('6M');
  animateScoreOnLoad();

  // Custom Extensions Init
  initPitchDeck();
  initBacktester();
  initMarketTabHandlers();
  initDematTabHandlers();
  initTrackerModule();
  initTopFundsExplorer();

  // Seed fallback indices
  State.lastActualPrices['NIFTY'] = State.indicesPrices.NIFTY.price;
  State.lastActualPrices['NIFTY_CHG'] = State.indicesPrices.NIFTY.chg;
  State.lastActualPrices['SENSEX'] = State.indicesPrices.SENSEX.price;
  State.lastActualPrices['SENSEX_CHG'] = State.indicesPrices.SENSEX.chg;

  // Kick off first actual market price fetch cycle
  refreshLiveMarketFeed();

  // Start live simulation loop
  setInterval(simulateLiveBiometrics, 2800);

  // Animate gauges in on load
  setTimeout(() => {
    updateBiometricVisuals(0.23);
  }, 300);
}

document.addEventListener('DOMContentLoaded', boot);


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

  const labels = Array.from({ length: 253 }, (_, i) => 'Day ' + i);

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



// ==========================================
// DAILY TRACKER MODULE
// ==========================================
function initTrackerModule() {
  const STORAGE_KEY = 'dexter_daily_tracker';
  let trackerData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  const addBtn = document.getElementById('tracker-add-btn');
  const snapshotBtn = document.getElementById('tracker-snapshot-btn');
  const tbody = document.getElementById('tracker-tbody');
  const tickerInput = document.getElementById('tracker-ticker');
  const typeSelect = document.getElementById('tracker-type');

  if (!addBtn || !snapshotBtn || !tbody) return;

  function renderTracker() {
    tbody.innerHTML = '';
    trackerData.forEach((asset, index) => {
      const history = asset.history || [];
      const currentPrice = history.length > 0 ? history[history.length - 1].price : 0;
      const prevPrice = history.length > 1 ? history[history.length - 2].price : currentPrice;
      const change = currentPrice - prevPrice;
      const pctChange = currentPrice > 0 ? (change / prevPrice) * 100 : 0;
      
      const tr = document.createElement('tr');
      
      const minP = Math.min(...history.map(h => h.price), currentPrice * 0.9);
      const maxP = Math.max(...history.map(h => h.price), currentPrice * 1.1);
      const range = maxP - minP || 1;
      const stepX = 100 / Math.max(1, history.length - 1);
      
      let pathD = history.map((h, i) => {
        const x = i * stepX;
        const y = 30 - ((h.price - minP) / range) * 30;
        return (i === 0 ? 'M' : 'L') + x + ',' + y;
      }).join(' ');
      
      const sparklineColor = change >= 0 ? '#00D4FF' : '#FF6B35';

      tr.innerHTML = `
        <td style="font-weight: 600;">${asset.ticker}</td>
        <td style="color: var(--text-secondary); font-size: 11px;">${asset.type}</td>
        <td style="font-family: var(--font-mono);">₹${currentPrice.toFixed(2)}</td>
        <td class="${change >= 0 ? 'positive' : 'negative'}" style="font-family: var(--font-mono);">
          ${change >= 0 ? '+' : ''}${change.toFixed(2)} (${pctChange.toFixed(2)}%)
        </td>
        <td style="width: 100px; padding: 4px;">
          <svg width="100%" height="30" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path d="${pathD}" fill="none" stroke="${sparklineColor}" stroke-width="2" vector-effect="non-scaling-stroke" />
          </svg>
        </td>
        <td>
          <button class="delete-asset-btn" data-idx="${index}" style="background: transparent; border: none; color: #ff4a4a; cursor: pointer; font-size: 14px;">✕</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll('.delete-asset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.target.getAttribute('data-idx');
        trackerData.splice(idx, 1);
        saveData();
        renderTracker();
      });
    });
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trackerData));
  }

  addBtn.addEventListener('click', () => {
    const ticker = tickerInput.value.trim().toUpperCase();
    const type = typeSelect.value;
    if (!ticker) return;

    if (trackerData.some(a => a.ticker === ticker)) {
      alert(ticker + ' is already being tracked.');
      return;
    }

    const initialPrice = type === 'MF' ? (Math.random() * 100 + 50) : (Math.random() * 2000 + 100);

    trackerData.push({
      ticker,
      type,
      history: [
        { date: new Date().toISOString(), price: initialPrice }
      ]
    });

    tickerInput.value = '';
    saveData();
    renderTracker();
  });

  snapshotBtn.addEventListener('click', async () => {
    trackerData.forEach(asset => {
      const history = asset.history;
      const lastPrice = history.length > 0 ? history[history.length - 1].price : 100;
      const drift = asset.type === 'MF' ? 0.0005 : 0.001; 
      const volatility = asset.type === 'MF' ? 0.01 : 0.02; 
      
      const randomReturn = (Math.random() - 0.5) * volatility + drift;
      const newPrice = lastPrice * (1 + randomReturn);
      
      history.push({
        date: new Date().toISOString(),
        price: newPrice
      });
      
      if (history.length > 30) {
        asset.history = history.slice(-30);
      }
    });

    saveData();
    renderTracker();
    
    snapshotBtn.style.backgroundColor = '#00D4FF';
    setTimeout(() => { snapshotBtn.style.backgroundColor = 'var(--amber)'; }, 300);
  });

  document.getElementById('tab-tracker')?.addEventListener('click', () => {
    renderTracker();
  });
}

// ==========================================
// TOP 10 MUTUAL FUNDS EXPLORER
// ==========================================
function initTopFundsExplorer() {
  const categoryList = document.getElementById('mf-category-list');
  const tbody = document.getElementById('mf-tbody');
  const title = document.getElementById('mf-table-title');
  const tabBtn = document.getElementById('tab-mutualfunds');

  if (!categoryList || !tbody || typeof TOP_FUNDS_DB === 'undefined') return;

  // Extract unique categories from DB
  const categories = [...new Set(TOP_FUNDS_DB.map(f => f.category))];

  // Render Sidebar
  categoryList.innerHTML = categories.map(cat => {
    return `<li class="mf-cat-item" data-cat="${cat}" style="cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: background 0.2s;">
      ${cat.startsWith('Sector') ? '🔬 ' + cat : '📈 ' + cat}
    </li>`;
  }).join('');

  const catItems = document.querySelectorAll('.mf-cat-item');

  function selectCategory(cat) {
    // Update Title
    title.innerHTML = `${cat.toUpperCase()} <span style="color: var(--text-secondary); font-size: 12px; margin-left: 10px;">TOP 10 FUNDS</span>`;
    
    // Highlight sidebar
    catItems.forEach(item => {
      item.style.background = item.getAttribute('data-cat') === cat ? 'rgba(0, 212, 255, 0.15)' : 'transparent';
      item.style.color = item.getAttribute('data-cat') === cat ? 'var(--cyan)' : 'var(--text-secondary)';
    });

    // Render Table
    const funds = TOP_FUNDS_DB.filter(f => f.category === cat)
      .sort((a, b) => b.return3y - a.return3y) // Sort by return descending
      .slice(0, 10); // Take Top 10

    tbody.innerHTML = funds.map(mf => `
      <tr style="animation: fadeUp 0.3s ease-out forwards; opacity: 0;">
        <td style="font-weight: 600;">${mf.name}</td>
        <td style="color: var(--amber); letter-spacing: 2px;">${'★'.repeat(mf.rating)}</td>
        <td style="font-family: var(--font-mono);">₹${mf.nav.toFixed(2)}</td>
        <td class="positive" style="font-family: var(--font-mono); font-weight: bold;">+${mf.return3y.toFixed(2)}%</td>
      </tr>
    `).join('');
    
    // Stagger animation
    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row, i) => {
      row.style.animationDelay = `${i * 0.03}s`;
    });
  }

  // Click listeners
  catItems.forEach(item => {
    item.addEventListener('click', () => {
      selectCategory(item.getAttribute('data-cat'));
    });
  });

  // Init on tab open
  if (tabBtn) {
    tabBtn.addEventListener('click', () => {
      // Default to first category if empty
      if (tbody.innerHTML.trim() === '' || tbody.innerHTML.includes('Populated')) {
        selectCategory(categories[0]);
      }
    });
  }
}

// Call init at bottom
document.addEventListener('DOMContentLoaded', () => {
  initTopFundsExplorer();
});
