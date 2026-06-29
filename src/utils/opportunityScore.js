export function getOpportunityScore(analysis, aiDecision) {
  const newsScore = analysis?.score ?? 0;
  const aiScore = aiDecision?.rating ?? 0;
  const confidence = aiDecision?.confidence ?? 0;
  const probability = aiDecision?.probability ?? 0;

  let score =
    newsScore * 0.35 +
    aiScore * 0.35 +
    confidence * 0.15 +
    probability * 0.15;

  score = Math.round(Math.max(0, Math.min(100, score)));

  let label = "Zayıf";
  let level = "weak";
  let stars = "★☆☆☆☆";

  if (score >= 90) {
    label = "Çok Güçlü Fırsat";
    level = "very-strong";
    stars = "★★★★★";
  } else if (score >= 80) {
    label = "Güçlü Fırsat";
    level = "strong";
    stars = "★★★★☆";
  } else if (score >= 70) {
    label = "İzlenmeli";
    level = "watch";
    stars = "★★★☆☆";
  } else if (score >= 55) {
    label = "Spekülatif";
    level = "speculative";
    stars = "★★☆☆☆";
  }

  return {
    score,
    label,
    level,
    stars,
  };
}