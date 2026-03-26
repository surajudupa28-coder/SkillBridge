import groq from './groq';

/**
 * Evaluate an answer using AI
 */
export async function evaluateAnswer(question, answer) {
  try {
    if (!question || !answer || answer.trim().length === 0) {
      return {
        score: 0,
        feedback: 'Empty answer provided',
        fallbackScoring: true
      };
    }

    const response = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        {
          role: 'system',
          content: 'You are a strict skill evaluator. Evaluate the provided answer to the question on a scale of 0-10. Return your response in this exact format:\nScore: X/10\nFeedback: [Your brief explanation]'
        },
        {
          role: 'user',
          content: `Question: "${question}"\n\nAnswer: "${answer}"\n\nEvaluate this answer and provide a score out of 10.`
        }
      ],
      temperature: 0.3,
      max_tokens: 150
    });

    const content = response.choices[0].message.content || '';
    const scoreMatch = content.match(/Score:\s*(\d+)/i);
    const score = scoreMatch ? Math.min(Math.max(parseInt(scoreMatch[1], 10), 0), 10) : 5;
    const feedbackMatch = content.match(/Feedback:\s*(.+?)(?:\n|$)/i);
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : 'Evaluation completed';

    return {
      score,
      feedback,
      fallbackScoring: false
    };
  } catch (error) {
    console.error('Error evaluating answer:', error);
    // Fallback scoring
    const textLength = answer ? answer.trim().length : 0;
    let fallbackScore = 0;
    if (textLength > 200) fallbackScore = 8;
    else if (textLength > 100) fallbackScore = 6;
    else if (textLength > 30) fallbackScore = 4;
    else fallbackScore = 2;

    return {
      score: fallbackScore,
      feedback: 'AI evaluation unavailable. Score based on answer length.',
      fallbackScoring: true
    };
  }
}
