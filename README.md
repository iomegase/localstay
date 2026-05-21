# StayLocal — Application Touristique Locale

> Guide numérique intelligent pour voyageurs et hébergeurs.

## Stack

| Couche | Technologie |
|---|---|
| Frontend | Next.js 14 App Router + TypeScript |
| UI | Tailwind CSS + Shadcn/ui |
| Base de données | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| ORM | Prisma |
| IA | Google Gemini API |
| Cartographie | Mapbox GL JS |
| Paiements | Stripe + Stripe Connect |
| Déploiement | Vercel |
| Notifications | Resend |
| Temps réel | Supabase Realtime (WebSockets) |

## Méthode de développement

Ce projet suit le **Spec Driven Development (SDD)**.

> Aucune ligne de code dans `src/` sans une spec `approved` dans `specs/features/`.

Lire dans l'ordre :
1. [`AGENTS.md`](./AGENTS.md) — règles pour Claude Code
2. [`specs/README.md`](./specs/README.md) — comment écrire et valider une spec
3. [`docs/guides/spec-workflow.md`](./docs/guides/spec-workflow.md) — workflow complet
4. [`specs/glossary.md`](./specs/glossary.md) — vocabulaire partagé
5. [`docs/DAT/architecture.md`](./docs/DAT/architecture.md) — décisions d'architecture

## Roadmap MVP

| MVP | Périmètre | Statut |
|---|---|---|
| MVP 1 | Guide touristique local (public, sans auth) | 🔵 En cours de spec |
| MVP 2 | Dashboard hébergeur + personnalisation | ⬜ Non démarré |
| MVP 3 | Interface commerçants | ⬜ Non démarré |
| MVP 4 | Réservations + paiements | ⬜ Non démarré |

## Lancer le projet

```bash
# Variables d'environnement
cp .env.example .env.local

# Installation
npm install

# Base de données
npx prisma generate
npx prisma db push

# Développement
npm run dev
```

## Structure du projet

```
staylocal/
├── AGENTS.md                  → Instructions pour Claude Code
├── specs/                     → Source of truth — specs des features
├── src/                       → Code généré à partir des specs
├── tests/                     → Tests générés à partir des critères d'acceptation
└── docs/                      → Architecture, ADR, guides, traçabilité
```
