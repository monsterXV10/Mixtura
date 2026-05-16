'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AnonBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs"
      style={{ background: '#1a1400', borderBottom: '1px solid #3d2e00', color: '#C8A96E' }}
    >
      <span className="flex-1">
        ⚡ Mode démo — vos données sont temporaires.{' '}
        <Link href="/settings" className="underline font-semibold">
          Créez un compte
        </Link>{' '}
        pour les sauvegarder.
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded opacity-60 hover:opacity-100"
        style={{ color: '#C8A96E' }}
        aria-label="Fermer"
      >
        ×
      </button>
    </div>
  )
}
