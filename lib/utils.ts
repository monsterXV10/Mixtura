import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(date));
}

export function formatQuantity(value: number, unit: string): string {
  return `${value} ${unit}`;
}

export function calculateCostPrice(
  ingredients: Array<{ quantity: number; purchase_price: number | null; unit: string }>
): number {
  return ingredients.reduce((total, ing) => {
    if (!ing.purchase_price) return total;
    return total + ing.quantity * ing.purchase_price;
  }, 0);
}

export function calculateMargin(costPrice: number, salePrice: number): number {
  if (salePrice === 0) return 0;
  return ((salePrice - costPrice) / salePrice) * 100;
}
