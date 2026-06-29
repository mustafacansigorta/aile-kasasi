export function getAiDecision(backtest) {
  if (!backtest || !backtest.summary) {
    return {
      rating: 0,
      stars: "☆☆☆☆☆",
      probability: 0,
      confidence: 0,
      title: "Veri Yetersiz",
      color: "gray",
      comment: "Bu haber tipi için yeterli geçmiş veri bulunamadı."
    };
  }

  const day1 = backtest.summary.day1.average ?? 0;
  const day3 = backtest.summary.day3.average ?? 0;
  const day7 = backtest.summary.day7.average ?? 0;

  const positive =
    backtest.summary.day7.positiveRate ??
    backtest.summary.day3.positiveRate ??
    backtest.summary.day1.positiveRate ??
    0;

  const sample = backtest.analyzedCount ?? 0;

  let score = 0;

  score += day1 * 5;
  score += day3 * 8;
  score += day7 * 10;

  score += positive * 0.6;
  score += sample * 1.2;

  score = Math.max(0, Math.min(100, Math.round(score)));

  let title = "";
  let stars = "";
  let color = "";

  if (score >= 85) {
    title = "Çok Güçlü Pozitif";
    stars = "★★★★★";
    color = "green";
  } else if (score >= 70) {
    title = "Pozitif";
    stars = "★★★★☆";
    color = "green";
  } else if (score >= 55) {
    title = "Hafif Pozitif";
    stars = "★★★☆☆";
    color = "blue";
  } else if (score >= 40) {
    title = "Nötr";
    stars = "★★☆☆☆";
    color = "orange";
  } else {
    title = "Negatif";
    stars = "★☆☆☆☆";
    color = "red";
  }

  const confidence = Math.min(
    100,
    Math.round(sample * 4 + positive * 0.4)
  );

  return {
    rating: score,
    probability: positive,
    confidence,
    stars,
    color,
    title,
    comment:
      `Son ${sample} benzer KAP incelendi. ` +
      `%${positive} oranında pozitif fiyatlanma görüldü.`
  };
}