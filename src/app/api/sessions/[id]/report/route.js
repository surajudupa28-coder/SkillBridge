import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Session from '@/models/Session';
import Report from '@/models/Report';
import { getAuthUser } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();

    const session = await Session.findById(params.id);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const isParticipant =
      session.mentor.toString() === user._id.toString() ||
      session.learner.toString() === user._id.toString();
    if (!isParticipant && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { reason } = await request.json();
    if (!reason) return NextResponse.json({ error: 'Reason is required' }, { status: 400 });

    const reportedUser = session.mentor.toString() === user._id.toString() ? session.learner : session.mentor;

    const report = await Report.create({
      reporter: user._id,
      reported: reportedUser,
      session: session._id,
      reason
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
