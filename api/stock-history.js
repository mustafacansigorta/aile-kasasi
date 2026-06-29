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
    const period1 = period2 - 365 * 24 * 60 * 60;

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?period1=${period1}&period2=${period2}&interval=1d`;

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
        error: "Yahoo verisi bulunamadı.",
        yahooSymbol,
        raw: json,
      });
    }

    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};

    const data = timestamps.map((time, index) => ({
      date: new Date(time * 1000).toISOString().slice(0, 10),
      open: quotes.open?.[index],
      high: quotes.high?.[index],
      low: quotes.low?.[index],
      close: quotes.close?.[index],
      volume: quotes.volume?.[index],
    }));

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