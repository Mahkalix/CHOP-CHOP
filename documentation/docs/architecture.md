---
title: Architecture et décisions techniques
---

## État de référence

Cette page décrit le code présent dans le `main` local vérifié le 6 novembre 2026 et les décisions de l’équipe. Le contexte de travail à jour est `CONTEXT.md` à la racine du dépôt. Vérifier la branche utilisée pour connaître l’état actuel.

L’API est présente dans `main`. Le front affiche les écrans d’accueil, de règles et de classement ; l’écran « jouer » affiche la cuisine Phaser (déplacements, collisions, prise et dépôt d’objets), mais la boucle de jeu (recettes, commandes, score) n’est pas intégrée. La présence d’une route dans le code ne signifie pas que le parcours complet est jouable ou déployé.

## Stack et responsabilités

![Schéma illustré de la stack CHOP-CHOP avec les logos de Vercel, React, Vite, TypeScript, Phaser, Fastify, Drizzle, Supabase, PostgreSQL, Docusaurus et GitHub](/img/stack-chop-chop.svg)

[Ouvrir le schéma en grand (SVG)](/img/stack-chop-chop.svg). Logos des technologies : [Simple Icons](https://simpleicons.org/) et [logo pixel art officiel de Phaser](https://phaser.io/download/logo).

Le schéma distingue les services configurés des intégrations et hébergements encore à réaliser. Le projet Vercel `chop-chop-front` sert uniquement le front statique. Une configuration Vercel dédiée existe pour Docusaurus (`documentation/vercel.json`), dont le déploiement reste à confirmer, et le lieu d’hébergement de l’API reste à confirmer.

Le jeu utilise un monorepo pnpm avec Node.js 22 ou supérieur, pnpm 11 et les workspaces `apps/*`, `front` et `packages/*`.

| Zone | Technologies | Responsabilité |
| --- | --- | --- |
| `front/` — `@chopchop/front` | React 19, TypeScript, Vite 7, modules SCSS | Menus, règles, connexion et classement à intégrer |
| Jeu intégré au front | Phaser 3, dans `front/src/features/game/` | Cuisine, personnages, collisions, animations et interactions |
| `apps/api/` — `@chopchop/api` | Node, Fastify 5, Drizzle ORM, `pg`, Zod, `jose`, `tsx`, `@fastify/cors` et `@fastify/rate-limit` | Profil, cycle de partie, contrôle des résultats et classement |
| Supabase | PostgreSQL et Supabase Auth | Stockage et authentification |
| `packages/shared/` — `@chopchop/shared` | Types, schémas Zod et limites de niveaux | Contrats communs au front et au back |
| GitHub Actions | `pnpm typecheck`, `pnpm test` | Vérification du monorepo sur chaque PR et sur `main` |

Le site Docusaurus dans `documentation/` est un projet npm séparé, avec son propre `package-lock.json` et ses commandes `npm run typecheck` et `npm run build`. Le workflow CI actuel vérifie le monorepo pnpm, pas la compilation Docusaurus. Le front utilise actuellement TypeScript 5, l’API et le paquet partagé TypeScript 7, et Docusaurus TypeScript 6 ; harmoniser ces versions seulement si une incompatibilité concrète le demande.

Les tests de l’API utilisent Vitest. Les tables décrites sont `joueur`, `niveau`, `version_regles` et `partie`. Les migrations `0000` à `0004` sont mentionnées ; `0003` initialise cinq niveaux et la règle `v1` de 180 secondes. Les noms des niveaux restent provisoires. Le périmètre produit a depuis été ramené à trois niveaux ; les données et contrats doivent encore être alignés.

## Authentification et parcours d’une partie

Le parcours retenu est une connexion par pseudo seul, sans email ni mot de passe : le front ouvre une session anonyme avec Supabase Auth (`signInAnonymously()`), puis le joueur choisit son pseudo. Le SDK `@supabase/supabase-js` n’est pas encore installé dans `front/` et ce parcours reste à intégrer. L’API, déjà présente, ne reçoit aucun identifiant : elle vérifie le jeton `Authorization: Bearer <token>` à partir de `SUPABASE_URL`.

Le parcours cible, encore à intégrer de bout en bout, est : connexion anonyme → `GET /me` (un `404` signale un nouveau joueur) → choix du pseudo avec `PUT /me`, une seule fois → `POST /games` au démarrage du niveau → `POST /games/:id/finish` à la fin du chronomètre.

| Méthode | Route | Authentification | Fonction |
| --- | --- | --- | --- |
| GET | `/health` | Non | Santé du serveur |
| GET | `/me` | Oui | Profil ; `404` si le pseudo n’a pas encore été créé |
| PUT | `/me` | Oui | Choisir son pseudo, une seule fois (2 à 16 caractères, unique sans tenir compte de la casse) ; `409` s’il est déjà pris ou si le joueur en a déjà un autre |
| GET | `/pseudos/:pseudo/available` | Oui | Vérifier qu’un pseudo est libre |
| GET | `/me/games` | Oui | Historique des parties terminées du joueur |
| GET | `/me/best` | Oui | Meilleur score du joueur sur chaque niveau terminé |
| POST | `/games` | Oui | Démarrer une partie avec `{ levelId }` |
| POST | `/games/:id/finish` | Oui | Terminer avec `{ score, bestCombo }`, recevoir `{ rank, score, durationMs }` |
| POST | `/games/:id/abandon` | Oui | Abandonner une partie, jamais classée ; réponse `204` |
| GET | `/leaderboard/:levelId?limit=10` | Non | Classement du niveau, limite maximale de 50 résultats |
| GET | `/recipes` | Non | Ingrédients et états, recettes et phases de disponibilité |

Les contrats sont définis dans `packages/shared/src/game.ts`, `levels.ts` et `recipes.ts`. `LEVEL_IDS` contient les identifiants 1 à 5. Les réponses complètes et les détails des schémas doivent être consultés dans le dépôt du jeu.

## Contrôle des résultats

Le serveur mesure la durée de la partie et borne le score par `LEVEL_LIMITS`. Les plafonds présents dans le code, de 500 à 1 500 points, sont **provisoires**. Avec la règle `v1`, la durée acceptée va de 175 à 240 secondes ; une durée ou un score hors limites entraîne une réponse `422`. Une seule partie en cours par joueur est autorisée.

Ces contrôles ne constituent pas une simulation serveur du gameplay. Une partie ne peut être terminée qu’une seule fois : un deuxième appel de fin de partie reçoit `409 Game already ended`. Le front doit seulement éviter d’envoyer deux fois la fin de partie. Le choix entre toutes les parties terminées et le meilleur score par joueur reste à trancher.

## Décisions et intégration à terminer

Brancher la cuisine Phaser, déjà intégrée au front React/Vite, aux recettes, aux commandes, au score et à l’API, aligner les trois niveaux décidés avec le contrat partagé, les données et Figma, puis vérifier le parcours complet. Tout changement de durée doit s’accompagner d’une nouvelle version des règles.

Voir le [design](./design.md), le [classement](./classement.md), les [critères de validation](./validation.md) et les [conventions de travail](./conventions.md).
