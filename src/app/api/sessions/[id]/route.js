import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Session from '@/models/Session';
import { getAuthUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    await dbConnect();
    const session = await Session.findById(params.id).populate('mentor', 'name email mentorLevel skills').populate('learner', 'name email');
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const isParticipant =
      session.mentor?._id?.toString() === user._id.toString() ||
      session.learner?._id?.toString() === user._id.toString();
    if (!isParticipant && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
