export function SkeletonLine({ w = 'w-full', h = 'h-4' }: { w?: string; h?: string }) {
  return <div className={`skeleton ${w} ${h}`} />;
}

export function SkeletonCard({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`card space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} w={i === 0 ? 'w-2/3' : i % 2 === 0 ? 'w-full' : 'w-5/6'} />
      ))}
    </div>
  );
}

export function TopBarSkeleton({ title }: { title: string }) {
  return (
    <div className="sticky top-0 z-40 flex items-center h-14 px-4 border-b border-[var(--border)] bg-[var(--bg)]">
      <span className="font-semibold text-[var(--text)] text-base">{title}</span>
    </div>
  );
}
