'use client';
import { useState } from 'react';
import { handlePayment, getCoinPlans } from '@/lib/paymentHandler';

export default function AddCoinsModal({ isOpen, onClose, onSuccess }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const plans = getCoinPlans().map((plan) => ({
    coins: plan.coins,
    price: plan.amount,
    label: `₹${plan.amount}`,
    popular: plan.popular
  }));

  const parsedCustomAmount = Number.parseInt(customAmount, 10);
  const purchasePrice = selectedPlan?.price ?? (Number.isFinite(parsedCustomAmount) ? parsedCustomAmount : 0);
  const purchaseCoins = selectedPlan?.coins ?? (purchasePrice >= 50 ? purchasePrice : 0);
  const canPurchase = purchasePrice >= 50 && purchaseCoins > 0 && !loading;

  const handlePurchase = async (amount, coins) => {
    if (!amount || !coins) return;

    if (amount < 50) {
      setErrorMessage('Minimum purchase is ₹50.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      await handlePayment({
        amount,
        purpose: 'coins',
        metadata: { coins },
        onSuccess: (result) => {
          setPaymentRef(result.paymentId || result.orderId || '');
          setSuccess(true);
          setLoading(false);

          setTimeout(() => {
            setSuccess(false);
            onSuccess?.(coins);
            handleClose();
          }, 2000);
        },
        onError: (error) => {
          setLoading(false);
          setErrorMessage(error.error || 'Payment failed. Please try again.');
        }
      });
    } catch (err) {
      console.error('Purchase error:', err);
      setLoading(false);
      setErrorMessage(err.message || 'Payment failed. Please try again.');
    }
  };

  const handleClose = () => {
    setSelectedPlan(null);
    setCustomAmount('');
    setSuccess(false);
    setLoading(false);
    setPaymentRef('');
    setErrorMessage('');
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
                    key={plan.price}
                    onClick={() => {
                      setSelectedPlan(plan);
                      setCustomAmount('');
                      setErrorMessage('');
                    }}
                    disabled={loading}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      selectedPlan?.price === plan.price
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {plan.popular && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">Popular</span>
                      </div>
                    )}
                    <div className="text-lg font-bold text-gray-900">{plan.coins}</div>
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
                    setErrorMessage('');
                  }}
                  placeholder="Enter amount"
                  disabled={loading}
                  min="50"
                  step="1"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg !bg-white !text-black caret-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Purchase Button */}
            <button
              onClick={() => handlePurchase(purchasePrice, purchaseCoins)}
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
                  <span>₹</span> Purchase {purchaseCoins > 0 ? `(${purchaseCoins} SC)` : ''}
                </>
              )}
            </button>

            {errorMessage && <p className="text-xs text-red-600 text-center">{errorMessage}</p>}

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
