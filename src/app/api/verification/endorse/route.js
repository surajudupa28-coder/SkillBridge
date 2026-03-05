import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import SkillVerification from '@/models/SkillVerification';
import SkillTest from '@/models/SkillTest';
import { getAuthUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const endorser = await getAuthUser(request);
    if (!endorser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();

    const { userId, skillName, feedback } = await request.json();
    if (!userId || !skillName) return NextResponse.json({ error: 'userId and skillName are required' }, { status: 400 });

    if (endorser._id.toString() === userId) {
      return NextResponse.json({ error: 'Cannot endorse yourself' }, { status: 400 });
    }

    // Check endorser is verified mentor
    if (!endorser.verifiedSkills || endorser.verifiedSkills.length === 0) {
      return NextResponse.json({ error: 'Only verified mentors can endorse skills' }, { status: 403 });
    }

    // Check not already endorsed
    let skillTest = await SkillTest.findOne({ user: userId, skill: skillName });
    if (!skillTest) {
      skillTest = await SkillTest.create({ user: userId, skill: skillName, score: 0, passed: false });
    }

    const alreadyEndorsed = skillTest.endorsements.some(e => e.endorser.toString() === endorser._id.toString());
    if (alreadyEndorsed) {
      return NextResponse.json({ error: 'You have already endorsed this skill' }, { status: 400 });
    }

    skillTest.endorsements.push({ endorser: endorser._id, comment: feedback || '', createdAt: new Date() });
    await skillTest.save();

    // Update verification endorsement score
    const verification = await SkillVerification.findOne({ user: userId, skillName });
    if (verification) {
      // Calculate endorsement score based on endorser credibility
      let totalEndorsementScore = 0;
      for (const e of skillTest.endorsements) {
        const endorserUser = await User.findById(e.endorser).select('reputationScore');
        const credWeight = endorserUser ? endorserUser.reputationScore / 10 : 0.5;
        totalEndorsementScore += 15 * credWeight;
      }
      totalEndorsementScore = Math.min(totalEndorsementScore, 100);

      verification.endorsementScore = totalEndorsementScore;
      verification.stages.endorsements = {
        completed: skillTest.endorsements.length >= 2,
        completedAt: skillTest.endorsements.length >= 2 ? new Date() : undefined,
        score: totalEndorsementScore
      };
      await verification.save();
    }

    return NextResponse.json({ endorsement: { endorser: endorser._id, feedback }, totalEndorsements: skillTest.endorsements.length });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
