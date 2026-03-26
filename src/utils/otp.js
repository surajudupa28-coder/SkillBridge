import bcrypt from 'bcryptjs';

export async function generateOtpPayload() {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const hashedOtp = await bcrypt.hash(otp, 12);
  return { otp, hashedOtp };
}
