# Saint-Nicolas Concierge Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer la page conciergerie Saint-Nicolas en landing locale de conversion et connecter le formulaire propriétaire à l'API existante.

**Architecture:** La route serveur charge au plus trois profils logements publiés et les transmet à un composant éditorial spécialisé. Le formulaire reste un petit composant client et poste vers l'API `ContactMessage`, enrichie d'un honeypot validé côté serveur. Les avis restent une donnée structurée vide et ne produisent aucun rendu ni JSON-LD.

**Tech Stack:** Next.js App Router, React, TypeScript strict, Tailwind, Prisma, Zod, Jest/Testing Library.

---

### Task 1: Landing locale spécialisée

**Files:**
- Create: `src/features/local-seo/components/SaintNicolasConciergeLanding.tsx`
- Create: `src/features/local-seo/content/guest-reviews.ts`
- Modify: `src/app/(public)/conciergerie/[city-slug]/page.tsx`
- Modify: `src/features/local-seo/lib/structured-data.ts`
- Test: `tests/integration/local-seo.AC-06.saint-nicolas-conversion.test.tsx`

- [ ] Écrire le test de contenu, données réelles, liens, avis absents et JSON-LD factuel.
- [ ] Exécuter ce test et constater l'échec attendu.
- [ ] Implémenter le composant serveur mobile-first et le branchement conditionnel de la route.
- [ ] Exécuter le test jusqu'au vert.

### Task 2: Formulaire propriétaire réel

**Files:**
- Create: `src/features/contact-messages/components/OwnerLeadForm.tsx`
- Modify: `src/app/(public)/confier-mon-logement/page.tsx`
- Modify: `src/features/contact-messages/schemas.ts`
- Modify: `src/app/api/public/contact-messages/route.ts`
- Test: `tests/integration/public-marketing.AC-04-03.owner-lead-form.test.tsx`
- Test: `tests/contract/contact-messages.public-api.test.ts`

- [ ] Écrire les tests du submit HTTP, des états accessibles et du honeypot.
- [ ] Exécuter les tests et constater les échecs attendus.
- [ ] Implémenter le formulaire et le rejet silencieux du honeypot sans dépendance.
- [ ] Exécuter les tests jusqu'au vert.

### Task 3: Traçabilité et vérification

**Files:**
- Modify: `docs/traceability-matrix.md`

- [ ] Relier AC-06-01 à AC-06-04 aux sources et tests.
- [ ] Exécuter les tests ciblés, lint et build.
- [ ] Lancer le serveur et vérifier la landing et le formulaire en mobile et desktop.
