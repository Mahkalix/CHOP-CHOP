---
title: Architecture et décisions techniques
---

## Répartition des responsabilités

| Composant | Responsabilité prévue |
| --- | --- |
| React | Accès, accueil, instructions, interface, bilan et classement |
| Phaser | Gameplay 2D, personnage, cuisine, collisions et interactions |
| Serveur | Comptes persistants, contrôle des résultats, enregistrement unique et classement |

Le serveur doit contrôler les résultats reçus et empêcher plusieurs enregistrements du même identifiant de partie, y compris après une nouvelle tentative réseau. L’identifiant de compte est distinct du pseudo affiché. Un résultat inférieur au record ne remplace pas celui-ci.

## Choix encore ouverts

L’identité des écrans est décrite dans [Design et maquettes](./design.md), avec un lien vers le fichier Figma de référence.

Le framework serveur, la base de données, les routes API, l’hébergement, le mode d’authentification et la méthode de validation des parties restent à définir. Aucun contrat API n’est fixé par les sources.

Le cahier des charges demande de conserver identifiant du joueur, pseudo, identifiant unique de partie, score, statistiques, date et version des règles. Le versionnement doit permettre de séparer les classements lorsque les scores deviennent incomparables.

Voir le [classement](./classement.md) et les [points à valider](./validation.md) avant de figer ces choix.
