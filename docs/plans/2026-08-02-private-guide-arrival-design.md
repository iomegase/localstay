# Design — Accéder au logement

`/sejour/logement/arrivee` rend `PrivateGuidePage` avec
`initialView="arrival"`. La page réutilise intégralement la branche arrivée de
`GuideLodgingViews` et remplace uniquement la destination privée `arrival` par
la nouvelle route canonique. Le retour utilise la route parent
`/sejour/logement`.
