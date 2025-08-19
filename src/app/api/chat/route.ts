import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import { OpenAI } from "openai";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const systemPrompt = `
You are the Vegas Drones AI Assistant. You help customers understand pricing, logistics, booking, and safety.
Pricing rules:
- 1–100 drones: $90 per drone
- 101–300 drones: $75 per drone
- Travel fee: $2 per mile from Las Vegas
- Room fee: $150 per night
For more than 300 drones, instruct the user to email info@vegasdrones.com.
`;

export async function POST(req: Request) {
  const { message } = await req.json();

  const embeddings = new OpenAIEmbeddings();
  const queryEmbedding = await embeddings.embedQuery(message);

  const { data: matches } = await supabase.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: 3
  });

  const contextText = matches?.map((m: any) => m.content).join("\n\n") ?? "";

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "system", content: `Context from operations manual:\n\n${contextText}` },
      { role: "user", content: message }
    ]
  });

  return new Response(JSON.stringify({ reply: completion.choices[0].message?.content || "" }));
}
