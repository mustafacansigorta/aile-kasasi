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

    const headers = {
      Authorization: `Basic ${basicToken}`,
      Accept: "application/json",
    };

    const lastRes = await fetch(`${baseUrl}/lastDisclosureIndex`, {
      method: "GET",
      headers,
    });

    const lastText = await lastRes.text();

    if (!lastRes.ok) {
      return res.status(lastRes.status).json({
        success: false,
        step: "lastDisclosureIndex",
        raw: lastText,
      });
    }

    const lastData = JSON.parse(lastText);
    const lastIndex = Number(lastData.lastDisclosureIndex);

    const startIndex = Math.max(lastIndex - 50, 1);

    const disclosuresRes = await fetch(
      `${baseUrl}/disclosures?disclosureIndex=${startIndex}`,
      {
        method: "GET",
        headers,
      }
    );

    const disclosuresText = await disclosuresRes.text();

    let disclosuresData;
    try {
      disclosuresData = JSON.parse(disclosuresText);
    } catch {
      disclosuresData = disclosuresText;
    }

    return res.status(disclosuresRes.status).json({
      success: disclosuresRes.ok,
      status: disclosuresRes.status,
      lastIndex,
      startIndex,
      count: Array.isArray(disclosuresData) ? disclosuresData.length : null,
      data: disclosuresData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}