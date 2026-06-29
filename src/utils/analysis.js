export function getShortCompanyName(title = "") {
  return title
    .replace(" ANONİM ŞİRKETİ", "")
    .replace(" A.Ş.", "")
    .replace(" A.Ş", "")
    .replace(" SANAYİ VE TİCARET", "")
    .replace(" TİCARET VE SANAYİ", "")
    .replace(" SANAYİ TİCARET", "")
    .replace(" VE TİCARET", "")
    .trim();
}

export function analyzeDisclosure(item = {}) {
  const subject = item.subject || "";
  const summary = item.summary || "";
  const title = item.kapTitle || item.title || "";
  const text = `${subject} ${summary} ${title}`.toLowerCase();

  let score = 35;
  let effect = "Nötr";
  let badge = "neutral";
  let aiSummary =
    "Bu bildirim bilgilendirme amaçlıdır. Hisse etkisi detay inceleme gerektirir.";

  if (text.includes("yeni iş ilişkisi") || text.includes("sözleşme")) {
    score = 90;
    effect = "Pozitif";
    badge = "positive";
    aiSummary =
      "Şirket yeni bir iş ilişkisi veya sözleşme açıklamış. Ciro ve kârlılığa olumlu katkı sağlayabilir.";
  } else if (text.includes("ihale") || text.includes("sipariş")) {
    score = 88;
    effect = "Pozitif";
    badge = "positive";
    aiSummary =
      "İhale, sipariş veya iş alımına ilişkin bildirim. Şirket gelirleri açısından olumlu değerlendirilebilir.";
  } else if (text.includes("kar payı") || text.includes("temettü")) {
    score = 82;
    effect = "Pozitif";
    badge = "positive";
    aiSummary =
      "Kar payı/temettü bildirimi. Yatırımcı ilgisini artırabilecek olumlu bir gelişme olabilir.";
  } else if (text.includes("sermaye artırımı") || text.includes("bedelsiz")) {
    score = 78;
    effect = "Önemli";
    badge = "important";
    aiSummary =
      "Sermaye artırımı bildirimi. Bedelli/bedelsiz detayına göre hisse üzerinde güçlü etki oluşturabilir.";
  } else if (text.includes("pay geri alım")) {
    score = 86;
    effect = "Pozitif";
    badge = "positive";
    aiSummary =
      "Pay geri alım bildirimi. Şirket yönetiminin hisseye güvenini gösterebilir ve pozitif algılanabilir.";
  } else if (text.includes("kredi derecelendirme")) {
    score = 70;
    effect = "Takip Edilmeli";
    badge = "watch";
    aiSummary =
      "Kredi derecelendirme bildirimi. Notun yönü ve görünüm değişikliği dikkatle incelenmelidir.";
  } else if (text.includes("genel kurul")) {
    score = 42;
    effect = "Nötr";
    badge = "neutral";
    aiSummary =
      "Genel kurul bildirimi. İçeriğinde temettü, sermaye veya yönetim değişikliği varsa önem kazanabilir.";
  } else if (text.includes("devre kesici")) {
    score = 30;
    effect = "Düşük Etki";
    badge = "low";
    aiSummary =
      "Pay bazında devre kesici bildirimi. Fiyat oynaklığına işaret eder ancak tek başına temel haber değildir.";
  } else if (text.includes("şirket genel bilgi formu")) {
    score = 18;
    effect = "Düşük Etki";
    badge = "low";
    aiSummary =
      "Şirket genel bilgi formu bildirimi. Genellikle teknik/güncelleme niteliğindedir.";
  } else if (text.includes("esas sözleşme")) {
    score = 45;
    effect = "Takip Edilmeli";
    badge = "watch";
    aiSummary =
      "Esas sözleşme değişikliği bildirimi. Değişikliğin içeriğine göre önem kazanabilir.";
  } else if (text.includes("halka arz")) {
    score = 75;
    effect = "Önemli";
    badge = "important";
    aiSummary =
      "Halka arz süreciyle ilgili bildirim. İlgili şirket ve sektör açısından takip edilmelidir.";
  }

  return {
    score,
    effect,
    badge,
    summary: aiSummary,
    reportTitle: subject || "KAP Bildirimi",
  };
}