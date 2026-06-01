import { TopBarSkeleton, SkeletonCard, SkeletonLine } from '@/components/ui/Skeleton';

export default function CommunicationLoading() {
  return (
    <>
      <TopBarSkeleton title="Communication" />
      <main className="px-4 py-5 pb-24 space-y-3">
        <SkeletonLine w="w-1/2" h="h-5" />
        {[1, 2, 3].map(i => <SkeletonCard key={i} lines={3} />)}
      </main>
    </>
  );
}
