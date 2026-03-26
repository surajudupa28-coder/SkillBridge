import { NextResponse } from 'next/server';
import groq from "@/lib/groq";

export async function POST(req) {
  try {
    const body = await req.json();
    const message = body?.message?.trim();

    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are an AI mentor inside SkillBridge. Help users improve skills and choose learning paths. Keep answers short and practical.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const reply = response.choices?.[0]?.message?.content?.trim() || "";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("AI chat error:", error);

    return NextResponse.json(
      { error: "Unable to process chat request right now" },
      { status: 500 }
    );
  }
}