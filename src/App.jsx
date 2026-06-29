import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { analyzeDisclosure, getShortCompanyName } from "./utils/analysis";

export default function App() {
  const [news, setNews] = useState([]);
  const [selected, setSelected] = useState(null);
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadNews();
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

  async function openDetail(item) {
    setDetailLoading(true);
    setSelected(item);
    setImpact(null);

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

      const symbol = item.stockCodes?.split(",")[0]?.trim();

      if (symbol && item.publishDate) {
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
      }
    } catch (e) {
      console.log(e);
    } finally {
      setDetailLoading(false);
    }
  }

  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      const analysis = analyzeDisclosure(item);

      const text = `
        ${item.kapTitle || ""}
        ${item.stockCodes || ""}
        ${item.relatedStocks || ""}
        ${item.subject || ""}
        ${item.summary || ""}
      `.toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());

      const matchesFilter =
        filter === "all" ||
        (filter === "positive" && analysis.badge === "positive") ||
        (filter === "important" && analysis.score >= 70) ||
        (filter === "low" && analysis.score < 40);

      return matchesSearch && matchesFilter;
    });
  }, [news, search, filter]);

  const importantCount = news.filter(
    (item) => analyzeDisclosure(item).score >= 70
  ).length;

  const positiveCount = news.filter(
    (item) => analyzeDisclosure(item).badge === "positive"
  ).length;

  const marketScore = news.length
    ? Math.round(
        news.reduce((sum, item) => sum + analyzeDisclosure(item).score, 0) /
          news.length
      )
    : 0;

  function renderPerformance(value) {
    if (value === null || value === undefined) return "-";
    return `${value > 0 ? "+" : ""}${value}%`;
  }

  return (
    <div className="app">
      <header className="hero">
        <div>
          <h1>BorsaIQ</h1>
          <p>Canlı KAP haberlerini sadeleştirir.</p>
        </div>

        <div className="market-score">
          <span>{marketScore}</span>
          <small>Piyasa Skoru</small>
        </div>
      </header>

      <section className="summary">
        <h2>Bugün</h2>

        <div className="summary-grid">
          <div>
            <strong>{news.length}</strong>
            <span>Canlı Bildirim</span>
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
        <h2>🔥 Hareket Getirebilecek Haberler</h2>

        {loading && <h3>Yükleniyor...</h3>}

        {!loading &&
          filteredNews.map((item) => {
            const analysis = analyzeDisclosure(item);
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

                <div className="score-row">
                  <span>Etki Skoru</span>
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
            <button onClick={() => setSelected(null)}>X</button>

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