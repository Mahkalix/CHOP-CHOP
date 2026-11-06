# CHOP-CHOP — Contexte projet

> Fichier à donner en contexte à Claude (ou à tout nouvel arrivant) avant de coder.
> Liste du reste à faire : voir [TODO.md](./TODO.md).

## En une phrase

Petit jeu web solo façon **Overcooked** (cuisine, commandes à préparer en temps limité), jouable au clavier sur ordinateur, avec 5 niveaux et un classement par niveau.

## Cadre

- Projet de groupe du cours de Management, M2 développeur fullstack.
- **Délai : 2 jours.** Tout est « vibe codé » : le code doit rester **simple et propre**.
- Design : [Figma Chop-Chop](https://www.figma.com/design/5YyQNON3zicZCKuN1CkEH0/Chop-Chop?node-id=0-1&t=MveCdzsfZftyUqJs-1)

## Équipe

| Personne | Rôle |
|---|---|
| Sabrina | Cheffe de projet + dev |
| Maxence | Dev front + responsable UX |
| Valérie | Base de données + back |
| Mel | Responsable back |

## Stack

- **Monorepo pnpm** (Node 22+, pnpm 11), workspaces : `apps/*`, `front`, `packages/*`.
- **Front** (`front/`, paquet `@chopchop/front`) : React 19 + TypeScript + Vite + SCSS modules.
- **Back** (`apps/api/`, paquet `@chopchop/api`) : Node + Fastify 5 + Drizzle ORM + `pg` + Zod + `jose`, lancé avec `tsx`. Tests avec Vitest.
- **BDD + Auth** : PostgreSQL sur Supabase. Les joueurs s'inscrivent et se connectent **directement avec Supabase Auth depuis le front** (`supabase-js`, email + mot de passe). L'API ne voit jamais les mots de passe : elle vérifie le jeton `Authorization: Bearer <token>` avec `SUPABASE_URL`.
- **Partagé** (`packages/shared`, importé via `@chopchop/shared`) : schémas Zod, types et limites de niveaux communs front/back.
- **CI** : GitHub Actions, `pnpm typecheck` puis `pnpm test` sur chaque PR et sur `main`.

## Commandes

```bash
pnpm install
cp apps/api/.env.example apps/api/.env   # renseigner DATABASE_URL, SUPABASE_URL...
pnpm dev:front        # Vite
pnpm dev:api          # Fastify (tsx watch), http://localhost:3000
pnpm typecheck
pnpm test
# Migrations : une seule personne à la fois pour éviter les conflits de schéma
pnpm --filter @chopchop/api db:generate   # après modification de src/db/schema.ts
pnpm --filter @chopchop/api db:migrate
```

Variables de `apps/api/.env` : `DATABASE_URL` (pooler Supabase), `DIRECT_URL` (migrations, optionnel), `SUPABASE_URL`, `PORT`, `CORS_ORIGIN`, `TRUST_PROXY`. Le mot de passe de la base est à demander à l'équipe, `.env` n'est jamais commité.

## État du repo (6 nov. 2026)

### Sur `main` : seulement le squelette
| Zone | État |
|---|---|
| Monorepo, CI, tsconfig | En place |
| `front/` | Vite + React + SCSS lancés. `HomePage` affiche juste « cc » (liste de 3 niveaux et `StatCard` inutilisés). Tokens de couleurs dans `styles/_tokens.scss`. |
| `apps/api/`, `packages/shared/` | Vides (`export {}`) |

### Sur la branche `feat/8-API-and-BDD` : l'API est faite, **pas encore mergée dans `main`**
Commits de Pizzosaure et Sabrina (2 oct. et 6 nov.).

- **Serveur Fastify** (`app.ts`, `index.ts`, `config.ts`) : CORS, rate-limit, gestion d'erreurs qui ne fuit pas les détails de la base.
- **Auth** (`auth.ts`) : vérification des jetons Supabase.
- **Base** (`db/schema.ts`, migrations Drizzle `0000` à `0004`) : tables `joueur`, `niveau`, `version_regles`, `partie`. Index de classement, une seule partie en cours par joueur.
- **Routes** :

| Méthode | Route | Auth | Rôle |
|---|---|---|---|
| GET | `/health` | non | Santé du serveur |
| GET | `/me` | oui | Profil, `404` si pas encore de pseudo |
| PUT | `/me` | oui | Créer/changer le pseudo (2 à 16 caractères, unique), `409` si pris |
| POST | `/games` | oui | Démarrer une partie `{ levelId }` → `{ gameId, levelId, startedAt }` |
| POST | `/games/:id/finish` | oui | Terminer `{ score, bestCombo }` → `{ rank, score, durationMs }` |
| POST | `/games/:id/abandon` | oui | Abandonner (jamais classée), `204` |
| GET | `/leaderboard/:levelId?limit=10` | non | Classement du niveau (limite max 50) |

- **Flux type** : inscription Supabase Auth → `PUT /me` une fois → à chaque partie, `POST /games` au début du niveau puis `POST /games/:id/finish` à la fin du chrono.
- **Anti-triche** : la durée est mesurée par le serveur ; le score est borné par `LEVEL_LIMITS` (valeurs **provisoires**, 500 à 1500) ; durée acceptée entre la durée de partie moins 5 s et plus 60 s ; sinon `422`.
- **Partagé** (`packages/shared/src/game.ts`, `levels.ts`) : `LEVEL_IDS = [1..5]`, schémas Zod des requêtes et types des réponses, à réutiliser tels quels côté front.
- **Tests** : `api.test.ts` et `auth.test.ts`.
- Sabrina y a aussi supprimé les fichiers générés (`tsbuildinfo`, `vite.config.js/.d.ts`) et le README y est plus complet.

Les branches `10-front-menu-navigation` et `Front` existent sur GitHub mais n'ont aucun commit d'avance sur `main`.

## Points d'attention à trancher

1. **Moteur du jeu** : le README parle de *Phaser 3* dans `apps/game`, mais le front réel est du React/Vite dans `front/`. Proposition la plus simple : garder `front/` (React pour menus, connexion, classement) et y intégrer un canvas de jeu, avec Phaser ou en Canvas 2D maison. À décider tout de suite.
2. **Niveaux** : l'API et le README prévoient **5 niveaux**, `HomePage` en liste 3 (« Le marche », « Le bistrot », « La grande table »). À aligner avec Figma.
3. **Nombre de niveaux vs temps** : 5 niveaux en 2 jours est ambitieux. Un niveau jouable de bout en bout d'abord, les autres ensuite sous forme de données.
4. **Versions TypeScript différentes** : `^7.0.2` côté api/shared, `^5.9.3` côté front. À harmoniser si ça pose problème.
5. **Données de base** : déjà insérées par la migration `0003` (5 niveaux « Niveau 1 » à « Niveau 5 » avec id = numéro, et la règle `v1` de **180 s**). Il suffit d'appliquer les migrations. Les noms des niveaux sont provisoires. Le chrono du jeu doit durer 180 s (ou alors ajouter une nouvelle `version_regles`), car l'API refuse une partie dont la durée mesurée sort de 175 s à 240 s.
6. Le README de `main` ne mentionne pas `front/` : à mettre à jour après le merge de l'API.

## Conventions de travail

- Commits au format `type: description` (feat, fix, refactor, docs, test, chore, perf, ci).
- Branches et PR par fonctionnalité, revue avant merge sur `main`. Les commits, push et PR sont faits par les humains de l'équipe.
- Code simple : fonctions courtes (< 50 lignes), fichiers < 800 lignes, pas de sur-ingénierie, pas de `console.log` oublié.
- Les types et schémas échangés entre front et back vivent dans `packages/shared`.
