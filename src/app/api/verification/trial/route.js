import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SkillVerification from '@/models/SkillVerification';
import Session from '@/models/Session';
import { getAuthUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();

    const { skillName, sessionId, ratings } = await request.json();
    if (!skillName) return NextResponse.json({ error: 'skillName is required' }, { status: 400 });

    let trialScore = 0;
    if (ratings) {
      const { clarity, correctness, communication, problemSolving } = ratings;
      trialScore = Math.round(((clarity || 0) + (correctness || 0) + (communication || 0) + (problemSolving || 0)) / 4);
    } else if (sessionId) {
      const session = await Session.findById(sessionId);
      if (session && session.rating) {
        trialScore = session.rating * 20; // Convert 1-5 to 0-100
      }
    }

    trialScore = Math.min(Math.max(trialScore, 0), 100);

    const verification = await SkillVerification.findOne({ user: user._id, skillName });
    if (!verification) return NextResponse.json({ error: 'Start verification first' }, { status: 400 });

    verification.trialSessionScore = trialScore;
    verification.stages.trialSession = { completed: trialScore >= 70, completedAt: trialScore >= 70 ? new Date() : undefined, score: trialScore };
    await verification.save();

    return NextResponse.json({ verification, trialScore });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
