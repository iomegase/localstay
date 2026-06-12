# Specs — Guide de lecture

Ce dossier contient l'ensemble des spécifications du projet StayLocal.
Les specs sont la **source de vérité** du projet. Le code en découle, jamais l'inverse.

## Structure

```
specs/
├── glossary.md                → Vocabulaire partagé (termes métier et techniques)
├── _templates/
│   └── feature.spec.md        → Modèle à copier pour chaque nouvelle feature
└── features/
    ├── 001-city-guide/        → Affichage du guide par ville
    ├── 002-categories/        → Menu catégories avec masquage dynamique
    ├── 003-poi-list/          → Liste des POI avec filtres
    ├── 004-poi-detail/        → Fiche détaillée d'un POI
    ├── 005-map/               → Carte Mapbox interactive
    ├── 006-qr-code/           → Génération et scan du QR code
    ├── 007-gemini-fetch/      → Récupération et structuration des données Gemini
    └── 027-multilingual-content/ → Contenu multilingue évolutif
```

## Cycle de vie d'une spec

```
draft → review → approved → implemented → deprecated
```

| Statut | Signification | Code autorisé ? |
|---|---|---|
| `draft` | En cours de rédaction | ❌ |
| `review` | En attente de validation | ❌ |
| `approved` | Validée — prête pour implémentation | ✅ |
| `implemented` | Code et tests livrés | ✅ |
| `deprecated` | Remplacée ou abandonnée | ❌ |

## Règles

1. Toute nouvelle feature commence par une copie de `_templates/feature.spec.md`
2. Une spec doit être complète (aucune section `TODO`) avant de passer en `review`
3. Seul le product owner peut passer une spec de `review` à `approved`
4. Toute modification d'une spec `approved` remet la spec en `review`
5. Les `open_questions` doivent être résolues avant `approved`
