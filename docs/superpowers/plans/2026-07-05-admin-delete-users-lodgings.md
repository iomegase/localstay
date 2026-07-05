# Admin Delete Users & Lodgings — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à un admin de purger définitivement (hard-delete) un compte owner/merchant + tous ses logements, et de supprimer un logement isolé.

**Architecture:** Purge applicative transactionnelle (approche A, sans migration). Deux fonctions métier dans `src/features/admin/lib/hard-delete.ts`, deux routes `DELETE`, et deux boutons UI avec confirmation. Le compte Supabase Auth est supprimé après le commit DB via le client service_role.

**Tech Stack:** Next.js (App Router), Prisma, Supabase Auth (service_role), Jest + ts-jest, Zod.

## Global Constraints

- **Hard-delete uniquement** (irréversible). Pas de `deleted_at` ici — on supprime les lignes.
- **Owners/merchants uniquement** : une cible `role === 'admin'` → 403, aucune suppression.
- **Aucune migration DB** (DB directe injoignable depuis le sandbox). Purge via `prisma.$transaction` + `deleteMany`.
- **Client Supabase admin** : `createSupabaseServer()` de `src/shared/lib/supabase.ts` (clé service_role), méthode `auth.admin.deleteUser(supabaseId)`.
- **Réponses API** : helpers existants `apiError(code, message, status)` et `validationError(flatten)` de `@/features/merchant/lib/responses` ; auth via `getSessionAdmin()` de `@/features/merchant/lib/session` (renvoie `{ error?: NextResponse }`).
- **Tests** : mock du module `@/shared/lib/prisma` avec des `jest.fn()` par delegate + `$transaction` qui appelle `fn(tx)` (pattern de `tests/unit/admin-taxonomy.delete.test.ts`).

---

### Task 1: `hardDeleteLodging` — purge d'un logement et de ses enfants

**Files:**
- Create: `src/features/admin/lib/hard-delete.ts`
- Test: `tests/unit/admin-hard-delete.lodging.test.ts`

**Interfaces:**
- Produces:
  ```ts
  import type { Prisma } from '@prisma/client'
  export async function hardDeleteLodging(
    tx: Prisma.TransactionClient,
    lodgingId: string,
  ): Promise<void>
  ```

**Cascade (enfants → parent), tous par `deleteMany` :**
1. `lodgingPublicProfile` du logement (findUnique `where: { lodging_id }` → `id`). Si présent :
   `lodgingPhoto`, `lodgingAmenity`, `lodgingFaqItem` (`where: { profile_id }`), puis `lodgingPublicProfile` (`where: { lodging_id }`).
2. `qrCode`, `analytics`, `analyticsInteractionEvent`, `lodgingCustomization`, `lodgingFeaturedPoi`, `lodgingPracticalBlock`, `contactMessage` (chacun `where: { lodging_id }`).
3. `lodging.delete({ where: { id: lodgingId } })`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/admin-hard-delete.lodging.test.ts
const del = () => ({ deleteMany: jest.fn().mockResolvedValue({ count: 0 }) })

const tx = {
  lodgingPublicProfile: {
    findUnique: jest.fn(),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
  },
  lodgingPhoto: del(),
  lodgingAmenity: del(),
  lodgingFaqItem: del(),
  qrCode: del(),
  analytics: del(),
  analyticsInteractionEvent: del(),
  lodgingCustomization: del(),
  lodgingFeaturedPoi: del(),
  lodgingPracticalBlock: del(),
  contactMessage: del(),
  lodging: { delete: jest.fn().mockResolvedValue({ id: 'lodg-1' }) },
}

import { hardDeleteLodging } from '@/features/admin/lib/hard-delete'

describe('hardDeleteLodging', () => {
  beforeEach(() => jest.clearAllMocks())

  it('purges public-profile children then the profile when a profile exists', async () => {
    tx.lodgingPublicProfile.findUnique.mockResolvedValue({ id: 'prof-1' })

    await hardDeleteLodging(tx as never, 'lodg-1')

    expect(tx.lodgingPhoto.deleteMany).toHaveBeenCalledWith({ where: { profile_id: 'prof-1' } })
    expect(tx.lodgingAmenity.deleteMany).toHaveBeenCalledWith({ where: { profile_id: 'prof-1' } })
    expect(tx.lodgingFaqItem.deleteMany).toHaveBeenCalledWith({ where: { profile_id: 'prof-1' } })
    expect(tx.lodgingPublicProfile.deleteMany).toHaveBeenCalledWith({ where: { lodging_id: 'lodg-1' } })
  })

  it('skips profile children when there is no public profile, and deletes the lodging last', async () => {
    tx.lodgingPublicProfile.findUnique.mockResolvedValue(null)

    await hardDeleteLodging(tx as never, 'lodg-1')

    expect(tx.lodgingPhoto.deleteMany).not.toHaveBeenCalled()
    expect(tx.qrCode.deleteMany).toHaveBeenCalledWith({ where: { lodging_id: 'lodg-1' } })
    expect(tx.contactMessage.deleteMany).toHaveBeenCalledWith({ where: { lodging_id: 'lodg-1' } })
    expect(tx.lodging.delete).toHaveBeenCalledWith({ where: { id: 'lodg-1' } })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/unit/admin-hard-delete.lodging.test.ts`
Expected: FAIL — `Cannot find module '@/features/admin/lib/hard-delete'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/features/admin/lib/hard-delete.ts
import type { Prisma } from '@prisma/client'

export async function hardDeleteLodging(
  tx: Prisma.TransactionClient,
  lodgingId: string,
): Promise<void> {
  const profile = await tx.lodgingPublicProfile.findUnique({
    where: { lodging_id: lodgingId },
    select: { id: true },
  })
  if (profile) {
    await tx.lodgingPhoto.deleteMany({ where: { profile_id: profile.id } })
    await tx.lodgingAmenity.deleteMany({ where: { profile_id: profile.id } })
    await tx.lodgingFaqItem.deleteMany({ where: { profile_id: profile.id } })
    await tx.lodgingPublicProfile.deleteMany({ where: { lodging_id: lodgingId } })
  }

  await tx.qrCode.deleteMany({ where: { lodging_id: lodgingId } })
  await tx.analytics.deleteMany({ where: { lodging_id: lodgingId } })
  await tx.analyticsInteractionEvent.deleteMany({ where: { lodging_id: lodgingId } })
  await tx.lodgingCustomization.deleteMany({ where: { lodging_id: lodgingId } })
  await tx.lodgingFeaturedPoi.deleteMany({ where: { lodging_id: lodgingId } })
  await tx.lodgingPracticalBlock.deleteMany({ where: { lodging_id: lodgingId } })
  await tx.contactMessage.deleteMany({ where: { lodging_id: lodgingId } })

  await tx.lodging.delete({ where: { id: lodgingId } })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/unit/admin-hard-delete.lodging.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/lib/hard-delete.ts tests/unit/admin-hard-delete.lodging.test.ts
git commit -m "feat(admin): hardDeleteLodging cascade purge"
```

---

### Task 2: `hardDeleteUserAccount` — purge compte owner/merchant + logements + Supabase Auth

**Files:**
- Modify: `src/features/admin/lib/hard-delete.ts` (ajout de la fonction + imports)
- Test: `tests/unit/admin-hard-delete.user.test.ts`

**Interfaces:**
- Consumes: `hardDeleteLodging(tx, lodgingId)` (Task 1).
- Produces:
  ```ts
  export class HardDeleteError extends Error {
    constructor(public code: 'NOT_FOUND', public status: number, message: string)
  }
  export async function hardDeleteUserAccount(
    userId: string,
  ): Promise<{ deletedLodgings: number; authDeleted: boolean }>
  ```

**Comportement :**
1. `prisma.$transaction(async tx => { ... })` :
   - `tx.user.findUnique({ where: { id: userId }, select: { id: true, supabase_id: true } })` → si null, throw `HardDeleteError('NOT_FOUND', 404, 'Compte introuvable')`.
   - `tx.lodging.findMany({ where: { owner_id: userId }, select: { id: true } })` → `for (l of lodgings) await hardDeleteLodging(tx, l.id)`.
   - `tx.subscription.deleteMany({ where: { user_id: userId } })`
   - `tx.missingPoiRequest.deleteMany({ where: { merchant_id: userId } })`
   - `tx.merchantClaim.deleteMany({ where: { merchant_id: userId } })`
   - `tx.merchantProfile.deleteMany({ where: { merchant_id: userId } })`
   - `tx.contactMessage.deleteMany({ where: { owner_id: userId } })`
   - `tx.user.delete({ where: { id: userId } })`
   - retourne `{ deletedLodgings: lodgings.length, supabaseId }`.
2. Après commit : `const supabase = createSupabaseServer(); const { error } = await supabase.auth.admin.deleteUser(supabaseId)`.
   - `authDeleted = !error` ; si `error`, `console.error(...)` (DB déjà purgée, on n'annule pas).
3. Retourne `{ deletedLodgings, authDeleted }`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/admin-hard-delete.user.test.ts
const mockUserFindUnique = jest.fn()
const mockUserDelete = jest.fn().mockResolvedValue({ id: 'u-1' })
const mockLodgingFindMany = jest.fn()
const mockTransaction = jest.fn()
const mockDeleteMany = () => jest.fn().mockResolvedValue({ count: 0 })
const mocks = {
  subscription: { deleteMany: mockDeleteMany() },
  missingPoiRequest: { deleteMany: mockDeleteMany() },
  merchantClaim: { deleteMany: mockDeleteMany() },
  merchantProfile: { deleteMany: mockDeleteMany() },
  contactMessage: { deleteMany: mockDeleteMany() },
}
const mockDeleteUser = jest.fn().mockResolvedValue({ error: null })

jest.mock('@/shared/lib/prisma', () => ({
  prisma: { $transaction: (...a: unknown[]) => mockTransaction(...a) },
}))
jest.mock('@/shared/lib/supabase', () => ({
  createSupabaseServer: () => ({ auth: { admin: { deleteUser: (...a: unknown[]) => mockDeleteUser(...a) } } }),
}))
// hardDeleteLodging est testé en Task 1 ; on le stubbe pour isoler la logique user.
const mockHardDeleteLodging = jest.fn().mockResolvedValue(undefined)
jest.mock('@/features/admin/lib/hard-delete', () => {
  const actual = jest.requireActual('@/features/admin/lib/hard-delete')
  return { ...actual, hardDeleteLodging: (...a: unknown[]) => mockHardDeleteLodging(...a) }
})

import { hardDeleteUserAccount, HardDeleteError } from '@/features/admin/lib/hard-delete'

const tx = {
  user: {
    findUnique: (...a: unknown[]) => mockUserFindUnique(...a),
    delete: (...a: unknown[]) => mockUserDelete(...a),
  },
  lodging: { findMany: (...a: unknown[]) => mockLodgingFindMany(...a) },
  ...mocks,
}

describe('hardDeleteUserAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTransaction.mockImplementation(async (fn: (c: typeof tx) => unknown) => fn(tx))
    mockLodgingFindMany.mockResolvedValue([])
    mockDeleteUser.mockResolvedValue({ error: null })
  })

  it('throws NOT_FOUND (404) when the user does not exist', async () => {
    mockUserFindUnique.mockResolvedValue(null)
    await expect(hardDeleteUserAccount('missing')).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
    expect(mockUserDelete).not.toHaveBeenCalled()
  })

  it('purges lodgings, merchant/owner children, the user, then the Auth account', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 'u-1', supabase_id: 'sb-1' })
    mockLodgingFindMany.mockResolvedValue([{ id: 'l-1' }, { id: 'l-2' }])

    const result = await hardDeleteUserAccount('u-1')

    expect(mockHardDeleteLodging).toHaveBeenCalledTimes(2)
    expect(mocks.merchantProfile.deleteMany).toHaveBeenCalledWith({ where: { merchant_id: 'u-1' } })
    expect(mocks.subscription.deleteMany).toHaveBeenCalledWith({ where: { user_id: 'u-1' } })
    expect(mockUserDelete).toHaveBeenCalledWith({ where: { id: 'u-1' } })
    expect(mockDeleteUser).toHaveBeenCalledWith('sb-1')
    expect(result).toEqual({ deletedLodgings: 2, authDeleted: true })
  })

  it('reports authDeleted=false when Supabase Auth deletion fails', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 'u-1', supabase_id: 'sb-1' })
    mockDeleteUser.mockResolvedValue({ error: { message: 'boom' } })

    const result = await hardDeleteUserAccount('u-1')
    expect(result.authDeleted).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/unit/admin-hard-delete.user.test.ts`
Expected: FAIL — `hardDeleteUserAccount`/`HardDeleteError` not exported.

- [ ] **Step 3: Write minimal implementation** (append to `src/features/admin/lib/hard-delete.ts`)

```ts
import { prisma } from '@/shared/lib/prisma'
import { createSupabaseServer } from '@/shared/lib/supabase'

export class HardDeleteError extends Error {
  constructor(
    public code: 'NOT_FOUND',
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'HardDeleteError'
  }
}

export async function hardDeleteUserAccount(
  userId: string,
): Promise<{ deletedLodgings: number; authDeleted: boolean }> {
  const { deletedLodgings, supabaseId } = await prisma.$transaction(async tx => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, supabase_id: true },
    })
    if (!user) throw new HardDeleteError('NOT_FOUND', 404, 'Compte introuvable')

    const lodgings = await tx.lodging.findMany({
      where: { owner_id: userId },
      select: { id: true },
    })
    for (const lodging of lodgings) {
      await hardDeleteLodging(tx, lodging.id)
    }

    await tx.subscription.deleteMany({ where: { user_id: userId } })
    await tx.missingPoiRequest.deleteMany({ where: { merchant_id: userId } })
    await tx.merchantClaim.deleteMany({ where: { merchant_id: userId } })
    await tx.merchantProfile.deleteMany({ where: { merchant_id: userId } })
    await tx.contactMessage.deleteMany({ where: { owner_id: userId } })
    await tx.user.delete({ where: { id: userId } })

    return { deletedLodgings: lodgings.length, supabaseId: user.supabase_id }
  })

  const supabase = createSupabaseServer()
  const { error } = await supabase.auth.admin.deleteUser(supabaseId)
  if (error) {
    console.error(`[hardDeleteUserAccount] Auth deletion failed for ${supabaseId}: ${error.message}`)
  }

  return { deletedLodgings, authDeleted: !error }
}
```

> Note : `hardDeleteLodging` doit être appelé via une référence de module pour que le mock partiel du test fonctionne — garder l'appel `await hardDeleteLodging(tx, lodging.id)` tel quel (même module, export nommé). Si le mock partiel ne s'applique pas à l'appel intra-module, retirer le `jest.mock` partiel du test et laisser `hardDeleteLodging` s'exécuter avec les delegates `tx` fournis (ils sont déjà des `jest.fn()` no-op). Dans ce cas, ajouter au `tx` du test les delegates de la Task 1.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/unit/admin-hard-delete.user.test.ts`
Expected: PASS (3 tests). Si le mock partiel intra-module échoue, appliquer la note ci-dessus puis relancer.

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/lib/hard-delete.ts tests/unit/admin-hard-delete.user.test.ts
git commit -m "feat(admin): hardDeleteUserAccount purge + Supabase Auth"
```

---

### Task 3: Route `DELETE /api/admin/lodgings/[id]`

**Files:**
- Create: `src/app/api/admin/lodgings/[id]/route.ts` (ajouter la méthode DELETE ; le dossier `[id]` existe déjà — si un `route.ts` existe, y ajouter l'export `DELETE`)
- Test: `tests/unit/admin-lodgings.delete-route.test.ts`

**Interfaces:**
- Consumes: `hardDeleteLodging` (Task 1), `prisma.$transaction`, `getSessionAdmin`, `apiError`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/admin-lodgings.delete-route.test.ts
const mockGetSessionAdmin = jest.fn()
const mockFindUnique = jest.fn()
const mockTransaction = jest.fn()
const mockHardDeleteLodging = jest.fn().mockResolvedValue(undefined)

jest.mock('@/features/merchant/lib/session', () => ({ getSessionAdmin: () => mockGetSessionAdmin() }))
jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodging: { findUnique: (...a: unknown[]) => mockFindUnique(...a) },
    $transaction: (...a: unknown[]) => mockTransaction(...a),
  },
}))
jest.mock('@/features/admin/lib/hard-delete', () => ({
  hardDeleteLodging: (...a: unknown[]) => mockHardDeleteLodging(...a),
}))

import { DELETE } from '@/app/api/admin/lodgings/[id]/route'

const ctx = (id: string) => ({ params: Promise.resolve({ id }) })
const VALID = '039c55cb-57f0-4816-9b0d-460d80e4e04f'

describe('DELETE /api/admin/lodgings/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ error: null })
    mockTransaction.mockImplementation(async (fn: (c: unknown) => unknown) => fn({}))
    mockFindUnique.mockResolvedValue({ id: VALID })
  })

  it('returns 401/403 when not admin', async () => {
    const denied = new Response('no', { status: 403 })
    mockGetSessionAdmin.mockResolvedValue({ error: denied })
    const res = await DELETE(new Request('http://x'), ctx(VALID))
    expect(res.status).toBe(403)
  })

  it('returns 404 when the lodging does not exist', async () => {
    mockFindUnique.mockResolvedValue(null)
    const res = await DELETE(new Request('http://x'), ctx(VALID))
    expect(res.status).toBe(404)
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('purges the lodging and returns 200', async () => {
    const res = await DELETE(new Request('http://x'), ctx(VALID))
    expect(res.status).toBe(200)
    expect(mockHardDeleteLodging).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/unit/admin-lodgings.delete-route.test.ts`
Expected: FAIL — module/route `DELETE` introuvable.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/app/api/admin/lodgings/[id]/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError, validationError } from '@/features/merchant/lib/responses'
import { prisma } from '@/shared/lib/prisma'
import { hardDeleteLodging } from '@/features/admin/lib/hard-delete'

type RouteContext = { params: Promise<{ id: string }> }
const idSchema = z.string().uuid()

export async function DELETE(_request: Request, context: RouteContext): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const { id } = await context.params
  const parsed = idSchema.safeParse(id)
  if (!parsed.success) return validationError(parsed.error.flatten())

  const lodging = await prisma.lodging.findUnique({ where: { id: parsed.data }, select: { id: true } })
  if (!lodging) return apiError('NOT_FOUND', 'Logement introuvable', 404)

  await prisma.$transaction(tx => hardDeleteLodging(tx, lodging.id))

  return NextResponse.json({ message: 'Logement supprimé' })
}
```

> Si `src/app/api/admin/lodgings/[id]/route.ts` existe déjà, y ajouter uniquement l'export `DELETE` (et fusionner les imports), sans toucher aux méthodes existantes.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/unit/admin-lodgings.delete-route.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/lodgings/'[id]'/route.ts tests/unit/admin-lodgings.delete-route.test.ts
git commit -m "feat(admin): DELETE lodging route"
```

---

### Task 4: Route `DELETE /api/admin/users/[id]`

**Files:**
- Create: `src/app/api/admin/users/[id]/route.ts`
- Test: `tests/unit/admin-users.delete-route.test.ts`

**Interfaces:**
- Consumes: `hardDeleteUserAccount`, `HardDeleteError` (Task 2), `getSessionAdmin`, `apiError`, `prisma.user.findUnique`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/admin-users.delete-route.test.ts
const mockGetSessionAdmin = jest.fn()
const mockUserFindUnique = jest.fn()
const mockHardDeleteUserAccount = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({ getSessionAdmin: () => mockGetSessionAdmin() }))
jest.mock('@/shared/lib/prisma', () => ({
  prisma: { user: { findUnique: (...a: unknown[]) => mockUserFindUnique(...a) } },
}))
jest.mock('@/features/admin/lib/hard-delete', () => ({
  hardDeleteUserAccount: (...a: unknown[]) => mockHardDeleteUserAccount(...a),
}))

import { DELETE } from '@/app/api/admin/users/[id]/route'

const ctx = (id: string) => ({ params: Promise.resolve({ id }) })
const VALID = '039c55cb-57f0-4816-9b0d-460d80e4e04f'

describe('DELETE /api/admin/users/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ error: null })
    mockUserFindUnique.mockResolvedValue({ id: VALID, role: 'owner' })
    mockHardDeleteUserAccount.mockResolvedValue({ deletedLodgings: 2, authDeleted: true })
  })

  it('returns 403 when not admin', async () => {
    mockGetSessionAdmin.mockResolvedValue({ error: new Response('no', { status: 403 }) })
    const res = await DELETE(new Request('http://x'), ctx(VALID))
    expect(res.status).toBe(403)
  })

  it('returns 404 when the target user does not exist', async () => {
    mockUserFindUnique.mockResolvedValue(null)
    const res = await DELETE(new Request('http://x'), ctx(VALID))
    expect(res.status).toBe(404)
    expect(mockHardDeleteUserAccount).not.toHaveBeenCalled()
  })

  it('refuses to delete an admin account (403)', async () => {
    mockUserFindUnique.mockResolvedValue({ id: VALID, role: 'admin' })
    const res = await DELETE(new Request('http://x'), ctx(VALID))
    expect(res.status).toBe(403)
    expect(mockHardDeleteUserAccount).not.toHaveBeenCalled()
  })

  it('purges an owner and returns 200 with the lodging count', async () => {
    const res = await DELETE(new Request('http://x'), ctx(VALID))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ deleted_lodgings: 2, auth_deleted: true })
    expect(mockHardDeleteUserAccount).toHaveBeenCalledWith(VALID)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/unit/admin-users.delete-route.test.ts`
Expected: FAIL — route `DELETE` introuvable.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/app/api/admin/users/[id]/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError, validationError } from '@/features/merchant/lib/responses'
import { prisma } from '@/shared/lib/prisma'
import { hardDeleteUserAccount, HardDeleteError } from '@/features/admin/lib/hard-delete'

type RouteContext = { params: Promise<{ id: string }> }
const idSchema = z.string().uuid()

export async function DELETE(_request: Request, context: RouteContext): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const { id } = await context.params
  const parsed = idSchema.safeParse(id)
  if (!parsed.success) return validationError(parsed.error.flatten())

  const user = await prisma.user.findUnique({ where: { id: parsed.data }, select: { id: true, role: true } })
  if (!user) return apiError('NOT_FOUND', 'Compte introuvable', 404)
  if (user.role === 'admin') return apiError('FORBIDDEN', 'Compte admin non supprimable', 403)

  try {
    const { deletedLodgings, authDeleted } = await hardDeleteUserAccount(user.id)
    return NextResponse.json({
      message: 'Compte supprimé',
      deleted_lodgings: deletedLodgings,
      auth_deleted: authDeleted,
    })
  } catch (e) {
    if (e instanceof HardDeleteError) return apiError(e.code, e.message, e.status)
    throw e
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/unit/admin-users.delete-route.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/users/'[id]'/route.ts tests/unit/admin-users.delete-route.test.ts
git commit -m "feat(admin): DELETE user route (owner/merchant only)"
```

---

### Task 5: UI — bouton de suppression sur `/admin/users`

**Files:**
- Create: `src/features/admin/components/DeleteUserButton.tsx` (client)
- Modify: `src/app/admin/users/page.tsx` (rendre le bouton par ligne owner/merchant)
- Test: `tests/unit/admin-users.delete-button.test.tsx`

**Interfaces:**
- Consumes: route `DELETE /api/admin/users/{id}` (Task 4).
- Produces: `DeleteUserButton({ userId, email, role, lodgingCount }: { userId: string; email: string; role: string; lodgingCount: number })`.

**Comportement :** rien ne s'affiche si `role === 'admin'`. Sinon une icône corbeille ; au clic → `window.confirm("Supprimer définitivement {email} et ses {lodgingCount} logement(s) ? Action irréversible.")` ; si confirmé → `fetch(\`/api/admin/users/${userId}\`, { method: 'DELETE' })` ; à la réussite → `router.refresh()` ; en erreur → `alert` du message. État `pending` désactive le bouton.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/unit/admin-users.delete-button.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DeleteUserButton } from '@/features/admin/components/DeleteUserButton'

const refresh = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

describe('DeleteUserButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as unknown) = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    ;(global.confirm as unknown) = jest.fn().mockReturnValue(true)
  })

  it('renders nothing for admin accounts', () => {
    const { container } = render(
      <DeleteUserButton userId="u-1" email="a@b.c" role="admin" lodgingCount={0} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('calls the DELETE endpoint after confirmation and refreshes', async () => {
    render(<DeleteUserButton userId="u-1" email="a@b.c" role="owner" lodgingCount={2} />)
    fireEvent.click(screen.getByRole('button', { name: /supprimer/i }))
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/u-1', { method: 'DELETE' }))
    await waitFor(() => expect(refresh).toHaveBeenCalled())
  })

  it('does not call the endpoint when confirmation is cancelled', () => {
    ;(global.confirm as unknown) = jest.fn().mockReturnValue(false)
    render(<DeleteUserButton userId="u-1" email="a@b.c" role="owner" lodgingCount={2} />)
    fireEvent.click(screen.getByRole('button', { name: /supprimer/i }))
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/unit/admin-users.delete-button.test.tsx`
Expected: FAIL — module `DeleteUserButton` introuvable.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/features/admin/components/DeleteUserButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

type Props = { userId: string; email: string; role: string; lodgingCount: number }

export function DeleteUserButton({ userId, email, role, lodgingCount }: Props) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  if (role === 'admin') return null

  async function handleDelete() {
    const ok = window.confirm(
      `Supprimer définitivement ${email} et ses ${lodgingCount} logement(s) ? Action irréversible.`,
    )
    if (!ok) return
    setPending(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        alert(body?.message ?? 'Échec de la suppression')
        return
      }
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      aria-label={`Supprimer ${email}`}
      className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/unit/admin-users.delete-button.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Wire the button into the users table**

Ouvrir `src/app/admin/users/page.tsx`, lire le rendu de la liste des utilisateurs. Pour chaque ligne, ajouter une cellule/zone d'action rendant :

```tsx
<DeleteUserButton
  userId={user.id}
  email={user.email}
  role={user.role}
  lodgingCount={user.active_lodging_count ?? 0}
/>
```

Ajouter l'import en haut : `import { DeleteUserButton } from '@/features/admin/components/DeleteUserButton'`.
Vérifier que l'objet `user` de la boucle expose `id`, `email`, `role`, `active_lodging_count` (fournis par `getAdminUsers` — cf. `src/features/admin/queries/dashboard.ts`). Si `active_lodging_count` n'existe pas sur ce type, l'ajouter au select/type de `getAdminUsers` (compte des `lodgings` où `deleted_at: null`).

- [ ] **Step 6: Run the whole suite for this feature**

Run: `npx jest tests/unit/admin-users tests/unit/admin-hard-delete tests/unit/admin-lodgings`
Expected: toutes vertes.

- [ ] **Step 7: Commit**

```bash
git add src/features/admin/components/DeleteUserButton.tsx src/app/admin/users/page.tsx tests/unit/admin-users.delete-button.test.tsx
git commit -m "feat(admin): delete-user button on /admin/users"
```

---

### Task 6: UI — bouton de suppression sur `/admin/lodgings`

**Files:**
- Create: `src/features/admin/components/DeleteLodgingButton.tsx` (client)
- Modify: `src/app/admin/lodgings/page.tsx` (rendre le bouton par logement)
- Test: `tests/unit/admin-lodgings.delete-button.test.tsx`

**Interfaces:**
- Consumes: route `DELETE /api/admin/lodgings/{id}` (Task 3).
- Produces: `DeleteLodgingButton({ lodgingId, name }: { lodgingId: string; name: string })`.

**Comportement :** icône corbeille ; au clic → `window.confirm("Supprimer définitivement le logement {name} ? Action irréversible.")` ; si confirmé → `fetch(\`/api/admin/lodgings/${lodgingId}\`, { method: 'DELETE' })` ; réussite → `router.refresh()` ; erreur → `alert`. État `pending`.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/unit/admin-lodgings.delete-button.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DeleteLodgingButton } from '@/features/admin/components/DeleteLodgingButton'

const refresh = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))

describe('DeleteLodgingButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as unknown) = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    ;(global.confirm as unknown) = jest.fn().mockReturnValue(true)
  })

  it('calls the DELETE endpoint after confirmation and refreshes', async () => {
    render(<DeleteLodgingButton lodgingId="l-1" name="Le 305" />)
    fireEvent.click(screen.getByRole('button', { name: /supprimer/i }))
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/admin/lodgings/l-1', { method: 'DELETE' }))
    await waitFor(() => expect(refresh).toHaveBeenCalled())
  })

  it('does nothing when confirmation is cancelled', () => {
    ;(global.confirm as unknown) = jest.fn().mockReturnValue(false)
    render(<DeleteLodgingButton lodgingId="l-1" name="Le 305" />)
    fireEvent.click(screen.getByRole('button', { name: /supprimer/i }))
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/unit/admin-lodgings.delete-button.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/features/admin/components/DeleteLodgingButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

type Props = { lodgingId: string; name: string }

export function DeleteLodgingButton({ lodgingId, name }: Props) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    const ok = window.confirm(`Supprimer définitivement le logement ${name} ? Action irréversible.`)
    if (!ok) return
    setPending(true)
    try {
      const res = await fetch(`/api/admin/lodgings/${lodgingId}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        alert(body?.message ?? 'Échec de la suppression')
        return
      }
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      aria-label={`Supprimer ${name}`}
      className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/unit/admin-lodgings.delete-button.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Wire the button into the lodgings list**

Ouvrir `src/app/admin/lodgings/page.tsx`, repérer le rendu de chaque logement. Ajouter par ligne :

```tsx
<DeleteLodgingButton lodgingId={lodging.id} name={lodging.name} />
```

Import en haut : `import { DeleteLodgingButton } from '@/features/admin/components/DeleteLodgingButton'`. Adapter `lodging.id` / `lodging.name` aux noms de champs réellement exposés par la query de cette page.

- [ ] **Step 6: Run the full feature suite + typecheck**

Run: `npx jest tests/unit/admin-users tests/unit/admin-hard-delete tests/unit/admin-lodgings && npx tsc --noEmit`
Expected: tests verts, aucune erreur TS.

- [ ] **Step 7: Commit**

```bash
git add src/features/admin/components/DeleteLodgingButton.tsx src/app/admin/lodgings/page.tsx tests/unit/admin-lodgings.delete-button.test.tsx
git commit -m "feat(admin): delete-lodging button on /admin/lodgings"
```

---

## Self-Review

- **Spec coverage :** hard-delete (Tasks 1-2) ✓ ; user + logements ET logement seul (Tasks 2-4, 6) ✓ ; owners/merchants uniquement, 403 admin (Task 4) ✓ ; confirmation simple (Tasks 5-6) ✓ ; Supabase Auth (Task 2) ✓ ; toutes les tables listées dans la spec purgées (Tasks 1-2) ✓ ; tests (chaque task) ✓.
- **Placeholders :** aucun ; tout le code est fourni. Les seuls points « à adapter » (noms de champs des queries de page en Tasks 5-6) sont des vérifications d'intégration, pas des blancs de code.
- **Type consistency :** `hardDeleteLodging(tx, id)` / `hardDeleteUserAccount(id): { deletedLodgings, authDeleted }` / `HardDeleteError(code, status, message)` cohérents entre Tasks 1-4. Routes renvoient `deleted_lodgings` / `auth_deleted` (snake_case) — cohérent avec le test de la Task 4.
