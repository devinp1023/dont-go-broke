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
      <p className="text-gray-500 text-center py-8">
        No transactions yet. Connect a bank to get started.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-3 pr-4">Date</th>
            <th className="py-3 pr-4">Merchant</th>
            <th className="py-3 pr-4 text-right">Amount</th>
            <th className="py-3">Category</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn) => (
            <tr key={txn.id} className="border-b border-gray-100">
              <td className="py-3 pr-4 text-gray-600">{txn.date}</td>
              <td className="py-3 pr-4">{txn.merchant_name || txn.name}</td>
              <td className={`py-3 pr-4 text-right font-mono ${txn.amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {txn.amount > 0 ? '-' : '+'}${Math.abs(txn.amount).toFixed(2)}
              </td>
              <td className="py-3 text-gray-500">{txn.category || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
