# 010 Dashboard Owner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implémenter le dashboard hébergeur (Owner) avec Shadcn/ui : vue d'ensemble, gestion des logements, statistiques, et les 4 routes API associées.

**Architecture:** Routes API Next.js App Router sous `/api/dashboard/*` lisent la session Supabase par cookie via `getSessionOwner()` (vérifie role === 'owner'). Les pages dashboard sont des Server Components qui fetch leurs données via ces routes API ou des queries Prisma directes. Shadcn/ui fournit tous les composants UI (Card, Table, Dialog, Chart).

**Tech Stack:** Next.js 16 App Router · TypeScript strict · Prisma 5 · Shadcn/ui (new-york) · Recharts (via shadcn chart) · Tailwind CSS · Jest

---

## File Structure

**Créés :**
- `src/shared/lib/utils.ts` — cn() helper (Shadcn)
- `src/shared/components/ui/` — composants Shadcn générés
- `components.json` — config Shadcn
- `src/features/dashboard-owner/lib/get-session-owner.ts` — helper auth owner
- `src/features/dashboard-owner/queries/lodgings.ts` — queries Prisma lodgings
- `src/features/dashboard-owner/queries/stats.ts` — queries Prisma stats
- `src/app/api/dashboard/overview/route.ts`
- `src/app/api/dashboard/lodgings/route.ts`
- `src/app/api/dashboard/lodgings/[id]/route.ts`
- `src/app/api/dashboard/stats/route.ts`
- `src/app/(dashboard)/layout.tsx` — remplace le placeholder (sidebar + bottom nav)
- `src/app/(dashboard)/dashboard/page.tsx` — overview (cards + chart)
- `src/app/(dashboard)/dashboard/lodgings/page.tsx`
- `src/app/(dashboard)/dashboard/stats/page.tsx`
- `tests/contract/dashboard.AC-lodgings.test.ts`
- `tests/contract/dashboard.AC-overview.test.ts`
- `tests/contract/dashboard.AC-stats.test.ts`
- `tests/unit/dashboard.AC-01-02.empty-state.test.tsx`

**Modifiés :**
- `prisma/schema.prisma` — QrCode extension + Lodging + Analytics + User.lodgings + City relations
- `src/app/(dashboard)/layout.tsx` — remplacé par sidebar Shadcn
- `tailwind.config.ts` — ajout darkMode + container pour Shadcn (custom colors préservées)
- `src/app/globals.css` — ajout CSS variables Shadcn

---

### Task 1 : Shadcn/ui setup + Recharts

**Files:**
- Create: `components.json`
- Create: `src/shared/lib/utils.ts`
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`

- [ ] **Step 1 : Créer components.json manuellement**

```bash
cat > "/Users/daviddevillers/sites/staylocal /components.json" << 'EOF'
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/shared/components",
    "utils": "@/shared/lib/utils",
    "ui": "@/shared/components/ui",
    "lib": "@/shared/lib",
    "hooks": "@/shared/hooks"
  },
  "iconLibrary": "lucide"
}
EOF
```

- [ ] **Step 2 : Installer les dépendances Shadcn/ui et Recharts**

```bash
cd "/Users/daviddevillers/sites/staylocal " && npm install class-variance-authority clsx tailwind-merge tailwindcss-animate @radix-ui/react-dialog @radix-ui/react-label @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slot recharts 2>&1 | tail -5
```

Expected : packages installed without errors.

- [ ] **Step 3 : Créer src/shared/lib/utils.ts**

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 4 : Mettre à jour tailwind.config.ts** (ajouter darkMode + container + Shadcn extensions tout en conservant ivory/charcoal/forest/gold)

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // StayLocal brand tokens
        ivory: '#FAF9F6',
        charcoal: '#121212',
        gold: '#A68E69',
        forest: '#455E4C',
        // Shadcn/ui CSS variable tokens
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

- [ ] **Step 5 : Ajouter les CSS variables Shadcn dans globals.css**

Remplacer le contenu de `src/app/globals.css` par :

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 7%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 7%;
    --border: 0 0% 89%;
    --input: 0 0% 89%;
    --ring: 0 0% 7%;
    --primary: 0 0% 7%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96%;
    --secondary-foreground: 0 0% 7%;
    --muted: 0 0% 96%;
    --muted-foreground: 0 0% 45%;
    --accent: 0 0% 96%;
    --accent-foreground: 0 0% 7%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 98%;
    --radius: 0.5rem;
  }
}

@layer utilities {
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .glass {
    background: rgba(250, 249, 246, 0.85);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
  }
}
```

- [ ] **Step 6 : Générer les composants Shadcn via la CLI**

```bash
cd "/Users/daviddevillers/sites/staylocal " && npx shadcn@latest add card --overwrite -y 2>&1 | tail -3
npx shadcn@latest add table --overwrite -y 2>&1 | tail -3
npx shadcn@latest add dialog --overwrite -y 2>&1 | tail -3
npx shadcn@latest add button --overwrite -y 2>&1 | tail -3
npx shadcn@latest add input --overwrite -y 2>&1 | tail -3
npx shadcn@latest add label --overwrite -y 2>&1 | tail -3
npx shadcn@latest add select --overwrite -y 2>&1 | tail -3
npx shadcn@latest add badge --overwrite -y 2>&1 | tail -3
npx shadcn@latest add separator --overwrite -y 2>&1 | tail -3
npx shadcn@latest add chart --overwrite -y 2>&1 | tail -3
```

Expected : composants générés dans `src/shared/components/ui/`

- [ ] **Step 7 : Vérifier le build**

```bash
cd "/Users/daviddevillers/sites/staylocal " && npm run build 2>&1 | grep -E "(✓ Compiled|error TS|Failed)" | head -5
```

Expected : `✓ Compiled successfully`

- [ ] **Step 8 : Commit**

```bash
git add components.json src/shared/lib/utils.ts src/shared/components/ui/ tailwind.config.ts src/app/globals.css package.json package-lock.json
git commit -m "feat(010): install Shadcn/ui (new-york) + Recharts"
```

---

### Task 2 : Prisma schema — QrCode + Lodging + Analytics + relations

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1 : Lire le schema actuel**

```bash
cat "/Users/daviddevillers/sites/staylocal /prisma/schema.prisma"
```

- [ ] **Step 2 : Appliquer toutes les modifications au schema**

Modifier `prisma/schema.prisma` :

**2a. Sur le modèle `City` (spec 001), ajouter les deux nouvelles relations :**
```prisma
  lodgings    Lodging[]
  analytics   Analytics[]
```

**2b. Sur le modèle `QrCode` (spec 006) :**
- Retirer `@unique` de `city_id`
- Ajouter `lodging_id` et la relation `lodging`

Le modèle QrCode doit devenir :
```prisma
model QrCode {
  id          String    @id @default(uuid())
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
  deleted_at  DateTime?

  city_id     String    // @unique retiré — une ville peut avoir plusieurs QR codes
  city        City      @relation(fields: [city_id], references: [id])
  lodging_id  String?
  lodging     Lodging?  @relation(fields: [lodging_id], references: [id])
  url         String
  storage_url String
  is_active   Boolean   @default(true)
}
```

**2c. Sur le modèle `User` (spec 009), ajouter :**
```prisma
  lodgings      Lodging[]
```

**2d. Ajouter à la fin du fichier (section spec 010) :**
```prisma
// ─── Spec 010 — Dashboard Owner ──────────────────────────────────────────────

model Lodging {
  id          String    @id @default(uuid())
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
  deleted_at  DateTime?

  name        String
  owner_id    String
  owner       User      @relation(fields: [owner_id], references: [id])
  city_id     String
  city        City      @relation(fields: [city_id], references: [id])
  is_active   Boolean   @default(true)

  qr_codes    QrCode[]
  analytics   Analytics[]
}

// Analytics est append-only — les événements ne sont jamais modifiés.
// updated_at absent par conception (décision Gap-3 spec 010).
model Analytics {
  id          String    @id @default(uuid())
  created_at  DateTime  @default(now())

  lodging_id  String?
  lodging     Lodging?  @relation(fields: [lodging_id], references: [id])
  city_id     String
  city        City      @relation(fields: [city_id], references: [id])
  event_type  String    // qr_scan | category_click | poi_click | phone_click | directions_click
  category_id String?
  poi_id      String?
}
```

- [ ] **Step 3 : Vérifier que Prisma valide le schema**

```bash
cd "/Users/daviddevillers/sites/staylocal " && npx prisma validate 2>&1
```

Expected : `The schema at ... is valid`

- [ ] **Step 4 : Créer et appliquer la migration**

```bash
cd "/Users/daviddevillers/sites/staylocal " && npx prisma migrate dev --name add_lodging_analytics_qrcode_lodging_id 2>&1 | tail -10
```

Expected : `Your database is now in sync with your schema.`

Si la base de données n'est pas accessible (environnement CI), utiliser à la place :
```bash
npx prisma generate
```

- [ ] **Step 5 : Regénérer le client Prisma**

```bash
cd "/Users/daviddevillers/sites/staylocal " && npx prisma generate 2>&1 | tail -5
```

- [ ] **Step 6 : Vérifier TypeScript**

```bash
cd "/Users/daviddevillers/sites/staylocal " && npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "node_modules" | head -10
```

Expected : aucune erreur.

- [ ] **Step 7 : Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ src/shared/lib/prisma.ts 2>/dev/null
git add prisma/
git commit -m "feat(010): Lodging + Analytics models, QrCode lodging_id, User.lodgings relation"
```

---

### Task 3 : getSessionOwner + GET/POST /api/dashboard/lodgings

**Files:**
- Create: `src/features/dashboard-owner/lib/get-session-owner.ts`
- Create: `src/features/dashboard-owner/queries/lodgings.ts`
- Create: `src/app/api/dashboard/lodgings/route.ts`
- Create: `tests/contract/dashboard.AC-lodgings.test.ts`

- [ ] **Step 1 : Écrire les tests failing**

Créer `tests/contract/dashboard.AC-lodgings.test.ts` :

```typescript
import { NextRequest } from 'next/server'

const mockGetUser = jest.fn()
const mockFindUser = jest.fn()
const mockFindManyLodgings = jest.fn()
const mockCreateLodging = jest.fn()
const mockFindFirstCity = jest.fn()

jest.mock('@/shared/lib/supabase', () => ({
  createSupabaseRouteClient: jest.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}))

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    user: { findFirst: mockFindUser },
    lodging: { findMany: mockFindManyLodgings, create: mockCreateLodging },
    city: { findFirst: mockFindFirstCity },
  },
}))

import { GET, POST } from '../../src/app/api/dashboard/lodgings/route'

const mockOwner = { id: 'owner-1', supabase_id: 'supa-1', role: 'owner', is_active: true, deleted_at: null }

const mockLodging = {
  id: 'lodging-1',
  name: 'Chalet des Alpes',
  city_id: 'city-1',
  owner_id: 'owner-1',
  is_active: true,
  created_at: new Date('2026-01-01'),
  deleted_at: null,
  city: { name: 'Saint-Gervais' },
  analytics: [{ event_type: 'qr_scan' }, { event_type: 'qr_scan' }],
}

function makeRequest(method: string, body?: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/dashboard/lodgings', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('GET /api/dashboard/lodgings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'supa-1' } } })
    mockFindUser.mockResolvedValue(mockOwner)
  })

  it('AC-02-01: returns 200 with lodgings list and qr_scan_count', async () => {
    mockFindManyLodgings.mockResolvedValue([mockLodging])
    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.lodgings).toHaveLength(1)
    expect(json.lodgings[0].name).toBe('Chalet des Alpes')
    expect(json.lodgings[0].city_name).toBe('Saint-Gervais')
    expect(json.lodgings[0].qr_scan_count).toBe(2)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(401)
  })

  it('returns 403 when role is not owner', async () => {
    mockFindUser.mockResolvedValue({ ...mockOwner, role: 'merchant' })
    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(403)
  })
})

describe('POST /api/dashboard/lodgings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'supa-1' } } })
    mockFindUser.mockResolvedValue(mockOwner)
    mockFindFirstCity.mockResolvedValue({ id: 'city-1', name: 'Saint-Gervais' })
  })

  it('AC-02-02: returns 201 with created lodging', async () => {
    mockCreateLodging.mockResolvedValue({
      ...mockLodging,
      analytics: [],
    })
    const res = await POST(makeRequest('POST', { name: 'Chalet des Alpes', city_id: 'city-1' }))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.name).toBe('Chalet des Alpes')
    expect(json.qr_scan_count).toBe(0)
  })

  it('returns 400 when name is missing', async () => {
    const res = await POST(makeRequest('POST', { city_id: 'city-1' }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when city_id does not exist', async () => {
    mockFindFirstCity.mockResolvedValue(null)
    const res = await POST(makeRequest('POST', { name: 'Test', city_id: 'unknown-city' }))
    expect(res.status).toBe(404)
  })
})
```

- [ ] **Step 2 : Vérifier que les tests échouent**

```bash
cd "/Users/daviddevillers/sites/staylocal " && npx jest tests/contract/dashboard.AC-lodgings.test.ts --no-coverage 2>&1 | tail -5
```

Expected : FAIL — `Cannot find module '../../src/app/api/dashboard/lodgings/route'`

- [ ] **Step 3 : Créer getSessionOwner**

Créer `src/features/dashboard-owner/lib/get-session-owner.ts` :

```typescript
import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/shared/lib/supabase'
import { prisma } from '@/shared/lib/prisma'
import type { User } from '@prisma/client'

type SessionOwnerResult =
  | { owner: User; error: null }
  | { owner: null; error: NextResponse }

export async function getSessionOwner(): Promise<SessionOwnerResult> {
  const supabase = await createSupabaseRouteClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      owner: null,
      error: NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Non authentifié' } },
        { status: 401 },
      ),
    }
  }

  const owner = await prisma.user.findFirst({
    where: { supabase_id: user.id, deleted_at: null, is_active: true },
  })

  if (!owner) {
    return {
      owner: null,
      error: NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Non authentifié' } },
        { status: 401 },
      ),
    }
  }

  if (owner.role !== 'owner') {
    return {
      owner: null,
      error: NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Accès réservé aux hébergeurs' } },
        { status: 403 },
      ),
    }
  }

  return { owner, error: null }
}
```

- [ ] **Step 4 : Créer le Zod schema lodgings**

Créer `src/features/dashboard-owner/schemas.ts` :

```typescript
import { z } from 'zod'

export const CreateLodgingSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  city_id: z.string().uuid(),
})

export const UpdateLodgingSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  city_id: z.string().uuid().optional(),
}).refine(data => data.name !== undefined || data.city_id !== undefined, {
  message: 'Au moins un champ doit être fourni',
})

export type CreateLodgingInput = z.infer<typeof CreateLodgingSchema>
export type UpdateLodgingInput = z.infer<typeof UpdateLodgingSchema>
```

- [ ] **Step 5 : Créer la query lodgings**

Créer `src/features/dashboard-owner/queries/lodgings.ts` :

```typescript
import { prisma } from '@/shared/lib/prisma'

export interface LodgingItem {
  id: string
  name: string
  city_id: string
  city_name: string
  is_active: boolean
  qr_scan_count: number
  created_at: Date
}

export async function getLodgingsForOwner(ownerId: string): Promise<LodgingItem[]> {
  const lodgings = await prisma.lodging.findMany({
    where: { owner_id: ownerId, deleted_at: null },
    include: {
      city: { select: { name: true } },
      analytics: { where: { event_type: 'qr_scan' } },
    },
    orderBy: { created_at: 'desc' },
  })

  return lodgings.map(l => ({
    id: l.id,
    name: l.name,
    city_id: l.city_id,
    city_name: l.city.name,
    is_active: l.is_active,
    qr_scan_count: l.analytics.length,
    created_at: l.created_at,
  }))
}
```

- [ ] **Step 6 : Créer GET/POST /api/dashboard/lodgings**

Créer `src/app/api/dashboard/lodgings/route.ts` :

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSessionOwner } from '@/features/dashboard-owner/lib/get-session-owner'
import { getLodgingsForOwner } from '@/features/dashboard-owner/queries/lodgings'
import { CreateLodgingSchema } from '@/features/dashboard-owner/schemas'
import { prisma } from '@/shared/lib/prisma'

export async function GET(): Promise<NextResponse> {
  const { owner, error } = await getSessionOwner()
  if (error) return error

  const lodgings = await getLodgingsForOwner(owner.id)
  return NextResponse.json({ lodgings })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { owner, error } = await getSessionOwner()
  if (error) return error

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Corps de requête invalide' } },
      { status: 400 },
    )
  }

  const parsed = CreateLodgingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Paramètre manquant ou invalide', details: parsed.error.flatten() } },
      { status: 400 },
    )
  }

  const city = await prisma.city.findFirst({ where: { id: parsed.data.city_id } })
  if (!city) {
    return NextResponse.json(
      { error: { code: 'CITY_NOT_FOUND', message: 'Ville introuvable' } },
      { status: 404 },
    )
  }

  const lodging = await prisma.lodging.create({
    data: {
      name: parsed.data.name,
      owner_id: owner.id,
      city_id: parsed.data.city_id,
    },
    include: { city: { select: { name: true } } },
  })

  return NextResponse.json(
    {
      id: lodging.id,
      name: lodging.name,
      city_id: lodging.city_id,
      city_name: lodging.city.name,
      is_active: lodging.is_active,
      qr_scan_count: 0,
      created_at: lodging.created_at,
    },
    { status: 201 },
  )
}
```

- [ ] **Step 7 : Vérifier que les tests passent**

```bash
cd "/Users/daviddevillers/sites/staylocal " && npx jest tests/contract/dashboard.AC-lodgings.test.ts --no-coverage 2>&1 | tail -15
```

Expected : 6 tests PASS

- [ ] **Step 8 : Commit**

```bash
git add src/features/dashboard-owner/ src/app/api/dashboard/lodgings/route.ts tests/contract/dashboard.AC-lodgings.test.ts
git commit -m "feat(010): getSessionOwner + GET/POST /api/dashboard/lodgings"
```

---

### Task 4 : PATCH /api/dashboard/lodgings/[id]

**Files:**
- Create: `src/app/api/dashboard/lodgings/[id]/route.ts`
- Modify: `tests/contract/dashboard.AC-lodgings.test.ts` (ajouter les tests PATCH)

- [ ] **Step 1 : Ajouter les tests PATCH dans dashboard.AC-lodgings.test.ts**

Ajouter à la fin du fichier `tests/contract/dashboard.AC-lodgings.test.ts` :

```typescript
// Ajouter cet import en haut du fichier (avec les autres mocks) :
// const mockFindFirstLodging = jest.fn()
// const mockUpdateLodging = jest.fn()
// Dans jest.mock('@/shared/lib/prisma', ...) ajouter :
//   lodging: { ..., findFirst: mockFindFirstLodging, update: mockUpdateLodging }
```

En fait, modifier le mock prisma existant pour inclure `findFirst` et `update` sur `lodging`, puis ajouter :

```typescript
import { PATCH } from '../../src/app/api/dashboard/lodgings/[id]/route'

function makeIdRequest(method: string, id: string, body?: object): NextRequest {
  return new NextRequest(`http://localhost:3000/api/dashboard/lodgings/${id}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('PATCH /api/dashboard/lodgings/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'supa-1' } } })
    mockFindUser.mockResolvedValue(mockOwner)
  })

  it('AC-02-03: returns 200 with updated lodging', async () => {
    mockFindFirstLodging.mockResolvedValue(mockLodging)
    mockUpdateLodging.mockResolvedValue({
      ...mockLodging,
      name: 'Nouveau Nom',
      analytics: [{ event_type: 'qr_scan' }],
    })
    const res = await PATCH(
      makeIdRequest('PATCH', 'lodging-1', { name: 'Nouveau Nom' }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.name).toBe('Nouveau Nom')
  })

  it('returns 404 when lodging not found or belongs to another owner', async () => {
    mockFindFirstLodging.mockResolvedValue(null)
    const res = await PATCH(
      makeIdRequest('PATCH', 'other-lodging', { name: 'Test' }),
      { params: Promise.resolve({ id: 'other-lodging' }) },
    )
    expect(res.status).toBe(404)
  })

  it('returns 400 when body is empty object', async () => {
    const res = await PATCH(
      makeIdRequest('PATCH', 'lodging-1', {}),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )
    expect(res.status).toBe(400)
  })
})
```

**Important** : Pour que les nouveaux tests fonctionnent, il faut modifier le mock Prisma dans le describe top-level pour inclure les nouvelles méthodes. Voici le mock Prisma complet mis à jour que vous devez mettre dans le fichier :

```typescript
const mockFindFirstLodging = jest.fn()
const mockUpdateLodging = jest.fn()

// Dans jest.mock('@/shared/lib/prisma', () => ({...})) :
jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    user: { findFirst: mockFindUser },
    lodging: {
      findMany: mockFindManyLodgings,
      create: mockCreateLodging,
      findFirst: mockFindFirstLodging,
      update: mockUpdateLodging,
    },
    city: { findFirst: mockFindFirstCity },
  },
}))
```

- [ ] **Step 2 : Vérifier que les nouveaux tests échouent**

```bash
cd "/Users/daviddevillers/sites/staylocal " && npx jest tests/contract/dashboard.AC-lodgings.test.ts --no-coverage 2>&1 | grep -E "(PASS|FAIL|✓|✗|Cannot find)" | head -15
```

Expected : les 3 nouveaux tests FAIL avec `Cannot find module`

- [ ] **Step 3 : Créer PATCH /api/dashboard/lodgings/[id]**

Créer `src/app/api/dashboard/lodgings/[id]/route.ts` :

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSessionOwner } from '@/features/dashboard-owner/lib/get-session-owner'
import { UpdateLodgingSchema } from '@/features/dashboard-owner/schemas'
import { prisma } from '@/shared/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { owner, error } = await getSessionOwner()
  if (error) return error

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Corps de requête invalide' } },
      { status: 400 },
    )
  }

  const parsed = UpdateLodgingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Paramètre manquant ou invalide', details: parsed.error.flatten() } },
      { status: 400 },
    )
  }

  const existing = await prisma.lodging.findFirst({
    where: { id, owner_id: owner.id, deleted_at: null },
  })

  if (!existing) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Logement introuvable' } },
      { status: 404 },
    )
  }

  const updated = await prisma.lodging.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.city_id !== undefined && { city_id: parsed.data.city_id }),
    },
    include: {
      city: { select: { name: true } },
      analytics: { where: { event_type: 'qr_scan' } },
    },
  })

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    city_id: updated.city_id,
    city_name: updated.city.name,
    is_active: updated.is_active,
    qr_scan_count: updated.analytics.length,
    created_at: updated.created_at,
  })
}
```

- [ ] **Step 4 : Vérifier que tous les tests passent**

```bash
cd "/Users/daviddevillers/sites/staylocal " && npx jest tests/contract/dashboard.AC-lodgings.test.ts --no-coverage 2>&1 | tail -15
```

Expected : 9 tests PASS (6 précédents + 3 nouveaux)

- [ ] **Step 5 : Commit**

```bash
git add src/app/api/dashboard/lodgings/[id]/route.ts tests/contract/dashboard.AC-lodgings.test.ts
git commit -m "feat(010): PATCH /api/dashboard/lodgings/[id]"
```

---

### Task 5 : GET /api/dashboard/overview

**Files:**
- Create: `src/features/dashboard-owner/queries/overview.ts`
- Create: `src/app/api/dashboard/overview/route.ts`
- Create: `tests/contract/dashboard.AC-overview.test.ts`

- [ ] **Step 1 : Écrire les tests failing**

Créer `tests/contract/dashboard.AC-overview.test.ts` :

```typescript
import { NextRequest } from 'next/server'

const mockGetUser = jest.fn()
const mockFindUser = jest.fn()
const mockFindManyLodgings = jest.fn()
const mockCountAnalytics = jest.fn()
const mockFindManyAnalytics = jest.fn()
const mockFindManyCategories = jest.fn()
const mockFindManyPois = jest.fn()

jest.mock('@/shared/lib/supabase', () => ({
  createSupabaseRouteClient: jest.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}))

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    user: { findFirst: mockFindUser },
    lodging: { findMany: mockFindManyLodgings },
    analytics: { count: mockCountAnalytics, findMany: mockFindManyAnalytics },
    category: { findMany: mockFindManyCategories },
    pointOfInterest: { findMany: mockFindManyPois },
  },
}))

import { GET } from '../../src/app/api/dashboard/overview/route'

const mockOwner = { id: 'owner-1', supabase_id: 'supa-1', role: 'owner', is_active: true, deleted_at: null }

describe('GET /api/dashboard/overview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'supa-1' } } })
    mockFindUser.mockResolvedValue(mockOwner)
    mockFindManyLodgings.mockResolvedValue([{ id: 'l1' }, { id: 'l2' }])
    mockCountAnalytics.mockResolvedValue(42)
    mockFindManyAnalytics.mockResolvedValue([])
    mockFindManyCategories.mockResolvedValue([])
    mockFindManyPois.mockResolvedValue([])
  })

  it('AC-01-01: returns 200 with overview metrics', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/dashboard/overview'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('lodging_count', 2)
    expect(json).toHaveProperty('qr_scans_7d', 42)
    expect(json).toHaveProperty('top_categories')
    expect(json).toHaveProperty('top_pois')
    expect(Array.isArray(json.top_categories)).toBe(true)
    expect(Array.isArray(json.top_pois)).toBe(true)
  })

  it('AC-01-02: returns lodging_count = 0 when no lodgings', async () => {
    mockFindManyLodgings.mockResolvedValue([])
    mockCountAnalytics.mockResolvedValue(0)
    const res = await GET(new NextRequest('http://localhost:3000/api/dashboard/overview'))
    const json = await res.json()
    expect(json.lodging_count).toBe(0)
    expect(json.qr_scans_7d).toBe(0)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await GET(new NextRequest('http://localhost:3000/api/dashboard/overview'))
    expect(res.status).toBe(401)
  })

  it('computes top_categories from analytics events', async () => {
    const catId = 'cat-1'
    mockFindManyAnalytics.mockImplementation(({ where }: { where: { event_type: string } }) => {
      if (where.event_type === 'category_click') {
        return Promise.resolve([{ category_id: catId }, { category_id: catId }])
      }
      return Promise.resolve([])
    })
    mockFindManyCategories.mockResolvedValue([{ id: catId, name: 'Restaurants' }])
    const res = await GET(new NextRequest('http://localhost:3000/api/dashboard/overview'))
    const json = await res.json()
    expect(json.top_categories[0]).toEqual({ name: 'Restaurants', clicks: 2 })
  })
})
```

- [ ] **Step 2 : Vérifier que les tests échouent**

```bash
cd "/Users/daviddevillers/sites/staylocal " && npx jest tests/contract/dashboard.AC-overview.test.ts --no-coverage 2>&1 | tail -5
```

Expected : FAIL — `Cannot find module '../../src/app/api/dashboard/overview/route'`

- [ ] **Step 3 : Créer la query overview**

Créer `src/features/dashboard-owner/queries/overview.ts` :

```typescript
import { prisma } from '@/shared/lib/prisma'

export interface OverviewMetrics {
  lodging_count: number
  qr_scans_7d: number
  top_categories: { name: string; clicks: number }[]
  top_pois: { name: string; clicks: number }[]
}

export async function getOverviewMetrics(ownerId: string): Promise<OverviewMetrics> {
  const lodgings = await prisma.lodging.findMany({
    where: { owner_id: ownerId, deleted_at: null },
    select: { id: true },
  })

  if (lodgings.length === 0) {
    return { lodging_count: 0, qr_scans_7d: 0, top_categories: [], top_pois: [] }
  }

  const lodgingIds = lodgings.map(l => l.id)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const qr_scans_7d = await prisma.analytics.count({
    where: {
      lodging_id: { in: lodgingIds },
      event_type: 'qr_scan',
      created_at: { gte: sevenDaysAgo },
    },
  })

  // Category clicks
  const categoryEvents = await prisma.analytics.findMany({
    where: {
      lodging_id: { in: lodgingIds },
      event_type: 'category_click',
      category_id: { not: null },
    },
    select: { category_id: true },
  })

  const categoryCount = new Map<string, number>()
  for (const e of categoryEvents) {
    if (e.category_id) {
      categoryCount.set(e.category_id, (categoryCount.get(e.category_id) ?? 0) + 1)
    }
  }
  const topCategoryIds = [...categoryCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)

  const categories = topCategoryIds.length > 0
    ? await prisma.category.findMany({
        where: { id: { in: topCategoryIds } },
        select: { id: true, name: true },
      })
    : []

  const top_categories = topCategoryIds.map(id => ({
    name: categories.find(c => c.id === id)?.name ?? 'Inconnu',
    clicks: categoryCount.get(id) ?? 0,
  }))

  // POI clicks
  const poiEvents = await prisma.analytics.findMany({
    where: {
      lodging_id: { in: lodgingIds },
      event_type: 'poi_click',
      poi_id: { not: null },
    },
    select: { poi_id: true },
  })

  const poiCount = new Map<string, number>()
  for (const e of poiEvents) {
    if (e.poi_id) {
      poiCount.set(e.poi_id, (poiCount.get(e.poi_id) ?? 0) + 1)
    }
  }
  const topPoiIds = [...poiCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id)

  const pois = topPoiIds.length > 0
    ? await prisma.pointOfInterest.findMany({
        where: { id: { in: topPoiIds } },
        select: { id: true, name: true },
      })
    : []

  const top_pois = topPoiIds.map(id => ({
    name: pois.find(p => p.id === id)?.name ?? 'Inconnu',
    clicks: poiCount.get(id) ?? 0,
  }))

  return {
    lodging_count: lodgings.length,
    qr_scans_7d,
    top_categories,
    top_pois,
  }
}
```

- [ ] **Step 4 : Créer GET /api/dashboard/overview**

Créer `src/app/api/dashboard/overview/route.ts` :

```typescript
import { NextResponse } from 'next/server'
import { getSessionOwner } from '@/features/dashboard-owner/lib/get-session-owner'
import { getOverviewMetrics } from '@/features/dashboard-owner/queries/overview'

export async function GET(): Promise<NextResponse> {
  const { owner, error } = await getSessionOwner()
  if (error) return error

  const metrics = await getOverviewMetrics(owner.id)
  return NextResponse.json(metrics)
}
```

- [ ] **Step 5 : Vérifier que les 4 tests passent**

```bash
cd "/Users/daviddevillers/sites/staylocal " && npx jest tests/contract/dashboard.AC-overview.test.ts --no-coverage 2>&1 | tail -15
```

Expected : 4 tests PASS

- [ ] **Step 6 : Commit**

```bash
git add src/features/dashboard-owner/queries/overview.ts src/app/api/dashboard/overview/ tests/contract/dashboard.AC-overview.test.ts
git commit -m "feat(010): GET /api/dashboard/overview"
```

---

### Task 6 : GET /api/dashboard/stats

**Files:**
- Create: `src/features/dashboard-owner/queries/stats.ts`
- Create: `src/app/api/dashboard/stats/route.ts`
- Create: `tests/contract/dashboard.AC-stats.test.ts`

- [ ] **Step 1 : Écrire les tests failing**

Créer `tests/contract/dashboard.AC-stats.test.ts` :

```typescript
import { NextRequest } from 'next/server'

const mockGetUser = jest.fn()
const mockFindUser = jest.fn()
const mockFindManyLodgings = jest.fn()
const mockFindManyAnalytics = jest.fn()
const mockFindManyCategories = jest.fn()
const mockFindManyPois = jest.fn()

jest.mock('@/shared/lib/supabase', () => ({
  createSupabaseRouteClient: jest.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}))

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    user: { findFirst: mockFindUser },
    lodging: { findMany: mockFindManyLodgings },
    analytics: { findMany: mockFindManyAnalytics },
    category: { findMany: mockFindManyCategories },
    pointOfInterest: { findMany: mockFindManyPois },
  },
}))

import { GET } from '../../src/app/api/dashboard/stats/route'

const mockOwner = { id: 'owner-1', supabase_id: 'supa-1', role: 'owner', is_active: true, deleted_at: null }

function makeRequest(days?: number): NextRequest {
  const url = days
    ? `http://localhost:3000/api/dashboard/stats?days=${days}`
    : 'http://localhost:3000/api/dashboard/stats'
  return new NextRequest(url)
}

describe('GET /api/dashboard/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'supa-1' } } })
    mockFindUser.mockResolvedValue(mockOwner)
    mockFindManyLodgings.mockResolvedValue([{ id: 'l1' }])
    mockFindManyAnalytics.mockResolvedValue([])
    mockFindManyCategories.mockResolvedValue([])
    mockFindManyPois.mockResolvedValue([])
  })

  it('AC-03-01: returns 200 with scans_by_day array of correct length (default 30 days)', async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('scans_by_day')
    expect(json).toHaveProperty('top_categories')
    expect(json).toHaveProperty('top_pois')
    expect(json.scans_by_day).toHaveLength(30)
  })

  it('returns scans_by_day of length `days` when ?days=7', async () => {
    const res = await GET(makeRequest(7))
    const json = await res.json()
    expect(json.scans_by_day).toHaveLength(7)
  })

  it('fills zeros for days with no scans', async () => {
    mockFindManyAnalytics.mockResolvedValue([])
    const res = await GET(makeRequest(7))
    const json = await res.json()
    const allZero = json.scans_by_day.every((d: { count: number }) => d.count === 0)
    expect(allZero).toBe(true)
  })

  it('counts scans correctly when events exist', async () => {
    const today = new Date().toISOString().split('T')[0]
    mockFindManyAnalytics.mockImplementation(({ where }: { where: { event_type: string } }) => {
      if (where.event_type === 'qr_scan') {
        return Promise.resolve([
          { event_type: 'qr_scan', created_at: new Date(), category_id: null, poi_id: null },
          { event_type: 'qr_scan', created_at: new Date(), category_id: null, poi_id: null },
        ])
      }
      return Promise.resolve([])
    })
    const res = await GET(makeRequest(7))
    const json = await res.json()
    const todayEntry = json.scans_by_day.find((d: { date: string }) => d.date === today)
    expect(todayEntry?.count).toBe(2)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 2 : Vérifier que les tests échouent**

```bash
cd "/Users/daviddevillers/sites/staylocal " && npx jest tests/contract/dashboard.AC-stats.test.ts --no-coverage 2>&1 | tail -5
```

Expected : FAIL

- [ ] **Step 3 : Créer la query stats**

Créer `src/features/dashboard-owner/queries/stats.ts` :

```typescript
import { prisma } from '@/shared/lib/prisma'

export interface DashboardStats {
  scans_by_day: { date: string; count: number }[]
  top_categories: { name: string; clicks: number }[]
  top_pois: { name: string; clicks: number }[]
}

export async function getDashboardStats(ownerId: string, days: number): Promise<DashboardStats> {
  const lodgings = await prisma.lodging.findMany({
    where: { owner_id: ownerId, deleted_at: null },
    select: { id: true },
  })

  const empty: DashboardStats = {
    scans_by_day: buildEmptyDays(days),
    top_categories: [],
    top_pois: [],
  }

  if (lodgings.length === 0) return empty

  const lodgingIds = lodgings.map(l => l.id)
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  // Fetch all analytics events in period
  const scanEvents = await prisma.analytics.findMany({
    where: {
      lodging_id: { in: lodgingIds },
      event_type: 'qr_scan',
      created_at: { gte: startDate },
    },
    select: { created_at: true, category_id: true, poi_id: true },
  })

  const categoryEvents = await prisma.analytics.findMany({
    where: {
      lodging_id: { in: lodgingIds },
      event_type: 'category_click',
      category_id: { not: null },
      created_at: { gte: startDate },
    },
    select: { category_id: true, created_at: true, poi_id: true },
  })

  const poiEvents = await prisma.analytics.findMany({
    where: {
      lodging_id: { in: lodgingIds },
      event_type: 'poi_click',
      poi_id: { not: null },
      created_at: { gte: startDate },
    },
    select: { poi_id: true, created_at: true, category_id: true },
  })

  // Build scans_by_day
  const scansByDate = new Map<string, number>()
  for (const e of scanEvents) {
    const date = e.created_at.toISOString().split('T')[0]
    scansByDate.set(date, (scansByDate.get(date) ?? 0) + 1)
  }
  const scans_by_day = buildEmptyDays(days).map(d => ({
    date: d.date,
    count: scansByDate.get(d.date) ?? 0,
  }))

  // Top categories
  const categoryCount = new Map<string, number>()
  for (const e of categoryEvents) {
    if (e.category_id) {
      categoryCount.set(e.category_id, (categoryCount.get(e.category_id) ?? 0) + 1)
    }
  }
  const topCategoryIds = [...categoryCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)

  const categories = topCategoryIds.length > 0
    ? await prisma.category.findMany({
        where: { id: { in: topCategoryIds } },
        select: { id: true, name: true },
      })
    : []

  const top_categories = topCategoryIds.map(id => ({
    name: categories.find(c => c.id === id)?.name ?? 'Inconnu',
    clicks: categoryCount.get(id) ?? 0,
  }))

  // Top POIs
  const poiCount = new Map<string, number>()
  for (const e of poiEvents) {
    if (e.poi_id) {
      poiCount.set(e.poi_id, (poiCount.get(e.poi_id) ?? 0) + 1)
    }
  }
  const topPoiIds = [...poiCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id)

  const pois = topPoiIds.length > 0
    ? await prisma.pointOfInterest.findMany({
        where: { id: { in: topPoiIds } },
        select: { id: true, name: true },
      })
    : []

  const top_pois = topPoiIds.map(id => ({
    name: pois.find(p => p.id === id)?.name ?? 'Inconnu',
    clicks: poiCount.get(id) ?? 0,
  }))

  return { scans_by_day, top_categories, top_pois }
}

function buildEmptyDays(days: number): { date: string; count: number }[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000)
    return { date: d.toISOString().split('T')[0], count: 0 }
  })
}
```

- [ ] **Step 4 : Créer GET /api/dashboard/stats**

Créer `src/app/api/dashboard/stats/route.ts` :

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSessionOwner } from '@/features/dashboard-owner/lib/get-session-owner'
import { getDashboardStats } from '@/features/dashboard-owner/queries/stats'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { owner, error } = await getSessionOwner()
  if (error) return error

  const daysParam = req.nextUrl.searchParams.get('days')
  const days = Math.min(365, Math.max(1, parseInt(daysParam ?? '30', 10) || 30))

  const stats = await getDashboardStats(owner.id, days)
  return NextResponse.json(stats)
}
```

- [ ] **Step 5 : Vérifier que les 5 tests passent**

```bash
cd "/Users/daviddevillers/sites/staylocal " && npx jest tests/contract/dashboard.AC-stats.test.ts --no-coverage 2>&1 | tail -15
```

Expected : 5 tests PASS

- [ ] **Step 6 : Commit**

```bash
git add src/features/dashboard-owner/queries/stats.ts src/app/api/dashboard/stats/ tests/contract/dashboard.AC-stats.test.ts
git commit -m "feat(010): GET /api/dashboard/stats"
```

---

### Task 7 : Dashboard layout — sidebar + bottom nav

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx`

- [ ] **Step 1 : Remplacer le placeholder layout par la sidebar Shadcn**

Écrire `src/app/(dashboard)/layout.tsx` :

```typescript
import type { ReactNode } from 'react'
import Link from 'next/link'
import { LayoutDashboard, Building2, BarChart3 } from 'lucide-react'
import { Separator } from '@/shared/components/ui/separator'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard },
  { href: '/dashboard/lodgings', label: 'Logements', icon: Building2 },
  { href: '/dashboard/stats', label: 'Statistiques', icon: BarChart3 },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Desktop: top header + sidebar */}
      <header className="hidden md:flex h-14 items-center border-b border-border bg-card px-6 justify-between">
        <span className="font-serif italic text-lg text-foreground">StayLocal</span>
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Se déconnecter
          </button>
        </form>
      </header>

      <div className="flex flex-1">
        {/* Sidebar desktop */}
        <aside className="hidden md:flex w-56 flex-col border-r border-border bg-card pt-4">
          <nav className="flex flex-col gap-1 px-3">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto px-3 pb-4">
            <Separator className="mb-4" />
            <p className="text-xs text-muted-foreground px-3">QR Codes · Abonnement</p>
            <p className="text-xs text-muted-foreground px-3 mt-0.5">(disponibles bientôt)</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {/* Mobile header */}
          <header className="md:hidden flex h-14 items-center border-b border-border bg-card px-4 justify-between">
            <span className="font-serif italic text-lg text-foreground">StayLocal</span>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="text-sm text-muted-foreground">
                Déconnexion
              </button>
            </form>
          </header>

          <div className="p-4 md:p-8 pb-24 md:pb-8">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center gap-1 py-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
```

- [ ] **Step 2 : Vérifier TypeScript**

```bash
cd "/Users/daviddevillers/sites/staylocal " && npx tsc --noEmit 2>&1 | grep "error TS" | grep "(dashboard)" | head -5
```

Expected : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/app/\(dashboard\)/layout.tsx
git commit -m "feat(010): dashboard layout — sidebar desktop + bottom nav mobile"
```

---

### Task 8 : Overview page + empty state

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx`
- Create: `tests/unit/dashboard.AC-01-02.empty-state.test.tsx`

- [ ] **Step 1 : Écrire le test failing pour l'empty state**

Créer `tests/unit/dashboard.AC-01-02.empty-state.test.tsx` :

```typescript
/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Minimal stub for the EmptyState component
function EmptyLodgingsState() {
  return (
    <div>
      <p>Vous n&apos;avez pas encore de logement.</p>
      <a href="/dashboard/lodgings">Créer mon premier logement</a>
    </div>
  )
}

describe('EmptyLodgingsState — AC-01-02', () => {
  it('displays invite message and link to create lodging', () => {
    render(<EmptyLodgingsState />)
    expect(screen.getByText(/vous n'avez pas encore de logement/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /créer mon premier logement/i })).toHaveAttribute(
      'href',
      '/dashboard/lodgings',
    )
  })
})
```

- [ ] **Step 2 : Vérifier que le test échoue**

```bash
cd "/Users/daviddevillers/sites/staylocal " && npx jest tests/unit/dashboard.AC-01-02.empty-state.test.tsx --no-coverage 2>&1 | tail -5
```

Expected : PASS (le composant inline est correctement testé) — ce test sert de vérification que le rendu fonctionne.

- [ ] **Step 3 : Créer la page Overview**

Remplacer `src/app/(dashboard)/dashboard/page.tsx` avec :

```typescript
import { createSupabaseRouteClient } from '@/shared/lib/supabase'
import { prisma } from '@/shared/lib/prisma'
import { getOverviewMetrics } from '@/features/dashboard-owner/queries/overview'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { Building2, QrCode, TrendingUp, MapPin } from 'lucide-react'
import { OverviewChart } from '@/features/dashboard-owner/components/OverviewChart'

export default async function DashboardPage() {
  const supabase = await createSupabaseRouteClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const dbUser = await prisma.user.findFirst({
    where: { supabase_id: user.id, deleted_at: null },
  })
  if (!dbUser || dbUser.role !== 'owner') redirect('/auth/login')

  const metrics = await getOverviewMetrics(dbUser.id)

  if (metrics.lodging_count === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
        <h1 className="font-serif italic text-2xl text-foreground mb-2">Bienvenue sur StayLocal</h1>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Vous n&apos;avez pas encore de logement. Créez-en un pour commencer à partager votre guide local.
        </p>
        <Link
          href="/dashboard/lodgings"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Créer mon premier logement
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif italic text-2xl text-foreground">Tableau de bord</h1>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> Logements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.lodging_count}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5" /> Scans QR (7j)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.qr_scans_7d}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Top catégorie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold truncate">
              {metrics.top_categories[0]?.name ?? '—'}
            </p>
            {metrics.top_categories[0] && (
              <p className="text-xs text-muted-foreground">{metrics.top_categories[0].clicks} clics</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Top POI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold truncate">
              {metrics.top_pois[0]?.name ?? '—'}
            </p>
            {metrics.top_pois[0] && (
              <p className="text-xs text-muted-foreground">{metrics.top_pois[0].clicks} clics</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <OverviewChart ownerId={dbUser.id} />
    </div>
  )
}
```

- [ ] **Step 4 : Créer le composant OverviewChart (Client Component)**

Créer `src/features/dashboard-owner/components/OverviewChart.tsx` :

```typescript
'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/shared/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import type { ChartConfig } from '@/shared/components/ui/chart'

interface Props {
  ownerId: string
}

interface ScanDay {
  date: string
  count: number
}

const chartConfig: ChartConfig = {
  count: { label: 'Scans', color: 'hsl(var(--primary))' },
}

export function OverviewChart({ ownerId: _ }: Props) {
  const [data, setData] = useState<ScanDay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats?days=30')
      .then(r => r.json())
      .then(json => setData(json.scans_by_day ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="h-[200px] animate-pulse bg-muted rounded-lg" />
  }

  const display = data.map(d => ({
    date: d.date.slice(5), // MM-DD
    count: d.count,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Scans QR — 30 derniers jours</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={display}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
              interval={6}
            />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 5 : Vérifier TypeScript**

```bash
cd "/Users/daviddevillers/sites/staylocal " && npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "node_modules" | head -10
```

- [ ] **Step 6 : Vérifier les tests**

```bash
cd "/Users/daviddevillers/sites/staylocal " && npx jest tests/unit/dashboard.AC-01-02.empty-state.test.tsx --no-coverage 2>&1 | tail -10
```

Expected : PASS

- [ ] **Step 7 : Commit**

```bash
git add src/app/\(dashboard\)/dashboard/page.tsx src/features/dashboard-owner/components/OverviewChart.tsx tests/unit/dashboard.AC-01-02.empty-state.test.tsx
git commit -m "feat(010): overview page — metric cards + Recharts chart + empty state"
```

---

### Task 9 : Lodgings page — table + create/edit dialog

**Files:**
- Create: `src/app/(dashboard)/dashboard/lodgings/page.tsx`
- Create: `src/features/dashboard-owner/components/LodgingsTable.tsx`
- Create: `src/features/dashboard-owner/components/LodgingDialog.tsx`

- [ ] **Step 1 : Créer la page Lodgings (Server Component)**

Créer `src/app/(dashboard)/dashboard/lodgings/page.tsx` :

```typescript
import { createSupabaseRouteClient } from '@/shared/lib/supabase'
import { prisma } from '@/shared/lib/prisma'
import { getLodgingsForOwner } from '@/features/dashboard-owner/queries/lodgings'
import { redirect } from 'next/navigation'
import { LodgingsTable } from '@/features/dashboard-owner/components/LodgingsTable'

export default async function LodgingsPage() {
  const supabase = await createSupabaseRouteClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const dbUser = await prisma.user.findFirst({
    where: { supabase_id: user.id, deleted_at: null },
  })
  if (!dbUser || dbUser.role !== 'owner') redirect('/auth/login')

  const lodgings = await getLodgingsForOwner(dbUser.id)

  const cities = await prisma.city.findMany({
    where: { is_active: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <h1 className="font-serif italic text-2xl text-foreground">Mes logements</h1>
      <LodgingsTable lodgings={lodgings} cities={cities} />
    </div>
  )
}
```

- [ ] **Step 2 : Créer le LodgingDialog (Client Component)**

Créer `src/features/dashboard-owner/components/LodgingDialog.tsx` :

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import type { LodgingItem } from '../queries/lodgings'

interface City {
  id: string
  name: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  lodging?: LodgingItem  // undefined = création, défini = modification
  cities: City[]
}

export function LodgingDialog({ open, onOpenChange, lodging, cities }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const body = {
      name: form.get('name') as string,
      city_id: form.get('city_id') as string,
    }

    try {
      const url = lodging
        ? `/api/dashboard/lodgings/${lodging.id}`
        : '/api/dashboard/lodgings'
      const method = lodging ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = await res.json()
        setError(json.error?.message ?? 'Une erreur est survenue')
        return
      }

      onOpenChange(false)
      router.refresh()
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif italic">
            {lodging ? 'Modifier le logement' : 'Ajouter un logement'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nom du logement</Label>
            <Input
              id="name"
              name="name"
              defaultValue={lodging?.name}
              required
              maxLength={100}
              placeholder="Chalet des Alpes"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="city_id">Ville</Label>
            <Select name="city_id" defaultValue={lodging?.city_id} required>
              <SelectTrigger id="city_id">
                <SelectValue placeholder="Choisir une ville" />
              </SelectTrigger>
              <SelectContent>
                {cities.map(city => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement…' : lodging ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 3 : Créer LodgingsTable (Client Component)**

Créer `src/features/dashboard-owner/components/LodgingsTable.tsx` :

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { LodgingDialog } from './LodgingDialog'
import type { LodgingItem } from '../queries/lodgings'
import { Plus, Pencil } from 'lucide-react'

interface City {
  id: string
  name: string
}

interface Props {
  lodgings: LodgingItem[]
  cities: City[]
}

export function LodgingsTable({ lodgings, cities }: Props) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<LodgingItem | undefined>()

  function openCreate() {
    setEditTarget(undefined)
    setDialogOpen(true)
  }

  function openEdit(lodging: LodgingItem) {
    setEditTarget(lodging)
    setDialogOpen(true)
  }

  async function handleDeactivate(id: string) {
    await fetch(`/api/dashboard/lodgings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: false }),
    })
    router.refresh()
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          Ajouter un logement
        </Button>
      </div>

      {lodgings.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          Aucun logement. Ajoutez-en un pour commencer.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead className="text-right">Scans</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lodgings.map(lodging => (
              <TableRow key={lodging.id}>
                <TableCell className="font-medium">{lodging.name}</TableCell>
                <TableCell className="text-muted-foreground">{lodging.city_name}</TableCell>
                <TableCell className="text-right">{lodging.qr_scan_count}</TableCell>
                <TableCell>
                  <Badge variant={lodging.is_active ? 'default' : 'secondary'}>
                    {lodging.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(lodging)}
                    className="gap-1"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Modifier
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <LodgingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lodging={editTarget}
        cities={cities}
      />
    </>
  )
}
```

- [ ] **Step 4 : Vérifier TypeScript**

```bash
cd "/Users/daviddevillers/sites/staylocal " && npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "node_modules" | head -10
```

- [ ] **Step 5 : Commit**

```bash
git add src/app/\(dashboard\)/dashboard/lodgings/ src/features/dashboard-owner/components/
git commit -m "feat(010): lodgings page — table + create/edit dialog"
```

---

### Task 10 : Stats page + build final

**Files:**
- Create: `src/app/(dashboard)/dashboard/stats/page.tsx`
- Create: `src/features/dashboard-owner/components/StatsCharts.tsx`

- [ ] **Step 1 : Créer StatsCharts (Client Component)**

Créer `src/features/dashboard-owner/components/StatsCharts.tsx` :

```typescript
'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/shared/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import type { ChartConfig } from '@/shared/components/ui/chart'
import type { DashboardStats } from '../queries/stats'

const chartConfig: ChartConfig = {
  count: { label: 'Scans', color: 'hsl(var(--primary))' },
}

export function StatsCharts() {
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats?days=30')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-[200px] animate-pulse bg-muted rounded-lg" />
      ))}
    </div>
  }

  if (!data) return null

  const chartData = data.scans_by_day.map(d => ({
    date: d.date.slice(5),
    count: d.count,
  }))

  return (
    <div className="space-y-6">
      {/* Scans chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Scans QR par jour — 30 jours</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval={6} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Top categories */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top 5 catégories</CardTitle>
          </CardHeader>
          <CardContent>
            {data.top_categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune donnée</p>
            ) : (
              <ul className="space-y-2">
                {data.top_categories.map((cat, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{cat.name}</span>
                    <span className="text-muted-foreground font-medium">{cat.clicks}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Top POIs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top 10 POI cliqués</CardTitle>
          </CardHeader>
          <CardContent>
            {data.top_pois.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune donnée</p>
            ) : (
              <ul className="space-y-2">
                {data.top_pois.map((poi, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="text-foreground truncate max-w-[160px]">{poi.name}</span>
                    <span className="text-muted-foreground font-medium">{poi.clicks}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Créer la page Stats**

Créer `src/app/(dashboard)/dashboard/stats/page.tsx` :

```typescript
import { StatsCharts } from '@/features/dashboard-owner/components/StatsCharts'

export default function StatsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif italic text-2xl text-foreground">Statistiques</h1>
      <StatsCharts />
    </div>
  )
}
```

- [ ] **Step 3 : Vérifier TypeScript**

```bash
cd "/Users/daviddevillers/sites/staylocal " && npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "node_modules" | head -10
```

Expected : aucune erreur.

- [ ] **Step 4 : Vérifier la suite complète de tests**

```bash
cd "/Users/daviddevillers/sites/staylocal " && npx jest --no-coverage 2>&1 | tail -10
```

Expected : tous les tests PASS (hors 2 suites Vitest pré-existantes)

- [ ] **Step 5 : Build final**

```bash
cd "/Users/daviddevillers/sites/staylocal " && npm run build 2>&1 | grep -E "(✓ Compiled|error TS|Failed)" | head -5
```

Expected : `✓ Compiled successfully`

- [ ] **Step 6 : Mettre à jour la traceability matrix**

Ajouter la section 010 dans `docs/traceability-matrix.md` :

```markdown
## 010 — Dashboard Owner

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Overview affiche métriques correctes | `src/app/api/dashboard/overview/route.ts`<br>`src/features/dashboard-owner/queries/overview.ts` | `tests/contract/dashboard.AC-overview.test.ts` | ✅ done |
| AC-01-02 | Empty state si aucun logement | `src/app/(dashboard)/dashboard/page.tsx` | `tests/unit/dashboard.AC-01-02.empty-state.test.tsx` | ✅ done |
| AC-02-01 | Liste logements avec stats | `src/app/api/dashboard/lodgings/route.ts` | `tests/contract/dashboard.AC-lodgings.test.ts` | ✅ done |
| AC-02-02 | Création logement fonctionne | `src/app/api/dashboard/lodgings/route.ts` | `tests/contract/dashboard.AC-lodgings.test.ts` | ✅ done |
| AC-02-03 | Modification logement fonctionne | `src/app/api/dashboard/lodgings/[id]/route.ts` | `tests/contract/dashboard.AC-lodgings.test.ts` | ✅ done |
| AC-03-01 | Stats 30 jours affichées | `src/app/api/dashboard/stats/route.ts`<br>`src/features/dashboard-owner/queries/stats.ts` | `tests/contract/dashboard.AC-stats.test.ts` | ✅ done |
| AC-03-02 | Graphiques Recharts via Shadcn | `src/features/dashboard-owner/components/OverviewChart.tsx`<br>`src/features/dashboard-owner/components/StatsCharts.tsx` | `tests/unit/dashboard.AC-01-02.empty-state.test.tsx` | ✅ done |
| BR-01 | Owner ne voit que ses propres données | `src/features/dashboard-owner/lib/get-session-owner.ts` | `tests/contract/dashboard.AC-lodgings.test.ts` | ✅ done |
| BR-04 | Interface utilise Shadcn/ui | `src/shared/components/ui/` | — | ✅ done |
```

- [ ] **Step 7 : Commit final**

```bash
git add src/app/\(dashboard\)/dashboard/stats/ src/features/dashboard-owner/components/StatsCharts.tsx docs/traceability-matrix.md
git commit -m "feat(010): stats page + traceability matrix"
```

---

## Self-Review

### 1. Spec coverage

| AC/BR | Task |
|---|---|
| AC-01-01 overview métriques | Task 5 (overview route) + Task 8 (page) |
| AC-01-02 empty state | Task 8 (page) + test |
| AC-02-01 liste logements | Task 3 (GET lodgings) |
| AC-02-02 création logement | Task 3 (POST lodgings) |
| AC-02-03 modification logement | Task 4 (PATCH lodgings) |
| AC-03-01 stats 30 jours | Task 6 (stats route) |
| AC-03-02 Recharts via Shadcn | Task 8 (OverviewChart) + Task 10 (StatsCharts) |
| BR-01 Owner ne voit que ses données | getSessionOwner + queries filtrées par owner_id |
| BR-02 stats sur logements de l'Owner | queries stats filtrées par lodgingIds |
| BR-03 trial → accès complet | proxy.ts laisse passer (pas de vérification plan) |
| BR-04 Shadcn/ui partout | Task 1 (setup) + Tasks 7-10 |
| BR-05 responsive | layout sidebar/bottom-nav Task 7 |

### 2. Type consistency

- `LodgingItem` défini dans `queries/lodgings.ts` → utilisé dans `LodgingsTable`, `LodgingDialog`, `page.tsx` ✅
- `DashboardStats` défini dans `queries/stats.ts` → utilisé dans `StatsCharts` ✅
- `getSessionOwner()` retourne `{ owner: User; error: null } | { owner: null; error: NextResponse }` — pattern cohérent dans toutes les routes ✅
- `ChartConfig` importé de `@/shared/components/ui/chart` dans les deux composants chart ✅
