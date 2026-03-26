# Razorpay Payment Integration - Complete Setup Guide

## Overview

This document provides complete setup instructions for integrating Razorpay payment processing into SkillBridge for:
1. **Placement Subscription** (Pro Plan at ₹499/month)
2. **Wallet SkillCoins Purchase** (₹500 → 100 coins, ₹1000 → 250 coins, ₹2000 → 600 coins)

---

## 📋 Project Structure

```
src/
├── app/
│   └── api/
│       └── payment/
│           ├── create-order/
│           │   └── route.js         ← Create Razorpay order
│           └── verify/
│               └── route.js         ← Verify payment signature
├── lib/
│   ├── razorpay.js                 ← Razorpay utility functions
│   ├── paymentHandler.js           ← Frontend payment handler
│   └── db.js                       ← Database connection
└── models/
    ├── Transaction.js              ← Updated with Razorpay fields
    ├── User.js                     ← Existing user model
    └── UserSubscription.js         ← Existing subscription model
```

---

## 🔧 Installation & Setup

### Step 1: Install Dependencies

```bash
npm install axios crypto
```

### Step 2: Environment Variables

Add to `.env.local`:

```env
# Razorpay Configuration (Get from https://dashboard.razorpay.com/app/settings/api-keys)
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=YOUR_SECRET_KEY_HERE

# This key needs to be public for frontend
NEXT_PUBLIC_RAZORPAY_KEY=rzp_test_XXXXXXXXXXXX

# MongoDB Connection (Already configured)
MONGODB_URI=mongodb://...

# Clerk Authentication (Already configured)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
```

### Step 3: Get Razorpay Credentials

1. Visit [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Go to **Settings → API Keys**
3. Copy **Key ID** and **Key Secret**
4. Add both to `.env.local`

---

## 🏗️ Architecture Overview

### Payment Flow

```
User Interaction
    ↓
Frontend: handlePayment()
    ↓
Create Order API
    ├─ Validate input
    ├─ Create Razorpay order (via Razorpay API)
    ├─ Store pending transaction in MongoDB
    └─ Return order ID + Razorpay key
    ↓
Razorpay Checkout Popup
    ├─ User enters payment details
    ├─ Razorpay processes payment
    └─ Returns signature + payment ID
    ↓
Verify API
    ├─ Verify signature (crypto)
    ├─ Fetch payment from Razorpay API
    ├─ Update database in MongoDB transaction
    │   ├─ Mark transaction as successful
    │   ├─ For coins: Add to user wallet
    │   └─ For subscription: Activate pro plan
    └─ Return success confirmation
    ↓
Frontend: Success Callback
    └─ Update UI / Redirect
```

### Database Transaction

The verify API uses MongoDB sessions for atomicity:
- If any step fails, entire transaction is rolled back
- Ensures consistency between payment, user, and subscription records

---

## 💾 Database Schema

### Transaction Model Updates

```javascript
{
  user: ObjectId,                    // Reference to User
  amount: Number,                    // INR amount
  type: 'credit' | 'debit',         // Always 'credit' for purchases
  purpose: 'subscription' | 'coins', // Payment purpose
  razorpayOrderId: String,          // Razorpay order ID
  razorpayPaymentId: String,        // Razorpay payment ID
  razorpaySignature: String,        // Payment signature
  paymentStatus: 'pending' | 'successful' | 'failed',
  metadata: {                        // Additional data
    userId: String,
    coins: Number,
    // ... other metadata
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔌 API Endpoints

### 1. POST /api/payment/create-order

Creates a Razorpay payment order.

**Request:**
```json
{
  "amount": 499,
  "purpose": "subscription",
  "metadata": {
    "userName": "John Doe",
    "userEmail": "john@example.com"
  }
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "orderId": "order_XXXXXXXXXXXX",
  "amount": 49900,
  "currency": "INR",
  "receipt": "receipt_1234567890",
  "transactionId": "ObjectId",
  "keyId": "rzp_test_XXXXXXXXXXXX"
}
```

**Response (Error 400/500):**
```json
{
  "error": "Error message"
}
```

**Validation:**
- `amount`: Required, must be > 0
- `purpose`: Required, must be "subscription" or "coins"
- Subscription: Only ₹499 allowed
- Coins: Only ₹500, ₹1000, ₹2000 allowed

---

### 2. POST /api/payment/verify

Verifies payment signature and updates database.

**Request:**
```json
{
  "razorpayOrderId": "order_XXXXXXXXXXXX",
  "razorpayPaymentId": "pay_XXXXXXXXXXXX",
  "razorpaySignature": "signature_hash"
}
```

**Response (Success 200):**
```json
{
  "success": true,
  "message": "Payment verified successfully. Subscription activated!",
  "transactionId": "ObjectId",
  "paymentId": "pay_XXXXXXXXXXXX",
  "orderId": "order_XXXXXXXXXXXX",
  "purpose": "subscription"
}
```

**Response (Error 400/500):**
```json
{
  "error": "Payment verification failed: Invalid signature"
}
```

**What Happens:**
- **Subscription**: Updates UserSubscription → pro, activates features
- **Coins**: Adds coins to user wallet, updates Transaction

---

## 🎯 Frontend Integration

### Using handlePayment()

```javascript
import { handlePayment } from '@/lib/paymentHandler';

// Basic usage
await handlePayment({
  amount: 499,                    // INR
  purpose: 'subscription',        // or 'coins'
  metadata: {                     // Optional
    planName: 'Pro',
    userName: 'John Doe'
  },
  onSuccess: (result) => {
    console.log('Payment successful:', result);
    // Handle success - update UI, redirect, etc.
  },
  onError: (error) => {
    console.error('Payment failed:', error);
    // Handle error - show message to user
  }
});
```

### Available Utility Functions

```javascript
import {
  handlePayment,           // Main function
  loadRazorpayScript,     // Load script dynamically
  getCoinPlans,           // Get coin plans: [{amount, coins, popular}, ...]
  getSubscriptionPlans    // Get subscription plans
} from '@/lib/paymentHandler';
```

---

## 📱 Feature 1: Placement Subscription

### Integration Example

See `INTEGRATION_PLACEMENT_EXAMPLE.js` for complete code.

**Key Points:**
- Button: "Upgrade to Pro"
- Price: ₹499/month
- Features enabled: Recruiter visibility, Placement access, Analytics
- Stores in: UserSubscription collection

**Example Component:**
```javascript
import { handlePayment } from '@/lib/paymentHandler';

function UpgradeButton() {
  const handleUpgrade = async () => {
    await handlePayment({
      amount: 499,
      purpose: 'subscription',
      onSuccess: (result) => {
        alert('Subscription activated!');
      },
      onError: (error) => {
        alert('Payment failed: ' + error.error);
      }
    });
  };

  return <button onClick={handleUpgrade}>Upgrade to Pro</button>;
}
```

---

## 💰 Feature 2: Wallet SkillCoins

### Integration Example

See `INTEGRATION_WALLET_EXAMPLE.js` for complete code.

**Coin Plans:**
| Plan | Amount | Coins | Per Coin |
|------|--------|-------|----------|
| Bronze | ₹500 | 100 | ₹5.00 |
| Silver | ₹1000 | 250 | ₹4.00 |
| Gold | ₹2000 | 600 | ₹3.33 |

**Key Points:**
- Show all three plans
- Mark Silver as "Most Popular"
- Display coins per rupee rate
- Update wallet balance after successful payment
- Show transaction history

**Example Component:**
```javascript
import { handlePayment, getCoinPlans } from '@/lib/paymentHandler';

function CoinPurchase() {
  const coinPlans = getCoinPlans(); // [{amount: 500, coins: 100, popular: false}, ...]

  const handleBuy = async (amount, coins) => {
    await handlePayment({
      amount,
      purpose: 'coins',
      metadata: { coins },
      onSuccess: (result) => {
        alert(`${coins} coins added!`);
        fetchWalletBalance(); // Refresh balance
      },
      onError: (error) => {
        alert('Purchase failed: ' + error.error);
      }
    });
  };

  return (
    <div>
      {coinPlans.map(plan => (
        <button
          key={plan.amount}
          onClick={() => handleBuy(plan.amount, plan.coins)}
        >
          Buy {plan.coins} coins for ₹{plan.amount}
        </button>
      ))}
    </div>
  );
}
```

---

## 🔐 Security Features

### 1. Signature Verification
```javascript
// Uses HMAC-SHA256 with Razorpay secret
verifyRazorpaySignature(orderId, paymentId, signature)
```

### 2. Server-Side Verification
- Signature always verified on backend
- Frontend cannot bypass payment verification
- Order details verified from Razorpay API

### 3. MongoDB Transactions
```javascript
// Ensures atomic updates
const session = await mongoose.startSession();
session.startTransaction();
// ... all database operations
// Auto-rolled back on error
await session.abortTransaction();
await session.commitTransaction();
```

### 4. Input Validation
- Amount validation
- Purpose validation
- User authentication check
- Signature validation

### 5. Environment Variables
- Secret key never exposed to frontend
- Only public key in frontend code (~env.local)

---

## 🧪 Testing in Test Mode

Razorpay provides test cards for development:

### Test Card Numbers
```
Payment Success:
Card: 4111 1111 1111 1111
Expiry: 12/25
CVV: 123

Payment Failure:
Card: 4222 2222 2222 2220
Expiry: 12/25
CVV: 123
```

### Test Flows
1. Create order
2. Open checkout
3. Use test card
4. Verify payment on backend
5. Check database records

---

## 📊 Transaction States

```
pending → successful (payment completed)
       → failed (signature invalid, payment not captured)
```

---

## 🐛 Troubleshooting

### Issue: "Razorpay credentials not configured"
- Check `.env.local` has `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- Restart dev server after adding env variables

### Issue: "Signature verification failed"
- Verify Razorpay keys are correct
- Check timestamp on server is accurate
- Ensure orderId and paymentId match

### Issue: "Payment successful but wallet not updated"
- Check MongoDB connection
- Verify User model has `walletBalance` field
- Check transaction status in MongoDB

### Issue: Razorpay script not loading
- Check internet connection
- Verify `https://checkout.razorpay.com/v1/checkout.js` is accessible
- Check browser console for errors

---

## ✅ Deployment Checklist

- [ ] Update `.env.local` with production Razorpay credentials
- [ ] Update NEXT_PUBLIC_RAZORPAY_KEY to production public key
- [ ] Test payment flow end-to-end
- [ ] Verify MongoDB transactions work
- [ ] Check error messages are user-friendly
- [ ] Test with various payment scenarios
- [ ] Review security considerations
- [ ] Setup monitoring/logging for payment errors
- [ ] Document payment troubleshooting for support team

---

## 📚 Related Documentation

- [Razorpay Official Docs](https://razorpay.com/docs/api/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [MongoDB Transactions](https://docs.mongodb.com/manual/core/transactions/)
- [Mongoose Schema](https://mongoosejs.com/docs/guide.html)

---

## 📝 Files Created/Modified

### Created:
- `/src/app/api/payment/create-order/route.js` - Create order API
- `/src/app/api/payment/verify/route.js` - Verify payment API
- `/src/lib/razorpay.js` - Razorpay utilities
- `/src/lib/paymentHandler.js` - Frontend payment handler

### Modified:
- `/src/models/Transaction.js` - Added Razorpay fields

### Examples:
- `INTEGRATION_PLACEMENT_EXAMPLE.js` - Subscription integration
- `INTEGRATION_WALLET_EXAMPLE.js` - Coins purchase integration

---

## 🎉 Summary

Your Razorpay payment integration is now ready:

✅ Placement tab subscription payment (₹499/month)
✅ Wallet SkillCoins purchase (₹500, ₹1000, ₹2000)
✅ Secure signature verification
✅ MongoDB transaction support
✅ Reusable payment handler
✅ Complete error handling
✅ Test mode support

Next steps:
1. Add environment variables
2. Integrate components into existing pages
3. Test payment flow
4. Deploy to production with live Razorpay keys
