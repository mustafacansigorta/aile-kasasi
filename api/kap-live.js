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

    const keywords = [
      "Bildirim",
      "disclosure",
      "disclosures",
      "company",
      "stock",
      "kap",
      "pageProps",
      "__NEXT_DATA__",
      "announcement",
      "material",
      "search",
      "api",
    ];

    const found = keywords.map((word) => ({
      word,
      count: (html.match(new RegExp(word, "gi")) || []).length,
      firstIndex: html.toLowerCase().indexOf(word.toLowerCase()),
      sample:
        html.toLowerCase().indexOf(word.toLowerCase()) >= 0
          ? html.slice(
              Math.max(0, html.toLowerCase().indexOf(word.toLowerCase()) - 200),
              html.toLowerCase().indexOf(word.toLowerCase()) + 500
            )
          : null,
    }));

    return res.status(200).json({
      success: true,
      status: response.status,
      htmlLength: html.length,
      found,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}