import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'
import { rejectGeminiGeoMetrics } from '../lib/source-policy'

export type GeminiTrailDiscovery = {
  title: string
  description?: string
  source_refs?: unknown
  distance_km?: unknown
  elevation_gain_m?: unknown
  start_latitude?: unknown
  start_longitude?: unknown
}

export function sanitizeGeminiTrailDiscovery(candidate: GeminiTrailDiscovery) {
  return rejectGeminiGeoMetrics(candidate)
}

const DiscoverySchema = z.object({
  trails: z.array(z.object({
    title: z.string().min(2).max(120),
    description: z.string().min(20).max(600),
  })).max(20),
})

const DescriptionSchema = z.object({
  description: z.string().min(20).max(600),
})

type CityRef = { name: string; latitude: number; longitude: number }

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')
  const modelName = process.env.GEMINI_MODEL ?? 'gemini-flash-latest'
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: modelName,
    generationConfig: { responseMimeType: 'application/json' },
  })
}

function parseJsonResponse(text: string): unknown {
  const cleaned = text.trimStart().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
  return JSON.parse(cleaned)
}

export async function discoverTrailsWithGemini(city: CityRef): Promise<Array<{ title: string; description: string }>> {
  const prompt = `Liste les 10 randonnées pédestres les plus emblématiques et accessibles autour de ${city.name} (Haute-Savoie, France, ~${city.latitude.toFixed(4)},${city.longitude.toFixed(4)}).

Inclus les classiques connus localement (sommets, lacs, alpages, refuges) accessibles à pied sans matériel d'alpinisme.

Format JSON strict :
{
  "trails": [
    { "title": "Nom usuel de la randonnée", "description": "Description éditoriale 2-4 phrases : intérêt, paysages, difficulté générale, point de départ courant. Ne pas inventer de chiffres précis (km, dénivelé)." }
  ]
}

Maximum 10 randonnées. Pas de doublons. Pas de coordonnées GPS. Pas de chiffres précis non vérifiés.`

  const model = getModel()
  const result = await model.generateContent(prompt)
  const json = parseJsonResponse(result.response.text())
  const parsed = DiscoverySchema.safeParse(json)
  if (!parsed.success) throw new Error(`Gemini discovery validation failed: ${parsed.error.message}`)
  return parsed.data.trails
}

export async function generateTrailDescription(title: string, city: CityRef): Promise<string> {
  const prompt = `Rédige une description éditoriale courte (2-4 phrases) pour la randonnée "${title}" située autour de ${city.name} (Haute-Savoie, France).

Format JSON strict :
{ "description": "Texte éditorial neutre. Pas de chiffres inventés (km, dénivelé, durée). Mentionne le paysage et l'intérêt général." }`

  const model = getModel()
  const result = await model.generateContent(prompt)
  const json = parseJsonResponse(result.response.text())
  const parsed = DescriptionSchema.safeParse(json)
  if (!parsed.success) throw new Error(`Gemini description validation failed: ${parsed.error.message}`)
  return parsed.data.description
}

type EnrichableCandidate = {
  title: string
  description: string | null
  source_refs: unknown
}

export async function enrichCandidatesWithGeminiDescriptions<T extends EnrichableCandidate>(
  candidates: T[],
  city: CityRef,
): Promise<{ enriched: number; errors: number }> {
  let enriched = 0
  let errors = 0

  for (const candidate of candidates) {
    if (candidate.description && candidate.description.trim().length > 0) continue

    try {
      const description = await generateTrailDescription(candidate.title, city)
      candidate.description = description
      candidate.source_refs = appendGeminiRef(candidate.source_refs)
      enriched += 1
    } catch {
      errors += 1
    }
  }

  return { enriched, errors }
}

function appendGeminiRef(existing: unknown): unknown {
  const geminiRef = { type: 'gemini', attribution: 'Gemini', used_for: ['description'] }
  if (!Array.isArray(existing)) return [geminiRef]
  return [...existing, geminiRef]
}
