---
title: Cas d’utilisation
---

# Les 54 cas d’utilisation

Le joueur intervient dans neuf domaines. Le serveur soutient les comptes, les résultats et le classement. Les associations du PDF ne décrivent pas un ordre chronologique ; certains cas représentent des réactions automatiques. Les règles proposées restent à valider.

## Accès au jeu et navigation

| Identifiant | Cas d’utilisation |
| --- | --- |
| UC01 | S’inscrire |
| UC02 | Se connecter |
| UC03 | Consulter les instructions |
| UC04 | Démarrer une partie |
| UC05 | Quitter une partie |

Une partie abandonnée ne produit aucun score classé.

## Déplacement et interaction

| Identifiant | Cas d’utilisation |
| --- | --- |
| UC06 | Déplacer le personnage |
| UC07 | Rencontrer un obstacle |
| UC08 | Cibler un poste |
| UC09 | Interagir avec un poste |
| UC10 | Tenter une action impossible |

Collisions et actions impossibles : réactions du jeu aux actions du joueur.

## Objets et ingrédients

| Identifiant | Cas d’utilisation |
| --- | --- |
| UC11 | Prendre un ingrédient |
| UC12 | Porter un objet |
| UC13 | Poser un objet |
| UC14 | Reprendre un objet |
| UC15 | Jeter un objet |

Un seul objet porté ; une assiette garnie compte comme un objet.

## Découpe et cuisson

| Identifiant | Cas d’utilisation |
| --- | --- |
| UC16 | Préparer une découpe |
| UC17 | Découper une tomate |
| UC18 | Interrompre et reprendre la découpe |
| UC19 | Terminer la découpe |
| UC20 | Lancer une cuisson |
| UC21 | Effectuer une tâche pendant la cuisson |
| UC22 | Récupérer une viande cuite |
| UC23 | Laisser brûler une viande |

UC19 et UC23 : résultats automatiques. Cuisson autonome et reprise de découpe proposées.

## Assiettes et recettes

| Identifiant | Cas d’utilisation |
| --- | --- |
| UC24 | Prendre une assiette |
| UC25 | Poser une assiette |
| UC26 | Ajouter un ingrédient prêt |
| UC27 | Compléter une recette |
| UC28 | Refuser un ajout incompatible |
| UC29 | Transporter un plat |

UC28 : réaction automatique. Recettes proposées : tomate, viande, assiette mixte.

## Commandes clients et livraison

| Identifiant | Cas d’utilisation |
| --- | --- |
| UC30 | Consulter les commandes |
| UC31 | Recevoir une nouvelle commande |
| UC32 | Livrer un plat valide |
| UC33 | Livrer un plat incorrect |
| UC34 | Livrer un plat sans commande correspondante |
| UC35 | Laisser expirer une commande |

UC31 et UC35 : événements temporisés. Une livraison refusée conserve l’assiette portée.

## Score et difficulté

| Identifiant | Cas d’utilisation |
| --- | --- |
| UC36 | Gagner des points |
| UC37 | Enchaîner des livraisons |
| UC38 | Perdre son combo |
| UC39 | Subir une pénalité |
| UC40 | Suivre sa performance |
| UC41 | Passer à une difficulté supérieure |

Calculs et changements de phase automatiques ; barème et rythme proposés à valider.

## Fin de partie et enregistrement

| Identifiant | Cas d’utilisation |
| --- | --- |
| UC42 | Atteindre la fin du temps |
| UC43 | Consulter le bilan |
| UC44 | Enregistrer le résultat |
| UC45 | Gérer un échec d’enregistrement |
| UC46 | Mettre à jour son record |
| UC47 | Rejouer |
| UC48 | Revenir à l’accueil |

UC42, UC44 et UC46 sont automatiques. Contrôle serveur et identifiant de partie unique.

## Classement mondial

Le titre de cette section reprend les diagrammes initiaux. L’équipe a retenu un [classement par niveau](./classement.md) ; ces cas restent des exigences de cadrage à rapprocher de l’API disponible.

| Identifiant | Cas d’utilisation |
| --- | --- |
| UC49 | Consulter le classement |
| UC50 | Parcourir le classement |
| UC51 | Retrouver sa position |
| UC52 | Départager des scores égaux |
| UC53 | Gérer un classement indisponible |
| UC54 | Maintenir des scores comparables |

UC52 et UC54 : règles du service. Départage et versionnement des classements proposés.

Source : [diagrammes originaux](./references.md).
