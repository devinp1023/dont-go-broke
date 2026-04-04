export default function NetWorthLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse">
      {/* Title */}
      <div className="mb-8">
        <div className="h-10 w-44 bg-neutral-200 rounded-lg" />
      </div>

      {/* Hero number */}
      <div className="text-center mb-8">
        <div className="h-4 w-24 bg-neutral-200 rounded mx-auto mb-2" />
        <div className="h-12 w-48 bg-neutral-200 rounded-lg mx-auto" />
      </div>

      {/* Stat grid */}
      <div className="stat-grid mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="stat-card">
            <div className="h-3 w-16 bg-neutral-200 rounded mb-2" />
            <div className="h-7 w-24 bg-neutral-100 rounded" />
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card mb-8">
        <div className="h-4 w-32 bg-neutral-200 rounded mb-4" />
        <div className="h-48 bg-neutral-100 rounded-lg" />
      </div>

      {/* Account groups */}
      {[...Array(2)].map((_, i) => (
        <div key={i} className="card mb-4 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="h-5 w-28 bg-neutral-200 rounded" />
            <div className="h-5 w-20 bg-neutral-200 rounded" />
          </div>
          {[...Array(2)].map((_, j) => (
            <div key={j} className="flex items-center gap-3 py-3 border-b border-neutral-100 last:border-b-0">
              <div className="w-8 h-8 bg-neutral-100 rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-28 bg-neutral-200 rounded mb-1" />
                <div className="h-3 w-20 bg-neutral-100 rounded" />
              </div>
              <div className="h-4 w-16 bg-neutral-200 rounded" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
