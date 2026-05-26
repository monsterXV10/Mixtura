import { BottomNav } from '@/components/layout/BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)]">
      <div className="flex-1 pb-safe">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
