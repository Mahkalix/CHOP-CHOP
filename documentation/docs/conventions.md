---
title: Conventions et règles de travail
---

Les règles ci-dessous reprennent le [contexte projet du 6 novembre 2026](./references.md). Les compléments de coordination proposés sont identifiés à la fin de la page.

## Un code simple et propre

- Garder des fonctions courtes : **moins de 50 lignes**.
- Garder les fichiers à **moins de 800 lignes**.
- Éviter la sur-ingénierie : choisir la solution la plus simple adaptée au besoin.
- Retirer les `console.log` de débogage avant la revue.
- Centraliser les types et schémas échangés entre le front et le back dans `packages/shared`, importé avec `@chopchop/shared`.

Le front utilise React, TypeScript et des modules SCSS. Le back utilise Fastify, Drizzle et Zod. Les limites de niveaux et les contrats de données partagés doivent être réutilisés côté front plutôt que recopiés.

## Branches et pull requests

Une branche et une pull request correspondent à une fonctionnalité. Une revue est nécessaire avant la fusion dans `main`. Les commits, les pushs et les pull requests sont réalisés par les membres de l’équipe.

Les commits suivent le format `type: description` :

| Type | Usage |
| --- | --- |
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction d’un bug |
| `refactor` | Réorganisation du code sans ajout fonctionnel |
| `docs` | Documentation |
| `test` | Tests |
| `chore` | Maintenance et configuration |
| `perf` | Amélioration des performances |
| `ci` | Intégration continue |

Exemples : `feat: ajouter la sélection du niveau`, `fix: corriger la validation du pseudo`, `docs: présenter l’équipe`.

## Vérifications

Dans le **monorepo du jeu**, GitHub Actions exécute les commandes suivantes sur chaque pull request et sur `main` :

```sh
pnpm typecheck
pnpm test
```

Le contexte indique Node.js 22 ou supérieur et pnpm 11 pour ce monorepo. Les versions TypeScript du front et du back restent à harmoniser si elles posent problème.

Le **site de documentation Docusaurus** présent dans ce dossier possède ses propres commandes :

```sh
npm run typecheck
npm run build
```

## Base de données et configuration

Une seule personne à la fois génère et applique les migrations pour éviter les conflits de schéma. Dans le monorepo du jeu :

```sh
pnpm --filter @chopchop/api db:generate
pnpm --filter @chopchop/api db:migrate
```

Le fichier `apps/api/.env` n’est jamais commité. Il est préparé à partir de `.env.example` et renseigné localement. Le mot de passe de la base est demandé à l’équipe. L’inscription et la connexion passent directement par Supabase Auth ; l’API ne reçoit pas les mots de passe des joueurs.

## Priorités de réalisation

Le projet est prévu sur deux jours. La priorité est un niveau jouable de bout en bout avant la déclinaison des cinq niveaux. Le moteur du jeu doit encore être choisi entre Phaser et un Canvas 2D maison intégré au front React/Vite. Les noms des niveaux et certaines limites de score restent provisoires.

## Compléments de coordination proposés

Ces pratiques complètent le contexte et restent à valider ensemble :

- Décrire dans chaque pull request le besoin, les modifications et les vérifications réalisées.
- Signaler les blocages et les changements de contrat front/back aux personnes concernées.
- Prévenir l’équipe avant une modification du schéma de base ou des types partagés.
- Mettre à jour la documentation lorsqu’une décision change le comportement du jeu.
