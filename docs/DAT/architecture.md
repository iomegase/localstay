# Dossier d'Architecture Technique — StayLocal

> Ce document décrit les décisions d'architecture du projet.
> Toute décision majeure est tracée dans un ADR dans `docs/DAT/adr/`.

---

## 1. Vue d'ensemble

StayLocal est une application web mobile-first construite avec Next.js 16 App Router.
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
| Framework | Next.js 16 App Router | Server Components, Server Actions, routing file-based |
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

## 5.1 UI Contract

- Les fichiers dans `docs/DAT/diagrams/mockups/<NNN-feature>/` sont des contrats visuels pour les routes publiques quand ils existent.
- Toute modification UI publique doit d'abord lire le mockup de la spec concernée et conserver sa structure, ses espacements, sa typographie, ses tokens couleur et ses patterns d'interaction.
- `specs/features/001-city-guide/spec.md` définit `docs/DAT/diagrams/mockups/001-city-guide/home.html` comme référence contractuelle pour `/guide/[city-slug]`.
- Une divergence volontaire avec un mockup doit être documentée dans la spec concernée avant code, puis reportée dans `docs/traceability-matrix.md`.

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
| ADR-006 | Rôle de Gemini API : découverte + descriptif uniquement | accepted |
| ADR-007 | Scalabilité métier par bounded contexts | accepted |

Voir `docs/DAT/adr/` pour le détail de chaque décision.

---

## 8. Scalabilité métier cible

StayLocal doit pouvoir évoluer du guide touristique MVP vers plusieurs verticales métier sans transformer le code en modèle générique difficile à maintenir. Le socle reste le guide local autour de `City`, `Category`, `SubCategory`, `PointOfInterest`, `Lodging`, `Analytics` et des rôles applicatifs.

### Principes de découpage

- Chaque verticale future est isolée dans un bounded context : `trails`, `reservations`, `merchant`, `billing`, `admin`.
- `PointOfInterest` reste l'objet public commun pour afficher une adresse, une activité, un commerce ou une randonnée dans le guide.
- Les capacités métier avancées sont portées par des extensions dédiées, jamais par un modèle générique unique.
- Les modules futurs ne doivent pas ajouter de logique implicite dans les composants React publics. La logique métier reste dans `queries`, `services`, `actions` ou routes API.
- Les specs futures doivent réutiliser les routes et modèles existants seulement si leur contrat est explicitement compatible.

### Extensions prévues

| Domaine | Noyau public | Extension métier future | Déclencheur spec |
|---|---|---|---|
| Restaurants | `PointOfInterest` catégorie restaurant | `MerchantProfile`, `RestaurantProfile`, `Reservation`, `Table`, `ServiceSlot` | Specs merchant + réservation approuvées |
| Randonnées | `PointOfInterest` catégorie randonnée | `TrailDetail`, `TrailGeometry`, `TrailImportJob`, `TrailSource` | Spec trails/import approuvée |
| Hébergements | `Lodging` | QR codes, analytics owner, abonnement owner | Specs owner approuvées |
| Facturation | `Subscription`, `Payment` | Stripe Connect, commissions, factures | Spec billing approuvée |

### Règles pour les futures specs

- Ne pas créer de modèle abstrait de type `ReservableThing` tant qu'au moins deux verticales n'ont pas prouvé le même besoin métier.
- Ne pas dupliquer une fiche publique restaurant ou randonnée si une extension de `PointOfInterest` suffit.
- Toute donnée géographique mesurable vient de Mapbox, IGN, Overpass ou source spécialisée ; jamais de Gemini.
- Toute donnée transactionnelle future utilise PostgreSQL + Prisma avec contraintes, transactions et soft delete.
- Toute logique de commission, abonnement, annulation ou no-show doit être isolée dans une spec dédiée avant code.
- Les intégrations externes sont appelées côté serveur, avec cache ou jobs quand la donnée n'a pas besoin d'être temps réel.

---

## 9. Références métier

Ces documents contiennent les instructions d'implémentation détaillées pour les features avancées. Ils doivent être lus **avant** de rédiger les specs correspondantes.

| Document | Contenu | Alimente |
|---|---|---|
| `docs/guides/impl-reservation-restaurant.md` | Architecture réservation type TheFork, rôles, statuts, disponibilités, dashboard restaurateur, admin, super-admin | Specs MVP 4 : 019-reservation-flow, 020-dashboard-restaurant, 017-dashboard-superadmin |
| `docs/guides/impl-api-randonnees.md` | Sources Overpass + IGN, modèle Trail, workflow admin d'import, enrichissement Gemini | Spec MVP 2 : 008-trails-import |

Voir aussi `ADR-006` pour la décision sur la source de données randonnées.
