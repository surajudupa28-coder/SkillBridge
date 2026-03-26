'use client';
import { useState } from 'react';

export default function AddCoinsModal({ isOpen, onClose, onSuccess }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');

  const plans = [
    { amount: 100, price: 100, label: '₹100', popular: false },
    { amount: 250, price: 250, label: '₹250', popular: true },
    { amount: 500, price: 500, label: '₹500', popular: false },
    { amount: 1000, price: 1000, label: '₹1000', popular: false },
  ];

  const parsedCustomAmount = Number.parseInt(customAmount, 10);
  const purchaseAmount = selectedPlan ?? (Number.isFinite(parsedCustomAmount) ? parsedCustomAmount : 0);
  const canPurchase = purchaseAmount >= 50 && !loading;

  const handlePurchase = async (amount) => {
    if (!amount || amount < 50) return;

    try {
      setLoading(true);
      
      // Simulate Razorpay payment flow
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Call wallet API
      await fetch('/api/wallet/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      }).catch(() => null);

      const fakeRef = `pay_${Date.now().toString(36)}`;
      setPaymentRef(fakeRef);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setLoading(false);
        onSuccess?.(amount);
        handleClose();
      }, 2000);
    } catch (err) {
      console.error('Purchase error:', err);
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedPlan(null);
    setCustomAmount('');
    setSuccess(false);
    setLoading(false);
    setPaymentRef('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4 sm:p-8">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Add SkillCoins</h2>
          <button
            onClick={handleClose}
            className="text-indigo-100 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Success State */}
        {success ? (
          <div className="flex flex-col items-center justify-center p-8 min-h-80">
            <div className="text-6xl mb-4 animate-bounce">✓</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Razorpay Payment Successful</h3>
            <p className="text-gray-600 text-center">Your SkillCoins have been added to your wallet.</p>
            {paymentRef && <p className="text-xs text-gray-500 mt-2">Payment ID: {paymentRef}</p>}
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Preset Plans */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Choose a plan:</p>
              <div className="grid grid-cols-2 gap-3">
                {plans.map((plan) => (
                  <button
                    key={plan.amount}
                    onClick={() => {
                      setSelectedPlan(plan.amount);
                      setCustomAmount('');
                    }}
                    disabled={loading}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      selectedPlan === plan.amount
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {plan.popular && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">Popular</span>
                      </div>
                    )}
                    <div className="text-lg font-bold text-gray-900">{plan.amount}</div>
                    <div className="text-xs text-gray-600">{plan.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span>or</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Custom Amount */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Custom amount:</label>
              <div className="flex items-center gap-2">
                  <span className="text-gray-600">₹</span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedPlan(null);
                  }}
                  placeholder="Enter amount"
                  disabled={loading}
                  min="50"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg !bg-white !text-black caret-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Purchase Button */}
            <button
              onClick={() => handlePurchase(purchaseAmount)}
              disabled={!canPurchase}
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Processing Razorpay...
                </>
              ) : (
                <>
                  <span>₹</span> Purchase {purchaseAmount > 0 ? `(${purchaseAmount} SC)` : ''}
                </>
              )}
            </button>

            {/* Info Text */}
            <p className="text-xs text-gray-500 text-center">
              1 SkillCoin = ₹1 | Minimum purchase: ₹50
            </p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
