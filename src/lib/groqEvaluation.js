import groq from './groq';

const EVAL_MODEL = 'llama3-8b-8192';

function extractJsonObject(text = '') {
  const cleaned = text.replace(/```json/gi, '```').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(cleaned.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

function fallbackTextScore(answer = '') {
  const len = String(answer || '').trim().length;
  if (len > 300) return 8;
  if (len > 180) return 6;
  if (len > 80) return 4;
  if (len > 20) return 2;
  return 0;
}

export async function evaluateScenarioAnswer({ skill, question, expectedConcepts = [], answer }) {
  try {
    const response = await groq.chat.completions.create({
      model: EVAL_MODEL,
      temperature: 0.1,
      max_tokens: 250,
      messages: [
        {
          role: 'system',
          content: 'Return strict JSON only. Evaluate strictly against the specified skill context and expected concepts.'
        },
        {
          role: 'user',
          content: `You are evaluating a candidate's answer for a skill verification test.\n\nSkill being verified: ${skill}\n\nScenario question:\n${question}\n\nExpected concepts:\n${JSON.stringify(expectedConcepts)}\n\nCandidate answer:\n${answer}\n\nEvaluate the answer based on understanding of the skill.\n\nReturn JSON:\n\n{\nscore: number (0-10),\nfeedback: string\n}`
        }
      ]
    });

    const parsed = extractJsonObject(response?.choices?.[0]?.message?.content || '');
    const score = clamp(Number(parsed?.score ?? 0), 0, 10);
    const feedback = String(parsed?.feedback || 'Scenario answer evaluated.').trim();

    return {
      score,
      feedback,
      fallbackScoring: false
    };
  } catch (error) {
    console.error('Scenario evaluation failed:', error);
    return {
      score: fallbackTextScore(answer),
      feedback: 'AI scenario evaluation unavailable. Fallback scoring applied.',
      fallbackScoring: true
    };
  }
}

export async function evaluateExplanationAnswer({ skill, question, answer }) {
  try {
    const response = await groq.chat.completions.create({
      model: EVAL_MODEL,
      temperature: 0.1,
      max_tokens: 250,
      messages: [
        {
          role: 'system',
          content: 'Return strict JSON only. Evaluate explanation quality specifically for the declared skill.'
        },
        {
          role: 'user',
          content: `You are evaluating a candidate explanation for a skill verification test.\n\nSkill being verified: ${skill}\n\nQuestion:\n${question}\n\nCandidate answer:\n${answer}\n\nEvaluate based on:\n\n* correctness of concept\n* clarity\n* depth of understanding\n\nReturn JSON:\n\n{\nscore: number (0-10),\nfeedback: string\n}`
        }
      ]
    });

    const parsed = extractJsonObject(response?.choices?.[0]?.message?.content || '');
    const score = clamp(Number(parsed?.score ?? 0), 0, 10);
    const feedback = String(parsed?.feedback || 'Explanation answer evaluated.').trim();

    return {
      score,
      feedback,
      fallbackScoring: false
    };
  } catch (error) {
    console.error('Explanation evaluation failed:', error);
    return {
      score: fallbackTextScore(answer),
      feedback: 'AI explanation evaluation unavailable. Fallback scoring applied.',
      fallbackScoring: true
    };
  }
}

export function calculateAiConfidenceScore(evaluations = []) {
  const list = Array.isArray(evaluations) ? evaluations : [];
  if (list.length === 0) return 0;

  const nonFallback = list.filter((e) => e && !e.fallbackScoring).length;
  const avgScore = list.reduce((sum, e) => sum + (Number(e?.score) || 0), 0) / list.length;

  const reliability = nonFallback / list.length;
  const quality = avgScore / 10;

  return clamp(Math.round((reliability * 0.7 + quality * 0.3) * 100), 0, 100);
}
