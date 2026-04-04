export default function AccountsLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse">
      {/* Title + buttons */}
      <div className="flex items-center justify-between mb-8">
        <div className="h-10 w-64 bg-neutral-200 rounded-lg" />
        <div className="flex gap-3">
          <div className="h-10 w-16 bg-neutral-200 rounded-lg" />
          <div className="h-10 w-28 bg-neutral-200 rounded-lg" />
        </div>
      </div>

      {/* Count */}
      <div className="h-4 w-40 bg-neutral-200 rounded mb-4" />

      {/* Institution cards */}
      {[...Array(2)].map((_, i) => (
        <div key={i} className="card mb-4 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-neutral-100 rounded-full" />
              <div>
                <div className="h-5 w-32 bg-neutral-200 rounded mb-2" />
                <div className="h-3 w-48 bg-neutral-100 rounded" />
              </div>
            </div>
            <div className="h-8 w-24 bg-neutral-200 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}
