# ADR-007 — Scalabilité métier par bounded contexts

## Statut

`accepted`

---

## Contexte

StayLocal démarre comme guide touristique local, mais la trajectoire produit inclut des verticales plus riches : randonnées, réservation restaurant, dashboard merchant, facturation, commissions et supervision admin.

Le risque principal est de faire évoluer le modèle actuel vers un objet générique trop large qui porterait toutes les responsabilités : POI, restaurant, randonnée, réservation, paiement, statistiques et droits. Ce type de modèle accélère au début, mais rend ensuite les règles métier difficiles à tester, migrer et sécuriser.

Le projet applique aussi le Spec Driven Development : aucune verticale future ne doit être codée tant que sa spec n'est pas `approved`.

---

## Décision

StayLocal adopte une architecture métier par bounded contexts.

Le guide public conserve `PointOfInterest` comme noyau commun d'affichage. Les comportements spécialisés sont ajoutés dans des extensions métier dédiées :

- `trails` pour les randonnées, géométries, imports Overpass/IGN et données de parcours ;
- `reservations` pour les réservations, disponibilités, annulations et no-shows ;
- `merchant` pour les profils restaurateurs/commerçants et leurs dashboards ;
- `billing` pour abonnements, commissions, paiements et facturation ;
- `admin` pour modération, validation, audit et supervision.

Les extensions peuvent référencer un `PointOfInterest`, un `Lodging`, un `User` ou un autre agrégat existant, mais elles ne doivent pas transformer ces modèles en objets universels.

---

## Options considérées

### Option A — Modèle générique unique
- ✅ Très rapide pour ajouter les premières features
- ✅ Peu de tables au départ
- ❌ Mélange les règles métier hétérogènes
- ❌ Rend les validations et migrations risquées
- ❌ Rend les permissions plus difficiles à auditer

### Option B — Bounded contexts avec noyau public commun
- ✅ Préserve un guide public simple autour des POI
- ✅ Permet d'ajouter restaurants, randonnées et réservations sans casser le socle
- ✅ Facilite les tests par spec et par domaine
- ✅ Réduit le risque de fuite entre rôles owner, merchant et admin
- ❌ Demande plus de discipline dans les specs
- ❌ Ajoute plus de tables quand les verticales sont approuvées

### Option C — Microservices par verticale
- ✅ Isolation forte
- ✅ Scalabilité organisationnelle à long terme
- ❌ Trop complexe pour le MVP
- ❌ Coûts d'exploitation, observabilité et transactions distribuées prématurés

---

## Justification

L'option B est retenue parce qu'elle garde le MVP simple tout en préparant les futures verticales. Elle respecte le SDD : les documents `docs/guides/` alimentent les futures specs, mais ne déclenchent pas de code tant que les specs restent `draft`.

Le projet utilise PostgreSQL + Prisma, ce qui convient bien à cette stratégie : les extensions métier peuvent être ajoutées par relations explicites et contraintes transactionnelles, sans dupliquer les données publiques du guide.

---

## Conséquences

- Les futures specs doivent indiquer leur bounded context principal.
- `PointOfInterest` reste un modèle de découverte et d'affichage public, pas un modèle transactionnel universel.
- Une randonnée peut apparaître comme POI public, mais ses données de parcours vivent dans un modèle dédié.
- Un restaurant peut apparaître comme POI public, mais ses réservations, tables et services vivent dans des modèles dédiés.
- La facturation et les commissions ne doivent pas être mélangées aux dashboards métier.
- Les routes API futures doivent rester alignées avec leur contexte : public guide, dashboard owner, dashboard merchant, admin ou billing.
- Aucune implémentation de `trails`, `reservations`, `merchant`, `billing` ou `admin` n'est autorisée sans spec `approved`.

---

## Date

2026-05-24

## Auteur

Product Owner + Codex
