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

    const matches = [...html.matchAll(/\/tr\/Bildirim\/(\d+)/g)];

    const ids = [...new Set(matches.map((m) => m[1]))];

    return res.status(200).json({
      success: true,
      status: response.status,
      htmlLength: html.length,
      foundCount: ids.length,
      ids: ids.slice(0, 30),
      sample: html.slice(0, 1000),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}