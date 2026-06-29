async function getStockHistory(symbol) {
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

  if (!result) return [];

  const timestamps = result.timestamp || [];
  const quotes = result.indicators?.quote?.[0] || {};

  return timestamps
    .map((time, index) => ({
      date: new Date(time * 1000).toISOString().slice(0, 10),
      close: quotes.close?.[index],
      volume: quotes.volume?.[index],
    }))
    .filter(
  (item) =>
    typeof item.close === "number" &&
    item.close > 0 &&
    item.close < 100000 &&
    item.volume !== 0
);
}

function findNearestTradingDay(data, targetDate) {
  return data.find((item) => item.date >= targetDate);
}

function getPerformance(data, baseIndex, days) {
  const target = data[baseIndex + days];

  if (!target) return null;

  const start = data[baseIndex].close;
  const end = target.close;

  return Number((((end - start) / start) * 100).toFixed(2));
}

export default async function handler(req, res) {
  try {
    const { symbol, date } = req.query;

    if (!symbol || !date) {
      return res.status(400).json({
        success: false,
        error: "symbol ve date parametreleri zorunlu.",
      });
    }

    const data = await getStockHistory(symbol);
    const baseDay = findNearestTradingDay(data, date);

    if (!baseDay) {
      return res.status(404).json({
        success: false,
        error: "Bu tarih için fiyat verisi bulunamadı.",
      });
    }

    const baseIndex = data.findIndex((item) => item.date === baseDay.date);

    const result = {
      success: true,
      symbol: symbol.toUpperCase(),
      kapDate: date,
      baseDate: baseDay.date,
      startPrice: Number(baseDay.close.toFixed(2)),
      performance: {
        day1: getPerformance(data, baseIndex, 1),
        day3: getPerformance(data, baseIndex, 3),
        day7: getPerformance(data, baseIndex, 7),
        day30: getPerformance(data, baseIndex, 30),
      },
    };

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}