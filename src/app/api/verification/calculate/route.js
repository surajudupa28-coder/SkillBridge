import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SkillVerification from '@/models/SkillVerification';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();

    const { skillName } = await request.json();
    if (!skillName) return NextResponse.json({ error: 'skillName is required' }, { status: 400 });

    const verification = await SkillVerification.findOne({ user: user._id, skillName });
    if (!verification) return NextResponse.json({ error: 'No verification record found' }, { status: 404 });

    const finalScore = Math.round(
      (verification.testScore * 0.30) +
      (verification.portfolioScore * 0.20) +
      (verification.documentScore * 0.15) +
      (verification.endorsementScore * 0.15) +
      (verification.trialSessionScore * 0.20)
    );

    verification.finalVerificationScore = finalScore;

    const stagesCompleted = [
      verification.stages.declaration?.completed,
      verification.stages.skillTest?.completed,
      verification.stages.portfolio?.completed
    ].filter(Boolean).length;

    if (finalScore >= 75 && stagesCompleted >= 2) {
      verification.verificationStatus = 'verified';
      verification.verifiedAt = new Date();
      verification.stages.monitoring = { completed: true, completedAt: new Date(), score: 100 };
      await User.findByIdAndUpdate(user._id, { $addToSet: { verifiedSkills: skillName } });
    } else if (finalScore < 50 && verification.attemptsUsed >= 3) {
      verification.verificationStatus = 'rejected';
      verification.rejectedAt = new Date();
    } else {
      verification.verificationStatus = 'under-review';
    }

    await verification.save();

    return NextResponse.json({
      verification,
      finalScore,
      passed: finalScore >= 75,
      breakdown: {
        test: Math.round(verification.testScore * 0.30),
        portfolio: Math.round(verification.portfolioScore * 0.20),
        documents: Math.round(verification.documentScore * 0.15),
        endorsements: Math.round(verification.endorsementScore * 0.15),
        trialSession: Math.round(verification.trialSessionScore * 0.20)
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
