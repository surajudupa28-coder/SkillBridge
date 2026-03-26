import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SkillVerification from '@/models/SkillVerification';
import SkillTestAttempt from '@/models/SkillTestAttempt';
import { getAuthUser } from '@/lib/auth';
import { generateSkillQuestions } from '@/lib/groqQuestions';

function flattenQuestionsForAttempt(questions) {
  return [
    ...(questions.mcq || []).map((q) => ({
      questionNumber: q.questionNumber,
      questionType: 'mcq',
      question: q.question,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      difficulty: q.difficulty || 'medium'
    })),
    ...(questions.scenario || []).map((q) => ({
      questionNumber: q.questionNumber,
      questionType: 'scenario',
      question: q.question,
      expectedConcepts: q.expectedConcepts || []
    })),
    ...(questions.explanation || []).map((q) => ({
      questionNumber: q.questionNumber,
      questionType: 'explanation',
      question: q.question,
      expectedConcepts: q.expectedConcepts || []
    }))
  ];
}

function formatStoredQuestionsForClient(storedQuestions = [], skillName) {
  const ordered = [...storedQuestions].sort((a, b) => a.questionNumber - b.questionNumber);
  const mcq = ordered
    .filter((q) => q.questionType === 'mcq')
    .map((q) => ({
      questionNumber: q.questionNumber,
      questionType: 'mcq',
      question: q.question,
      options: q.options || [],
      difficulty: q.difficulty
    }));

  const scenario = ordered
    .filter((q) => q.questionType === 'scenario')
    .map((q) => ({
      questionNumber: q.questionNumber,
      questionType: 'scenario',
      question: q.question,
      expectedConcepts: q.expectedConcepts || []
    }));

  const explanation = ordered
    .filter((q) => q.questionType === 'explanation')
    .map((q) => ({
      questionNumber: q.questionNumber,
      questionType: 'explanation',
      question: q.question,
      expectedConcepts: q.expectedConcepts || []
    }));

  return {
    mcq,
    scenario,
    explanation,
    totalQuestions: ordered.length || 13,
    timeLimit: 1800,
    skillName
  };
}

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();

    const { skillName } = await request.json();
    if (!skillName) return NextResponse.json({ error: 'skillName is required' }, { status: 400 });

    console.log(`[Skill Test] Starting test for skill: ${skillName}, user: ${user._id}`);

    // Check attempt limits
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentAttempts = await SkillTestAttempt.countDocuments({
      user: user._id, skillName, createdAt: { $gte: last30Days }
    });

    if (recentAttempts >= 3) {
      console.warn(`[Skill Test] Maximum attempts reached for skill: ${skillName}, user: ${user._id}`);
      return NextResponse.json({ error: 'Maximum 3 attempts per skill every 30 days. Please try again later.' }, { status: 429 });
    }

    // Check for existing in-progress attempt
    const existing = await SkillTestAttempt.findOne({ user: user._id, skillName, status: 'in-progress' });
    if (existing) {
      const elapsedSeconds = existing.startedAt
        ? Math.floor((Date.now() - new Date(existing.startedAt).getTime()) / 1000)
        : Number.MAX_SAFE_INTEGER;
      const timeLimit = existing.timeLimit || 1800;
      const hasProgress = Array.isArray(existing.answers) && existing.answers.some((a) => {
        const selected = String(a?.selectedAnswer || '').trim();
        const text = String(a?.textAnswer || '').trim();
        return selected.length > 0 || text.length > 0;
      });
      const shouldSupersedeExisting = elapsedSeconds > timeLimit + 300 || !hasProgress;

      if (!shouldSupersedeExisting) {
        console.log(`[Skill Test] Resuming existing attempt for skill: ${skillName}`);
        // INTEGRATION POINT: Always grade from stored attempt questions; never regenerate during resume.
        let questions = formatStoredQuestionsForClient(existing.questions || [], skillName);

        if (!existing.questions || existing.questions.length === 0) {
          console.log(`[Skill Test] Existing attempt has no questions, generating new ones...`);
          const generated = await generateSkillQuestions(skillName);
          existing.questions = flattenQuestionsForAttempt(generated);
          existing.totalQuestions = generated.totalQuestions || existing.questions.length;
          existing.timeLimit = generated.timeLimit || existing.timeLimit || 1800;
          await existing.save();
          questions = formatStoredQuestionsForClient(existing.questions, skillName);
          console.log(`[Skill Test] Generated ${existing.questions.length} questions for resumed attempt`);
        }

        return NextResponse.json({ attempt: existing, questions, resumed: true });
      }

      console.log(`[Skill Test] Superseding stale/empty in-progress attempt for skill: ${skillName}`);
      await SkillTestAttempt.updateOne(
        { _id: existing._id, status: 'in-progress' },
        {
          $set: {
            status: 'invalidated',
            invalidated: true,
            invalidationReason: 'Superseded by a new test start request',
            completedAt: new Date()
          }
        }
      );
    }

    let verification = await SkillVerification.findOne({ user: user._id, skillName });
    if (!verification) {
      verification = await SkillVerification.create({
        user: user._id, skillName,
        verificationStatus: 'testing',
        stages: { declaration: { completed: true, completedAt: new Date() } }
      });
      console.log(`[Skill Test] Created new verification for skill: ${skillName}`);
    }

    // INTEGRATION POINT: Generate skill-specific questions with Groq, fallback to questionBank if needed.
    console.log(`[Skill Test] Generating questions for skill: ${skillName}...`);
    const questions = await generateSkillQuestions(skillName);
    console.log(`[Skill Test] Generated questions object with keys:`, Object.keys(questions));
    console.log(`[Skill Test] Questions source:`, questions.source);
    
    const storedQuestions = flattenQuestionsForAttempt(questions);
    console.log(`[Skill Test] Flattened to ${storedQuestions.length} questions`);

    const attempt = await SkillTestAttempt.create({
      user: user._id,
      skillName,
      verification: verification._id,
      questions: storedQuestions,
      totalQuestions: questions.totalQuestions,
      timeLimit: questions.timeLimit,
      startedAt: new Date(),
      status: 'in-progress'
    });

    verification.attemptsUsed += 1;
    verification.lastAttemptDate = new Date();
    verification.verificationStatus = 'testing';
    await verification.save();

    console.log(`[Skill Test] New attempt created: ${attempt._id}, with ${storedQuestions.length} questions`);

    return NextResponse.json({ attempt, questions: formatStoredQuestionsForClient(storedQuestions, skillName) });
  } catch (error) {
    console.error(`[Skill Test Error] ${error.message}`);
    console.error(`[Skill Test Error] Stack:`, error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
