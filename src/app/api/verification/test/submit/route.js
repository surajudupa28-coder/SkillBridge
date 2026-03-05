import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SkillVerification from '@/models/SkillVerification';
import SkillTestAttempt from '@/models/SkillTestAttempt';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import { getQuestionsForSkill, gradeMCQ } from '@/lib/questionBank';

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();

    const { attemptId, answers, cheatingData } = await request.json();
    if (!attemptId) return NextResponse.json({ error: 'attemptId is required' }, { status: 400 });

    const attempt = await SkillTestAttempt.findById(attemptId);
    if (!attempt) return NextResponse.json({ error: 'Test attempt not found' }, { status: 404 });
    if (attempt.user.toString() !== user._id.toString()) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    if (attempt.status !== 'in-progress') return NextResponse.json({ error: 'Test already submitted' }, { status: 400 });

    // Check time limit
    const elapsed = (Date.now() - new Date(attempt.startedAt).getTime()) / 1000;
    const timedOut = elapsed > attempt.timeLimit + 60; // 60s grace period

    // Get original questions for grading
    const questions = getQuestionsForSkill(attempt.skillName);
    const allQuestions = [...questions.mcq, ...questions.scenario, ...questions.explanation];

    // Grade answers
    let correctMCQ = 0;
    let totalMCQ = 0;
    const gradedAnswers = (answers || []).map(ans => {
      const question = allQuestions.find(q => q.questionNumber === ans.questionNumber);
      let isCorrect = false;
      if (question && question.questionType === 'mcq') {
        totalMCQ++;
        isCorrect = gradeMCQ(question, ans.selectedAnswer);
        if (isCorrect) correctMCQ++;
      }
      return {
        questionId: ans.questionNumber,
        questionType: question?.questionType || 'mcq',
        selectedAnswer: ans.selectedAnswer?.toString(),
        textAnswer: ans.textAnswer || '',
        isCorrect,
        timeSpent: ans.timeSpent || 0,
        flagged: (ans.timeSpent || 0) < 3
      };
    });

    // MCQ score (out of 70 - 10 questions worth 7 each)
    const mcqScore = totalMCQ > 0 ? Math.round((correctMCQ / totalMCQ) * 70) : 0;

    // Scenario + explanation score: auto-award partial credit based on text length and keyword presence
    let textScore = 0;
    gradedAnswers.filter(a => a.questionType === 'scenario' || a.questionType === 'explanation').forEach(a => {
      const text = a.textAnswer || '';
      if (text.length > 200) textScore += 8;
      else if (text.length > 100) textScore += 5;
      else if (text.length > 30) textScore += 3;
    });
    textScore = Math.min(textScore, 30); // max 30 points for text questions

    const totalScore = mcqScore + textScore;

    // Anti-cheating analysis
    const cheatingFlags = {
      tabSwitches: cheatingData?.tabSwitches || 0,
      copyPasteAttempts: cheatingData?.copyPasteAttempts || 0,
      suspiciouslyFastAnswers: gradedAnswers.filter(a => a.flagged).length,
      identicalToOtherAttempts: false,
      totalFlags: 0
    };
    cheatingFlags.totalFlags = cheatingFlags.tabSwitches + cheatingFlags.copyPasteAttempts + cheatingFlags.suspiciouslyFastAnswers;

    const flaggedForReview = cheatingFlags.totalFlags > 5;
    const invalidated = cheatingFlags.totalFlags > 10;

    // Check for identical previous attempts
    const prevAttempts = await SkillTestAttempt.find({
      user: user._id, skillName: attempt.skillName, _id: { $ne: attempt._id }, status: 'completed'
    }).limit(3);

    if (prevAttempts.length > 0) {
      const prevAnswerSets = prevAttempts.map(pa => pa.answers.map(a => a.selectedAnswer).join(','));
      const currentAnswers = gradedAnswers.map(a => a.selectedAnswer).join(',');
      if (prevAnswerSets.includes(currentAnswers)) {
        cheatingFlags.identicalToOtherAttempts = true;
        cheatingFlags.totalFlags += 5;
      }
    }

    // Update attempt
    attempt.answers = gradedAnswers;
    attempt.score = invalidated ? 0 : totalScore;
    attempt.passed = !invalidated && totalScore >= 70;
    attempt.timeTaken = Math.round(elapsed);
    attempt.completedAt = new Date();
    attempt.status = timedOut ? 'timed-out' : invalidated ? 'invalidated' : 'completed';
    attempt.cheatingFlags = cheatingFlags;
    attempt.flaggedForReview = flaggedForReview;
    attempt.invalidated = invalidated;
    if (invalidated) attempt.invalidationReason = 'Excessive cheating flags detected';
    await attempt.save();

    // Update SkillVerification
    const verification = await SkillVerification.findOne({ user: user._id, skillName: attempt.skillName });
    if (verification) {
      verification.testScore = Math.max(verification.testScore, attempt.passed ? totalScore : verification.testScore);
      if (attempt.passed) {
        verification.stages.skillTest = { completed: true, completedAt: new Date(), score: totalScore };
      }
      await verification.save();
    }

    return NextResponse.json({
      attempt: { _id: attempt._id, score: attempt.score, passed: attempt.passed, status: attempt.status, cheatingFlags, flaggedForReview },
      totalScore, mcqScore, textScore, correctMCQ, totalMCQ
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
