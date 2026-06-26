import { useEffect, useState } from "react";
import "./App.css";

import {
  analyzeDisclosure,
  getShortCompanyName,
} from "./utils/analysis";

export default function App() {
  const [news, setNews] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadNews();
  }, []);

  async function loadNews() {
    try {
      const res = await fetch("/api/kap-disclosures");
      const json = await res.json();

      if (json.success) {
        setNews(
  json.data
    .filter((item) => item.disclosureType !== "FON")
    .sort((a, b) => {
      return analyzeDisclosure(b).score - analyzeDisclosure(a).score;
    })
);
      }
    } catch (e) {
      console.log(e);
    }

    setLoading(false);
  }

  async function openDetail(id) {
    setDetailLoading(true);

    const res = await fetch("/api/kap-detail?id=" + id);
    const json = await res.json();

    setSelected(json.data);

    setDetailLoading(false);
  }

  return (
    <div className="app">

      <h1>BorsaIQ</h1>

      <p>
        Yapay Zeka Destekli KAP Analiz Platformu
      </p>

      {loading && <h3>Yükleniyor...</h3>}

      {!loading &&
        news.map((item) => (
          <div className="card" key={item.disclosureIndex}>

  {(() => {
    const analysis = analyzeDisclosure(item);

    return (
      <>
        <div className="card-top">
          <div>
            <h2>{getShortCompanyName(item.title)}</h2>
            <p>{analysis.reportTitle}</p>
          </div>

          <span className={`badge ${analysis.badge}`}>
            {analysis.effect}
          </span>
        </div>

        <p>{analysis.summary}</p>

        <div className="score-row">
          <span>Etki Skoru</span>
          <strong>{analysis.score}/100</strong>
        </div>

        <p>Bildirim No : {item.disclosureIndex}</p>

        <button
          onClick={() => openDetail(item.disclosureIndex)}
        >
          Detayı Gör
        </button>
      </>
    );
  })()}

</div>
        ))}

      {selected && (
        <div className="modal">

          <div className="modal-content">

            <button
              onClick={() => setSelected(null)}
            >
              X
            </button>

            {detailLoading ? (
              <h2>Yükleniyor...</h2>
            ) : (
              <>
                <h2>{selected.senderTitle}</h2>

                <h3>{selected.subject?.tr}</h3>

                <p>
                  {selected.summary?.tr}
                </p>

                <hr />

                <div className="detail-box">
  <h4>📌 Özet</h4>
  <p>{selected.summary?.tr || "Özet bulunamadı."}</p>

  <h4>📄 Bildirim Bilgileri</h4>
  <p><strong>Şirket:</strong> {selected.senderTitle}</p>
  <p><strong>Konu:</strong> {selected.subject?.tr}</p>
  <p><strong>Tarih:</strong> {selected.time}</p>

  {selected.link && (
    <a href={selected.link} target="_blank" rel="noreferrer">
      KAP’ta Aç
    </a>
  )}
</div>
              </>
            )}

          </div>

        </div>
      )}

    </div>
  );
}