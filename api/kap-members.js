export default async function handler(req, res) {
  try {
    const apiKey = process.env.KAP_API_KEY;
    const baseUrl = process.env.KAP_BASE_URL;

    if (!apiKey || !baseUrl) {
      return res.status(500).json({
        success: false,
        error: "KAP_API_KEY veya KAP_BASE_URL eksik.",
      });
    }

    const response = await fetch(`${baseUrl}/members`, {
      method: "GET",
      headers: {
        Authorization: apiKey,
        Accept: "application/json",
      },
    });

    const text = await response.text();

    return res.status(response.status).json({
      success: response.ok,
      status: response.status,
      raw: text,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}