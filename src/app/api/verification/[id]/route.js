import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import SkillVerification from '@/models/SkillVerification';
import DocumentSubmission from '@/models/DocumentSubmission';
import SkillTestAttempt from '@/models/SkillTestAttempt';
import SkillTest from '@/models/SkillTest';
import { getAuthUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    await dbConnect();

    const verification = await SkillVerification.findById(params.id);
    if (!verification) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (verification.user.toString() !== user._id.toString() && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const documents = await DocumentSubmission.find({ user: verification.user, skillName: verification.skillName }).sort({ createdAt: -1 });
    const testAttempts = await SkillTestAttempt.find({ user: verification.user, skillName: verification.skillName }).sort({ createdAt: -1 }).limit(5);
    const skillTest = await SkillTest.findOne({ user: verification.user, skill: verification.skillName }).populate('endorsements.endorser', 'name reputationScore mentorLevel verifiedSkills');

    return NextResponse.json({ verification, documents, testAttempts, endorsements: skillTest?.endorsements || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
