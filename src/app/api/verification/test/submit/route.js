import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SkillVerification from '@/models/SkillVerification';
import SkillTestAttempt from '@/models/SkillTestAttempt';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import {
  evaluateScenarioAnswer,
  evaluateExplanationAnswer,
  calculateAiConfidenceScore
} from '@/lib/groqEvaluation';

const MCQ_WEIGHT = 7;

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

    // INTEGRATION POINT: Grade against stored questions from test start; never regenerate at submit time.
    const allQuestions = Array.isArray(attempt.questions) ? attempt.questions : [];
    if (allQuestions.length === 0) {
      return NextResponse.json({ error: 'Attempt questions missing. Please restart the test.' }, { status: 400 });
    }

    // Grade answers
    let correctMCQ = 0;
    let totalMCQ = 0;
    let textScore = 0;
    const aiEvaluations = [];

    const gradedAnswers = [];
    
    for (const ans of answers || []) {
      const question = allQuestions.find(q => q.questionNumber === ans.questionNumber);
      let isCorrect = false;
      let aiEvaluation = null;
      
      if (question && question.questionType === 'mcq') {
        totalMCQ++;
        isCorrect = Number(ans.selectedAnswer) === Number(question.correctAnswer);
        if (isCorrect) correctMCQ++;
      } else if (question && (question.questionType === 'scenario' || question.questionType === 'explanation')) {
        // INTEGRATION POINT: Skill-aware AI evaluation for scenario/explanation.
        try {
          if (question.questionType === 'scenario') {
            aiEvaluation = await evaluateScenarioAnswer({
              skill: attempt.skillName,
              question: question.question,
              expectedConcepts: question.expectedConcepts || [],
              answer: ans.textAnswer || ''
            });
          } else {
            aiEvaluation = await evaluateExplanationAnswer({
              skill: attempt.skillName,
              question: question.question,
              answer: ans.textAnswer || ''
            });
          }

          textScore += Math.round(Math.max(0, Math.min(10, aiEvaluation.score || 0)));
          aiEvaluations.push(aiEvaluation);
        } catch (error) {
          console.error('AI evaluation failed, using fallback:', error);
          // Fallback to text-length based scoring
          const text = ans.textAnswer || '';
          if (text.length > 200) textScore += 8;
          else if (text.length > 100) textScore += 6;
          else if (text.length > 30) textScore += 4;
        }
      }

      gradedAnswers.push({
        questionId: ans.questionNumber,
        questionType: question?.questionType || 'mcq',
        selectedAnswer: ans.selectedAnswer?.toString(),
        textAnswer: ans.textAnswer || '',
        isCorrect,
        timeSpent: ans.timeSpent || 0,
        flagged: (ans.timeSpent || 0) < 3,
        aiEvaluation: aiEvaluation
      });
    }

    // MCQ score (out of 70 - 10 questions x weight 7)
    const mcqScore = correctMCQ * MCQ_WEIGHT;

    // Text score (max 30 points - capped at 30)
    textScore = Math.min(textScore, 30);

    const totalScore = Math.min(100, mcqScore + textScore);
    const aiConfidenceScore = calculateAiConfidenceScore(aiEvaluations);

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
    attempt.aiConfidenceScore = aiConfidenceScore;
    attempt.timeTaken = Math.round(elapsed);
    attempt.completedAt = new Date();
    attempt.status = timedOut ? 'timed-out' : invalidated ? 'invalidated' : 'completed';
    attempt.cheatingFlags = cheatingFlags;
    attempt.flaggedForReview = flaggedForReview;
    attempt.invalidated = invalidated;
    if (invalidated) attempt.invalidationReason = 'Excessive cheating flags detected';
    try {
      await attempt.save();
    } catch (saveError) {
      if (saveError?.name === 'VersionError') {
        const latestAttempt = await SkillTestAttempt.findById(attempt._id);
        if (latestAttempt && latestAttempt.status !== 'in-progress') {
          const latestCorrectMCQ = (latestAttempt.answers || []).filter((a) => a.questionType === 'mcq' && a.isCorrect).length;
          const latestTotalMCQ = (latestAttempt.answers || []).filter((a) => a.questionType === 'mcq').length;
          const latestMcqScore = latestCorrectMCQ * MCQ_WEIGHT;
          const latestTextScore = Math.max(0, (latestAttempt.score || 0) - latestMcqScore);

          return NextResponse.json({
            attempt: {
              _id: latestAttempt._id,
              score: latestAttempt.score,
              passed: latestAttempt.passed,
              status: latestAttempt.status,
              cheatingFlags: latestAttempt.cheatingFlags,
              flaggedForReview: latestAttempt.flaggedForReview,
              aiConfidenceScore: latestAttempt.aiConfidenceScore || 0
            },
            totalScore: latestAttempt.score || 0,
            mcqScore: latestMcqScore,
            textScore: latestTextScore,
            correctMCQ: latestCorrectMCQ,
            totalMCQ: latestTotalMCQ
          });
        }
      }

      throw saveError;
    }

    // Update SkillVerification
    const verification = await SkillVerification.findOne({ user: user._id, skillName: attempt.skillName });
    if (verification) {
      verification.testScore = Math.max(verification.testScore, attempt.passed ? totalScore : verification.testScore);
      verification.aiConfidenceScore = Math.max(verification.aiConfidenceScore || 0, aiConfidenceScore);
      if (attempt.passed) {
        verification.stages.skillTest = { completed: true, completedAt: new Date(), score: totalScore };
      }
      await verification.save();
    }

    return NextResponse.json({
      attempt: {
        _id: attempt._id,
        score: attempt.score,
        passed: attempt.passed,
        status: attempt.status,
        cheatingFlags,
        flaggedForReview,
        aiConfidenceScore
      },
      totalScore,
      mcqScore,
      textScore,
      correctMCQ,
      totalMCQ
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
