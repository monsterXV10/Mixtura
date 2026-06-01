import { TopBarSkeleton, SkeletonCard } from '@/components/ui/Skeleton';

export default function IngredientDetailLoading() {
  return (
    <>
      <TopBarSkeleton title="" />
      <main className="px-4 py-5 pb-24 space-y-4">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={3} />
      </main>
    </>
  );
}
