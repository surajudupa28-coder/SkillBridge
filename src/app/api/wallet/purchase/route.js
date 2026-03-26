import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { getAuthUser } from '@/lib/auth';
import { verifyUserOtp } from '@/utils/otpVerification';

export async function POST(request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await dbConnect();

    const { amount, otp } = await request.json();
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Optional OTP verification for sensitive wallet actions.
    if (otp) {
      const otpResult = await verifyUserOtp(user, otp);
      if (!otpResult.ok) {
        return NextResponse.json({ error: otpResult.error }, { status: otpResult.status });
      }
    }

    await User.findByIdAndUpdate(user._id, { $inc: { walletBalance: amount } });

    await Transaction.create({
      user: user._id,
      amount,
      type: 'credit',
      reason: 'SkillCoin purchase'
    });

    const updated = await User.findById(user._id).select('walletBalance');
    return NextResponse.json({ balance: updated.walletBalance });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
