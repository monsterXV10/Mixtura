# 🍹 MIXTURA — Déploiement sur GitHub + Vercel

Guide pas-à-pas pour mettre MIXTURA en ligne, depuis le Luxembourg, sans ligne de commande.

---

## Étape 1 — Créer un compte GitHub (si pas encore fait)

1. Allez sur **https://github.com**
2. Cliquez **"Sign up"** → entrez votre email + mot de passe
3. Choisissez le plan **Gratuit (Free)**
4. Vérifiez votre email

---

## Étape 2 — Créer le dépôt (repository) MIXTURA

1. Une fois connecté sur GitHub, cliquez le **"+"** en haut à droite → **"New repository"**
2. Remplissez :
   - **Repository name** : `mixtura-pwa`
   - **Description** : `MIXTURA — Cocktail Library & Calculator`
   - Cochez **"Public"** (nécessaire pour l'hébergement gratuit)
   - Cochez **"Add a README file"**
3. Cliquez **"Create repository"**

---

## Étape 3 — Uploader vos fichiers

1. Sur la page de votre nouveau dépôt, cliquez **"Add file"** → **"Upload files"**
2. Glissez-déposez **tous les fichiers** du dossier `cocktail-pwa` :
   ```
   index.html
   manifest.json
   sw.js
   SCHEMA.md
   firebase-guide.md
   icons/
     icon-192.png
     icon-512.png
   ```
3. En bas de la page, dans **"Commit changes"** :
   - Message : `Initial commit — MIXTURA v1`
4. Cliquez **"Commit changes"**

---

## Étape 4 — Déployer sur Vercel (URL publique en 2 minutes)

1. Allez sur **https://vercel.com**
2. Cliquez **"Sign Up"** → choisissez **"Continue with GitHub"**
3. Autorisez Vercel à accéder à vos dépôts GitHub
4. Cliquez **"Add New Project"**
5. Dans la liste, cliquez **"Import"** à côté de `mixtura-pwa`
6. Laissez tous les paramètres par défaut → cliquez **"Deploy"**
7. ✅ Votre app est en ligne ! Vercel vous donne une URL du type :
   ```
   https://mixtura-pwa.vercel.app
   ```

---

## Étape 5 — Mettre à jour l'app (les prochaines fois)

Quand vous voulez modifier l'app :
1. Allez sur **github.com/[votre-pseudo]/mixtura-pwa**
2. Cliquez sur le fichier à modifier (ex: `index.html`)
3. Cliquez l'icône ✏️ (crayon) en haut à droite du fichier
4. Faites vos modifications
5. Cliquez **"Commit changes"**
6. Vercel redéploie automatiquement en 30 secondes ✅

---

## 🔗 Domaine personnalisé (optionnel)

Si vous voulez une URL du type **mixtura.lu** ou **mixtura.bar** :
1. Achetez un domaine sur [Namecheap](https://namecheap.com) (~15€/an)
2. Dans Vercel → votre projet → **Settings** → **Domains**
3. Ajoutez votre domaine et suivez les instructions DNS

---

## 🔑 Codes d'accès Beta (pour inviter vos premiers utilisateurs)

Ces codes fonctionnent dès maintenant dans l'app (sans Firebase) :

| Code | Niveau |
|------|--------|
| `MIXTURA-BETA-2025` | Beta — accès complet |
| `MIXTURA-VIP-2025` | VIP — accès complet |

> Pour ajouter vos propres codes, éditez la ligne `VALID_CODES` dans `index.html`.
> Avec Firebase, ces codes seront validés côté serveur (voir `firebase-guide.md`).

---

## 📁 Structure des fichiers

```
mixtura-pwa/
├── index.html          ← Application complète (Dashboard + Détail + Ingrédients)
├── manifest.json       ← Configuration PWA (icône, couleurs, nom)
├── sw.js               ← Service worker (mode hors-ligne)
├── SCHEMA.md           ← Architecture Firestore (pour quand vous ajoutez Firebase)
├── firebase-guide.md   ← Guide pas-à-pas Firebase
├── README_GITHUB.md    ← Ce fichier
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## 📱 Installer MIXTURA sur téléphone

**Android (Chrome) :**
1. Ouvrez l'URL dans Chrome
2. Menu ⋮ → "Ajouter à l'écran d'accueil"

**iPhone (Safari) :**
1. Ouvrez l'URL dans Safari
2. Bouton Partager □↑ → "Sur l'écran d'accueil"

**Windows (Chrome ou Edge) :**
1. Icône d'installation dans la barre d'adresse
2. Ou : Menu → "Installer MIXTURA"
