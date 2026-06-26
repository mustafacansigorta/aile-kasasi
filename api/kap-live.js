export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://www.kap.org.tr/tr/api/disclosure/members/byCriteria",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Referer": "https://www.kap.org.tr/tr/bildirim-sorgu",
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          fromDate: "2026-06-20",
          toDate: "2026-06-26",
          mkkMemberOidList: [],
          subjectList: [],
        }),
      }
    );

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return res.status(response.status).json({
      success: response.ok,
      status: response.status,
      count: Array.isArray(data) ? data.length : null,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}