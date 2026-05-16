'use client'

import { useAuth } from '@/contexts/AuthContext'
import AnonBanner from './AnonBanner'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAnonymous, loading } = useAuth()
  if (loading) return null
  return (
    <>
      {isAnonymous && <AnonBanner />}
      {children}
    </>
  )
}
