import { auth, currentUser } from '@clerk/nextjs/server';
import bcrypt from 'bcryptjs';
import dbConnect from './db';
import User from '../models/User';

// Validate Clerk environment variables at module initialization
if (typeof window === 'undefined') {
  // Server-side only
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;
  
  if (!publishableKey || !secretKey) {
    const missing = [];
    if (!publishableKey) missing.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
    if (!secretKey) missing.push('CLERK_SECRET_KEY');
    console.error(`[Auth Error] Missing required Clerk environment variables: ${missing.join(', ')}. Please set them in .env.local or your hosting environment.`);
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Clerk environment configuration incomplete. Cannot start server.');
    }
  }
}

export async function getAuthUser(request) {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    await dbConnect();
    let user = await User.findOne({ clerkId: userId }).select('-password');
    if (user) return user;

    const clerkUser = await currentUser();
    const primaryEmail =
      clerkUser?.emailAddresses?.find((e) => e.id === clerkUser?.primaryEmailAddressId)?.emailAddress ||
      clerkUser?.emailAddresses?.[0]?.emailAddress ||
      null;

    if (primaryEmail) {
      user = await User.findOne({ email: primaryEmail.toLowerCase() }).select('-password');
      if (user) {
        if (!user.clerkId) {
          user.clerkId = userId;
          await user.save();
        }
        return user;
      }
    }

    const fallbackEmail = `${userId}@clerk.local`;
    const nameFromEmail = (primaryEmail || fallbackEmail).split('@')[0];
    const displayName =
      [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ').trim() ||
      clerkUser?.username ||
      nameFromEmail;

    try {
      user = await User.create({
        clerkId: userId,
        name: displayName,
        email: (primaryEmail || fallbackEmail).toLowerCase(),
      });
      return user;
    } catch (createErr) {
      if (createErr?.code === 11000 && primaryEmail) {
        user = await User.findOne({ email: primaryEmail.toLowerCase() }).select('-password');
        if (user) {
          if (!user.clerkId) {
            user.clerkId = userId;
            await user.save();
          }
          return user;
        }
      }
      throw createErr;
    }
  } catch (error) {
    throw new Error(error?.message || 'Failed to resolve authenticated user');
  }
}

export async function getClerkAuth() {
  return await auth();
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}
