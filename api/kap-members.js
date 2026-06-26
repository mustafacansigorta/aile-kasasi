export default async function handler(req, res) {
  try {
    const apiKey = process.env.KAP_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "KAP_API_KEY eksik.",
      });
    }

    // 1. Önce token alıyoruz
    const tokenResponse = await fetch(
      `https://apigwdev.mkk.com.tr/auth/generateToken?apiKey=${apiKey}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

    const tokenText = await tokenResponse.text();

    if (!tokenResponse.ok) {
      return res.status(tokenResponse.status).json({
        success: false,
        step: "generateToken",
        status: tokenResponse.status,
        raw: tokenText,
      });
    }

    let tokenData;

    try {
      tokenData = JSON.parse(tokenText);
    } catch {
      return res.status(500).json({
        success: false,
        step: "parseToken",
        raw: tokenText,
      });
    }

    const token = tokenData.token;

    if (!token) {
      return res.status(500).json({
        success: false,
        step: "missingToken",
        tokenData,
      });
    }

    // 2. Token ile şirket listesini çekiyoruz
    const membersResponse = await fetch(
      "https://apigwdev.mkk.com.tr/api/vyk/members",
      {
        method: "GET",
        headers: {
          Authorization: token,
          Accept: "application/json",
        },
      }
    );

    const membersText = await membersResponse.text();

    let membersData;

    try {
      membersData = JSON.parse(membersText);
    } catch {
      membersData = membersText;
    }

    return res.status(membersResponse.status).json({
      success: membersResponse.ok,
      status: membersResponse.status,
      count: Array.isArray(membersData) ? membersData.length : null,
      data: membersData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}