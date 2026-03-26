# RAZORPAY PAYMENT SYSTEM - ARCHITECTURE DIAGRAM

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     SKILLBRIDGE PLATFORM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   FRONTEND (Next.js)                      │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                            │  │
│  │  ┌────────────────────┐    ┌────────────────────┐        │  │
│  │  │  Placement Tab     │    │   Wallet Tab       │        │  │
│  │  │  [Upgrade to Pro]  │    │  [Buy SkillCoins]  │        │  │
│  │  └─────────┬──────────┘    └────────┬───────────┘        │  │
│  │            │                        │                    │  │
│  │            └────────────┬───────────┘                    │  │
│  │                         │                               │  │
│  │            ┌────────────▼────────────┐                 │  │
│  │            │  handlePayment()        │                 │  │
│  │            │  (paymentHandler.js)    │                 │  │
│  │            └────────────┬────────────┘                 │  │
│  │                         │                               │  │
│  └─────────────────────────┼───────────────────────────────┘  │
│                            │                                   │
│                            ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │         RAZORPAY CHECKOUT POPUP                        │  │
│  │  ┌──────────────────────────────────────────────┐      │  │
│  │  │ • Load Razorpay Script                       │      │  │
│  │  │ • Display checkout form                      │      │  │
│  │  │ • Collect payment details                    │      │  │
│  │  │ • Process payment                            │      │  │
│  │  │ • Return signature + payment ID              │      │  │
│  │  └──────────────────────────────────────────────┘      │  │
│  └─────────────────────────────────────────────────────────┘  │
│                            │                                   │
└────────────────────────────┼───────────────────────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────┐
        │   RAZORPAY API (Payment Provider)   │
        │ • Process payment                  │
        │ • Return transaction details       │
        │ • Provide payment ID               │
        └────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│              BACKEND (Next.js API Routes)                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Step 1: CREATE ORDER                                         │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  POST /api/payment/create-order                      │    │
│  │  ────────────────────────────────────────────────    │    │
│  │  Input: {amount, purpose, metadata}                  │    │
│  │                                                      │    │
│  │  ┌─ Authenticate user (getAuthUser)                │    │
│  │  ├─ Validate input (amount, purpose)               │    │
│  │  ├─ Call Razorpay API (createRazorpayOrder)        │    │
│  │  ├─ Create pending Transaction in DB               │    │
│  │  └─ Return order ID + Razorpay key                │    │
│  │                                                      │    │
│  │  Output: {orderId, amount, keyId, transactionId}   │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                │
│  Step 2: VERIFY PAYMENT                                      │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  POST /api/payment/verify                           │    │
│  │  ─────────────────────────────                      │    │
│  │  Input: {orderId, paymentId, signature}             │    │
│  │                                                      │    │
│  │  ┌─ Authenticate user                              │    │
│  │  ├─ Find transaction by order ID                   │    │
│  │  ├─ Verify signature (crypto HMAC-SHA256)          │    │
│  │  ├─ Fetch payment from Razorpay API                │    │
│  │  ├─ Start MongoDB Session (for atomic transaction) │    │
│  │  │  ├─ Update Transaction status → successful      │    │
│  │  │  │                                               │    │
│  │  │  ├─ IF purpose='subscription':                 │    │
│  │  │  │  └─ Update UserSubscription → pro            │    │
│  │  │  │     └─ Set features & expiry date            │    │
│  │  │  │                                               │    │
│  │  │  └─ IF purpose='coins':                        │    │
│  │  │     └─ Add coins to User.walletBalance          │    │
│  │  │                                                  │    │
│  │  └─ Commit or rollback transaction                │    │
│  │                                                      │    │
│  │  Output: {success, message, transactionId}         │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────┐
        │   MONGODB DATABASE                  │
        │ ┌──────────────────────────────┐   │
        │ │ Collections Used:            │   │
        │ │ • Transaction (new fields)   │   │
        │ │ • User (walletBalance)       │   │
        │ │ • UserSubscription (plan)    │   │
        │ └──────────────────────────────┘   │
        │                                    │
        │ Each payment creates/updates:      │
        │ • Transaction record (1)           │
        │ • User record (coins only)         │
        │ • UserSubscription record (sub)    │
        │                                    │
        │ All in atomic session              │
        │ Rollback on any error              │
        └────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│              FRONTEND - onSuccess Callback                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  • Show success message to user                              │
│  • Update UI (walletBalance, subscription status)            │
│  • Refresh transaction history                               │
│  • Redirect to dashboard (optional)                          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Data Flow - Subscription Payment

```
User                    Frontend                Backend                 Razorpay
 │                         │                      │                        │
 ├──[Click "Pro"]──────────>│                      │                        │
 │                         │                      │                        │
 │                  [Call handlePayment()]        │                        │
 │                         │                      │                        │
 │                    [Load script]               │                        │
 │                         │                      │                        │
 │                  [Call create-order API]──────>│                        │
 │                         │                      ├─[Validate]            │
 │                         │                      │                        │
 │                         │                      ├─[Call Razorpay]───────>│
 │                         │                      │                        │
 │                         │                      │<──[Order ID]───────────┤
 │                         │                      │                        │
 │                         │<──[Return order]─────┤                        │
 │                         │                      │                        │
 │              [Open Razorpay Checkout]         │                        │
 │                         │                      │                        │
 │                    [Enter card]               │                        │
 │                  [Process payment]            │                        │
 │                         │                      │                        │
 │                         │                   [Process]                   │
 │                         │                      │                        │
 │                         │                      │<──[Payment Success]────┤
 │                         │                      │                        │
 │              [Get signature + ID]             │                        │
 │                         │                      │                        │
 │                 [Call verify API]────────────>│                        │
 │                         │                      │                        │
 │                         │              ├─[Verify sig]                  │
 │                         │              ├─[Fetch payment]──────────────>│
 │                         │              │                               │
 │                         │              │<────────────────────────────┤│
 │                         │              │                               │
 │                         │              ├─[Start DB session]            │
 │                         │              ├─[Update Transaction]          │
 │                         │              ├─[Update Subscription ✓]       │
 │                         │              ├─[Commit transaction]          │
 │                         │              │                               │
 │                         │<──[Success]──┤                               │
 │                         │              │                               │
 │<─[Show success + msg]───┤              │                               │
 │                         │              │                               │
 └─[Refresh page]         └─────────────┘                        └────────┘
```

---

## Data Flow - Coins Purchase

```
User                  Frontend              Backend               Database
 │                      │                     │                       │
 ├─[Select Plan]───────>│                     │                       │
 │                      │                     │                       │
 │              [Call handlePayment()]        │                       │
 │              (₹1000 → 250 coins)           │                       │
 │                      │                     │                       │
 │                 [Load script]              │                       │
 │                      │                     │                       │
 │              [POST create-order]──────────>│                       │
 │                      │                     ├─[Create order]───────>│
 │                      │                     │  (pending trans)       │
 │                      │<──────[orderId]─────┤                       │
 │                      │                     │                       │
 │          [Razorpay Checkout]              │                       │
 │                      │                     │                       │
 │                 [Card payment]            │                       │
 │                      │                     │                       │
 │         [Get signature + payments]        │                       │
 │                      │                     │                       │
 │           [POST verify]──────────────────>│                       │
 │                      │                     │                       │
 │                      │              ├─[Verify sig]                │
 │                      │              ├─[Start session]            │
 │                      │              ├─[Update transaction]──────>│
 │                      │              │                            │
 │                      │              ├─[Fetch user]──────────────>│
 │                      │              ├─[Add coins]────────────┐   │
 │                      │              │                        │   │
 │                      │              ├─[Update User]─────────>│   │
 │                      │              │                        ├──>│
 │                      │              ├─[Commit]────────────────┘   │
 │                      │              │                            │
 │                      │<─[Success]───┤                            │
 │                      │              │                            │
 │<──[Show +250 coins]──┤              │                            │
 │                      │              │                            │
 │[Refresh wallet]──────┤              │                            │
 └──────────────────────┘──────────────┴────────────────────────────┘
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   SECURITY LAYERS                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: AUTHENTICATION                                  │
│  ├─ Clerk authentication required                         │
│  ├─ getAuthUser() validates session                       │
│  ├─ Returns user._id for tracking                         │
│  └─ No unauthenticated access allowed                     │
│                                                             │
│  Layer 2: INPUT VALIDATION                                │
│  ├─ Amount range validation                               │
│  ├─ Purpose validation                                    │
│  ├─ Type checking                                         │
│  └─ Reject invalid requests                               │
│                                                             │
│  Layer 3: SIGNATURE VERIFICATION                          │
│  ├─ HMAC-SHA256 algorithm                                 │
│  ├─ Using Razorpay secret (not exposed to frontend)      │
│  ├─ Cannot be bypassed from client                        │
│  └─ Signature mismatch = payment rejected                 │
│                                                             │
│  Layer 4: API VERIFICATION                                │
│  ├─ Fetch payment from Razorpay API                       │
│  ├─ Verify payment status is "captured"                   │
│  ├─ Double-check amount matches                           │
│  └─ Confirm order was actually processed                  │
│                                                             │
│  Layer 5: DATABASE ATOMICITY                              │
│  ├─ MongoDB session transactions                          │
│  ├─ All-or-nothing updates                                │
│  ├─ Automatic rollback on error                           │
│  └─ Consistent state guaranteed                           │
│                                                             │
│  Layer 6: ERROR HANDLING                                  │
│  ├─ Try-catch blocks                                      │
│  ├─ Graceful failure modes                                │
│  ├─ No sensitive data in errors                           │
│  └─ Logged for debugging                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Frontend Security:
├─ NEXT_PUBLIC_RAZORPAY_KEY only (read-only)
├─ Secret key NEVER sent to browser
├─ All logic verification happens on backend
├─ User cannot modify payment data
└─ Server is source of truth

Backend Security:
├─ RAZORPAY_KEY_SECRET kept private
├─ Signature verification required
├─ User ownership verified
├─ MongoDB transactions prevent race conditions
└─ Comprehensive logging & monitoring
```

---

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        handlePayment() Function                       │  │
│  │  (src/lib/paymentHandler.js)                         │  │
│  │                                                       │  │
│  │  • loadRazorpayScript()                             │  │
│  │  • Call create-order API                           │  │
│  │  • Open Razorpay checkout                          │  │
│  │  • Handle success/error callbacks                  │  │
│  └──────┬──────────────────────────────────────────────┘  │
│         │                                                   │
│         ├─> razorpay.js (Server-only)                     │
│         │   ├─ createRazorpayOrder()                      │
│         │   ├─ verifyRazorpaySignature()                  │
│         │   └─ fetchRazorpayPayment()                     │
│         │                                                   │
│         ├─> create-order API                             │
│         │   ├─ Authenticate with getAuthUser()           │
│         │   ├─ Validate input                            │
│         │   ├─ Call razorpay.createRazorpayOrder()       │
│         │   └─ Store pending transaction                 │
│         │                                                   │
│         └─> verify API                                    │
│             ├─ Find transaction in DB                     │
│             ├─ Verify signature                           │
│             ├─ Verify with Razorpay API                   │
│             ├─ Update user based on purpose               │
│             └─ Return success/error                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Models Involved:
├─ User
│  └─ walletBalance (for coins)
├─ UserSubscription
│  └─ planType, features, dates (for subscription)
└─ Transaction (new/updated)
   ├─ razorpayOrderId
   ├─ razorpayPaymentId
   ├─ razorpaySignature
   ├─ paymentStatus
   ├─ purpose
   └─ metadata
```

---

## Error Handling Flow

```
┌─────────────────────────────────┐
│  Payment Process Start          │
└────────────┬────────────────────┘
             │
       ┌─────▼─────┐
       │ Any Error?│
       └─────┬─────┘
             │
      ┌──────┴──────┐
      │No           │ Yes
      ▼             ▼
  Continue      ┌──────────────────────┐
             │ Error Stage?           │
             └──────────────────────┘
                   │
        ┌──────────┼──────────┬──────────────┐
        │          │          │              │
   Initialization Checkout Verification   Unknown
        │          │          │              │
        ▼          ▼          ▼              ▼
    Catch    User cancel  Bad signature  Exception
    Error    dismissed    Payment failed  Handler
        │          │          │              │
        └──────────┴──────────┴──────────────┘
                   │
                   ▼
         ┌────────────────────┐
         │ onError Callback   │
         │ {stage, error}     │
         └────────────────────┘
                   │
                   ▼
         ┌────────────────────┐
         │ Show Error to User │
         │ (User-friendly)    │
         └────────────────────┘
                   │
                   ▼
         Database rollback
         (if transaction started)
```

---

## Database Schema

```
Transaction Collection:
├─ _id
├─ user (ref → User)
├─ amount (INR)
├─ type ('credit' | 'debit')
├─ purpose ('subscription' | 'coins')
├─ reason (optional)
├─ counterparty (ref → User, optional)
├─ sessionId (ref → Session, optional)
├─ razorpayOrderId ⭐
├─ razorpayPaymentId ⭐
├─ razorpaySignature ⭐
├─ paymentStatus ('pending' | 'successful' | 'failed') ⭐
├─ metadata {
│   ├─ keyId
│   ├─ coins (for coin purchases)
│   ├─ planName (for subscriptions)
│   └─ ... custom fields
│}
├─ createdAt
└─ updatedAt ⭐

⭐ = New/Updated fields

User Collection (Updated):
├─ ... existing fields ...
└─ walletBalance (incremented on coin purchase)

UserSubscription Collection (Updated on subscription):
├─ userId
├─ planType ← 'free' becomes 'pro'
├─ status ← 'inactive' becomes 'active'
├─ paymentStatus ← 'pending' becomes 'completed' ✓
├─ startDate ← current date
├─ endDate ← now + 30 days
├─ features {
│   ├─ recruiterVisibility: true ✓
│   ├─ placementAccess: true ✓
│   └─ placementAnalytics: true ✓
│}
└─ ... other fields ...
```

---

## Deployment Architecture

```
Development       Staging          Production
(Test Mode)       (Test Mode)      (Live Mode)
     │                 │                │
     ├─ Local DB       ├─ Cloud DB      ├─ Production DB
     ├─ Test Razorpay  ├─ Test Razorpay ├─ Live Razorpay
     │ Keys            │ Keys            │ Keys
     │                 │                 │
     └─ .env.local     └─ .env.staging   └─ .env.production
        rzp_test_*        rzp_test_*        rzp_live_*
```

This completes the Razorpay integration architecture documentation!
