import "./App.css";

const news = [
  {
    code: "ASELS",
    title: "Yeni İş İlişkisi",
    summary: "Şirket yeni bir sözleşme açıkladı. Ciroya katkı sağlayabilecek önemli bir gelişme.",
    score: 92,
    effect: "Pozitif",
    color: "green",
  },
  {
    code: "THYAO",
    title: "Filo Yatırımı",
    summary: "Uzun vadede kapasite artışı sağlayabilecek yatırım açıklaması.",
    score: 78,
    effect: "Pozitif",
    color: "green",
  },
  {
    code: "EREGL",
    title: "Genel Kurul Bildirimi",
    summary: "Operasyonel etkisi sınırlı, düşük öncelikli bir bildirim.",
    score: 24,
    effect: "Nötr",
    color: "yellow",
  },
];

export default function App() {
  return (
    <div className="app">
      <header className="hero">
        <div>
          <h1>BorsaIQ</h1>
          <p>KAP haberlerini 10 saniyede anlayın.</p>
        </div>

        <div className="market-score">
          <span>81</span>
          <small>Piyasa Skoru</small>
        </div>
      </header>

      <section className="summary">
        <h2>Bugün</h2>

        <div className="summary-grid">
          <div>
            <strong>3</strong>
            <span>Önemli Haber</span>
          </div>
          <div>
            <strong>2</strong>
            <span>Pozitif</span>
          </div>
          <div>
            <strong>1</strong>
            <span>Nötr</span>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>🔥 Hareket Getirebilecek Haberler</h2>

        {news.map((item) => (
          <div className="card" key={item.code}>
            <div className="card-top">
              <div>
                <h3>{item.code}</h3>
                <p>{item.title}</p>
              </div>

              <div className={`badge ${item.color}`}>
                {item.effect}
              </div>
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