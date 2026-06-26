import { useEffect, useMemo, useState } from "react";
import "./App.css";

function analyzeDisclosure(item) {
  const title = item.title || "Bilinmeyen Şirket";
  const report = item.subReportIds?.[0] || "";
  const text = `${title} ${report}`.toLowerCase();

  let score = 35;
  let effect = "Nötr";
  let color = "yellow";
  let summary = "KAP bildirimi yayınlandı. Detay incelemesi gerektirir.";

  if (text.includes("new-business-relation")) {
    score = 88;
    effect = "Pozitif";
    color = "green";
    summary = "Yeni iş ilişkisi bildirimi. Şirket gelirlerine katkı sağlayabilecek önemli bir gelişme.";
  } else if (text.includes("material-event")) {
    score = 72;
    effect = "Önemli";
    color = "green";
    summary = "Özel durum açıklaması. Şirket üzerinde fiyat hareketi oluşturabilecek nitelikte olabilir.";
  } else if (text.includes("valuation-report")) {
    score = 55;
    effect = "Nötr";
    color = "yellow";
    summary = "Değerleme raporu bildirimi. Varlık değeri ve finansal görünüm açısından incelenebilir.";
  } else if (item.disclosureType === "FON") {
    score = 22;
    effect = "Düşük";
    color = "gray";
    summary = "Fon bildirimi. Hisse bazlı etkisi genellikle sınırlı olabilir.";
  }

  return { score, effect, color, summary };
}

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadKapNews() {
      try {
        const res = await fetch("/api/kap-disclosures");
        const json = await res.json();

        if (!json.success) {
          throw new Error(json.error || "KAP verisi alınamadı.");
        }

        setItems(json.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadKapNews();
  }, []);

  const analyzedNews = useMemo(() => {
    return items
      .map((item) => ({
        ...item,
        ...analyzeDisclosure(item),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [items]);

  const importantCount = analyzedNews.filter((x) => x.score >= 60).length;
  const positiveCount = analyzedNews.filter((x) => x.effect === "Pozitif").length;
  const neutralCount = analyzedNews.filter((x) => x.effect === "Nötr").length;
  const marketScore = analyzedNews.length
    ? Math.round(analyzedNews.reduce((sum, x) => sum + x.score, 0) / analyzedNews.length)
    : 0;

  return (
    <div className="app">
      <header className="hero">
        <div>
          <h1>BorsaIQ</h1>
          <p>KAP haberlerini 10 saniyede anlayın.</p>
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
            <strong>{importantCount}</strong>
            <span>Önemli Haber</span>
          </div>
          <div>
            <strong>{positiveCount}</strong>
            <span>Pozitif</span>
          </div>
          <div>
            <strong>{neutralCount}</strong>
            <span>Nötr</span>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>🔥 Hareket Getirebilecek Haberler</h2>

        {loading && <p className="info">KAP bildirimleri yükleniyor...</p>}
        {error && <p className="error">{error}</p>}

        {!loading &&
          !error &&
          analyzedNews.map((item) => (
            <div className="card" key={item.disclosureIndex}>
              <div className="card-top">
                <div>
                  <h3>{item.fundCode || item.title}</h3>
                  <p>{item.subReportIds?.[0] || item.disclosureType}</p>
                </div>

                <div className={`badge ${item.color}`}>{item.effect}</div>
              </div>

              <p className="news-summary">{item.summary}</p>

              <div className="score-row">
                <span>Etki Skoru</span>
                <strong>{item.score}/100</strong>
              </div>
            </div>
          ))}
      </section>

      <footer>
        Bu uygulama yatırım tavsiyesi vermez. KAP bildirimlerini sadeleştirir.
      </footer>
    </div>
  );
}