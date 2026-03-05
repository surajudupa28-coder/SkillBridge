'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import TransactionList from '@/components/TransactionList';

export default function WalletPage() {
  const { user, token, loading, updateUser } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [purchaseAmount, setPurchaseAmount] = useState(50);
  const [purchasing, setPurchasing] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

  useEffect(() => {
    if (token) {
      fetch('/api/wallet', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => { setBalance(data.balance); setTransactions(data.transactions || []); })
        .catch(() => {});
    }
  }, [token]);

  const purchase = async () => {
    setPurchasing(true);
    setMsg('');
    try {
      const res = await fetch('/api/wallet/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: purchaseAmount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBalance(data.balance);
      setMsg(`Purchased ${purchaseAmount} SkillCoins!`);
      updateUser();
      // Refresh transactions
      const txRes = await fetch('/api/wallet', { headers: { Authorization: `Bearer ${token}` } });
      const txData = await txRes.json();
      setTransactions(txData.transactions || []);
    } catch (err) { setMsg(err.message); } finally { setPurchasing(false); }
  };

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Wallet</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white">
            <p className="text-sm opacity-80">Current Balance</p>
            <p className="text-4xl font-bold mt-2">{balance} <span className="text-lg font-normal opacity-80">SC</span></p>
            <p className="text-sm opacity-60 mt-2">SkillCoins</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Purchase SkillCoins</h3>
            <p className="text-xs text-gray-400 mb-3">Simulated purchase — in production this integrates with a payment gateway.</p>
            {msg && <div className="mb-3 p-2 bg-green-50 text-green-700 rounded text-sm">{msg}</div>}
            <div className="flex gap-2 mb-3">
              {[25, 50, 100, 250].map(amt => (
                <button key={amt} onClick={() => setPurchaseAmount(amt)}
                  className={`px-3 py-1.5 rounded-lg text-sm ${purchaseAmount === amt ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {amt} SC
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="number" value={purchaseAmount} onChange={e => setPurchaseAmount(parseInt(e.target.value) || 0)}
                className="flex-1 px-3 py-2 border rounded-lg text-sm" />
              <button onClick={purchase} disabled={purchasing || purchaseAmount <= 0}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
                {purchasing ? 'Processing...' : 'Purchase'}
              </button>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-1">How SkillCoins Work</h3>
            <div className="text-sm text-gray-500 space-y-2 mt-3">
              <p><strong>Earn:</strong> Teach sessions to receive coins (80% of session price)</p>
              <p><strong>Spend:</strong> Book sessions to learn new skills</p>
              <p><strong>Escrow:</strong> Coins held safely until session completion</p>
              <p><strong>Purchase:</strong> Buy more coins when needed</p>
            </div>
          </div>
        </div>
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Transaction History</h3>
          <TransactionList transactions={transactions} />
        </div>
      </main>
    </div>
  );
}
