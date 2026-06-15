# Blog Gemini Grounding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing admin blog Gemini generation flow to enable Google Search grounding and return additive `text` plus `sources` fields without breaking the persisted `BlogGenerationDraft` workflow.

**Architecture:** Update the approved spec and ADR first, then keep the current route shape by enriching the service and query layers rather than replacing the API contract. `src/app/api/admin/blog/[id]/generate/route.ts` should remain a thin pass-through while `src/features/blog/services/gemini-draft.ts` extracts grounded sources and `src/features/blog/queries/admin-blog.ts` merges those sources into the persisted draft response.

**Tech Stack:** Next.js App Router, TypeScript, Jest, Zod, `@google/generative-ai`, Prisma

---

### Task 1: Update Governing Docs Before Touching `src/`

**Files:**
- Modify: `specs/features/029-blog-editorial/spec.md`
- Modify: `docs/DAT/adr/ADR-010-gemini-blog-editorial-assistance.md`

- [ ] **Step 1: Update the approved spec to authorize grounding and document the response contract**

Insert the following changes into `specs/features/029-blog-editorial/spec.md`:

```md
- **AC-04-01**: Given un article `draft` et un brief Admin valide, When l'Admin demande une generation Gemini, Then Gemini retourne une proposition Markdown, title, excerpt, SEO title, SEO description, ainsi qu'un payload `text` et `sources` issu du grounding Google Search quand disponible.
- **AC-04-02**: Given la generation reussit, When la reponse est recue, Then elle est validee avec Zod et sauvegardee comme `BlogGenerationDraft` sans modifier automatiquement l'article publie, tandis que `sources` sont renvoyees au frontend sans persistance en base dans cette premiere passe.
```

Replace the generate response schema and add the new grounded source schemas:

```yaml
  /api/admin/blog/{id}/generate:
    post:
      summary: "Generer un brouillon blog avec Gemini"
      tags: [blog-admin]
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [brief, verified_facts]
              properties:
                brief: { type: string, minLength: 20, maxLength: 4000 }
                verified_facts: { type: string, minLength: 20, maxLength: 8000 }
      responses:
        "200":
          description: Brouillon genere
          content:
            application/json:
              schema: { $ref: "#/components/schemas/BlogGenerationDraftResponse" }
        "400": { $ref: "#/components/responses/BadRequest" }
        "503": { $ref: "#/components/responses/ServiceUnavailable" }

components:
  schemas:
    BlogGroundedSource:
      type: object
      required: [title, url]
      properties:
        title: { type: string }
        url: { type: string, format: uri }
    BlogGenerationDraft:
      type: object
      required: [id, status, provider]
      properties:
        id: { type: string, format: uuid }
        status: { type: string, enum: [requested, generated, accepted, rejected, failed] }
        provider: { type: string }
        suggestion_title: { type: string, nullable: true }
        suggestion_excerpt: { type: string, nullable: true }
        suggestion_markdown: { type: string, nullable: true }
        suggestion_seo_title: { type: string, nullable: true }
        suggestion_seo_description: { type: string, nullable: true }
    BlogGenerationDraftResponse:
      allOf:
        - $ref: "#/components/schemas/BlogGenerationDraft"
        - type: object
          required: [text, sources]
          properties:
            text: { type: string }
            sources:
              type: array
              items: { $ref: "#/components/schemas/BlogGroundedSource" }
```

- [ ] **Step 2: Verify the spec now contains the new grounding language and schemas**

Run:

```bash
rg -n "google Search|grounding|BlogGenerationDraftResponse|BlogGroundedSource|text:|sources:" specs/features/029-blog-editorial/spec.md
```

Expected: matches for the updated AC-04-01 / AC-04-02 wording and the two new response schemas.

- [ ] **Step 3: Update ADR-010 to authorize server-side Google Search grounding for blog assistance**

Insert the following ADR deltas into `docs/DAT/adr/ADR-010-gemini-blog-editorial-assistance.md`:

```md
Usages autorises :

6. activer Google Search grounding cote serveur pour recuperer des sources web utilisees dans la generation d'un brouillon blog, tant que ces sources restent soumises a revue Admin.

Usages interdits :

- publier automatiquement des faits issus de sources externes sans revue Admin ;
- presenter une source grounded comme un fait valide MyStay sans verification humaine ;
- stocker ou reutiliser des sources grounded comme verite produit hors du workflow editorial valide.

Consequences :

- la route `POST /api/admin/blog/{id}/generate` peut retourner `text` et `sources` derives du grounding, en plus du `BlogGenerationDraft` persiste ;
- les sources peuvent etre renvoyees au frontend sans etre stockees en base dans cette premiere passe ;
- la revue Admin reste obligatoire avant application du brouillon et publication.
```

- [ ] **Step 4: Verify the ADR now documents the grounding rules**

Run:

```bash
rg -n "grounding|sources web|text|sources|revue Admin" docs/DAT/adr/ADR-010-gemini-blog-editorial-assistance.md
```

Expected: matches for the new allowed use, prohibited use, and consequences bullets.

- [ ] **Step 5: Commit the doc-first contract update**

```bash
git add specs/features/029-blog-editorial/spec.md docs/DAT/adr/ADR-010-gemini-blog-editorial-assistance.md
git commit -m "docs(blog): authorize Gemini grounding for admin drafts"
```

### Task 2: Add Grounding Test Coverage and Implement the Gemini Service

**Files:**
- Modify: `tests/unit/blog.AC-04-01.gemini-draft-service.test.ts`
- Modify: `src/features/blog/services/gemini-draft.ts`

- [ ] **Step 1: Write the failing unit test for grounded sources and `googleSearch` activation**

Append this test to `tests/unit/blog.AC-04-01.gemini-draft-service.test.ts` and update existing assertions to use the new `{ draft, sources }` return shape:

```ts
it('returns deduplicated grounded sources and enables googleSearch', async () => {
  mockGenerateContent.mockResolvedValue({
    response: {
      text: () =>
        JSON.stringify({
          title: 'Saint-Gervais en 150 mots',
          excerpt:
            'Une synthese editoriale locale construite a partir du brief admin et de sources grounded.',
          content_markdown: 'mot '.repeat(150).trim(),
          seo_title: 'Saint-Gervais en 150 mots | MyStay',
          seo_description:
            'Une version grounded de Saint-Gervais avec sources de generation et angle editorial local.',
        }),
      candidates: [
        {
          groundingMetadata: {
            groundingChunks: [
              { web: { uri: 'https://www.saintgervais.com/article', title: 'Office de tourisme' } },
              { web: { uri: 'https://www.saintgervais.com/article', title: 'Office de tourisme (dup)' } },
              { web: { uri: 'https://www.mystay.example/blog-facts', title: 'Faits verifies MyStay' } },
            ],
          },
        },
      ],
    },
  })

  const result = await generateBlogDraftWithGemini({
    brief: 'Rédige un article de 150 mots sur Saint-Gervais.',
    verifiedFacts:
      'Les thermes, les restaurants verifies et les sentiers publics sont deja valides dans MyStay.',
    cityContext: { name: 'Saint-Gervais', slug: 'saint-gervais' },
  })

  expect(mockGetGenerativeModel).toHaveBeenCalledWith(
    expect.objectContaining({
      model: 'gemini-test-model',
      tools: [expect.objectContaining({ googleSearch: {} })],
    }),
  )

  expect(result).toMatchObject({
    draft: {
      title: 'Saint-Gervais en 150 mots',
      seo_title: 'Saint-Gervais en 150 mots | MyStay',
    },
    sources: [
      { title: 'Office de tourisme', url: 'https://www.saintgervais.com/article' },
      { title: 'Faits verifies MyStay', url: 'https://www.mystay.example/blog-facts' },
    ],
  })
})
```

Also update the two existing tests so they read `result.draft` instead of the old direct return value.

- [ ] **Step 2: Run the unit test to verify it fails on the current service contract**

Run:

```bash
npm test -- --runTestsByPath tests/unit/blog.AC-04-01.gemini-draft-service.test.ts
```

Expected: FAIL because `generateBlogDraftWithGemini(...)` still returns the plain draft object and does not expose `sources`.

- [ ] **Step 3: Implement grounded source extraction in `src/features/blog/services/gemini-draft.ts`**

Refactor the service to match this shape and reuse the same `googleSearch` pattern already used by the trails service:

```ts
import { GoogleGenerativeAI, type Tool } from '@google/generative-ai'
import { z } from 'zod'
import { assertBlogGeminiScope } from '../lib/gemini-scope'

export type BlogGenerationResult = z.infer<typeof BlogGenerationResultSchema>

export type BlogGroundedSource = {
  title: string
  url: string
}

export type BlogGenerationWithSources = {
  draft: BlogGenerationResult
  sources: BlogGroundedSource[]
}

type GroundingChunk = {
  web?: {
    uri?: string
    title?: string
  }
}

type GroundingResponse = {
  candidates?: Array<{
    groundingMetadata?: {
      groundingChunks?: GroundingChunk[]
    }
  }>
}

function parseJsonResponse(rawText: string): string {
  return rawText
    .trimStart()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()
}

function extractGroundedSources(response: GroundingResponse): BlogGroundedSource[] {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []
  const deduped = new Map<string, BlogGroundedSource>()

  for (const chunk of chunks) {
    const url = chunk.web?.uri?.trim()
    const title = chunk.web?.title?.trim()
    if (!url || !title || deduped.has(url)) continue
    deduped.set(url, { title, url })
  }

  return [...deduped.values()]
}

export async function generateBlogDraftWithGemini(input: {
  brief: string
  verifiedFacts: string
  cityContext?: { name: string; slug: string } | null
}): Promise<BlogGenerationWithSources> {
  assertBlogGeminiScope({
    brief: input.brief,
    verifiedFacts: input.verifiedFacts,
  })

  const requestedWordCount = extractRequestedWordCount(input.brief)
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    const error = new Error('GEMINI_UNAVAILABLE')
    Reflect.set(error, 'status', 503)
    throw error
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? 'gemini-flash-latest',
    tools: [{ googleSearch: {} } as unknown as Tool],
  })

  const prompt = [
    'Tu assistes la rédaction du blog MyStay.',
    'N\\'invente aucun fait. Refuse toute coordonnée, distance, durée, prix, disponibilité, horaire temps réel ou donnée personnelle.',
    'Utilise Google Search uniquement pour grounding et citations de travail ; les faits restent soumis à revue Admin.',
    'Retourne uniquement du JSON strict avec les clés: title, excerpt, content_markdown, seo_title, seo_description.',
    requestedWordCount
      ? `Le corps de l'article en Markdown doit viser environ ${requestedWordCount} mots.`
      : 'Le corps de l\\'article en Markdown doit être développé et structuré en plusieurs paragraphes utiles.',
    input.cityContext ? `Ville rattachée: ${input.cityContext.name} (${input.cityContext.slug})` : 'Aucune ville rattachée.',
    `Brief admin:\\n${input.brief}`,
    `Faits vérifiés:\\n${input.verifiedFacts}`,
  ].join('\\n\\n')

  const result = await model.generateContent(prompt)
  const cleaned = parseJsonResponse(result.response.text())
  const draft = BlogGenerationResultSchema.parse(JSON.parse(cleaned))
  assertRequestedWordCount(draft.content_markdown, requestedWordCount)

  return {
    draft,
    sources: extractGroundedSources(result.response as GroundingResponse),
  }
}
```

Note: keep invalid or missing grounding metadata non-fatal. The draft must still succeed with `sources: []`.

- [ ] **Step 4: Run the service unit test to verify the new contract passes**

Run:

```bash
npm test -- --runTestsByPath tests/unit/blog.AC-04-01.gemini-draft-service.test.ts
```

Expected: PASS with all three service tests green, including grounded source deduplication.

- [ ] **Step 5: Commit the grounded Gemini service**

```bash
git add tests/unit/blog.AC-04-01.gemini-draft-service.test.ts src/features/blog/services/gemini-draft.ts
git commit -m "feat(blog): extract grounded sources from Gemini drafts"
```

### Task 3: Enrich the Persisted Draft Response Without Changing the Route Shape

**Files:**
- Modify: `tests/integration/blog.AC-04-02.generation-draft.test.ts`
- Modify: `tests/contract/blog.AC-04-01.gemini-generate.test.ts`
- Modify: `src/features/blog/queries/admin-blog.ts`

- [ ] **Step 1: Write failing integration and contract tests for additive `text` and `sources`**

Update `tests/integration/blog.AC-04-02.generation-draft.test.ts` so the mocked service now returns `{ draft, sources }` and the query result must include additive `text` and `sources`:

```ts
mockGenerateBlogDraftWithGemini.mockResolvedValue({
  draft: {
    title: 'Week-end à Saint-Gervais',
    excerpt: 'Une proposition éditoriale pour préparer un séjour avec des repères utiles et fiables.',
    content_markdown: 'a'.repeat(320),
    seo_title: 'Week-end à Saint-Gervais — Guide local MyStay',
    seo_description:
      'Préparez un week-end à Saint-Gervais avec un angle éditorial local, des repères utiles et un parcours clair.',
  },
  sources: [
    { title: 'Office de tourisme', url: 'https://www.saintgervais.com/article' },
  ],
})

mockBlogGenerationDraftCreate.mockResolvedValue({
  id: 'generation-1',
  status: 'generated',
  provider: 'gemini',
  suggestion_title: 'Week-end à Saint-Gervais',
  suggestion_excerpt: 'Une proposition éditoriale pour préparer un séjour avec des repères utiles et fiables.',
  suggestion_markdown: 'a'.repeat(320),
  suggestion_seo_title: 'Week-end à Saint-Gervais — Guide local MyStay',
  suggestion_seo_description:
    'Préparez un week-end à Saint-Gervais avec un angle éditorial local, des repères utiles et un parcours clair.',
})

expect(result).toMatchObject({
  id: 'generation-1',
  status: 'generated',
  provider: 'gemini',
  text: 'a'.repeat(320),
  sources: [{ title: 'Office de tourisme', url: 'https://www.saintgervais.com/article' }],
})
```

Update `tests/contract/blog.AC-04-01.gemini-generate.test.ts` so the mocked query return includes the new additive fields:

```ts
mockGenerateBlogDraft.mockResolvedValue({
  id: 'generation-1',
  status: 'generated',
  provider: 'gemini',
  suggestion_title: 'Week-end à Saint-Gervais',
  suggestion_markdown: 'a'.repeat(320),
  text: 'a'.repeat(320),
  sources: [{ title: 'Office de tourisme', url: 'https://www.saintgervais.com/article' }],
})

await expect(response.json()).resolves.toMatchObject({
  id: 'generation-1',
  status: 'generated',
  text: 'a'.repeat(320),
  sources: [{ title: 'Office de tourisme', url: 'https://www.saintgervais.com/article' }],
})
```

- [ ] **Step 2: Run both tests to verify the current query still fails the additive contract**

Run:

```bash
npm test -- --runTestsByPath tests/integration/blog.AC-04-02.generation-draft.test.ts tests/contract/blog.AC-04-01.gemini-generate.test.ts
```

Expected: FAIL because `generateBlogDraft(...)` still expects the old service shape and does not return `text` or `sources`.

- [ ] **Step 3: Implement the additive response in `src/features/blog/queries/admin-blog.ts`**

Refactor `generateBlogDraft(...)` so it persists the draft exactly as before, then merges `text` plus `sources` into the returned object:

```ts
export async function generateBlogDraft(articleId: string, input: BlogGenerateInput, adminId: string) {
  const article = await prisma.blogArticle.findFirst({
    where: { id: articleId, deleted_at: null },
    select: {
      id: true,
      city: { select: { name: true, slug: true } },
    },
  })
  if (!article) throw new ApiBlogError('NOT_FOUND', 404)

  const sourceHash = Buffer.from(`${input.brief}\n${input.verified_facts}`).toString('base64')

  try {
    const suggestion = await generateBlogDraftWithGemini({
      brief: input.brief,
      verifiedFacts: input.verified_facts,
      cityContext: article.city,
    })

    const createdDraft = await prisma.blogGenerationDraft.create({
      data: {
        article_id: articleId,
        admin_id: adminId,
        provider: 'gemini',
        status: 'generated',
        source_hash: sourceHash,
        brief: input.brief,
        verified_facts: input.verified_facts,
        city_context: article.city ?? undefined,
        generated_at: new Date(),
        suggestion_title: suggestion.draft.title,
        suggestion_excerpt: suggestion.draft.excerpt,
        suggestion_markdown: suggestion.draft.content_markdown,
        suggestion_seo_title: suggestion.draft.seo_title,
        suggestion_seo_description: suggestion.draft.seo_description,
      },
      select: {
        id: true,
        status: true,
        provider: true,
        suggestion_title: true,
        suggestion_excerpt: true,
        suggestion_markdown: true,
        suggestion_seo_title: true,
        suggestion_seo_description: true,
      },
    })

    return {
      ...createdDraft,
      text: createdDraft.suggestion_markdown ?? '',
      sources: suggestion.sources,
    }
  } catch (error) {
    if (error instanceof ApiBlogError) throw error

    if (error instanceof ZodError) {
      throw new ApiBlogError(
        'GEMINI_INVALID_RESPONSE',
        502,
        { fieldErrors: error.flatten().fieldErrors },
        'La proposition Gemini reçue est invalide.',
      )
    }

    const code =
      typeof (error as { code?: unknown })?.code === 'string'
        ? (error as { code: string }).code
        : error instanceof Error
          ? error.message
          : 'GEMINI_UNAVAILABLE'
    const status =
      typeof (error as { status?: unknown })?.status === 'number'
        ? (error as { status: number }).status
        : code === 'FORBIDDEN_SCOPE'
          ? 400
          : 503

    if (code === 'FORBIDDEN_SCOPE') {
      throw new ApiBlogError(
        'FORBIDDEN_SCOPE',
        400,
        {
          fieldErrors: {
            brief: ['Le brief ou les faits vérifiés sortent du périmètre Gemini autorisé.'],
            verified_facts: ['Le brief ou les faits vérifiés sortent du périmètre Gemini autorisé.'],
          },
        },
        'Le brief Gemini contient une demande hors périmètre.',
      )
    }

    throw new ApiBlogError(
      code,
      status,
      {},
      code === 'GEMINI_UNAVAILABLE' ? 'Gemini indisponible' : 'Erreur Gemini',
    )
  }
}
```

Do not change `src/app/api/admin/blog/[id]/generate/route.ts`; its existing `NextResponse.json(draft)` pass-through is already the desired route behavior once the query return value is enriched.

- [ ] **Step 4: Run the integration and contract tests to verify the additive payload passes**

Run:

```bash
npm test -- --runTestsByPath tests/integration/blog.AC-04-02.generation-draft.test.ts tests/contract/blog.AC-04-01.gemini-generate.test.ts
```

Expected: PASS with the persisted draft still created and the HTTP payload now exposing `text` plus `sources`.

- [ ] **Step 5: Commit the additive query payload**

```bash
git add tests/integration/blog.AC-04-02.generation-draft.test.ts tests/contract/blog.AC-04-01.gemini-generate.test.ts src/features/blog/queries/admin-blog.ts
git commit -m "feat(blog): return grounded draft sources to admin API"
```

### Task 4: Update Traceability and Run the Final Targeted Suite

**Files:**
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Update traceability rows for AC-04-01 and AC-04-02**

Replace the two existing rows in the `029 — Blog Editorial` section with this wording:

```md
| AC-04-01 | Gemini retourne une proposition structurée `title/excerpt/markdown/SEO` avec payload grounded `text/sources` | `src/app/api/admin/blog/[id]/generate/route.ts`<br>`src/features/blog/services/gemini-draft.ts`<br>`src/features/blog/queries/admin-blog.ts` | `tests/contract/blog.AC-04-01.gemini-generate.test.ts`<br>`tests/unit/blog.AC-04-01.gemini-draft-service.test.ts` | ✅ done |
| AC-04-02 | La génération Gemini persistée crée un `BlogGenerationDraft` sans modifier l'article et renvoie les sources grounded au frontend | `src/features/blog/queries/admin-blog.ts`<br>`src/features/blog/services/gemini-draft.ts` | `tests/integration/blog.AC-04-02.generation-draft.test.ts` | ✅ done |
```

- [ ] **Step 2: Run the final targeted verification suite**

Run:

```bash
npm test -- --runTestsByPath tests/unit/blog.AC-04-01.gemini-draft-service.test.ts tests/integration/blog.AC-04-02.generation-draft.test.ts tests/contract/blog.AC-04-01.gemini-generate.test.ts tests/contract/blog.AC-04-04.gemini-unavailable.test.ts
```

Expected: PASS on all four files, with grounded-source behavior covered and legacy Gemini-unavailable behavior unchanged.

- [ ] **Step 3: Inspect the diff before shipping**

Run:

```bash
git diff -- specs/features/029-blog-editorial/spec.md docs/DAT/adr/ADR-010-gemini-blog-editorial-assistance.md src/features/blog/services/gemini-draft.ts src/features/blog/queries/admin-blog.ts tests/unit/blog.AC-04-01.gemini-draft-service.test.ts tests/integration/blog.AC-04-02.generation-draft.test.ts tests/contract/blog.AC-04-01.gemini-generate.test.ts docs/traceability-matrix.md
```

Expected: only the approved spec/ADR changes, the additive service/query contract, the three targeted tests, and the traceability row wording changes.

- [ ] **Step 4: Commit traceability and final verification metadata**

```bash
git add docs/traceability-matrix.md
git commit -m "docs(blog): refresh grounding traceability"
```
