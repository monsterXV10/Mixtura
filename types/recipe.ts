export type RecipeType = 'cocktail' | 'coffee' | 'cuisine'

export interface RecipeIngredient {
  name: string
  qty: number
  unit: string
}

// Blob legacy — structure existante dans la colonne `data`
export interface LegacyRecipeData {
  id: string
  name: string
  glass?: string
  family?: string
  alcohol?: string
  method?: string | string[]
  garnish?: string
  ingredients: RecipeIngredient[]
  steps?: string
  menu?: string
  bookData?: BookData
  [key: string]: unknown
}

// Metadata type-spécifique (colonne `metadata` JSONB)
export interface CocktailMetadata {
  type: 'cocktail'
  glass?: string
  family?: string
  alcohol?: string
  method?: string[]
  garnish?: string
}

export interface CoffeeMetadata {
  type: 'coffee'
  temperature?: 'hot' | 'iced' | 'cold-brew'
  ratio?: string
  grind?: 'fine' | 'medium-fine' | 'medium' | 'coarse'
  brewMethod?: string
  extractionTime?: number
}

export interface CuisineMetadata {
  type: 'cuisine'
  servings?: number
  prepTime?: number
  cookTime?: number
  cuisine?: string
  difficulty?: 'easy' | 'medium' | 'hard'
}

export type RecipeMetadata = CocktailMetadata | CoffeeMetadata | CuisineMetadata

// Ligne complète en base
export interface Recipe {
  id: string
  user_id: string
  type: RecipeType
  data: LegacyRecipeData
  metadata: RecipeMetadata
  updated_at: string
}

// Profil sensoriel (livre)
export interface BookData {
  intensity?: number
  bitterness?: number
  sour?: number
  aromas?: string
  photo?: string
  sketch?: string
  activeCases?: string[]
}

// Type guards
export function isCoffeeMetadata(m: RecipeMetadata): m is CoffeeMetadata {
  return m.type === 'coffee'
}

export function isCocktailMetadata(m: RecipeMetadata): m is CocktailMetadata {
  return m.type === 'cocktail'
}

export function isCuisineMetadata(m: RecipeMetadata): m is CuisineMetadata {
  return m.type === 'cuisine'
}

// Template par défaut selon le type
export function defaultMetadata(type: RecipeType): RecipeMetadata {
  switch (type) {
    case 'coffee':
      return { type: 'coffee', temperature: 'hot', grind: 'medium-fine' }
    case 'cuisine':
      return { type: 'cuisine', servings: 4, difficulty: 'medium' }
    case 'cocktail':
    default:
      return { type: 'cocktail' }
  }
}
