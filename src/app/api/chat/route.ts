import { OpenAI } from "openai";
console.log("DEBUG:", {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
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

export async function POST(req: Request) {
  const { message } = await req.json();

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ]
  });

  const reply = completion.choices?.[0]?.message?.content || "";
  return new Response(JSON.stringify({ reply }));
}
