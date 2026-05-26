import type { PlanId } from '@/config/plans';

export type UserRole = 'owner' | 'admin' | 'barman' | 'viewer';

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  plan: PlanId;
  role: UserRole;
  establishment_id: string | null;
  created_at: string;
}

export interface Establishment {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
}

export type Unit = 'ml' | 'cl' | 'L' | 'g' | 'kg' | '%' | 'pcs' | 'dash' | 'barspoon' | string;

export interface Ingredient {
  id: string;
  establishment_id: string | null;
  user_id: string;
  name: string;
  category: string | null;
  unit: Unit;
  stock_quantity: number;
  min_stock_alert: number | null;
  purchase_price: number | null;
  supplier: string | null;
  barcode: string | null;
  allergens: string[];
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  ingredient_id: string;
  ingredient_name: string;
  quantity: number;
  unit: Unit;
}

export interface RecipeStep {
  order: number;
  instruction: string;
  duration_seconds: number | null;
  is_timer: boolean;
}

export type RecipeCategory =
  | 'cocktail_iba'
  | 'cocktail_creation'
  | 'batch'
  | 'coffee'
  | 'kitchen'
  | 'custom';

export interface Recipe {
  id: string;
  establishment_id: string | null;
  user_id: string;
  name: string;
  category: RecipeCategory;
  description: string | null;
  serving_size_ml: number | null;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  allergens: string[];
  photo_url: string | null;
  is_favorite: boolean;
  version: number;
  tags: string[];
  cost_price: number | null;
  sale_price: number | null;
  menu_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface BatchProduction {
  id: string;
  recipe_id: string;
  recipe_name: string;
  establishment_id: string | null;
  user_id: string;
  user_name: string;
  target_quantity: number;
  produced_quantity: number;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
}

export interface ActiveTimer {
  id: string;
  batch_id: string;
  step_order: number;
  label: string;
  duration_seconds: number;
  started_at: string;
  paused_at: string | null;
  completed: boolean;
}

export interface TeamMember {
  id: string;
  establishment_id: string;
  user_id: string;
  role: UserRole;
  name: string;
  email: string;
  avatar_url: string | null;
  joined_at: string;
}

export interface Message {
  id: string;
  establishment_id: string;
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  content: string;
  created_at: string;
}

export interface Menu {
  id: string;
  establishment_id: string | null;
  user_id: string;
  name: string;
  recipe_ids: string[];
  created_at: string;
}
