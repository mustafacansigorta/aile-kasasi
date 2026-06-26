export default async function handler(req, res) {
  const apiKey = process.env.KAP_API_KEY;
  const clientId = process.env.KAP_CLIENT_ID;

  if (!apiKey || !clientId) {
    return res.status(500).json({
      success: false,
      error: "KAP_API_KEY veya KAP_CLIENT_ID eksik.",
    });
  }

  const tokenTests = [
    {
      name: "clientId-query",
      url: `https://apigwdev.mkk.com.tr/auth/generateToken?apiKey=${encodeURIComponent(apiKey)}&clientId=${encodeURIComponent(clientId)}`,
      headers: {},
    },
    {
      name: "client_id-query",
      url: `https://apigwdev.mkk.com.tr/auth/generateToken?apiKey=${encodeURIComponent(apiKey)}&client_id=${encodeURIComponent(clientId)}`,
      headers: {},
    },
    {
      name: "x-client-id-header",
      url: `https://apigwdev.mkk.com.tr/auth/generateToken?apiKey=${encodeURIComponent(apiKey)}`,
      headers: { "x-client-id": clientId },
    },
    {
      name: "X-IBM-Client-Id-header",
      url: `https://apigwdev.mkk.com.tr/auth/generateToken?apiKey=${encodeURIComponent(apiKey)}`,
      headers: { "X-IBM-Client-Id": clientId },
    },
    {
      name: "client_id-header",
      url: `https://apigwdev.mkk.com.tr/auth/generateToken?apiKey=${encodeURIComponent(apiKey)}`,
      headers: { "client_id": clientId },
    },
    {
      name: "api-vyk-token-clientId-query",
      url: `https://apigwdev.mkk.com.tr/api/vyk/auth/generateToken?apiKey=${encodeURIComponent(apiKey)}&clientId=${encodeURIComponent(clientId)}`,
      headers: {},
    },
  ];

  const results = [];

  for (const test of tokenTests) {
    const tokenResponse = await fetch(test.url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...test.headers,
      },
    });

    const tokenText = await tokenResponse.text();

    results.push({
      step: "token",
      name: test.name,
      status: tokenResponse.status,
      sample: tokenText.slice(0, 300),
    });

    if (!tokenResponse.ok) continue;

    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch {
      continue;
    }

    const token = tokenData.token;

    if (!token) continue;

    const memberTests = [
      {
        name: "Authorization-raw-token",
        headers: { Authorization: token },
      },
      {
        name: "Authorization-Bearer-token",
        headers: { Authorization: `Bearer ${token}` },
      },
      {
        name: "token-header",
        headers: { token },
      },
      {
        name: "x-access-token-header",
        headers: { "x-access-token": token },
      },
    ];

    for (const memberTest of memberTests) {
      const membersResponse = await fetch("https://apigwdev.mkk.com.tr/api/vyk/members", {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...memberTest.headers,
        },
      });

      const membersText = await membersResponse.text();

      results.push({
        step: "members",
        tokenMethod: test.name,
        memberMethod: memberTest.name,
        status: membersResponse.status,
        sample: membersText.slice(0, 300),
      });

      if (membersResponse.ok) {
        return res.status(200).json({
          success: true,
          tokenMethod: test.name,
          memberMethod: memberTest.name,
          data: JSON.parse(membersText),
        });
      }
    }
  }

  return res.status(401).json({
    success: false,
    message: "Client ID dahil test edildi ama başarılı yöntem bulunamadı.",
    results,
  });
}