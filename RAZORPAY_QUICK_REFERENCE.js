/**
 * RAZORPAY PAYMENT INTEGRATION - QUICK REFERENCE
 * 
 * Copy-paste snippets for quick implementation
 */

// ============================================================================
// 📌 QUICK START - Subscription Payment
// ============================================================================

import { handlePayment } from '@/lib/paymentHandler';

async function handleSubscriptionClick() {
  await handlePayment({
    amount: 499,
    purpose: 'subscription',
    metadata: { planName: 'Pro' },
    onSuccess: (result) => {
      console.log('✅ Subscription activated!', result.message);
      // Refresh page or update state
      window.location.reload();
    },
    onError: (error) => {
      alert(`❌ Payment failed: ${error.error}`);
    }
  });
}

// ============================================================================
// 💰 QUICK START - SkillCoins Purchase
// ============================================================================

import { handlePayment, getCoinPlans } from '@/lib/paymentHandler';

async function handleCoinPurchase(amount, coins) {
  await handlePayment({
    amount,
    purpose: 'coins',
    metadata: { coins, description: `Buy ${coins} SkillCoins` },
    onSuccess: (result) => {
      console.log(`✅ ${coins} SkillCoins added!`);
      // Refresh wallet balance
      fetchWalletBalance();
    },
    onError: (error) => {
      alert(`❌ Purchase failed: ${error.error}`);
    }
  });
}

// Get default coin plans
const plans = getCoinPlans();
// Returns: [{amount: 500, coins: 100, popular: false}, ...]

// ============================================================================
// 🔧 ENVIRONMENT SETUP
// ============================================================================

// Add to .env.local:
// RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
// RAZORPAY_KEY_SECRET=YOUR_SECRET_KEY_HERE
// NEXT_PUBLIC_RAZORPAY_KEY=rzp_test_XXXXXXXXXXXX

// ============================================================================
// 📡 BACKEND API ENDPOINTS
// ============================================================================

// POST /api/payment/create-order
// Input:
// {
//   "amount": 499,                    // INR
//   "purpose": "subscription",        // or "coins"
//   "metadata": { ... }              // optional
// }
// Output:
// {
//   "success": true,
//   "orderId": "order_XXXX",
//   "amount": 49900,                 // in paise
//   "keyId": "rzp_test_XXXX",
//   "transactionId": "..."
// }

// POST /api/payment/verify
// Input:
// {
//   "razorpayOrderId": "order_XXXX",
//   "razorpayPaymentId": "pay_XXXX",
//   "razorpaySignature": "signature_hash"
// }
// Output:
// {
//   "success": true,
//   "message": "Payment verified successfully",
//   "transactionId": "...",
//   "purpose": "subscription|coins"
// }

// ============================================================================
// 💾 DATABASE SCHEMA - Transaction Model
// ============================================================================

// New fields added to Transaction:
// {
//   ...existing fields...
//   purpose: 'subscription' | 'coins' | 'session' | 'other',
//   razorpayOrderId: String,         // Razorpay order ID
//   razorpayPaymentId: String,       // Razorpay payment ID
//   razorpaySignature: String,       // Payment signature
//   paymentStatus: 'pending' | 'successful' | 'failed',
//   metadata: { ...extra data... },
//   updatedAt: Date
// }

// ============================================================================
// 🧪 TEST CARDS
// ============================================================================

// Success: 4111 1111 1111 1111 (12/25, 123)
// Failure: 4222 2222 2222 2220 (12/25, 123)

// ============================================================================
// 🎨 REACT HOOK - Subscription Button
// ============================================================================

import { useState } from 'react';
import { handlePayment } from '@/lib/paymentHandler';

function SubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const upgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      await handlePayment({
        amount: 499,
        purpose: 'subscription',
        onSuccess: () => {
          setLoading(false);
          alert('✅ Subscription activated!');
        },
        onError: (err) => {
          setLoading(false);
          setError(err.error);
        }
      });
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  return (
    <div>
      <button onClick={upgrade} disabled={loading}>
        {loading ? 'Processing...' : 'Upgrade to Pro'}
      </button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
}

export default SubscriptionButton;

// ============================================================================
// 🎨 REACT COMPONENT - Coin Purchase Grid
// ============================================================================

import { useState } from 'react';
import { handlePayment, getCoinPlans } from '@/lib/paymentHandler';

function CoinPlans() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const plans = getCoinPlans();

  const purchase = async (amount, coins) => {
    setLoading(true);
    setError(null);
    try {
      await handlePayment({
        amount,
        purpose: 'coins',
        metadata: { coins },
        onSuccess: () => {
          setLoading(false);
          alert(`✅ ${coins} coins added!`);
        },
        onError: (err) => {
          setLoading(false);
          setError(err.error);
        }
      });
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {plans.map((plan) => (
          <div key={plan.amount} style={{ border: '1px solid #ddd', padding: '20px' }}>
            <h3>{plan.coins} Coins</h3>
            <p>₹{plan.amount}</p>
            <p>₹{(plan.amount / plan.coins).toFixed(2)} per coin</p>
            <button onClick={() => purchase(plan.amount, plan.coins)} disabled={loading}>
              {loading ? 'Processing...' : `Buy ₹${plan.amount}`}
            </button>
          </div>
        ))}
      </div>
      {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
    </div>
  );
}

export default CoinPlans;

// ============================================================================
// 🔍 DEBUGGING CHECKLIST
// ============================================================================

// ✓ Is RAZORPAY_KEY_ID set in .env.local?
// ✓ Is RAZORPAY_KEY_SECRET set in .env.local?
// ✓ Is NEXT_PUBLIC_RAZORPAY_KEY set in .env.local?
// ✓ Did you restart dev server after adding env vars?
// ✓ Check browser console for errors
// ✓ Check Network tab in DevTools for API responses
// ✓ Verify Razorpay script loads: window.Razorpay exists?
// ✓ Check MongoDB connection string
// ✓ Verify User model has walletBalance field
// ✓ Test with development Razorpay keys first

// ============================================================================
// 📊 MONITORING / LOGGING
// ============================================================================

// Log successful payment
console.log('Payment successful:', {
  orderId: result.orderId,
  paymentId: result.paymentId,
  purpose: result.purpose,
  timestamp: new Date()
});

// Log payment error
console.error('Payment failed:', {
  stage: error.stage,
  error: error.error,
  timestamp: new Date()
});

// Monitor in production:
// - Failed payments: Check /api/payment/verify responses
// - Transaction records: Query MongoDB directly
// - Razorpay dashboard: Check payment status

// ============================================================================
// 🚀 PRODUCTION DEPLOYMENT
// ============================================================================

// 1. Get production Razorpay keys from dashboard
//    Settings → API Keys (live mode)

// 2. Update .env.local (remove 'test' prefix)
//    RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXX
//    RAZORPAY_KEY_SECRET=rzp_live_XXXXXXXXXXXX
//    NEXT_PUBLIC_RAZORPAY_KEY=rzp_live_XXXXXXXXXXXX

// 3. Test end-to-end with real payment (smallest amount)

// 4. Monitor transactions in Razorpay dashboard

// 5. Set up payment failure alerts

// ============================================================================
// 📞 COMMON ERRORS & FIXES
// ============================================================================

// Error: "Razorpay credentials not configured"
// Fix: Check .env.local has RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET

// Error: "Payment verification failed: Invalid signature"
// Fix: Verify Razorpay keys are correct, server time is accurate

// Error: "Failed to fetch payment details"
// Fix: Check internet connection, Razorpay API status

// Error: "Wallet not updated after payment"
// Fix: Check MongoDB connection, User model validation

// Error: "Cannot find Razorpay in window"
// Fix: Ensure loadRazorpayScript() completes before opening checkout

// ============================================================================
// 🎯 FILES YOU'LL NEED TO MODIFY
// ============================================================================

// 1. src/app/placements/page.js (or wherever placement tab is)
//    Import and use handlePayment() for subscription
//    See: INTEGRATION_PLACEMENT_EXAMPLE.js

// 2. src/app/wallet/page.js (or wherever wallet tab is)
//    Import and use handlePayment() for coins purchase
//    See: INTEGRATION_WALLET_EXAMPLE.js

// 3. .env.local (create if doesn't exist)
//    Add Razorpay environment variables

// 4. package.json (dependencies already added?)
//    npm install axios crypto (if not already present)

// ============================================================================
