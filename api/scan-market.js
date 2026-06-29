import { analyzeCandles } from "../src/utils/candleEngine.js";
import { calculateTradeSetup } from "../src/utils/tradeSetupEngine.js";

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
  "GOODY",
];

async function analyzeSymbol(symbol) {
  const yahooSymbol = `${symbol}.IS`;

  const period2 = Math.floor(Date.now() / 1000);
  const period1 = period2 - 2 * 24 * 60 * 60;

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?period1=${period1}&period2=${period2}&interval=1m`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json",
    },
  });

  const json = await response.json();
  const result = json.chart?.result?.[0];

  if (!result) return null;

  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0] || {};

  const candles = timestamps
    .map((time, index) => ({
      time: new Date(time * 1000).toISOString(),
      open: quote.open?.[index],
      high: quote.high?.[index],
      low: quote.low?.[index],
      close: quote.close?.[index],
      volume: quote.volume?.[index],
    }))
    .filter(
      (c) =>
        typeof c.open === "number" &&
        typeof c.high === "number" &&
        typeof c.low === "number" &&
        typeof c.close === "number" &&
        typeof c.volume === "number" &&
        c.volume > 0
    );

  const analysis = analyzeCandles(candles);

  if (!analysis.success) return null;

  const tradeSetup = calculateTradeSetup(analysis);

  return {
    symbol,
    price: analysis.lastPrice,
    dayChange: analysis.dayChange,
    score: tradeSetup.score,
    status: tradeSetup.status,
    action: tradeSetup.action,
    risk: tradeSetup.risk,
    confidence: tradeSetup.confidence,
    trend: tradeSetup.trend,
    shortTerm: tradeSetup.shortTerm,
    reasons: tradeSetup.reasons.slice(0, 5),
  };
}

export default async function handler(req, res) {
  try {
    const results = [];

    for (const symbol of BIST_SYMBOLS) {
      const result = await analyzeSymbol(symbol);

      if (result) {
        results.push(result);
      }
    }

    results.sort((a, b) => b.score - a.score);

    return res.status(200).json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}