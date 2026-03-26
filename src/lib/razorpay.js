import crypto from 'crypto';
import Razorpay from 'razorpay';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const razorpayInstance =
  RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET
    ? new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
    : null;

// Validate environment variables
if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  if (typeof window === 'undefined') {
    console.warn('[Razorpay] Missing environment variables: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET');
  }
}

/**
 * Create Razorpay Order
 * @param {number} amount - Amount in INR
 * @param {string} purpose - Purpose of payment ('subscription' | 'coins')
 * @param {object} metadata - Additional metadata
 * @returns {Promise<object>} - Order details
 */
export async function createRazorpayOrder(amount, purpose, metadata = {}) {
  if (!razorpayInstance) {
    throw new Error('Razorpay credentials not configured');
  }

  try {
    // Convert INR to paise (multiply by 100)
    const amountInPaise = Math.round(amount * 100);
    const response = await razorpayInstance.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        purpose,
        ...metadata
      }
    });

    return {
      orderId: response.id,
      amount: response.amount,
      currency: response.currency,
      receipt: response.receipt,
      status: response.status
    };
  } catch (error) {
    console.error('Error creating Razorpay order:', error.message);
    throw new Error(`Failed to create payment order: ${error.message}`);
  }
}

/**
 * Verify Razorpay Payment Signature
 * @param {object} paymentData - Payment response from frontend
 * @param {string} paymentData.orderId - Razorpay Order ID
 * @param {string} paymentData.paymentId - Razorpay Payment ID
 * @param {string} paymentData.signature - Razorpay Signature
 * @returns {boolean} - Signature validity
 */
export function verifyRazorpaySignature(orderId, paymentId, signature) {
  try {
    const message = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(message)
      .digest('hex');

    return generatedSignature === signature;
  } catch (error) {
    console.error('Error verifying Razorpay signature:', error.message);
    return false;
  }
}

/**
 * Fetch Payment Details from Razorpay
 * @param {string} paymentId - Razorpay Payment ID
 * @returns {Promise<object>} - Payment details
 */
export async function fetchRazorpayPayment(paymentId) {
  if (!razorpayInstance) {
    throw new Error('Razorpay credentials not configured');
  }

  try {
    const response = await razorpayInstance.payments.fetch(paymentId);

    return {
      paymentId: response.id,
      orderId: response.order_id,
      amount: response.amount,
      currency: response.currency,
      status: response.status,
      method: response.method,
      email: response.email,
      contact: response.contact,
      createdAt: new Date(response.created_at * 1000)
    };
  } catch (error) {
    console.error('Error fetching Razorpay payment:', error.message);
    throw new Error(`Failed to fetch payment details: ${error.message}`);
  }
}
