# iPhone Photo EXIF Orientation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the visible portrait orientation of iPhone JPEG photos when the shared server upload service converts them to WebP.

**Architecture:** Extend the approved Guide Customization contract, then test the real `uploadGuideImage` boundary by generating JPEG buffers with Sharp and inspecting the buffer passed to mocked Supabase Storage. Apply Sharp’s metadata-driven auto-orientation in the existing conversion pipeline; do not change APIs, storage paths, UI layout, or existing stored objects.

**Tech Stack:** TypeScript, Next.js 16, Sharp 0.34, Jest, Supabase Storage.

---

## File map

- Modify `specs/features/012-guide-customization/spec.md`: add the approved EXIF behavior to the feature contract.
- Create `tests/unit/guide-customization.AC-04-05.image-exif-orientation.test.ts`: exercise the real image conversion and capture the uploaded bytes.
- Modify `src/shared/lib/image-upload-service.ts`: auto-orient converted image pixels before WebP encoding.
- Modify `docs/traceability-matrix.md`: link the new acceptance criterion to source and test.

### Task 1: Extend the approved feature contract

**Files:**
- Modify: `specs/features/012-guide-customization/spec.md`

- [ ] **Step 1: Add the acceptance criterion**

Append this criterion to US-04:

```markdown
- **AC-04-05**: Given une photo JPEG dont l’orientation d’affichage est portée par les métadonnées EXIF, When l’Owner l’importe, Then le serveur applique cette orientation aux pixels avant la conversion WebP et l’image stockée conserve le cadrage visible attendu.
```

- [ ] **Step 2: Complete the upload business rule**

Replace BR-13 with:

```markdown
- **BR-13**: L'upload image Owner est autorisé pour les photos de logement. Les images sont validées côté serveur, limitées à 5 Mo et stockées dans le bucket `guide-photos`. Lorsqu’une image est convertie en WebP, son orientation EXIF est appliquée aux pixels avant l’encodage afin que le fichier stocké ne dépende plus de cette métadonnée.
```

- [ ] **Step 3: Add the acceptance-test mapping**

Add to the Acceptance Tests table:

```markdown
| AC-04-05 | Orientation EXIF appliquée avant conversion WebP | unit |
```

- [ ] **Step 4: Check the spec diff and commit it**

Run:

```bash
git diff --check -- specs/features/012-guide-customization/spec.md
git diff -- specs/features/012-guide-customization/spec.md
git add specs/features/012-guide-customization/spec.md
git commit -m "docs(guide): specify EXIF orientation normalization"
```

Expected: only AC-04-05, BR-13 and its test mapping change; the spec remains `status: approved`.

### Task 2: Reproduce the iPhone orientation loss with a failing test

**Files:**
- Create: `tests/unit/guide-customization.AC-04-05.image-exif-orientation.test.ts`

- [ ] **Step 1: Write the Supabase boundary test**

Create the test with this structure:

```typescript
import sharp from 'sharp'
import { uploadGuideImage } from '@/shared/lib/image-upload-service'

const mockUpload = jest.fn()
const mockGetPublicUrl = jest.fn()

jest.mock('@/shared/lib/supabase', () => ({
  createSupabaseServer: () => ({
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  }),
}))

function jpegFile(buffer: Buffer): File {
  return new File([buffer], 'iphone-photo.jpg', { type: 'image/jpeg' })
}

describe('guide customization AC-04-05 — EXIF image orientation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUpload.mockResolvedValue({ data: { path: 'lodgings/test/photo.webp' }, error: null })
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.test/photo.webp' } })
  })

  it('applies EXIF orientation to pixels before uploading WebP', async () => {
    const input = await sharp({
      create: { width: 120, height: 240, channels: 3, background: '#ff0000' },
    }).withMetadata({ orientation: 6 }).jpeg().toBuffer()

    await expect(uploadGuideImage(jpegFile(input), 'lodgings/test')).resolves.toEqual({
      ok: true,
      url: 'https://cdn.test/photo.webp',
    })

    const uploaded = mockUpload.mock.calls[0]?.[1] as Buffer
    const metadata = await sharp(uploaded).metadata()
    expect(metadata).toMatchObject({ width: 240, height: 120, format: 'webp' })
    expect(metadata.orientation).toBeUndefined()
  })

  it('keeps the pixel dimensions of a JPEG without EXIF rotation', async () => {
    const input = await sharp({
      create: { width: 120, height: 240, channels: 3, background: '#ff0000' },
    }).jpeg().toBuffer()

    await uploadGuideImage(jpegFile(input), 'lodgings/test')

    const uploaded = mockUpload.mock.calls[0]?.[1] as Buffer
    await expect(sharp(uploaded).metadata()).resolves.toMatchObject({
      width: 120,
      height: 240,
      format: 'webp',
    })
  })
})
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
npm test -- --runInBand tests/unit/guide-customization.AC-04-05.image-exif-orientation.test.ts
```

Expected: the EXIF case fails because the uploaded WebP is `120 × 240` instead of `240 × 120`; the non-oriented JPEG case passes.

- [ ] **Step 3: Commit the regression test**

```bash
git add tests/unit/guide-customization.AC-04-05.image-exif-orientation.test.ts
git commit -m "test(guide): reproduce iPhone EXIF orientation loss"
```

### Task 3: Apply EXIF orientation before WebP encoding

**Files:**
- Modify: `src/shared/lib/image-upload-service.ts:20-22`
- Test: `tests/unit/guide-customization.AC-04-05.image-exif-orientation.test.ts`

- [ ] **Step 1: Implement the minimal conversion change**

Replace the conversion expression with:

```typescript
const body = format.convert
  ? await sharp(input).rotate().webp({ quality: 82 }).toBuffer()
  : input
```

Sharp’s argument-less `rotate()` applies the EXIF orientation to pixels and removes the dependency on the orientation tag in the generated WebP.

- [ ] **Step 2: Run the focused test and confirm GREEN**

Run:

```bash
npm test -- --runInBand tests/unit/guide-customization.AC-04-05.image-exif-orientation.test.ts
```

Expected: 2 tests pass.

- [ ] **Step 3: Run the existing upload and route regression tests**

Run:

```bash
npm test -- --runInBand tests/unit/image-upload-format.test.ts tests/contract/lodging-showcase.owner-api.test.ts tests/contract/blog.AC-05-01.upload-cover.test.ts tests/contract/blog.AC-05-02.upload-gallery.test.ts
```

Expected: all selected suites pass with no new warnings.

- [ ] **Step 4: Commit the implementation**

```bash
git add src/shared/lib/image-upload-service.ts
git commit -m "fix(images): normalize EXIF orientation before WebP conversion"
```

### Task 4: Traceability and final verification

**Files:**
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Add the traceability row in the 012 section**

Add:

```markdown
| AC-04-05/BR-13 | Orientation EXIF appliquée aux pixels avant conversion WebP des images Owner | `src/shared/lib/image-upload-service.ts` | `tests/unit/guide-customization.AC-04-05.image-exif-orientation.test.ts` | ✅ done |
```

- [ ] **Step 2: Run static verification**

```bash
npm run lint
npm run build
git diff --check
```

Expected: lint and production build succeed; no whitespace errors.

- [ ] **Step 3: Re-run the complete focused verification set**

```bash
npm test -- --runInBand tests/unit/guide-customization.AC-04-05.image-exif-orientation.test.ts tests/unit/image-upload-format.test.ts tests/contract/lodging-showcase.owner-api.test.ts tests/contract/blog.AC-05-01.upload-cover.test.ts tests/contract/blog.AC-05-02.upload-gallery.test.ts
```

Expected: every selected test passes.

- [ ] **Step 4: Confirm unrelated work remains untouched**

```bash
git status --short
```

Expected: the pre-existing deletions of `public/imageOpenGraph.png` and `public/logo.png` may remain; no unrelated file is staged.

- [ ] **Step 5: Commit traceability**

```bash
git add docs/traceability-matrix.md
git commit -m "docs: trace EXIF orientation normalization"
```
