---
title: Architecture et décisions techniques
---

## État de référence

Cette page décrit le code présent dans le `main` local vérifié le 6 novembre 2026 et les décisions de l’équipe. Le contexte de travail à jour est `CONTEXT.md` à la racine du dépôt. Vérifier la branche utilisée pour connaître l’état actuel.

L’API est présente dans ce `main` local. Le front affiche encore une page d’accueil et la boucle de jeu n’est pas intégrée. La présence d’une route dans le code ne signifie pas que le parcours complet est jouable ou déployé.

## Stack et responsabilités

![Schéma illustré de la stack CHOP-CHOP avec les logos de Vercel, React, Vite, TypeScript, Phaser, Fastify, Drizzle, Supabase, PostgreSQL, Docusaurus et GitHub](/img/stack-chop-chop.png)

[Ouvrir le schéma en grand (SVG)](/img/stack-chop-chop.svg). Logos des technologies : [Simple Icons](https://simpleicons.org/) et [logo pixel art officiel de Phaser](https://phaser.io/download/logo).

Le schéma distingue les services configurés des intégrations et hébergements encore à réaliser. Vercel sert uniquement le front statique ; le lieu d’hébergement de l’API et la publication de Docusaurus restent à confirmer.

Le jeu utilise un monorepo pnpm avec Node.js 22 ou supérieur, pnpm 11 et les workspaces `apps/*`, `front` et `packages/*`.

| Zone | Technologies | Responsabilité |
| --- | --- | --- |
| `front/` — `@chopchop/front` | React 19, TypeScript, Vite 7, modules SCSS | Menus, règles, connexion et classement à intégrer |
| Jeu intégré au front | Phaser (choix acté ; paquet non encore installé) | Cuisine, personnages, collisions, animations et interactions |
| `apps/api/` — `@chopchop/api` | Node, Fastify 5, Drizzle ORM, `pg`, Zod, `jose`, `tsx`, `@fastify/cors` et `@fastify/rate-limit` | Profil, cycle de partie, contrôle des résultats et classement |
| Supabase | PostgreSQL et Supabase Auth | Stockage et authentification |
| `packages/shared/` — `@chopchop/shared` | Types, schémas Zod et limites de niveaux | Contrats communs au front et au back |
| GitHub Actions | `pnpm typecheck`, `pnpm test` | Vérification du monorepo sur chaque PR et sur `main` |

Le site Docusaurus dans `documentation/` est un projet npm séparé, avec son propre `package-lock.json` et ses commandes `npm run typecheck` et `npm run build`. Le workflow CI actuel vérifie le monorepo pnpm, pas la compilation Docusaurus. Le front utilise actuellement TypeScript 5, l’API et le paquet partagé TypeScript 7, et Docusaurus TypeScript 6 ; harmoniser ces versions seulement si une incompatibilité concrète le demande.

Les tests de l’API utilisent Vitest. Les tables décrites sont `joueur`, `niveau`, `version_regles` et `partie`. Les migrations `0000` à `0004` sont mentionnées ; `0003` initialise cinq niveaux et la règle `v1` de 180 secondes. Les noms des niveaux restent provisoires. Le périmètre produit a depuis été ramené à trois niveaux ; les données et contrats doivent encore être alignés.

## Authentification et parcours d’une partie

Le parcours retenu prévoit l’inscription et la connexion par email et mot de passe directement auprès de Supabase Auth depuis le front. Le SDK `@supabase/supabase-js` n’est pas encore installé dans `front/` et ce parcours reste à intégrer. L’API, déjà présente, ne reçoit pas les mots de passe : elle vérifie le jeton `Authorization: Bearer <token>` à partir de `SUPABASE_URL`.

Le parcours cible, encore à intégrer de bout en bout, est : inscription ou connexion → création du pseudo avec `PUT /me` si nécessaire → `POST /games` au démarrage du niveau → `POST /games/:id/finish` à la fin du chronomètre.

| Méthode | Route | Authentification | Fonction |
| --- | --- | --- | --- |
| GET | `/health` | Non | Santé du serveur |
| GET | `/me` | Oui | Profil ; `404` si le pseudo n’a pas encore été créé |
| PUT | `/me` | Oui | Créer ou modifier un pseudo unique de 2 à 16 caractères ; `409` si déjà pris |
| POST | `/games` | Oui | Démarrer une partie avec `{ levelId }` |
| POST | `/games/:id/finish` | Oui | Terminer avec `{ score, bestCombo }`, recevoir `{ rank, score, durationMs }` |
| POST | `/games/:id/abandon` | Oui | Abandonner une partie, jamais classée ; réponse `204` |
| GET | `/leaderboard/:levelId?limit=10` | Non | Classement du niveau, limite maximale de 50 résultats |

Les contrats sont définis dans `packages/shared/src/game.ts` et `levels.ts`. `LEVEL_IDS` contient les identifiants 1 à 5. Les réponses complètes et les détails des schémas doivent être consultés dans le dépôt du jeu.

## Contrôle des résultats

Le serveur mesure la durée de la partie et borne le score par `LEVEL_LIMITS`. Les plafonds présents dans le code, de 500 à 1 500 points, sont **provisoires**. Avec la règle `v1`, la durée acceptée va de 175 à 240 secondes ; une durée ou un score hors limites entraîne une réponse `422`. Une seule partie en cours par joueur est autorisée.

Ces contrôles ne constituent pas une simulation serveur du gameplay. L’enregistrement unique d’une partie reste à vérifier lors de l’intégration. Le choix entre toutes les parties terminées et le meilleur score par joueur reste à trancher.

## Décisions et intégration à terminer

Intégrer Phaser au front React/Vite, aligner les trois niveaux décidés avec le contrat partagé, les données et Figma, puis vérifier le parcours complet. Tout changement de durée doit s’accompagner d’une nouvelle version des règles.

Voir le [design](./design.md), le [classement](./classement.md), les [critères de validation](./validation.md) et les [conventions de travail](./conventions.md).
