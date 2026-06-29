import { getCandleAnalysis } from "./candleEngine.js";

const BIST_SYMBOLS = [
  "THYAO",
  "ASELS",
  "KCHOL",
  "SISE",
  "TUPRS",
  "BIMAS",
  "EREGL",
  "AKBNK",
  "GARAN",
  "YKBNK",
  "ISCTR",
  "SAHOL",
  "FROTO",
  "TOASO",
  "PETKM",
  "GOODY"
];

export async function scanMarket() {
  const results = [];

  for (const symbol of BIST_SYMBOLS) {
    const data = await getCandleAnalysis(symbol);

    if (data.success) {
      results.push({
        symbol: data.symbol,
        price: data.analysis.lastPrice,
        score: data.tradeSetup.score,
        action: data.tradeSetup.action,
        risk: data.tradeSetup.risk,
        confidence: data.tradeSetup.confidence,
        status: data.tradeSetup.status,
        reasons: data.tradeSetup.reasons.slice(0, 4)
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}