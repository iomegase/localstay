# ADR-006 — Rôle de Gemini API : découverte + descriptif uniquement

## Statut

`accepted`

> Note 2026-05-25 : pour les POI généralistes, la découverte libre par Gemini est remplacée par `ADR-008 — Google Places source primaire d'existence des POI généralistes`. Les randonnées restent traitées par leur pipeline spécialisé.

---

## Contexte

La question initiale portait sur la source de données pour les randonnées. Elle a été élargie à une décision de principe sur le rôle exact de Gemini dans l'architecture StayLocal.

---

## Décision

**Gemini API a exactement deux responsabilités, pas plus :**

1. **Découverte** — trouver et lister tous les POI existants (restaurants, randonnées, commerces, activités, etc.) pour une ville et une catégorie donnée
2. **Descriptif** — générer le texte de description de chaque POI (présentation, conseils, ambiance, spécificités)

**Gemini ne fait PAS :**
- Calcul de dénivelé ou de distance (→ IGN / Géoplateforme)
- Fourniture de tracés GPX (→ Overpass API / OSM)
- Calcul d'itinéraires (→ Mapbox Directions API)
- Données temps réel (horaires de garde, événements live) (→ sources dédiées)
- Géocodage (→ Mapbox Geocoding ou IGN)

---

## Options considérées

### Option A — Gemini fait tout (découverte + données géo + descriptif)
- ✅ Architecture simple
- ❌ Données géographiques imprécises (GPX, dénivelé, coordonnées exactes)
- ❌ Coût élevé pour des données qui existent en sources ouvertes
- ❌ Hallucinations sur les données factuelles mesurables

### Option B — Gemini = découverte + descriptif uniquement (retenu)
- ✅ Gemini fait ce qu'il fait bien : langage naturel, recherche, génération de texte
- ✅ Les données géographiques précises viennent de sources spécialisées (IGN, OSM)
- ✅ Séparation claire des responsabilités
- ✅ Coût Gemini maîtrisé
- ✅ Qualité des données géo fiable

### Option C — Pas de Gemini, tout manuel
- ❌ Trop lent pour couvrir plusieurs villes
- ❌ Pas scalable

---

## Justification

Gemini est un modèle de langage. Il excelle à :
- connaître les établissements locaux d'une ville
- générer des descriptions fluides et pertinentes

Il ne doit pas être sollicité pour des données mesurables et factuelles (distances, coordonnées GPS précises, dénivelé) qui existent dans des sources ouvertes fiables.

---

## Application par catégorie

| Catégorie | Gemini (découverte + descriptif) | Source complémentaire |
|---|---|---|
| Restaurants, cafés | ✅ liste + description | — |
| Commerces, boutiques | ✅ liste + description | — |
| Bien-être, spas | ✅ liste + description | — |
| Services, médecins | ✅ liste + description | — |
| Randonnées | ✅ liste + description | Overpass (tracé GPX) + IGN (dénivelé, altitude) |
| Événements, festivals | ✅ liste + description | Source locale si disponible |
| Pharmacies de garde | ✅ liste | Source officielle si disponible (cache court) |

---

## Conséquences

- La spec `007-gemini-fetch` est mise à jour pour refléter ce périmètre exact
- Pour les randonnées, un pipeline complémentaire Overpass + IGN enrichit les fiches après le Gemini Fetch (feature `008-trails-import`, MVP 2)
- Le prompt Gemini est rédigé pour demander explicitement : liste des POI + description — jamais des données géographiques calculées
- Claude Code ne doit jamais demander à Gemini des coordonnées GPS précises ou des métriques géographiques

---

## Date

2026-05-21

## Auteur

Product Owner
