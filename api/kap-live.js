export default async function handler(req, res) {
  try {
    const response = await fetch("https://www.kap.org.tr/tr/api/disclosures", {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
    });

    const data = await response.json();

    return res.status(200).json({
      success: true,
      status: response.status,
      count: Array.isArray(data) ? data.length : 0,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}