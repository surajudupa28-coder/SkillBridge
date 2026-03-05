import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SkillVerification from '@/models/SkillVerification';
import SkillTestAttempt from '@/models/SkillTestAttempt';
import { getAuthUser } from '@/lib/auth';
import { getQuestionsForSkill } from '@/lib/questionBank';

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();

    const { skillName } = await request.json();
    if (!skillName) return NextResponse.json({ error: 'skillName is required' }, { status: 400 });

    // Check attempt limits
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentAttempts = await SkillTestAttempt.countDocuments({
      user: user._id, skillName, createdAt: { $gte: last30Days }
    });

    if (recentAttempts >= 3) {
      return NextResponse.json({ error: 'Maximum 3 attempts per skill every 30 days. Please try again later.' }, { status: 429 });
    }

    // Check for existing in-progress attempt
    const existing = await SkillTestAttempt.findOne({ user: user._id, skillName, status: 'in-progress' });
    if (existing) {
      const questions = getQuestionsForSkill(skillName);
      return NextResponse.json({ attempt: existing, questions, resumed: true });
    }

    let verification = await SkillVerification.findOne({ user: user._id, skillName });
    if (!verification) {
      verification = await SkillVerification.create({
        user: user._id, skillName,
        verificationStatus: 'testing',
        stages: { declaration: { completed: true, completedAt: new Date() } }
      });
    }

    const questions = getQuestionsForSkill(skillName);
    const attempt = await SkillTestAttempt.create({
      user: user._id,
      skillName,
      verification: verification._id,
      totalQuestions: questions.totalQuestions,
      timeLimit: questions.timeLimit,
      startedAt: new Date(),
      status: 'in-progress'
    });

    verification.attemptsUsed += 1;
    verification.lastAttemptDate = new Date();
    verification.verificationStatus = 'testing';
    await verification.save();

    return NextResponse.json({ attempt, questions });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
