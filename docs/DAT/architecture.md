# Dossier d'Architecture Technique — StayLocal

> Ce document décrit les décisions d'architecture du projet.
> Toute décision majeure est tracée dans un ADR dans `docs/DAT/adr/`.

---

## 1. Vue d'ensemble

StayLocal est une application web mobile-first construite avec Next.js 14 App Router.
Elle se compose de trois espaces distincts :

```
┌─────────────────────────────────────────────────────────┐
│  (public)         Guide touristique — Tourist            │
│  /guide/[city]    Sans authentification                  │
├─────────────────────────────────────────────────────────┤
│  (dashboard)      Dashboard — Owner / Merchant           │
│  /dashboard       Authentification Supabase Auth         │
├─────────────────────────────────────────────────────────┤
│  (admin)          Super-Admin                            │
│  /admin           Rôle admin requis                      │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Stack technique

| Couche | Choix | Justification |
|---|---|---|
| Framework | Next.js 14 App Router | Server Components, Server Actions, routing file-based |
| Language | TypeScript strict | Sécurité de typage, maintenabilité |
| Styling | Tailwind CSS | Utility-first, mobile-first, pas de CSS custom |
| UI Components | Shadcn/ui | Composants accessibles, personnalisables, basés Radix |
| Base de données | Supabase (PostgreSQL) | Auth intégrée, Realtime, Storage, hosted |
| ORM | Prisma | Type-safe, migrations, schéma versioning |
| IA | Google Gemini API | Qualité de structuration des données locales |
| Cartographie | Mapbox GL JS | 50k loads/mois gratuits, qualité rendu mobile |
| Paiements | Stripe + Stripe Connect | Gestion acomptes, abonnements, marketplace |
| Déploiement | Vercel | Intégration native Next.js, edge functions |
| Email | Resend | API simple, templates React Email |
| Temps réel | Supabase Realtime | WebSockets natifs Supabase, pas de serveur custom |
| Icônes | Lucide React + Font Awesome | Cohérence visuelle, arbre optimisé |
| Validation | Zod | Validation runtime + inférence TypeScript |

---

## 3. Architecture des données

### Flux principal MVP 1

```
Tourist scanne QR → /guide/[city-slug]
  → GET /api/cities/[slug]           → Supabase: City
  → GET /api/cities/[slug]/categories → Supabase: Category + count POI
  → (si cache expiré) Gemini Fetch   → Gemini API → Supabase: POI
  → GET /api/.../pois                → Supabase: PointOfInterest[]
  → GET /api/.../pois/[slug]         → Supabase: PointOfInterest + HikingDetail
```

### Cache strategy

```
Request → Check GeminiCache (expires_at > now)
  ├── Cache VALID   → Return POI from DB
  └── Cache EXPIRED → Trigger Gemini Fetch (background)
                      Return stale data while fetching
                      On success: update DB + reset TTL
                      On failure: log error, keep stale data
```

---

## 4. Sécurité

- **Authentification** : Supabase Auth (JWT)
- **Autorisation** : middleware Next.js vérifie le rôle avant chaque route protégée
- **Variables d'environnement** : séparation stricte `NEXT_PUBLIC_*` (client) vs secrets (serveur)
- **Token Mapbox** : restreint aux domaines autorisés via dashboard Mapbox
- **Validation** : Zod sur toutes les entrées API
- **Soft delete** : aucune suppression physique en base

---

## 5. Performance

- **Server Components** par défaut — hydration minimale côté client
- **Mapbox lazy load** — chargé uniquement quand visible (Intersection Observer)
- **Mapbox Static Images** pour les mini-cartes — pas de Map Load complet
- **Image optimization** — Next.js Image component avec formats WebP/AVIF
- **Cache Gemini** — évite les appels API répétés, TTL par catégorie

---

## 6. Déploiement

- **Production** : Vercel (auto-deploy sur `main`)
- **Preview** : Vercel preview deployments sur chaque PR
- **Base de données** : Supabase (hosted, région Europe West)
- **Variables d'environnement** : gérées dans Vercel Dashboard

---

## 7. Décisions d'architecture (ADR)

| ADR | Décision | Statut |
|---|---|---|
| ADR-001 | Choix de Mapbox vs Leaflet+OSM | accepted |
| ADR-002 | Choix de Supabase vs Neon+Prisma seul | accepted |
| ADR-003 | Stratégie de cache Gemini hybride | accepted |
| ADR-004 | Soft delete systématique | accepted |
| ADR-005 | Stripe Connect pour les commissions | accepted |

Voir `docs/DAT/adr/` pour le détail de chaque décision.

---

## 8. Références métier

Ces documents contiennent les instructions d'implémentation détaillées pour les features avancées. Ils doivent être lus **avant** de rédiger les specs correspondantes.

| Document | Contenu | Alimente |
|---|---|---|
| `docs/guides/impl-reservation-restaurant.md` | Architecture réservation type TheFork, rôles, statuts, disponibilités, dashboard restaurateur, admin, super-admin | Specs MVP 4 : 019-reservation-flow, 020-dashboard-restaurant, 017-dashboard-superadmin |
| `docs/guides/impl-api-randonnees.md` | Sources Overpass + IGN, modèle Trail, workflow admin d'import, enrichissement Gemini | Spec MVP 2 : 008-trails-import |

Voir aussi `ADR-006` pour la décision sur la source de données randonnées.
