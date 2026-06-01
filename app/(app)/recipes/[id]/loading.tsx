import { TopBarSkeleton, SkeletonLine, SkeletonCard } from '@/components/ui/Skeleton';

export default function RecipeDetailLoading() {
  return (
    <>
      <TopBarSkeleton title="" />
      <main className="px-4 py-5 pb-24 space-y-5">
        <div className="flex gap-2">
          <SkeletonLine w="w-20" h="h-6" />
          <SkeletonLine w="w-24" h="h-6" />
        </div>
        <SkeletonCard lines={5} />
        <SkeletonCard lines={3} />
      </main>
    </>
  );
}
