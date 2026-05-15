'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

interface TopBarProps {
  title: string
  backHref?: string
  actions?: ReactNode
}

export default function TopBar({ title, backHref, actions }: TopBarProps) {
  return (
    <header
      className="flex items-center gap-3 px-4 h-14 sticky top-0 z-10"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
    >
      {backHref && (
        <Link
          href={backHref}
          className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] flex-shrink-0"
          style={{ background: 'var(--surface2)', color: 'var(--text-dim)' }}
          aria-label="Retour"
        >
          ←
        </Link>
      )}
      <h1 className="flex-1 font-semibold text-base truncate" style={{ color: 'var(--text)' }}>
        {title}
      </h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
