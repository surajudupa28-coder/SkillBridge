import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import UserSubscription from '@/models/UserSubscription';

export async function GET(req) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let subscription = await UserSubscription.findOne({ userId: user._id });
    if (!subscription) {
      subscription = {
        userId: user._id,
        planType: 'free',
        status: 'active',
        startDate: new Date(),
        endDate: null,
        paymentStatus: 'none',
        features: { recruiterVisibility: false, placementAccess: false, placementAnalytics: false }
      };
    }
    return NextResponse.json(subscription);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { planType } = await req.json();
    if (!['free', 'pro'].includes(planType)) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    const features = planType === 'pro'
      ? { recruiterVisibility: true, placementAccess: true, placementAnalytics: true }
      : { recruiterVisibility: false, placementAccess: false, placementAnalytics: false };

    const subscription = await UserSubscription.findOneAndUpdate(
      { userId: user._id },
      {
        planType,
        status: 'active',
        startDate: new Date(),
        endDate: planType === 'pro' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
        paymentStatus: planType === 'pro' ? 'completed' : 'none',
        features
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ message: `Subscription updated to ${planType}`, subscription });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
