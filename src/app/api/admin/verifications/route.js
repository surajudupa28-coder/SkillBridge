import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SkillVerification from '@/models/SkillVerification';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const query = {};
    if (status) query.verificationStatus = status;

    const verifications = await SkillVerification.find(query)
      .populate('user', 'name email skills mentorLevel reputationScore')
      .populate('reviewedBy', 'name')
      .sort({ updatedAt: -1 });

    return NextResponse.json({ verifications });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    await dbConnect();

    const { verificationId, action, reviewNotes } = await request.json();
    if (!verificationId || !action) return NextResponse.json({ error: 'verificationId and action required' }, { status: 400 });

    const verification = await SkillVerification.findById(verificationId);
    if (!verification) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    verification.reviewedBy = user._id;
    verification.reviewNotes = reviewNotes || '';

    if (action === 'approve') {
      verification.verificationStatus = 'verified';
      verification.verifiedAt = new Date();
      await User.findByIdAndUpdate(verification.user, { $addToSet: { verifiedSkills: verification.skillName } });
    } else if (action === 'reject') {
      verification.verificationStatus = 'rejected';
      verification.rejectedAt = new Date();
    }

    await verification.save();
    return NextResponse.json({ verification });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
