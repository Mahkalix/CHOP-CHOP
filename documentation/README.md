# Documentation CHOP-CHOP

Site Docusaurus en français pour le cadrage du jeu web de cuisine solo CHOP-CHOP. Les sources originales sont conservées dans `static/references`. Les propositions restent à valider ; la documentation ne décrit pas un jeu déjà implémenté.

## Utilisation locale

Node.js 20 ou supérieur est requis.

```sh
npm ci
npm start
```

## Vérification

```sh
npm run typecheck
npm run build
npm run serve
```

Le build produit le site statique dans `build`. Les liens cassés sont bloquants. Les exemples de blog sont désactivés et les tutoriels Docusaurus sont exclus de la documentation publiée.

## Hébergement

Définir `DOCUSAURUS_URL` avec le domaine réel et `DOCUSAURUS_BASE_URL` avec le chemin de publication avant le build. Sans configuration, le site utilise `http://localhost:3000` et `/` pour le développement. Aucune cible de production n’a été choisie et aucun déploiement n’est effectué.

La navigation est définie dans `sidebars.ts`, le contenu dans `docs`, l’accueil dans `src/pages/index.tsx` et les couleurs dans `src/css/custom.css`.

## Design

Les [maquettes Figma CHOP-CHOP](https://www.figma.com/design/5YyQNON3zicZCKuN1CkEH0/Chop-Chop?node-id=0-1) et les captures fournies servent de référence visuelle. Le site reprend les fonds crème, panneaux sable, accents brique, contours droits et titres pixel. Voir `docs/design.md` pour les choix d’adaptation. La police Press Start 2P est hébergée localement dans `static/fonts`, avec sa licence OFL.

## Si npm est indisponible localement

Avec les dépendances déjà installées, les outils peuvent être lancés directement :

```sh
node node_modules/@docusaurus/core/bin/docusaurus.mjs start --no-open
node node_modules/typescript/bin/tsc --noEmit
node node_modules/@docusaurus/core/bin/docusaurus.mjs build
```

La configuration utilise la chaîne de compilation standard (`future.faster: false`) pour éviter les problèmes du cache natif SWC sous Windows.
