import OpenAI from "openai";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

const systemPrompt = `
You are the Vegas Drones AI Assistant.

Pricing:
- 1–100 drones: $90 per drone
- 101–300 drones: $75 per drone
- For >300 drones: ask the user to email info@vegasdrones.com for a custom quote.
- Ask if they’re a nonprofit or municipality; if yes, apply a 5% discount to totals.
- Do NOT add travel or hotel fees.
- We need a launch pad about the size of a basketball court.
- Safety radiuses must follow FAA guidance; advise that a map/survey is required.
- Generous refund policy; only the initial deposit is charged up front.

Behavior:
- Be concise and friendly.
- If you use context from docs, weave it into the answer—don’t just paste.
`;

async function fetchContext(query: string): Promise<string> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return "";
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const embeddingRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    const queryEmbedding = embeddingRes.data[0]?.embedding;
    if (!queryEmbedding) return "";

    const { data, error } = await supabase.rpc("match_documents", {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: 4,
    });

    if (error || !data) return "";
    return (data as Array<{ content: string }>).map((d) => d.content).join("\n\n");
  } catch {
    return "";
  }
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const contextText = await fetchContext(message);

    const messages: Array<{ role: "system" | "user"; content: string }> = [
      { role: "system", content: systemPrompt },
    ];
    if (contextText) {
      messages.push({ role: "system", content: `Relevant context (may be partial):\n\n${contextText}` });
    }
    messages.push({ role: "user", content: message });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.3,
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn’t generate a response just now.";

    return Response.json({ reply });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Chat failed to respond." }), { status: 500 });
  }
}