export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="h-4 max-w-md rounded bg-slate-200 dark:bg-slate-700" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-slate-200 dark:bg-slate-700" />
        ))}
      </div>
    </div>
  );
}
