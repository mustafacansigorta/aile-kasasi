function round(value, digit = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return Number(value.toFixed(digit));
}

function buildPlan({ entry, stop, target1, target2 }) {
  if (!entry || !stop || !target1) {
    return null;
  }

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

function buildSetup({
  type,
  label,
  icon,
  setupScore,
  quality,
  stars,
  plan,
  reasons,
}) {
  return {
    type,
    label,
    icon,
    setupScore,
    quality,
    stars,
    plan,
    reasons,
  };
}

export function detectTradeSetup(analysis = {}) {
  if (!analysis || analysis.success === false) {
    return {
      type: "NO_TRADE",
      label: "İşlem Yok",
      icon: "🔴",
      setupScore: 0,
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

  const trendBullish =
    ema9 >= ema21 * 0.998 &&
    ema21 >= ema50 * 0.998;

  const priceAboveEma9 = lastPrice >= ema9;
  const strongVolume = rvol && rvol >= 1.8;
  const veryStrongVolume = rvol && rvol >= 2.5;
  const momentumPositive = momentum5 > 0 && momentum15 > 0;
  const nearVWAP = vwap ? Math.abs(lastPrice - vwap) / vwap <= 0.02 : false;

  const setups = [];

  // 1) BREAKOUT
  if (
    trendBullish &&
    isAboveVWAP &&
    strongVolume &&
    momentumPositive &&
    lastSwingHigh &&
    lastPrice > lastSwingHigh.price
  ) {
    setups.push(
      buildSetup({
        type: "BREAKOUT",
        label: "Breakout",
        icon: "🟢",
        setupScore: veryStrongVolume ? 95 : 88,
        quality: "strong",
        stars: "★★★★★",
        plan: buildPlan({
          entry: lastPrice,
          stop: lastSwingLow?.price || ema21,
          target1:
            lastPrice +
            (lastPrice - (lastSwingLow?.price || ema21)) * 2,
          target2:
            lastPrice +
            (lastPrice - (lastSwingLow?.price || ema21)) * 3,
        }),
        reasons: [
          "Trend pozitif",
          "VWAP üzerinde",
          "Hacim güçlü",
          "Momentum pozitif",
          "Son swing high kırılmış",
        ],
      })
    );
  }

  // 2) PULLBACK
  if (
    trendBullish &&
    isAboveVWAP &&
    priceAboveEma9 &&
    lastPrice <= ema21 * 1.012 &&
    momentum5 > 0
  ) {
    setups.push(
      buildSetup({
        type: "PULLBACK",
        label: "Pullback",
        icon: "🔵",
        setupScore: 78,
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
      })
    );
  }

  // 3) VWAP RECOVERY - Girişe yakın aday
  if (
    !isAboveVWAP &&
    strongVolume &&
    momentumPositive &&
    nearVWAP
  ) {
    setups.push(
      buildSetup({
        type: "VWAP_RECOVERY",
        label: "VWAP Geri Kazanım Adayı",
        icon: "🟡",
        setupScore: 68,
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
      })
    );
  }

  // 4) VWAP RECOVERY WAIT - Henüz giriş yok ama izlenebilir
  if (
    !isAboveVWAP &&
    strongVolume &&
    momentum5 > 0
  ) {
    setups.push(
      buildSetup({
        type: "VWAP_RECOVERY_WAIT",
        label: "VWAP Geri Kazanım Bekleniyor",
        icon: "🟡",
        setupScore: momentumPositive ? 58 : 50,
        quality: "neutral",
        stars: "★★★☆☆",
        plan: buildPlan({
          entry: vwap,
          stop: support || lastSwingLow?.price || lastPrice * 0.99,
          target1: resistance || lastSwingHigh?.price || vwap * 1.015,
          target2: vwap * 1.03,
        }),
        reasons: [
          "VWAP altında",
          "Hacim güçlü",
          "Kısa momentum pozitif",
          "Henüz giriş yok, VWAP üzeri kapanış beklenir",
        ],
      })
    );
  }

  // 5) OPENING RANGE BREAKOUT
  if (
    openingRange?.high &&
    lastPrice > openingRange.high &&
    isAboveVWAP &&
    strongVolume
  ) {
    setups.push(
      buildSetup({
        type: "ORB",
        label: "Opening Range Breakout",
        icon: "🔥",
        setupScore: 92,
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
      })
    );
  }

  // 6) REVERSAL
  if (
    !isAboveVWAP &&
    lastPrice > ema9 &&
    momentumPositive &&
    strongVolume
  ) {
    setups.push(
      buildSetup({
        type: "REVERSAL",
        label: "Tepki Dönüş Adayı",
        icon: "🔄",
        setupScore: 55,
        quality: "neutral",
        stars: "★★★☆☆",
        plan: buildPlan({
          entry: lastPrice,
          stop: support || lastSwingLow?.price || lastPrice * 0.99,
          target1: vwap || resistance || lastPrice * 1.02,
          target2: resistance || lastSwingHigh?.price || lastPrice * 1.04,
        }),
        reasons: [
          "Fiyat EMA9 üzerine dönmüş",
          "Momentum pozitife dönüyor",
          "Hacim güçlü",
          "VWAP hâlâ direnç konumunda",
        ],
      })
    );
  }

  if (setups.length > 0) {
    return setups.sort((a, b) => b.setupScore - a.setupScore)[0];
  }

  const reasons = ["Net giriş sinyali yok"];

  if (!isAboveVWAP) reasons.push("VWAP altında");
  if (!trendBullish) reasons.push("Trend zayıf");
  if (!momentumPositive) reasons.push("Momentum yeterli değil");

  return {
    type: "NO_TRADE",
    label: "İşlem Yok",
    icon: "🔴",
    setupScore: 0,
    quality: "weak",
    stars: "★☆☆☆☆",
    plan: null,
    reasons,
  };
}