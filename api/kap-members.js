export default async function handler(req, res) {
  try {
    const apiKey = process.env.KAP_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "KAP_API_KEY eksik.",
      });
    }

    const tokenUrl = `https://apigwdev.mkk.com.tr/auth/generateToken?apiKey=${encodeURIComponent(
      apiKey
    )}`;

    const tokenResponse = await fetch(tokenUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const tokenText = await tokenResponse.text();

    if (!tokenResponse.ok) {
      return res.status(tokenResponse.status).json({
        success: false,
        step: "generateToken",
        status: tokenResponse.status,
        tokenUrl,
        raw: tokenText,
      });
    }

    const tokenData = JSON.parse(tokenText);
    const token = tokenData.token;

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