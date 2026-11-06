---
title: Classement mondial
---

:::info Document de cadrage
Contenu issu du cahier des charges du 2 octobre 2026. Les propositions restent à valider ; les comportements attendus ne constituent pas une preuve d’implémentation. Voir les [sources](./references.md).
:::

## Classement mondial

Tous les joueurs inscrits participent à un classement commun ; conserver leur meilleur score validé.

Associer les scores à un identifiant de compte persistant, distinct du pseudo affiché.

Afficher rang, pseudo et meilleur score ; mettre en évidence le joueur connecté.

Prévoir une liste paginée et l’accès à la position du joueur, même hors de la première page.

Proposition de départage : à score égal, le résultat atteint le plus tôt passe devant.

Un résultat inférieur au record personnel ne remplace pas ce record.

Séparer les classements si une modification des règles ou du barème rend les scores incomparables.

Exigences de stockage : identifiant du joueur, pseudo, identifiant unique de partie, score, statistiques, date et version des règles. Le serveur contrôle les résultats reçus et empêche l’enregistrement multiple d’une même partie. La méthode de validation des parties et le mode d’authentification restent à définir.
