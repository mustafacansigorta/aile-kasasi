export function calculateTradeSetup(analysis = {}) {
  if (!analysis || analysis.success === false) {
    return {
      score: 0,
      status: "Veri Yok",
      level: "weak",
      reasons: ["Gün içi mum verisi bulunamadı."],
    };
  }

  let score = 0;
  const reasons = [];

  if (analysis.isAboveVWAP) {
    score += 20;
    reasons.push("VWAP üstünde");
  } else {
    reasons.push("VWAP altında");
  }

  if (analysis.rvol && analysis.rvol >= 3) {
    score += 20;
    reasons.push(`Hacim güçlü (${analysis.rvol}x)`);
  } else if (analysis.rvol && analysis.rvol >= 1.5) {
    score += 10;
    reasons.push(`Hacim artıyor (${analysis.rvol}x)`);
  } else {
    reasons.push("Hacim zayıf");
  }

  if (analysis.momentum5 && analysis.momentum5 >= 0.5) {
    score += 15;
    reasons.push(`5 dk momentum güçlü (+%${analysis.momentum5})`);
  } else if (analysis.momentum5 && analysis.momentum5 > 0) {
    score += 7;
    reasons.push(`5 dk momentum pozitif (+%${analysis.momentum5})`);
  } else {
    reasons.push("5 dk momentum zayıf");
  }

  if (analysis.momentum15 && analysis.momentum15 >= 1) {
    score += 15;
    reasons.push(`15 dk momentum güçlü (+%${analysis.momentum15})`);
  } else if (analysis.momentum15 && analysis.momentum15 > 0) {
    score += 7;
    reasons.push(`15 dk momentum pozitif (+%${analysis.momentum15})`);
  } else {
    reasons.push("15 dk momentum zayıf");
  }

  if (analysis.isNearHigh !== null && analysis.isNearHigh <= 1.5) {
    score += 15;
    reasons.push("Gün içi zirveye yakın");
  } else if (analysis.isNearHigh !== null && analysis.isNearHigh <= 3) {
    score += 8;
    reasons.push("Zirveye orta yakınlıkta");
  } else {
    reasons.push("Gün içi zirveden uzak");
  }

  if (analysis.dayChange !== null && analysis.dayChange > 0 && analysis.dayChange < 4) {
    score += 10;
    reasons.push(`Günlük hareket kontrollü (+%${analysis.dayChange})`);
  } else if (analysis.dayChange >= 4) {
    score += 3;
    reasons.push("Günlük hareket fazla ilerlemiş olabilir");
  } else {
    reasons.push("Günlük performans zayıf");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let status = "Zayıf";
  let level = "weak";

  if (score >= 85) {
    status = "Güçlü İşlem Adayı";
    level = "strong";
  } else if (score >= 70) {
    status = "İşlem İçin Uygun";
    level = "good";
  } else if (score >= 55) {
    status = "İzlenmeli";
    level = "watch";
  } else if (score >= 40) {
    status = "Riskli / Bekle";
    level = "risk";
  }

  return {
    score,
    status,
    level,
    reasons,
  };
}