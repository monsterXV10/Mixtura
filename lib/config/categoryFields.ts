export interface CategoryFieldConfig {
  brand: boolean;
  supplier: boolean;
  price: boolean;
  stock: boolean;
  expiryDate: boolean;
  format: boolean;
  quantityInBottle: boolean;
  alcoholContent: boolean;
  sugarRatio: boolean;
  yieldCalc: boolean;
}

export type CategoryConfig = Record<string, Partial<CategoryFieldConfig>>;

export const DEFAULT_CATEGORY_CONFIG: Record<string, CategoryFieldConfig> = {
  spirit:  { brand: true,  supplier: true,  price: true,  stock: true,  expiryDate: false, format: true,  quantityInBottle: false, alcoholContent: true,  sugarRatio: false, yieldCalc: false },
  liqueur: { brand: true,  supplier: true,  price: true,  stock: true,  expiryDate: false, format: true,  quantityInBottle: false, alcoholContent: true,  sugarRatio: false, yieldCalc: false },
  wine:    { brand: true,  supplier: true,  price: true,  stock: true,  expiryDate: false, format: true,  quantityInBottle: false, alcoholContent: true,  sugarRatio: false, yieldCalc: false },
  syrup:   { brand: true,  supplier: true,  price: true,  stock: true,  expiryDate: true,  format: false, quantityInBottle: false, alcoholContent: false, sugarRatio: true,  yieldCalc: false },
  juice:   { brand: false, supplier: true,  price: true,  stock: true,  expiryDate: true,  format: false, quantityInBottle: false, alcoholContent: false, sugarRatio: false, yieldCalc: true  },
  fresh:   { brand: false, supplier: true,  price: true,  stock: true,  expiryDate: true,  format: false, quantityInBottle: false, alcoholContent: false, sugarRatio: false, yieldCalc: false },
  dry:     { brand: true,  supplier: true,  price: true,  stock: true,  expiryDate: false, format: true,  quantityInBottle: false, alcoholContent: false, sugarRatio: false, yieldCalc: false },
  water:   { brand: false, supplier: false, price: true,  stock: false, expiryDate: false, format: false, quantityInBottle: false, alcoholContent: false, sugarRatio: false, yieldCalc: false },
  other:   { brand: true,  supplier: true,  price: true,  stock: true,  expiryDate: false, format: true,  quantityInBottle: false, alcoholContent: false, sugarRatio: false, yieldCalc: false },
};

export interface FieldDef {
  key: keyof CategoryFieldConfig;
  label: string;
  desc?: string;
  onlyFor?: string[];
}

export interface FieldGroupDef {
  label: string;
  fields: FieldDef[];
}

export const FIELD_GROUPS: FieldGroupDef[] = [
  {
    label: 'Traçabilité & gestion',
    fields: [
      { key: 'brand',      label: 'Marque' },
      { key: 'supplier',   label: 'Fournisseur' },
      { key: 'price',      label: "Prix d'achat" },
      { key: 'stock',      label: 'Stock actuel' },
      { key: 'expiryDate', label: 'Date de péremption', desc: 'Frais, sirops, jus' },
    ],
  },
  {
    label: 'Conditionnement',
    fields: [
      { key: 'format',           label: 'Format / contenant (ex: 70cl)' },
      { key: 'quantityInBottle', label: 'Quantité restante (bouteille ouverte)' },
    ],
  },
  {
    label: 'Alcool',
    fields: [
      { key: 'alcoholContent', label: "Taux d'alcool (%)", onlyFor: ['spirit', 'liqueur', 'wine'] },
    ],
  },
  {
    label: 'Sirops & Cordiaux',
    fields: [
      { key: 'sugarRatio', label: 'Ratio de sucre (1:1, 2:1…)', onlyFor: ['syrup', 'other'] },
    ],
  },
  {
    label: 'Jus & Rendement',
    fields: [
      { key: 'yieldCalc', label: 'Calcul de rendement (fruits → jus)', onlyFor: ['juice', 'fresh'] },
    ],
  },
];

export function getCategoryFieldConfig(
  type: string,
  overrides: CategoryConfig | null | undefined
): CategoryFieldConfig {
  const defaults = DEFAULT_CATEGORY_CONFIG[type] ?? DEFAULT_CATEGORY_CONFIG['other'];
  if (!overrides || !overrides[type]) return defaults;
  return { ...defaults, ...overrides[type] };
}
