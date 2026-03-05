import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Session from '@/models/Session';
import { getAuthUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const user = await User.findById(params.id).select('-password');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const mentorSessions = await Session.find({ mentor: user._id }).sort({ createdAt: -1 }).limit(10).populate('learner', 'name');
    const learnerSessions = await Session.find({ learner: user._id }).sort({ createdAt: -1 }).limit(10).populate('mentor', 'name');

    return NextResponse.json({ user, mentorSessions, learnerSessions });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
