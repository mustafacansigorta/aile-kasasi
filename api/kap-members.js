export default async function handler(req, res) {
  try {
    const username = process.env.KAP_USERNAME;
    const password = process.env.KAP_PASSWORD;
    const baseUrl = process.env.KAP_BASE_URL || "https://apigwdev.mkk.com.tr/api/vyk";

    if (!username || !password) {
      return res.status(500).json({
        success: false,
        error: "KAP_USERNAME veya KAP_PASSWORD eksik.",
      });
    }

    const basicToken = Buffer.from(`${username}:${password}`).toString("base64");

    const response = await fetch(`${baseUrl}/members`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${basicToken}`,
        Accept: "application/json",
      },
    });

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
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}