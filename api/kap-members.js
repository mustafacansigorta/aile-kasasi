export default async function handler(req, res) {
  const apiKey = process.env.KAP_API_KEY;
  const baseUrl = "https://apigwdev.mkk.com.tr/api/vyk";

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: "KAP_API_KEY eksik.",
    });
  }

  const tests = [
    {
      name: "apiKey-header",
      url: `${baseUrl}/members`,
      headers: { apiKey },
    },
    {
      name: "x-api-key-header",
      url: `${baseUrl}/members`,
      headers: { "x-api-key": apiKey },
    },
    {
      name: "X-API-KEY-header",
      url: `${baseUrl}/members`,
      headers: { "X-API-KEY": apiKey },
    },
    {
      name: "Authorization-Bearer",
      url: `${baseUrl}/members`,
      headers: { Authorization: `Bearer ${apiKey}` },
    },
    {
      name: "Authorization-raw",
      url: `${baseUrl}/members`,
      headers: { Authorization: apiKey },
    },
    {
      name: "query-apiKey",
      url: `${baseUrl}/members?apiKey=${encodeURIComponent(apiKey)}`,
      headers: {},
    },
  ];

  const results = [];

  for (const test of tests) {
    const response = await fetch(test.url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...test.headers,
      },
    });

    const text = await response.text();

    results.push({
      name: test.name,
      status: response.status,
      success: response.ok,
      sample: response.ok ? text.slice(0, 500) : text.slice(0, 200),
    });

    if (response.ok) {
      return res.status(200).json({
        success: true,
        workingMethod: test.name,
        data: JSON.parse(text),
      });
    }
  }

  return res.status(401).json({
    success: false,
    message: "Hiçbir auth yöntemi çalışmadı.",
    results,
  });
}