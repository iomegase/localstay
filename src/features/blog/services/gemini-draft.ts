import {
  GoogleGenerativeAI,
  type ResponseSchema,
  SchemaType,
  type Tool,
} from '@google/generative-ai'
import { z } from 'zod'
import { assertBlogGeminiScope } from '../lib/gemini-scope'

const TITLE_MIN_LENGTH = 5
const TITLE_MAX_LENGTH = 90
const EXCERPT_MIN_LENGTH = 40
const EXCERPT_MAX_LENGTH = 220
const MARKDOWN_MIN_LENGTH = 300
const MARKDOWN_MAX_LENGTH = 20000
const SEO_TITLE_MIN_LENGTH = 30
const SEO_TITLE_MAX_LENGTH = 70
const SEO_DESCRIPTION_MIN_LENGTH = 80
const SEO_DESCRIPTION_MAX_LENGTH = 180

const BlogGenerationResultSchema = z.object({
  title: z.string().min(TITLE_MIN_LENGTH, 'Le titre doit contenir entre 5 et 90 caractères.').max(TITLE_MAX_LENGTH, 'Le titre doit contenir entre 5 et 90 caractères.'),
  excerpt: z.string().min(EXCERPT_MIN_LENGTH, 'L’extrait doit contenir entre 40 et 220 caractères.').max(EXCERPT_MAX_LENGTH, 'L’extrait doit contenir entre 40 et 220 caractères.'),
  content_markdown: z.string().min(MARKDOWN_MIN_LENGTH, 'Le contenu Markdown doit contenir entre 300 et 20000 caractères.').max(MARKDOWN_MAX_LENGTH, 'Le contenu Markdown doit contenir entre 300 et 20000 caractères.'),
  seo_title: z.string().min(SEO_TITLE_MIN_LENGTH, 'Le SEO title doit contenir entre 30 et 70 caractères.').max(SEO_TITLE_MAX_LENGTH, 'Le SEO title doit contenir entre 30 et 70 caractères.'),
  seo_description: z.string().min(SEO_DESCRIPTION_MIN_LENGTH, 'La meta description doit contenir entre 80 et 180 caractères.').max(SEO_DESCRIPTION_MAX_LENGTH, 'La meta description doit contenir entre 80 et 180 caractères.'),
})

const BlogGenerationLooseSchema = z.object({
  title: z.string().optional(),
  excerpt: z.string().optional(),
  content_markdown: z.string(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
})

const BlogGenerationResponseSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    excerpt: { type: SchemaType.STRING },
    content_markdown: { type: SchemaType.STRING },
    seo_title: { type: SchemaType.STRING },
    seo_description: { type: SchemaType.STRING },
  },
  required: ['title', 'excerpt', 'content_markdown', 'seo_title', 'seo_description'],
}

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

function extractRequestedWordCount(brief: string): number | null {
  const match = brief.match(/\b(\d{2,4})\s*mots?\b/i)
  if (!match) return null

  const parsed = Number.parseInt(match[1], 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function countWords(input: string): number {
  return input
    .replace(/[`*_#[\]()>-]+/g, ' ')
    .split(/\s+/)
    .map(word => word.trim())
    .filter(word => word.length > 0)
    .length
}

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim()
}

function stripMarkdown(input: string): string {
  return normalizeWhitespace(
    input
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/!\[([^\]]*)]\([^)]+\)/g, ' $1 ')
      .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^[*-]\s+/gm, '')
      .replace(/[>*_~]/g, ' '),
  )
}

function smartTruncate(input: string, maxLength: number): string {
  const normalized = normalizeWhitespace(input)
  if (normalized.length <= maxLength) return normalized

  const segment = normalized.slice(0, maxLength)
  const punctuationIndexes = ['. ', '! ', '? ', '; ', ': ']
    .map(token => segment.lastIndexOf(token))
    .filter(index => index >= Math.floor(maxLength * 0.6))
  const punctuationIndex = punctuationIndexes.length > 0 ? Math.max(...punctuationIndexes) : -1

  if (punctuationIndex >= 0) {
    return segment.slice(0, punctuationIndex + 1).trim()
  }

  const lastSpace = segment.lastIndexOf(' ')
  if (lastSpace >= Math.floor(maxLength * 0.6)) {
    return segment.slice(0, lastSpace).trim()
  }

  return segment.trim()
}

function keepOrDeriveText(input: {
  value?: string
  fallback: string
  minLength: number
  maxLength: number
}): string {
  const candidate = normalizeWhitespace(input.value ?? '')
  if (candidate.length >= input.minLength && candidate.length <= input.maxLength) {
    return candidate
  }

  if (candidate.length > input.maxLength) {
    const shortened = smartTruncate(candidate, input.maxLength)
    if (shortened.length >= input.minLength) {
      return shortened
    }
  }

  const fallback = smartTruncate(input.fallback, input.maxLength)
  return fallback
}

function deriveTitle(rawTitle: string | undefined, plainContent: string): string {
  const normalizedTitle = normalizeWhitespace(rawTitle ?? '')
  if (normalizedTitle.length >= TITLE_MIN_LENGTH && normalizedTitle.length <= TITLE_MAX_LENGTH) {
    return normalizedTitle
  }

  const firstSentence = plainContent.match(/(.+?[.!?])(?:\s|$)/)?.[1] ?? plainContent
  return smartTruncate(firstSentence, TITLE_MAX_LENGTH)
}

function deriveExcerpt(rawExcerpt: string | undefined, plainContent: string): string {
  return keepOrDeriveText({
    value: rawExcerpt,
    fallback: plainContent,
    minLength: EXCERPT_MIN_LENGTH,
    maxLength: EXCERPT_MAX_LENGTH,
  })
}

function deriveSeoTitle(rawSeoTitle: string | undefined, title: string, plainContent: string): string {
  const normalizedSeoTitle = normalizeWhitespace(rawSeoTitle ?? '')
  if (
    normalizedSeoTitle.length >= SEO_TITLE_MIN_LENGTH &&
    normalizedSeoTitle.length <= SEO_TITLE_MAX_LENGTH
  ) {
    return normalizedSeoTitle
  }

  const normalizedTitle = normalizeWhitespace(title)
  const titleCandidates = [
    normalizedTitle,
    `${normalizedTitle} | Article Blog MyStay`,
    `${normalizedTitle} | Blog MyStay`,
    `${normalizedTitle} | MyStay`,
    smartTruncate(`${normalizedTitle} ${plainContent}`, SEO_TITLE_MAX_LENGTH),
  ]

  for (const candidate of titleCandidates) {
    const normalizedCandidate = normalizeWhitespace(candidate)
    if (
      normalizedCandidate.length >= SEO_TITLE_MIN_LENGTH &&
      normalizedCandidate.length <= SEO_TITLE_MAX_LENGTH
    ) {
      return normalizedCandidate
    }
  }

  return smartTruncate(`${normalizedTitle} ${plainContent}`, SEO_TITLE_MAX_LENGTH)
}

function deriveSeoDescription(
  rawSeoDescription: string | undefined,
  excerpt: string,
  plainContent: string,
): string {
  const fallback = excerpt.length >= SEO_DESCRIPTION_MIN_LENGTH ? excerpt : plainContent

  return keepOrDeriveText({
    value: rawSeoDescription,
    fallback,
    minLength: SEO_DESCRIPTION_MIN_LENGTH,
    maxLength: SEO_DESCRIPTION_MAX_LENGTH,
  })
}

function normalizeGeneratedDraft(json: unknown): BlogGenerationResult {
  const looseDraft = BlogGenerationLooseSchema.parse(json)
  const contentMarkdown = looseDraft.content_markdown.trim()
  const plainContent = stripMarkdown(contentMarkdown)
  const title = deriveTitle(looseDraft.title, plainContent)
  const excerpt = deriveExcerpt(looseDraft.excerpt, plainContent)
  const seoTitle = deriveSeoTitle(looseDraft.seo_title, title, plainContent)
  const seoDescription = deriveSeoDescription(looseDraft.seo_description, excerpt, plainContent)

  return BlogGenerationResultSchema.parse({
    title,
    excerpt,
    content_markdown: contentMarkdown,
    seo_title: seoTitle,
    seo_description: seoDescription,
  })
}

function assertRequestedWordCount(contentMarkdown: string, requestedWordCount: number | null) {
  if (!requestedWordCount) return

  const actualWordCount = countWords(contentMarkdown)
  const tolerance = Math.max(20, Math.round(requestedWordCount * 0.2))

  if (
    actualWordCount < requestedWordCount - tolerance ||
    actualWordCount > requestedWordCount + tolerance
  ) {
    throw new z.ZodError([
      {
        code: 'custom',
        path: ['content_markdown'],
        message: `Le contenu Markdown doit viser environ ${requestedWordCount} mots. Génération reçue: environ ${actualWordCount} mots.`,
      },
    ])
  }
}

function parseJsonResponse(rawText: string): string {
  const cleaned = rawText
    .trimStart()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  if (cleaned === '') {
    throw new SyntaxError('Gemini a renvoyé une réponse vide.')
  }

  try {
    JSON.parse(cleaned)
    return cleaned
  } catch {
    const extracted = extractFirstJsonObject(cleaned)
    if (!extracted) {
      throw new SyntaxError('Gemini n’a pas renvoyé un JSON exploitable.')
    }

    JSON.parse(extracted)
    return extracted
  }
}

function extractFirstJsonObject(input: string): string | null {
  const start = input.indexOf('{')
  if (start < 0) return null

  let depth = 0
  let inString = false
  let escaping = false

  for (let index = start; index < input.length; index += 1) {
    const character = input[index]

    if (inString) {
      if (escaping) {
        escaping = false
        continue
      }

      if (character === '\\') {
        escaping = true
        continue
      }

      if (character === '"') {
        inString = false
      }
      continue
    }

    if (character === '"') {
      inString = true
      continue
    }

    if (character === '{') {
      depth += 1
      continue
    }

    if (character === '}') {
      depth -= 1

      if (depth === 0) {
        return input.slice(start, index + 1)
      }
    }
  }

  return null
}

function extractGroundedSources(response: GroundingResponse): BlogGroundedSource[] {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []
  const deduped = new Map<string, BlogGroundedSource>()

  for (const chunk of chunks) {
    const url = chunk.web?.uri?.trim()
    const title = chunk.web?.title?.trim()

    if (!url || !title || deduped.has(url)) {
      continue
    }

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
    model: process.env.GEMINI_MODEL ?? 'gemini-3.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: BlogGenerationResponseSchema,
    },
    tools: [{ googleSearch: {} } as unknown as Tool],
  })
  const prompt = [
    'Tu assistes la rédaction du blog MyStay.',
    'N\'invente aucun fait. Refuse toute coordonnée, distance, durée, prix, disponibilité, horaire temps réel ou donnée personnelle.',
    'Utilise Google Search uniquement pour grounding et citations de travail ; les faits restent soumis à revue Admin.',
    'Retourne uniquement du JSON strict avec les clés: title, excerpt, content_markdown, seo_title, seo_description.',
    'Respecte strictement ces longueurs: title 5-90 caractères, excerpt 40-220 caractères, seo_title 30-70 caractères, seo_description 80-180 caractères.',
    requestedWordCount
      ? `Le corps de l'article en Markdown doit viser environ ${requestedWordCount} mots.`
      : 'Le corps de l\'article en Markdown doit être développé et structuré en plusieurs paragraphes utiles.',
    input.cityContext ? `Ville rattachée: ${input.cityContext.name} (${input.cityContext.slug})` : 'Aucune ville rattachée.',
    `Brief admin:\n${input.brief}`,
    `Faits vérifiés:\n${input.verifiedFacts}`,
  ].join('\n\n')

  const result = await model.generateContent(prompt)
  let rawText: string

  try {
    rawText = result.response.text()
  } catch (error) {
    throw new SyntaxError(
      error instanceof Error
        ? error.message
        : 'Gemini n’a pas renvoyé de contenu textuel exploitable.',
    )
  }

  const cleaned = parseJsonResponse(rawText)
  const json = JSON.parse(cleaned) as unknown
  const draft = normalizeGeneratedDraft(json)
  assertRequestedWordCount(draft.content_markdown, requestedWordCount)

  return {
    draft,
    sources: extractGroundedSources(result.response as unknown as GroundingResponse),
  }
}
