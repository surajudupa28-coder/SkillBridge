/**
 * INTEGRATION EXAMPLE: Placement Tab - Subscription Payment
 * 
 * This example shows how to integrate Razorpay payment
 * for the Placement subscription feature
 * 
 * Location: src/app/placements/page.js
 * Add this to your existing Placement Tab component
 */

'use client';

import { useState } from 'react';
import { handlePayment, getSubscriptionPlans } from '@/lib/paymentHandler';

export default function PlacementTabExample() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const subscriptionPlans = getSubscriptionPlans();

  const handleUpgrade = async (planPrice) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await handlePayment({
        amount: planPrice, // ₹499 for Pro Plan
        purpose: 'subscription',
        metadata: {
          planName: 'Pro',
          planDuration: '30 days'
        },
        onSuccess: (result) => {
          setSuccess({
            message: result.message,
            transactionId: result.transactionId
          });
          setLoading(false);

          // Refresh user subscription status (optional)
          // window.location.reload();
          // or call a function to update local state
        },
        onError: (error) => {
          setError(error.error);
          setLoading(false);
        }
      });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="placement-subscription-section">
      <div className="subscription-plans-grid">
        {subscriptionPlans.map((plan) => (
          <div key={plan.name} className="plan-card">
            <h3>{plan.name} Plan</h3>
            <div className="plan-price">
              <span className="currency">₹</span>
              <span className="amount">{plan.price}</span>
              <span className="duration">/{plan.duration}</span>
            </div>

            <ul className="plan-features">
              {plan.features.map((feature) => (
                <li key={feature}>✓ {feature}</li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade(plan.price)}
              disabled={loading}
              className="upgrade-btn"
            >
              {loading ? 'Processing...' : 'Upgrade to Pro'}
            </button>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          <p>❌ {error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="alert alert-success">
          <p>✅ {success.message}</p>
          <p>Transaction ID: {success.transactionId}</p>
        </div>
      )}
    </div>
  );
}

/**
 * STYLING (Add to your CSS/Tailwind)
 * 
 * .placement-subscription-section {
 *   padding: 2rem;
 * }
 * 
 * .subscription-plans-grid {
 *   display: grid;
 *   grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
 *   gap: 2rem;
 *   margin-bottom: 2rem;
 * }
 * 
 * .plan-card {
 *   border: 2px solid #e0e0e0;
 *   border-radius: 12px;
 *   padding: 2rem;
 *   text-align: center;
 *   transition: all 0.3s ease;
 * }
 * 
 * .plan-card:hover {
 *   border-color: #3399cc;
 *   box-shadow: 0 8px 24px rgba(51, 153, 204, 0.2);
 * }
 * 
 * .plan-price {
 *   font-size: 2.5rem;
 *   font-weight: bold;
 *   margin: 1rem 0;
 *   color: #333;
 * }
 * 
 * .plan-price .currency {
 *   font-size: 1.5rem;
 * }
 * 
 * .plan-price .duration {
 *   font-size: 1rem;
 *   color: #666;
 * }
 * 
 * .plan-features {
 *   list-style: none;
 *   padding: 1.5rem 0;
 *   margin: 1.5rem 0;
 *   text-align: left;
 * }
 * 
 * .plan-features li {
 *   padding: 0.5rem 0;
 *   color: #555;
 * }
 * 
 * .upgrade-btn {
 *   width: 100%;
 *   padding: 1rem;
 *   background-color: #3399cc;
 *   color: white;
 *   border: none;
 *   border-radius: 8px;
 *   font-size: 1rem;
 *   font-weight: 600;
 *   cursor: pointer;
 *   transition: all 0.3s ease;
 * }
 * 
 * .upgrade-btn:hover:not(:disabled) {
 *   background-color: #2680b3;
 *   transform: translateY(-2px);
 *   box-shadow: 0 4px 12px rgba(51, 153, 204, 0.4);
 * }
 * 
 * .upgrade-btn:disabled {
 *   opacity: 0.6;
 *   cursor: not-allowed;
 * }
 * 
 * .alert {
 *   padding: 1rem;
 *   border-radius: 8px;
 *   margin: 1rem 0;
 * }
 * 
 * .alert-error {
 *   background-color: #fee;
 *   color: #c33;
 *   border: 1px solid #fcc;
 * }
 * 
 * .alert-success {
 *   background-color: #efe;
 *   color: #3c3;
 *   border: 1px solid #cfc;
 * }
 */
