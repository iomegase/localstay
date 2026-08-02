# Design — Informations pratiques privées

La route `/sejour/logement/informations-pratiques` rend le composant serveur
privé partagé avec `initialView="practical"`. La branche `practical` existante
de `GuideLodgingViews` constitue le contrat visuel : aucune nouvelle interface
n'est créée. La destination `practical` du route map devient canonique et le
retour continue de cibler `/sejour/logement`.
