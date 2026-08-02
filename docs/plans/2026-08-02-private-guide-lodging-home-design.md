# Design — Accueil du livret logement privé

La route `/sejour/logement` rend `PrivateGuidePage` avec
`initialView="lodging"`. La vue visuelle demeure `GuideLodgingViews`, déjà
partagée avec la démonstration et conforme à la capture validée.

Les routes `lodging` de la home, de la navigation basse et du menu deviennent
canoniques. Les actions enfants conservent provisoirement leurs destinations
historiques afin de préserver toutes les fonctionnalités pendant leur migration
séquentielle.
