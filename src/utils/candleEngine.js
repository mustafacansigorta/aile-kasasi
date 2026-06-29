import yahooFinance from "yahoo-finance2";

function toYahooSymbol(symbol) {
  return symbol.endsWith(".IS") ? symbol : `${symbol}.IS`;
}

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

  if (totalVolume === 0) return null;
  return totalPV / totalVolume;
}

function calculateATR(candles, period = 14) {
  if (candles.length < period + 1) return null;

  const trs = [];

  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const previous = candles[i - 1];

    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - previous.close),
      Math.abs(current.low - previous.close)
    );

    trs.push(tr);
  }

  const lastTRs = trs.slice(-period);
  const atr = lastTRs.reduce((sum, v) => sum + v, 0) / lastTRs.length;

  return atr;
}

function calculateMomentum(candles, minutes) {
  if (candles.length <= minutes) return null;

  const last = candles[candles.length - 1];
  const previous = candles[candles.length - 1 - minutes];

  if (!previous || previous.close === 0) return null;

  return ((last.close - previous.close) / previous.close) * 100;
}

function calculateRVOL(candles, period = 20) {
  if (candles.length < period + 1) return null;

  const last = candles[candles.length - 1];
  const previousCandles = candles.slice(-(period + 1), -1);

  const avgVolume =
    previousCandles.reduce((sum, c) => sum + c.volume, 0) /
    previousCandles.length;

  if (!avgVolume || avgVolume === 0) return null;

  return last.volume / avgVolume;
}

function analyzeCandles(candles) {
  if (!candles || candles.length < 50) {
    return {
      success: false,
      message: "Yeterli mum verisi yok."
    };
  }

  const last = candles[candles.length - 1];

  const dayHigh = Math.max(...candles.map(c => c.high));
  const dayLow = Math.min(...candles.map(c => c.low));
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
    isNearHigh: round(isNearHigh)
  };
}

function analyzeTradeSetup(analysis) {
  let score = 0;
  const reasons = [];

  const {
    lastPrice,
    dayChange,
    vwap,
    rvol,
    ema9,
    ema21,
    ema50,
    momentum5,
    momentum15,
    isAboveVWAP,
    isNearHigh
  } = analysis;

  const trendBullish = ema9 > ema21 && ema21 > ema50;
  const priceAboveEma9 = lastPrice > ema9;
  const priceAboveEma21 = lastPrice > ema21;

  if (trendBullish) {
    score += 20;
    reasons.push("EMA trend dizilimi pozitif");
  } else {
    reasons.push("EMA trend dizilimi zayıf");
  }

  if (priceAboveEma9) {
    score += 10;
    reasons.push("Fiyat EMA9 üzerinde");
  } else {
    reasons.push("Fiyat EMA9 altında");
  }

  if (priceAboveEma21) {
    score += 10;
    reasons.push("Fiyat EMA21 üzerinde");
  } else {
    reasons.push("Fiyat EMA21 altında");
  }

  if (isAboveVWAP) {
    score += 15;
    reasons.push("VWAP üzerinde");
  } else {
    reasons.push("VWAP altında");
  }

  if (momentum5 !== null && momentum5 > 0) {
    score += 10;
    reasons.push(`5 dk momentum pozitif (%${momentum5})`);
  } else {
    reasons.push(`5 dk momentum negatif (%${momentum5})`);
  }

  if (momentum15 !== null && momentum15 > 0) {
    score += 10;
    reasons.push(`15 dk momentum pozitif (%${momentum15})`);
  } else {
    reasons.push(`15 dk momentum negatif (%${momentum15})`);
  }

  if (dayChange > 1) {
    score += 10;
    reasons.push(`Günlük performans güçlü (%${dayChange})`);
  } else if (dayChange > 0) {
    score += 5;
    reasons.push(`Günlük performans pozitif (%${dayChange})`);
  } else {
    reasons.push(`Günlük performans zayıf (%${dayChange})`);
  }

  if (isNearHigh <= 1) {
    score += 10;
    reasons.push("Gün içi zirveye çok yakın");
  } else if (isNearHigh <= 2.5) {
    score += 5;
    reasons.push("Gün içi zirveye yakın");
  } else {
    reasons.push("Gün içi zirveden uzak");
  }

  if (rvol && rvol >= 2) {
    score += 15;
    reasons.push(`Hacim çok güçlü RVOL ${rvol}`);
  } else if (rvol && rvol >= 1.3) {
    score += 8;
    reasons.push(`Hacim destekli RVOL ${rvol}`);
  } else {
    reasons.push("Hacim zayıf veya hesaplanamadı");
  }

  let risk = "LOW";

  if (!isAboveVWAP || momentum5 < 0 || momentum15 < 0) {
    risk = "HIGH";
  } else if (!priceAboveEma9 || dayChange < 0) {
    risk = "MEDIUM";
  }

  let action = "WAIT";

  if (score >= 80 && risk !== "HIGH") {
    action = "BUY";
  } else if (score >= 60) {
    action = "WATCH";
  } else if (score >= 40) {
    action = "WEAK_WATCH";
  } else {
    action = "AVOID";
  }

  let status = "Zayıf";
  let level = "weak";

  if (score >= 80) {
    status = "Güçlü Alım";
    level = "strong";
  } else if (score >= 60) {
    status = "Takip Edilebilir";
    level = "watch";
  } else if (score >= 40) {
    status = "Zayıf Takip";
    level = "neutral";
  }

  let confidence = 50;

  if (isAboveVWAP) confidence += 10;
  if (trendBullish) confidence += 10;
  if (momentum5 > 0 && momentum15 > 0) confidence += 15;
  if (rvol && rvol > 1.5) confidence += 15;
  if (risk === "HIGH") confidence -= 20;

  confidence = Math.max(0, Math.min(100, confidence));
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    status,
    level,
    action,
    risk,
    confidence,
    trend: trendBullish ? "Bullish" : "Weak",
    shortTerm:
      isAboveVWAP && momentum5 > 0
        ? "Bullish"
        : momentum5 < 0 && momentum15 < 0
        ? "Bearish"
        : "Neutral",
    reasons
  };
}

export async function getCandleAnalysis(symbol) {
  try {
    const yahooSymbol = toYahooSymbol(symbol);

    const queryOptions = {
      period1: new Date(Date.now() - 1000 * 60 * 60 * 8),
      interval: "1m"
    };

    const result = await yahooFinance.chart(yahooSymbol, queryOptions);

    if (!result || !result.quotes || result.quotes.length === 0) {
      return {
        success: false,
        symbol,
        yahooSymbol,
        message: "Mum verisi bulunamadı."
      };
    }

    const candles = result.quotes
      .filter(q =>
        q.open !== null &&
        q.high !== null &&
        q.low !== null &&
        q.close !== null
      )
      .map(q => ({
        time: q.date,
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close,
        volume: q.volume || 0
      }));

    const cleanCandles = candles.filter(c => c.volume > 0);

    const analysis = analyzeCandles(cleanCandles);

    if (!analysis.success) {
      return {
        success: false,
        symbol,
        yahooSymbol,
        candleCount: cleanCandles.length,
        message: analysis.message
      };
    }

    const tradeSetup = analyzeTradeSetup(analysis);

    return {
      success: true,
      symbol,
      yahooSymbol,
      candleCount: cleanCandles.length,
      analysis,
      tradeSetup,
      lastCandles: cleanCandles.slice(-10)
    };
  } catch (error) {
    return {
      success: false,
      symbol,
      message: error.message
    };
  }
}