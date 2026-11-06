# API CHOP-CHOP : guide pour le front

Tout ce qu'il faut pour appeler l'API depuis le front. Le code de référence est dans `apps/api/src/routes/` et les types dans `packages/shared/src/` (importés avec `@chopchop/shared`).

## En bref

| | |
|---|---|
| URL en local | `http://localhost:3000` (`pnpm dev:api`) |
| Format | JSON, `Content-Type: application/json` sur les `POST`/`PUT` |
| Authentification | Jeton Supabase dans `Authorization: Bearer <jeton>` |
| Identité du joueur | Connexion anonyme Supabase + pseudo choisi une fois |
| Dates | Chaînes ISO 8601 (`2026-11-06T10:55:00.000Z`) |
| Durées | En millisecondes |

## Routes

| Méthode | Route | Jeton | Rôle |
|---|---|---|---|
| GET | [`/health`](#get-health) | non | Vérifier que l'API tourne |
| GET | [`/me`](#get-me) | oui | Profil du joueur connecté |
| PUT | [`/me`](#put-me) | oui | Choisir son pseudo (une seule fois) |
| GET | [`/pseudos/:pseudo/available`](#get-pseudospseudoavailable) | oui | Un pseudo est-il libre ? |
| GET | [`/me/games`](#get-megames) | oui | Historique de ses parties terminées |
| GET | [`/me/best`](#get-mebest) | oui | Son meilleur score par niveau |
| POST | [`/games`](#post-games) | oui | Démarrer une partie |
| POST | [`/games/:id/finish`](#post-gamesidfinish) | oui | Terminer une partie et envoyer le score |
| POST | [`/games/:id/abandon`](#post-gamesidabandon) | oui | Abandonner une partie |
| GET | [`/leaderboard/:levelId`](#get-leaderboardlevelid) | non | Classement d'un niveau |

## Parcours type d'un joueur

```
1. signInAnonymously()                     ← Supabase, une seule fois par navigateur
2. GET  /me                                ← 200 = joueur connu, 404 = nouveau joueur
3. (nouveau) GET /pseudos/:pseudo/available   pendant la saisie
4. (nouveau) PUT /me { pseudo }               une seule fois
5. POST /games { levelId }                 ← au début du niveau, garder gameId
6. ...le joueur joue...
7. POST /games/:gameId/finish { score, bestCombo }   ← à la fin du chrono → rang (place de son meilleur score)
   ou POST /games/:gameId/abandon                    ← si le joueur quitte
8. GET  /leaderboard/:levelId              ← afficher le classement
```

## Authentification

Il n'y a **ni inscription ni mot de passe** : le joueur est un compte anonyme Supabase, reconnu grâce à la session gardée par `supabase-js` dans le navigateur.

```ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

// Au démarrage : réutiliser la session existante, sinon en créer une.
export async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.access_token;

  const { data: created, error } = await supabase.auth.signInAnonymously();
  if (error || !created.session) throw new Error("Connexion impossible");
  return created.session.access_token;
}
```

- Appelez `getAccessToken()` **avant chaque requête** : `supabase-js` renouvelle le jeton automatiquement, il ne faut pas le stocker soi-même.
- Si le joueur efface les données de son navigateur ou change de navigateur, il devient un **nouveau joueur** (nouveau compte, nouveau pseudo, historique perdu).
- Prérequis côté Supabase : *Anonymous sign-ins* activé (Authentication > Sign In / Providers).

### Petit client typé (suggestion)

```ts
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  constructor(public status: number, message: string, public issues?: { field: string; message: string }[]) {
    super(message);
  }
}

export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok) throw new ApiError(res.status, data.error, data.issues);
  return data as T;
}
```

Les routes publiques (`/health`, `/leaderboard/...`) acceptent aussi le jeton, il est simplement ignoré.

## Erreurs

Toutes les erreurs ont la même forme :

```json
{ "error": "Message lisible" }
```

Les erreurs `400` de validation ajoutent le détail par champ :

```json
{
  "error": "Invalid payload",
  "issues": [{ "field": "pseudo", "message": "Too small: expected string to have >=2 characters" }]
}
```

| Code | Signification |
|---|---|
| 400 | Corps, paramètre ou `limit` invalide |
| 401 | Jeton absent, expiré ou invalide (`{ "error": "Unauthorized" }`) |
| 403 | Le joueur n'a pas encore de pseudo (voir `POST /games`) |
| 404 | Ressource inconnue, ou qui appartient à un autre joueur |
| 409 | Conflit : pseudo déjà pris / déjà choisi, partie déjà terminée |
| 422 | Score ou durée jugés impossibles (anti-triche) |
| 429 | Trop de requêtes (voir plus bas) |
| 500 | Erreur serveur (`{ "error": "Internal error" }`, sans détail) |

### Limites de débit

Par adresse IP : 60 requêtes/minute en général, et **20/minute** sur `POST /games`, `POST /games/:id/finish` et `POST /games/:id/abandon`. `/health` n'est pas limitée. Au-delà : `429`.

## Types partagés

À importer, jamais à recopier : `import type { StartGameResponse } from "@chopchop/shared"`.

| Type | Contenu |
|---|---|
| `Profile` | `{ id: string; pseudo: string }` |
| `PseudoAvailabilityResponse` | `{ pseudo: string; available: boolean }` |
| `StartGameResponse` | `{ gameId: string; levelId: number; startedAt: string }` |
| `FinishGameResponse` | `{ rank: number; score: number; durationMs: number; bestScore: number; isRecord: boolean }` |
| `LeaderboardEntry` | `{ rank; pseudo; score; durationMs; finishedAt }` |
| `LeaderboardResponse` | `{ levelId: number; entries: LeaderboardEntry[] }` |
| `PlayerGame` | `{ gameId; levelId; score; durationMs; finishedAt }` |
| `PlayerGamesResponse` | `{ games: PlayerGame[] }` |
| `BestScore` | `{ levelId: number; score: number }` |
| `BestScoresResponse` | `{ scores: BestScore[] }` |

Les schémas Zod (`PseudoSchema`, `StartGameSchema`, `FinishGameSchema`, `LevelIdSchema`...) sont exportés aussi : utilisez-les pour valider les formulaires côté front avec les mêmes règles que l'API.

---

## Détail des routes

### GET /health

Pas de jeton.

```json
{ "status": "ok" }
```

### GET /me

Profil du joueur connecté.

- `200` : `{ "id": "b1a5…", "pseudo": "Gordon" }`
- `404` : `{ "error": "Profile not created yet" }` → c'est un **nouveau joueur**, afficher l'écran de choix du pseudo.

### PUT /me

Choisit le pseudo. **Définitif** : impossible à changer ensuite.

Corps : `{ "pseudo": "Gordon" }`

Règles du pseudo : 2 à 16 caractères, lettres (accents compris), chiffres, espace, `_` et `-`. Les espaces autour sont retirés. Unique **sans tenir compte de la casse** (`gordon` et `Gordon` sont le même pseudo).

- `200` : `{ "id": "b1a5…", "pseudo": "Gordon" }` (le pseudo renvoyé est celui retiré de ses espaces). Renvoyer **le même pseudo** que celui déjà enregistré donne aussi `200` : on peut donc réessayer sans risque si la réponse s'est perdue.
- `400` : pseudo invalide (avec `issues`)
- `409` `{ "error": "Pseudo already taken" }` : pris par un autre joueur
- `409` `{ "error": "Pseudo already chosen" }` : ce joueur a déjà un **autre** pseudo (le changement est refusé)

Prévenez le joueur avant de valider que son pseudo sera définitif.

### GET /pseudos/:pseudo/available

Pour afficher « déjà pris » pendant la saisie, avant d'envoyer `PUT /me`. Pensez à `encodeURIComponent(pseudo)`.

- `200` : `{ "pseudo": "Gordon", "available": true }`
- `400` : pseudo invalide (trop court, caractères interdits...)

Cette route donne seulement une indication : entre-temps un autre joueur peut prendre le pseudo, donc gérez quand même le `409` de `PUT /me`.

### GET /me/games

Parties **terminées** du joueur, la plus récente d'abord. Les parties abandonnées ou en cours n'y figurent pas.

Paramètre : `?limit=10` (1 à 50, 10 par défaut).

```json
{
  "games": [
    {
      "gameId": "0a6b…",
      "levelId": 2,
      "score": 300,
      "durationMs": 181500,
      "finishedAt": "2026-11-06T10:55:00.000Z"
    }
  ]
}
```

Liste vide (`"games": []`) si le joueur n'a rien terminé. `400` si `limit` est invalide.

### GET /me/best

Meilleur score du joueur sur chaque niveau qu'il a **terminé au moins une fois**, trié par niveau. Un niveau jamais terminé est absent de la liste.

```json
{ "scores": [{ "levelId": 1, "score": 200 }, { "levelId": 2, "score": 300 }] }
```

### POST /games

Démarre une partie. À appeler **quand le niveau commence** : le serveur mesure la durée à partir de cet instant.

Corps : `{ "levelId": 1 }` (entier de 1 à 5)

- `201` : `{ "gameId": "0a6b…", "levelId": 1, "startedAt": "2026-11-06T10:52:00.000Z" }`
- `400` : `levelId` absent, hors de 1 à 5, ou pas un nombre
- `403` : `{ "error": "Create a profile first (PUT /me)" }` → le joueur n'a pas de pseudo

Un joueur n'a qu'**une partie en cours** à la fois : en démarrer une nouvelle abandonne automatiquement la précédente. Il n'existe pas de route pour reprendre une partie après un rechargement de page.

### POST /games/:id/finish

Termine la partie et enregistre le score. À appeler **à la fin du chrono**.

Corps : `{ "score": 300, "bestCombo": 4 }`

- `score` : entier ≥ 0, obligatoire
- `bestCombo` : entier de 0 à 1000, facultatif (0 par défaut)
- Ne **pas** envoyer de durée : elle est mesurée par le serveur (si vous en envoyez une, elle est ignorée).

Réponses :

- `200` : `{ "rank": 3, "score": 300, "durationMs": 181500, "bestScore": 300, "isRecord": true }` : `rank` est la place du **meilleur score du joueur** dans le classement du niveau (si la partie qui vient de finir ne bat pas son record, c'est la place de son record). `score` et `durationMs` sont ceux de la partie qui vient de finir. `bestScore` est le meilleur score du joueur sur ce niveau (cette partie comprise) et `isRecord` vaut `true` si cette partie est devenue sa meilleure : afficher « nouveau record » avec `isRecord`
- `400` : corps invalide
- `404` : partie inconnue, identifiant mal formé, ou partie d'un autre joueur
- `409` : partie déjà terminée ou abandonnée
- `422` `{ "error": "Implausible score" }` : voir ci-dessous. **La partie est alors fermée**, on ne peut pas réessayer avec un autre score.

Règles anti-triche (`422` si l'une n'est pas respectée) :

| Règle | Valeur actuelle |
|---|---|
| Score maximum par niveau (valeurs **provisoires**) | niveau 1 : 500 · 2 : 800 · 3 : 1000 · 4 : 1200 · 5 : 1500 |
| Durée mesurée par le serveur | entre **175 s et 240 s** (durée de la règle `v1` = 180 s, moins 5 s, plus 60 s) |

Conséquence pour le jeu : le chrono doit durer **180 s**, et le score doit rester sous le maximum du niveau, sinon le score est refusé.

### POST /games/:id/abandon

Abandonne la partie (le joueur quitte). Une partie abandonnée n'apparaît jamais dans les classements.

- `204` : succès, pas de corps
- `404` : partie inconnue ou d'un autre joueur
- `409` : partie déjà terminée ou abandonnée

### GET /leaderboard/:levelId

Classement d'un niveau. Pas de jeton.

Paramètre : `?limit=10` (1 à 50, 10 par défaut).

```json
{
  "levelId": 1,
  "entries": [
    { "rank": 1, "pseudo": "Carol", "score": 300, "durationMs": 178000, "finishedAt": "2026-11-06T10:55:00.000Z" },
    { "rank": 2, "pseudo": "Bob", "score": 300, "durationMs": 185000, "finishedAt": "2026-11-06T10:50:00.000Z" }
  ]
}
```

Une ligne par joueur : son **meilleur score** sur le niveau. Rejouer avec un score plus faible ne change rien ; à score égal, la partie la plus rapide du joueur est gardée. Tri : score décroissant, puis durée croissante, puis date de fin (le plus ancien d'abord), donc deux joueurs n'ont jamais le même rang. Seules les parties terminées comptent (jamais les abandonnées ni celles en cours).

- `400` : `{ "error": "Invalid level or query" }` si le niveau n'est pas de 1 à 5 ou si `limit` est invalide.

---

## Questions fréquentes

**Comment savoir si je dois afficher l'écran du pseudo ?** Faire `GET /me` : `404` = écran du pseudo, `200` = passer à l'accueil.

**Le joueur recharge la page en pleine partie ?** La session Supabase est conservée, donc il reste le même joueur. La partie en cours n'est pas récupérable : faire un nouveau `POST /games` (l'ancienne est abandonnée).

**Le joueur rejoue un niveau, que devient son classement ?** Le classement garde une seule ligne par joueur : son meilleur score. Un score plus faible ne remplace pas le record, et le `rank` renvoyé par `finish` est alors la place de ce record. Sur l'écran de fin, utiliser `isRecord` de la réponse de `finish` pour afficher « nouveau record », et `bestScore` pour montrer le record actuel.

**Comment mettre en évidence le joueur connecté dans le classement ?** `LeaderboardEntry` ne contient pas d'identifiant, seulement le `pseudo`. Les pseudos sont uniques (sans tenir compte de la casse) : comparer avec le pseudo de `GET /me`, sans tenir compte de la casse. S'il n'est pas dans les `limit` premiers, il n'y a pas encore de route pour obtenir sa place hors de la liste.

**Le score est refusé en `422`, que faire ?** Afficher une erreur et proposer de rejouer. Vérifier d'abord que le chrono du jeu fait bien 180 s et que le score ne dépasse pas le maximum du niveau.

**L'API change ?** Les types de `@chopchop/shared` font foi : si le contrat évolue, `pnpm typecheck` signale côté front ce qui doit être adapté.
