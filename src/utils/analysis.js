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

  if (text.includes("esas sözleşme") || text.includes("ana sözleşme")) {
  score = 35;
  effect = "Nötr";
  badge = "neutral";
  aiSummary =
    "Esas sözleşme bildirimi. Genellikle teknik veya yönetimsel niteliktedir; doğrudan güçlü fiyat etkisi beklenmez.";
} else if (text.includes("yeni iş ilişkisi")) {
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
export function classifyKap(item = {}) {
  const subject = item.subject || "";
  const summary = item.summary || "";
  const text = `${subject} ${summary}`.toLowerCase();

  if (text.includes("esas sözleşme") || text.includes("ana sözleşme")) {
  return "Esas Sözleşme";
}

if (text.includes("yeni iş ilişkisi")) {
  return "Yeni İş İlişkisi";
}

if (
  text.includes("satış sözleşmesi") ||
  text.includes("tedarik sözleşmesi") ||
  text.includes("iş sözleşmesi") ||
  text.includes("sözleşme imzalan")
) {
  return "Sözleşme / İş İlişkisi";
}

  if (text.includes("ihale")) {
    return "İhale";
  }

  if (text.includes("kar payı") || text.includes("temettü")) {
    if (text.includes("dağıtılmaması")) return "Kar Payı Dağıtılmaması";
    return "Kar Payı";
  }

  if (text.includes("pay geri alım")) {
    return "Pay Geri Alım";
  }

  if (text.includes("bedelsiz")) {
    return "Bedelsiz Sermaye Artırımı";
  }

  if (text.includes("bedelli")) {
    return "Bedelli Sermaye Artırımı";
  }

  if (text.includes("sermaye artırımı")) {
    return "Sermaye Artırımı";
  }

  if (text.includes("kredi derecelendirme")) {
    return "Kredi Derecelendirme";
  }

  if (text.includes("devre kesici")) {
    return "Devre Kesici";
  }

  if (text.includes("genel kurul")) {
    return "Genel Kurul";
  }

  if (text.includes("pay alım satım")) {
    return "Pay Alım Satım";
  }

  if (text.includes("halka arz")) {
    return "Halka Arz";
  }

  return "Diğer";
}

export function similarityScore(current = {}, past = {}) {
  let score = 0;

  const currentClass = classifyKap(current);
  const pastClass = classifyKap(past);

  if (currentClass === pastClass) score += 60;
  if (current.subject && current.subject === past.subject) score += 25;

  const currentStock = current.stockCodes || current.relatedStocks || "";
  const pastStock = past.stockCodes || past.relatedStocks || "";

  if (currentStock && pastStock && currentStock === pastStock) score += 15;

  return Math.min(score, 100);
}