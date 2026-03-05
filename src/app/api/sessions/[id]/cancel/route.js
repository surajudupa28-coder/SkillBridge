import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Session from '@/models/Session';
import Transaction from '@/models/Transaction';
import { getAuthUser } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();

    const session = await Session.findById(params.id);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (session.status !== 'scheduled') {
      return NextResponse.json({ error: 'Session cannot be cancelled' }, { status: 400 });
    }

    const { cancelledBy } = await request.json();

    if (cancelledBy === 'no-show-mentor') {
      session.status = 'no-show-mentor';
      session.escrowAmount = 0;
      await session.save();

      await User.findByIdAndUpdate(session.learner, { $inc: { walletBalance: session.price } });
      await Transaction.create({
        user: session.learner,
        amount: session.price,
        type: 'credit',
        reason: 'Refund - mentor no-show',
        counterparty: session.mentor,
        sessionId: session._id
      });
    } else if (cancelledBy === 'no-show-learner') {
      session.status = 'no-show-learner';
      const mentorComp = Math.floor(session.price * 0.5);
      session.escrowAmount = 0;
      await session.save();

      await User.findByIdAndUpdate(session.mentor, { $inc: { walletBalance: mentorComp } });
      await Transaction.create({
        user: session.mentor,
        amount: mentorComp,
        type: 'credit',
        reason: 'Partial compensation - learner no-show',
        counterparty: session.learner,
        sessionId: session._id
      });
    } else {
      session.status = 'cancelled';
      session.escrowAmount = 0;
      await session.save();

      await User.findByIdAndUpdate(session.learner, { $inc: { walletBalance: session.price } });
      await Transaction.create({
        user: session.learner,
        amount: session.price,
        type: 'credit',
        reason: 'Refund - session cancelled',
        counterparty: session.mentor,
        sessionId: session._id
      });
    }

    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
