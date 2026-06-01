import { TopBarSkeleton, SkeletonCard } from '@/components/ui/Skeleton';

export default function SettingsLoading() {
  return (
    <>
      <TopBarSkeleton title="Paramètres" />
      <main className="px-4 py-5 pb-24 space-y-3">
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} lines={2} />)}
      </main>
    </>
  );
}
