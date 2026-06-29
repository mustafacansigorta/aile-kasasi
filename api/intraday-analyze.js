import { analyzeCandles } from "../src/utils/candleEngine.js";
import { calculateTradeSetup } from "../src/utils/tradeSetupEngine.js";

export default async function handler(req, res) {
  try {
    const { symbol } = req.query;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: "symbol parametresi eksik.",
      });
    }

    const yahooSymbol = `${symbol.toUpperCase()}.IS`;

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

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Intraday veri bulunamadı.",
        yahooSymbol,
        raw: json,
      });
    }

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
          typeof c.volume === "number"
      );

    const analysis = analyzeCandles(candles);
    const tradeSetup = calculateTradeSetup(analysis);

    return res.status(200).json({
      success: true,
      symbol: symbol.toUpperCase(),
      yahooSymbol,
      candleCount: candles.length,
      analysis,
tradeSetup,
lastCandles: candles.slice(-10),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}