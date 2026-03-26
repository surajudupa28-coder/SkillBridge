import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Session from '@/models/Session';
import { getAuthUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const isSelfOrAdmin = authUser._id.toString() === params.id || authUser.role === 'admin';

    await dbConnect();

    const user = isSelfOrAdmin
      ? await User.findById(params.id).select('-password')
      : await User.findById(params.id).select('name skills reputationScore averageRating sessionsCompleted mentorLevel verifiedSkills portfolioLinks availability');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const mentorSessions = await Session.find({ mentor: user._id }).sort({ createdAt: -1 }).limit(10).populate('learner', 'name');
    const learnerSessions = isSelfOrAdmin
      ? await Session.find({ learner: user._id }).sort({ createdAt: -1 }).limit(10).populate('mentor', 'name')
      : [];

    return NextResponse.json({ user, mentorSessions, learnerSessions });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
