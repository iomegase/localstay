# Plan — Spec 055 : Facilibus et « Se déplacer »

Exécution inline en TDD.

1. Domaine `src/features/transport/` : types, geo (Haversine), zip GTFS minimal,
   adaptateur Pysae (fetch serveur, timeouts, validation Zod), cache mémoire TTL
   + mutualisation, règles Facilibus (stations, départs 24 h, temps réel, véhicules).
2. Routes `src/app/api/transport/facilibus/{stops,nearby,departures,vehicles}`.
3. Données : modèle `CityTransportCard` + migration ; `GuideLodging.locationPrecise`
   et `transportCards` ; route admin `transport-cards` + dialogue admin.
4. UI : `FacilibusNextDeparturesCard` (Séjour), `GuideTransportView`,
   `GuideFacilibusView`, polling client.
5. Démo : ligne + cartes statiques, page Facilibus réelle à la demande.
6. Vérifications : tests, tsc, lint, build, rendu 375 px, traçabilité.
