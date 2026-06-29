export function getAiDecision(backtest) {
  if (!backtest || !backtest.summary) {
    return {
      rating: 0,
      stars: "☆☆☆☆☆",
      probability: 0,
      confidence: 0,
      title: "Veri Yetersiz",
      color: "gray",
      comment: "Bu haber tipi için yeterli geçmiş veri bulunamadı.",
    };
  }

  const day1 = backtest.summary.day1 || {};
  const day3 = backtest.summary.day3 || {};
  const day7 = backtest.summary.day7 || {};
  const day30 = backtest.summary.day30 || {};

  const sample = backtest.analyzedCount || 0;
  const consistency = backtest.statistics?.consistencyScore ?? 50;

  const avg1 = day1.average ?? 0;
  const avg3 = day3.average ?? 0;
  const avg7 = day7.average ?? 0;
  const avg30 = day30.average ?? 0;

  const med1 = day1.median ?? 0;
  const med3 = day3.median ?? 0;
  const med7 = day7.median ?? 0;
  const med30 = day30.median ?? 0;

  const positive1 = day1.positiveRate ?? 0;
  const positive3 = day3.positiveRate ?? 0;
  const positive7 = day7.positiveRate ?? 0;
  const positive30 = day30.positiveRate ?? 0;

  const volatility7 = day7.volatility ?? 10;
  const volatility30 = day30.volatility ?? 15;

  let probability =
    positive1 * 0.15 +
    positive3 * 0.25 +
    positive7 * 0.35 +
    positive30 * 0.25;

  if (!positive30) {
    probability = positive1 * 0.2 + positive3 * 0.35 + positive7 * 0.45;
  }

  let rating = 50;

  rating += avg1 * 2;
  rating += avg3 * 3;
  rating += avg7 * 4;
  rating += avg30 * 2;

  rating += med1 * 1.5;
  rating += med3 * 2;
  rating += med7 * 3;
  rating += med30 * 1.5;

  rating += (probability - 50) * 0.55;
  rating += (consistency - 50) * 0.25;

  rating -= volatility7 * 0.6;
  rating -= volatility30 * 0.25;

  if (sample < 5) rating -= 18;
  else if (sample < 10) rating -= 8;
  else if (sample > 30) rating += 6;

  rating = Math.max(0, Math.min(100, Math.round(rating)));
  probability = Math.max(0, Math.min(100, Math.round(probability)));

  const confidence = Math.max(
    0,
    Math.min(
      100,
      Math.round(sample * 5 + consistency * 0.35 - volatility7 * 1.2)
    )
  );

  let title = "Nötr";
  let stars = "★★☆☆☆";
  let color = "orange";

  if (rating >= 85) {
    title = "Çok Güçlü Pozitif";
    stars = "★★★★★";
    color = "green";
  } else if (rating >= 70) {
    title = "Pozitif";
    stars = "★★★★☆";
    color = "green";
  } else if (rating >= 55) {
    title = "Hafif Pozitif";
    stars = "★★★☆☆";
    color = "blue";
  } else if (rating >= 40) {
    title = "Nötr / Dikkat";
    stars = "★★☆☆☆";
    color = "orange";
  } else {
    title = "Negatif Beklenti";
    stars = "★☆☆☆☆";
    color = "red";
  }

  const mainAverage = avg7 || avg3 || avg1;
  const mainMedian = med7 || med3 || med1;
  const mainPositive = positive7 || positive3 || positive1;

  let comment = `Son ${sample} benzer KAP incelendi. `;

  if (sample < 5) {
    comment +=
      "Örnek sayısı düşük olduğu için sonuçlar sınırlı güvenle değerlendirilmelidir.";
  } else if (rating >= 70) {
    comment += `Geçmiş verilere göre bu haber tipi olumlu fiyatlanma eğilimi göstermiştir. Ortalama getiri ${mainAverage}%, medyan getiri ${mainMedian}% ve pozitif oran %${mainPositive}.`;
  } else if (rating < 40) {
    comment += `Geçmiş verilere göre bu haber tipi zayıf fiyatlanmıştır. Ortalama getiri ${mainAverage}%, medyan getiri ${mainMedian}% ve pozitif oran %${mainPositive}.`;
  } else {
    comment += `Geçmiş veriler karışık sinyal üretmektedir. Ortalama getiri ${mainAverage}%, medyan getiri ${mainMedian}% ve pozitif oran %${mainPositive}.`;
  }

  return {
    rating,
    stars,
    probability,
    confidence,
    title,
    color,
    comment,
  };
}