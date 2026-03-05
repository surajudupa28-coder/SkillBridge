import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SkillVerification from '@/models/SkillVerification';
import { getAuthUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();

    const { skillName, projects } = await request.json();
    if (!skillName || !projects || !Array.isArray(projects) || projects.length === 0) {
      return NextResponse.json({ error: 'skillName and projects array are required' }, { status: 400 });
    }

    let verification = await SkillVerification.findOne({ user: user._id, skillName });
    if (!verification) {
      verification = await SkillVerification.create({
        user: user._id, skillName, verificationStatus: 'testing',
        stages: { declaration: { completed: true, completedAt: new Date() } }
      });
    }

    // Portfolio scoring: up to 100 points
    let portfolioScore = 0;
    projects.forEach(p => {
      let projectScore = 0;
      if (p.title && p.title.length > 3) projectScore += 5;
      if (p.description && p.description.length > 50) projectScore += 10;
      else if (p.description && p.description.length > 20) projectScore += 5;
      if (p.techUsed && p.techUsed.length > 0) projectScore += 5;
      if (p.demoLink) projectScore += 10;
      if (p.repoLink) projectScore += 10;
      portfolioScore += projectScore;
    });
    portfolioScore = Math.min(portfolioScore, 100);

    verification.portfolioScore = portfolioScore;
    verification.stages.portfolio = { completed: portfolioScore >= 30, completedAt: portfolioScore >= 30 ? new Date() : undefined, score: portfolioScore };
    await verification.save();

    return NextResponse.json({ verification, portfolioScore });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
