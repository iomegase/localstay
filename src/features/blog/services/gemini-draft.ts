import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'
import { assertBlogGeminiScope } from '../lib/gemini-scope'

const BlogGenerationResultSchema = z.object({
  title: z.string().min(5, 'Le titre doit contenir entre 5 et 90 caractères.').max(90, 'Le titre doit contenir entre 5 et 90 caractères.'),
  excerpt: z.string().min(40, 'L’extrait doit contenir entre 40 et 220 caractères.').max(220, 'L’extrait doit contenir entre 40 et 220 caractères.'),
  content_markdown: z.string().min(300, 'Le contenu Markdown doit contenir entre 300 et 20000 caractères.').max(20000, 'Le contenu Markdown doit contenir entre 300 et 20000 caractères.'),
  seo_title: z.string().min(30, 'Le SEO title doit contenir entre 30 et 70 caractères.').max(70, 'Le SEO title doit contenir entre 30 et 70 caractères.'),
  seo_description: z.string().min(80, 'La meta description doit contenir entre 80 et 180 caractères.').max(180, 'La meta description doit contenir entre 80 et 180 caractères.'),
})

export type BlogGenerationResult = z.infer<typeof BlogGenerationResultSchema>

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

export async function generateBlogDraftWithGemini(input: {
  brief: string
  verifiedFacts: string
  cityContext?: { name: string; slug: string } | null
}): Promise<BlogGenerationResult> {
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
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL ?? 'gemini-flash-latest' })
  const prompt = [
    'Tu assistes la rédaction du blog MyStay.',
    'N\'invente aucun fait. Refuse toute coordonnée, distance, durée, prix, disponibilité, horaire temps réel ou donnée personnelle.',
    'Retourne uniquement du JSON strict avec les clés: title, excerpt, content_markdown, seo_title, seo_description.',
    requestedWordCount
      ? `Le corps de l'article en Markdown doit viser environ ${requestedWordCount} mots.`
      : 'Le corps de l\'article en Markdown doit être développé et structuré en plusieurs paragraphes utiles.',
    input.cityContext ? `Ville rattachée: ${input.cityContext.name} (${input.cityContext.slug})` : 'Aucune ville rattachée.',
    `Brief admin:\n${input.brief}`,
    `Faits vérifiés:\n${input.verifiedFacts}`,
  ].join('\n\n')

  const result = await model.generateContent(prompt)
  const rawText = result.response.text()
  const cleaned = rawText
    .trimStart()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  const json = JSON.parse(cleaned) as unknown
  const parsed = BlogGenerationResultSchema.parse(json)
  assertRequestedWordCount(parsed.content_markdown, requestedWordCount)
  return parsed
}
