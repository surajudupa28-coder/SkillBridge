import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Report from '@/models/Report';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    await dbConnect();

    const reports = await Report.find()
      .populate('reporter', 'name email')
      .populate('reported', 'name email')
      .populate('session', 'skill scheduledAt status')
      .sort({ createdAt: -1 });

    return NextResponse.json({ reports });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    await dbConnect();

    const { reportId, status } = await request.json();
    const report = await Report.findByIdAndUpdate(reportId, { status }, { new: true });
    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
