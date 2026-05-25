# ADR-008 — Google Places source primaire d'existence des POI généralistes

## Statut

`accepted`

---

## Contexte

Les acquisitions POI généralistes basées sur une découverte libre par Gemini produisent trop de candidats incertains : noms approximatifs, adresses erronées, POI hors zone ou fiches qui semblent plausibles mais ne correspondent pas à une source d'existence fiable.

Les randonnées suivent un pipeline séparé (`019-trails-acquisition`) et ne sont pas concernées par cette décision.

---

## Décision

Pour les POI généralistes, le pipeline d'acquisition devient :

1. **Google Places** propose les établissements et sert de source primaire d'existence.
2. **Mapbox** fournit ou confirme les coordonnées et le géocodage exploités par StayLocal.
3. **Site officiel** enrichit la fiche avec photos, contenu fiable et attribution quand une URL officielle existe.
4. **Gemini** rédige ou reformule une description réaliste uniquement à partir de données déjà vérifiées par Google Places, Mapbox, site officiel ou saisie admin.
5. **Super-admin** valide avant publication ; StayLocal publie une fiche éditorialisée.

Gemini ne doit plus découvrir librement des POI généralistes.

---

## Règles

- Google Places peut alimenter les candidats d'acquisition avec nom, adresse, téléphone, site web et `google_place_id`, selon les contraintes de conservation Google.
- Le `google_place_id` reste l'identifiant durable de réconciliation.
- Les données Google temporaires utiles à la review doivent rester séparées des champs publics et respecter leur TTL.
- Les champs publics finaux sont des données StayLocal validées, pas une copie brute d'une Google Card.
- Gemini ne peut générer que du texte éditorial à partir de données source fournies par le pipeline.
- Les coordonnées, distances et métriques géographiques restent hors Gemini.
- Les randonnées conservent le pipeline Overpass / IGN / site officiel / saisie admin.

---

## Conséquences

- La spec `018-poi-acquisition-pipeline` doit être amendée.
- Les lignes de traçabilité `018` liées à l'ancien mode Gemini-first doivent être rétrogradées tant que le code n'est pas aligné.
- `ADR-006` reste valable comme règle historique sur les limites de Gemini, mais sa partie "Gemini découvre les POI généralistes" est remplacée par cette ADR.

---

## Date

2026-05-25

## Auteur

Product Owner
