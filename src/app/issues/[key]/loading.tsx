export default function Loading() {
  return (
    <div className="grid grid-cols-12 gap-6 p-6 max-w-7xl mx-auto">
      <main className="col-span-8 space-y-6">
        {/* Header skeleton */}
        <div className="bg-white rounded-xl border p-6">
          <div className="animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-8"></div>
              </div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="flex gap-4">
              <div className="h-6 bg-gray-200 rounded-full w-24"></div>
              <div className="h-6 bg-gray-200 rounded-full w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>

        {/* Description skeleton */}
        <div className="bg-white rounded-xl border p-6">
          <div className="animate-pulse">
            <div className="flex justify-between items-center mb-4">
              <div className="h-6 bg-gray-200 rounded w-32"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>

        {/* Subtasks and Linked Issues skeleton */}
        <div className="grid grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border p-6">
              <div className="animate-pulse">
                <div className="flex justify-between items-center mb-4">
                  <div className="h-6 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-12"></div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex items-center gap-3 p-3">
                      <div className="h-4 w-4 bg-gray-200 rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Attachments skeleton */}
        <div className="bg-white rounded-xl border p-6">
          <div className="animate-pulse">
            <div className="flex justify-between items-center mb-6">
              <div className="h-6 bg-gray-200 rounded w-32"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity skeleton */}
        <div className="bg-white rounded-xl border p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-24 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Properties sidebar skeleton */}
      <aside className="col-span-4">
        <div className="bg-white rounded-xl border p-6">
          <div className="animate-pulse">
            <div className="flex justify-between items-center mb-6">
              <div className="h-6 bg-gray-200 rounded w-24"></div>
              <div className="h-8 bg-gray-200 rounded w-12"></div>
            </div>
            <div className="space-y-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i}>
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
