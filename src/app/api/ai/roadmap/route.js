import { NextResponse } from 'next/server';
import openai from "@/lib/openai";

export async function POST(req) {
  try {
    const body = await req.json();
    const { skills, goal } = body;

    if (!goal) {
      return NextResponse.json({ error: "Goal is required" }, { status: 400 });
    }

    const skillText = Array.isArray(skills) ? skills.join(", ") : skills;

    const completion = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are an expert career mentor generating structured learning roadmaps in JSON format."
        },
        {
          role: "user",
          content: `
User already knows these skills:
${skillText}

Target goal:
${goal}

DO NOT include topics that the user already knows.

Generate a roadmap ONLY for missing skills required to achieve the goal.

Return ONLY valid JSON with this exact structure:

{
  "topics": [
    {
      "title": "Topic name",
      "prerequisites": ["prerequisite 1"],
      "estimatedTime": "1-2 weeks",
      "checklist": ["item 1", "item 2"]
    }
  ]
}

Create 5-8 topics. Be specific with learning time estimates and concrete checklist items. Focus only on skills the user does NOT yet have.
`
        }
      ]
    });

    let roadmapContent = completion.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    if (roadmapContent.startsWith("```json")) {
      roadmapContent = roadmapContent.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (roadmapContent.startsWith("```")) {
      roadmapContent = roadmapContent.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    // Parse and validate JSON
    let roadmap;
    try {
      roadmap = JSON.parse(roadmapContent);
      
      // Validate structure
      if (!roadmap.topics || !Array.isArray(roadmap.topics)) {
        throw new Error("Invalid roadmap structure");
      }
      
      // Ensure all required fields exist
      roadmap.topics = roadmap.topics.map(topic => ({
        title: topic.title || "Untitled Topic",
        prerequisites: Array.isArray(topic.prerequisites) ? topic.prerequisites : [],
        estimatedTime: topic.estimatedTime || "1-2 weeks",
        checklist: Array.isArray(topic.checklist) ? topic.checklist : []
      }));
      
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", roadmapContent);
      // Return a fallback roadmap
      roadmap = {
        topics: [
          {
            title: "Fundamentals",
            prerequisites: [],
            estimatedTime: "1-2 weeks",
            checklist: ["Complete introductory material", "Practice basic exercises"]
          }
        ]
      };
    }

    return NextResponse.json({ roadmap });

  } catch (error) {
    console.error("Roadmap error:", error);
    return NextResponse.json(
      { error: "Unable to generate roadmap" },
      { status: 500 }
    );
  }
}
