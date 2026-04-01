export default function TransactionsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-hero font-display text-neutral-900 mb-6">Transactions</h1>
      <div className="card">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-title">Coming soon</div>
          <div className="empty-desc">Full transaction search, filters, and categorization.</div>
        </div>
      </div>
    </div>
  )
}
