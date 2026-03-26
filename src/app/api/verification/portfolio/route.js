import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SkillVerification from '@/models/SkillVerification';
import { getAuthUser } from '@/lib/auth';
import { evaluatePortfolioForSkill } from '@/lib/portfolioEvaluation';

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

    // INTEGRATION POINT: Skill-specific Groq portfolio evaluation (fallback to heuristic if needed).
    let heuristicScore = 0;
    projects.forEach((p) => {
      let projectScore = 0;
      if (p.title && p.title.length > 3) projectScore += 5;
      if (p.description && p.description.length > 50) projectScore += 10;
      else if (p.description && p.description.length > 20) projectScore += 5;
      if (p.techUsed && p.techUsed.length > 0) projectScore += 5;
      if (p.demoLink) projectScore += 10;
      if (p.repoLink) projectScore += 10;
      heuristicScore += projectScore;
    });
    heuristicScore = Math.min(heuristicScore, 100);

    const aiEvaluations = await Promise.all(
      projects.map((project) =>
        evaluatePortfolioForSkill({
          skill: skillName,
          description: project.description || project.title || '',
          repoDetails: `${project.repoLink || ''} ${project.demoLink || ''}`.trim(),
          techStack: Array.isArray(project.techUsed) ? project.techUsed : []
        })
      )
    );

    const aiRawAverage = aiEvaluations.length
      ? Math.round(aiEvaluations.reduce((sum, e) => sum + (e.score || 0), 0) / aiEvaluations.length)
      : 0;

    const fallbackRaw = Math.round((heuristicScore / 100) * 30);
    const useFallback = aiEvaluations.some((e) => e.fallbackScoring);
    const portfolioRawScore = useFallback ? fallbackRaw : aiRawAverage;
    const portfolioScore = Math.min(Math.round((portfolioRawScore / 30) * 100), 100);

    verification.portfolioScore = portfolioScore;
    verification.stages.portfolio = { completed: portfolioScore >= 30, completedAt: portfolioScore >= 30 ? new Date() : undefined, score: portfolioScore };
    await verification.save();

    return NextResponse.json({
      verification,
      portfolioScore,
      portfolioRawScore,
      aiPortfolioFeedback: aiEvaluations.map((e) => e.feedback)
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
