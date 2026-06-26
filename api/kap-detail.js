export default async function handler(req, res) {
  try {
    const username = process.env.KAP_USERNAME;
    const password = process.env.KAP_PASSWORD;
    const baseUrl =
      process.env.KAP_BASE_URL || "https://apigwdev.mkk.com.tr/api/vyk";

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "id parametresi eksik.",
      });
    }

    const basic = Buffer.from(`${username}:${password}`).toString("base64");

    const response = await fetch(
      `${baseUrl}/disclosureDetail/${id}?fileType=data`,
      {
        headers: {
          Authorization: `Basic ${basic}`,
          Accept: "application/json",
        },
      }
    );

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    res.status(response.status).json({
      success: response.ok,
      status: response.status,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}