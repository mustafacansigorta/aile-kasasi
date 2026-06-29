import { analyzeCandles } from "../src/utils/candleEngine.js";
import { calculateTradeSetup } from "../src/utils/tradeSetupEngine.js";
import { detectTradeSetup } from "../src/utils/setupEngine.js";

const BIST_SYMBOLS = [
  "AEFES", "AGHOL", "AGROT", "AKBNK", "AKSA", "AKSEN", "ALARK", "ALFAS",
  "ALTNY", "ANSGR", "ARCLK", "ASELS", "ASTOR", "AVPGY", "BERA", "BIMAS",
  "BRSAN", "BRYAT", "BSOKE", "BTCIM", "CANTE", "CCOLA", "CIMSA", "CWENE",
  "DOAS", "DOHOL", "ECILC", "ECZYT", "EFORC", "EGEEN", "EKGYO", "ENERY",
  "ENJSA", "ENKAI", "EREGL", "FENER", "FROTO", "GARAN", "GESAN", "GOLTS",
  "GUBRF", "HALKB", "HEKTS", "ISCTR", "ISMEN", "KCAER", "KCHOL", "KLSER",
  "KONTR", "KONYA", "KOZAA", "KOZAL", "KRDMD", "KTLEV", "LMKDC", "MAGEN",
  "MAVI", "MGROS", "MIATK", "MPARK", "OBAMS", "ODAS", "OTKAR", "OYAKC",
  "PASEU", "PETKM", "PGSUS", "RALYH", "REEDR", "SAHOL", "SASA", "SISE",
  "SKBNK", "SMRTG", "SOKM", "TABGD", "TAVHL", "TCELL", "THYAO", "TKFEN",
  "TOASO", "TSKB", "TTKOM", "TTRAK", "TUKAS", "TUPRS", "TURSG", "ULKER",
  "VAKBN", "VESTL", "YEOTK", "YKBNK", "ZOREN"
];

function getDecision(tradeSetup, setup) {
  if (!tradeSetup || !setup) {
    return {
      label: "Uzak Dur",
      icon: "🔴",
      color: "red",
    };
  }

  const rr = setup.plan?.riskReward || 0;

  if (
    tradeSetup.score >= 70 &&
    setup.setupScore >= 75 &&
    rr >= 2 &&
    tradeSetup.risk !== "HIGH"
  ) {
    return {
      label: "Alım Adayı",
      icon: "🟢",
      color: "green",
    };
  }

  if (
    tradeSetup.score >= 50 ||
    setup.setupScore >= 55
  ) {
    return {
      label: "İzle",
      icon: "🟡",
      color: "yellow",
    };
  }

  return {
    label: "Uzak Dur",
    icon: "🔴",
    color: "red",
  };
}

async function analyzeSymbol(symbol) {
  try {
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
    const setup = detectTradeSetup(analysis);
    const decision = getDecision(tradeSetup, setup);

    return {
      symbol,
      price: analysis.lastPrice,
      dayChange: analysis.dayChange,
      vwap: analysis.vwap,
      rvol: analysis.rvol,
      ema9: analysis.ema9,
      ema21: analysis.ema21,
      ema50: analysis.ema50,

      tradeScore: tradeSetup.score,
      rawScore: tradeSetup.rawScore ?? tradeSetup.score,
      status: tradeSetup.status,
      risk: tradeSetup.risk,
      confidence: tradeSetup.confidence,
      trend: tradeSetup.trend,
      shortTerm: tradeSetup.shortTerm,

      setup: {
        type: setup.type,
        label: setup.label,
        icon: setup.icon,
        setupScore: setup.setupScore,
        quality: setup.quality,
        stars: setup.stars,
        plan: setup.plan,
        reasons: setup.reasons,
      },

      decision,

      reasons: [
        ...tradeSetup.reasons.slice(0, 4),
        ...setup.reasons.slice(0, 3),
      ],
    };
  } catch (error) {
    return null;
  }
}

function groupResults(results) {
  return {
    alimAdayi: results.filter((item) => item.decision.label === "Alım Adayı"),
    izle: results.filter((item) => item.decision.label === "İzle"),
    uzakDur: results.filter((item) => item.decision.label === "Uzak Dur"),
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

    results.sort((a, b) => {
      const aPlan = a.setup?.plan?.riskReward || 0;
      const bPlan = b.setup?.plan?.riskReward || 0;

      const aTotal =
        a.tradeScore * 0.45 +
        a.setup.setupScore * 0.4 +
        a.confidence * 0.1 +
        aPlan * 5;

      const bTotal =
        b.tradeScore * 0.45 +
        b.setup.setupScore * 0.4 +
        b.confidence * 0.1 +
        bPlan * 5;

      return bTotal - aTotal;
    });

    const grouped = groupResults(results);

    return res.status(200).json({
      success: true,
      count: results.length,
      summary: {
        alimAdayi: grouped.alimAdayi.length,
        izle: grouped.izle.length,
        uzakDur: grouped.uzakDur.length,
      },
      grouped,
      results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}