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

    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      return response.status(500).json({ error: "GEMINI_API_KEY is not configured" });
    }

    const geminiMessages = messages.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`,
      {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: system || "" }],
        },
        contents: geminiMessages,
        generationConfig: {
          maxOutputTokens: 400,
        },
      }),
      },
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      return response.status(geminiResponse.status).json({ error: errorText });
    }

    const data = await geminiResponse.json();
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();

    if (!text) {
      return response.status(502).json({ error: "AI response was empty" });
    }

    response.setHeader("Access-Control-Allow-Origin", "*");
    return response.status(200).json({
      content: [{ type: "text", text }],
    });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
};
