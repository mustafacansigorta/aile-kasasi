async function getKapsBySubject(subject, days = 365, limit = 20) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - Number(days));

  const formatDate = (date) => date.toISOString().slice(0, 10);

  const response = await fetch(
    "https://www.kap.org.tr/tr/api/disclosure/members/byCriteria",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: "https://www.kap.org.tr/tr/bildirim-sorgu",
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
      body: JSON.stringify({
        fromDate: formatDate(startDate),
        toDate: formatDate(endDate),
        mkkMemberOidList: [],
        subjectList: [],
      }),
    }
  );

  const data = await response.json();

  return Array.isArray(data)
    ? data
        .filter((item) =>
          String(item.subject || "")
            .toLowerCase()
            .includes(subject.toLowerCase())
        )
        .filter((item) => item.stockCodes)
        .slice(0, Number(limit))
    : [];
}

async function getStockHistory(symbol) {
  const yahooSymbol = `${symbol.toUpperCase()}.IS`;

  const period2 = Math.floor(Date.now() / 1000);
  const period1 = period2 - 5 * 365 * 24 * 60 * 60;

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

function toISODate(kapDate) {
  return kapDate.split(" ")[0].split(".").reverse().join("-");
}

function findBaseIndex(data, targetDate) {
  return data.findIndex((item) => item.date >= targetDate);
}

function performance(data, baseIndex, days) {
  const target = data[baseIndex + days];

  if (!target || baseIndex < 0) return null;

  const start = data[baseIndex].close;
  const end = target.close;

  return Number((((end - start) / start) * 100).toFixed(2));
}

function average(values) {
  const clean = values.filter((v) => typeof v === "number");

  if (!clean.length) return null;

  return Number(
    (clean.reduce((sum, value) => sum + value, 0) / clean.length).toFixed(2)
  );
}

function positiveRate(values) {
  const clean = values.filter((v) => typeof v === "number");

  if (!clean.length) return null;

  const positive = clean.filter((v) => v > 0).length;

  return Number(((positive / clean.length) * 100).toFixed(1));
}

export default async function handler(req, res) {
  try {
    const { subject, days = "365", limit = "20" } = req.query;

    if (!subject) {
      return res.status(400).json({
        success: false,
        error: "subject parametresi eksik.",
      });
    }

    const kaps = await getKapsBySubject(subject, days, limit);

    const results = [];

    for (const kap of kaps) {
      const symbol = kap.stockCodes.split(",")[0].trim();
      const kapDate = toISODate(kap.publishDate);
      const prices = await getStockHistory(symbol);
      const baseIndex = findBaseIndex(prices, kapDate);

      if (baseIndex < 0) continue;

      results.push({
        symbol,
        title: kap.kapTitle,
        subject: kap.subject,
        summary: kap.summary,
        publishDate: kap.publishDate,
        disclosureIndex: kap.disclosureIndex,
        baseDate: prices[baseIndex].date,
        basePrice: Number(prices[baseIndex].close.toFixed(2)),
        performance: {
          day1: performance(prices, baseIndex, 1),
          day3: performance(prices, baseIndex, 3),
          day7: performance(prices, baseIndex, 7),
          day30: performance(prices, baseIndex, 30),
        },
      });
    }

    const day1 = results.map((r) => r.performance.day1);
    const day3 = results.map((r) => r.performance.day3);
    const day7 = results.map((r) => r.performance.day7);
    const day30 = results.map((r) => r.performance.day30);

    return res.status(200).json({
      success: true,
      subject,
      searchedKapCount: kaps.length,
      analyzedCount: results.length,
      summary: {
        day1: {
          average: average(day1),
          positiveRate: positiveRate(day1),
        },
        day3: {
          average: average(day3),
          positiveRate: positiveRate(day3),
        },
        day7: {
          average: average(day7),
          positiveRate: positiveRate(day7),
        },
        day30: {
          average: average(day30),
          positiveRate: positiveRate(day30),
        },
      },
      results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}