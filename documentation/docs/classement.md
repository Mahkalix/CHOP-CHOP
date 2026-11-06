---
title: Classement par niveau
---

:::info Document de cadrage
Le jeu comporte trois niveaux, chacun avec son propre classement. Voir les [sources](./references.md).
:::

## Un classement pour chaque niveau

Les joueurs comparent leurs résultats pour un même niveau parmi les trois prévus. La conservation du meilleur score validé par joueur et par niveau est une exigence à vérifier lors de l’intégration.

Associer les scores à un identifiant de compte persistant, distinct du pseudo affiché.

Afficher rang, pseudo et meilleur score ; mettre en évidence le joueur connecté.

Le menu affiche les cinq premières parties du niveau choisi via `GET /leaderboard/:levelId?limit=5`, avec une limite maximale de 50 résultats. La pagination et l’accès à la position du joueur hors de cette liste restent à confirmer ; le contexte ne décrit pas de contrat pour ces comportements.

Proposition de départage : à score égal, le résultat atteint le plus tôt passe devant.

Un résultat inférieur au record personnel ne remplace pas ce record.

Séparer les classements si une modification des règles ou du barème rend les scores incomparables.

Le stockage utilise PostgreSQL sur Supabase et les tables `joueur`, `niveau`, `version_regles` et `partie`. L’authentification passe par Supabase Auth. Le serveur mesure la durée et contrôle les limites de score ; les plafonds restent provisoires. Une partie abandonnée n’est jamais classée. Les contrôles détaillés sont présentés dans l’[architecture](./architecture.md).
