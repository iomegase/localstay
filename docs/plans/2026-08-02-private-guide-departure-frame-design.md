# Design — Départ et frame smartphone privée

La route `/sejour/logement/depart` rend `PrivateGuidePage` avec
`initialView="departure"`. La vue utilise la checklist historique extraite dans
un composant partagé afin que l'ancien guide et le nouveau `GuideApp` gardent la
même interaction locale.

Le shell `PrivateGuidePage` devient une scène centrée sur fond slate clair. Sa
frame est limitée à 430 × 820 px, reste bornée à 24 px du viewport, possède une
bordure blanche de 5 px, des coins de 44 px et une ombre profonde. Le GuideApp
conserve son propre scroll interne et aucun scale CSS n'est utilisé.
