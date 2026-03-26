'use client';

export default function TransactionHistoryList({ transactions = [], loading = false }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-slate-700/70 bg-slate-900/50 p-4 animate-pulse">
            <div className="h-6 bg-slate-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-slate-800 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3 opacity-50">📭</div>
        <p className="text-slate-400 text-sm">No transactions yet. Start earning or spending SkillCoins!</p>
      </div>
    );
  }

  const getTransactionType = (tx) => {
    if (tx.reason?.includes('earning') || tx.reason?.includes('completed')) return 'earned';
    if (tx.reason?.includes('session') || tx.reason?.includes('purchase')) return 'spent';
    if (tx.reason?.includes('purchased') || tx.reason?.includes('added')) return 'purchased';
    return tx.type === 'credit' ? 'earned' : 'spent';
  };

  const getIcon = (type) => {
    switch (type) {
      case 'earned':
        return '⬆️';
      case 'spent':
        return '⬇️';
      case 'purchased':
        return '💳';
      default:
        return '◆';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'earned':
        return 'Earned';
      case 'spent':
        return 'Spent';
      case 'purchased':
        return 'Purchased';
      default:
        return 'Transaction';
    }
  };

  const getColorClass = (type) => {
    switch (type) {
      case 'earned':
        return 'bg-emerald-500/10 border-l-4 border-emerald-400 text-emerald-300 border border-emerald-500/20';
      case 'spent':
        return 'bg-rose-500/10 border-l-4 border-rose-400 text-rose-300 border border-rose-500/20';
      case 'purchased':
        return 'bg-sky-500/10 border-l-4 border-sky-400 text-sky-300 border border-sky-500/20';
      default:
        return 'bg-slate-900/40 border-l-4 border-slate-500 border border-slate-700/70';
    }
  };

  return (
    <div className="space-y-3">
      {transactions.map((tx) => {
        const type = getTransactionType(tx);
        const icon = getIcon(type);
        const typeLabel = getTypeLabel(type);
        const colorClass = getColorClass(type);

        return (
          <div key={tx._id} className={`rounded-lg p-4 flex items-center justify-between hover:shadow-lg hover:shadow-slate-950/20 transition-shadow ${colorClass}`}>
            <div className="flex items-center gap-4">
              <div className="text-2xl">{icon}</div>
              <div>
                <p className="font-semibold text-slate-100">{tx.reason || typeLabel}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {tx.counterparty?.name && `with ${tx.counterparty.name} • `}
                  {new Date(tx.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${type === 'earned' || type === 'purchased' ? 'text-emerald-300' : 'text-rose-300'}`}>
                {type === 'earned' || type === 'purchased' ? '+' : '-'}{tx.amount} SC
              </p>
              <p className="text-xs text-slate-500 mt-1">₹{tx.amount}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
