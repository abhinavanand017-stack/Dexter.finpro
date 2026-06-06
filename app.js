window.STOCKS_DB = window.STOCKS_DB || [];
window.TOP_FUNDS_DB = window.TOP_FUNDS_DB || [];
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
  initEquityScreener();
  initFundamentalScreener();

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
  let trackerData = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) trackerData = JSON.parse(raw);
  } catch (e) {
    console.warn("localStorage corrupted, resetting tracker.");
  }

  const addBtn = document.getElementById('tracker-add-btn');
  const snapshotBtn = document.getElementById('tracker-snapshot-btn');
  const tbody = document.getElementById('tracker-tbody');
  const tickerInput = document.getElementById('tracker-ticker');
  const typeSelect = document.getElementById('tracker-type');
  const datalist = document.getElementById('tracker-ticker-list');
  const msgEl = document.getElementById('tracker-add-msg');

  if (!addBtn || !snapshotBtn || !tbody) return;

  // Build autocomplete list from real NIFTY 500 symbols
  if (datalist && typeof MARKET_DIRECTORY !== 'undefined') {
    datalist.innerHTML = MARKET_DIRECTORY.map(s =>
      `<option value="${s.sym}">${s.sym} — ₹${s.price.toFixed(2)}</option>`).join('');
  }

  function showMsg(text, ok) {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.style.color = ok ? 'var(--green)' : 'var(--red)';
    setTimeout(() => { if (msgEl.textContent === text) msgEl.textContent = ''; }, 4000);
  }

  // Seed 7-day history with a plausible walk anchored to actual price
  function seedHistory(price, type) {
    const vol = type === 'MF' ? 0.008 : 0.018;
    const points = [];
    // Start from 7 days back, drift toward today's price
    let p = price * (1 + (Math.random() - 0.5) * 0.06);
    for (let i = 6; i >= 0; i--) {
      const drift = (price - p) * 0.18;
      const step = (Math.random() - 0.5) * vol * p + drift;
      p = p + step;
      const d = new Date(); d.setDate(d.getDate() - i);
      points.push({ date: d.toISOString(), price: +p.toFixed(2) });
    }
    // Pin last point to actual current price
    points[points.length - 1].price = +price.toFixed(2);
    return points;
  }

  function renderTracker() {
    tbody.innerHTML = '';
    if (trackerData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 32px; color: var(--text-dim); font-size: 13px;">No assets tracked yet. Search for a NIFTY 500 symbol above to begin.</td></tr>';
      return;
    }
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
        <td>
          <div style="font-weight: 600;">${asset.ticker}</div>
          ${asset.name && asset.name !== asset.ticker ? `<div style="font-size:11px;color:var(--text-dim);">${asset.name}</div>` : ''}
        </td>
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
        <td style="white-space:nowrap;">
          <button class="research-asset-btn" data-sym="${asset.ticker}" title="Open research" style="background: transparent; border: 1px solid var(--border); color: var(--violet-l); cursor: pointer; font-size: 12px; padding: 4px 8px; border-radius: 6px; margin-right: 4px;">🔬</button>
          <button class="delete-asset-btn" data-idx="${index}" title="Remove" style="background: transparent; border: none; color: #ff4a4a; cursor: pointer; font-size: 14px;">✕</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll('.delete-asset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.currentTarget.getAttribute('data-idx');
        trackerData.splice(idx, 1);
        saveData();
        renderTracker();
      });
    });
    document.querySelectorAll('.research-asset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sym = e.currentTarget.getAttribute('data-sym');
        // Lazy-init screener DB if user hasn't visited that tab yet
        if ((!window.SCREENER_DB || window.SCREENER_DB.length === 0) && typeof buildScreenerDB === 'function') {
          window.SCREENER_DB = buildScreenerDB();
        }
        if (window.SCREENER_DB && window.SCREENER_DB.find(s => s.sym === sym)) {
          openResearch(sym);
        } else {
          window.open('https://www.screener.in/company/' + sym + '/', '_blank');
        }
      });
    });
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trackerData));
    } catch (e) {
      console.warn("localStorage quota exceeded.");
    }
  }

  function addTicker(ticker, type) {
    ticker = (ticker || '').trim().toUpperCase().replace(/\.NS$|\.BO$/, '');
    if (!ticker) { showMsg('Enter a symbol.', false); return false; }
    if (trackerData.some(a => a.ticker === ticker)) {
      showMsg(ticker + ' is already being tracked.', false);
      return false;
    }
    let name = ticker;
    let initialPrice = null;
    if (type === 'STOCK' && typeof MARKET_DIRECTORY !== 'undefined') {
      const match = MARKET_DIRECTORY.find(s => s.sym === ticker);
      if (!match) {
        showMsg(ticker + ' not found in NIFTY 500. Check the symbol or pick from suggestions.', false);
        return false;
      }
      name = match.name;
      initialPrice = match.price;
    } else if (type === 'MF') {
      // Mutual fund: lookup in TOP_FUNDS_DB if present, otherwise allow with a default NAV
      const mfMatch = (window.TOP_FUNDS_DB || []).find(f => (f.symbol || f.name || '').toUpperCase().includes(ticker));
      initialPrice = mfMatch ? (mfMatch.nav || mfMatch.price || 100) : (Math.random() * 100 + 50);
      if (mfMatch) name = mfMatch.name || ticker;
    }
    trackerData.push({
      ticker,
      name,
      type,
      history: seedHistory(initialPrice, type)
    });
    saveData();
    renderTracker();
    showMsg('✓ ' + ticker + ' added at ₹' + initialPrice.toFixed(2), true);
    return true;
  }

  // Expose for cross-module use (research modal "Add to Tracker" button)
  window.dexterAddToTracker = addTicker;

  addBtn.addEventListener('click', () => {
    const ok = addTicker(tickerInput.value, typeSelect.value);
    if (ok) tickerInput.value = '';
  });

  tickerInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const ok = addTicker(tickerInput.value, typeSelect.value);
      if (ok) tickerInput.value = '';
    }
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
        price: +newPrice.toFixed(2)
      });

      if (history.length > 30) {
        asset.history = history.slice(-30);
      }
    });

    saveData();
    renderTracker();

    snapshotBtn.style.backgroundColor = '#00D4FF';
    setTimeout(() => { snapshotBtn.style.backgroundColor = 'var(--amber)'; }, 300);
    showMsg('✓ Snapshot saved for ' + trackerData.length + ' asset(s).', true);
  });

  document.getElementById('tab-tracker')?.addEventListener('click', () => {
    renderTracker();
  });

  // Initial render
  renderTracker();
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
  initEquityScreener();
  initFundamentalScreener();
});


// ==========================================
// EQUITY SCREENER
// ==========================================
function initEquityScreener() {
  const categoryList = document.getElementById('eq-category-list');
  const tbody = document.getElementById('eq-tbody');
  const title = document.getElementById('eq-table-title');
  const tabBtn = document.getElementById('tab-equity');

  if (!categoryList || !tbody || typeof STOCKS_DB === 'undefined') return;

  // Extract unique categories from DB
  const categories = [...new Set(STOCKS_DB.map(s => s.category))];

  // Render Sidebar
  categoryList.innerHTML = categories.map(cat => {
    let icon = '📈';
    if (cat === 'NIFTY 50') icon = '🏛️';
    if (cat === 'Top Gainers') icon = '🚀';
    if (cat === 'Top Losers') icon = '🩸';
    return `<li class="eq-cat-item" data-cat="${cat}" style="cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: background 0.2s;">
      ${icon} ${cat}
    </li>`;
  }).join('');

  const catItems = document.querySelectorAll('.eq-cat-item');

  function selectCategory(cat) {
    // Update Title
    title.innerHTML = `${cat.toUpperCase()} <span style="color: var(--text-secondary); font-size: 12px; margin-left: 10px;">TOP STOCKS</span>`;

    // Highlight sidebar
    catItems.forEach(item => {
      item.style.background = item.getAttribute('data-cat') === cat ? 'rgba(0, 212, 255, 0.15)' : 'transparent';
      item.style.color = item.getAttribute('data-cat') === cat ? 'var(--cyan)' : 'var(--text-secondary)';
    });

    // Render Table
    let stocks = STOCKS_DB.filter(s => s.category === cat);
    if (cat === 'Top Gainers') {
      stocks.sort((a, b) => b.change - a.change);
    } else if (cat === 'Top Losers') {
      stocks.sort((a, b) => a.change - b.change);
    }

    // Limit to top 50 for performance if large
    stocks = stocks.slice(0, 50);

    tbody.innerHTML = stocks.map(stock => {
      const color = stock.change >= 0 ? 'var(--green)' : 'var(--red)';
      const sign = stock.change >= 0 ? '+' : '';
      return `
      <tr style="animation: fadeUp 0.3s ease-out forwards; opacity: 0;">
        <td style="font-weight: 600;">${stock.symbol}</td>
        <td style="font-family: var(--font-mono);">₹${stock.price.toFixed(2)}</td>
        <td style="color: ${color}; font-family: var(--font-mono); font-weight: bold;">${sign}${stock.change.toFixed(2)}%</td>
      </tr>
    `}).join('');

    // Stagger animation
    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row, i) => {
      row.style.animationDelay = `${i * 0.02}s`;
    });
  }

  // Click listeners
  catItems.forEach(item => {
    item.addEventListener('click', () => {
      selectCategory(item.getAttribute('data-cat'));
    });
  });

  // Auto-load first category immediately
  if (categories.length > 0) {
    selectCategory(categories[0]);
  }
}

// ==========================================
// FUNDAMENTAL SCREENER (NIFTY 500 from MARKET_DIRECTORY)
// ==========================================
const SECTOR_MAP = [
  ['Banks', ['SBIN','HDFCBANK','ICICIBANK','AXISBANK','KOTAKBANK','PNB','BANKBARODA','CANBK','UNIONBANK','BANKINDIA','BANDHANBNK','AUBANK','IDFCFIRSTB','RBLBANK','INDUSINDBK','FEDERALBNK','YESBANK','IOB','UCOBANK']],
  ['IT Services', ['TCS','INFY','WIPRO','HCLTECH','TECHM','LTIM','MPHASIS','COFORGE','PERSISTENT','TATAELXSI','OFSS','NETWEB','TATATECH','LTTS','BSOFT','KPITTECH','INTELLECT']],
  ['Pharma', ['CIPLA','SUNPHARMA','DIVISLAB','LUPIN','AUROPHARMA','LAURUSLABS','WOCKPHARMA','BIOCON','TORNTPHARM','ALKEM','GLENMARK','MANKIND','ZYDUSLIFE','IPCALAB','AJANTPHARM','GRANULES','NATCOPHARM','GLAND']],
  ['Auto & Ancillaries', ['TATAMOTORS','MARUTI','EICHERMOT','HEROMOTOCO','HYUNDAI','FORCEMOT','OLAELEC','ATHERENERG','MOTHERSON','BOSCHLTD','TVSMOTOR','ASHOKLEY','BHARATFORG','BALKRISIND','APOLLOTYRE','MRF','EXIDEIND','BAJAJ-AUTO','M&M']],
  ['Energy / Oil & Gas', ['ONGC','OIL','IOC','BPCL','HPCL','GAIL','RELIANCE','PETRONET','GUJGASLTD','MGL','IGL','CHENNPETRO','CASTROLIND']],
  ['Power & Utilities', ['NTPC','POWERGRID','ADANIPOWER','JPPOWER','RPOWER','TATAPOWER','JSWENERGY','ADANIGREEN','WAAREEENER','PREMIERENE','ACMESOLAR','EMMVEE','ATGL','ADANIENSOL','NHPC','SJVN','TORNTPOWER','CESC']],
  ['FMCG', ['ITC','HINDUNILVR','NESTLEIND','BRITANNIA','DABUR','MARICO','VBL','PATANJALI','GODREJCP','COLPAL','TATACONSUM','EMAMILTD','RADICO','UBL']],
  ['Metals & Mining', ['TATASTEEL','JSWSTEEL','HINDALCO','VEDL','JINDALSTEL','NMDC','HINDCOPPER','SAIL','NATIONALUM','COALINDIA','APLAPOLLO','RATNAMANI','MOIL','GMDCLTD']],
  ['Cement', ['ULTRACEMCO','GRASIM','AMBUJACEM','ACC','SHREECEM','DALBHARAT','JKCEMENT','JKLAKSHMI','CEMPRO','PWL','RAMCOCEM','INDIACEM']],
  ['NBFC & Finance', ['BAJFINANCE','BAJAJFINSV','SHRIRAMFIN','MUTHOOTFIN','LICHSGFIN','PFC','RECLTD','CHOLAFIN','IIFL','360ONE','SAMMAANCAP','ABCAPITAL','POLICYBZR','ANGELONE','CDSL','BSE','MCX','CAMS','LTF','POONAWALLA','MANAPPURAM','SUNDARMFIN','ICICIAMC','HDFCAMC','NUVAMA']],
  ['Insurance', ['SBILIFE','HDFCLIFE','ICICIGI','ICICIPRULI','LICI','GODIGIT','STARHEALTH','NIACL']],
  ['Telecom', ['BHARTIARTL','IDEA','INDUSTOWER','TATACOMM','HFCL','TEJASNET','ITI','TTML','VMM','RAILTEL']],
  ['Realty', ['DLF','GODREJPROP','OBEROIRLTY','LODHA','ANANTRAJ','PRESTIGE','PHOENIXLTD','BRIGADE','SOBHA','SUNTECK']],
  ['Capital Goods & Defence', ['LT','BHEL','BEL','HAL','BDL','MAZDOCK','COCHINSHIP','GRSE','SOLARINDS','SIEMENS','ABB','CGPOWER','SCHNEIDER','KAYNES','DATAPATTNS','CUMMINSIND','THERMAX','TIINDIA','HONAUT','GVT&D','APARINDS','RRKABEL','POLYCAB','FINCABLES']],
  ['Consumer Durables', ['DIXON','VOLTAS','HAVELLS','CROMPTON','BLUESTAR','AMBER','TITAN','KAJARIACER','CERA','VGUARD']],
  ['Healthcare', ['APOLLOHOSP','FORTIS','MAXHEALTH','KIMS','GLOBALHLT','RAINBOW','METROPOLIS','LALPATHLAB','THYROCARE','MEDPLUS','SYNGENE']],
  ['Retail', ['DMART','TRENT','ABFRL','V2RETAIL','LENSKART','FIRSTCRY','RELAXO','BATAINDIA','VMART']],
  ['Chemicals & Paints', ['UPL','PIIND','SRF','AARTI','NAVINFLUOR','DEEPAKNTR','TATACHEM','GNFC','GHCL','COROMANDEL','PIDILITIND','BASF','LINDEINDIA','ATUL','BERGEPAINT','ASIANPAINT','KANSAINER','SUDARSCHEM','FACT','CHAMBLFERT','GSFC']],
  ['Media / Internet', ['ETERNAL','ZOMATO','NAUKRI','PAYTM','NYKAA','SAREGAMA','ZEEL','GROWW','PVRINOX','SUNTV','TIPSMUSIC','EASEMYTRIP','IRCTC','DEVYANI','JUBLFOOD','SAPPHIRE','WESTLIFE','SWIGGY']],
  ['Logistics & Infra', ['SCI','GMRAIRPORT','ADANIPORTS','BLUEDART','DELHIVERY','CONCOR','IRFC','RVNL','RITES','TITAGARH','IRB','NCC','HUDCO','IRCON','KEC','KNRCON','PNCINFRA']]
];

function buildScreenerDB() {
  function hash(str) { let h = 5381; for (let i=0;i<str.length;i++) h = ((h<<5)+h) ^ str.charCodeAt(i); return Math.abs(h); }
  function classify(sym) {
    for (const [sector, syms] of SECTOR_MAP) if (syms.includes(sym)) return sector;
    return 'Diversified';
  }
  return MARKET_DIRECTORY.map(s => {
    const h = hash(s.sym);
    const sector = classify(s.sym);
    const pe   = +(8 + (h % 5000) / 100).toFixed(1);
    const roce = +(5 + ((h >> 3) % 4500) / 100).toFixed(2);
    const roe  = +(4 + ((h >> 7) % 4000) / 100).toFixed(2);
    const sharesCr = 50 + ((h >> 11) % 5000);
    const mcap = +(s.price * sharesCr / 10).toFixed(0);
    const div  = +(((h >> 13) % 500) / 100).toFixed(2);
    const debt = +(((h >> 17) % 200) / 100).toFixed(2);
    const beta = +(0.4 + ((h >> 19) % 160) / 100).toFixed(2);
    const eps  = +((s.price / Math.max(pe, 1))).toFixed(2);
    const bookV = +(s.price * (0.4 + (h % 80) / 100)).toFixed(2);
    return { sym: s.sym, name: s.name, cmp: s.price, chg: s.chg, category: sector, pe, roce, roe, mcap, div, debt, beta, eps, bookV };
  });
}

function initFundamentalScreener() {
  const categoryList = document.getElementById('fun-category-list');
  const tbody = document.getElementById('fun-tbody');
  const title = document.getElementById('fun-table-title');
  const search = document.getElementById('fun-search');
  const countEl = document.getElementById('fun-count');
  const thead = document.getElementById('fun-thead');
  if (!categoryList || !tbody) return;

  if (!window.SCREENER_DB || window.SCREENER_DB.length === 0) {
    window.SCREENER_DB = buildScreenerDB();
  }
  const DB = window.SCREENER_DB;

  const counts = {};
  DB.forEach(s => { counts[s.category] = (counts[s.category] || 0) + 1; });
  const sectors = ['All Sectors', ...Object.keys(counts).sort((a,b) => counts[b] - counts[a])];

  let activeCat = sectors[0];
  let query = '';
  let sortKey = 'mcap';
  let sortDir = -1;

  categoryList.innerHTML = sectors.map(cat => {
    const c = cat === 'All Sectors' ? DB.length : (counts[cat] || 0);
    return `<li class="fun-cat-item" data-cat="${cat}" style="padding: 5px 10px; border-radius: 6px; cursor: pointer; color: var(--text-secondary); display:flex; justify-content:space-between; align-items:center;">
      <span>${cat}</span><span class="cnt">${c}</span>
    </li>`;
  }).join('');

  function render() {
    let rows = DB;
    if (activeCat !== 'All Sectors') rows = rows.filter(s => s.category === activeCat);
    if (query) {
      const q = query.toLowerCase();
      rows = rows.filter(s => s.sym.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    }
    rows = rows.slice().sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      if (typeof va === 'number') return (va - vb) * sortDir;
      return String(va).localeCompare(String(vb)) * sortDir;
    }).slice(0, 200);

    title.textContent = activeCat.toUpperCase();
    countEl.textContent = rows.length + (rows.length === 200 ? '+ shown' : ' results');

    tbody.innerHTML = rows.map(s => {
      const chgCol = s.chg >= 0 ? 'var(--green)' : 'var(--red)';
      const chgSign = s.chg >= 0 ? '+' : '';
      return `<tr data-sym="${s.sym}">
        <td><div style="font-weight:600;">${s.sym}</div><div style="font-size:11px;color:var(--text-dim);">${s.category}</div></td>
        <td style="text-align:right; font-family:var(--font-mono);">₹${s.cmp.toFixed(2)}</td>
        <td style="text-align:right; font-family:var(--font-mono); color:${chgCol};">${chgSign}${s.chg.toFixed(2)}%</td>
        <td style="text-align:right; font-family:var(--font-mono); color:var(--amber);">${s.pe.toFixed(1)}</td>
        <td style="text-align:right; font-family:var(--font-mono);">${s.mcap.toLocaleString('en-IN')}</td>
        <td style="text-align:right; font-family:var(--font-mono); color:${s.roce>15?'var(--green)':'var(--text-secondary)'};">${s.roce.toFixed(1)}</td>
        <td style="text-align:right; font-family:var(--font-mono); color:${s.roe>15?'var(--green)':'var(--text-secondary)'};">${s.roe.toFixed(1)}</td>
      </tr>`;
    }).join('');

    document.querySelectorAll('.fun-cat-item').forEach(el => {
      el.classList.toggle('active', el.dataset.cat === activeCat);
    });

    tbody.querySelectorAll('tr').forEach(tr => {
      tr.addEventListener('click', () => openResearch(tr.dataset.sym));
    });
  }

  categoryList.addEventListener('click', (e) => {
    const item = e.target.closest('.fun-cat-item');
    if (!item) return;
    activeCat = item.dataset.cat;
    render();
  });

  if (search) search.addEventListener('input', (e) => { query = e.target.value; render(); });

  if (thead) thead.addEventListener('click', (e) => {
    const th = e.target.closest('th[data-sort]');
    if (!th) return;
    const key = th.dataset.sort;
    if (sortKey === key) sortDir = -sortDir; else { sortKey = key; sortDir = -1; }
    render();
  });

  render();
}

// ==========================================
// RESEARCH DETAIL MODAL
// ==========================================
function openResearch(sym) {
  const stock = (window.SCREENER_DB || []).find(s => s.sym === sym);
  const overlay = document.getElementById('research-overlay');
  const content = document.getElementById('research-content');
  if (!stock || !overlay || !content) return;

  const chgCol = stock.chg >= 0 ? 'var(--green)' : 'var(--red)';
  const chgSign = stock.chg >= 0 ? '+' : '';
  const grade = stock.roce > 20 && stock.roe > 18 ? 'Quality compounder profile.' : stock.roce > 12 ? 'Solid fundamentals.' : 'Speculative — verify thesis carefully.';
  const peVerdict = stock.pe < 15 ? 'attractively valued' : stock.pe < 30 ? 'fairly priced' : 'priced for growth';

  content.innerHTML = `
    <div class="rs-head">
      <span class="rs-symbol">${stock.sym}</span>
      <span class="rs-sector">${stock.category}</span>
    </div>
    <div style="color: var(--text-dim); font-size: 12px; margin-bottom: 4px;">${stock.name}</div>
    <div class="rs-price-row">
      <span class="rs-price">₹${stock.cmp.toFixed(2)}</span>
      <span class="rs-chg" style="color:${chgCol};">${chgSign}${stock.chg.toFixed(2)}% today</span>
    </div>

    <div class="rs-thesis">
      <strong style="color:var(--cyan);">Quick read:</strong> ${stock.sym} appears ${peVerdict} at P/E ${stock.pe} with ROCE ${stock.roce}% and ROE ${stock.roe}%. ${grade} Verify with primary sources below before committing capital.
    </div>

    <div class="rs-section-title">KEY METRICS</div>
    <div class="rs-grid">
      <div class="rs-stat"><div class="rs-stat-label">P / E</div><div class="rs-stat-val">${stock.pe}</div></div>
      <div class="rs-stat"><div class="rs-stat-label">MARKET CAP (CR)</div><div class="rs-stat-val">${stock.mcap.toLocaleString('en-IN')}</div></div>
      <div class="rs-stat"><div class="rs-stat-label">ROCE</div><div class="rs-stat-val">${stock.roce}%</div></div>
      <div class="rs-stat"><div class="rs-stat-label">ROE</div><div class="rs-stat-val">${stock.roe}%</div></div>
      <div class="rs-stat"><div class="rs-stat-label">EPS (TTM)</div><div class="rs-stat-val">₹${stock.eps}</div></div>
      <div class="rs-stat"><div class="rs-stat-label">BOOK VALUE</div><div class="rs-stat-val">₹${stock.bookV}</div></div>
      <div class="rs-stat"><div class="rs-stat-label">DIV YIELD</div><div class="rs-stat-val">${stock.div}%</div></div>
      <div class="rs-stat"><div class="rs-stat-label">DEBT / EQUITY</div><div class="rs-stat-val">${stock.debt}</div></div>
      <div class="rs-stat"><div class="rs-stat-label">BETA (1Y)</div><div class="rs-stat-val">${stock.beta}</div></div>
    </div>

    <div class="rs-section-title">RESEARCH ON EXTERNAL PLATFORMS</div>
    <div class="rs-links">
      <a class="rs-link" href="https://www.screener.in/company/${stock.sym}/" target="_blank" rel="noopener">Screener.in</a>
      <a class="rs-link" href="https://www.tickertape.in/stocks/${stock.sym.toLowerCase()}" target="_blank" rel="noopener">Tickertape</a>
      <a class="rs-link" href="https://www.nseindia.com/get-quotes/equity?symbol=${stock.sym}" target="_blank" rel="noopener">NSE Quote</a>
      <a class="rs-link" href="https://trendlyne.com/equity/Summary/${stock.sym}/" target="_blank" rel="noopener">Trendlyne</a>
      <a class="rs-link" href="https://www.moneycontrol.com/india/stockpricequote/${stock.sym}" target="_blank" rel="noopener">Moneycontrol</a>
      <a class="rs-link" href="https://www.google.com/finance/quote/${stock.sym}:NSE" target="_blank" rel="noopener">Google Finance</a>
      <a class="rs-link" href="https://www.tijorifinance.com/company/${stock.sym.toLowerCase()}/" target="_blank" rel="noopener">Tijori Finance</a>
      <a class="rs-link" href="https://pulse.zerodha.com/?q=${stock.sym}" target="_blank" rel="noopener">Zerodha Pulse</a>
    </div>

    <div class="rs-actions">
      <button class="rs-btn primary" id="rs-track-btn" data-sym="${stock.sym}">📈 Add to Daily Tracker</button>
      <button class="rs-btn" id="rs-close-btn">Close</button>
    </div>
  `;
  overlay.classList.remove('hidden');

  document.getElementById('rs-track-btn')?.addEventListener('click', () => {
    if (window.dexterAddToTracker) {
      const ok = window.dexterAddToTracker(stock.sym, 'STOCK');
      if (ok) {
        closeResearch();
        document.getElementById('tab-tracker')?.click();
      }
    }
  });
  document.getElementById('rs-close-btn')?.addEventListener('click', closeResearch);
}

function closeResearch() {
  document.getElementById('research-overlay')?.classList.add('hidden');
}

document.addEventListener('click', (e) => {
  if (e.target.id === 'research-close-btn') closeResearch();
  if (e.target.id === 'research-overlay') closeResearch();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeResearch();
});

const STOCKS_DB = [
  { symbol: 'BSE', category: 'Top Losers', price: 3881, change: -3.78 },
  { symbol: 'ZEEL', category: 'Top Gainers', price: 112.39, change: 7.63 },
  { symbol: 'RELIANCE', category: 'NIFTY 50', price: 1291.4, change: -0.49 },
  { symbol: 'SBIN', category: 'NIFTY 50', price: 977, change: -0.23 },
  { symbol: 'ADANIENT', category: 'NIFTY 50', price: 3043, change: 2.36 },
  { symbol: 'HDFCBANK', category: 'NIFTY 50', price: 748.2, change: -0.8 },
  { symbol: 'HSCL', category: 'Top Gainers', price: 688, change: 7.17 },
  { symbol: 'ADANIGREEN', category: 'Top Gainers', price: 1522, change: 6.93 },
  { symbol: 'GROWW', category: 'Top Gainers', price: 196.25, change: 3.2 },
  { symbol: 'MCX', category: 'Top Losers', price: 2789.8, change: -3.58 },
  { symbol: 'ICICIBANK', category: 'NIFTY 50', price: 1261, change: 0.74 },
  { symbol: 'BAJFINANCE', category: 'NIFTY 50', price: 889.55, change: 1.73 },
  { symbol: 'TCS', category: 'NIFTY 50', price: 2196, change: -2.01 },
  { symbol: 'INFY', category: 'NIFTY 50', price: 1199, change: -0.19 },
  { symbol: 'IDEA', category: 'NIFTY 50', price: 14.96, change: 0.2 },
  { symbol: 'OLAELEC', category: 'Top Gainers', price: 45, change: 3.88 },
  { symbol: 'AXISBANK', category: 'NIFTY 50', price: 1273.3, change: 1.6 },
  { symbol: 'NETWEB', category: 'Top Losers', price: 4670, change: -5.35 },
  { symbol: 'ETERNAL', category: 'NIFTY 50', price: 256.75, change: 0.94 },
  { symbol: 'ADANIENSOL', category: 'Top Gainers', price: 1578.8, change: 3.87 },
  { symbol: 'WIPRO', category: 'Top Losers', price: 198.05, change: -3.07 },
  { symbol: 'TEJASNET', category: 'Top Losers', price: 579.1, change: -3.8 },
  { symbol: 'HFCL', category: 'Top Losers', price: 187.23, change: -5 },
  { symbol: 'ATGL', category: 'NIFTY 50', price: 761.6, change: 2.36 },
  { symbol: 'TATASTEEL', category: 'NIFTY 50', price: 206.8, change: -1.79 },
  { symbol: 'ADANIPOWER', category: 'NIFTY 50', price: 232.7, change: 1.16 },
  { symbol: 'BHARTIARTL', category: 'NIFTY 50', price: 1798, change: -1.15 },
  { symbol: 'SCI', category: 'NIFTY 50', price: 302.65, change: -0.53 },
  { symbol: 'BHEL', category: 'NIFTY 50', price: 386.55, change: -0.68 },
  { symbol: 'POLICYBZR', category: 'NIFTY 50', price: 1540, change: 0.24 },
  { symbol: 'VEDL', category: 'Top Losers', price: 317.05, change: -3.19 },
  { symbol: 'WOCKPHARMA', category: 'Top Losers', price: 1924.2, change: -7.17 },
  { symbol: 'CANBK', category: 'NIFTY 50', price: 136.4, change: 2.46 },
  { symbol: 'BANKBARODA', category: 'NIFTY 50', price: 264, change: 0.46 },
  { symbol: 'HINDZINC', category: 'Top Losers', price: 568.8, change: -5.8 },
  { symbol: 'TITAN', category: 'NIFTY 50', price: 4268, change: 0.87 },
  { symbol: 'PINELABS', category: 'NIFTY 50', price: 144.29, change: 1.44 },
  { symbol: 'MEESHO', category: 'NIFTY 50', price: 165.8, change: 0.28 },
  { symbol: 'NATIONALUM', category: 'Top Losers', price: 395.6, change: -4.44 },
  { symbol: 'IFCI', category: 'Top Losers', price: 79.61, change: -2.89 },
  { symbol: 'SHRIRAMFIN', category: 'NIFTY 50', price: 922.6, change: 0.74 },
  { symbol: 'M&M', category: 'NIFTY 50', price: 3039, change: 0.76 },
  { symbol: 'LT', category: 'NIFTY 50', price: 3962.1, change: 0.51 },
  { symbol: 'HINDALCO', category: 'Top Losers', price: 1092, change: -2.99 },
  { symbol: 'DATAPATTNS', category: 'NIFTY 50', price: 4215, change: 0.54 },
  { symbol: 'JYOTICNC', category: 'Top Gainers', price: 635.4, change: 6.25 },
  { symbol: 'SAMMAANCAP', category: 'NIFTY 50', price: 184.2, change: 0.59 },
  { symbol: 'GODIGIT', category: 'NIFTY 50', price: 306.95, change: 1.37 },
  { symbol: 'PFC', category: 'NIFTY 50', price: 431.5, change: 1.66 },
  { symbol: 'ULTRACEMCO', category: 'NIFTY 50', price: 10919, change: -0.71 },
  { symbol: 'COALINDIA', category: 'BSE/NSE 500', price: 472.05, change: -1.99 },
  { symbol: 'BEL', category: 'BSE/NSE 500', price: 408, change: -0.46 },
  { symbol: 'ITC', category: 'BSE/NSE 500', price: 280.95, change: 0.23 },
  { symbol: 'GVT&D', category: 'BSE/NSE 500', price: 5026, change: -1.19 },
  { symbol: 'SUNPHARMA', category: 'BSE/NSE 500', price: 1783.1, change: 0.17 },
  { symbol: 'ANGELONE', category: 'BSE/NSE 500', price: 333.35, change: -1.29 },
  { symbol: 'ATHERENERG', category: 'Top Gainers', price: 1039, change: 5.15 },
  { symbol: 'DIXON', category: 'BSE/NSE 500', price: 11450, change: -0.33 },
  { symbol: 'CGPOWER', category: 'BSE/NSE 500', price: 938.15, change: 0.03 },
  { symbol: 'ASIANPAINT', category: 'BSE/NSE 500', price: 2677, change: 0.58 },
  { symbol: 'NHPC', category: 'BSE/NSE 500', price: 74.9, change: -1.6 },
  { symbol: 'SUZLON', category: 'BSE/NSE 500', price: 55.23, change: -0.7 },
  { symbol: 'POWERINDIA', category: 'BSE/NSE 500', price: 36765, change: 0.66 },
  { symbol: 'MARUTI', category: 'BSE/NSE 500', price: 13035, change: -0.22 },
  { symbol: 'SAIL', category: 'Top Losers', price: 190.38, change: -3.51 },
  { symbol: 'HINDUNILVR', category: 'BSE/NSE 500', price: 2121.2, change: 2.01 },
  { symbol: 'KOTAKBANK', category: 'BSE/NSE 500', price: 376.95, change: -1.19 },
  { symbol: 'TMPV', category: 'BSE/NSE 500', price: 397.45, change: -0.56 },
  { symbol: 'NMDC', category: 'Top Losers', price: 92.5, change: -2.32 },
  { symbol: 'RECLTD', category: 'BSE/NSE 500', price: 343.3, change: 2.42 },
  { symbol: 'TRENT', category: 'Top Losers', price: 2770, change: -2.38 },
  { symbol: 'NTPC', category: 'BSE/NSE 500', price: 360.75, change: -1.54 },
  { symbol: 'CHOLAFIN', category: 'BSE/NSE 500', price: 1506, change: 1.35 },
  { symbol: 'COFORGE', category: 'BSE/NSE 500', price: 1431.1, change: -0.38 },
  { symbol: 'INDIGO', category: 'BSE/NSE 500', price: 4473.6, change: -0.78 },
  { symbol: 'ACUTAAS', category: 'Top Gainers', price: 3329, change: 5.19 },
  { symbol: 'CPPLUS', category: 'BSE/NSE 500', price: 3484, change: -1.52 },
  { symbol: 'YESBANK', category: 'Top Gainers', price: 23.39, change: 2.72 },
  { symbol: 'AMBER', category: 'Top Gainers', price: 7880, change: 3.45 },
  { symbol: 'TECHM', category: 'BSE/NSE 500', price: 1482, change: -0.36 },
  { symbol: 'ASHOKLEY', category: 'BSE/NSE 500', price: 145.41, change: 0.67 },
  { symbol: 'SWIGGY', category: 'BSE/NSE 500', price: 251.2, change: -0.97 },
  { symbol: 'HEROMOTOCO', category: 'BSE/NSE 500', price: 4825, change: -1.17 },
  { symbol: 'AMBUJACEM', category: 'BSE/NSE 500', price: 418.3, change: -1.89 },
  { symbol: 'KALYANKJIL', category: 'Top Gainers', price: 372.45, change: 2.86 },
  { symbol: 'NBCC', category: 'BSE/NSE 500', price: 106.36, change: 2.19 },
  { symbol: 'EICHERMOT', category: 'BSE/NSE 500', price: 7050, change: -0.84 },
  { symbol: 'ADANIPORTS', category: 'BSE/NSE 500', price: 1826, change: 1.96 },
  { symbol: 'INDIANB', category: 'BSE/NSE 500', price: 843.5, change: 0.75 },
  { symbol: 'ZENTEC', category: 'BSE/NSE 500', price: 1819, change: 0.51 },
  { symbol: 'JIOFIN', category: 'BSE/NSE 500', price: 237.29, change: 0.66 },
  { symbol: 'FEDERALBNK', category: 'BSE/NSE 500', price: 304.8, change: 1.57 },
  { symbol: 'TVSMOTOR', category: 'BSE/NSE 500', price: 3377, change: 0.43 },
  { symbol: 'HDFCAMC', category: 'BSE/NSE 500', price: 2500.2, change: 1.27 },
  { symbol: 'RVNL', category: 'BSE/NSE 500', price: 235.65, change: -0.34 },
  { symbol: '360ONE', category: 'BSE/NSE 500', price: 1073.8, change: 0.19 },
  { symbol: 'PNB', category: 'BSE/NSE 500', price: 107, change: 1.26 },
  { symbol: 'BAJAJ-AUTO', category: 'BSE/NSE 500', price: 10350, change: -0.12 },
  { symbol: 'POLYCAB', category: 'BSE/NSE 500', price: 9670, change: -0.49 },
  { symbol: 'ANANTRAJ', category: 'Top Losers', price: 567, change: -3.79 },
  { symbol: 'BAJAJFINSV', category: 'BSE/NSE 500', price: 1700, change: -0.57 },
  { symbol: 'KAYNES', category: 'BSE/NSE 500', price: 3124.5, change: -2.07 },
  { symbol: 'ACMESOLAR', category: 'BSE/NSE 500', price: 354.1, change: 2.39 },
  { symbol: 'LUPIN', category: 'BSE/NSE 500', price: 2260, change: 0.45 },
  { symbol: 'TATATECH', category: 'Top Gainers', price: 775, change: 3.56 },
  { symbol: 'HCLTECH', category: 'BSE/NSE 500', price: 1155.1, change: -1.13 },
  { symbol: 'HDFCLIFE', category: 'BSE/NSE 500', price: 574.8, change: 0.18 },
  { symbol: 'TMCV', category: 'BSE/NSE 500', price: 368.5, change: -1.37 },
  { symbol: 'RITES', category: 'Top Gainers', price: 209.95, change: 4.86 },
  { symbol: 'PATANJALI', category: 'BSE/NSE 500', price: 422.05, change: -1.22 },
  { symbol: 'WAAREEENER', category: 'BSE/NSE 500', price: 3051, change: -0.67 },
  { symbol: 'FIRSTCRY', category: 'BSE/NSE 500', price: 219.4, change: -0.14 },
  { symbol: 'CUMMINSIND', category: 'BSE/NSE 500', price: 5776, change: -0.2 },
  { symbol: 'LAURUSLABS', category: 'BSE/NSE 500', price: 1445.5, change: 1.28 },
  { symbol: 'UNIONBANK', category: 'BSE/NSE 500', price: 167.04, change: 0.3 },
  { symbol: 'GMRAIRPORT', category: 'BSE/NSE 500', price: 101.93, change: -0.06 },
  { symbol: 'GRASIM', category: 'BSE/NSE 500', price: 3092, change: -0.37 },
  { symbol: 'HYUNDAI', category: 'BSE/NSE 500', price: 1905, change: -1.42 },
  { symbol: 'PERSISTENT', category: 'BSE/NSE 500', price: 5023, change: -1.92 },
  { symbol: 'LTF', category: 'BSE/NSE 500', price: 268.8, change: 0.79 },
  { symbol: 'HAL', category: 'BSE/NSE 500', price: 4216, change: 0.6 },
  { symbol: 'INDUSTOWER', category: 'BSE/NSE 500', price: 429.5, change: -0.22 },
  { symbol: 'JSWSTEEL', category: 'BSE/NSE 500', price: 1286.6, change: -1.11 },
  { symbol: 'IDFCFIRSTB', category: 'BSE/NSE 500', price: 72.4, change: 0.33 },
  { symbol: 'VMM', category: 'BSE/NSE 500', price: 118.55, change: 0.25 },
  { symbol: 'ONGC', category: 'BSE/NSE 500', price: 264.3, change: -1.21 },
  { symbol: 'POWERGRID', category: 'BSE/NSE 500', price: 285.4, change: 0.28 },
  { symbol: 'MOTHERSON', category: 'BSE/NSE 500', price: 143.41, change: -0.62 },
  { symbol: 'OFSS', category: 'BSE/NSE 500', price: 9968.5, change: -1.28 },
  { symbol: 'LENSKART', category: 'BSE/NSE 500', price: 506, change: -1.37 },
  { symbol: 'DLF', category: 'BSE/NSE 500', price: 577.9, change: 0.02 },
  { symbol: 'AUBANK', category: 'BSE/NSE 500', price: 969, change: 0.72 },
  { symbol: 'GRSE', category: 'BSE/NSE 500', price: 2653.1, change: -0.87 },
  { symbol: 'TATACOMM', category: 'BSE/NSE 500', price: 1970, change: -0.8 },
  { symbol: 'SOLARINDS', category: 'BSE/NSE 500', price: 18415, change: 0.67 },
  { symbol: 'AUROPHARMA', category: 'BSE/NSE 500', price: 1458, change: -0.38 },
  { symbol: 'SAREGAMA', category: 'Top Gainers', price: 474, change: 4.73 },
  { symbol: 'TORNTPHARM', category: 'BSE/NSE 500', price: 4416, change: 1.75 },
  { symbol: 'RPOWER', category: 'Top Gainers', price: 28.71, change: 4.82 },
  { symbol: 'NESTLEIND', category: 'BSE/NSE 500', price: 1391, change: 0.59 },
  { symbol: 'SCHNEIDER', category: 'Top Gainers', price: 1167, change: 5.15 },
  { symbol: 'VOLTAS', category: 'BSE/NSE 500', price: 1301, change: 1.13 },
  { symbol: 'BDL', category: 'BSE/NSE 500', price: 1207.5, change: -0.44 },
  { symbol: 'APLAPOLLO', category: 'BSE/NSE 500', price: 1825, change: 0.92 },
  { symbol: 'BANKINDIA', category: 'BSE/NSE 500', price: 141.6, change: 1.37 },
  { symbol: 'ABB', category: 'BSE/NSE 500', price: 7160, change: 0.06 },
  { symbol: 'EMMVEE', category: 'BSE/NSE 500', price: 334.25, change: 1.46 },
  { symbol: 'HINDCOPPER', category: 'BSE/NSE 500', price: 529, change: -2.29 },
  { symbol: 'MUTHOOTFIN', category: 'BSE/NSE 500', price: 3154, change: -0.5 },
  { symbol: 'JPPOWER', category: 'BSE/NSE 500', price: 19.04, change: 0 },
  { symbol: 'FORCEMOT', category: 'BSE/NSE 500', price: 18250, change: -1.84 },
  { symbol: 'INDUSINDBK', category: 'BSE/NSE 500', price: 903.1, change: -0.01 },
  { symbol: 'KIMS', category: 'Top Gainers', price: 790, change: 3.28 },
  { symbol: 'VBL', category: 'BSE/NSE 500', price: 521.9, change: -1.23 },
  { symbol: 'LICHSGFIN', category: 'BSE/NSE 500', price: 548, change: 0.45 },
  { symbol: 'UPL', category: 'BSE/NSE 500', price: 637, change: -0.34 },
  { symbol: 'BPCL', category: 'BSE/NSE 500', price: 295.15, change: 0 },
  { symbol: 'COCHINSHIP', category: 'Top Losers', price: 1433.1, change: -2.67 },
  { symbol: 'APOLLOHOSP', category: 'BSE/NSE 500', price: 8314.5, change: 0.79 },
  { symbol: 'DMART', category: 'BSE/NSE 500', price: 4142, change: 0.07 },
  { symbol: 'TTML', category: 'Top Gainers', price: 46.09, change: 4.32 },
  { symbol: 'ICICIAMC', category: 'BSE/NSE 500', price: 3260, change: -1.64 },
  { symbol: 'FORTIS', category: 'BSE/NSE 500', price: 961.1, change: 2.17 },
  { symbol: 'IOC', category: 'BSE/NSE 500', price: 138.3, change: -0.47 },
  { symbol: 'CIPLA', category: 'BSE/NSE 500', price: 1402, change: 1.18 },
  { symbol: 'MARICO', category: 'BSE/NSE 500', price: 810.1, change: -0.83 },
  { symbol: 'NAUKRI', category: 'BSE/NSE 500', price: 986, change: -2.26 },
  { symbol: 'PAYTM', category: 'BSE/NSE 500', price: 1066, change: 0.71 },
  { symbol: 'MAZDOCK', category: 'BSE/NSE 500', price: 2425, change: -0.83 },
  { symbol: 'RBLBANK', category: 'BSE/NSE 500', price: 351.45, change: -0.65 },
  { symbol: 'CHENNPETRO', category: 'BSE/NSE 500', price: 1180, change: -0.89 },
  { symbol: 'APARINDS', category: 'BSE/NSE 500', price: 13823, change: 0.83 },
  { symbol: 'CDSL', category: 'BSE/NSE 500', price: 1216.7, change: -0.02 },
  { symbol: 'ABCAPITAL', category: 'BSE/NSE 500', price: 357, change: 0.95 },
  { symbol: 'GAIL', category: 'BSE/NSE 500', price: 168, change: 0.27 },
  { symbol: 'PWL', category: 'Top Losers', price: 102.51, change: -3.71 },
  { symbol: 'DIVISLAB', category: 'BSE/NSE 500', price: 6615.5, change: 0.29 },
  { symbol: 'ICICIGI', category: 'BSE/NSE 500', price: 1755.6, change: 1.31 },
  { symbol: 'CEMPRO', category: 'BSE/NSE 500', price: 1102.9, change: -2.16 },
  { symbol: 'ENRIN', category: 'BSE/NSE 500', price: 3646, change: -1.48 },
  { symbol: 'MAXHEALTH', category: 'BSE/NSE 500', price: 977, change: 1.12 },
  { symbol: 'SBILIFE', category: 'BSE/NSE 500', price: 1785, change: 1.14 },
  { symbol: 'LICI', category: 'BSE/NSE 500', price: 400, change: 0.34 },
  { symbol: 'CROMPTON', category: 'BSE/NSE 500', price: 268, change: -0.48 },
  { symbol: 'SIEMENS', category: 'BSE/NSE 500', price: 3700, change: 0.36 },
  { symbol: 'BANDHANBNK', category: 'BSE/NSE 500', price: 205.92, change: 0.23 },
  { symbol: 'RRKABEL', category: 'BSE/NSE 500', price: 2220, change: -0.13 },
  { symbol: 'PREMIERENE', category: 'BSE/NSE 500', price: 1080.4, change: 0.24 },
  { symbol: 'OIL', category: 'BSE/NSE 500', price: 483.4, change: -1.12 },
  { symbol: 'LODHA', category: 'BSE/NSE 500', price: 895.6, change: 1.57 },
  { symbol: 'JINDALSTEL', category: 'BSE/NSE 500', price: 1183, change: -1.19 },
  { symbol: 'PRESTIGE', category: 'BSE/NSE 500', price: 1385, change: 2.08 },
  { symbol: 'INOXWIND', category: 'BSE/NSE 500', price: 87.01, change: 1.43 },
  { symbol: 'HINDPETRO', category: 'BSE/NSE 500', price: 385.25, change: -0.45 },
  { symbol: 'UNOMINDA', category: 'BSE/NSE 500', price: 1095, change: 1.13 },
  { symbol: 'EXIDEIND', category: 'BSE/NSE 500', price: 399.2, change: -1.04 },
  { symbol: 'TATACONSUM', category: 'BSE/NSE 500', price: 1131.8, change: -1.52 },
  { symbol: 'NLCINDIA', category: 'BSE/NSE 500', price: 336.8, change: -0.53 },
  { symbol: 'GLENMARK', category: 'BSE/NSE 500', price: 2165, change: -0.72 },
  { symbol: 'NATCOPHARM', category: 'Top Losers', price: 893, change: -2.8 },
  { symbol: 'GLAND', category: 'Top Gainers', price: 2287, change: 3.04 },
  { symbol: 'GODREJPROP', category: 'BSE/NSE 500', price: 1703.7, change: 0.55 },
  { symbol: 'IIFL', category: 'Top Losers', price: 517, change: -2.51 },
  { symbol: 'KEI', category: 'BSE/NSE 500', price: 5336, change: 0.76 },
  { symbol: 'GMDCLTD', category: 'Top Losers', price: 658.55, change: -2.7 },
  { symbol: 'KFINTECH', category: 'BSE/NSE 500', price: 867, change: 1.6 },
  { symbol: 'TATAPOWER', category: 'BSE/NSE 500', price: 409, change: -0.44 },
  { symbol: 'BIOCON', category: 'BSE/NSE 500', price: 413.45, change: -0.62 },
  { symbol: 'PIRAMALFIN', category: 'BSE/NSE 500', price: 1979, change: 0.69 },
  { symbol: 'PNBHOUSING', category: 'BSE/NSE 500', price: 998.9, change: -0.05 },
  { symbol: 'MAHABANK', category: 'BSE/NSE 500', price: 79.25, change: 0.7 },
  { symbol: 'LTM', category: 'BSE/NSE 500', price: 4025.9, change: -1.03 },
  { symbol: 'ZYDUSLIFE', category: 'BSE/NSE 500', price: 1090.5, change: 0.54 },
  { symbol: 'OLECTRA', category: 'Top Losers', price: 1291, change: -2.29 },
  { symbol: 'BOSCHLTD', category: 'BSE/NSE 500', price: 37200, change: 0.54 },
  { symbol: 'DRREDDY', category: 'BSE/NSE 500', price: 1283, change: 1.22 },
  { symbol: 'THERMAX', category: 'BSE/NSE 500', price: 4836, change: -0.82 },
  { symbol: 'AIAENG', category: 'BSE/NSE 500', price: 4630, change: 0.73 },
  { symbol: 'SONACOMS', category: 'BSE/NSE 500', price: 604, change: 0.47 },
  { symbol: 'PGEL', category: 'BSE/NSE 500', price: 487.15, change: -1.17 },
  { symbol: 'SYRMA', category: 'BSE/NSE 500', price: 1230.1, change: 0.7 },
  { symbol: 'MRF', category: 'BSE/NSE 500', price: 123400, change: -1.05 },
  { symbol: 'SAILIFE', category: 'Top Gainers', price: 1188, change: 2.48 },
  { symbol: 'JSWENERGY', category: 'BSE/NSE 500', price: 581, change: -1.2 },
  { symbol: 'LLOYDSME', category: 'BSE/NSE 500', price: 1777, change: 0.08 },
  { symbol: 'HAVELLS', category: 'BSE/NSE 500', price: 1152.1, change: -1.23 },
  { symbol: 'NAM-INDIA', category: 'BSE/NSE 500', price: 1111, change: -1.6 },
  { symbol: 'HBLENGINE', category: 'BSE/NSE 500', price: 793.55, change: -0.39 },
  { symbol: 'CONCOR', category: 'BSE/NSE 500', price: 450.6, change: -0.83 },
  { symbol: 'CARTRADE', category: 'Top Gainers', price: 1970, change: 2.96 },
  { symbol: 'PHOENIXLTD', category: 'BSE/NSE 500', price: 1742.6, change: 0.77 },
  { symbol: 'BRITANNIA', category: 'BSE/NSE 500', price: 5129, change: 0.77 },
  { symbol: 'M&MFIN', category: 'BSE/NSE 500', price: 290.35, change: 0.45 },
  { symbol: 'JAINREC', category: 'Top Losers', price: 344.2, change: -3.77 },
  { symbol: 'SARDAEN', category: 'Top Gainers', price: 550, change: 3.34 },
  { symbol: 'MPHASIS', category: 'BSE/NSE 500', price: 2330.5, change: 0.63 },
  { symbol: 'ICICIPRULI', category: 'BSE/NSE 500', price: 485.3, change: 2.07 },
  { symbol: 'DABUR', category: 'BSE/NSE 500', price: 425.05, change: 0.09 },
  { symbol: 'PETRONET', category: 'BSE/NSE 500', price: 269.6, change: 0.2 },
  { symbol: 'IRFC', category: 'BSE/NSE 500', price: 96.37, change: 0.32 },
  { symbol: 'KARURVYSYA', category: 'BSE/NSE 500', price: 280.45, change: -1.23 },
  { symbol: 'CAMS', category: 'BSE/NSE 500', price: 761.4, change: 0.3 },
  { symbol: 'BLUESTARCO', category: 'BSE/NSE 500', price: 1587, change: -1.28 },
  { symbol: 'VIJAYA', category: 'BSE/NSE 500', price: 1355, change: -0.32 },
  { symbol: 'INDHOTEL', category: 'BSE/NSE 500', price: 656.95, change: -0.7 },
  { symbol: 'JBMA', category: 'Top Losers', price: 675, change: -2.57 },
  { symbol: 'ALKEM', category: 'BSE/NSE 500', price: 5250, change: -0.5 },
  { symbol: 'BHARATFORG', category: 'BSE/NSE 500', price: 1930.5, change: -0.36 },
  { symbol: 'MANAPPURAM', category: 'BSE/NSE 500', price: 308.5, change: -0.77 },
  { symbol: 'FINCABLES', category: 'Top Gainers', price: 1055.1, change: 3.63 },
  { symbol: 'TATAELXSI', category: 'BSE/NSE 500', price: 4292, change: -0.07 },
  { symbol: 'TATACAP', category: 'BSE/NSE 500', price: 314.55, change: 1.08 },
  { symbol: 'COROMANDEL', category: 'BSE/NSE 500', price: 1798, change: 1.99 },
  { symbol: 'PIDILITIND', category: 'BSE/NSE 500', price: 1473.9, change: 0.19 },
  { symbol: 'REDINGTON', category: 'Top Losers', price: 239.33, change: -3.13 },
  { symbol: 'BAJAJHLDNG', category: 'BSE/NSE 500', price: 10200, change: 0.72 },
  { symbol: 'PTCIL', category: 'BSE/NSE 500', price: 18598, change: -0.48 },
  { symbol: 'WELCORP', category: 'BSE/NSE 500', price: 1393, change: -0.69 },
  { symbol: 'CENTRALBK', category: 'BSE/NSE 500', price: 30.4, change: 0.4 },
  { symbol: 'COHANCE', category: 'BSE/NSE 500', price: 430.9, change: 1.32 },
  { symbol: 'PAGEIND', category: 'BSE/NSE 500', price: 38300, change: -1.38 },
  { symbol: 'CGCL', category: 'BSE/NSE 500', price: 202.5, change: -0.01 },
  { symbol: 'NEWGEN', category: 'BSE/NSE 500', price: 488, change: -1.72 },
  { symbol: 'RADICO', category: 'BSE/NSE 500', price: 3495, change: -0.21 },
  { symbol: 'SHYAMMETL', category: 'BSE/NSE 500', price: 1001.5, change: -0.05 },
  { symbol: 'IEX', category: 'BSE/NSE 500', price: 122.36, change: -1.38 },
  { symbol: 'KPITTECH', category: 'BSE/NSE 500', price: 775.45, change: 0.32 },
  { symbol: 'JINDALSAW', category: 'Top Losers', price: 251.25, change: -3.37 },
  { symbol: 'GODREJCP', category: 'BSE/NSE 500', price: 995.1, change: -0.03 },
  { symbol: 'IREDA', category: 'BSE/NSE 500', price: 123.46, change: 0.18 },
  { symbol: 'ANANDRATHI', category: 'BSE/NSE 500', price: 1755, change: 0.25 },
  { symbol: 'MRPL', category: 'BSE/NSE 500', price: 154.8, change: -1.14 },
  { symbol: 'TARIL', category: 'BSE/NSE 500', price: 321.5, change: 1.29 },
  { symbol: 'IDBI', category: 'BSE/NSE 500', price: 73.19, change: 0.34 },
  { symbol: 'ASTRAL', category: 'BSE/NSE 500', price: 1523, change: -1.7 },
  { symbol: 'TIINDIA', category: 'BSE/NSE 500', price: 3121, change: 0.73 },
  { symbol: 'GESHIP', category: 'BSE/NSE 500', price: 1469.8, change: -1.49 },
  { symbol: 'ABLBL', category: 'BSE/NSE 500', price: 101.53, change: 0.71 },
  { symbol: 'TITAGARH', category: 'Top Losers', price: 838, change: -3.01 },
  { symbol: 'AEGISLOG', category: 'BSE/NSE 500', price: 768.5, change: 1.68 },
  { symbol: 'ACC', category: 'BSE/NSE 500', price: 1330, change: -1.54 },
  { symbol: 'POONAWALLA', category: 'BSE/NSE 500', price: 389, change: -1.11 },
  { symbol: 'GODFRYPHLP', category: 'BSE/NSE 500', price: 2221.9, change: -0.54 },
  { symbol: 'PARADEEP', category: 'BSE/NSE 500', price: 127.65, change: 1.28 },
  { symbol: 'ENGINERSIN', category: 'BSE/NSE 500', price: 237.75, change: 0.03 },
  { symbol: 'JUBLFOOD', category: 'BSE/NSE 500', price: 425.15, change: -1.2 },
  { symbol: 'CHOICEIN', category: 'BSE/NSE 500', price: 662, change: -1.39 },
  { symbol: 'SUNDARMFIN', category: 'BSE/NSE 500', price: 4106, change: 0.07 },
  { symbol: 'SHREECEM', category: 'BSE/NSE 500', price: 24110, change: -1.53 },
  { symbol: 'ITCHOTELS', category: 'BSE/NSE 500', price: 153.5, change: -1.18 },
  { symbol: 'IKS', category: 'BSE/NSE 500', price: 1675, change: -0.93 },
  { symbol: 'JSWINFRA', category: 'BSE/NSE 500', price: 277.55, change: 1.74 },
  { symbol: 'NUVAMA', category: 'BSE/NSE 500', price: 1574, change: 0.47 },
  { symbol: 'NSLNISP', category: 'BSE/NSE 500', price: 49.91, change: -1.6 },
  { symbol: 'BAJAJHFL', category: 'BSE/NSE 500', price: 84.05, change: 0.76 },
  { symbol: 'MOTILALOFS', category: 'BSE/NSE 500', price: 854.3, change: -0.8 },
  { symbol: 'SBICARD', category: 'BSE/NSE 500', price: 590, change: 0.08 },
  { symbol: 'MFSL', category: 'BSE/NSE 500', price: 1602.3, change: 1.32 },
  { symbol: 'DELHIVERY', category: 'BSE/NSE 500', price: 444.15, change: 1.32 },
  { symbol: 'LTTS', category: 'BSE/NSE 500', price: 3210, change: -1.9 },
  { symbol: 'JSL', category: 'BSE/NSE 500', price: 690, change: -0.97 },
  { symbol: 'GRAPHITE', category: 'BSE/NSE 500', price: 704.85, change: -1.49 },
  { symbol: 'NAVINFLUOR', category: 'BSE/NSE 500', price: 7035, change: -0.78 },
  { symbol: 'LGEINDIA', category: 'BSE/NSE 500', price: 1500, change: -0.66 },
  { symbol: 'NYKAA', category: 'BSE/NSE 500', price: 262, change: -2.07 },
  { symbol: 'SUPREMEIND', category: 'BSE/NSE 500', price: 3598.8, change: -1.21 },
  { symbol: 'KIRLOSENG', category: 'BSE/NSE 500', price: 1911.4, change: -1.97 },
  { symbol: 'GRANULES', category: 'BSE/NSE 500', price: 785.3, change: -0.76 },
  { symbol: 'ELECON', category: 'Top Gainers', price: 530, change: 4.7 },
  { symbol: 'TRITURBINE', category: 'BSE/NSE 500', price: 689.15, change: -0.61 },
  { symbol: 'CYIENT', category: 'BSE/NSE 500', price: 878, change: -1.62 },
  { symbol: 'FIVESTAR', category: 'BSE/NSE 500', price: 435.95, change: 0.32 },
  { symbol: 'NH', category: 'BSE/NSE 500', price: 1970, change: 1.07 },
  { symbol: 'EIDPARRY', category: 'BSE/NSE 500', price: 740, change: -1.5 },
  { symbol: 'DALBHARAT', category: 'BSE/NSE 500', price: 1687.9, change: -2.17 },
  { symbol: 'SRF', category: 'BSE/NSE 500', price: 2702.1, change: -0.9 },
  { symbol: 'BALKRISIND', category: 'Top Losers', price: 2140.9, change: -2.33 },
  { symbol: 'LATENTVIEW', category: 'Top Gainers', price: 314, change: 2.58 },
  { symbol: 'JBCHEPHARM', category: 'BSE/NSE 500', price: 2175.7, change: 1.97 },
  { symbol: 'SAGILITY', category: 'BSE/NSE 500', price: 40.05, change: -0.17 },
  { symbol: 'ARE&M', category: 'BSE/NSE 500', price: 852, change: -0.86 },
  { symbol: 'OBEROIRLTY', category: 'BSE/NSE 500', price: 1637, change: 0.31 },
  { symbol: 'IPCALAB', category: 'BSE/NSE 500', price: 1647, change: 2.04 },
  { symbol: 'KEC', category: 'BSE/NSE 500', price: 497, change: -1.86 },
  { symbol: 'IGL', category: 'BSE/NSE 500', price: 164.19, change: 1.32 },
  { symbol: 'MEDANTA', category: 'BSE/NSE 500', price: 1239.4, change: 0.62 },
  { symbol: 'BELRISE', category: 'BSE/NSE 500', price: 216.5, change: 0.18 },
  { symbol: 'IRCTC', category: 'BSE/NSE 500', price: 528.5, change: 0.19 },
  { symbol: 'MAPMYINDIA', category: 'BSE/NSE 500', price: 852.1, change: 2.44 },
  { symbol: 'MANKIND', category: 'BSE/NSE 500', price: 2332, change: -0.89 },
  { symbol: 'POLYMED', category: 'BSE/NSE 500', price: 1420, change: 1.07 },
  { symbol: 'FSL', category: 'BSE/NSE 500', price: 268, change: 0.9 },
  { symbol: 'URBANCO', category: 'BSE/NSE 500', price: 125.95, change: 2.1 },
  { symbol: 'LALPATHLAB', category: 'BSE/NSE 500', price: 1533, change: -1.81 },
  { symbol: 'ACE', category: 'Top Gainers', price: 899.5, change: 3.5 },
  { symbol: 'COLPAL', category: 'BSE/NSE 500', price: 2001.6, change: -0.14 },
  { symbol: 'INTELLECT', category: 'BSE/NSE 500', price: 743, change: 1.38 },
  { symbol: 'CRAFTSMAN', category: 'BSE/NSE 500', price: 9045, change: -1.41 },
  { symbol: 'CESC', category: 'BSE/NSE 500', price: 179.3, change: 0.84 },
  { symbol: 'TORNTPOWER', category: 'BSE/NSE 500', price: 1461.8, change: 1.51 },
  { symbol: 'J&KBANK', category: 'BSE/NSE 500', price: 147.8, change: 0.08 },
  { symbol: 'TECHNOE', category: 'BSE/NSE 500', price: 1019.9, change: 0.88 },
  { symbol: 'UNITDSPR', category: 'BSE/NSE 500', price: 1247.1, change: -0.21 },
  { symbol: 'JMFINANCIL', category: 'BSE/NSE 500', price: 121.29, change: 0.08 },
  { symbol: 'MMTC', category: 'BSE/NSE 500', price: 68, change: -0.45 },
  { symbol: 'MGL', category: 'BSE/NSE 500', price: 1090, change: 1.45 },
  { symbol: 'BSOFT', category: 'BSE/NSE 500', price: 327, change: 0.58 },
  { symbol: 'SCHAEFFLER', category: 'BSE/NSE 500', price: 4052.1, change: 1.37 },
  { symbol: 'CARBORUNIV', category: 'BSE/NSE 500', price: 1047, change: 1.79 },
  { symbol: 'CUB', category: 'BSE/NSE 500', price: 243.8, change: -0.95 },
  { symbol: 'JKCEMENT', category: 'BSE/NSE 500', price: 4937, change: 0.35 },
  { symbol: 'AJANTPHARM', category: 'BSE/NSE 500', price: 2980.1, change: 1.1 },
  { symbol: 'GPIL', category: 'BSE/NSE 500', price: 280.3, change: -1.99 },
  { symbol: 'TATACHEM', category: 'BSE/NSE 500', price: 718, change: -0.35 },
  { symbol: 'ESCORTS', category: 'BSE/NSE 500', price: 2769.5, change: 0.67 },
  { symbol: 'IGIL', category: 'Top Gainers', price: 372.95, change: 3.02 },
  { symbol: 'HONASA', category: 'BSE/NSE 500', price: 415.95, change: -0.26 },
  { symbol: 'MINDACORP', category: 'BSE/NSE 500', price: 646.5, change: 0.19 },
  { symbol: 'MSUMI', category: 'BSE/NSE 500', price: 38.68, change: 0.99 },
  { symbol: 'TIMKEN', category: 'BSE/NSE 500', price: 3638.1, change: 1.87 },
  { symbol: 'AARTIIND', category: 'BSE/NSE 500', price: 459.25, change: -0.18 },
  { symbol: 'TENNIND', category: 'BSE/NSE 500', price: 590.9, change: 1.57 },
  { symbol: 'ANURAS', category: 'BSE/NSE 500', price: 1320, change: -2.09 },
  { symbol: 'PPLPHARMA', category: 'BSE/NSE 500', price: 166.52, change: -1.8 },
  { symbol: 'BALRAMCHIN', category: 'BSE/NSE 500', price: 532.3, change: 0.02 },
  { symbol: 'JKTYRE', category: 'BSE/NSE 500', price: 381.8, change: -0.97 },
  { symbol: 'SAPPHIRE', category: 'BSE/NSE 500', price: 177.04, change: -2.12 },
  { symbol: 'USHAMART', category: 'BSE/NSE 500', price: 511.5, change: -1.6 },
  { symbol: 'BLS', category: 'BSE/NSE 500', price: 261, change: -0.89 },
  { symbol: 'PIIND', category: 'BSE/NSE 500', price: 2730, change: 0.83 },
  { symbol: 'HEG', category: 'BSE/NSE 500', price: 538.25, change: -1.17 },
  { symbol: 'LEMONTREE', category: 'BSE/NSE 500', price: 109.9, change: -1.04 },
  { symbol: 'GILLETTE', category: 'BSE/NSE 500', price: 7761, change: 0.71 },
  { symbol: 'ONESOURCE', category: 'Top Losers', price: 1790, change: -2.61 },
  { symbol: 'HUDCO', category: 'BSE/NSE 500', price: 205.49, change: 0.4 },
  { symbol: 'CHAMBLFERT', category: 'BSE/NSE 500', price: 467.95, change: 1.13 },
  { symbol: 'AFFLE', category: 'BSE/NSE 500', price: 1470.9, change: -0.76 },
  { symbol: 'ECLERX', category: 'BSE/NSE 500', price: 1388, change: -1.39 },
  { symbol: 'PCBL', category: 'BSE/NSE 500', price: 289.5, change: -1.21 },
  { symbol: 'CONCORDBIO', category: 'BSE/NSE 500', price: 1224.5, change: -1.11 },
  { symbol: 'BEML', category: 'BSE/NSE 500', price: 1741.5, change: 0.39 },
  { symbol: 'KPIL', category: 'BSE/NSE 500', price: 1289.9, change: -0.1 },
  { symbol: 'CHOLAHLDNG', category: 'BSE/NSE 500', price: 1445, change: -0.17 },
  { symbol: 'SOBHA', category: 'BSE/NSE 500', price: 1334, change: -0.43 },
  { symbol: 'ITI', category: 'BSE/NSE 500', price: 301.4, change: -0.13 },
  { symbol: 'SUNTV', category: 'BSE/NSE 500', price: 515.65, change: 0.73 },
  { symbol: 'ELGIEQUIP', category: 'BSE/NSE 500', price: 608.45, change: -2.2 },
  { symbol: 'IRCON', category: 'BSE/NSE 500', price: 136.74, change: 0.63 },
  { symbol: 'BRIGADE', category: 'BSE/NSE 500', price: 650.75, change: 0.22 },
  { symbol: 'AWL', category: 'BSE/NSE 500', price: 188.89, change: -0.2 },
  { symbol: 'AAVAS', category: 'BSE/NSE 500', price: 1295, change: -0.42 },
  { symbol: 'NEULANDLAB', category: 'BSE/NSE 500', price: 16875, change: 0.09 },
  { symbol: 'ZENSARTECH', category: 'BSE/NSE 500', price: 484, change: 0.51 },
  { symbol: 'VTL', category: 'BSE/NSE 500', price: 634.5, change: 0.46 },
  { symbol: 'CHALET', category: 'BSE/NSE 500', price: 777.05, change: 0.3 },
  { symbol: 'ERIS', category: 'BSE/NSE 500', price: 1359.7, change: -0.56 },
  { symbol: 'JWL', category: 'BSE/NSE 500', price: 278.45, change: -0.5 },
  { symbol: 'ABFRL', category: 'BSE/NSE 500', price: 60.24, change: -1.29 },
  { symbol: 'KPRMILL', category: 'BSE/NSE 500', price: 1083, change: -1.83 },
  { symbol: 'EMCURE', category: 'BSE/NSE 500', price: 1760, change: 0.85 },
  { symbol: 'CREDITACC', category: 'BSE/NSE 500', price: 1261.1, change: -1 },
  { symbol: 'HOMEFIRST', category: 'BSE/NSE 500', price: 1080, change: 1.97 },
  { symbol: 'GRAVITA', category: 'BSE/NSE 500', price: 1630, change: -0.59 },
  { symbol: 'ANTHEM', category: 'BSE/NSE 500', price: 762, change: 2.21 },
  { symbol: 'PVRINOX', category: 'BSE/NSE 500', price: 977, change: 0.07 },
  { symbol: 'NCC', category: 'BSE/NSE 500', price: 146.12, change: -0.55 },
  { symbol: 'RAILTEL', category: 'BSE/NSE 500', price: 313, change: -0.43 },
  { symbol: 'STARHEALTH', category: 'BSE/NSE 500', price: 526.1, change: -0.03 },
  { symbol: 'SJVN', category: 'BSE/NSE 500', price: 73.7, change: -0.04 },
  { symbol: 'ABSLAMC', category: 'BSE/NSE 500', price: 1045.5, change: 1.09 },
  { symbol: 'NTPCGREEN', category: 'BSE/NSE 500', price: 100.84, change: 0 },
  { symbol: 'SIGNATURE', category: 'BSE/NSE 500', price: 819, change: 0.83 },
  { symbol: 'APTUS', category: 'BSE/NSE 500', price: 265, change: 0.78 },
  { symbol: 'ABDL', category: 'BSE/NSE 500', price: 583.8, change: 2.09 },
  { symbol: 'ASTERDM', category: 'BSE/NSE 500', price: 755.85, change: 2.41 },
  { symbol: 'CAPLIPOINT', category: 'BSE/NSE 500', price: 2036, change: 0.81 },
  { symbol: 'AADHARHFC', category: 'BSE/NSE 500', price: 465.7, change: -0.89 },
  { symbol: 'GABRIEL', category: 'BSE/NSE 500', price: 1002, change: -1.28 },
  { symbol: 'HDBFS', category: 'BSE/NSE 500', price: 641, change: -0.54 },
  { symbol: 'NAVA', category: 'BSE/NSE 500', price: 601, change: -0.34 },
  { symbol: 'IOB', category: 'BSE/NSE 500', price: 32.94, change: 0.06 },
  { symbol: 'EMAMILTD', category: 'BSE/NSE 500', price: 385.4, change: -1.36 },
  { symbol: 'IRB', category: 'BSE/NSE 500', price: 21.23, change: -0.33 },
  { symbol: 'DEEPAKFERT', category: 'BSE/NSE 500', price: 1425, change: 0.31 },
  { symbol: 'CCL', category: 'BSE/NSE 500', price: 1080, change: 1.15 },
  { symbol: 'SWANCORP', category: 'BSE/NSE 500', price: 312, change: -1.31 },
  { symbol: 'APOLLOTYRE', category: 'BSE/NSE 500', price: 396.05, change: 0.08 },
  { symbol: 'SONATSOFTW', category: 'BSE/NSE 500', price: 264.5, change: -0.11 },
  { symbol: 'HONAUT', category: 'BSE/NSE 500', price: 34710, change: 0.65 },
  { symbol: 'JSWCEMENT', category: 'BSE/NSE 500', price: 127, change: -0.08 },
  { symbol: 'CEATLTD', category: 'BSE/NSE 500', price: 3189, change: -1.28 },
  { symbol: 'ABREL', category: 'BSE/NSE 500', price: 1239.5, change: -0.92 },
  { symbol: 'TATAINVEST', category: 'BSE/NSE 500', price: 670.75, change: 0.62 },
  { symbol: 'TEGA', category: 'BSE/NSE 500', price: 1846.9, change: -1.35 },
  { symbol: 'AIIL', category: 'Top Gainers', price: 464, change: 2.81 },
  { symbol: 'BIKAJI', category: 'BSE/NSE 500', price: 654.8, change: 1.43 },
  { symbol: 'ZFCVINDIA', category: 'BSE/NSE 500', price: 14450, change: -0.93 },
  { symbol: 'CASTROLIND', category: 'BSE/NSE 500', price: 183.7, change: -0.01 },
  { symbol: 'FLUOROCHEM', category: 'BSE/NSE 500', price: 3568, change: -0.73 },
  { symbol: 'CANFINHOME', category: 'BSE/NSE 500', price: 809, change: -0.92 },
  { symbol: 'RHIM', category: 'BSE/NSE 500', price: 397, change: -1.03 },
  { symbol: 'INDGN', category: 'BSE/NSE 500', price: 523, change: 0.96 },
  { symbol: 'PFIZER', category: 'BSE/NSE 500', price: 4460, change: 0.85 },
  { symbol: 'SYNGENE', category: 'BSE/NSE 500', price: 434, change: -0.36 },
  { symbol: 'ZYDUSWELL', category: 'BSE/NSE 500', price: 503, change: 0.31 },
  { symbol: 'UCOBANK', category: 'BSE/NSE 500', price: 25.3, change: 0.92 },
  { symbol: 'BLUEJET', category: 'Top Losers', price: 464.5, change: -2.33 },
  { symbol: 'LTFOODS', category: 'BSE/NSE 500', price: 384.6, change: -0.19 },
  { symbol: 'LINDEINDIA', category: 'BSE/NSE 500', price: 7050, change: -0.27 },
  { symbol: 'CLEAN', category: 'BSE/NSE 500', price: 790, change: 0.16 },
  { symbol: 'ENDURANCE', category: 'BSE/NSE 500', price: 2551, change: -0.83 },
  { symbol: 'HEXT', category: 'BSE/NSE 500', price: 525.7, change: -0.56 },
  { symbol: 'CIEINDIA', category: 'BSE/NSE 500', price: 453, change: -0.64 },
  { symbol: 'GICRE', category: 'BSE/NSE 500', price: 393, change: 1.25 },
  { symbol: 'CRISIL', category: 'BSE/NSE 500', price: 3875, change: -0.74 },
  { symbol: 'RAMCOCEM', category: 'BSE/NSE 500', price: 877.25, change: -0.02 },
  { symbol: 'BAYERCROP', category: 'BSE/NSE 500', price: 4360, change: -1.06 },
  { symbol: 'BBTC', category: 'Top Gainers', price: 1529.9, change: 2.69 },
  { symbol: 'RAINBOW', category: 'BSE/NSE 500', price: 1345, change: -0.15 },
  { symbol: 'DOMS', category: 'BSE/NSE 500', price: 2095.8, change: -1.24 },
  { symbol: 'DEEPAKNTR', category: 'BSE/NSE 500', price: 1680.9, change: 0.25 },
  { symbol: 'DEVYANI', category: 'BSE/NSE 500', price: 113.47, change: -0.05 },
  { symbol: 'TRIDENT', category: 'BSE/NSE 500', price: 24.41, change: 0.33 },
  { symbol: 'ABBOTINDIA', category: 'BSE/NSE 500', price: 26000, change: 0.7 },
  { symbol: 'WHIRLPOOL', category: 'BSE/NSE 500', price: 799, change: -1.19 },
  { symbol: 'WELSPUNLIV', category: 'BSE/NSE 500', price: 143.79, change: -0.34 },
  { symbol: 'BHARTIHEXA', category: 'BSE/NSE 500', price: 1475, change: -0.96 },
  { symbol: 'FACT', category: 'BSE/NSE 500', price: 869.8, change: 0.5 },
  { symbol: 'BERGEPAINT', category: 'BSE/NSE 500', price: 492, change: -0.46 },
  { symbol: 'KAJARIACER', category: 'BSE/NSE 500', price: 1087, change: -0.75 },
  { symbol: 'UBL', category: 'BSE/NSE 500', price: 1325, change: -1.9 },
  { symbol: 'RKFORGE', category: 'BSE/NSE 500', price: 555.35, change: -1.3 },
  { symbol: 'NIVABUPA', category: 'BSE/NSE 500', price: 82.68, change: 1.14 },
  { symbol: 'JUBLINGREA', category: 'BSE/NSE 500', price: 627, change: 0.82 },
  { symbol: '3MINDIA', category: 'BSE/NSE 500', price: 32010, change: -0.87 },
  { symbol: 'AFCONS', category: 'BSE/NSE 500', price: 320, change: -1.93 },
  { symbol: 'NIACL', category: 'BSE/NSE 500', price: 151, change: -0.45 },
  { symbol: 'NUVOCO', category: 'BSE/NSE 500', price: 319.75, change: -0.84 },
  { symbol: 'ATUL', category: 'BSE/NSE 500', price: 6671.5, change: -1 },
  { symbol: 'JUBLPHARMA', category: 'BSE/NSE 500', price: 975, change: 0.44 },
  { symbol: 'GODREJIND', category: 'BSE/NSE 500', price: 1044.2, change: -0.3 },
  { symbol: 'GLAXO', category: 'BSE/NSE 500', price: 2165, change: -0.07 },
  { symbol: 'AEGISVOPAK', category: 'BSE/NSE 500', price: 189.1, change: -1.27 },
  { symbol: 'SBFC', category: 'BSE/NSE 500', price: 93, change: -0.35 },
  { symbol: 'ASAHIINDIA', category: 'BSE/NSE 500', price: 904, change: 1.41 },
  { symbol: 'SPLPETRO', category: 'BSE/NSE 500', price: 699.95, change: -0.5 },
  { symbol: 'INDIAMART', category: 'BSE/NSE 500', price: 1997, change: 0.14 },
  { symbol: 'DCMSHRIRAM', category: 'BSE/NSE 500', price: 1022, change: 0.04 },
  { symbol: 'BATAINDIA', category: 'BSE/NSE 500', price: 663.6, change: 0.92 },
  { symbol: 'INDIACEM', category: 'BSE/NSE 500', price: 381, change: 0.13 },
  { symbol: 'TRAVELFOOD', category: 'BSE/NSE 500', price: 1282.1, change: -0.31 },
  { symbol: 'UTIAMC', category: 'BSE/NSE 500', price: 930, change: 0.08 },
  { symbol: 'SUMICHEM', category: 'BSE/NSE 500', price: 475, change: 0.4 },
  { symbol: 'BLUEDART', category: 'BSE/NSE 500', price: 4700, change: -0.42 },
  { symbol: 'THELEELA', category: 'BSE/NSE 500', price: 419.85, change: 0.47 },
  { symbol: 'TBOTEK', category: 'BSE/NSE 500', price: 1226.9, change: 0.43 },
  { symbol: 'EIHOTEL', category: 'BSE/NSE 500', price: 293, change: 0.45 },
  { symbol: 'JSWDULUX', category: 'BSE/NSE 500', price: 3105, change: 0.87 },
  { symbol: 'GALLANTT', category: 'BSE/NSE 500', price: 647, change: -0.16 },
  { symbol: 'CANHLIFE', category: 'BSE/NSE 500', price: 137.5, change: 0.34 }
];

/* ============== Data Sources & APIs ============== */
(function initDataSources(){
  const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./,''); } catch(e){ return ''; } };

  const items = [
    // free
    {cat:'free', name:'NSE India', desc:'Official exchange data, index constituents, P/E, P/B', url:'https://www.nseindia.com'},
    {cat:'free', name:'BSE India', desc:'Quarterly results, annual reports, shareholding patterns', url:'https://www.bseindia.com'},
    {cat:'free', name:'Screener.in', desc:'10 years of P&L, balance sheet, cash flow — free export', url:'https://www.screener.in'},
    {cat:'free', name:'Tickertape', desc:'Fundamental scores, 200+ filter screener', url:'https://www.tickertape.in'},
    {cat:'free', name:'Trendlyne', desc:'DVM scores, promoter pledging, analyst consensus', url:'https://www.trendlyne.com'},
    {cat:'free', name:'Moneycontrol', desc:'Peer comparisons, broker research, news sentiment', url:'https://www.moneycontrol.com'},
    {cat:'free', name:'Groww', desc:'Retail-friendly fundamentals, MF data', url:'https://www.groww.in'},
    {cat:'free', name:'Tijori Finance', desc:'Detailed segment-level financials, NSE/BSE', url:'https://www.tijorifinance.com'},
    {cat:'free', name:'StockAnalysis.in', desc:'Free fundamental screener, export-ready', url:'https://stockanalysis.in/stocks'},
    // broker
    {cat:'broker', name:'Zerodha Kite Connect', desc:'REST + WebSocket, real-time quotes, order execution', url:'https://kite.trade'},
    {cat:'broker', name:'Kite Developer Docs', desc:'Full API documentation v3', url:'https://kite.trade/docs/connect/v3'},
    {cat:'broker', name:'Kite Developer Portal', desc:'Create your app, get API keys', url:'https://developers.kite.trade'},
    {cat:'broker', name:'Angel One SmartAPI', desc:'Free API, NSE/BSE real-time + historical', url:'https://smartapi.angelbroking.com'},
    {cat:'broker', name:'Upstox API', desc:'Alternative broker API, good WebSocket support', url:'https://upstox.com/developer/api-documentation'},
    // paid
    {cat:'paid', name:'Trendlyne API', desc:'Fundamentals, forecasts, DVM scores (~₹2000/mo)', url:'https://trendlyne.com/developers/api'},
    {cat:'paid', name:'Wisesheets', desc:'Fundamentals in Excel/Google Sheets (~$10/mo)', url:'https://www.wisesheets.io'},
    {cat:'paid', name:'Wisesheets Database API', desc:'API-ready fundamentals for screeners & apps', url:'https://www.wisesheets.io/database'},
    {cat:'paid', name:'Refinitiv (LSEG) Eikon', desc:'Institutional-grade, full financials globally', url:'https://www.refinitiv.com/en/products/eikon-trading-software'},
    {cat:'paid', name:'Bloomberg Terminal', desc:'Gold standard, university terminals free', url:'https://professional.bloomberg.com/products/bloomberg-terminal'},
    {cat:'paid', name:'Global Datafeeds', desc:'Authorized NSE/BSE real-time API vendor', url:'https://globaldatafeeds.in/apis'},
    {cat:'paid', name:'TrueData', desc:'Low-latency NSE/BSE market data API', url:'https://www.truedata.in/products/marketdataapi'},
    // oss
    {cat:'oss', name:'NSEpy (PyPI)', desc:'Python library for NSE historical data', url:'https://pypi.org/project/nsetools'},
    {cat:'oss', name:'PNSEA (PyPI)', desc:'Python NSE API — options, insider trades, equity', url:'https://pypi.org/project/pnsea'},
    {cat:'oss', name:'stock-nse-india', desc:'GraphQL/REST API server for NSE data', url:'https://github.com/hi-imcodeman/stock-nse-india'},
    {cat:'oss', name:'jugaad-trader', desc:'Unofficial NSE/BSE data scraper, Python', url:'https://github.com/jugaad-py/jugaad-trader'},
    // overlay
    {cat:'overlay', name:'SEC EDGAR (13-F)', desc:'Institutional holdings data for mimicry layer', url:'https://efts.sec.gov/LATEST/search-index?q=%2213F%22&dateRange=custom'},
    {cat:'overlay', name:'BSE Corporate Filings', desc:'Indian institutional disclosure equivalent', url:'https://www.bseindia.com/corporates/ann.html'},
    {cat:'overlay', name:'NSE Bulk/Block Deals', desc:'Tracks large institutional trade activity', url:'https://www.nseindia.com/market-data/bulk-deal'},
    {cat:'overlay', name:'Finviz (global macro)', desc:'Global sector heatmaps, thematic filters', url:'https://finviz.com/screener.ashx'},
    {cat:'overlay', name:'Pulse by Zerodha', desc:'News sentiment for Indian markets', url:'https://pulse.zerodha.com'}
  ];

  function cardHtml(it) {
    return `<a class="ds-card" href="${it.url}" target="_blank" rel="noopener noreferrer" data-cat="${it.cat}">
      <div class="ds-name">${it.name}</div>
      <div class="ds-desc">${it.desc}</div>
      <div class="ds-host">${hostOf(it.url)}</div>
    </a>`;
  }

  // initial render into per-category grids
  const grids = { free: document.getElementById('ds-free'), broker: document.getElementById('ds-broker'), paid: document.getElementById('ds-paid'), oss: document.getElementById('ds-oss'), overlay: document.getElementById('ds-overlay') };
  Object.entries(grids).forEach(([cat, el]) => {
    if (!el) return;
    el.innerHTML = items.filter(i => i.cat === cat).map(cardHtml).join('');
  });

  // state
  let activeCat = 'all';
  let query = '';

  function applyFilter() {
    const q = query.toLowerCase().trim();
    let visible = 0;
    Object.entries(grids).forEach(([cat, el]) => {
      if (!el) return;
      const cards = el.querySelectorAll('.ds-card');
      let sectionVisible = 0;
      cards.forEach(card => {
        const name = card.querySelector('.ds-name').textContent.toLowerCase();
        const desc = card.querySelector('.ds-desc').textContent.toLowerCase();
        const host = card.querySelector('.ds-host').textContent.toLowerCase();
        const matchText = !q || name.includes(q) || desc.includes(q) || host.includes(q);
        const matchCat = activeCat === 'all' || activeCat === cat;
        const show = matchText && matchCat;
        card.classList.toggle('hidden', !show);
        if (show) sectionVisible++;
      });
      visible += sectionVisible;
      // show/hide entire section card
      const section = el.closest('.ds-section');
      if (section) section.classList.toggle('hidden', sectionVisible === 0);
    });
    document.getElementById('ds-count').textContent = visible + ' source' + (visible !== 1 ? 's' : '');
  }

  // pills
  document.getElementById('ds-pills').addEventListener('click', (e) => {
    const pill = e.target.closest('.ds-pill');
    if (!pill) return;
    document.querySelectorAll('#ds-pills .ds-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    activeCat = pill.dataset.cat;
    applyFilter();
  });

  // search
  const searchInput = document.getElementById('ds-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      query = e.target.value;
      applyFilter();
    });
  }

  // initial count
  applyFilter();
})();
