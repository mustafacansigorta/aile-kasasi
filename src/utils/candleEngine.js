export function calculateVWAP(candles = []) {
  let cumulativePV = 0;
  let cumulativeVolume = 0;

  return candles.map((candle) => {
    const typicalPrice =
      ((candle.high || 0) + (candle.low || 0) + (candle.close || 0)) / 3;

    const volume = candle.volume || 0;

    cumulativePV += typicalPrice * volume;
    cumulativeVolume += volume;

    return {
      ...candle,
      vwap: cumulativeVolume > 0 ? cumulativePV / cumulativeVolume : null,
    };
  });
}

export function calculateEMA(values = [], period = 9) {
  if (!values.length) return [];

  const multiplier = 2 / (period + 1);
  const ema = [];

  values.forEach((value, index) => {
    if (index === 0) {
      ema.push(value);
    } else {
      ema.push(value * multiplier + ema[index - 1] * (1 - multiplier));
    }
  });

  return ema;
}

export function calculateATR(candles = [], period = 14) {
  const trueRanges = candles.map((candle, index) => {
    if (index === 0) {
      return (candle.high || 0) - (candle.low || 0);
    }

    const prevClose = candles[index - 1].close || 0;

    return Math.max(
      (candle.high || 0) - (candle.low || 0),
      Math.abs((candle.high || 0) - prevClose),
      Math.abs((candle.low || 0) - prevClose)
    );
  });

  return calculateEMA(trueRanges, period);
}

export function calculateRVOL(candles = [], lookback = 20) {
  return candles.map((candle, index) => {
    const start = Math.max(0, index - lookback);
    const previous = candles.slice(start, index);

    const avgVolume =
      previous.length > 0
        ? previous.reduce((sum, c) => sum + (c.volume || 0), 0) /
          previous.length
        : 0;

    return {
      ...candle,
      rvol: avgVolume > 0 ? (candle.volume || 0) / avgVolume : null,
    };
  });
}

export function analyzeCandles(candles = []) {
  if (!candles.length) {
    const swings = findSwingLevels(candles);
const supportResistance = findSupportResistance(candles);
const openingRange = calculateOpeningRange(candles, 15);
    return {
      success: false,
      error: "Mum verisi yok.",
      support: supportResistance.support,
resistance: supportResistance.resistance,
lastSwingHigh: swings.lastSwingHigh,
lastSwingLow: swings.lastSwingLow,
openingRange,
    };
  }

  const withVWAP = calculateVWAP(candles);
  const withRVOL = calculateRVOL(withVWAP);

  const closes = candles.map((c) => c.close || 0);

  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const ema50 = calculateEMA(closes, 50);
  const atr = calculateATR(candles, 14);

  const lastIndex = candles.length - 1;
  const last = withRVOL[lastIndex];

  const dayHigh = Math.max(...candles.map((c) => c.high || 0));
  const dayLow = Math.min(...candles.map((c) => c.low || Infinity));

  const first = candles[0];
  const lastClose = last.close || 0;

  const dayChange =
    first.open > 0 ? Number((((lastClose - first.open) / first.open) * 100).toFixed(2)) : null;

  const momentum5 =
    candles.length >= 5
      ? Number(
          (((lastClose - candles[candles.length - 5].close) /
            candles[candles.length - 5].close) *
            100).toFixed(2)
        )
      : null;

  const momentum15 =
    candles.length >= 15
      ? Number(
          (((lastClose - candles[candles.length - 15].close) /
            candles[candles.length - 15].close) *
            100).toFixed(2)
        )
      : null;

  return {
    success: true,
    lastPrice: lastClose,
    dayHigh,
    dayLow,
    dayChange,
    vwap: last.vwap ? Number(last.vwap.toFixed(2)) : null,
    rvol: last.rvol ? Number(last.rvol.toFixed(2)) : null,
    ema9: ema9[lastIndex] ? Number(ema9[lastIndex].toFixed(2)) : null,
    ema21: ema21[lastIndex] ? Number(ema21[lastIndex].toFixed(2)) : null,
    ema50: ema50[lastIndex] ? Number(ema50[lastIndex].toFixed(2)) : null,
    atr: atr[lastIndex] ? Number(atr[lastIndex].toFixed(2)) : null,
    momentum5,
    momentum15,
    isAboveVWAP: last.vwap ? lastClose > last.vwap : null,
    isNearHigh:
      dayHigh > 0
        ? Number((((dayHigh - lastClose) / dayHigh) * 100).toFixed(2))
        : null,
  };
}
export function findSwingLevels(candles = [], lookback = 3) {
  const swingHighs = [];
  const swingLows = [];

  for (let i = lookback; i < candles.length - lookback; i++) {
    const current = candles[i];

    const left = candles.slice(i - lookback, i);
    const right = candles.slice(i + 1, i + 1 + lookback);

    const isSwingHigh =
      left.every((c) => current.high >= c.high) &&
      right.every((c) => current.high >= c.high);

    const isSwingLow =
      left.every((c) => current.low <= c.low) &&
      right.every((c) => current.low <= c.low);

    if (isSwingHigh) {
      swingHighs.push({
        price: current.high,
        time: current.time,
      });
    }

    if (isSwingLow) {
      swingLows.push({
        price: current.low,
        time: current.time,
      });
    }
  }

  return {
    swingHighs,
    swingLows,
    lastSwingHigh: swingHighs.at(-1) || null,
    lastSwingLow: swingLows.at(-1) || null,
  };
}

export function findSupportResistance(candles = []) {
  if (!candles.length) {
    return {
      support: null,
      resistance: null,
    };
  }

  const lastPrice = candles[candles.length - 1].close;

  const levels = [];

  candles.forEach((candle) => {
    levels.push(candle.high);
    levels.push(candle.low);
  });

  const roundedLevels = levels
    .filter((level) => typeof level === "number")
    .map((level) => Number(level.toFixed(2)));

  const uniqueLevels = [...new Set(roundedLevels)];

  const supportCandidates = uniqueLevels
    .filter((level) => level < lastPrice)
    .sort((a, b) => b - a);

  const resistanceCandidates = uniqueLevels
    .filter((level) => level > lastPrice)
    .sort((a, b) => a - b);

  return {
    support: supportCandidates[0] || null,
    resistance: resistanceCandidates[0] || null,
  };
}

export function calculateOpeningRange(candles = [], minutes = 15) {
  const openingCandles = candles.slice(0, minutes);

  if (!openingCandles.length) {
    return {
      high: null,
      low: null,
    };
  }

  return {
    high: Math.max(...openingCandles.map((c) => c.high || 0)),
    low: Math.min(...openingCandles.map((c) => c.low || Infinity)),
  };
}