import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const skill = searchParams.get('skill');

    const query = { suspended: { $ne: true }, sessionsCompleted: { $gt: 0 } };
    if (skill) {
      query['skills.name'] = { $regex: new RegExp(skill, 'i') };
    }

    const leaders = await User.find(query)
      .select('name skills reputationScore averageRating sessionsCompleted mentorLevel verifiedSkills')
      .sort({ reputationScore: -1 })
      .limit(20);

    return NextResponse.json({ leaders });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
