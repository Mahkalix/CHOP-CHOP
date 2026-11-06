# Consignes pour les assistants IA sur CHOP-CHOP

Lire `CONTEXT.md` à la racine du dépôt avant de modifier du code, puis la tâche et les fichiers concernés. Ce contexte distingue décisions confirmées, code existant et propositions anciennes. Ne pas inventer de règle de jeu pour combler un blanc. Demander une décision métier lorsque le comportement attendu n'est pas déterminé.

Préserver le travail local d'autrui. Garder les changements ciblés, lisibles et vérifiables. Respecter les responsabilités front, jeu, API et `packages/shared` décrites dans `CONTEXT.md`. Réutiliser les contrats partagés et suivre les migrations Drizzle existantes. Vérifier les parcours concernés avec les commandes du dépôt et indiquer ce qui a réellement été testé.

Lire aussi `documentation/docs/conventions.md` pour les pratiques publiées par l'équipe. La proposition de nommage des branches dans `CONTEXT.md` reste à valider. Avant un commit ou un push, suivre les instructions explicites de Sabrina pour la tâche en cours. Les migrations de la base partagée sont appliquées par une seule personne coordonnée avec l'équipe. Garder les secrets hors du dépôt.
