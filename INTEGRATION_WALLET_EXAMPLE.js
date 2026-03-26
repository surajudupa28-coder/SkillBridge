/**
 * INTEGRATION EXAMPLE: Wallet Tab - SkillCoins Purchase
 * 
 * This example shows how to integrate Razorpay payment
 * for SkillCoins purchase in the Wallet tab
 * 
 * Location: src/app/wallet/page.js
 * Add this to your existing Wallet Tab component
 */

'use client';

import { useState, useEffect } from 'react';
import { handlePayment, getCoinPlans } from '@/lib/paymentHandler';

export default function WalletTabExample() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userBalance, setUserBalance] = useState(0);

  const coinPlans = getCoinPlans();

  useEffect(() => {
    // Fetch user wallet balance
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch('/api/wallet');
      const data = await response.json();
      setUserBalance(data.balance || 0);
    } catch (err) {
      console.error('Error fetching wallet balance:', err);
    }
  };

  const handleCoinPurchase = async (planAmount, planCoins) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await handlePayment({
        amount: planAmount, // INR amount
        purpose: 'coins',
        metadata: {
          coins: planCoins,
          coinsPerRupee: (planCoins / planAmount).toFixed(2)
        },
        onSuccess: (result) => {
          setSuccess({
            message: `✨ ${planCoins} SkillCoins added to your wallet!`,
            coins: planCoins,
            transactionId: result.transactionId
          });
          setLoading(false);

          // Refresh wallet balance
          setTimeout(() => {
            fetchWalletBalance();
          }, 1000);

          // Clear success message after 3 seconds
          setTimeout(() => {
            setSuccess(null);
          }, 3000);
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
    <div className="wallet-section">
      {/* Current Balance */}
      <div className="wallet-balance-card">
        <h2>Your Wallet</h2>
        <div className="balance-display">
          <span className="coin-icon">💰</span>
          <div className="balance-info">
            <p className="balance-amount">{userBalance}</p>
            <p className="balance-label">SkillCoins</p>
          </div>
        </div>
      </div>

      {/* SkillCoins Purchase Plans */}
      <div className="coin-plans-section">
        <h3>Purchase SkillCoins</h3>
        <div className="coin-plans-grid">
          {coinPlans.map((plan) => (
            <div
              key={plan.amount}
              className={`coin-plan-card ${plan.popular ? 'popular' : ''}`}
            >
              {plan.popular && <span className="popular-badge">Most Popular</span>}

              <div className="coin-amount">
                <span className="coins">{plan.coins}</span>
                <span className="label">SkillCoins</span>
              </div>

              <div className="coin-price">
                <span>₹{plan.amount}</span>
              </div>

              <div className="coin-rate">
                <p>₹{(plan.amount / plan.coins).toFixed(2)} per coin</p>
              </div>

              <button
                onClick={() => handleCoinPurchase(plan.amount, plan.coins)}
                disabled={loading}
                className={`buy-btn ${plan.popular ? 'primary' : 'secondary'}`}
              >
                {loading ? 'Processing...' : `Buy ₹${plan.amount}`}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          <p>❌ {error}</p>
          <button
            onClick={() => setError(null)}
            className="alert-close"
          >
            ✕
          </button>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="alert alert-success">
          <p>✅ {success.message}</p>
          <p className="transaction-id">
            Transaction ID: {success.transactionId}
          </p>
        </div>
      )}

      {/* Transaction History */}
      <TransactionHistorySection />
    </div>
  );
}

/**
 * Transaction History Component
 * Shows recent wallet transactions
 */
function TransactionHistorySection() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/wallet');
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  return (
    <div className="transaction-history">
      <h3>Transaction History</h3>
      {transactions.length === 0 ? (
        <p className="no-transactions">No transactions yet</p>
      ) : (
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Coins</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <tr key={txn._id}>
                <td>{new Date(txn.createdAt).toLocaleDateString()}</td>
                <td>{txn.type === 'credit' ? '➕ Credit' : '➖ Debit'}</td>
                <td>₹{txn.amount}</td>
                <td>{txn.metadata?.coins || '-'}</td>
                <td>
                  <span className={`status ${txn.paymentStatus}`}>
                    {txn.paymentStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/**
 * STYLING (Add to your CSS/Tailwind)
 * 
 * .wallet-section {
 *   padding: 2rem;
 *   max-width: 1200px;
 *   margin: 0 auto;
 * }
 * 
 * .wallet-balance-card {
 *   background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
 *   color: white;
 *   padding: 2rem;
 *   border-radius: 12px;
 *   margin-bottom: 2rem;
 *   box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
 * }
 * 
 * .balance-display {
 *   display: flex;
 *   align-items: center;
 *   gap: 1.5rem;
 *   margin-top: 1rem;
 * }
 * 
 * .coin-icon {
 *   font-size: 3rem;
 * }
 * 
 * .balance-amount {
 *   font-size: 3rem;
 *   font-weight: bold;
 *   margin: 0;
 * }
 * 
 * .balance-label {
 *   font-size: 1rem;
 *   opacity: 0.9;
 *   margin: 0;
 * }
 * 
 * .coin-plans-section {
 *   margin-bottom: 3rem;
 * }
 * 
 * .coin-plans-grid {
 *   display: grid;
 *   grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
 *   gap: 1.5rem;
 *   margin-top: 1.5rem;
 * }
 * 
 * .coin-plan-card {
 *   border: 2px solid #e0e0e0;
 *   border-radius: 12px;
 *   padding: 1.5rem;
 *   text-align: center;
 *   transition: all 0.3s ease;
 *   position: relative;
 * }
 * 
 * .coin-plan-card.popular {
 *   border-color: #667eea;
 *   box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
 * }
 * 
 * .coin-plan-card:hover {
 *   border-color: #667eea;
 *   box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
 *   transform: translateY(-4px);
 * }
 * 
 * .popular-badge {
 *   position: absolute;
 *   top: -12px;
 *   left: 50%;
 *   transform: translateX(-50%);
 *   background-color: #667eea;
 *   color: white;
 *   padding: 0.25rem 0.75rem;
 *   border-radius: 20px;
 *   font-size: 0.75rem;
 *   font-weight: 600;
 * }
 * 
 * .coin-amount {
 *   margin: 1.5rem 0;
 * }
 * 
 * .coins {
 *   display: block;
 *   font-size: 2.5rem;
 *   font-weight: bold;
 *   color: #333;
 * }
 * 
 * .label {
 *   display: block;
 *   font-size: 0.875rem;
 *   color: #666;
 *   margin-top: 0.25rem;
 * }
 * 
 * .coin-price {
 *   font-size: 1.75rem;
 *   font-weight: 600;
 *   color: #667eea;
 *   margin: 1rem 0;
 * }
 * 
 * .coin-rate {
 *   font-size: 0.875rem;
 *   color: #999;
 *   margin-bottom: 1rem;
 * }
 * 
 * .buy-btn {
 *   width: 100%;
 *   padding: 0.75rem;
 *   border: none;
 *   border-radius: 8px;
 *   font-size: 0.95rem;
 *   font-weight: 600;
 *   cursor: pointer;
 *   transition: all 0.3s ease;
 * }
 * 
 * .buy-btn.primary {
 *   background-color: #667eea;
 *   color: white;
 * }
 * 
 * .buy-btn.primary:hover:not(:disabled) {
 *   background-color: #5566d2;
 *   box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
 * }
 * 
 * .buy-btn.secondary {
 *   background-color: #f0f0f0;
 *   color: #333;
 * }
 * 
 * .buy-btn.secondary:hover:not(:disabled) {
 *   background-color: #e0e0e0;
 * }
 * 
 * .buy-btn:disabled {
 *   opacity: 0.6;
 *   cursor: not-allowed;
 * }
 * 
 * .alert {
 *   padding: 1rem;
 *   border-radius: 8px;
 *   margin: 1rem 0;
 *   display: flex;
 *   justify-content: space-between;
 *   align-items: center;
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
 * 
 * .alert-close {
 *   background: none;
 *   border: none;
 *   font-size: 1.25rem;
 *   cursor: pointer;
 *   opacity: 0.7;
 * }
 * 
 * .alert-close:hover {
 *   opacity: 1;
 * }
 * 
 * .transaction-id {
 *   font-size: 0.875rem;
 *   opacity: 0.8;
 *   margin: 0.5rem 0 0;
 * }
 * 
 * .transaction-history {
 *   margin-top: 3rem;
 * }
 * 
 * .no-transactions {
 *   text-align: center;
 *   color: #999;
 *   padding: 2rem;
 * }
 * 
 * .transactions-table {
 *   width: 100%;
 *   border-collapse: collapse;
 *   margin-top: 1rem;
 * }
 * 
 * .transactions-table th {
 *   background-color: #f5f5f5;
 *   padding: 1rem;
 *   text-align: left;
 *   font-weight: 600;
 *   border-bottom: 2px solid #e0e0e0;
 * }
 * 
 * .transactions-table td {
 *   padding: 1rem;
 *   border-bottom: 1px solid #e0e0e0;
 * }
 * 
 * .status {
 *   padding: 0.25rem 0.75rem;
 *   border-radius: 20px;
 *   font-size: 0.875rem;
 *   font-weight: 600;
 * }
 * 
 * .status.successful {
 *   background-color: #efe;
 *   color: #3c3;
 * }
 * 
 * .status.pending {
 *   background-color: #ffe;
 *   color: #cc3;
 * }
 * 
 * .status.failed {
 *   background-color: #fee;
 *   color: #c33;
 * }
 */
