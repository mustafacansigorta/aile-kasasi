export default async function handler(req, res) {
  try {
    const { subject = "", days = "180" } = req.query;

    if (!subject) {
      return res.status(400).json({
        success: false,
        error: "subject parametresi eksik.",
      });
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - Number(days));

    const formatDate = (date) => date.toISOString().slice(0, 10);

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
          fromDate: formatDate(startDate),
          toDate: formatDate(endDate),
          mkkMemberOidList: [],
          subjectList: [],
        }),
      }
    );

    const data = await response.json();

    const normalizedSubject = subject.toLowerCase();

    const similar = Array.isArray(data)
      ? data
          .filter((item) =>
            String(item.subject || "")
              .toLowerCase()
              .includes(normalizedSubject)
          )
          .slice(0, 50)
      : [];

    return res.status(200).json({
      success: true,
      subject,
      days: Number(days),
      count: similar.length,
      data: similar,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}