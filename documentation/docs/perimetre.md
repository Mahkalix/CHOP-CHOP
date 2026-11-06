---
title: Périmètre et écrans
---

:::info Document de cadrage
Contenu issu du cahier des charges du 2 octobre 2026. Les propositions restent à valider ; les comportements attendus ne constituent pas une preuve d’implémentation. Voir les [sources](./references.md).
:::

## Périmètre de la première version

Jeu web sur ordinateur, jouable au clavier, en mode solo uniquement.

Une cuisine fixe, un personnage et une partie chronométrée.

Ingrédients avec états, découpe, cuisson, assemblage et livraison.

Un seul objet porté à la fois ; une assiette garnie compte comme un objet.

Classement mondial commun à tous les joueurs inscrits.

React pour les écrans et l’interface ; Phaser pour le gameplay 2D.

## Écrans du jeu


| Écran | Contenu principal |
| --- | --- |
| Identification et accueil | Pseudo et identification persistante du joueur ; Jouer, Classement et Comment jouer. Fusion proposée pour réduire le nombre d’écrans. |
| Comment jouer | Objectif, touches, recettes, états des ingrédients et règles de découpe et cuisson. Un panneau suffit. |
| Partie | Cuisine, personnage, commandes clients, temps restant, score, combo et objet porté ; barres de transformation. |
| Fin de partie | Score final, commandes réussies et ratées, meilleur combo, meilleur score personnel et rang si disponible. |
| Classement mondial | Rang, pseudo, meilleur score ; position du joueur et navigation dans le classement. |


## Scope retenu et éléments exclus


| Retenu pour la première version | Exclu de la première version |
| --- | --- |
| Solo, une cuisine fixe, clavier | Multijoueur, coopération, manette et commandes tactiles |
| Tomate, viande et trois recettes proposées | Catalogue étendu, pain, sauces et personnalisation des recettes |
| Découpe, cuisson, assemblage, livraison | Casserole, soupe, lavage des assiettes et vaisselle sale |
| Collisions simples et interactions proches | Cuisine mobile, obstacles dynamiques, incendies et extincteur |
| Timer, score, combos et difficulté progressive | Campagne, niveaux multiples, améliorations et inventaire |
| Classement mondial et record personnel | Classements par amis, boutique, succès et personnalisation du personnage |
