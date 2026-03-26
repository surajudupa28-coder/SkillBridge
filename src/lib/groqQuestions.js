import groq from './groq';
import { getQuestionsForSkill } from './questionBank';

const QUESTION_MODELS = [
  process.env.GROQ_QUESTION_MODEL,
  'llama3-8b-8192',
  'llama-3.1-8b-instant'
].filter(Boolean);

function extractJsonArray(text = '') {
  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');

  if (start === -1 || end === -1) return null;

  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch (err) {
    console.error('[Groq] JSON parse error:', err);
    return null;
  }
}

function normalizeFallbackQuestions(skill) {
  const fallback = getQuestionsForSkill(skill);
  return {
    mcq: (fallback.mcq || []).slice(0, 10).map((q, idx) => ({
      question: q.question,
      options: Array.isArray(q.options) ? q.options.slice(0, 4) : [],
      correctAnswer: Number.isInteger(q.correct) ? q.correct : 0,
      questionNumber: idx + 1,
      questionType: 'mcq',
      difficulty: q.difficulty || 'medium'
    })),
    scenario: (fallback.scenario || []).slice(0, 2).map((q, idx) => ({
      question: q.question,
      expectedConcepts: [q.rubric].filter(Boolean),
      questionNumber: 11 + idx,
      questionType: 'scenario'
    })),
    explanation: (fallback.explanation || []).slice(0, 1).map((q, idx) => ({
      question: q.question,
      expectedConcepts: [q.rubric].filter(Boolean),
      questionNumber: 13 + idx,
      questionType: 'explanation'
    })),
    totalQuestions: 13,
    timeLimit: 1800,
    skillName: skill,
    source: 'fallback-question-bank'
  };
}

function normalizeGroqQuestions(questionsArray, skill) {
  if (!Array.isArray(questionsArray)) {
    throw new Error('Groq response must be a JSON array of questions');
  }

  const normalizedMcq = questionsArray
    .map((q) => {
      const question = String(q?.question || q?.text || '').trim();
      const rawOptions = Array.isArray(q?.options) ? q.options : [];
      const options = rawOptions
        .map((opt) => (typeof opt === 'string' ? opt : opt?.text || opt?.option || ''))
        .map((opt) => String(opt || '').trim())
        .filter(Boolean)
        .slice(0, 4);

      if (!question || options.length < 4) {
        return null;
      }

      const rawCorrect = q?.correctAnswer ?? q?.answer ?? q?.correct;
      let correctIndex = -1;

      if (typeof rawCorrect === 'number') {
        correctIndex = rawCorrect;
      } else {
        const rawCorrectText = String(rawCorrect || '').trim();
        const asNumber = Number(rawCorrectText);
        if (!Number.isNaN(asNumber)) {
          correctIndex = asNumber;
        } else {
          correctIndex = options.indexOf(rawCorrectText);
        }
      }

      return {
        question,
        options,
        correctAnswer: correctIndex >= 0 && correctIndex < 4 ? correctIndex : 0,
        questionType: 'mcq',
        difficulty: q?.difficulty || 'medium'
      };
    })
    .filter(Boolean)
    .map((q, idx) => {
      return {
        ...q,
        questionNumber: idx + 1,
        questionType: 'mcq'
      };
    })
    .slice(0, 10);

  if (normalizedMcq.length < 10) {
    throw new Error(`Groq returned only ${normalizedMcq.length} valid questions, expected 10`);
  }

  // For scenarios and explanations, we'll use fallback for now to ensure stability
  // These are more complex for LLMs to generate consistently
  const fallback = getQuestionsForSkill(skill);
  const scenarios = (fallback.scenario || []).slice(0, 2).map((q, idx) => ({
    question: q.question,
    expectedConcepts: [q.rubric].filter(Boolean),
    questionNumber: 11 + idx,
    questionType: 'scenario'
  }));

  const explanations = (fallback.explanation || []).slice(0, 1).map((q, idx) => ({
    question: q.question,
    expectedConcepts: [q.rubric].filter(Boolean),
    questionNumber: 13 + idx,
    questionType: 'explanation'
  }));

  console.log(`[Groq] Normalized: ${normalizedMcq.length} MCQ + ${scenarios.length} scenario + ${explanations.length} explanation`);

  return {
    mcq: normalizedMcq,
    scenario: scenarios,
    explanation: explanations,
    totalQuestions: normalizedMcq.length + scenarios.length + explanations.length,
    timeLimit: 1800,
    skillName: skill,
    source: 'groq-with-fallback'
  };
}

export async function generateSkillQuestions(skill) {
  const normalizedSkill = String(skill || '').trim();
  if (!normalizedSkill) {
    throw new Error('Skill is required for question generation');
  }

  const fallbackQuestions = normalizeFallbackQuestions(normalizedSkill);

  try {
    // Validate Groq API key
    if (!process.env.GROQ_API_KEY) {
      console.warn('[Groq] GROQ_API_KEY not set. Using fallback questions.');
      return fallbackQuestions;
    }

    console.log(`[Groq] Generating MCQ questions for skill: ${normalizedSkill}`);

    const prompt = `Generate exactly 10 multiple-choice questions for the skill "${normalizedSkill}".

Return ONLY a JSON array.

Each item must contain:
- question (string)
- options (array of 4 strings)
- correctAnswer (index number 0-3)

Example:
[
  {
    "question": "What does HTML stand for?",
    "options": ["Hyper Text Markup Language","High Text Machine Language","Hyper Tool Multi Language","None"],
    "correctAnswer": 0
  }
]

Rules:
- No markdown
- No explanations
- No text outside JSON
- Exactly 10 questions`;

    let lastError = null;
    for (const model of QUESTION_MODELS) {
      try {
        console.log(`[Groq] Using model: ${model}`);
        const completion = await Promise.race([
          groq.chat.completions.create({
            model,
            temperature: 0.7,
            max_tokens: 3000,
            messages: [
              {
                role: 'system',
                content: 'You are an expert technical interviewer. Output strict JSON only with no markdown and no extra text.'
              },
              {
                role: 'user',
                content: prompt
              }
            ]
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('[Groq] Request timeout after 30 seconds')), 30000)
          )
        ]);

        if (!completion?.choices?.[0]?.message?.content) {
          throw new Error('[Groq] Empty response from API');
        }

        const content = completion.choices[0].message.content.trim();
        console.log('[Groq] raw response:', completion.choices[0].message.content);

        const questions = extractJsonArray(content);
        if (!questions) {
          throw new Error('[Groq] Could not parse JSON response');
        }

        console.log('[Groq] parsed questions:', questions);

        const normalized = normalizeGroqQuestions(questions, normalizedSkill);
        if (normalized.mcq.length < 10) {
          throw new Error(`[Groq] Parsed fewer than 10 valid questions (${normalized.mcq.length})`);
        }

        console.log(`[Groq] ✓ Successfully generated ${normalized.mcq.length} MCQ questions from Groq`);
        return normalized;
      } catch (modelError) {
        lastError = modelError;
        console.warn(`[Groq] Model ${model} failed:`, modelError?.message || modelError);
      }
    }

    throw lastError || new Error('[Groq] All model attempts failed');
  } catch (error) {
    const errorMsg = error?.message || String(error);
    console.error(`[Groq Error] ${errorMsg}`);
    console.warn(`[Groq] Falling back to local question bank for skill: ${normalizedSkill}`);
    return fallbackQuestions;
  }
}
