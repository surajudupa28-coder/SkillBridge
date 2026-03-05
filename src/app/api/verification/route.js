import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SkillVerification from '@/models/SkillVerification';
import DocumentSubmission from '@/models/DocumentSubmission';
import SkillTestAttempt from '@/models/SkillTestAttempt';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();

    const verifications = await SkillVerification.find({ user: user._id }).sort({ updatedAt: -1 });

    const enriched = await Promise.all(verifications.map(async (v) => {
      const docCount = await DocumentSubmission.countDocuments({ user: user._id, skillName: v.skillName });
      const verifiedDocCount = await DocumentSubmission.countDocuments({ user: user._id, skillName: v.skillName, verificationStatus: 'verified' });
      const testAttempts = await SkillTestAttempt.countDocuments({ user: user._id, skillName: v.skillName });
      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentAttempts = await SkillTestAttempt.countDocuments({ user: user._id, skillName: v.skillName, createdAt: { $gte: last30Days } });
      return { ...v.toObject(), docCount, verifiedDocCount, testAttempts, recentAttempts, attemptsRemaining: Math.max(0, 3 - recentAttempts) };
    }));

    return NextResponse.json({ verifications: enriched });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();

    const { skillName } = await request.json();
    if (!skillName) return NextResponse.json({ error: 'skillName is required' }, { status: 400 });

    let verification = await SkillVerification.findOne({ user: user._id, skillName });

    if (verification && verification.verificationStatus === 'verified') {
      return NextResponse.json({ error: 'Skill already verified' }, { status: 400 });
    }

    if (!verification) {
      verification = await SkillVerification.create({
        user: user._id,
        skillName,
        verificationStatus: 'testing',
        stages: { declaration: { completed: true, completedAt: new Date() } }
      });
    } else if (verification.verificationStatus === 'rejected') {
      verification.verificationStatus = 'testing';
      verification.rejectedAt = null;
      verification.reviewNotes = null;
      verification.stages.declaration = { completed: true, completedAt: new Date() };
      await verification.save();
    }

    return NextResponse.json({ verification }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
