export default async function handler(req, res) {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const response = await fetch(
      "https://www.kap.org.tr/tr/api/disclosure/members/byCriteria",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Referer: "https://www.kap.org.tr/tr/bildirim-sorgu",
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json",
        },
        body: JSON.stringify({
          fromDate: today,
          toDate: today,
          mkkMemberOidList: [],
          subjectList: [],
        }),
      }
    );

    const data = await response.json();

    return res.status(200).json({
      success: response.ok,
      status: response.status,
      date: today,
      count: Array.isArray(data) ? data.length : 0,
      data: Array.isArray(data) ? data.slice(0, 100) : [],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}