export function translateReportType(reportId = "") {
  const map = {
    "oda-12000_New-Business-Relation": "🤝 Yeni İş İlişkisi",
    "oda-10000_Material-Event-Disclosure-General": "📢 Özel Durum Açıklaması",
    "oda-17200_Valuation-Report": "🏢 Değerleme Raporu",
    "oda-50050_Shareholders6": "👥 Ortaklık Yapısı",
    "oda-44000_Sustainability-Report": "🌱 Sürdürülebilirlik Raporu",
    "oda-18900_Liquidity-Providing-Trades": "📊 Likidite Sağlayıcılık İşlemleri",
    "oda-12800_CMB-Bulletin": "🏛️ SPK Bülteni",
    "oda-90000_TestNotification": "🧪 Test Bildirimi",
    "oda-01280_Risk-Measurement-Principles": "📉 Risk Ölçüm Esasları",
    "oda-01275_Risk-Measurement-And-Valuation-Principles": "📉 Risk ve Değerleme Esasları",
  };

  return map[reportId] || "📄 KAP Bildirimi";
}

export function analyzeDisclosure(item = {}) {
  const reportId = item.subReportIds?.[0] || "";
  const text = `${item.title || ""} ${reportId}`.toLowerCase();

  let score = 35;
  let effect = "Nötr";
  let badge = "neutral";
  let summary = "Bu bildirim bilgilendirme amaçlıdır. Hisse etkisi detay inceleme gerektirir.";

  if (text.includes("new-business-relation")) {
    score = 88;
    effect = "Pozitif";
    badge = "positive";
    summary = "Yeni iş ilişkisi bildirimi. Ciro ve kârlılığa katkı sağlayabilecek olumlu bir gelişme olabilir.";
  } else if (text.includes("material-event")) {
    score = 72;
    effect = "Önemli";
    badge = "important";
    summary = "Özel durum açıklaması. Şirket üzerinde fiyat hareketi oluşturabilecek nitelikte olabilir.";
  } else if (text.includes("valuation-report")) {
    score = 48;
    effect = "Nötr";
    badge = "neutral";
    summary = "Değerleme raporu bildirimi. Varlık değeri açısından takip edilebilir.";
  } else if (text.includes("risk-measurement")) {
    score = 18;
    effect = "Düşük Etki";
    badge = "low";
    summary = "Risk ölçüm esaslarına ilişkin teknik bildirim. Hisse üzerinde doğrudan güçlü etki beklenmez.";
  } else if (text.includes("shareholders")) {
    score = 55;
    effect = "Takip Edilmeli";
    badge = "watch";
    summary = "Ortaklık yapısına ilişkin bildirim. Pay sahipliği değişimleri açısından incelenebilir.";
  } else if (item.disclosureType === "FON") {
    score = 15;
    effect = "Düşük Etki";
    badge = "low";
    summary = "Fon bildirimi. Hisse bazlı etkisi genellikle sınırlı olabilir.";
  } else if (item.disclosureType === "DUY") {
    score = 25;
    effect = "Duyuru";
    badge = "neutral";
    summary = "Kurumsal duyuru niteliğinde bildirim.";
  }

  return {
    score,
    effect,
    badge,
    summary,
    reportTitle: translateReportType(reportId),
  };
}

export function getShortCompanyName(title = "") {
  return title
    .replace(" ANONİM ŞİRKETİ", "")
    .replace(" A.Ş.", "")
    .replace(" A.Ş", "")
    .replace(" SANAYİ VE TİCARET", "")
    .replace(" TİCARET VE SANAYİ", "")
    .trim();
}
