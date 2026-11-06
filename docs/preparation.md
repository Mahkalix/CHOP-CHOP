# Préparation et cuisson — prototype #17

Le jeu reste entièrement côté front pour ces gestes : aucun appel API ni changement de BDD. Les objets ont une identité stable et un état explicite utilisé par les étapes suivantes : tomate `whole`/`chopped`, viande `raw`/`cooked`/`burned`, assiette vide. Les types sont locaux à `front/src/features/game/interactions.ts` ; aucune modification de `packages/shared`.

## Parcours à essayer

1. Dans Jouer, prendre une tomate avec E et la poser sur Découper.
2. Les mains libres, rester à proximité et maintenir C. Le couteau bouge, une barre avance au-dessus du poste et dans le HUD. Relâcher C ou s’éloigner suspend la découpe ; reprendre termine la même tomate, sans créer un nouvel objet.
3. Reprendre la tomate découpée avec E : son nom et son dessin restent distincts d’une tomate entière, y compris après un dépôt sur un autre plan de travail.
4. Prendre de la viande crue et la poser dans la poêle. La cuisson avance sans maintenir de touche et même en s’éloignant. Le dessin et le HUD distinguent cru, cuit et brûlé.
5. Retirer la viande cuite arrête sa chauffe. La remettre sur Cuire reprend le temps de chauffe conservé. La viande brûlée reste transportable vers la poubelle.

## Valeurs et décisions ouvertes

`preparationTimings`, dans `front/src/features/game/preparation.ts`, centralise les durées déjà affichées sur la page de règles : découpe **3 s**, cuisson **8 s**, puis brûlure après **6 s supplémentaires**. Ce sont les paramètres du prototype, pas une décision métier finale. La durée définitive et la conservation de la progression lors d’une interruption ou d’un retrait restent à confirmer par l’équipe avant validation finale de #17.

La progression utilise le temps de simulation Phaser. Un onglet suspendu ne garantit donc pas une cuisson en temps réel hors écran ; le futur timer de partie et la pause doivent être coordonnés dans #19 avant raccordement aux sessions API. L’assemblage et la livraison restent dans #18 ; aucune livraison ni aucun score n’est simulé ici.

Le HUD React reçoit au plus une actualisation de progression toutes les 200 ms, plus les changements de poste et d’état. Les animations et les barres de la scène restent gérées par Phaser. La caméra plein écran, le bond et le retour au menu sont conservés.

## Vérification

- `pnpm --filter @chopchop/front test` : transferts et identités d’objets, bonnes conditions de préparation, interruption/reprise, limites de cuisson/brûlure, retrait du feu, temps de simulation invalide et équivalence entre plusieurs petites images et une grande.
- `pnpm typecheck` et `pnpm build:front`.
- Dans le navigateur : jouer le parcours ci-dessus au clavier, revenir au menu puis rouvrir la cuisine ; vérifier qu’un seul canvas et un inventaire neuf apparaissent. Redimensionner en portrait et paysage, et vérifier que la barre de progression et les actions restent dans la fenêtre sans barre de défilement.
