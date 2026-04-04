'use client'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="card">
        <div className="empty-state" role="alert">
          <div className="empty-icon">⚠</div>
          <div className="empty-title">Something went wrong</div>
          <div className="empty-desc">An unexpected error occurred. Please try again.</div>
          <button onClick={reset} className="btn btn-primary">Try Again</button>
        </div>
      </div>
    </div>
  )
}
