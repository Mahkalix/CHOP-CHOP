---
title: Classement par niveau
---

:::info Document de cadrage
L’équipe a retenu trois niveaux avec un classement par niveau. L’API est présente dans le `main` local vérifié le 6 novembre 2026. Vérifier la branche utilisée et les [sources](./references.md) avant de modifier le contrat.
:::

## Un classement pour chaque niveau

Les joueurs comparent leurs résultats pour un même niveau parmi les trois prévus. Le choix entre toutes les parties terminées et le meilleur score par joueur reste à trancher : l’API actuelle classe toutes les parties terminées, et un même joueur peut apparaître plusieurs fois.

Associer les scores à l’identifiant du compte anonyme Supabase du joueur, distinct du pseudo affiché. Ce compte est lié à la session du navigateur : si le joueur efface ses données, il devient un nouveau joueur et ses anciens scores ne lui sont plus rattachés.

Afficher rang, pseudo et score ; la mise en évidence du joueur connecté reste à valider.

La route publique décrite est `GET /leaderboard/:levelId?limit=10`, avec une limite maximale de 50 résultats. La pagination et l’accès à la position du joueur hors de cette liste restent à confirmer ; le contrat actuel ne décrit pas ces comportements.

Proposition de départage : à score égal, le résultat atteint le plus tôt passe devant.

Si l’équipe retient un record personnel par niveau, préciser comment un résultat inférieur est conservé ou présenté.

Séparer les classements si une modification des règles ou du barème rend les scores incomparables.

Le stockage utilise PostgreSQL sur Supabase et les tables `joueur`, `niveau`, `version_regles` et `partie`. L’authentification passe par Supabase Auth. Le serveur mesure la durée et contrôle les limites de score ; les plafonds restent provisoires. Une partie abandonnée n’est jamais classée. Les contrôles détaillés sont présentés dans l’[architecture](./architecture.md).