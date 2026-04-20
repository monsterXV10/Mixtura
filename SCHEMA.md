# MIXTURA — Architecture Firestore

## Vue d'ensemble

```
Firestore
├── users/{userId}                        ← Profil utilisateur
├── organizations/{orgId}                 ← Organisation (bar/équipe)
│   ├── members/{userId}                  ← Membres & rôles
│   ├── recipes/{recipeId}                ← Recettes PRIVÉES
│   └── ingredients/{ingredientId}        ← Bibliothèque d'ingrédients
├── classicRecipes/{recipeId}             ← Recettes classiques (lecture seule)
└── accessCodes/{code}                    ← Codes d'accès Beta/VIP
```

---

## Collections détaillées

### `users/{userId}`
Créé lors de la première connexion Google.

```json
{
  "uid": "firebase_uid",
  "email": "user@example.com",
  "displayName": "Alex Dupont",
  "photoURL": "https://...",
  "currentOrgId": "org_abc123",
  "language": "fr",
  "plan": "visitor",
  "createdAt": "Timestamp",
  "lastLoginAt": "Timestamp"
}
```

| Champ | Type | Description |
|-------|------|-------------|
| `plan` | `visitor` \| `beta` \| `vip` | Niveau d'accès |
| `currentOrgId` | string \| null | Organisation active |

---

### `organizations/{orgId}`

```json
{
  "name": "Bar Le Mixtura",
  "ownerId": "firebase_uid",
  "plan": "beta",
  "createdAt": "Timestamp",
  "memberCount": 3,
  "settings": {
    "currency": "EUR",
    "defaultMargin": 3.5,
    "language": "fr"
  }
}
```

---

### `organizations/{orgId}/members/{userId}`

```json
{
  "userId": "firebase_uid",
  "email": "manager@bar.com",
  "displayName": "Marie Martin",
  "role": "manager",
  "invitedBy": "owner_uid",
  "invitedAt": "Timestamp",
  "joinedAt": "Timestamp",
  "status": "active"
}
```

| Rôle | Lecture recettes | Édition recettes | Gestion prix | Gestion équipe | Paiement |
|------|:---:|:---:|:---:|:---:|:---:|
| `owner` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `manager` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `staff` | ✅ | ❌ | ❌ | ❌ | ❌ |

---

### `organizations/{orgId}/recipes/{recipeId}`
⚠️ **PRIVÉ** — Uniquement accessible aux membres de l'organisation.

```json
{
  "name": "Signature Sunset",
  "category": "signature",
  "description": "Notre cocktail maison aux notes tropicales",
  "glassType": "highball",
  "garnish": "Tranche d'orange",
  "ingredients": [
    {
      "ingredientId": "ing_001",
      "name": "Rhum blanc",
      "quantityCl": 4.5,
      "pricePerCl": 0.28,
      "unit": "cl"
    },
    {
      "ingredientId": "ing_002",
      "name": "Jus de mangue",
      "quantityCl": 8,
      "pricePerCl": 0.06,
      "unit": "cl"
    }
  ],
  "steps": ["Verser le rhum sur glace", "Compléter avec le jus"],
  "foodCost": 1.68,
  "sellingPrice": 12.00,
  "margin": 7.14,
  "isPublic": false,
  "tags": ["tropical", "sans-alcool-option"],
  "createdBy": "firebase_uid",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

| Champ calculé | Formule |
|---------------|---------|
| `foodCost` | `Σ (quantityCl × pricePerCl)` |
| `margin` | `sellingPrice / foodCost` |
| `foodCostRatio` | `(foodCost / sellingPrice) × 100` |

**Calcul Produit en Croix (Stock Calculator)**
Si l'utilisateur indique qu'il lui reste `X cl` de l'ingrédient `i` :
```
quantité_ingredient_j = (X / quantité_base_i) × quantité_base_j
```

---

### `organizations/{orgId}/ingredients/{ingredientId}`

```json
{
  "name": "Rhum blanc Havana 3 ans",
  "category": "spirits",
  "brand": "Havana Club",
  "unit": "cl",
  "bottleSizeCl": 70,
  "bottlePriceEur": 14.90,
  "pricePerCl": 0.213,
  "supplier": "Metro Cash & Carry",
  "stock": 3.5,
  "minStock": 1,
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

---

### `classicRecipes/{recipeId}`
Recettes publiques (Mojito, Negroni, etc.) — lecture seule pour tous.

```json
{
  "name": "Mojito",
  "category": "classic",
  "origin": "Cuba",
  "difficulty": "easy",
  "glassType": "highball",
  "ingredients": [
    { "name": "Rhum blanc", "quantityCl": 5, "unit": "cl" },
    { "name": "Jus de citron vert", "quantityCl": 3, "unit": "cl" },
    { "name": "Sirop de sucre", "quantityCl": 2, "unit": "cl" },
    { "name": "Menthe fraîche", "quantityCl": 0, "unit": "feuilles", "qty": 8 },
    { "name": "Eau gazeuse", "quantityCl": 6, "unit": "cl" }
  ],
  "steps": ["Écraser la menthe avec le sucre", "Ajouter le citron", "Verser le rhum", "Compléter à l'eau gazeuse", "Garnir de menthe"],
  "tags": ["classique", "cubain", "refreshing"]
}
```

---

### `accessCodes/{code}`

```json
{
  "code": "MIXTURA-BETA-2025",
  "type": "beta",
  "maxUses": 100,
  "usedBy": ["uid1", "uid2"],
  "usedCount": 2,
  "expiresAt": "Timestamp",
  "createdAt": "Timestamp",
  "isActive": true
}
```

---

## Firebase Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ─── Fonctions helper ───────────────────────────────────────────
    function isAuth() {
      return request.auth != null;
    }
    function isOwner(orgId) {
      return isAuth() && get(/databases/$(database)/documents/organizations/$(orgId)).data.ownerId == request.auth.uid;
    }
    function getMemberRole(orgId) {
      return get(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid)).data.role;
    }
    function isMember(orgId) {
      return isAuth() && exists(/databases/$(database)/documents/organizations/$(orgId)/members/$(request.auth.uid));
    }
    function isManagerOrOwner(orgId) {
      return isMember(orgId) && (getMemberRole(orgId) == 'owner' || getMemberRole(orgId) == 'manager');
    }

    // ─── Profils utilisateurs ────────────────────────────────────────
    match /users/{userId} {
      allow read, write: if isAuth() && request.auth.uid == userId;
    }

    // ─── Codes d'accès (lecture seule pour vérification) ────────────
    match /accessCodes/{code} {
      allow read: if isAuth();
      allow write: if false; // Admin SDK uniquement
    }

    // ─── Recettes classiques (publiques en lecture) ──────────────────
    match /classicRecipes/{recipeId} {
      allow read: if true;
      allow write: if false; // Admin SDK uniquement
    }

    // ─── Organisations ───────────────────────────────────────────────
    match /organizations/{orgId} {
      allow read: if isMember(orgId);
      allow create: if isAuth();
      allow update: if isOwner(orgId);
      allow delete: if isOwner(orgId);

      // Membres
      match /members/{memberId} {
        allow read: if isMember(orgId);
        allow write: if isOwner(orgId);
      }

      // Recettes — PRIVÉES, même l'admin app ne peut pas lire
      match /recipes/{recipeId} {
        allow read: if isMember(orgId);
        allow create: if isManagerOrOwner(orgId);
        allow update: if isManagerOrOwner(orgId);
        allow delete: if isManagerOrOwner(orgId);
      }

      // Ingrédients
      match /ingredients/{ingredientId} {
        allow read: if isMember(orgId);
        allow write: if isManagerOrOwner(orgId);
      }
    }
  }
}
```

---

## Quotas par plan

| Fonctionnalité | Visiteur | Beta/VIP |
|----------------|:---:|:---:|
| Recettes classiques | ✅ | ✅ |
| Recettes personnelles | Max 2 | Illimité |
| Ingrédients personnalisés | Max 10 | Illimité |
| Import/Export Excel | ❌ | ✅ |
| Gestion d'équipe | ❌ | ✅ |
| Calcul de stock (produit en croix) | ✅ | ✅ |

---

## Index Firestore recommandés

```
organizations/{orgId}/recipes → category ASC, createdAt DESC
organizations/{orgId}/recipes → tags ARRAY_CONTAINS, updatedAt DESC
organizations/{orgId}/ingredients → category ASC, name ASC
classicRecipes → category ASC, name ASC
```
