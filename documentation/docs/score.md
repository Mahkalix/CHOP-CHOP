---
title: Commandes et score
---

:::info Document de cadrage
Contenu issu du cahier des charges du 2 octobre 2026. Les propositions restent à valider ; les comportements attendus ne constituent pas une preuve d’implémentation. Voir les [sources](./references.md).
:::

**À valider :** recettes, touches, réserves illimitées, cuisson autonome, conservation de la progression de découpe, durées, génération des commandes, refus de livraison et barème.

## Commandes clients et validation

Chaque commande indique une recette, les ingrédients attendus et son temps restant.

Plusieurs commandes peuvent être actives simultanément, dans une limite fixée.

Une livraison valide correspond exactement à une commande active et non expirée.

Si plusieurs commandes identiques sont actives, satisfaire celle qui expire en premier.

Une commande livrée disparaît ; une commande expirée est comptée comme ratée.

Proposition : une livraison invalide est refusée, l’assiette reste portée et le combo est remis à zéro.

Une assiette conforme sans commande correspondante est également refusée.

## Progression et difficulté

Le code de la règle `v1` initialise actuellement la partie à **180 secondes**. La durée définitive reste à valider ; la modifier exige de synchroniser le jeu et l’API, et de versionner les règles pour garder des scores comparables. La répartition en trois phases et la limite de trois commandes actives ci-dessous restent proposées. Les règles doivent être identiques pour les joueurs d’un même niveau et d’une même version.


| Phase | Recettes disponibles | Délai par commande |
| --- | --- | --- |
| 0 à 60 secondes | Tomate préparée et viande grillée | 50 secondes |
| 60 à 120 secondes | Ajout de l’assiette mixte | 45 secondes |
| 120 à 180 secondes | Les trois recettes | 40 secondes |


Proposition : deux commandes au départ ; ajout d’une commande toutes les 15 secondes si un emplacement est libre.

Une commande créée conserve son délai initial même si la phase change.

Paramètres initiaux proposés : découpe 3 s ; cuisson 8 s ; viande brûlée 6 s après la fin de cuisson.

Ces valeurs servent au premier prototype et devront être ajustées après des essais.

Pour comparer les scores, utiliser une même séquence de commandes pour une même version du classement.

## Score et combos proposés


| Événement | Effet |
| --- | --- |
| Livraison valide | 100 points de base + bonus de rapidité de 0 à 50 points, puis application du multiplicateur. |
| Bonus de rapidité | 50 × temps restant ÷ délai initial de la commande ; résultat arrondi à l’entier inférieur. |
| Combo | Livraisons valides consécutives : 1re ×1 ; 2e ×2 ; 3e et suivantes ×3. |
| Commande expirée | −50 points et remise à zéro de la série de livraisons. |
| Livraison refusée | 0 point et remise à zéro de la série. |
| Objet jeté ou viande brûlée | Aucune pénalité directe ; le temps perdu pénalise la performance. |


Le score ne descend pas sous zéro. Exemple : une deuxième livraison consécutive avec 20 s restantes sur 40 s rapporte (100 + 25) × 2 = 250 points. Le meilleur combo affiché est le multiplicateur maximal atteint.

## Fin de partie

À zéro seconde, arrêter les déplacements, interactions, transformations et nouvelles commandes.

Figer le score ; les commandes encore actives sont comptées comme non terminées, sans pénalité supplémentaire proposée.

Afficher les commandes livrées, expirées, non terminées et les livraisons refusées séparément.

Enregistrer une seule fois le résultat, puis afficher le meilleur score personnel et le rang disponible.

Afficher un état d’enregistrement et permettre une nouvelle tentative en cas d’échec réseau.

Proposer Rejouer, Classement et Accueil. Une partie abandonnée ne produit pas de score classé.
