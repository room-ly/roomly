export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* ヘッダースケルトン */}
      <div className="mb-8">
        <div className="skeleton h-8 w-48 mb-2" />
        <div className="skeleton h-4 w-32" />
      </div>

      {/* KPIカードスケルトン */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-5">
            <div className="skeleton h-10 w-10 rounded-xl mb-4" />
            <div className="skeleton h-7 w-20 mb-2" />
            <div className="skeleton h-3 w-28" />
          </div>
        ))}
      </div>

      {/* テーブルスケルトン */}
      <div className="card p-5">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="skeleton h-4 w-1/4" />
              <div className="skeleton h-4 w-1/5" />
              <div className="skeleton h-4 w-1/6" />
              <div className="skeleton h-4 w-1/6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
