import groq from './groq';

const DOCUMENT_MODEL = 'llama3-8b-8192';

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

async function tryExtractFromUrl(fileURL = '') {
  if (!fileURL) return '';

  try {
    const response = await fetch(fileURL);
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text') || contentType.includes('json') || contentType.includes('xml') || contentType.includes('html')) {
      const text = await response.text();
      return text.slice(0, 8000);
    }
  } catch (error) {
    console.error('Document URL extraction failed:', error);
  }

  return '';
}

export async function extractDocumentText({ extractedText, fileURL, documentTitle, issuingOrganization, description }) {
  if (extractedText && String(extractedText).trim()) {
    return String(extractedText).slice(0, 8000);
  }

  const urlText = await tryExtractFromUrl(fileURL);
  if (urlText) return urlText;

  return [
    `Document title: ${documentTitle || ''}`,
    `Issuing organization: ${issuingOrganization || ''}`,
    `Description: ${description || ''}`
  ].join('\n').slice(0, 8000);
}

export async function evaluateDocumentForSkill({ skill, text }) {
  try {
    const response = await groq.chat.completions.create({
      model: DOCUMENT_MODEL,
      temperature: 0.1,
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: 'Return strict JSON only. Evaluate skill relevance and document credibility.'
        },
        {
          role: 'user',
          content: `You are verifying whether a document proves a candidate's skill.\n\nSkill being verified: ${skill}\n\nExtracted document text:\n${text}\n\nDetermine:\n\n1. Is this document related to the specified skill?\n2. Is it a credible certificate or proof?\n\nReturn JSON:\n\n{\nrelevanceScore: number (0-10),\ncredibilityScore: number (0-10),\nreasoning: string\n}`
        }
      ]
    });

    const parsed = extractJsonObject(response?.choices?.[0]?.message?.content || '');
    const relevanceScore = clamp(Number(parsed?.relevanceScore ?? 0), 0, 10);
    const credibilityScore = clamp(Number(parsed?.credibilityScore ?? 0), 0, 10);

    return {
      relevanceScore,
      credibilityScore,
      score: relevanceScore + credibilityScore,
      reasoning: String(parsed?.reasoning || 'Document evaluated.').trim(),
      fallbackScoring: false
    };
  } catch (error) {
    console.error('Document evaluation failed:', error);
    return {
      relevanceScore: 4,
      credibilityScore: 4,
      score: 8,
      reasoning: 'AI document evaluation unavailable. Fallback scoring applied.',
      fallbackScoring: true
    };
  }
}
