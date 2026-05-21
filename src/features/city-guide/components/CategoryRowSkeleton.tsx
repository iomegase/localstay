export function CategoryRowSkeleton() {
  return (
    <div className="flex gap-5 px-6 overflow-x-auto no-scrollbar pb-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="shrink-0 flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gray-100 animate-pulse" />
          <div className="w-10 h-2 bg-gray-100 rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}
