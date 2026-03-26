/**
 * Frontend payment handler for Razorpay integration
 * Handles payment flow: create order → open checkout → verify payment
 */

/**
 * Load Razorpay script dynamically
 * @returns {Promise<void>}
 */
export function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

/**
 * Main payment handler
 * @param {object} config - Payment configuration
 * @param {number} config.amount - Amount in INR
 * @param {string} config.purpose - Payment purpose ('subscription' | 'coins')
 * @param {object} config.metadata - Additional metadata (optional)
 * @param {function} config.onSuccess - Success callback
 * @param {function} config.onError - Error callback
 * @returns {Promise<void>}
 */
export async function handlePayment({
  amount,
  purpose,
  metadata = {},
  onSuccess,
  onError
}) {
  try {
    // Load Razorpay script
    await loadRazorpayScript();

    // Step 1: Create order on backend
    const createOrderResponse = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount,
        purpose,
        metadata
      })
    });

    if (!createOrderResponse.ok) {
      const error = await createOrderResponse.json();
      throw new Error(error.error || 'Failed to create payment order');
    }

    const orderData = await createOrderResponse.json();
    if (!orderData.success) {
      throw new Error(orderData.error || 'Failed to create payment order');
    }

    // Step 2: Open Razorpay checkout popup
    const options = {
      key: orderData.keyId,
      amount: orderData.amount, // Amount in paise
      currency: orderData.currency,
      name: 'SkillBridge',
      description: purpose === 'subscription' ? 'Pro Plan Subscription' : 'SkillCoins Purchase',
      order_id: orderData.orderId,
      prefill: {
        name: metadata.userName || '',
        email: metadata.userEmail || '',
        contact: metadata.userContact || ''
      },
      handler: async (response) => {
        try {
          // Step 3: Verify payment on backend
          const verifyResponse = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            })
          });

          const verifyData = await verifyResponse.json();

          if (!verifyResponse.ok || !verifyData.success) {
            throw new Error(verifyData.error || 'Payment verification failed');
          }

          // Success callback
          if (onSuccess) {
            onSuccess({
              transactionId: verifyData.transactionId,
              paymentId: verifyData.paymentId,
              orderId: verifyData.orderId,
              purpose: verifyData.purpose,
              message: verifyData.message
            });
          }
        } catch (error) {
          console.error('Payment verification error:', error);
          if (onError) {
            onError({
              stage: 'verification',
              error: error.message
            });
          }
        }
      },
      modal: {
        confirm_close: true,
        ondismiss: () => {
          if (onError) {
            onError({
              stage: 'checkout',
              error: 'Payment cancelled by user'
            });
          }
        }
      },
      theme: {
        color: '#3399cc'
      }
    };

    // Open Razorpay checkout
    const razorpayInstance = new window.Razorpay(options);
    razorpayInstance.open();
  } catch (error) {
    console.error('Payment handler error:', error);
    if (onError) {
      onError({
        stage: 'initialization',
        error: error.message
      });
    }
  }
}

/**
 * Get SkillCoins purchase plans
 * @returns {Array<object>} - Coin plans
 */
export function getCoinPlans() {
  return [
    { amount: 100, coins: 100, popular: false },
    { amount: 250, coins: 250, popular: true },
    { amount: 500, coins: 500, popular: false },
    { amount: 1000, coins: 1000, popular: false }
  ];
}

/**
 * Get subscription plans
 * @returns {Array<object>} - Subscription plans
 */
export function getSubscriptionPlans() {
  return [
    {
      name: 'Pro',
      price: 499,
      duration: 'month',
      features: [
        'Recruiter Visibility',
        'Placement Access',
        'Placement Analytics'
      ]
    }
  ];
}
