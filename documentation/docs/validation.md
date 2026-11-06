---
title: Validation du prototype
---

:::info Document de cadrage
Les décisions récentes de l’équipe actualisent le cadrage initial. Les critères restent à vérifier dans le jeu intégré. Voir les [sources](./references.md) et le fichier `CONTEXT.md` à la racine du dépôt.
:::

## Décisions et état actuel

Trois niveaux sont prévus, avec un classement par niveau. La priorité est un niveau jouable de bout en bout.

Le code de la règle `v1` initialise actuellement une durée technique de 180 secondes ; la durée de jeu définitive reste à valider. L’API accepte une durée mesurée de 175 à 240 secondes ; changer la durée prévue exige une nouvelle version des règles.

L’inscription et la connexion doivent passer par Supabase Auth côté front ; ce parcours reste à intégrer. L’API Fastify vérifie déjà le jeton et est présente dans le `main` local vérifié le 6 novembre 2026.

## Points à valider ou à intégrer

Valider les trois recettes et les règles d’assemblage et de refus des livraisons.

Confirmer la cuisson autonome, la suspension de découpe et les durées proposées.

Valider la génération des commandes, le barème des combos et les plafonds provisoires de score de chaque niveau.

Intégrer Phaser au front React/Vite et aligner les trois niveaux décidés avec Figma, les données et les contrats partagés ; le code contient encore des limites et données pour cinq niveaux.

Vérifier l’intégration front/API : création du pseudo, démarrage, fin de partie, abandon et classement. Vérifier les refus `422` pour les durées et scores hors limites.

## Critères de validation du prototype

Le joueur ne traverse aucun obstacle et ne porte jamais deux objets séparés.

La découpe exige sa présence ; la viande suit les états cru, cuit et brûlé.

Seule une recette exacte associée à une commande active est acceptée.

Le timer arrête la partie et le score suit le barème choisi.

Une partie terminée est enregistrée une seule fois ; le choix entre toutes les parties et un record personnel reste à décider.
