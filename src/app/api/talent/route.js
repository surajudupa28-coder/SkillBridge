import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Session from '@/models/Session';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'company' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Company access required' }, { status: 403 });
    }
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const skill = searchParams.get('skill');

    const query = { suspended: { $ne: true }, sessionsCompleted: { $gt: 0 } };
    if (skill) {
      query['skills.name'] = { $regex: new RegExp(skill, 'i') };
    }

    const performers = await User.find(query)
      .select('name skills reputationScore averageRating sessionsCompleted mentorLevel sessionCompletionRate verifiedSkills')
      .sort({ reputationScore: -1 })
      .limit(50);

    const talentData = performers.map(p => ({
      _id: p._id,
      name: p.name,
      skills: p.skills,
      sessionsTaught: p.sessionsCompleted,
      averageRating: p.averageRating,
      completionRate: p.sessionCompletionRate,
      mentorLevel: p.mentorLevel,
      verifiedSkills: p.verifiedSkills,
      skillConsistency: Math.round((p.sessionCompletionRate / 100) * (p.averageRating / 5) * 100)
    }));

    const skillDistribution = await User.aggregate([
      { $unwind: '$skills' },
      { $group: { _id: '$skills.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 }
    ]);

    return NextResponse.json({ talent: talentData, skillDistribution });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
