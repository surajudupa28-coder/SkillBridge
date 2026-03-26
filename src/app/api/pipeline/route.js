import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import CandidatePipeline from '@/models/CandidatePipeline';

export async function GET(req) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const entries = await CandidatePipeline.find({ recruiterId: user._id })
      .populate('candidateId', 'name email skills averageRating reputationScore verifiedSkills mentorLevel sessionsCompleted')
      .sort({ updatedAt: -1 });

    const pipeline = {
      saved: entries.filter(e => e.stage === 'saved'),
      interviewing: entries.filter(e => e.stage === 'interviewing'),
      hired: entries.filter(e => e.stage === 'hired')
    };

    return NextResponse.json(pipeline);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { candidateId, skill, notes } = await req.json();
    if (!candidateId) return NextResponse.json({ error: 'candidateId is required' }, { status: 400 });

    const existing = await CandidatePipeline.findOne({ recruiterId: user._id, candidateId });
    if (existing) return NextResponse.json({ error: 'Candidate already in pipeline' }, { status: 409 });

    const entry = await CandidatePipeline.create({
      recruiterId: user._id,
      candidateId,
      skill: skill || '',
      notes: notes || '',
      stage: 'saved'
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
