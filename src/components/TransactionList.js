'use client';

export default function TransactionList({ transactions }) {
  if (!transactions || transactions.length === 0) {
    return <p className="text-gray-400 text-sm py-4">No transactions yet.</p>;
  }

  return (
    <div className="divide-y divide-gray-100">
      {transactions.map((tx) => (
        <div key={tx._id} className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-gray-900">{tx.reason}</p>
            <p className="text-xs text-gray-400">
              {tx.counterparty?.name && `with ${tx.counterparty.name} \u00B7 `}
              {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <span className={`text-sm font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
            {tx.type === 'credit' ? '+' : '-'}{tx.amount} SC
          </span>
        </div>
      ))}
    </div>
  );
}
