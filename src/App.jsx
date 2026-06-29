import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { analyzeDisclosure, getShortCompanyName } from "./utils/analysis";
import { getAiDecision } from "./utils/aiDecision";
import { getOpportunityScore } from "./utils/opportunityScore";

export default function App() {
  const [news, setNews] = useState([]);
  const [selected, setSelected] = useState(null);
  const [impact, setImpact] = useState(null);
  const [backtest, setBacktest] = useState(null);
  const [tradeSetup, setTradeSetup] = useState(null);

  const [marketScan, setMarketScan] = useState(null);
  const [marketScanLoading, setMarketScanLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [backtestLoading, setBacktestLoading] = useState(false);
  const [tradeSetupLoading, setTradeSetupLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadNews();
    loadMarketScan();
  }, []);

  async function loadNews() {
    try {
      const res = await fetch("/api/kap-live");
      const json = await res.json();

      if (json.success) {
        setNews(
          json.data
            .filter((item) => item.isOldKap === false)
            .filter((item) => item.disclosureType !== "FON")
            .map((item) => ({
              ...item,
              title: item.kapTitle,
              subReportIds: [item.subject],
            }))
            .sort(
              (a, b) =>
                analyzeDisclosure(b).score - analyzeDisclosure(a).score
            )
        );
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadMarketScan() {
    try {
      setMarketScanLoading(true);

      const res = await fetch("/api/scan-market");
      const json = await res.json();

      if (json.success) {
        setMarketScan(json);
      } else {
        setMarketScan(null);
      }
    } catch (e) {
      console.log(e);
      setMarketScan(null);
    } finally {
      setMarketScanLoading(false);
    }
  }

  async function openDetail(item) {
    setSelected(item);
    setImpact(null);
    setBacktest(null);
    setTradeSetup(null);

    setDetailLoading(true);
    setBacktestLoading(true);
    setTradeSetupLoading(true);

    const symbol = item.stockCodes?.split(",")[0]?.trim();

    try {
      const detailRes = await fetch(
        "/api/kap-detail?id=" + item.disclosureIndex
      );
      const detailJson = await detailRes.json();

      if (detailJson.success) {
        setSelected({
          ...item,
          detail: detailJson.data,
        });
      }
    } catch (e) {
      console.log(e);
    } finally {
      setDetailLoading(false);
    }

    try {
      const params = new URLSearchParams({
        subject: item.subject || "",
        summary: item.summary || "",
        stockCodes: item.stockCodes || "",
        days: "365",
        minSimilarity: "70",
        maxAnalyze: "20",
      });

      const bt = await fetch("/api/kap-backtest?" + params);
      const btJson = await bt.json();

      if (btJson.success) {
        setBacktest(btJson);
      } else {
        setBacktest(null);
      }
    } catch (e) {
      console.log(e);
      setBacktest(null);
    } finally {
      setBacktestLoading(false);
    }

    if (symbol && item.publishDate) {
      try {
        const kapDate = item.publishDate
          .split(" ")[0]
          .split(".")
          .reverse()
          .join("-");

        const impactRes = await fetch(
          `/api/kap-impact?symbol=${symbol}&date=${kapDate}`
        );

        const impactJson = await impactRes.json();

        if (impactJson.success) {
          setImpact(impactJson);
        }
      } catch (e) {
        console.log(e);
      }
    }

    if (symbol) {
      try {
        const tradeRes = await fetch(`/api/intraday-analyze?symbol=${symbol}`);
        const tradeJson = await tradeRes.json();

        if (tradeJson.success) {
          setTradeSetup(tradeJson.tradeSetup);
        } else {
          setTradeSetup(null);
        }
      } catch (e) {
        console.log(e);
        setTradeSetup(null);
      } finally {
        setTradeSetupLoading(false);
      }
    } else {
      setTradeSetupLoading(false);
    }
  }

  const topOpportunities = useMemo(() => {
    return news
      .map((item) => {
        const analysis = analyzeDisclosure(item);

        const opportunity = getOpportunityScore(analysis, {
          rating: analysis.score,
          confidence: 50,
          probability: analysis.score,
        });

        return {
          ...item,
          analysis,
          opportunity,
        };
      })
      .filter((item) => {
        const text = `
          ${item.kapTitle || ""}
          ${item.stockCodes || ""}
          ${item.relatedStocks || ""}
          ${item.subject || ""}
          ${item.summary || ""}
        `.toLowerCase();

        const matchesSearch = text.includes(search.toLowerCase());

        const isOpportunity =
          item.analysis.score >= 70 ||
          item.analysis.badge === "positive" ||
          item.opportunity.score >= 70;

        const matchesFilter =
          filter === "all" ||
          (filter === "positive" && item.analysis.badge === "positive") ||
          (filter === "important" && item.analysis.score >= 70) ||
          (filter === "low" && item.opportunity.score < 70);

        return matchesSearch && isOpportunity && matchesFilter;
      })
      .sort((a, b) => b.opportunity.score - a.opportunity.score)
      .slice(0, 20);
  }, [news, search, filter]);

  const importantCount = topOpportunities.filter(
    (item) => item.analysis.score >= 70
  ).length;

  const positiveCount = topOpportunities.filter(
    (item) => item.analysis.badge === "positive"
  ).length;

  const marketScore = topOpportunities.length
    ? Math.round(
        topOpportunities.reduce(
          (sum, item) => sum + item.opportunity.score,
          0
        ) / topOpportunities.length
      )
    : 0;

  function renderPerformance(value) {
    if (value === null || value === undefined) return "-";
    return `${value > 0 ? "+" : ""}${value}%`;
  }

  function closeModal() {
    setSelected(null);
    setBacktest(null);
    setImpact(null);
    setTradeSetup(null);
  }

  return (
    <div className="app">
      <header className="hero">
        <div>
          <h1>BorsaIQ</h1>
          <p>AI destekli KAP ve işlem fırsatı radarı.</p>
        </div>

        <div className="market-score">
          <span>{marketScore}</span>
          <small>AI Skoru</small>
        </div>
      </header>

      <section className="summary">
        <h2>Bugün</h2>

        <div className="summary-grid">
          <div>
            <strong>{topOpportunities.length}</strong>
            <span>AI Fırsat</span>
          </div>
          <div>
            <strong>{importantCount}</strong>
            <span>Önemli</span>
          </div>
          <div>
            <strong>{positiveCount}</strong>
            <span>Pozitif</span>
          </div>
        </div>
      </section>

      <div className="toolbar">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Hisse, şirket veya konu ara..."
        />

        <div className="filters">
          <button onClick={() => setFilter("all")}>Tümü</button>
          <button onClick={() => setFilter("important")}>Önemli</button>
          <button onClick={() => setFilter("positive")}>Pozitif</button>
          <button onClick={() => setFilter("low")}>Düşük</button>
        </div>
      </div>

      <section className="section">
        <h2>📡 Gün İçi Tarama</h2>

        {marketScanLoading && <h3>Tarama yükleniyor...</h3>}

        {!marketScanLoading && marketScan && (
          <>
            <div className="summary-grid scanner-summary">
              <div>
                <strong>{marketScan.summary.buy}</strong>
                <span>BUY</span>
              </div>

              <div>
                <strong>{marketScan.summary.watch}</strong>
                <span>WATCH</span>
              </div>

              <div>
                <strong>{marketScan.summary.weakWatch}</strong>
                <span>Zayıf Takip</span>
              </div>

              <div>
                <strong>{marketScan.summary.avoid}</strong>
                <span>Uzak Dur</span>
              </div>
            </div>

            <div className="scanner-list">
              {marketScan.results.slice(0, 5).map((item) => (
                <div className={`scanner-card ${item.action}`} key={item.symbol}>
                  <div>
                    <h3>{item.symbol}</h3>
                    <p>{item.status}</p>
                    <small>
                      Fiyat: {item.price} TL | Günlük: %{item.dayChange}
                    </small>
                  </div>

                  <div className="scanner-score">
                    <strong>{item.score}</strong>
                    <span>{item.action}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="section">
        <h2>🤖 AI Fırsat Merkezi</h2>

        {loading && <h3>Yükleniyor...</h3>}

        {!loading &&
          topOpportunities.map((item) => {
            const analysis = item.analysis;
            const opportunity = item.opportunity;

            const code =
              item.stockCodes ||
              item.relatedStocks ||
              getShortCompanyName(item.kapTitle);

            return (
              <div className="card" key={item.disclosureIndex}>
                <div className="card-top">
                  <div>
                    <h2>{code}</h2>
                    <p>{item.subject || "KAP Bildirimi"}</p>
                    <small>{item.publishDate}</small>
                  </div>

                  <span className={`badge ${analysis.badge}`}>
                    {analysis.effect}
                  </span>
                </div>

                <p className="news-summary">
                  {item.summary || analysis.summary}
                </p>

                <div className={`opportunity ${opportunity.level}`}>
                  <span>{opportunity.stars}</span>
                  <strong>{opportunity.score}/100</strong>
                  <small>{opportunity.label}</small>
                </div>

                <div className="score-row">
                  <span>Haber Etki Skoru</span>
                  <strong>{analysis.score}/100</strong>
                </div>

                <button onClick={() => openDetail(item)}>Detayı Gör</button>
              </div>
            );
          })}
      </section>

      {selected && (
        <div className="modal">
          <div className="modal-content">
            <button onClick={closeModal}>X</button>

            {detailLoading ? (
              <h2>Yükleniyor...</h2>
            ) : (
              <div className="detail-box">
                {(() => {
                  const analysis = analyzeDisclosure(selected);

                  return (
                    <>
                      <h2>
                        {selected.stockCodes ||
                          selected.relatedStocks ||
                          "KAP"}
                      </h2>
                      <h3>{selected.subject}</h3>

                      <div className="ai-box">
                        <span className={`badge ${analysis.badge}`}>
                          {analysis.effect}
                        </span>

                        <div className="score-big">
                          {analysis.score}
                          <small>/100</small>
                        </div>

                        <p>{analysis.summary}</p>
                      </div>

                      {backtestLoading && (
                        <div className="impact-box">
                          <h4>🤖 AI Backtest yükleniyor...</h4>
                        </div>
                      )}

                      {backtest &&
                        (() => {
                          const ai = getAiDecision(backtest);

                          return (
                            <div className="impact-box">
                              <div className={`ai-result ${ai.color}`}>
                                <h3>{ai.stars}</h3>
                                <h2>{ai.title}</h2>
                                <h1>%{ai.probability}</h1>
                                <p>Yükseliş Olasılığı</p>
                                <small>
                                  Güven Skoru: {ai.confidence}/100
                                </small>
                              </div>

                              <h4>🤖 AI Backtest Analizi</h4>

                              <p>
                                <strong>Benzer Haber:</strong>{" "}
                                {backtest.analyzedCount} adet
                              </p>

                              <p>
                                <strong>Kategori:</strong>{" "}
                                {backtest.currentClass}
                              </p>

                              <div className="impact-grid">
                                <div>
                                  <span>1 İşlem Günü</span>
                                  <strong>
                                    {renderPerformance(
                                      backtest.summary.day1.average
                                    )}
                                  </strong>
                                  <small>
                                    Başarı: %
                                    {backtest.summary.day1.positiveRate ?? "-"}
                                  </small>
                                </div>

                                <div>
                                  <span>3 İşlem Günü</span>
                                  <strong>
                                    {renderPerformance(
                                      backtest.summary.day3.average
                                    )}
                                  </strong>
                                  <small>
                                    Başarı: %
                                    {backtest.summary.day3.positiveRate ?? "-"}
                                  </small>
                                </div>

                                <div>
                                  <span>7 İşlem Günü</span>
                                  <strong>
                                    {renderPerformance(
                                      backtest.summary.day7.average
                                    )}
                                  </strong>
                                  <small>
                                    Başarı: %
                                    {backtest.summary.day7.positiveRate ?? "-"}
                                  </small>
                                </div>

                                <div>
                                  <span>30 İşlem Günü</span>
                                  <strong>
                                    {renderPerformance(
                                      backtest.summary.day30.average
                                    )}
                                  </strong>
                                  <small>
                                    Başarı: %
                                    {backtest.summary.day30.positiveRate ?? "-"}
                                  </small>
                                </div>
                              </div>

                              <p className="ai-comment">{ai.comment}</p>
                            </div>
                          );
                        })()}

                      {tradeSetupLoading && (
                        <div className="impact-box">
                          <h4>📡 Gün İçi Trade Setup yükleniyor...</h4>
                        </div>
                      )}

                      {tradeSetup && (
                        <div className="impact-box">
                          <h4>📡 Gün İçi Trade Setup</h4>

                          <div className={`ai-result ${tradeSetup.level}`}>
                            <h2>{tradeSetup.status}</h2>
                            <h1>{tradeSetup.score}/100</h1>
                            <p>İşlem Kalitesi</p>

                            <p>
                              <strong>Aksiyon:</strong> {tradeSetup.action}
                            </p>

                            <p>
                              <strong>Risk:</strong> {tradeSetup.risk}
                            </p>

                            <p>
                              <strong>Güven:</strong>{" "}
                              {tradeSetup.confidence}/100
                            </p>

                            <p>
                              <strong>Trend:</strong> {tradeSetup.trend}
                            </p>

                            <p>
                              <strong>Kısa Vade:</strong>{" "}
                              {tradeSetup.shortTerm}
                            </p>
                          </div>

                          <h4>Sebepler</h4>
                          <ul>
                            {tradeSetup.reasons.map((reason, index) => (
                              <li key={index}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {impact && (
                        <div className="impact-box">
                          <h4>📈 Haber Etki Analizi</h4>

                          <p>
                            <strong>Baz Tarih:</strong> {impact.baseDate}
                          </p>

                          <p>
                            <strong>Baz Fiyat:</strong> {impact.startPrice} TL
                          </p>

                          <div className="impact-grid">
                            <div>
                              <span>1 İşlem Günü</span>
                              <strong>
                                {renderPerformance(impact.performance.day1)}
                              </strong>
                            </div>

                            <div>
                              <span>3 İşlem Günü</span>
                              <strong>
                                {renderPerformance(impact.performance.day3)}
                              </strong>
                            </div>

                            <div>
                              <span>7 İşlem Günü</span>
                              <strong>
                                {renderPerformance(impact.performance.day7)}
                              </strong>
                            </div>

                            <div>
                              <span>30 İşlem Günü</span>
                              <strong>
                                {renderPerformance(impact.performance.day30)}
                              </strong>
                            </div>
                          </div>
                        </div>
                      )}

                      <h4>📌 KAP Özeti</h4>
                      <p>{selected.summary || "Özet bulunamadı."}</p>

                      <h4>📄 Bildirim Bilgileri</h4>
                      <p>
                        <strong>Şirket:</strong> {selected.kapTitle}
                      </p>
                      <p>
                        <strong>Tarih:</strong> {selected.publishDate}
                      </p>
                      <p>
                        <strong>Bildirim No:</strong>{" "}
                        {selected.disclosureIndex}
                      </p>

                      <a
                        href={`https://www.kap.org.tr/tr/Bildirim/${selected.disclosureIndex}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        KAP’ta Aç
                      </a>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      <footer>
        Bu uygulama yatırım tavsiyesi vermez. KAP bildirimlerini sadeleştirir.
      </footer>
    </div>
  );
}