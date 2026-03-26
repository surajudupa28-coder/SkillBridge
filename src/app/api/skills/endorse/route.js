import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SkillTest from '@/models/SkillTest';
import { getAuthUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();

    const { userId, skill, comment } = await request.json();
    if (!userId || !skill) return NextResponse.json({ error: 'userId and skill are required' }, { status: 400 });
    if (user._id.toString() === userId) {
      return NextResponse.json({ error: 'Cannot endorse yourself' }, { status: 400 });
    }

    let skillTest = await SkillTest.findOne({ user: userId, skill });
    if (!skillTest) {
      skillTest = await SkillTest.create({ user: userId, skill, score: 0, passed: false });
    }

    const alreadyEndorsed = skillTest.endorsements.some((e) => e.endorser.toString() === user._id.toString());
    if (alreadyEndorsed) {
      return NextResponse.json({ error: 'You have already endorsed this skill' }, { status: 400 });
    }

    skillTest.endorsements.push({ endorser: user._id, comment: comment || '', createdAt: new Date() });
    await skillTest.save();

    return NextResponse.json({ skillTest });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
