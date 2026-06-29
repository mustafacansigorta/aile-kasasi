import yahooFinance from "yahoo-finance2";

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

    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    const data = await yahooFinance.historical(yahooSymbol, {
      period1: oneYearAgo,
      period2: today,
      interval: "1d",
    });

    return res.status(200).json({
      success: true,
      symbol,
      yahooSymbol,
      count: data.length,
      data: data.slice(-30),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}