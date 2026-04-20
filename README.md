# Cocktail Calculator — Guide de déploiement PWA

## Structure des fichiers

```
cocktail-pwa/
├── index.html       ← Application complète
├── manifest.json    ← Configuration PWA
├── sw.js            ← Service worker (mode hors-ligne)
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## Option 1 — Hébergement gratuit (recommandé, 5 minutes)

### Netlify Drop (le plus simple)
1. Allez sur https://app.netlify.com/drop
2. Glissez-déposez le dossier `cocktail-pwa` sur la page
3. Netlify vous donne une URL en HTTPS (ex: https://random-name.netlify.app)
4. Partagez cette URL — l'app est accessible partout

### GitHub Pages (si vous avez un compte GitHub)
1. Créez un dépôt public sur github.com
2. Uploadez les fichiers
3. Settings → Pages → Branch: main
4. Votre URL : https://votre-pseudo.github.io/cocktail-pwa

---

## Option 2 — Réseau local (sans internet)

Si vous voulez l'utiliser uniquement en local sur votre réseau Wi-Fi :

### Windows (avec Python installé)
```bash
cd cocktail-pwa
python -m http.server 8080
```
Accès : http://localhost:8080 (PC) ou http://[votre-IP]:8080 (téléphone sur le même Wi-Fi)

### Windows (avec Node.js installé)
```bash
npx serve cocktail-pwa
```

---

## Installer sur Android

1. Ouvrez l'URL de l'app dans **Chrome**
2. Un bandeau "Installer l'application" apparaît en bas → tapez **Installer**
3. Ou : menu Chrome (⋮) → **Ajouter à l'écran d'accueil**
4. L'app apparaît comme une vraie application sur votre téléphone

## Installer sur Windows

1. Ouvrez l'URL dans **Microsoft Edge** ou **Google Chrome**
2. Cliquez l'icône d'installation dans la barre d'adresse (icône +)
3. Ou : menu du navigateur → **Installer Cocktail Calculator**
4. L'app apparaît dans le menu Démarrer et sur le bureau

---

## Fonctionnalités

- Recettes de base : Mojito, Margarita, Gin Tonic
- Ajout / modification / suppression d'ingrédients
- Calcul automatique des coûts par ingrédient et total
- Ajustement des portions (×1 à ×999)
- Marge commerciale configurable
- Sauvegarde des recettes personnelles (stockage local)
- Export CSV (compatible Excel / Google Sheets)
- Fonctionne **hors-ligne** après la première visite
- Thème clair/sombre automatique

---

## Personnalisation rapide

Pour ajouter vos propres recettes par défaut, éditez le tableau `DEFAULTS`
dans `index.html` (ligne ~180) :

```javascript
{ name:"Votre Cocktail", ingredients:[
  {id:0, name:"Ingrédient 1", base:4, price:20, size:70},
  {id:1, name:"Ingrédient 2", base:2, price:5,  size:100},
]}
```

- `base` : quantité en cl dans la recette de base
- `price` : prix d'achat de la bouteille en €
- `size` : contenance de la bouteille en cl
