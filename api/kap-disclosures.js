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

    const authHeaders = {
      Authorization: `Basic ${basicToken}`,
      Accept: "application/json",
    };

    // 1. Son bildirim indexini al
    const lastIndexResponse = await fetch(`${baseUrl}/lastDisclosureIndex`, {
      method: "GET",
      headers: authHeaders,
    });

    const lastIndexText = await lastIndexResponse.text();

    if (!lastIndexResponse.ok) {
      return res.status(lastIndexResponse.status).json({
        success: false,
        step: "lastDisclosureIndex",
        raw: lastIndexText,
      });
    }

    const lastIndexData = JSON.parse(lastIndexText);
    const lastIndex = Number(lastIndexData.lastDisclosureIndex);

    if (!lastIndex) {
      return res.status(500).json({
        success: false,
        error: "lastDisclosureIndex alınamadı.",
        data: lastIndexData,
      });
    }

    // 2. Son 50 bildirim için geriye doğru başlangıç indexi
    const startIndex = Math.max(lastIndex - 50, 1);

    const disclosuresUrl =
      `${baseUrl}/disclosures?disclosureIndex=${startIndex}`;

    const disclosuresResponse = await fetch(disclosuresUrl, {
      method: "GET",
      headers: authHeaders,
    });

    const disclosuresText = await disclosuresResponse.text();

    let disclosuresData;
    try {
      disclosuresData = JSON.parse(disclosuresText);
    } catch {
      disclosuresData = disclosuresText;
    }

    return res.status(disclosuresResponse.status).json({
      success: disclosuresResponse.ok,
      status: disclosuresResponse.status,
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