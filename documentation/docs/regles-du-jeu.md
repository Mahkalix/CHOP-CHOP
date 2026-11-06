---
title: Règles du jeu
---

## Le but du jeu

Préparer et livrer un maximum de commandes avant la fin du chronomètre. CHOP-CHOP se joue en solo, sur ordinateur, au clavier. Les livraisons réussies augmentent le score ; les livraisons consécutives augmentent le combo.

:::info Règles du prototype
Cette page résume le cadrage du jeu, actualisé par le contexte du 6 novembre 2026. La durée de la règle `v1` est fixée à 180 secondes ; les touches, recettes et barèmes ci-dessous restent proposés pour les essais du prototype. Voir les [critères de validation](./validation.md).
:::

## Comment jouer

1. Lire une commande : identifier la recette demandée et le temps restant.
2. Prendre les ingrédients aux postes de réserve avec les mains libres.
3. Découper les tomates sur la planche et cuire la viande sur le poste de cuisson.
4. Assembler les ingrédients prêts dans une assiette posée sur un plan de travail.
5. Porter l’assiette à la zone de livraison avant l’expiration de la commande.
6. Enchaîner les livraisons pour augmenter le combo et améliorer son score.

## Commandes au clavier proposées

| Touche | Action |
| --- | --- |
| Flèches ou Z Q S D | Se déplacer |
| E | Prendre, poser, assembler ou livrer selon le poste ciblé |
| E maintenue | Découper une tomate sur une planche avec les mains libres |

Se placer près d’un poste et face à lui pour interagir. Un poste occupé ne remplace pas automatiquement son contenu.

## Les recettes proposées

| Plat | Contenu exact de l’assiette |
| --- | --- |
| Tomate préparée | Une tomate découpée |
| Viande grillée | Une viande cuite |
| Assiette mixte | Une tomate découpée et une viande cuite |

Une tomate brute ou une viande crue ou brûlée ne convient pas. Une viande qui reste trop longtemps sur le feu brûle et doit être jetée. Un ingrédient supplémentaire rend également la recette invalide.

## Temps, score et combos

La règle `v1` fixe la durée à **3 minutes**, selon le contexte du 6 novembre 2026. Cinq niveaux sont prévus, avec un classement par niveau. Chaque commande possède son propre délai : servir un plat exige une recette exacte et une commande encore active. Le barème ci-dessous reste proposé pour le gameplay.

- Une livraison valide rapporte 100 points de base et jusqu’à 50 points de rapidité, avant application du multiplicateur.
- Les livraisons consécutives font progresser le combo : ×1, ×2, puis ×3 au maximum.
- Une commande expirée retire 50 points et remet la série à zéro.
- Une livraison refusée ne rapporte aucun point et remet la série à zéro.
- Le score ne descend jamais sous zéro.

Les détails et exemples de calcul figurent dans [Commandes et score](./score.md).

## Fin du service

Quand le chronomètre atteint zéro, la partie s’arrête. Le bilan présente le score et les statistiques du service. Le joueur peut rejouer, consulter le classement ou retourner à l’accueil. Une partie abandonnée ne produit pas de score classé.

Pour approfondir : [Cuisine et gameplay](./gameplay.md), [Classement par niveau](./classement.md) et [Design et maquettes](./design.md).
