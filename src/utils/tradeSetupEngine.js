export function calculateTradeSetup(analysis = {}) {
  if (!analysis || analysis.success === false) {
    return {
      score: 0,
      rawScore: 0,
      status: "Veri Yok",
      level: "weak",
      action: "WAIT",
      risk: "HIGH",
      confidence: 0,
      trend: "Unknown",
      shortTerm: "Unknown",
      reasons: ["Gün içi mum verisi bulunamadı."],
    };
  }

  let rawScore = 0;
  const reasons = [];

  const {
    lastPrice,
    dayChange,
    rvol,
    ema9,
    ema21,
    ema50,
    momentum5,
    momentum15,
    isAboveVWAP,
    isNearHigh,
  } = analysis;

  const trendBullish = ema9 > ema21 && ema21 > ema50;
  const priceAboveEma9 = lastPrice > ema9;
  const priceAboveEma21 = lastPrice > ema21;

  if (trendBullish) {
    rawScore += 20;
    reasons.push("EMA trend dizilimi pozitif");
  } else {
    reasons.push("EMA trend dizilimi zayıf");
  }

  if (priceAboveEma9) {
    rawScore += 10;
    reasons.push("Fiyat EMA9 üzerinde");
  } else {
    reasons.push("Fiyat EMA9 altında");
  }

  if (priceAboveEma21) {
    rawScore += 10;
    reasons.push("Fiyat EMA21 üzerinde");
  } else {
    reasons.push("Fiyat EMA21 altında");
  }

  if (isAboveVWAP) {
    rawScore += 15;
    reasons.push("VWAP üzerinde");
  } else {
    reasons.push("VWAP altında");
  }

  if (momentum5 !== null && momentum5 > 0) {
    rawScore += 10;
    reasons.push(`5 dk momentum pozitif (%${momentum5})`);
  } else {
    reasons.push(`5 dk momentum negatif (%${momentum5})`);
  }

  if (momentum15 !== null && momentum15 > 0) {
    rawScore += 10;
    reasons.push(`15 dk momentum pozitif (%${momentum15})`);
  } else {
    reasons.push(`15 dk momentum negatif (%${momentum15})`);
  }

  if (dayChange > 1) {
    rawScore += 10;
    reasons.push(`Günlük performans güçlü (%${dayChange})`);
  } else if (dayChange > 0) {
    rawScore += 5;
    reasons.push(`Günlük performans pozitif (%${dayChange})`);
  } else {
    reasons.push(`Günlük performans zayıf (%${dayChange})`);
  }

  if (isNearHigh !== null && isNearHigh <= 1) {
    rawScore += 10;
    reasons.push("Gün içi zirveye çok yakın");
  } else if (isNearHigh !== null && isNearHigh <= 2.5) {
    rawScore += 5;
    reasons.push("Gün içi zirveye yakın");
  } else {
    reasons.push("Gün içi zirveden uzak");
  }

  if (rvol && rvol >= 2) {
    rawScore += 15;
    reasons.push(`Hacim çok güçlü RVOL ${rvol}`);
  } else if (rvol && rvol >= 1.3) {
    rawScore += 8;
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

  rawScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  let score = rawScore;

  if (risk === "HIGH") {
    score = Math.min(score, 60);
  }

  if (!isAboveVWAP) {
    score = Math.min(score, 55);
  }

  if (dayChange < 0) {
    score = Math.min(score, 55);
  }

  let action = "AVOID";
  let status = "Zayıf";
  let level = "weak";

  if (score >= 80 && risk !== "HIGH" && isAboveVWAP) {
    action = "BUY";
    status = "Güçlü Alım";
    level = "strong";
  } else if (score >= 60) {
    action = "WATCH";
    status = "Takip Edilebilir";
    level = "watch";
  } else if (score >= 40) {
    action = "WEAK_WATCH";
    status = "Zayıf Takip";
    level = "neutral";
  }

  let confidence = 50;

  if (isAboveVWAP) confidence += 10;
  if (trendBullish) confidence += 10;
  if (momentum5 > 0 && momentum15 > 0) confidence += 15;
  if (rvol && rvol > 1.5) confidence += 15;
  if (risk === "HIGH") confidence -= 20;

  confidence = Math.max(0, Math.min(100, Math.round(confidence)));

  return {
    score,
    rawScore,
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
    reasons,
  };
}