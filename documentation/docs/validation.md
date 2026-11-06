---
title: Validation du prototype
---

:::info Document de cadrage
Le cadrage du 2 octobre 2026 est complété par le contexte projet du 6 novembre 2026. Les choix actés ci-dessous sont rapportés par ce contexte ; les critères restent à vérifier dans le jeu intégré. Voir les [sources](./references.md).
:::

## Éléments fixés par le contexte

Cinq niveaux sont prévus, avec un classement par niveau. La priorité est un niveau jouable de bout en bout.

La règle `v1` initialise une durée de 180 secondes. L’API accepte une durée mesurée de 175 à 240 secondes ; changer la durée prévue exige une nouvelle version des règles.

L’inscription et la connexion utilisent Supabase Auth ; l’API Fastify vérifie le jeton. Elle est décrite sur `feat/8-API-and-BDD`, sans fusion dans `main` à la date du contexte.

## Points à valider ou à intégrer

Valider les trois recettes et les règles d’assemblage et de refus des livraisons.

Confirmer la cuisson autonome, la suspension de découpe et les durées proposées.

Valider la génération des commandes, le barème des combos et les plafonds provisoires de score de chaque niveau.

Choisir Phaser ou Canvas 2D maison et aligner les cinq niveaux avec Figma ; le front initial n’en listait que trois.

Vérifier l’intégration front/API : création du pseudo, démarrage, fin de partie, abandon et classement. Vérifier les refus `422` pour les durées et scores hors limites.

## Critères de validation du prototype

Le joueur ne traverse aucun obstacle et ne porte jamais deux objets séparés.

La découpe exige sa présence ; la viande suit les états cru, cuit et brûlé.

Seule une recette exacte associée à une commande active est acceptée.

Le timer arrête la partie et le score suit le barème choisi.

Un résultat enregistré apparaît une seule fois et le record personnel est préservé.
