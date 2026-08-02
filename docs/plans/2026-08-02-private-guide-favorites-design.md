# Design — Coups de cœur privés MyStay

## Décision

La route canonique `/sejour/coups-de-coeur` rend le même `GuideApp` que la home
privée avec `initialView="favorites"`. Elle réutilise ainsi sans duplication le
header, le menu, les filtres, les cartes bento, les fiches POI, la carte et la
navigation basse déjà validés dans la démonstration.

## Données et sécurité

Un composant serveur privé commun résout le cookie séjour, charge
`getPrivateGuideData(lodgingId)` et construit les routes et le menu. La home et
la page enfant partagent ce composant. Aucune donnée de démonstration et aucune
route publique ne sont utilisées.

## Compatibilité

Les accès « Explorer », cœur et menu ciblent la nouvelle route. L'ancienne URL
`/nos-recommandations` redirige vers elle pour réparer les liens existants. Le
proxy reconnaît tout le sous-arbre `/sejour/*` comme application privée afin de
ne pas superposer l'ancien layout.
