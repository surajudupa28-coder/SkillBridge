import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { createRazorpayOrder } from '@/lib/razorpay';
import Transaction from '@/models/Transaction';

export async function POST(request) {
  try {
    // Authenticate user
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { amount, purpose, metadata } = body;

    // Validate input
    if (!amount || !purpose) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, purpose' },
        { status: 400 }
      );
    }

    if (!['subscription', 'coins'].includes(purpose)) {
      return NextResponse.json(
        { error: 'Invalid purpose. Must be "subscription" or "coins"' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate amount ranges
    if (purpose === 'subscription' && amount !== 499) {
      return NextResponse.json(
        { error: 'Invalid subscription amount. Only ₹499 is allowed' },
        { status: 400 }
      );
    }

    if (purpose === 'coins') {
      if (!Number.isInteger(amount) || amount < 50) {
        return NextResponse.json(
          { error: 'Invalid coin purchase amount. Minimum is ₹50 and amount must be a whole number.' },
          { status: 400 }
        );
      }
    }

    // Create Razorpay order
    const razorpayPublicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY || process.env.RAZORPAY_KEY_ID;

    const order = await createRazorpayOrder(amount, purpose, {
      userId: user._id.toString(),
      ...metadata
    });

    // Create pending transaction record
    const transaction = await Transaction.create({
      user: user._id,
      amount,
      type: 'credit',
      purpose,
      razorpayOrderId: order.orderId,
      paymentStatus: 'pending',
      metadata: {
        keyId: razorpayPublicKey,
        ...metadata
      }
    });

    return NextResponse.json({
      success: true,
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      transactionId: transaction._id,
      keyId: razorpayPublicKey
    });
  } catch (error) {
    console.error('Error in create-order API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
