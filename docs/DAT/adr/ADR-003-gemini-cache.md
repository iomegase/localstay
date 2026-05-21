# ADR-003 — Stratégie de cache Gemini hybride

## Statut

`accepted`

---

## Contexte

Chaque appel Gemini API a un coût en tokens et en latence. Les données de certaines catégories (pharmacies de garde, événements) changent fréquemment ; d'autres (randonnées, administrations) sont stables sur des mois. Une stratégie de cache unique ne convient pas.

---

## Décision

Mise en place d'un **cache hybride** : résultats Gemini stockés en base de données par City + Category, avec un TTL configurable par catégorie dans la table `CacheTtlConfig`. En cas d'expiration, les données périmées sont servies pendant que le nouveau fetch se termine en arrière-plan (stale-while-revalidate).

---

## Options considérées

### Option A — Cache hybride avec TTL par catégorie (retenu)
- ✅ TTL adapté à la volatilité de chaque catégorie
- ✅ Stale-while-revalidate = pas de temps d'attente pour le Tourist
- ✅ Configurable par l'admin sans déploiement
- ❌ Complexité du lock anti-double-fetch

### Option B — Cache uniforme (24h pour toutes catégories)
- ✅ Simple à implémenter
- ❌ Trop court pour les données stables (coût inutile)
- ❌ Trop long pour les données volatiles (pharmacies de garde)

### Option C — Pas de cache, fetch à chaque requête
- ✅ Données toujours fraîches
- ❌ Coût Gemini prohibitif à l'échelle
- ❌ Latence inacceptable pour l'UX

---

## Justification

Le pattern stale-while-revalidate est éprouvé (utilisé par Next.js, Vercel, Cloudflare). La table `CacheTtlConfig` permet à l'admin d'ajuster les TTL sans toucher au code. Le lock `is_fetching` prévient les appels Gemini en rafale.

---

## Conséquences

- Table `GeminiCache` et `CacheTtlConfig` à créer dans le schéma Prisma
- Implémenter le lock optimiste (`is_fetching`)
- Logger toutes les erreurs Gemini avec la réponse brute pour debug
- Respecter les règles de cache Google Places API si les données en proviennent (max 30 jours pour les coordonnées lat/lng)

---

## Date

2026-05-20

## Auteur

Product Owner
