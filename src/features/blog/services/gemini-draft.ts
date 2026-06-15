import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'
import { assertBlogGeminiScope } from '../lib/gemini-scope'

const BlogGenerationResultSchema = z.object({
  title: z.string().min(5).max(90),
  excerpt: z.string().min(40).max(220),
  content_markdown: z.string().min(300).max(20000),
  seo_title: z.string().min(30).max(70),
  seo_description: z.string().min(80).max(180),
})

export type BlogGenerationResult = z.infer<typeof BlogGenerationResultSchema>

export async function generateBlogDraftWithGemini(input: {
  brief: string
  verifiedFacts: string
  cityContext?: { name: string; slug: string } | null
}): Promise<BlogGenerationResult> {
  assertBlogGeminiScope({
    brief: input.brief,
    verifiedFacts: input.verifiedFacts,
  })

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
  return BlogGenerationResultSchema.parse(json)
}
