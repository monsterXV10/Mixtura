import { TopBar } from '@/components/layout/TopBar';
import Link from 'next/link';
import { Clock } from 'lucide-react';

export default function ToolsPage() {
  return (
    <>
      <TopBar title="Outils" />
      <main className="px-4 py-5">
        <Link href="/tools/batch" className="card flex items-center gap-4 hover:border-[var(--gold-dim)] transition-colors">
          <div className="w-12 h-12 rounded-xl bg-[var(--gold)]/10 flex items-center justify-center">
            <Clock size={24} className="text-[var(--gold)]" />
          </div>
          <div>
            <p className="font-semibold text-[var(--text)]">Batch Tool</p>
            <p className="text-xs text-[var(--text-dim)]">Calculateur de production avec timers</p>
          </div>
        </Link>
      </main>
    </>
  );
}
