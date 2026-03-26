import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import Badge from '@/models/Badge';
import UserBadge from '@/models/UserBadge';

export async function GET(req) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId');
    const userId = requestedUserId && mongoose.Types.ObjectId.isValid(requestedUserId)
      ? requestedUserId
      : user._id;

    const badges = await Badge.find({});
    const userBadges = await UserBadge.find({ userId }).populate('badgeId');

    return NextResponse.json({
      badges,
      userBadges: userBadges.map(ub => ({
        _id: ub._id,
        badge: ub.badgeId,
        awardedAt: ub.awardedAt,
        awardReason: ub.awardReason
      }))
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const data = await req.json();
    const badge = await Badge.create(data);
    return NextResponse.json(badge, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
