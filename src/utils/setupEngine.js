function round(value, digit = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return Number(value.toFixed(digit));
}

function buildPlan({ entry, stop, target1, target2 }) {
  const risk = entry - stop;
  const reward = target1 - entry;

  return {
    entry: round(entry),
    stop: round(stop),
    target1: round(target1),
    target2: round(target2),
    riskReward: risk > 0 ? round(reward / risk) : null,
  };
}

export function detectTradeSetup(analysis = {}) {
  if (!analysis || analysis.success === false) {
    return {
      type: "NO_TRADE",
      label: "İşlem Yok",
      icon: "🔴",
      quality: "weak",
      stars: "★☆☆☆☆",
      plan: null,
      reasons: ["Yeterli veri yok."],
    };
  }

  const {
    lastPrice,
    vwap,
    rvol,
    ema9,
    ema21,
    ema50,
    momentum5,
    momentum15,
    support,
    resistance,
    lastSwingHigh,
    lastSwingLow,
    openingRange,
    isAboveVWAP,
  } = analysis;

  const trendBullish = ema9 > ema21 && ema21 > ema50;
  const priceAboveEma9 = lastPrice > ema9;
  const strongVolume = rvol && rvol >= 2;
  const momentumPositive = momentum5 > 0 && momentum15 > 0;

  const reasons = [];

  if (
    trendBullish &&
    isAboveVWAP &&
    strongVolume &&
    lastSwingHigh &&
    lastPrice > lastSwingHigh.price
  ) {
    return {
      type: "BREAKOUT",
      label: "Breakout",
      icon: "🟢",
      quality: "strong",
      stars: "★★★★★",
      plan: buildPlan({
        entry: lastPrice,
        stop: lastSwingLow?.price || ema21,
        target1: lastPrice + (lastPrice - (lastSwingLow?.price || ema21)) * 2,
        target2: lastPrice + (lastPrice - (lastSwingLow?.price || ema21)) * 3,
      }),
      reasons: [
        "Trend pozitif",
        "VWAP üzerinde",
        "Hacim güçlü",
        "Son swing high kırılmış",
      ],
    };
  }

  if (
    trendBullish &&
    isAboveVWAP &&
    priceAboveEma9 &&
    lastPrice <= ema21 * 1.01 &&
    momentum5 > 0
  ) {
    return {
      type: "PULLBACK",
      label: "Pullback",
      icon: "🔵",
      quality: "watch",
      stars: "★★★★☆",
      plan: buildPlan({
        entry: lastPrice,
        stop: ema50,
        target1: resistance || lastSwingHigh?.price || lastPrice * 1.02,
        target2: lastPrice * 1.04,
      }),
      reasons: [
        "Trend pozitif",
        "EMA21 bölgesine yakın",
        "Momentum tekrar dönüyor",
        "VWAP üzerinde",
      ],
    };
  }

  if (
    !isAboveVWAP &&
    strongVolume &&
    Math.abs(lastPrice - vwap) / vwap <= 0.01 &&
    momentum5 > 0
  ) {
    return {
      type: "VWAP_RECOVERY",
      label: "VWAP Geri Kazanım Adayı",
      icon: "🟡",
      quality: "neutral",
      stars: "★★★☆☆",
      plan: buildPlan({
        entry: vwap,
        stop: support || lastSwingLow?.price || lastPrice * 0.99,
        target1: resistance || lastSwingHigh?.price || vwap * 1.015,
        target2: vwap * 1.03,
      }),
      reasons: [
        "VWAP altında ama yakın",
        "Hacim güçlü",
        "Kısa momentum pozitif",
        "VWAP üzerine atması beklenir",
      ],
    };
  }

  if (
    openingRange?.high &&
    lastPrice > openingRange.high &&
    isAboveVWAP &&
    strongVolume
  ) {
    return {
      type: "ORB",
      label: "Opening Range Breakout",
      icon: "🔥",
      quality: "strong",
      stars: "★★★★★",
      plan: buildPlan({
        entry: lastPrice,
        stop: openingRange.high,
        target1: lastPrice + (lastPrice - openingRange.high) * 2,
        target2: lastPrice + (lastPrice - openingRange.high) * 3,
      }),
      reasons: [
        "Opening range kırıldı",
        "VWAP üzerinde",
        "Hacim güçlü",
      ],
    };
  }

  reasons.push("Net giriş sinyali yok");

  if (!isAboveVWAP) reasons.push("VWAP altında");
  if (!trendBullish) reasons.push("Trend zayıf");
  if (!momentumPositive) reasons.push("Momentum yeterli değil");

  return {
    type: "NO_TRADE",
    label: "İşlem Yok",
    icon: "🔴",
    quality: "weak",
    stars: "★☆☆☆☆",
    plan: null,
    reasons,
  };
}