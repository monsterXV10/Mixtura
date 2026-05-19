# Mixtura v8 — Contexte projet pour Claude

## Projet

**Mixtura** est une app web PWA de gestion de bar : stock d'ingrédients, recettes cocktails/café/cuisine, coût de revient, livre de bar. Construite en Next.js 14 (App Router) — la **v8** remplace une PWA vanilla JS (`index.html`) encore présente dans le dépôt mais obsolète. Ne pas modifier `index.html`.

Dépôt : `monsterXV10/Mixtura`
Branche de développement active : `claude/recipe-ingredient-form-Xhe5z`

---

## Stack technique

| Couche | Choix |
|---|---|
| Framework | Next.js 14 App Router |
| Langage | TypeScript strict |
| Style | Tailwind CSS + variables CSS inline (`var(--gold)`, etc.) |
| Auth + DB | Supabase (`@supabase/ssr`) |
| Déploiement | Vercel |

---

## Structure des fichiers

```
app/
├── components/
│   └── TopBar.tsx              # Header sticky avec bouton retour + actions
├── (auth)/                     # Pages login/callback (Supabase Auth)
├── ingredients/
│   ├── page.tsx                # Server component — fetch + passe au client
│   └── components/
│       └── IngredientsClient.tsx  # ⭐ Client principal (liste + drawer form)
├── recipes/
│   ├── page.tsx                # Liste des recettes
│   ├── new/page.tsx            # Nouvelle recette (fetch ingredientNames)
│   ├── [id]/
│   │   ├── page.tsx            # Détail recette
│   │   └── edit/page.tsx       # Édition (fetch recipe + ingredientNames)
│   └── components/
│       ├── RecipesClient.tsx   # Liste filtrée + suppression
│       ├── RecipeForm.tsx      # ⭐ Formulaire création/édition (cocktail/café/cuisine)
│       └── RecipeDetail.tsx    # Affichage d'une recette
hooks/
├── useIngredients.ts           # CRUD ingrédients → table `ingredients`
├── useRecipes.ts               # CRUD recettes → table `recipes`
└── useCatalogSearch.ts         # Recherche debounced → table `catalog_ingredients`
lib/supabase/
├── client.ts                   # Singleton browser client
└── server.ts                   # Server client (cookies Next.js)
types/
├── ingredient.ts               # Ingredient, IngredientData, RecipeIngredient, RecipeOutput
└── recipe.ts                   # Recipe, RecipeType, LegacyRecipeData, metadata types
```

---

## Base de données Supabase

```sql
ingredients (id uuid, user_id uuid, data jsonb, updated_at)
recipes     (id uuid, user_id uuid, type text, data jsonb, metadata jsonb, updated_at)
catalog_ingredients  -- catalogue global en lecture seule (search autocomplete)
```

- Toutes les données métier sont dans la colonne `data` (JSONB).
- RLS activé : chaque utilisateur ne voit que ses propres lignes.

---

## Conventions CSS & styling

### Variables CSS (définies dans `app/globals.css` et `index.html`)
```css
--bg          /* fond principal */
--surface     /* cartes, formulaires */
--surface2    /* fond secondaire, dropdowns */
--border      /* bordures */
--text        /* texte principal */
--text-dim    /* texte secondaire */
--gold        /* couleur accent (#C8A96E) */
--radius      /* 14px */
--radius-sm   /* 8px */
```

### Classe utilitaire
- `field-input` — appliquée sur tous les `<input>`, `<select>`, `<textarea>` du formulaire. Définie dans `globals.css`.

### Pattern drawer (formulaire)
```tsx
// Overlay fixe, glisse par le bas
<div className="fixed inset-0 flex flex-col justify-end z-50" style={{ background: 'rgba(0,0,0,0.7)' }}>
  <div className="w-full max-w-lg mx-auto rounded-t-[var(--radius)] overflow-y-auto"
       style={{ background: 'var(--surface)', maxHeight: '92vh' }}>
    {/* Header sticky */}
    <div className="sticky top-0 z-10 ..."> ... </div>
    <form className="p-4 space-y-4 pb-8"> ... </form>
  </div>
</div>
```

---

## Ce qui a été implémenté (dernière session)

### 1. `types/ingredient.ts` — extension pour ingrédients maison
Ajout de trois interfaces et extension de `IngredientData` :
```ts
interface RecipeIngredient { name: string; qty: number; unit: string }
interface RecipeOutput    { name: string; qtyMin: number; qtyMax?: number; unit: string }
// Dans IngredientData :
recipeIngredients?: RecipeIngredient[]
outputs?:           RecipeOutput[]
loss?:              { qty: number; unit: string }
```

### 2. `IngredientsClient.tsx` — formulaire ingrédient maison (section `{form.homemade && ...}`)

Le formulaire "Maison" est réorganisé en 5 sections :

| Section | Description |
|---|---|
| 📋 Description | Textarea libre pour le procédé |
| 📥 Ingrédients d'entrée | Liste dynamique avec autocomplete + indicateurs 🟢/🟡 |
| 📤 Produits obtenus | Liste dynamique (nom, qtyMin, qtyMax, unité) |
| 💧 Perte de process | Quantité absolue ou en % |
| ⚖️ Balance | Calcul live totalIn vs (totalOut + perte), statut ✅/⚠️/❌ |

**Constantes ajoutées (hors composant) :**
```ts
const RECIPE_UNITS = ['cl', 'ml', 'l', 'g', 'kg', 'oz', 'pièce', '%']
function toCl(qty: number, unit: string): number  // convertit en cl pour la balance
```

**State ajouté :**
```ts
const [acOpenIdx, setAcOpenIdx] = useState<number | null>(null)  // index dropdown autocomplete
```

**Variables calculées (avant le return) :**
```ts
const knownNames   = new Set(ingredients.map(i => i.data.name.toLowerCase()))
const acSuggestions = ...  // filtre les ingrédients existants selon la saisie
const totalIn      = recIng.filter(r => r.unit !== '%').reduce(...)
const totalOut     = recOut.reduce(...)
const lossAbs      = ...   // perte absolue en cl
const ratio        = totalIn > 0 ? totalOutWithLoss / totalIn : 0
const balanceColor = ... // '#4CAF50' | '#FFC107' | '#FF5252' | 'var(--border)'
```

### 3. `RecipeForm.tsx` — indicateur 🟢/🟡 sur les ingrédients cocktail

Dans la section Ingrédients (formulaire recette), chaque ligne affiche :
- **Bordure verte + 🟢** si le nom correspond à un ingrédient existant dans le stock
- **Bordure jaune + 🟡** si l'ingrédient est nouveau

```tsx
const knownNames = new Set(ingredientNames.map(n => n.toLowerCase()))
// Dans le rendu de chaque ligne :
const isKnown = ing.name.length > 0 && knownNames.has(ing.name.toLowerCase())
// Sur l'input :
style={{ borderColor: showIndicator ? (isKnown ? '#4CAF50' : '#FFC107') : undefined }}
```

---

## Patterns clés à réutiliser

### Autocomplete avec indicateur (pattern `knownNames`)
```tsx
// 1. Construire le Set des noms connus
const knownNames = new Set(someList.map(n => n.toLowerCase()))

// 2. Dans le rendu de chaque input d'ingrédient :
const isKnown = name.length > 0 && knownNames.has(name.toLowerCase())
<input
  style={{ borderColor: name ? (isKnown ? '#4CAF50' : '#FFC107') : undefined }}
/>
{name && <span>{isKnown ? '🟢' : '🟡'}</span>}
```

### Dropdown autocomplete positionné
```tsx
const [acOpenIdx, setAcOpenIdx] = useState<number | null>(null)
// Sur l'input :
onFocus={() => setAcOpenIdx(idx)}
onBlur={() => setTimeout(() => setAcOpenIdx(null), 150)}
// Dropdown :
{acOpenIdx === idx && suggestions.length > 0 && (
  <ul className="absolute left-0 right-0 top-full mt-0.5 z-30 ...">
    {suggestions.map(s => (
      <li><button onMouseDown={() => { /* select */ }}>...</button></li>
    ))}
  </ul>
)}
```

### Modifier un élément d'une liste immuable
```tsx
// Pattern standard pour mettre à jour un item dans un tableau de state
const upd = [...(form.someList ?? [])]
upd[idx] = { ...upd[idx], field: value }
setField('someList', upd)
```

### Helper `setField` (IngredientsClient)
```tsx
function setField<K extends keyof typeof form>(k: K, v: typeof form[K]) {
  setForm(prev => ({ ...prev, [k]: v }))
}
```

---

## Listes d'options (RecipeForm)

```ts
const COCKTAIL_FAMILIES = ['Sour', 'Fizz', 'Highball', 'Sling', 'Flip', 'Collins', 'Old Fashioned', 'Martini', 'Negroni', 'Tropical', 'Hot', 'Autre']
const GLASS_OPTIONS     = ['Cocktail / Martini', 'Coupe', 'Rocks / Old Fashioned', 'Highball', 'Collins', 'Nick & Nora', 'Flûte', 'Verre à vin', 'Tiki Mug', 'Shot', 'Mug', 'Tumbler']
const MENU_OPTIONS      = ['Carte principale', 'Carte saison', 'Carte été', 'Carte hiver', 'Brunch', 'Happy Hour', 'Signature', 'Classiques', 'Sans alcool', 'Hors carte']
const METHOD_OPTIONS    = ['Shake', 'Stir', 'Build', 'Blend', 'Throw', 'Muddle']
const ING_UNITS         = ['cl', 'ml', 'oz', 'g', 'kg', 'trait', 'goutte', 'pièce', 'barspoon']
```

---

## Points d'attention

- **Ne jamais modifier `index.html`** — c'est la v7 legacy, elle ne sert que de référence.
- **Toujours pousser sur `claude/recipe-ingredient-form-Xhe5z`**, jamais sur `main` ou `claude/build-mixtura-app-J0OYg`.
- Les composants client ont `'use client'` en première ligne.
- Les pages dans `app/` sont des Server Components (pas de `'use client'`) — elles fetchent les données et passent au client.
- Pour les inputs de formulaire : utiliser `className="field-input"` + `style={{ ... }}` avec les CSS vars.
