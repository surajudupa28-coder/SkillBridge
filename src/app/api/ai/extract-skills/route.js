import { NextResponse } from 'next/server';
import openai from "@/lib/openai";

export async function POST(req) {
  try {
    const { roadmap } = await req.json();

    const completion = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "Extract key technical skills from a roadmap."
        },
        {
          role: "user",
          content: `
Extract important skills from this roadmap.

Return ONLY a JSON array.

Roadmap:
${roadmap}
`
        }
      ]
    });

    let skills;

    try {
      skills = JSON.parse(completion.choices[0].message.content);
    } catch {
      skills = [];
    }

    return NextResponse.json({ skills });
  } catch (error) {
    console.error("Skill extraction error:", error);
    return NextResponse.json({ skills: [] });
  }
}