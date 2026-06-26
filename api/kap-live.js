export default async function handler(req, res) {
  try {
    const response = await fetch("https://www.kap.org.tr/tr", {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const html = await response.text();

    return res.status(200).json({
      success: response.ok,
      status: response.status,
      length: html.length,
      sample: html.slice(0, 1000),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}