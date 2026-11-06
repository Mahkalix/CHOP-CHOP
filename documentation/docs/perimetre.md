---
title: Périmètre et écrans
---

:::info Document de cadrage
Le périmètre confirmé par l’équipe est de trois niveaux avec un classement par niveau. La priorité est une boucle jouable de bout en bout sur le niveau 1. Les documents de cadrage initiaux restent disponibles dans les [sources](./references.md).
:::

## Périmètre de la première version

Jeu web sur ordinateur, jouable au clavier, en mode solo uniquement.

Une cuisine fixe, un personnage et une partie chronométrée.

Ingrédients avec états, découpe, cuisson, assemblage et livraison.

Un seul objet porté à la fois ; une assiette garnie compte comme un objet.

Classement par niveau, avec trois niveaux prévus. Leurs noms et leur déclinaison sont à aligner avec Figma.

React/Vite pour les écrans et l’interface ; Phaser pour la cuisine et les interactions. Fastify et Supabase pour le back et l’authentification.

## Écrans du jeu


| Écran | Contenu principal |
| --- | --- |
| Identification et accueil | Pseudo et identification persistante du joueur ; Jouer, Classement et Comment jouer. Fusion proposée pour réduire le nombre d’écrans. |
| Comment jouer | Objectif, touches, recettes, états des ingrédients et règles de découpe et cuisson. Un panneau suffit. |
| Partie | Cuisine, personnage, commandes clients, temps restant, score, combo et objet porté ; barres de transformation. |
| Fin de partie | Score final, commandes réussies et ratées, meilleur combo, meilleur score personnel et rang si disponible. |
| Sélection du niveau | Trois niveaux prévus ; noms et présentation à aligner avec Figma. |
| Classement par niveau | Rang, pseudo et score pour le niveau choisi ; position personnelle et pagination à confirmer à l’intégration. |


## Scope retenu et éléments exclus


| Retenu pour la première version | Exclu de la première version |
| --- | --- |
| Solo, une cuisine fixe, clavier | Multijoueur, coopération, manette et commandes tactiles |
| Tomate, viande et trois recettes proposées | Catalogue étendu, pain, sauces et personnalisation des recettes |
| Découpe, cuisson, assemblage, livraison | Casserole, soupe, lavage des assiettes et vaisselle sale |
| Collisions simples et interactions proches | Cuisine mobile, obstacles dynamiques, incendies et extincteur |
| Timer, score, combos et trois niveaux prévus | Campagne narrative, améliorations et inventaire |
| Classement par niveau et record personnel attendu | Classements par amis, boutique, succès et personnalisation du personnage |
