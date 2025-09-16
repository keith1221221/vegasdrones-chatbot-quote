// src/app/api/chat/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: true });
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as { messages?: ChatMessage[]; model?: string };
    const messages = body?.messages ?? [];
    const model = body?.model ?? "gpt-4o-mini"; // pick your preferred model

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "POST body must include { messages: ChatMessage[] }" },
        { status: 400 }
      );
    }

    // Call OpenAI via fetch (works on Edge or Node runtimes)
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2
      })
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      return NextResponse.json(
        { error: `OpenAI error (${resp.status})`, details: errText },
        { status: 500 }
      );
    }

    const data = await resp.json();
    const content =
      data?.choices?.[0]?.message?.content ?? "(no content returned)";

    return NextResponse.json({ reply: content });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Unhandled error", details: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
