export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="skeleton h-8 w-32 mb-2" />
          <div className="skeleton h-4 w-24" />
        </div>
        <div className="skeleton h-10 w-28 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="skeleton w-10 h-10 rounded-xl" />
              <div>
                <div className="skeleton h-5 w-36 mb-1.5" />
                <div className="skeleton h-3 w-48" />
              </div>
            </div>
            <div className="skeleton h-2 w-full rounded-full mb-4" />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="skeleton h-16 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
