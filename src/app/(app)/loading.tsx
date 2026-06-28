export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        <div className="h-4 w-80 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
