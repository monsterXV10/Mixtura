import { TopBarSkeleton, SkeletonCard, SkeletonLine } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <>
      <TopBarSkeleton title="Dashboard" />
      <main className="px-4 py-5 pb-24 space-y-4">
        <div className="card space-y-2">
          <SkeletonLine w="w-1/3" h="h-3" />
          <SkeletonLine w="w-1/2" h="h-7" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card space-y-2">
              <SkeletonLine w="w-8" h="h-8" />
              <SkeletonLine w="w-3/4" h="h-3" />
              <SkeletonLine w="w-1/2" h="h-3" />
            </div>
          ))}
        </div>
        <SkeletonCard lines={4} />
      </main>
    </>
  );
}
