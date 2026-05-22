import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'
import type { GeminiRawPoi } from '../types'

const GeminiRawPoiSchema = z.object({
  name: z.string(),
  address: z.string(),
  phone: z.string().nullable().default(null),
  website: z.string().nullable().default(null),
  description: z.string().default(''),
  subcategory: z.string().nullable().default(null),
  hours: z.record(z.string()).nullable().default(null),
  tags: z.array(z.string()).default([]),
})

const GeminiResponseSchema = z.object({
  pois: z.array(GeminiRawPoiSchema),
})

export async function callGemini(prompt: string): Promise<GeminiRawPoi[]> {
  const apiKey = process.env.GEMINI_API_KEY
  const modelName = process.env.GEMINI_MODEL ?? 'gemini-flash-latest'
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: modelName })

  const result = await model.generateContent(prompt)
  const rawText = result.response.text()

  // Strip markdown code fences if Gemini wraps the JSON
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  const parsed = GeminiResponseSchema.safeParse(JSON.parse(cleaned))
  if (!parsed.success) {
    throw new Error(`Gemini response failed Zod validation: ${parsed.error.message}`)
  }

  return parsed.data.pois.slice(0, 20) // BR-06: max 20
}
