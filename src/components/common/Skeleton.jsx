function SkeletonBlock({ className }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-800/70 ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-start gap-3">
        <SkeletonBlock className="mt-1 h-2 w-2 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-4 w-3/4" />
          <SkeletonBlock className="h-3 w-1/2" />
          <div className="flex gap-2 pt-1">
            <SkeletonBlock className="h-5 w-16 rounded-full" />
            <SkeletonBlock className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScreenSkeleton() {
  return (
    <div className="space-y-3 pt-1">
      <SkeletonBlock className="h-36 rounded-3xl" />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
