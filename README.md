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

Les [conventions de travail](documentation/docs/conventions.md), l'[architecture et les routes API](documentation/docs/architecture.md) la [configuration Vercel du front](docs/vercel.md) et l'[hébergement de l'API sur Render](docs/render.md) donnent le détail. Le travail en cours se suit dans les [issues](https://github.com/Mahkalix/CHOP-CHOP/issues) et le [Project](https://github.com/users/Mahkalix/projects/3).
