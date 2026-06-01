import { TopBarSkeleton, SkeletonLine } from '@/components/ui/Skeleton';

export default function IngredientsLoading() {
  return (
    <>
      <TopBarSkeleton title="Stock" />
      <main className="px-4 py-5 pb-24 space-y-3">
        <div className="card h-10 flex items-center px-3 gap-2">
          <SkeletonLine w="w-4" h="h-4" />
          <SkeletonLine w="w-40" h="h-4" />
        </div>
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <div key={i} className="card flex items-center gap-3">
            <div className="flex-1 space-y-2">
              <SkeletonLine w={i % 2 === 0 ? 'w-1/2' : 'w-2/3'} h="h-4" />
              <SkeletonLine w="w-1/4" h="h-3" />
            </div>
            <SkeletonLine w="w-16" h="h-6" />
          </div>
        ))}
      </main>
    </>
  );
}
