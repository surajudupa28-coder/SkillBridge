import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Session from '@/models/Session';
import Transaction from '@/models/Transaction';
import { getAuthUser } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    await dbConnect();

    const session = await Session.findById(params.id);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    const isMentor = session.mentor.toString() === authUser._id.toString();
    const isLearner = session.learner.toString() === authUser._id.toString();
    const isAdmin = authUser.role === 'admin';
    if (!isMentor && !isLearner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (session.status !== 'scheduled') {
      return NextResponse.json({ error: 'Session cannot be cancelled' }, { status: 400 });
    }

    const { cancelledBy } = await request.json();

    if (cancelledBy === 'no-show-mentor') {
      if (!isLearner && !isAdmin) {
        return NextResponse.json({ error: 'Only the learner can mark mentor no-show' }, { status: 403 });
      }
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
      if (!isMentor && !isAdmin) {
        return NextResponse.json({ error: 'Only the mentor can mark learner no-show' }, { status: 403 });
      }
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
