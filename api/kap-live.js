export default async function handler(req, res) {
  try {
    const response = await fetch("https://www.kap.org.tr/tr/bildirim-sorgu", {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const html = await response.text();

    const patterns = [
      "disclosureIndex",
      "disclosureId",
      "disclosureOid",
      "disclosureType",
      "publishDate",
      "publishDateTime",
      "summary",
      "subject",
      "memberTitle",
      "stockCodes",
      "kapMemberTitle",
      "Bildirim İçeriği",
      "Özel Durum",
      "Yeni İş İlişkisi",
    ];

    const results = patterns.map((word) => {
      const lower = html.toLowerCase();
      const index = lower.indexOf(word.toLowerCase());

      return {
        word,
        count: (html.match(new RegExp(word, "gi")) || []).length,
        firstIndex: index,
        sample:
          index >= 0
            ? html.slice(Math.max(0, index - 500), index + 1500)
            : null,
      };
    });

    return res.status(200).json({
      success: true,
      status: response.status,
      htmlLength: html.length,
      results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}