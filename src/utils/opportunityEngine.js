import { analyzeDisclosure, classifyKap } from "./analysis";
import { getAiDecision } from "./aiDecision";
import { getOpportunityScore } from "./opportunityScore";

export function calculateOpportunity(item, backtest = null) {
  const analysis = analyzeDisclosure(item);
  const aiDecision = backtest
    ? getAiDecision(backtest)
    : {
        rating: analysis.score,
        probability: analysis.score,
        confidence: 50,
      };

  const opportunity = getOpportunityScore(analysis, aiDecision);
  const kapClass = classifyKap(item);

  const reasons = [];

  if (analysis.score >= 80) {
    reasons.push("Haber etkisi yüksek");
  }

  if (aiDecision.probability >= 70) {
    reasons.push("Geçmiş benzer haberler güçlü");
  }

  if (aiDecision.confidence >= 70) {
    reasons.push("Veri güveni yüksek");
  }

  if (kapClass !== "Diğer") {
    reasons.push(kapClass);
  }

  if (opportunity.score < 60) {
    reasons.push("Düşük öncelik");
  }

  return {
    ...opportunity,
    kapClass,
    analysisScore: analysis.score,
    probability: aiDecision.probability,
    confidence: aiDecision.confidence,
    aiTitle: aiDecision.title || opportunity.label,
    aiComment: aiDecision.comment || "",
    reasons,
  };
}