import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import User from '@/models/User';
import Session from '@/models/Session';
import UserSubscription from '@/models/UserSubscription';

export async function GET(req) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'company' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Company access required' }, { status: 403 });
    }

    const totalCandidates = await UserSubscription.countDocuments({ planType: 'pro', status: 'active' });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSessions = await Session.find({ status: 'completed', scheduledAt: { $gte: thirtyDaysAgo } });
    const skillCounts = {};
    recentSessions.forEach(s => {
      skillCounts[s.skill] = (skillCounts[s.skill] || 0) + 1;
    });
    const topSkillsThisMonth = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill, count]) => ({ skill, count }));

    const experiencedMentors = await User.find({ sessionsCompleted: { $gte: 10 } });
    const avgReputation = experiencedMentors.length > 0
      ? Math.round(experiencedMentors.reduce((sum, m) => sum + m.reputationScore, 0) / experiencedMentors.length * 10) / 10
      : 0;

    const topPerformingMentors = await User.find({ sessionsCompleted: { $gte: 5 } })
      .sort({ reputationScore: -1 })
      .limit(5)
      .select('name skills averageRating reputationScore sessionsCompleted mentorLevel verifiedSkills');

    return NextResponse.json({
      totalCandidates,
      topSkillsThisMonth,
      averageReputationScore: avgReputation,
      topPerformingMentors
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
