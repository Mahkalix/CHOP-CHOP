---
title: Architecture et décisions techniques
---

## État de référence

Cette page reprend le [contexte projet du 6 novembre 2026](./references.md). Cet état est rapporté par le document fourni ; le dépôt du jeu n’est pas présent dans ce dossier de documentation et n’a pas été audité ici.

Selon ce contexte, `main` contient le squelette du monorepo. L’API est développée sur `feat/8-API-and-BDD`, **sans être encore fusionnée dans `main`**. Le front de `main` reste au stade initial. La présence d’une route décrite ci-dessous ne signifie donc pas qu’elle est disponible sur `main` ou déployée.

## Stack et responsabilités

Le jeu utilise un monorepo pnpm avec Node.js 22 ou supérieur, pnpm 11 et les workspaces `apps/*`, `front` et `packages/*`.

| Zone | Technologies | Responsabilité |
| --- | --- | --- |
| `front/` — `@chopchop/front` | React 19, TypeScript, Vite, modules SCSS | Menus, connexion, interface et classement |
| Jeu intégré au front | Phaser ou Canvas 2D maison, choix ouvert | Cuisine, personnage, collisions et interactions |
| `apps/api/` — `@chopchop/api` | Node, Fastify 5, Drizzle ORM, `pg`, Zod, `jose`, `tsx` | Profil, cycle de partie, contrôle des résultats et classement |
| Supabase | PostgreSQL et Supabase Auth | Stockage et authentification |
| `packages/shared/` — `@chopchop/shared` | Types, schémas Zod et limites de niveaux | Contrats communs au front et au back |
| GitHub Actions | `pnpm typecheck`, `pnpm test` | Vérification de chaque PR et de `main` |

Les tests de l’API utilisent Vitest. Les tables décrites sont `joueur`, `niveau`, `version_regles` et `partie`. Les migrations `0000` à `0004` sont mentionnées ; `0003` initialise cinq entrées de niveau en base ainsi que la règle `v1` de 180 secondes. Le jeu utilise les entrées 1 à 3. Les noms des niveaux restent provisoires.

## Authentification et parcours d’une partie

Le front utilise `supabase-js` pour inscrire et connecter les joueurs par email et mot de passe directement auprès de Supabase Auth. L’API ne reçoit jamais ces mots de passe : elle vérifie le jeton `Authorization: Bearer <token>` à partir de `SUPABASE_URL`.

Le parcours décrit est : inscription ou connexion → création du pseudo avec `PUT /me` si nécessaire → `POST /games` au démarrage du niveau → `POST /games/:id/finish` à la fin du chronomètre.

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

Le serveur mesure la durée de la partie et borne le score par `LEVEL_LIMITS`. Les plafonds indiqués dans le contexte, de 500 à 1 500 points, sont **provisoires**. Avec la règle `v1`, la durée acceptée va de 175 à 240 secondes ; une durée ou un score hors limites entraîne une réponse `422`. Une seule partie en cours par joueur est autorisée.

Ces contrôles ne constituent pas une simulation serveur du gameplay. L’enregistrement unique du résultat et la conservation du meilleur score par niveau restent des comportements à vérifier lors de l’intégration.

## Décisions et intégration à terminer

Choisir le moteur du jeu et l’intégrer dans `front/`, aligner les trois niveaux avec Figma, fusionner l’API après revue et vérifier le parcours complet. Les versions TypeScript du front et du back diffèrent selon le contexte ; les harmoniser si nécessaire. Tout changement de durée doit s’accompagner d’une nouvelle version des règles.

Voir le [design](./design.md), le [classement](./classement.md), les [critères de validation](./validation.md) et les [conventions de travail](./conventions.md).
