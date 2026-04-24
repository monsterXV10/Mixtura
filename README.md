# Mixtura 🍸

**Application de gestion de bar pour bartenders et mixologues.**  
PWA mobile-first — fonctionne hors-ligne, synchronisation cloud multi-appareils.

🌐 **[mixtura.buzz](https://mixtura.buzz)**

---

## Fonctionnalités

### 🍹 Cocktails
- Catalogue de 19 recettes classiques (Mojito, Negroni, Old Fashioned…)
- Création et gestion de recettes personnalisées
- Filtres par verre, famille et alcool de base
- Fiche détaillée avec ingrédients, quantités et étapes de préparation
- Import depuis le catalogue en un clic

### 🧪 Ingrédients
- Gestion du stock avec seuils d'alerte (rouge/vert)
- Ingrédients achetés et maison (avec recette propre)
- Prix d'achat, format bouteille, unité personnalisable
- Autocomplete intelligent : ingrédients perso + suggestions du catalogue (📖)
- Scan de facture par IA (Google Gemini Vision)
- Import/export JSON et Excel (.xlsx)

### 📋 Batch
- Création de listes de préparation (pré-batch)
- Mode cocktails ou ingrédients
- Plusieurs batchs nommés et datés

### ⚙️ Paramètres
- Connexion compte (email/mot de passe ou Google OAuth)
- Synchronisation cloud automatique (Supabase)
- Informations personnelles et établissement
- Export complet des données (sauvegarde)
- Langue FR / EN

---

## Plans

| | Démo | Gratuit | Pro |
|---|---|---|---|
| Cocktails perso | 3 | 20 | ∞ |
| Catalogue | 6 recettes | Complet | Complet |
| Sync cloud | ✗ | ✓ | ✓ |
| Connexion | Non requis | Email / Google | Email / Google |

Le plan **Pro** se déverrouille avec un code promo.

---

## Stack technique

- **Frontend** : HTML/CSS/JS vanilla — tout dans `index.html`
- **PWA** : Service Worker + Web App Manifest (installable, hors-ligne)
- **Base de données** : LocalStorage (local-first) + Supabase (cloud sync)
- **Auth** : Supabase Auth (email + Google OAuth)
- **Excel** : SheetJS (`xlsx.mini.min.js`)
- **IA** : Google Gemini Vision API (scan factures)

---

## Structure des fichiers

```
Mixtura/
├── index.html            ← Application complète (HTML + CSS + JS)
├── manifest.json         ← Configuration PWA
├── sw.js                 ← Service Worker (cache hors-ligne)
├── supabase.min.js       ← Client Supabase (UMD)
├── xlsx.mini.min.js      ← Export/import Excel
├── supabase-schema.sql   ← Schéma base de données
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## Configuration Supabase

### 1. Créer le projet

Créer un projet sur [supabase.com](https://supabase.com) et récupérer :
- L'URL du projet (`https://xxx.supabase.co`)
- La clé publishable (`sb_publishable_...`)

### 2. Créer les tables

Exécuter dans le **SQL Editor** de Supabase :

```sql
create table if not exists ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz default now()
);

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz default now()
);

alter table ingredients enable row level security;
alter table recipes enable row level security;

create policy "ingredients_select" on ingredients for select using (auth.uid() = user_id);
create policy "ingredients_insert" on ingredients for insert with check (auth.uid() = user_id);
create policy "ingredients_delete" on ingredients for delete using (auth.uid() = user_id);
create policy "recipes_select" on recipes for select using (auth.uid() = user_id);
create policy "recipes_insert" on recipes for insert with check (auth.uid() = user_id);
create policy "recipes_delete" on recipes for delete using (auth.uid() = user_id);
```

### 3. Configurer les clés dans le code

Dans `index.html` (lignes 530-531) :

```javascript
const SUPABASE_URL = 'https://votre-projet.supabase.co';
const SUPABASE_KEY = 'sb_publishable_...';
```

### 4. Activer les providers d'authentification

Dans **Authentication → Providers** : activer Email et/ou Google OAuth.

---

## Déploiement

### Netlify (recommandé)
1. Aller sur [app.netlify.com/drop](https://app.netlify.com/drop)
2. Glisser-déposer le dossier du projet
3. L'app est en ligne en HTTPS immédiatement

### GitHub Pages
1. Settings → Pages → Branch: `main`
2. URL : `https://votre-pseudo.github.io/Mixtura`

### Local (développement)
```bash
python -m http.server 8080
# ou
npx serve .
```

---

## Installation sur mobile (PWA)

**Android (Chrome) :** menu ⋮ → *Ajouter à l'écran d'accueil*  
**iOS (Safari) :** bouton partage → *Sur l'écran d'accueil*  
**PC (Chrome/Edge) :** icône ⊕ dans la barre d'adresse

---

## Licence

Usage privé / commercial — tous droits réservés.
