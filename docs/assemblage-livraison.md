# Assemblage et livraison — #18

Cette étape dépend des états d’ingrédients de #17 (PR #46). Aucun fichier back ou partagé n’est modifié.

## Assemblage

Poser une assiette vide sur Assembler ou un plan de travail. Avec E, ajouter un ingrédient préparé porté à cette assiette, puis la reprendre avec les mains libres. Les dessins et le nom du plat suivent l’objet pendant le transport.

`recipes.ts` centralise les trois compositions déjà proposées dans les règles : tomate découpée, viande cuite, ou les deux. L’ordre d’ajout est libre. Le prototype refuse un ingrédient brut, brûlé, en double ou incompatible et le laisse dans la main du chef. Il ne remplace jamais le contenu existant. Jeter une assiette supprime aussi ses ingrédients. Les identités des ingrédients sont conservées dans `Plate.ingredients` pour contrôler les transferts.

Ces compositions et la politique de refus restent à confirmer avec l’équipe (#14/#18) ; elles ne sont pas présentées comme des décisions finales.

## Livraison et contrat avec #19

`attemptDelivery(inventory, orders, now)` accepte une assiette uniquement si sa composition est exacte et si une commande de la même recette est active : `createdAt <= now < expiresAt`. Les temps utilisent l’horloge de simulation de la cuisine, en millisecondes. Parmi plusieurs commandes compatibles, la première à expirer est servie. Un refus conserve l’inventaire et les commandes.

La scène reçoit une liste d’`ActiveOrder` sur l’événement `kitchen-orders`. Elle émet `kitchen-ready` après son initialisation, avec `{ now }`, afin que le contrôleur de commandes de #19 puisse lui fournir son état initial. Une livraison réussie retire une seule commande et l’assiette portée, puis émet `kitchen-delivery` : `{ order, plate, deliveredAt }`. L’événement contient les identités et les états du plat pour le calcul du score ; il n’ajoute lui-même aucun point et n’envoie rien à l’API.

**Raccordement encore nécessaire :** #19 doit générer et dater les commandes, alimenter `kitchen-orders`, traiter `kitchen-delivery` et gérer le chronomètre. En son absence, le HUD indique honnêtement « Aucune commande active » et Servir conserve l’assiette. La validation d’une livraison réussie est couverte par les tests du modèle, pas encore par le jeu intégré en navigateur. Cette étape ne suffit donc pas à clôturer #18 seule.

## Vérification

`pnpm --filter @chopchop/front test` vérifie les trois recettes, l’ordre libre, les refus non destructifs, les transferts et leurs identités, le délai exact d’expiration, la sélection d’une commande, l’absence de double livraison et la chaîne complète de préparation/assemblage/livraison du modèle.

Dans le navigateur, préparer une tomate, la poser sur un plan de travail, poser une assiette sur Assembler puis y ajouter la tomate. Reprendre l’assiette garnie et essayer Servir sans commande : l’assiette reste portée. Redimensionner la fenêtre et vérifier que les panneaux Objet porté et Commandes actives restent visibles sans barre de défilement.
