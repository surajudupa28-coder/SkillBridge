import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Session from '@/models/Session';
import Transaction from '@/models/Transaction';
import { getAuthUser } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();

    const session = await Session.findById(params.id);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (session.mentor.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Only the mentor can complete a session' }, { status: 403 });
    }
    if (session.status !== 'scheduled') {
      return NextResponse.json({ error: 'Session cannot be completed' }, { status: 400 });
    }

    const mentorPayment = Math.floor(session.escrowAmount * 0.8);

    session.status = 'completed';
    session.escrowAmount = 0;
    session.attendancePercent = 100;
    await session.save();

    const mentor = await User.findById(session.mentor);
    mentor.walletBalance += mentorPayment;
    mentor.sessionsCompleted += 1;

    // Check repeat learner
    const previousSessions = await Session.countDocuments({
      mentor: session.mentor,
      learner: session.learner,
      status: 'completed',
      _id: { $ne: session._id }
    });
    if (previousSessions === 0) {
      // First completed session with this learner - future completions make them repeat
    } else if (previousSessions === 1) {
      mentor.repeatLearners += 1;
    }

    // Update completion rate
    const totalMentorSessions = await Session.countDocuments({ mentor: session.mentor, status: { $in: ['completed', 'cancelled', 'no-show-mentor', 'no-show-learner'] } });
    const completedMentorSessions = await Session.countDocuments({ mentor: session.mentor, status: 'completed' });
    mentor.sessionCompletionRate = totalMentorSessions > 0 ? Math.round((completedMentorSessions / totalMentorSessions) * 100) : 100;

    // Mentor level check
    if (mentor.sessionsCompleted >= 10 && mentor.averageRating >= 4.2 && mentor.repeatLearners >= 3) {
      if (mentor.mentorLevel === 'community') mentor.mentorLevel = 'verified';
    }

    await mentor.save();

    // Update learner
    await User.findByIdAndUpdate(session.learner, { $inc: { sessionsCompleted: 1 } });

    await Transaction.create({
      user: session.mentor,
      amount: mentorPayment,
      type: 'credit',
      reason: 'Session completed - payment',
      counterparty: session.learner,
      sessionId: session._id
    });

    return NextResponse.json({ session, mentorPayment });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
