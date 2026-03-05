import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Session from '@/models/Session';
import Transaction from '@/models/Transaction';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();
    const sessions = await Session.find({
      $or: [{ mentor: user._id }, { learner: user._id }]
    }).populate('mentor', 'name email mentorLevel').populate('learner', 'name email').sort({ createdAt: -1 });
    return NextResponse.json({ sessions });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();
    const { mentorId, skill, scheduledAt, duration, price } = await request.json();

    if (!mentorId || !skill || !scheduledAt) {
      return NextResponse.json({ error: 'mentorId, skill, and scheduledAt are required' }, { status: 400 });
    }

    const sessionPrice = price || 30;
    const mentor = await User.findById(mentorId);
    if (!mentor) return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
    if (mentor.suspended) return NextResponse.json({ error: 'Mentor is suspended' }, { status: 400 });

    const learner = await User.findById(user._id);
    if (learner.walletBalance < sessionPrice) {
      return NextResponse.json({ error: 'Insufficient SkillCoins' }, { status: 400 });
    }

    learner.walletBalance -= sessionPrice;
    await learner.save();

    const session = await Session.create({
      mentor: mentorId,
      learner: user._id,
      skill,
      scheduledAt: new Date(scheduledAt),
      duration: duration || 60,
      price: sessionPrice,
      escrowAmount: sessionPrice,
      status: 'scheduled'
    });

    await Transaction.create({
      user: user._id,
      amount: sessionPrice,
      type: 'debit',
      reason: 'Session booking escrow',
      counterparty: mentorId,
      sessionId: session._id
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
