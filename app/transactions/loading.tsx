export default function TransactionsLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse">
      {/* Title */}
      <div className="mb-8">
        <div className="h-10 w-52 bg-neutral-200 rounded-lg" />
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="w-11 h-11 bg-neutral-200 rounded-lg" />
        <div className="h-6 w-36 bg-neutral-200 rounded" />
        <div className="w-11 h-11 bg-neutral-200 rounded-lg" />
      </div>

      {/* Transaction cards */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="card mb-6">
          <div className="px-4 py-3 border-b border-neutral-100">
            <div className="h-4 w-40 bg-neutral-200 rounded" />
          </div>
          {[...Array(4)].map((_, j) => (
            <div key={j} className="flex items-center gap-3.5 py-3 px-4 border-b border-neutral-100 last:border-b-0">
              <div className="w-10 h-10 bg-neutral-100 rounded-lg flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="h-4 w-32 bg-neutral-200 rounded mb-1" />
                <div className="h-3 w-20 bg-neutral-100 rounded" />
              </div>
              <div className="h-5 w-16 bg-neutral-200 rounded" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
