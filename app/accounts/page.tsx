export default function AccountsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-hero font-display text-neutral-900 mb-6">Accounts</h1>
      <div className="card">
        <div className="empty-state">
          <div className="empty-icon">🏦</div>
          <div className="empty-title">Coming soon</div>
          <div className="empty-desc">View and manage all your connected bank accounts.</div>
        </div>
      </div>
    </div>
  )
}
