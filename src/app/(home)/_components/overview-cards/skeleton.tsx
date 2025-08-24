export function OverviewCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:gap-7.5">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-28 rounded-[10px] border border-stroke p-6 animate-pulse dark:border-stroke-dark bg-white dark:bg-dark-2"
        />
      ))}
    </div>
  );
}

