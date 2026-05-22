# AGENTS.md — Instructions for Claude Code

> This file is the **source of truth** for any AI agent (Claude Code or other)
> working on this codebase. Read it entirely before taking any action.

---

## 1. Core Principle — Spec Driven Development

**No code without a spec. No exception.**

Every file created under `src/` must be traceable to a validated spec located
in `specs/features/`. If a spec does not exist or is not marked `status: approved`,
do not write the corresponding code — ask for clarification instead.

---

## 2. Workflow — The Only Allowed Sequence

```
1. READ   → specs/features/<feature>/spec.md        (understand the feature)
2. READ   → specs/glossary.md                       (shared vocabulary)
3. READ   → docs/DAT/architecture.md                (technical constraints)
4. READ   → docs/DAT/adr/                           (understand past decisions)
5. WRITE  → src/                                    (generate code from spec only)
6. WRITE  → tests/                                  (generate tests from acceptance criteria)
7. UPDATE → docs/traceability-matrix.md             (link spec → code → tests)
```

Never skip a step. Never reorder the steps.

---

## 3. Spec File Structure — How to Read a Spec

Each spec lives at `specs/features/<NNN-feature-name>/spec.md`.

A valid spec contains the following sections — all required:

| Section | Purpose |
|---|---|
| `metadata` | id, title, status, mvp, owner |
| `context` | Why this feature exists |
| `glossary_refs` | Terms from glossary.md used in this spec |
| `user_stories` | Who / What / Why — with acceptance criteria |
| `business_rules` | Explicit constraints the code must enforce |
| `data_model` | Prisma schema fragment for this feature |
| `api_contract` | OpenAPI 3.1 fragment (routes, params, responses, errors) |
| `ui_behaviour` | Component behaviour, states, interactions |
| `acceptance_criteria` | Testable conditions — maps 1:1 to tests |
| `out_of_scope` | What is explicitly NOT part of this feature |
| `open_questions` | Unresolved items — do NOT implement until resolved |

**If a section is missing or marked `TODO`, stop and ask.**

---

## 4. Execution Mode

**Default : Option 1 — Subagent-Driven.**
Auto-accept all technical tasks without waiting for confirmation between steps.

**Exception — stop and ask the Product Owner when:**
- A business rule is ambiguous or missing from the spec
- A user story has conflicting interpretations
- An `open_question` is still `pending` in the spec
- A decision impacts monetization, legal, or user data
- The spec says something technically impossible or contradictory

When stopping, output exactly:

```
BUSINESS DECISION REQUIRED
Spec: <spec-id>
Question: <one clear question>
Options: <option A> / <option B>
Waiting for Product Owner input.
```

---

## 5. Status Rules — When Code Generation Is Allowed

| Spec Status | Code Allowed? |
|---|---|
| `draft` | ❌ No — spec is being written |
| `review` | ❌ No — spec is awaiting validation |
| `approved` | ✅ Yes — generate code |
| `deprecated` | ❌ No — do not implement |

Check `metadata.status` before writing a single line of code.

---

## 5. Code Generation Rules

### 5.1 General
- Language: **TypeScript** (strict mode, no `any`)
- Framework: **Next.js 14 App Router** — use Server Components by default, Client Components only when spec requires interactivity
- Styling: **Tailwind CSS** utility classes only — no inline styles, no CSS modules unless spec explicitly requires it
- UI components: **Shadcn/ui** for all dashboard interfaces (hébergeur, commerçant, super-admin)
- Icons: **Lucide React** preferred, **Font Awesome** as fallback

### 5.2 File placement
```
src/
├── app/                        → Next.js App Router pages and layouts
│   ├── (public)/               → Tourist-facing routes (no auth required)
│   ├── (dashboard)/            → Authenticated routes (hébergeur, commerçant)
│   └── (admin)/                → Super-admin routes
├── features/
│   └── <feature-name>/
│       ├── components/         → Feature-specific React components
│       ├── hooks/              → Feature-specific hooks
│       ├── actions/            → Next.js Server Actions
│       ├── queries/            → Supabase / Prisma queries
│       └── types.ts            → Feature-specific TypeScript types
└── shared/
    ├── components/             → Reusable UI components
    ├── lib/                    → Supabase client, Gemini client, Stripe client, Mapbox config
    └── types/                  → Global TypeScript types and Prisma-generated types
```

### 5.3 API routes
- All API routes live under `src/app/api/`
- Every route must implement exactly the contract defined in the spec's `api_contract` section
- Return types must match the OpenAPI schema — no additional fields, no missing fields
- Always validate input with **Zod** before processing
- Error responses must follow this structure:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

### 5.4 Database
- ORM: **Prisma** with **Supabase** (PostgreSQL)
- Never write raw SQL unless the spec explicitly requires it
- Every Prisma model must include: `id`, `created_at`, `updated_at`
- Use `uuid` for all primary keys
- Never delete data — use soft delete (`deleted_at` timestamp)

### 5.5 Authentication
- Auth: **Supabase Auth**
- Use middleware for route protection — never check auth inside components
- Roles: `tourist` | `owner` | `merchant` | `admin` — defined in `shared/types/roles.ts`

### 5.6 External services
| Service | Client location | Env variable |
|---|---|---|
| Supabase | `src/shared/lib/supabase.ts` | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Gemini API | `src/shared/lib/gemini.ts` | `GEMINI_API_KEY` |
| Mapbox | `src/shared/lib/mapbox.ts` | `NEXT_PUBLIC_MAPBOX_TOKEN` |
| Stripe | `src/shared/lib/stripe.ts` | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| Resend | `src/shared/lib/resend.ts` | `RESEND_API_KEY` |

Never hardcode credentials. Never commit `.env` files.

---

## 6. Test Generation Rules

Every acceptance criterion in the spec maps to at least one test.

| Criterion type | Test type | Location |
|---|---|---|
| Business rule | Unit test | `tests/unit/` |
| API contract | Contract test | `tests/contract/` |
| Data integrity | Integration test | `tests/integration/` |
| User flow | E2E test | `tests/e2e/` |

Test naming convention: `<feature>.<criterion-id>.<what-is-tested>.test.ts`

Example: `city-guide.AC-01.returns-categories-for-valid-city.test.ts`

---

## 7. Traceability Rules

After generating code and tests, always update `docs/traceability-matrix.md`:

```markdown
| Spec ID | Feature | User Story | Acceptance Criterion | Source File | Test File | Status |
```

This matrix is the audit trail. It must never be out of date.

---

## 8. What Claude Code Must NEVER Do

- ❌ Generate code for a feature with status `draft` or `review`
- ❌ Ask Gemini for GPS coordinates, GPX tracks, elevation gain, calculated distances, or any geographic metric — these come from Mapbox / IGN / Overpass only
- ❌ Ask Gemini for real-time data (on-call pharmacies, live events) — use dedicated short-TTL sources
- ❌ Use Gemini for anything other than: POI discovery (listing) + description generation (see ADR-006)
- ❌ Add logic not described in the spec (no "nice to have" additions)
- ❌ Modify the database schema without a spec change
- ❌ Use `any` in TypeScript
- ❌ Skip input validation (always use Zod)
- ❌ Write business logic inside React components (use Server Actions or queries)
- ❌ Commit secrets or credentials
- ❌ Delete database records (always soft delete)
- ❌ Implement items listed in `out_of_scope` or `open_questions`

---

## 9. When in Doubt

If anything in the spec is ambiguous, contradictory, or missing:

1. **Stop immediately**
2. **Do not interpret or assume**
3. **Output a question** in this format:

```
SPEC QUESTION — <feature-id>
Section: <section name>
Issue: <what is unclear>
Options considered: <option A> / <option B>
Waiting for: owner decision
```

4. **Wait for an explicit answer** before proceeding

---

## 10. Global Business Rules — Apply Everywhere

These rules apply across all features and must never be violated:

**POI Geographic Zones (BR from spec 008 + 003)**
- **Primary zone (≤ 15 km)** from city center → displayed in main POI list
- **Nearby zone (15–30 km)** from city center → displayed in separate "Aux alentours" section
- **Out of range (> 30 km)** → `geocode_status = rejected`, never displayed
- The "Aux alentours" section is only shown if it contains at least 1 POI
- Sorting and filters apply independently in each zone

**Gemini Scope (ADR-006)**
- Gemini = POI discovery + description generation ONLY
- Never ask Gemini for GPS coordinates, distances, elevation, GPX tracks

**Vercel Crons (vercel.json)**
- All cron jobs are centralized in `vercel.json` at project root
- Never define crons in individual spec infrastructure sections without adding to `vercel.json`

**Soft Delete**
- Never physically delete any database record
- Always use `deleted_at` timestamp

---

## 11. Project Context

**Application:** Guide touristique local intelligent
**Name (TBD):** StayLocal / StayPilot / StayMap (final name pending INPI check)
**MVP scope:** MVP 1 — City Guide (tourist-facing, no auth required)
**Stack:** Next.js 14 · TypeScript · Supabase · Prisma · Shadcn/ui · Tailwind · Mapbox GL JS · Gemini API · Stripe · Resend
**Deployment:** Vercel
**Primary device:** Mobile (375px+) — mobile-first, then desktop

See `docs/DAT/architecture.md` for full architecture decisions.
See `specs/glossary.md` for all domain terms.
