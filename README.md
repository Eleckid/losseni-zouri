# Portfolio - Losseni Zouri

Portfolio de Losseni Zouri, étudiant en BUT Science des Données (Université Paris Cité), Data Analyst en formation, à la recherche d'une alternance en Data Analytics dès septembre 2026.

Site en ligne : https://losseni-zouri.github.io/

## Principes

- **Statique** : HTML + un fichier CSS compilé + un fichier JavaScript vanilla. Aucun framework JS, aucune requête vers un service tiers (polices auto-hébergées).
- **Tailwind CSS 4** : les styles sont écrits dans `assets/css/tailwind.css` (tokens en `@theme`, composants en `@layer components` pour ce que les utilitaires ne couvrent pas : pseudo-éléments, animations SVG, états pilotés par JS) et compilés en `assets/css/style.css`, qui est committé. GitHub Pages n'a donc rien à construire.
- **Performance** : images AVIF/WebP avec `srcset`, polices en sous-ensemble latin (~100 Ko), CSS minifié (~60 Ko), animations en CSS, IntersectionObserver pour déclencher les apparitions.
- **Accessibilité** : WCAG 2.2 AA (contrastes vérifiés, navigation clavier complète, focus visible, `prefers-reduced-motion`, contenu visible sans JavaScript). Lighthouse : Accessibilité 100, Bonnes pratiques 100, SEO 100.
- **SEO** : balises meta, Open Graph, Twitter Card, canonical, données structurées Schema.org (Person, Article, BreadcrumbList), `sitemap.xml`, `robots.txt`.

## Arborescence

```text
/
├── index.html                          Page d'accueil (hero, profil, parcours, compétences, projets, contact)
├── projets/
│   ├── challenge-dataviz-2026/index.html         Page projet 01 (sert de modèle)
│   └── enquete-pratiques-culturelles/index.html  Page projet 02
├── 404.html                            Page d'erreur GitHub Pages
├── favicon.ico · robots.txt · sitemap.xml
├── package.json                        Scripts de build Tailwind (dev uniquement)
├── README.md
└── assets/
    ├── css/
    │   ├── tailwind.css                Source : tokens @theme + composants (à éditer)
    │   └── style.css                   Sortie compilée et minifiée (à committer, ne pas éditer)
    ├── js/
    │   ├── script.js                   Menu mobile, section active, apparitions, mots, compteurs, inclinaison, copie e-mail
    │   ├── hero-glyphs.js              Scène du hero : champ de glyphes, mots décryptés, échantillonnage au clic
    │   ├── cursor-data.js              Curseur « de mesure » (pointeur fin uniquement)
    │   └── dataviz.js                  Infographie démographique (pages projet)
    ├── fonts/                          Sora, Instrument Sans, Geist Mono (woff2)
    ├── images/                         Portrait détouré, dashboard Power BI, images Open Graph
    ├── icons/                          favicon.svg, apple-touch-icon.png
    └── docs/                           CV et rapport du Challenge Dataviz (PDF)
```

## Visualisations de données

`assets/js/dataviz.js` (chargé après `assets/vendor/d3.v7.min.js` et `assets/vendor/chart.umd.min.js`, uniquement sur l'accueil et la page du Challenge Dataviz) rend :

- **L'infographie démographique** (`[data-dataviz="demographie"]`) : barres 2016 vs 2022 (Chart.js), carte des 18 régions avec encarts DOM (D3, fond `assets/data/regions-france.js`, 97 Ko), indicateurs calculés, filtres année / indicateur, infobulles, tableau de données dépliable. Les chiffres viennent de `assets/data/demographie-regions.js` : **ce fichier contient des valeurs INSEE arrondies au millier, à remplacer par le jeu de données exact du challenge** (mêmes clés : `pop`, `young`, `old` par région et par année). Tout le reste se recalcule automatiquement. Les données sont chargées comme scripts (pas de `fetch`) pour fonctionner aussi quand on ouvre `index.html` directement depuis l'explorateur.
- **Les cartes de la section Compétences** sont du HTML pur : chaque `<article class="skill card" data-tone="mint|cyan|violet|amber">` porte une icône SVG inline, un niveau (`skill__level`, `--learning`, `--notions`) et ses contextes d'utilisation. Pour ajouter un outil, dupliquer une carte.

La palette repose sur trois accents définis dans `@theme` : menthe (`--color-accent`, principal), cyan (`--color-cyan`) et violet (`--color-violet`), plus l'ambre (`--color-amber`) réservé aux données. Les voiles de couleur du fond sont dans `body::before`.

Sans JavaScript ou si un fichier de données manque, un message de repli s'affiche et la capture Power BI originale reste visible sur la page projet.

## Travailler sur le CSS

Prérequis : Node.js 18+.

```bash
npm install
```

Compiler une fois (minifié) :

```bash
npm run build:css
```

Recompiler à chaque modification pendant le développement :

```bash
npm run watch:css
```

Le design system (couleurs, polices, échelle typographique, espacements, ombres, animations) est défini dans le bloc `@theme` de `assets/css/tailwind.css`. Changer une couleur d'accent ou une police se fait à un seul endroit ; les utilitaires (`text-accent`, `bg-surface`, `font-display`, `text-display`, `py-section`…) en découlent.

Les classes `is-visible`, `is-open`, `is-scrolled`, `is-copied`, `is-ready`, `is-tilting` et `has-open-menu` sont ajoutées par `script.js` et stylées dans la couche composants.

**Après toute modification de classes dans un fichier HTML, relancer `npm run build:css` et committer `assets/css/style.css`.** Les fichiers scannés sont déclarés en tête de `tailwind.css` (`@source`).

## Ajouter un projet (page « template »)

Chaque projet a sa page dans `projets/<slug>/index.html`. La page `projets/challenge-dataviz-2026/index.html` sert de modèle :

1. Dupliquer le dossier, renommer le slug (minuscules, tirets).
2. Mettre à jour le `<head>` : `<title>`, `meta description`, `canonical`, balises Open Graph/Twitter (image 1200 × 630 px dans `assets/images/`), et le bloc JSON-LD (`BreadcrumbList` + `Article`).
3. Remplir les sections dans l'ordre du modèle : **en-tête** (fil d'Ariane, méta, titre, accroche, boutons, fiche Rôle / Outils / Données / Durée / Équipe / Livrable) → **01 Contexte** (avec la problématique en citation) → **02 Données & outils** → **03 Dashboard** ou visuel du livrable → **04 Résultats** (chiffres réels uniquement) → **05 Mon rôle & apprentissages** → **06 Rapport** (bouton de téléchargement avec l'attribut `download`, ou mention « en cours » sans faux lien).
4. Placer le rapport dans `assets/docs/` et les visuels dans `assets/images/` (AVIF + WebP, largeurs 800 / 1200 / 1600 px).
5. Ajouter la carte correspondante dans la section `#projets` de `index.html` (titre, visuel et bouton « Voir le projet » pointent vers `projets/<slug>/`), la ligne dans la navigation entre projets des pages voisines, et l'URL dans `sitemap.xml`.
6. Relancer `npm run build:css`.

Tous les chemins des pages projet sont relatifs (`../../assets/…`) : elles fonctionnent en local comme sur GitHub Pages.

## Mettre à jour le contenu de l'accueil

- **Compétences** : la matrice `<table class="matrix">` relie chaque compétence aux contextes où elle a été utilisée. Une puce pleine = `<span class="dot dot--on">`, une puce vide = `<span class="dot">`.
- **Disponibilité** : la mention apparaît dans le hero (`.status-pill`), la frise (`.timeline__item--next`) et le contact (`#contact-title`). Mettre à jour les trois.
- **Icônes des compétences** : les cartes Power BI, Excel et Python·R affichent les vraies marques. Les tracés viennent de Simple Icons (dédicace CC0), collés en SVG dans la page ; aucune requête externe. Les marques restent la propriété de leurs détenteurs et ne servent ici qu à désigner l outil employé. La couleur officielle de chaque outil devient la teinte de sa carte via `data-brand` (`#F2C811`, `#21A366`, `#4B8BBE`, plus `#75AADB` pour R) : ce sont les variantes claires des chartes, lisibles sur fond sombre. SQL garde un pictogramme de base de données, faute de logo officiel pour un langage normalisé.
- **Photos d illustration** : `assets/images/enquete-etudiants-*` (Priscilla Du Preez) et `assets/images/challenge-seniors-*` (Vitaly Gariev), toutes deux sous licence Unsplash (usage libre, y compris commercial, attribution non obligatoire), retraitées par script (désaturation, bichromie bleu-nuit vers menthe, vignettage, grain) pour entrer dans la palette. Chacune sert de fond à l en-tête de sa page projet (`.case-hero__media`) et d aperçu dans sa tuile de l accueil. Le contraste du texte au-dessus reste supérieur à 5,6:1.
- **Encarts DOM de la carte** : les contours simplifiés ont un sens d enroulement inversé ; en projection sphérique, D3 les interprète comme couvrant toute la sphère et remplit l encart d un carré plein. Les encarts utilisent donc `d3.geoIdentity().reflectY(true)`, une projection plane insensible à l enroulement - à conserver si les fichiers de contours sont regénérés.
- **Ancien texte : photo d illustration du projet 02** : `assets/images/enquete-etudiants-*` (AVIF et WebP en 800, 1200, 1600). Source : Priscilla Du Preez sur Unsplash, licence Unsplash (usage libre, y compris commercial, attribution non obligatoire). Elle est retraitée par script (désaturation, bichromie bleu-nuit vers menthe, vignettage, grain) pour entrer dans la palette, puis servie en fond de l en-tête de la page projet (`.case-hero__media`, deux dégradés qui gardent le texte au-dessus de 5,6:1) et dans la tuile de l accueil. Le schéma `enquete-pratiques-culturelles-*` reste disponible si tu préfères un visuel de méthode.
- **Favicon** : monogramme « LZ » (L en encre claire, Z en menthe, carré arrondi bleu-nuit). Les lettres sont des tracés géométriques, pas du texte, pour un rendu identique partout jusqu à 16 px. Les trois fichiers (`assets/icons/favicon.svg`, `favicon.ico` en 16/24/32/48/64, `assets/icons/apple-touch-icon.png` en 180 px) sont générés par le même script de dessin : régénérer les trois ensemble si le monogramme change.
- **Repère de navigation** : sur grand écran, un point d accent glisse jusqu à la section en cours. Position et largeur sont posées par `initActiveSection()` dans `--nav-x`, `--nav-y` et `--nav-w` ; le repère se cache au-dessus de la première section et sous 1024 px, où la liste numérotée prend le relais.
- **Ordre des sections** : Profil, Parcours, Compétences, Projets, Contact. Les numéros affichés (`fig-label__num`) et l'ordre de la navigation doivent rester alignés sur cet ordre, y compris dans la navigation des pages projet.
- **Titre décodé** : `initDecode()` dans `script.js` anime les `<span class="js-decode" data-text="…">` du hero (chiffres et symboles qui se figent en lettres, relance au survol). Le nom réel reste dans l'attribut `aria-label` du `<h1>` ; l'animation est désactivée avec `prefers-reduced-motion`.
- **Scène du hero** : `assets/js/hero-glyphs.js` dessine sur `<canvas class="hero-glyphs">` un champ de glyphes en perspective, sans librairie. Les chiffres se ré-tirent en continu ; toutes les quelques secondes une poignée de nœuds se décrypte en un terme de la statistique (liste `WORDS` en tête du fichier), avec verrouillage lettre par lettre et onde dans le réseau. **Au clic**, les chiffres proches sont prélevés et forment un histogramme 0-9 avec effectif, moyenne et écart-type réels. Densité : 215 glyphes en grand écran, 105 en mobile ; allègement automatique sous 45 images par seconde ; pause hors écran et onglet masqué ; image fixe avec `prefers-reduced-motion` ; couleurs lues dans le thème (`lz:theme`). L'ancienne scène (`initHeroScene()` dans `script.js`, surface de densité) reste dans le code et sert de comparaison sur `variantes-hero.html`.
- **Curseur « de mesure »** : `assets/js/cursor-data.js` remplace le curseur système par un réticule (point exact, anneau en retard, ticks d'axe, lecture des coordonnées au-dessus du hero). Il s'active seul sur pointeur fin en posant `has-measure-cursor` sur `<html>` ; une page peut le refuser avec `data-no-measure-cursor`. Sur tactile et dans les champs de saisie, le curseur système reste en place.
- **Section Projets** : trois tuiles en bento - grande tuile pour le projet phare avec l'aperçu du livrable, tuile compacte pour le second projet, tuile « Prochainement ». L'infographie interactive n'est plus sur l'accueil : elle vit sur la page du Challenge Dataviz, ce qui évite de charger D3, Chart.js et les jeux de données sur la page d'accueil.
- **Portrait** : dans la section Profil (`.hero__panel`), avec liseré lumineux (`.beam`) et inclinaison à la souris (`.js-tilt`).
- **CV** : remplacer `assets/docs/cv-losseni-zouri.pdf` (le fichier actuel a été généré à partir du contenu du portfolio).
- **Portrait** : `assets/images/portrait-losseni-zouri-{400,560}.{avif,webp}` - image détourée avec fond transparent, ≥ 560 px de large. Pour une netteté optimale sur écrans Retina, fournir une source d'au moins 1 200 px.
- **Image de partage** : `assets/images/og-image.jpg` (1200 × 630 px).

## Lab typographie & palette (temporaire)

Un bouton « Lab » (bas droite) ouvre un panneau qui applique en direct l'une des 10 combinaisons de polices (A à J, Google Fonts chargées à la volée) et l'une des 22 palettes numérotées, rangées en deux familles (sombres, claires). Chaque palette a été vérifiée en contraste WCAG AA : texte, texte secondaire, accent sur le fond, et couleur de texte des boutons sur le dégradé accent → cyan. Le choix est mémorisé dans `localStorage` (`lz-lab`) et suivi par la scène 3D, le titre décodé et les graphiques (événement `lz:theme`). Cet outil sert uniquement à arbitrer la direction artistique : une fois le verdict rendu, supprimer `assets/js/lab.js`, ses balises `<script>` dans les trois pages, le bloc `.lab-*` de `assets/css/tailwind.css`, puis auto-héberger la police retenue et figer la palette dans `@theme`.

`variantes-projets.html` (racine, `noindex`, absente de la navigation) propose six dispositions pour les cartes projet de l'accueil, du sommaire d'une ligne au bento asymétrique, avec le contenu réel des deux projets. À supprimer aussi après arbitrage, avec sa ligne `@source` dans `assets/css/tailwind.css` et la règle `.summary-plain`.

`variantes-competences.html` (racine, `noindex`) propose huit dispositions pour la section Compétences, du tableau de preuves au bandeau de marques, sur le contenu réel. À supprimer après arbitrage, avec sa ligne `@source`.

`variantes-hero.html` (racine, `noindex`) compare deux scènes de hero : la surface de densité actuelle (`initHeroScene` dans `assets/js/script.js`) et le « champ de glyphes » (`assets/js/hero-glyphs.js`), où des chiffres se décryptent en termes de statistique, avec échantillonnage au clic. La page permet aussi d essayer le curseur « de mesure » (`assets/js/cursor-data.js`, activé par la classe `has-measure-cursor` sur `<html>`, styles dans le bloc temporaire de `tailwind.css`). Aucun de ces modules n est branché sur l accueil : après arbitrage, soit on les intègre, soit on supprime les fichiers, la page, sa ligne `@source` et le bloc CSS `.cursor`.

## Déploiement

Le site est un dossier statique : aucun build n est nécessaire, `assets/css/style.css` étant committé.

- **Dépôt** : https://github.com/Eleckid/losseni-zouri (privé), branche `main`.
- **Aperçu Netlify** : https://losseni-zouri.netlify.app, configuration dans `netlify.toml` (publish ".", pas de commande de build, en-têtes de cache).
- **Déploiement manuel** depuis le dossier : `netlify deploy --prod --no-build --dir .`
- **Déploiement automatique** : connecter le dépôt dans Netlify (Project configuration → Build & deploy → Link repository), commande de build vide, publish ".".

### Sur GitHub Pages (cible finale, compte de Losseni)

Le site est servi par GitHub Pages depuis la branche principale du dépôt `losseni-zouri.github.io`. Pousser les fichiers à la racine du dépôt suffit (`node_modules/` est ignoré).

Pour tester en local :

```bash
npm run serve
```

puis ouvrir http://localhost:8000/.
