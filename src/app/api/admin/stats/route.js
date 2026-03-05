import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Session from '@/models/Session';
import Report from '@/models/Report';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    await dbConnect();

    const totalUsers = await User.countDocuments();
    const totalSessions = await Session.countDocuments();

    const coinsResult = await User.aggregate([{ $group: { _id: null, total: { $sum: '$walletBalance' } } }]);
    const totalCoins = coinsResult[0]?.total || 0;

    const topMentors = await User.find({ sessionsCompleted: { $gt: 0 } })
      .select('name reputationScore averageRating sessionsCompleted mentorLevel')
      .sort({ reputationScore: -1 })
      .limit(5);

    const popularSkills = await Session.aggregate([
      { $group: { _id: '$skill', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const pendingReports = await Report.countDocuments({ status: 'pending' });

    return NextResponse.json({ totalUsers, totalSessions, totalCoins, topMentors, popularSkills, pendingReports });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
