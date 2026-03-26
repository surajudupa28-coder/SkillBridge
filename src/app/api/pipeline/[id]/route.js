import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import CandidatePipeline from '@/models/CandidatePipeline';

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { stage, notes } = await req.json();
    const update = { updatedAt: new Date() };
    if (stage && ['saved', 'interviewing', 'hired'].includes(stage)) update.stage = stage;
    if (notes !== undefined) update.notes = notes;

    const entry = await CandidatePipeline.findOneAndUpdate(
      { _id: params.id, recruiterId: user._id },
      update,
      { new: true }
    ).populate('candidateId', 'name email skills averageRating reputationScore verifiedSkills');

    if (!entry) return NextResponse.json({ error: 'Pipeline entry not found' }, { status: 404 });
    return NextResponse.json(entry);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const entry = await CandidatePipeline.findOneAndDelete({ _id: params.id, recruiterId: user._id });
    if (!entry) return NextResponse.json({ error: 'Pipeline entry not found' }, { status: 404 });
    return NextResponse.json({ message: 'Removed from pipeline' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
