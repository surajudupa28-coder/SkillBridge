import OpenAI from "openai";

// Validate GROQ API key at module initialization
if (typeof window === 'undefined') {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('[GROQ Error] GROQ_API_KEY environment variable is not set. AI features will not work.');
  }
}

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export default groq;