#!/bin/bash
# Razorpay Integration - File Structure & Verification Script

echo "=========================================="
echo "Razorpay Integration - File Verification"
echo "=========================================="
echo ""

# Function to check file existence
check_file() {
  if [ -f "$1" ]; then
    echo "✅ $1"
  else
    echo "❌ MISSING: $1"
  fi
}

# Function to check directory existence
check_dir() {
  if [ -d "$1" ]; then
    echo "✅ $1/"
  else
    echo "❌ MISSING DIR: $1/"
  fi
}

echo "BACKEND - API Routes"
echo "-------------------"
check_file "src/app/api/payment/create-order/route.js"
check_file "src/app/api/payment/verify/route.js"
echo ""

echo "BACKEND - Libraries"
echo "-------------------"
check_file "src/lib/razorpay.js"
check_file "src/lib/paymentHandler.js"
echo ""

echo "BACKEND - Models (Updated)"
echo "-------------------"
check_file "src/models/Transaction.js"
echo "  (Should have: razorpayOrderId, razorpayPaymentId, purpose, paymentStatus)"
echo ""

echo "DOCUMENTATION"
echo "-------------------"
check_file "RAZORPAY_SETUP_GUIDE.md"
check_file "RAZORPAY_QUICK_REFERENCE.js"
check_file "INTEGRATION_PLACEMENT_EXAMPLE.js"
check_file "INTEGRATION_WALLET_EXAMPLE.js"
check_file "IMPLEMENTATION_SUMMARY.md"
echo ""

echo "=========================================="
echo "Environment Variables to Add"
echo "=========================================="
echo ""
echo "Add to .env.local:"
echo ""
echo "# Razorpay Configuration"
echo "RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX"
echo "RAZORPAY_KEY_SECRET=YOUR_SECRET_KEY_HERE"
echo "NEXT_PUBLIC_RAZORPAY_KEY=rzp_test_XXXXXXXXXXXX"
echo ""

echo "=========================================="
echo "Dependencies to Install"
echo "=========================================="
echo ""
echo "npm install axios"
echo "# (crypto is built-in)"
echo ""

echo "=========================================="
echo "Next Steps"
echo "=========================================="
echo ""
echo "1. Add environment variables to .env.local"
echo "2. Run: npm install axios"
echo "3. Restart dev server"
echo "4. Integrate code into:"
echo "   - src/app/placements/page.js (subscription)"
echo "   - src/app/wallet/page.js (coins)"
echo "5. Test payment flow"
echo ""
echo "See IMPLEMENTATION_SUMMARY.md for detailed guide"
echo ""
