# Guide Firebase — MIXTURA

## Étape 1 — Créer le projet Firebase (5 min)

1. Allez sur **https://console.firebase.google.com**
2. Cliquez **"Créer un projet"**
3. Nom : `mixtura-prod` (ou ce que vous voulez)
4. Désactivez Google Analytics (optionnel)
5. Cliquez **"Créer le projet"**

---

## Étape 2 — Activer Authentication

1. Dans le menu gauche → **Build > Authentication**
2. Cliquez **"Get started"**
3. Onglet **Sign-in method** → Activer **Google**
4. Email d'assistance : votre email
5. Cliquez **Enregistrer**

---

## Étape 3 — Créer la base Firestore

1. Menu gauche → **Build > Firestore Database**
2. Cliquez **"Créer une base de données"**
3. Choisir **"Commencer en mode production"** (les règles du SCHEMA.md seront appliquées)
4. Région : `europe-west1` (Belgique — proche du Luxembourg)

---

## Étape 4 — Récupérer la configuration

1. ⚙️ Paramètres du projet → **Vos applications**
2. Cliquez l'icône **`</>`** (Web)
3. Nom de l'app : `mixtura-web`
4. **Ne cochez PAS** Firebase Hosting pour l'instant
5. Cliquez **"Enregistrer l'application"**
6. Copiez le bloc `firebaseConfig` qui ressemble à :

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "mixtura-prod.firebaseapp.com",
  projectId: "mixtura-prod",
  storageBucket: "mixtura-prod.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## Étape 5 — Intégrer Firebase dans MIXTURA

Dans `index.html`, ajoutez ces lignes **avant** la balise `</head>` :

```html
<!-- Firebase SDK -->
<script type="module">
  import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
  import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged }
    from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
  import { getFirestore, doc, setDoc, getDoc, collection, query, onSnapshot }
    from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

  // ⬇️ REMPLACEZ PAR VOTRE CONFIG
  const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "VOTRE_PROJECT.firebaseapp.com",
    projectId: "VOTRE_PROJECT_ID",
    storageBucket: "VOTRE_PROJECT.appspot.com",
    messagingSenderId: "VOTRE_SENDER_ID",
    appId: "VOTRE_APP_ID"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  window.FB_AUTH = auth;
  window.FB_DB = db;
  window.FB_PROVIDER = new GoogleAuthProvider();
</script>
```

---

## Étape 6 — Déployer les Security Rules

1. Installez Firebase CLI :
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
2. Initialisez dans le dossier du projet :
   ```bash
   firebase init firestore
   ```
3. Copiez les règles depuis `SCHEMA.md` dans le fichier `firestore.rules`
4. Déployez :
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## Étape 7 — Déployer sur Vercel (Gratuit)

1. Créez un compte sur **https://vercel.com** (avec votre GitHub)
2. Sur GitHub, créez un repo `mixtura-pwa` et uploadez les fichiers
3. Sur Vercel → **"Add New Project"** → importez votre repo GitHub
4. Cliquez **Deploy** — votre URL sera `https://mixtura-pwa.vercel.app`

> **Alternative plus simple :** Netlify Drop — glissez-déposez le dossier sur
> https://app.netlify.com/drop — URL disponible en 30 secondes.

---

## Codes d'accès Beta (pour tester maintenant)

Sans Firebase, ces codes de démo fonctionnent directement :

| Code | Accès |
|------|-------|
| `MIXTURA-BETA-2025` | Beta (illimité) |
| `MIXTURA-VIP-2025` | VIP (illimité) |

Une fois Firebase configuré, remplacez ces codes par la validation Firestore
dans la collection `accessCodes/{code}`.
