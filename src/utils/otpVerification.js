import bcrypt from 'bcryptjs';

const MAX_OTP_ATTEMPTS = 3;

export async function verifyUserOtp(user, providedOtp) {
  if (!providedOtp) {
    return { ok: false, status: 400, error: 'OTP is required' };
  }

  if (!user.otp || !user.otpExpiry) {
    return { ok: false, status: 400, error: 'No active OTP. Please request a new OTP.' };
  }

  if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
    return { ok: false, status: 429, error: 'Maximum OTP attempts exceeded. Please resend OTP.' };
  }

  if (new Date(user.otpExpiry).getTime() < Date.now()) {
    return { ok: false, status: 400, error: 'OTP expired. Please request a new OTP.' };
  }

  const isMatch = await bcrypt.compare(providedOtp, user.otp);

  if (!isMatch) {
    user.otpAttempts = (user.otpAttempts || 0) + 1;
    await user.save();

    return {
      ok: false,
      status: 400,
      error: user.otpAttempts >= MAX_OTP_ATTEMPTS
        ? 'Maximum OTP attempts exceeded. Please resend OTP.'
        : 'Invalid OTP'
    };
  }

  user.otp = null;
  user.otpExpiry = null;
  user.otpAttempts = 0;
  await user.save();

  return { ok: true };
}
