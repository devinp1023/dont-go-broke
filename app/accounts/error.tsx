'use client'

export default function AccountsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-hero font-display text-neutral-900">Account Management</h1>
      </div>
      <div className="card">
        <div className="empty-state" role="alert">
          <div className="empty-icon">⚠</div>
          <div className="empty-title">Failed to load accounts</div>
          <div className="empty-desc">We couldn&apos;t load your accounts. Please try again.</div>
          <button onClick={reset} className="btn btn-primary">Try Again</button>
        </div>
      </div>
    </div>
  )
}
