export default function HomeLoading() {
  return (
    <div className="px-6 lg:px-10 py-8 animate-pulse">
      {/* Title */}
      <div className="h-10 w-56 bg-neutral-200 rounded-lg mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8">
        {/* Left column */}
        <div className="flex flex-col gap-8">
          {/* Insight card */}
          <div className="card-tinted">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-sg-200 rounded shrink-0" />
              <div className="flex-1">
                <div className="h-5 w-full bg-sg-100 rounded mb-2" />
                <div className="h-5 w-3/4 bg-sg-100 rounded" />
                <div className="h-3 w-28 bg-sg-100 rounded mt-3 ml-auto" />
              </div>
            </div>
          </div>

          {/* Income/Expenses card */}
          <div className="card">
            <div className="h-4 w-32 bg-neutral-200 rounded mb-4" />
            <div className="flex justify-between items-baseline mb-2">
              <div className="h-4 w-16 bg-neutral-200 rounded" />
              <div className="h-6 w-24 bg-neutral-200 rounded" />
            </div>
            <div className="h-5 w-3/4 bg-neutral-100 rounded-full mb-5" />
            <div className="flex justify-between items-baseline mb-2">
              <div className="h-4 w-20 bg-neutral-200 rounded" />
              <div className="h-6 w-24 bg-neutral-200 rounded" />
            </div>
            <div className="h-5 w-1/2 bg-neutral-100 rounded-full" />
          </div>
        </div>

        {/* Right column */}
        <div className="card">
          <div className="h-4 w-40 bg-neutral-200 rounded mb-4" />
          <div className="flex gap-8 items-center">
            <div className="w-40 h-40 bg-neutral-100 rounded-full shrink-0" />
            <div className="flex-1 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-neutral-100 rounded" style={{ width: `${80 - i * 10}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
