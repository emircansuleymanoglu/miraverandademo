module.exports = async function handler(request, response) {
  if (request.method === "OPTIONS") {
    return response.status(204).setHeader("Access-Control-Allow-Origin", "*").end();
  }

  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages, system } = request.body || {};

    if (!messages || !Array.isArray(messages)) {
      return response.status(400).json({ error: "Gecersiz istek" });
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!anthropicKey) {
      return response.status(500).json({ error: "ANTHROPIC_API_KEY is not configured" });
    }

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 400,
        system,
        messages,
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      return response.status(anthropicResponse.status).json({ error: errorText });
    }

    const data = await anthropicResponse.json();

    response.setHeader("Access-Control-Allow-Origin", "*");
    return response.status(200).json(data);
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
};
