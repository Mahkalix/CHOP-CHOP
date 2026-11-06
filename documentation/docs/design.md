---
title: Design et maquettes
---

## Référence Figma

[Ouvrir les maquettes CHOP-CHOP dans Figma](https://www.figma.com/design/5YyQNON3zicZCKuN1CkEH0/Chop-Chop?node-id=0-1).

Le fichier Figma est la référence visuelle du jeu. Les captures fournies montrent le bilan de service, la cuisine en cours de partie, le chargement « Mise en place… » et l’écran « Prêt ? ».

## Captures des maquettes

Cliquer sur une capture pour l’ouvrir en taille réelle.

<div className="design-gallery">
  <figure>
    <a href={require('@site/static/img/design/pret.png').default} aria-label="Ouvrir la capture de l’écran Prêt ? en taille réelle">
      <img src={require('@site/static/img/design/pret.png').default} alt="Écran Prêt ? avec le personnage, une durée de trois minutes et l’objectif de trois étoiles." loading="lazy" width="695" height="455" />
    </a>
    <figcaption><strong>Prêt ?</strong> — L’objectif avant le début du service.</figcaption>
  </figure>
  <figure>
    <a href={require('@site/static/img/design/chargement.png').default} aria-label="Ouvrir la capture du chargement en taille réelle">
      <img src={require('@site/static/img/design/chargement.png').default} alt="Écran Mise en place avec le personnage et la barre de chargement rouge brique." loading="lazy" width="671" height="466" />
    </a>
    <figcaption><strong>Mise en place…</strong> — Le chargement de la cuisine.</figcaption>
  </figure>
  <figure>
    <a href={require('@site/static/img/design/cuisine.png').default} aria-label="Ouvrir la capture de la cuisine en taille réelle">
      <img src={require('@site/static/img/design/cuisine.png').default} alt="Cuisine en pixel art avec le personnage, les commandes et les postes de préparation et de cuisson." loading="lazy" width="1400" height="664" />
    </a>
    <figcaption><strong>La cuisine</strong> — Les postes, les commandes et le score en partie.</figcaption>
  </figure>
  <figure>
    <a href={require('@site/static/img/design/bilan-service.png').default} aria-label="Ouvrir la capture du bilan en taille réelle">
      <img src={require('@site/static/img/design/bilan-service.png').default} alt="Bilan Service terminé avec un score de 420, une étoile et les statistiques du service." loading="lazy" width="1221" height="679" />
    </a>
    <figcaption><strong>Service terminé !</strong> — Le score, les étoiles et le récapitulatif.</figcaption>
  </figure>
</div>

## Logo du projet

![Bannière CHOP-CHOP et icône ronde avec un couperet sur fond rouge à motifs de flammes.](/img/design/identite-logo.png)

La bannière est utilisée sur l’accueil ; l’icône ronde apparaît dans la navigation et l’onglet du navigateur. Ces deux variantes proviennent de la planche originale fournie.

## Identité visuelle

L’interface associe un fond crème, des panneaux sable, des contours sombres et des accents rouge brique. Les titres et les chiffres utilisent une écriture pixel ; les textes et les commandes restent dans une police sans empattement pour faciliter la lecture. Les boutons et les panneaux ont des angles droits.

| Élément | Couleur de la documentation | Usage |
| --- | --- | --- |
| Crème | `#F7F1E5` | Fond des pages et boutons secondaires |
| Sable | `#E8DCC3` | Panneaux, tableaux et encadrés |
| Encre | `#171510` | Texte et contours |
| Rouge brique | `#9E3020` | Action principale, liens et repères |
| Beige soutenu | `#B6A588` | Séparateurs |

Ces couleurs sont des approximations visuelles des captures fournies, et non des valeurs exportées de Figma. La documentation utilise la police libre **Press Start 2P** pour retrouver l’esprit pixel des titres ; la police exacte du fichier Figma n’a pas été confirmée.

## Application à la documentation

L’accueil reprend la composition du bilan : une présentation accompagnée d’un panneau récapitulatif, des lignes de statistiques et des boutons rectangulaires. La navigation, les articles, les tableaux et les liens de pagination partagent cette identité. Le thème clair est affiché par défaut ; une variante sombre reste disponible dans la navigation.

Les titres utilisent une police pixel locale ; le corps du texte utilise Arial avec des alternatives système. La police est distribuée avec sa licence SIL Open Font License dans `static/fonts`. Les styles globaux se trouvent dans `src/css/custom.css`, et ceux de l’accueil dans `src/pages/index.module.css`.

## Lecture des écrans

- **Prêt ?** : présente l’objectif avant le début de la partie.
- **Mise en place…** : donne un retour visuel pendant le chargement de la cuisine.
- **Cuisine** : regroupe les commandes, le temps restant, le score, le combo et les postes de préparation.
- **Service terminé !** : présente le score, les étoiles, les commandes servies ou expirées et les actions pour continuer.

Les valeurs illustrées dans les maquettes (durée, score et paliers d’étoiles) sont des exemples de présentation. Leur présence ne remplace pas la validation des règles décrite dans les [critères du prototype](./validation.md).
