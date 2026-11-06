# CHOP-CHOP

CHOP-CHOP est un jeu web de cuisine solo, jouable au clavier sur ordinateur. L'équipe prévoit **trois niveaux** et un classement par niveau. La priorité est de rendre le niveau 1 jouable de bout en bout, de la connexion au résultat classé.

## Sites en ligne

| | Site en ligne | Projet Vercel |
| --- | --- | --- |
| Front, prototype actuel | [Ouvrir le front](https://chop-chop-front.vercel.app/) | [Voir le projet Vercel](https://vercel.com/mahkalixs-projects/chop-chop-front) |
| Documentation Docusaurus | [Lire la documentation](https://chop-chop-docs.vercel.app/) | [Voir le projet Vercel](https://vercel.com/mahkalixs-projects/chop-chop-docs) |

La partie complète reste à intégrer au front.

## En local

Prérequis : **Node.js 22+** et **pnpm 11** pour le jeu. Les liens `localhost` fonctionnent pendant que les serveurs sont lancés.

### Front

Depuis la racine du dépôt :

```sh
pnpm install
pnpm dev:front
```

Ouvrir le [front local](http://localhost:5173/) (port Vite par défaut).

### Documentation Docusaurus

Dans un autre terminal, depuis la racine du dépôt :

```sh
cd documentation
npm ci
npm start -- --port 3001
```

Ouvrir la [documentation locale](http://localhost:3001/). Le port 3001 laisse le port 3000 libre pour l'API.

### API, si nécessaire

Depuis la racine du dépôt, créer son fichier de configuration local à partir de [`apps/api/.env.example`](apps/api/.env.example), renseigner les valeurs demandées à l'équipe, puis lancer :

```sh
cp apps/api/.env.example apps/api/.env
pnpm dev:api
```

Ne jamais commiter le fichier `.env` ni les secrets. Vérifications du monorepo : `pnpm typecheck` et `pnpm test`.

## Repères dans le dépôt

| Chemin | Rôle |
| --- | --- |
| [`front/`](front/) | Interface React 19, TypeScript, Vite et SCSS ; scènes de jeu avec Phaser. |
| [`apps/api/`](apps/api/) | API Fastify 5, Drizzle et accès à PostgreSQL sur Supabase. |
| [`packages/shared/`](packages/shared/) | Types et schémas Zod communs au front et à l'API. |
| [`documentation/`](documentation/) | Site Docusaurus, installé et construit séparément avec npm. |

Les [conventions de travail](documentation/docs/conventions.md), l'[architecture et les routes API](documentation/docs/architecture.md), la [configuration Vercel du front](docs/vercel.md) et l'[hébergement de l'API sur Render](docs/render.md) donnent le détail. Le travail en cours se suit dans les [issues](https://github.com/Mahkalix/CHOP-CHOP/issues) et le [Project](https://github.com/users/Mahkalix/projects/3).

## Configuration du classement

Copier `front/.env.example` vers `front/.env` et renseigner `VITE_API_URL` avec l’origine publique de l’API, par exemple `http://localhost:3000`. Cette valeur est publique et ne doit contenir aucun secret. Redémarrer Vite après modification ; sur Vercel, reconstruire le front. L’API doit autoriser l’origine du front via `CORS_ORIGIN`.

Ouvrir `#classement` et sélectionner un niveau parmi les trois prévus. Le front demande `GET /leaderboard/:levelId?limit=5` et conserve les rangs et l’ordre renvoyés par l’API. Depuis la fusion de #49, le classement retient le meilleur score de chaque joueur par niveau ; un joueur n’apparaît qu’une fois. Le serveur départage les égalités par durée, puis par date. Cette route publique ne nécessite aucun jeton Supabase.

Les états de chargement, liste vide, erreur et nouvelle tentative sont gérés sans scores fictifs. Une configuration absente affiche « Classement indisponible ». Les requêtes précédentes sont annulées lors d’un changement de niveau ou lorsque l’écran est quitté. La validation avec les services déployés reste nécessaire après configuration de l’API et de CORS.

## Session joueur Supabase

Copier `front/.env.example` vers `front/.env`, puis renseigner `VITE_API_URL`, `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` (clé publique publishable ou anon historique). Ne jamais utiliser de clé secrète, service_role ni de mot de passe de base côté front. Redémarrer Vite ou reconstruire le déploiement après modification.

Activer **Anonymous Sign-Ins** dans Supabase Auth. Le front et l’API doivent utiliser le même projet Supabase ; le vérificateur API accepte les signatures ES256/RS256. Autoriser l’origine du front dans `CORS_ORIGIN` côté API.

Depuis Jouer, ouvrir une session anonyme, choisir son pseudo une seule fois puis accéder à la cuisine Phaser. La session est conservée dans le navigateur et son jeton est rafraîchi par le SDK. Seul le jeton Bearer est transmis à `GET/PUT /me` ; aucun email ni mot de passe n’est demandé. Effacer les données du navigateur ou quitter la session anonyme fait perdre l’accès à ce profil. Le cycle de partie (`POST /games`, fin et abandon) reste une intégration séparée.

Vérifier avec `pnpm typecheck`, `pnpm test` et `pnpm build:front`. Les tests front simulent Supabase et l’API ; une recette sur les services déployés reste nécessaire.
