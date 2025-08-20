import { OpenAI } from "openai";

console.log("DEBUG: Environment Variables", {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "Set" : "Not set",
  OPENAI_API_KEY_FALLBACK: process.env.OPENAI_API_KEY_FALLBACK ? "Set" : "Not set",
});

const systemPrompt = `
You are the Vegas Drones AI Assistant. You help customers understand pricing, logistics, booking, and safety.
Pricing rules:
- 1–100 drones: $90 per drone
- 101–300 drones: $75 per drone
- Travel fee: $2 per mile from Las Vegas
- Room fee: $150 per night
For more than 300 drones, instruct the user to email info@vegasdrones.com.
`;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: Request) {
  console.log("DEBUG: POST request received");
  let message;
  try {
    const body = await req.json();
    message = body.message;
    console.log("DEBUG: Request body", { message });
  } catch (error) {
    console.error("DEBUG: Error parsing request body", error);
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Access-Control-Allow-Origin": "https://vegasdrones.com" },
    });
  }

  if (!message || typeof message !== "string") {
    console.error("DEBUG: Invalid message", { message });
    return new Response(JSON.stringify({ error: "Invalid message" }), {
      status: 400,
      headers: { "Access-Control-Allow-Origin": "https://vegasdrones.com" },
    });
  }

  if (!process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY_FALLBACK) {
    console.error("DEBUG: No OpenAI API keys set");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "https://vegasdrones.com" },
    });
  }

  const tryOpenAI = async (apiKey: string, retries = 3, backoff = 1000) => {
    console.log("DEBUG: Attempting OpenAI request with key", apiKey.slice(0, 4) + "...");
    const openai = new OpenAI({ apiKey });
    for (let i = 0; i < retries; i++) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
        });
        console.log("DEBUG: OpenAI response received");
        return completion.choices?.[0]?.message?.content || "";
      } catch (error: any) {
        console.error("DEBUG: OpenAI error", {
          attempt: i + 1,
          error: error.message,
          status: error.response?.status,
        });
        if (error.response?.status === 429 && i < retries - 1) {
          console.warn(`DEBUG: Rate limit hit, retrying in ${backoff}ms...`);
          await delay(backoff);
          backoff *= 2;
          continue;
        }
        throw error;
      }
    }
    throw new Error("Max retries reached");
  };

  try {
    let reply = "";
    try {
      reply = await tryOpenAI(process.env.OPENAI_API_KEY!);
    } catch (error) {
      if (process.env.OPENAI_API_KEY_FALLBACK) {
        console.log("DEBUG: Retrying with fallback API key");
        reply = await tryOpenAI(process.env.OPENAI_API_KEY_FALLBACK);
      } else {
        throw error;
      }
    }

    console.log("DEBUG: Sending response", { reply: reply.slice(0, 50) + "..." });
    if (typeof window !== "undefined") {
      window.parent.postMessage("responding", "*");
      setTimeout(() => window.parent.postMessage("idle", "*"), 2000);
    }

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { "Access-Control-Allow-Origin": "https://vegasdrones.com" },
    });
  } catch (error: any) {
    console.error("DEBUG: Final error", { error: error.message });
    return new Response(JSON.stringify({ error: "Failed to process message" }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "https://vegasdrones.com" },
    });
  }
}

export async function OPTIONS() {
  console.log("DEBUG: OPTIONS request received");
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "https://vegasdrones.com",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}