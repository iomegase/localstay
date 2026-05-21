# ADR-002 — Choix de Supabase comme backend as a service

## Statut

`accepted`

---

## Contexte

Le projet nécessite une base PostgreSQL, une authentification robuste, du stockage de fichiers (photos, QR codes), du temps réel (MVP 4) et une solution scalable sans gestion d'infrastructure complexe.

---

## Décision

**Supabase** est retenu comme backend principal (PostgreSQL + Auth + Storage + Realtime), combiné avec **Prisma** comme ORM pour la type-safety et les migrations.

---

## Options considérées

### Option A — Supabase + Prisma
- ✅ Auth, Storage, Realtime inclus
- ✅ PostgreSQL managé, région EU disponible
- ✅ Prisma pour migrations type-safe
- ✅ Dashboard admin intégré
- ✅ Gratuit jusqu'à 500MB de données
- ❌ Double couche (Supabase client + Prisma) à coordonner

### Option B — Neon (PostgreSQL serverless) + Prisma seul
- ✅ PostgreSQL serverless, très scalable
- ✅ Prisma natif
- ❌ Auth, Storage, Realtime à ajouter séparément (NextAuth, S3, etc.)
- ❌ Plus de configuration initiale

### Option C — PlanetScale + Prisma
- ✅ MySQL scalable
- ❌ MySQL (pas PostgreSQL) — perte de fonctionnalités JSON, arrays
- ❌ Auth et Storage à ajouter séparément

---

## Justification

Supabase centralise Auth + Storage + Realtime + PostgreSQL en une seule plateforme, ce qui réduit la complexité de configuration pour le MVP. Prisma est ajouté pour les migrations et la type-safety. Le Realtime Supabase est utilisé en MVP 4 pour les notifications de réservation.

---

## Conséquences

- Utiliser le client Supabase pour Auth et Storage
- Utiliser Prisma pour toutes les queries de données
- Ne pas mélanger Supabase Data client et Prisma sur les mêmes tables
- RLS (Row Level Security) Supabase à configurer pour les routes publiques

---

## Date

2026-05-20

## Auteur

Product Owner
