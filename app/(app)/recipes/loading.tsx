import { TopBarSkeleton, SkeletonLine } from '@/components/ui/Skeleton';

export default function RecipesLoading() {
  return (
    <>
      <TopBarSkeleton title="Recettes" />
      <main className="px-4 py-5 pb-24 space-y-3">
        <div className="card h-10 flex items-center px-3 gap-2">
          <SkeletonLine w="w-4" h="h-4" />
          <SkeletonLine w="w-40" h="h-4" />
        </div>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="card flex items-center gap-3">
            <SkeletonLine w="w-10" h="h-10" />
            <div className="flex-1 space-y-2">
              <SkeletonLine w={i % 3 === 0 ? 'w-1/2' : 'w-2/3'} h="h-4" />
              <SkeletonLine w="w-1/3" h="h-3" />
            </div>
          </div>
        ))}
      </main>
    </>
  );
}
