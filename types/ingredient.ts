export interface Ingredient {
  id: string
  user_id: string
  data: IngredientData
  updated_at: string
}

export interface RecipeIngredient {
  name: string
  qty: number
  unit: string
}

export interface RecipeOutput {
  name: string
  qtyMin: number
  qtyMax?: number
  unit: string
}

export interface IngredientData {
  id: string
  name: string
  category: string
  type: 'spirit' | 'liqueur' | 'wine' | 'beer' | 'juice' | 'syrup' | 'fresh' | 'dry' | 'other'
  price: number
  format: number
  unit: string
  stock: number
  homemade?: boolean
  recipe?: string
  recipeIngredients?: RecipeIngredient[]
  outputs?: RecipeOutput[]
  loss?: { qty: number; unit: string }
}

export const INGREDIENT_TYPES: { value: IngredientData['type']; label: string }[] = [
  { value: 'spirit', label: 'Spiritueux' },
  { value: 'liqueur', label: 'Liqueur' },
  { value: 'wine', label: 'Vin / Champagne' },
  { value: 'beer', label: 'Bière' },
  { value: 'juice', label: 'Jus' },
  { value: 'syrup', label: 'Sirop / Sucre' },
  { value: 'fresh', label: 'Frais (fruit, herbe)' },
  { value: 'dry', label: 'Sec (épice, poudre)' },
  { value: 'other', label: 'Autre' },
]

export function costPerUnit(data: IngredientData): number {
  if (!data.price || !data.format) return 0
  return data.price / data.format
}
