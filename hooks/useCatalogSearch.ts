'use client'

import { useState, useCallback, useRef } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export interface CatalogIngredient {
  id: string
  name: string
  brand: string | null
  category: string
  type: string
  default_format: number
  default_unit: string
  typical_price: number | null
  abv: number | null
  country: string | null
  tags: string[]
}

export function useCatalogSearch() {
  const [results, setResults] = useState<CatalogIngredient[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = getSupabaseBrowserClient()

  const search = useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (!query.trim() || query.length < 2) { setResults([]); return }

      debounceRef.current = setTimeout(async () => {
        setLoading(true)
        const { data } = await supabase
          .from('catalog_ingredients')
          .select('*')
          .ilike('name', `%${query}%`)
          .order('name')
          .limit(8)
        setResults((data ?? []) as CatalogIngredient[])
        setLoading(false)
      }, 250)
    },
    [supabase]
  )

  const clear = useCallback(() => setResults([]), [])

  return { results, loading, search, clear }
}
