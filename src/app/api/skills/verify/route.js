import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import SkillTest from '@/models/SkillTest';
import SkillVerification from '@/models/SkillVerification';
import { getAuthUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();

    const { skill, portfolioUrl, score } = await request.json();
    if (!skill) return NextResponse.json({ error: 'Skill is required' }, { status: 400 });

    const testScore = score || Math.floor(Math.random() * 40) + 60; // Simulated test score 60-99
    const passed = testScore >= 70;

    const skillTest = await SkillTest.create({
      user: user._id,
      skill,
      score: testScore,
      passed,
      portfolioUrl: portfolioUrl || ''
    });

    if (passed) {
      // Prevent self-award: only add to verifiedSkills if admin or skill is verified via proper flow
      const isAdmin = user.role === 'admin';
      const isVerified = await SkillVerification.findOne({
        user: user._id,
        skillName: skill,
        verificationStatus: 'verified'
      });
      
      if (isAdmin || isVerified) {
        await User.findByIdAndUpdate(user._id, { $addToSet: { verifiedSkills: skill } });
      }
    }

    return NextResponse.json({ skillTest, passed });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
