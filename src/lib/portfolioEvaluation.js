import groq from './groq';

const PORTFOLIO_MODEL = 'llama3-8b-8192';

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

function fallbackPortfolioScore({ skill, description, repoDetails, techStack }) {
  const text = `${description || ''} ${repoDetails || ''} ${(techStack || []).join(' ')}`.toLowerCase();
  const skillKey = String(skill || '').toLowerCase();
  let score = 8;
  if (text.includes(skillKey)) score += 10;
  if ((description || '').length > 80) score += 5;
  if (Array.isArray(techStack) && techStack.length >= 2) score += 5;
  if ((repoDetails || '').length > 10) score += 2;
  return clamp(score, 0, 30);
}

export async function evaluatePortfolioForSkill({ skill, description, repoDetails, techStack }) {
  try {
    const response = await groq.chat.completions.create({
      model: PORTFOLIO_MODEL,
      temperature: 0.1,
      max_tokens: 250,
      messages: [
        {
          role: 'system',
          content: 'Return strict JSON only. Score based on evidence of the specific skill.'
        },
        {
          role: 'user',
          content: `You are evaluating a technical portfolio submitted for skill verification.\n\nSkill being verified: ${skill}\n\nProject description:\n${description}\n\nGitHub repository details:\n${repoDetails}\n\nTechnologies used:\n${JSON.stringify(techStack || [])}\n\nEvaluate whether this portfolio demonstrates the specified skill.\n\nReturn JSON:\n\n{\nscore: number (0-30),\nfeedback: string\n}`
        }
      ]
    });

    const parsed = extractJsonObject(response?.choices?.[0]?.message?.content || '');
    return {
      score: clamp(Number(parsed?.score ?? 0), 0, 30),
      feedback: String(parsed?.feedback || 'Portfolio evaluated.').trim(),
      fallbackScoring: false
    };
  } catch (error) {
    console.error('Portfolio evaluation failed:', error);
    return {
      score: fallbackPortfolioScore({ skill, description, repoDetails, techStack }),
      feedback: 'AI portfolio evaluation unavailable. Fallback scoring applied.',
      fallbackScoring: true
    };
  }
}
