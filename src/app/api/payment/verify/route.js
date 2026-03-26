import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { verifyRazorpaySignature, fetchRazorpayPayment } from '@/lib/razorpay';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import UserSubscription from '@/models/UserSubscription';
import mongoose from 'mongoose';

export async function POST(request) {
  let session;

  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    session = await mongoose.startSession();
    session.startTransaction();

    const body = await request.json();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    // Validate input
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: 'Missing payment verification data' },
        { status: 400 }
      );
    }

    // Find transaction
    const transaction = await Transaction.findOne({
      razorpayOrderId,
      user: user._id
    }).session(session);

    if (!transaction) {
      await session.abortTransaction();
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (transaction.paymentStatus === 'successful') {
      await session.commitTransaction();
      return NextResponse.json({
        success: true,
        message: 'Payment already verified.',
        transactionId: transaction._id,
        paymentId: transaction.razorpayPaymentId,
        orderId: transaction.razorpayOrderId,
        purpose: transaction.purpose
      });
    }

    // Verify Razorpay signature
    const isSignatureValid = verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isSignatureValid) {
      // Mark transaction as failed
      transaction.paymentStatus = 'failed';
      transaction.razorpayPaymentId = razorpayPaymentId;
      transaction.razorpaySignature = razorpaySignature;
      transaction.updatedAt = new Date();
      await transaction.save({ session });
      await session.abortTransaction();

      return NextResponse.json(
        { error: 'Payment verification failed: Invalid signature' },
        { status: 400 }
      );
    }

    // Fetch payment details from Razorpay for verification
    let paymentDetails;
    try {
      paymentDetails = await fetchRazorpayPayment(razorpayPaymentId);
      
      if (paymentDetails.status !== 'captured') {
        throw new Error(`Payment status is ${paymentDetails.status}, expected captured`);
      }
    } catch (error) {
      console.error('Error verifying payment status:', error);
      await session.abortTransaction();
      return NextResponse.json(
        { error: 'Failed to verify payment status' },
        { status: 400 }
      );
    }

    // Update transaction
    transaction.razorpayPaymentId = razorpayPaymentId;
    transaction.razorpaySignature = razorpaySignature;
    transaction.paymentStatus = 'successful';
    transaction.updatedAt = new Date();

    // Handle subscription payment
    if (transaction.purpose === 'subscription') {
      // Update or create user subscription
      let userSub = await UserSubscription.findOne({
        userId: user._id
      }).session(session);

      if (!userSub) {
        userSub = new UserSubscription({
          userId: user._id,
          planType: 'pro'
        });
      } else {
        userSub.planType = 'pro';
      }

      userSub.status = 'active';
      userSub.paymentStatus = 'completed';
      userSub.startDate = new Date();
      userSub.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      userSub.features = {
        recruiterVisibility: true,
        placementAccess: true,
        placementAnalytics: true
      };

      await userSub.save({ session });
    }

    // Handle coin purchase
    if (transaction.purpose === 'coins') {
      const coinsToAdd = Number(transaction.amount);
      if (!Number.isInteger(coinsToAdd) || coinsToAdd < 50) {
        await session.abortTransaction();
        return NextResponse.json(
          { error: 'Invalid coin purchase amount' },
          { status: 400 }
        );
      }

      // Update user wallet using in-session document for atomic consistency.
      const dbUser = await User.findById(user._id).session(session);
      if (!dbUser) {
        await session.abortTransaction();
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      dbUser.walletBalance = (dbUser.walletBalance || 0) + coinsToAdd;
      await dbUser.save({ session });
    }

    await transaction.save({ session });
    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: `Payment verified successfully. ${transaction.purpose === 'subscription' ? 'Subscription activated!' : 'SkillCoins added to wallet!'}`,
      transactionId: transaction._id,
      paymentId: razorpayPaymentId,
      orderId: razorpayOrderId,
      purpose: transaction.purpose
    });
  } catch (error) {
    if (session?.inTransaction()) {
      await session.abortTransaction();
    }
    console.error('Error in verify API:', error);
    return NextResponse.json(
      { error: error.message || 'Payment verification failed' },
      { status: 500 }
    );
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}
