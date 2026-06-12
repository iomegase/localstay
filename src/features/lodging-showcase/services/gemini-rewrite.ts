import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'
import { buildLodgingRewritePrompt } from '../lib/rewrite-prompt'

const RewriteSchema = z.object({
  short_description: z.string().min(40).max(180),
  description: z.string().min(200).max(4000),
  seo_title: z.string().min(30).max(70),
  seo_description: z.string().min(80).max(180),
})

export type LodgingRewriteResult = z.infer<typeof RewriteSchema>

export async function generateLodgingRewrite(input: {
  sourceText: string
  facts: {
    cityName: string
    maxGuests: number
    amenities: string[]
  }
}): Promise<LodgingRewriteResult> {
  const apiKey = process.env.GEMINI_API_KEY
  const modelName = process.env.GEMINI_MODEL ?? 'gemini-flash-latest'

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not set')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: modelName })
  const prompt = buildLodgingRewritePrompt(input)
  const result = await model.generateContent(prompt)
  const rawText = result.response.text()
  const cleaned = rawText
    .trimStart()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  let json: unknown
  try {
    json = JSON.parse(cleaned)
  } catch {
    throw new Error(`Gemini returned non-JSON response: ${cleaned.slice(0, 200)}`)
  }

  return RewriteSchema.parse(json)
}
