import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import { generateOtpPayload } from '@/utils/otp';
import { sendEmail } from '@/lib/email';

export async function POST(request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { otp, hashedOtp } = await generateOtpPayload();

    await User.findByIdAndUpdate(authUser._id, {
      otp: hashedOtp,
      otpExpiry: new Date(Date.now() + 5 * 60 * 1000),
      otpAttempts: 0
    });

    await sendEmail(
      authUser.email,
      'SkillBridge Wallet OTP',
      `Your wallet action OTP is ${otp}. It expires in 5 minutes.`
    );

    return NextResponse.json({ message: 'OTP sent successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
