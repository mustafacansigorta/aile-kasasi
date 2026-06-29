function round(value, digit = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return Number(value.toFixed(digit));
}

function calculateEMA(candles, period) {
  if (!candles.length) return null;

  const k = 2 / (period + 1);
  let ema = candles[0].close;

  for (let i = 1; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k);
  }

  return ema;
}

function calculateVWAP(candles) {
  let totalPV = 0;
  let totalVolume = 0;

  for (const c of candles) {
    const typicalPrice = (c.high + c.low + c.close) / 3;
    totalPV += typicalPrice * c.volume;
    totalVolume += c.volume;
  }

  if (!totalVolume) return null;
  return totalPV / totalVolume;
}

function calculateATR(candles, period = 14) {
  if (candles.length < period + 1) return null;

  const trs = [];

  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const previous = candles[i - 1];

    trs.push(
      Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close)
      )
    );
  }

  const lastTRs = trs.slice(-period);
  return lastTRs.reduce((sum, v) => sum + v, 0) / lastTRs.length;
}

function calculateMomentum(candles, minutes) {
  if (candles.length <= minutes) return null;

  const last = candles[candles.length - 1];
  const previous = candles[candles.length - 1 - minutes];

  if (!previous || !previous.close) return null;

  return ((last.close - previous.close) / previous.close) * 100;
}

function calculateRVOL(candles, period = 20) {
  if (candles.length < period + 1) return null;

  const last = candles[candles.length - 1];
  const previousCandles = candles.slice(-(period + 1), -1);

  const avgVolume =
    previousCandles.reduce((sum, c) => sum + c.volume, 0) /
    previousCandles.length;

  if (!avgVolume) return null;

  return last.volume / avgVolume;
}

function findSupportResistance(candles, lookback = 20) {
  const recent = candles.slice(-lookback);

  return {
    support: Math.min(...recent.map((c) => c.low)),
    resistance: Math.max(...recent.map((c) => c.high)),
  };
}

function findLastSwingHigh(candles, lookback = 20) {
  const recent = candles.slice(-lookback);
  if (!recent.length) return null;

  const highest = recent.reduce((max, c) => (c.high > max.high ? c : max), recent[0]);

  return {
    price: round(highest.high),
    time: highest.time,
  };
}

function findLastSwingLow(candles, lookback = 20) {
  const recent = candles.slice(-lookback);
  if (!recent.length) return null;

  const lowest = recent.reduce((min, c) => (c.low < min.low ? c : min), recent[0]);

  return {
    price: round(lowest.low),
    time: lowest.time,
  };
}

function calculateOpeningRange(candles, minutes = 30) {
  const firstCandles = candles.slice(0, minutes);

  if (!firstCandles.length) {
    return {
      high: null,
      low: null,
    };
  }

  return {
    high: round(Math.max(...firstCandles.map((c) => c.high))),
    low: round(Math.min(...firstCandles.map((c) => c.low))),
  };
}

export function analyzeCandles(candles) {
  if (!candles || candles.length < 50) {
    return {
      success: false,
      message: "Yeterli mum verisi yok.",
    };
  }

  const last = candles[candles.length - 1];

  const dayHigh = Math.max(...candles.map((c) => c.high));
  const dayLow = Math.min(...candles.map((c) => c.low));
  const firstOpen = candles[0].open;

  const dayChange = ((last.close - firstOpen) / firstOpen) * 100;

  const vwap = calculateVWAP(candles);
  const rvol = calculateRVOL(candles);

  const ema9 = calculateEMA(candles, 9);
  const ema21 = calculateEMA(candles, 21);
  const ema50 = calculateEMA(candles, 50);

  const atr = calculateATR(candles);

  const momentum5 = calculateMomentum(candles, 5);
  const momentum15 = calculateMomentum(candles, 15);

  const isAboveVWAP = vwap ? last.close > vwap : false;
  const isNearHigh = ((dayHigh - last.close) / dayHigh) * 100;

  const sr = findSupportResistance(candles);
  const openingRange = calculateOpeningRange(candles);

  return {
    success: true,
    lastPrice: round(last.close),
    dayHigh: round(dayHigh),
    dayLow: round(dayLow),
    dayChange: round(dayChange),
    vwap: round(vwap),
    rvol: round(rvol),
    ema9: round(ema9),
    ema21: round(ema21),
    ema50: round(ema50),
    atr: round(atr),
    momentum5: round(momentum5),
    momentum15: round(momentum15),
    isAboveVWAP,
    isNearHigh: round(isNearHigh),
    support: round(sr.support),
    resistance: round(sr.resistance),
    lastSwingHigh: findLastSwingHigh(candles),
    lastSwingLow: findLastSwingLow(candles),
    openingRange,
  };
}