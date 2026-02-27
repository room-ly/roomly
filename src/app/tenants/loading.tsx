export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="skeleton h-8 w-36 mb-2" />
          <div className="skeleton h-4 w-24" />
        </div>
        <div className="skeleton h-10 w-32 rounded-lg" />
      </div>
      <div className="skeleton h-10 w-80 rounded-lg mb-5" />
      <div className="card p-5">
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="skeleton h-4 w-20" />
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-4 w-28" />
              <div className="skeleton h-4 w-40" />
              <div className="skeleton h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
