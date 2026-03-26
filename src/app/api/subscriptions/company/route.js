import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import CompanySubscription from '@/models/CompanySubscription';

export async function GET(req) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'company' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Company access required' }, { status: 403 });
    }

    let subscription = await CompanySubscription.findOne({ companyId: user._id });
    if (!subscription) {
      subscription = {
        companyId: user._id,
        planType: 'starter',
        status: 'active',
        startDate: new Date(),
        endDate: null,
        paymentStatus: 'none',
        features: { talentSearch: true, advancedFilters: false, fullAnalytics: false, apiAccess: false, unlimitedShortlist: false, hiringPipeline: false }
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
    if (user.role !== 'company' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Company access required' }, { status: 403 });
    }

    const { planType } = await req.json();
    if (!['starter', 'professional', 'enterprise'].includes(planType)) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    const featureMap = {
      starter: { talentSearch: true, advancedFilters: false, fullAnalytics: false, apiAccess: false, unlimitedShortlist: false, hiringPipeline: false },
      professional: { talentSearch: true, advancedFilters: true, fullAnalytics: true, apiAccess: false, unlimitedShortlist: true, hiringPipeline: true },
      enterprise: { talentSearch: true, advancedFilters: true, fullAnalytics: true, apiAccess: true, unlimitedShortlist: true, hiringPipeline: true }
    };

    const subscription = await CompanySubscription.findOneAndUpdate(
      { companyId: user._id },
      {
        planType,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        paymentStatus: 'completed',
        features: featureMap[planType]
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ message: `Company subscription updated to ${planType}`, subscription });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
