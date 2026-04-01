'use client'

type Transaction = {
  id: string
  date: string
  name: string
  merchant_name: string | null
  amount: number
  category: string | null
}

export default function TransactionList({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🏦</div>
        <div className="empty-title">No transactions yet</div>
        <div className="empty-desc">Connect a bank to get started.</div>
      </div>
    )
  }

  return (
    <div>
      {transactions.map((txn) => (
        <div key={txn.id} className="tx-row">
          <div className="tx-icon">💳</div>
          <div className="tx-info">
            <div className="tx-name">{txn.merchant_name || txn.name}</div>
            <div className="tx-meta">{txn.category || 'Uncategorized'}</div>
          </div>
          <div className="tx-right">
            <div className={`tx-amount ${txn.amount > 0 ? 'debit' : 'credit'}`}>
              {txn.amount > 0 ? '-' : '+'}${Math.abs(txn.amount).toFixed(2)}
            </div>
            <div className="tx-date">
              {new Date(txn.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
