import { OpenAI } from "openai";
import { createClient } from "@supabase/supabase-js";

console.log("DEBUG:", {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
});

// System prompt with your pricing rules built in
const systemPrompt = `
You are the Vegas Drones AI Assistant. You help customers understand pricing, logistics, booking, and safety.
Pricing rules:
- 1–100 drones: $90 per drone
- 101–300 drones: $75 per drone
- Travel fee: $2 per mile from Las Vegas
- Room fee: $150 per night
For more than 300 drones, instruct the user to email info@vegasdrones.com.
`;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export async function POST(req: Request) {
  const { message } = await req.json();

  // Validate message
  if (!message || typeof message !== "string") {
    return new Response(JSON.stringify({ error: "Invalid message" }), {
      status: 400,
    });
  }

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // Get OpenAI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices?.[0]?.message?.content || "";

    // Store chat data in Supabase
    const { error } = await supabase.from("chat_logs").insert([
      {
        message,
        reply,
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error);
      // Don't fail the response due to Supabase error
    } else {
      console.log("Chat logged to Supabase:", { message, reply });
    }

    // Send postMessage to parent window (for video playback)
    if (typeof window !== "undefined") {
      window.parent.postMessage("responding", "*");
      setTimeout(() => window.parent.postMessage("idle", "*"), 2000);
    }

    return new Response(JSON.stringify({ reply }));
  } catch (error) {
    console.error("OpenAI error:", error);
    return new Response(JSON.stringify({ error: "Failed to process message" }), {
      status: 500,
    });
  }
}