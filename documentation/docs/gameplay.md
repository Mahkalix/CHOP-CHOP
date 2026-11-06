---
title: Cuisine et gameplay
---

:::info Document de cadrage
Contenu issu du cahier des charges du 2 octobre 2026. Les propositions restent à valider ; les comportements attendus ne constituent pas une preuve d’implémentation. Voir les [sources](./references.md).
:::

**À valider :** recettes, touches, réserves illimitées, cuisson autonome, conservation de la progression de découpe, durées, génération des commandes, refus de livraison et barème.

## Cuisine et postes de travail

Les murs, meubles et postes bloquent le déplacement. Le joueur interagit avec le poste proche situé devant lui. Les collisions simples font partie du périmètre ; leur comportement sera vérifié dans le prototype.


| Élément | Fonction et règle |
| --- | --- |
| Caisses d’ingrédients | Récupérer une tomate ou une viande brute avec les mains libres. Réserve illimitée proposée. |
| Plan de travail | Déposer et reprendre un objet. Un emplacement contient un seul objet. |
| Planche à découper | Déposer une tomate brute ; découper en restant devant le poste ; afficher une barre de progression. |
| Poste de cuisson | Déposer une viande crue ; elle devient cuite puis brûlée si elle reste trop longtemps. Cuisson autonome proposée. |
| Zone d’assiettes | Prendre une assiette vide avec les mains libres. Réserve illimitée proposée. |
| Zone de livraison | Servir une assiette ; vérifier automatiquement la recette et la commande correspondante. |
| Poubelle | Supprimer l’objet porté. Pour une assiette garnie, supprimer son contenu et l’assiette dans cette version simplifiée. |


## Ingrédients et états


| Ingrédient | États | Transformation et utilisation |
| --- | --- | --- |
| Tomate | Brute → découpée | La découpe est obligatoire avant l’assemblage d’une recette. |
| Viande | Crue → cuite → brûlée | Seule la viande cuite est utilisable dans les recettes proposées. L’état brûlé est irréversible. |


Chaque ingrédient conserve son état lorsqu’il est porté ou posé.

Un ingrédient brûlé doit être jeté ; aucune réparation ni retour à l’état cru.

Une assiette est un contenant : vide, en préparation ou conforme à une recette.

Les objets déjà présents ne sont pas remplacés automatiquement sur un poste occupé.

## Recettes proposées à valider


| Recette | Composition exacte dans une assiette |
| --- | --- |
| Tomate préparée | 1 tomate découpée |
| Viande grillée | 1 viande cuite |
| Assiette mixte | 1 tomate découpée + 1 viande cuite |


Ces trois recettes limitent les ingrédients à ceux déjà cités. Aucun pain, salade ou autre ingrédient n’est ajouté au périmètre. L’ordre d’assemblage est libre ; les ingrédients supplémentaires ou dans un mauvais état rendent le plat invalide.

## Actions du personnage

Se déplacer dans la cuisine sans traverser les obstacles.

Prendre un ingrédient, une assiette ou un objet posé, avec les mains libres.

Poser l’objet porté sur un poste compatible et libre.

Découper une tomate sur une planche en maintenant une touche et en restant devant.

Lancer une cuisson en déposant la viande, puis récupérer la viande cuite avant qu’elle brûle.

Ajouter un ingrédient prêt dans une assiette posée sur un plan de travail.

Transporter une assiette garnie jusqu’à la livraison.

Jeter un objet ou une assiette inutilisable à la poubelle.

Découpe : quitter le poste ou relâcher la touche suspend la progression ; la progression acquise est conservée, selon la règle proposée. Le joueur doit revenir devant le poste pour terminer.

Cuisson : le joueur peut s’éloigner une fois la viande déposée, selon la proposition retenue pour le cadrage. La cuisson continue et une alerte visuelle signale la viande prête puis le risque de brûlure.

## Touches proposées


| Touche | Action |
| --- | --- |
| Flèches ou Z Q S D | Déplacer le personnage |
| E | Prendre, poser, assembler ou livrer selon le poste ciblé |
| E maintenue | Découper si les mains sont libres devant une planche contenant une tomate brute |


L’action dépend du poste et de l’objet porté ; un repère visuel identifie le poste ciblé.

Une action impossible laisse l’état du jeu inchangé et affiche un bref retour visuel.

Une assiette posée reçoit uniquement des ingrédients prêts compatibles avec les recettes.

Aucune extraction individuelle des ingrédients d’une assiette dans la première version.
