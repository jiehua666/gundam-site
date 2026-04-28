export default function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="glass-card neon-border rounded-xl overflow-hidden animate-pulse"
        >
          <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-accent/10" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-primary/10 rounded w-3/4" />
            <div className="h-4 bg-primary/10 rounded w-1/2" />
            <div className="h-3 bg-primary/10 rounded w-full" />
            <div className="h-3 bg-primary/10 rounded w-2/3" />
            <div className="flex gap-2">
              <div className="h-6 w-12 bg-primary/10 rounded" />
              <div className="h-6 w-12 bg-accent/10 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
