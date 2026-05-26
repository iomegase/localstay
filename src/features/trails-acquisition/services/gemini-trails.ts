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
    start_label: z.string().min(2).max(120).nullable().optional(),
  })).max(20),
})

const DescriptionSchema = z.object({
  description: z.string().min(20).max(600),
  start_label: z.string().min(2).max(120).nullable().optional(),
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

export async function discoverTrailsWithGemini(city: CityRef): Promise<Array<{ title: string; description: string; start_label: string | null }>> {
  const prompt = `Liste les 10 randonnées pédestres les plus emblématiques et accessibles autour de ${city.name} (Haute-Savoie, France, ~${city.latitude.toFixed(4)},${city.longitude.toFixed(4)}).

Inclus les classiques connus localement (sommets, lacs, alpages, refuges) accessibles à pied sans matériel d'alpinisme.

Format JSON strict :
{
  "trails": [
    {
      "title": "Nom usuel de la randonnée",
      "description": "Description éditoriale 2-4 phrases : intérêt, paysages, difficulté générale. Ne pas inventer de chiffres précis (km, dénivelé).",
      "start_label": "Lieu/hameau/parking où démarre habituellement la randonnée, par exemple 'Parking du Bettex' ou 'Plateau de la Croix'. null si inconnu."
    }
  ]
}

Maximum 10 randonnées. Pas de doublons. Pas de coordonnées GPS. Pas de chiffres précis non vérifiés.`

  const model = getModel()
  const result = await model.generateContent(prompt)
  const json = parseJsonResponse(result.response.text())
  const parsed = DiscoverySchema.safeParse(json)
  if (!parsed.success) throw new Error(`Gemini discovery validation failed: ${parsed.error.message}`)
  return parsed.data.trails.map(t => ({ title: t.title, description: t.description, start_label: t.start_label ?? null }))
}

export async function generateTrailDescription(title: string, city: CityRef): Promise<{ description: string; start_label: string | null }> {
  const prompt = `Rédige une description éditoriale courte (2-4 phrases) pour la randonnée "${title}" située autour de ${city.name} (Haute-Savoie, France).

Format JSON strict :
{
  "description": "Texte éditorial neutre. Pas de chiffres inventés (km, dénivelé, durée). Mentionne le paysage et l'intérêt général.",
  "start_label": "Lieu/hameau/parking de départ courant (ex: 'Parking du Bettex'). null si inconnu."
}`

  const model = getModel()
  const result = await model.generateContent(prompt)
  const json = parseJsonResponse(result.response.text())
  const parsed = DescriptionSchema.safeParse(json)
  if (!parsed.success) throw new Error(`Gemini description validation failed: ${parsed.error.message}`)
  return { description: parsed.data.description, start_label: parsed.data.start_label ?? null }
}

type EnrichableCandidate = {
  title: string
  description: string | null
  start_label?: string | null
  source_refs: unknown
}

export async function enrichCandidatesWithGeminiDescriptions<T extends EnrichableCandidate>(
  candidates: T[],
  city: CityRef,
): Promise<{ enriched: number; errors: number }> {
  let enriched = 0
  let errors = 0

  for (const candidate of candidates) {
    const needsDescription = !candidate.description || candidate.description.trim().length === 0
    const needsStart = !candidate.start_label
    if (!needsDescription && !needsStart) continue

    try {
      const result = await generateTrailDescription(candidate.title, city)
      const usedFor: string[] = []
      if (needsDescription) {
        candidate.description = result.description
        usedFor.push('description')
      }
      if (needsStart && result.start_label) {
        candidate.start_label = result.start_label
        usedFor.push('start_label')
      }
      if (usedFor.length > 0) {
        candidate.source_refs = appendGeminiRef(candidate.source_refs, usedFor)
        enriched += 1
      }
    } catch {
      errors += 1
    }
  }

  return { enriched, errors }
}

const START_LABEL_PATTERN = /au d[ée]part d[eu]s?\s+([^.,;:!?\n]+)/i

export function extractStartLabelFromDescription(description: string | null): string | null {
  if (!description) return null
  const match = description.match(START_LABEL_PATTERN)
  if (!match) return null
  return match[1].trim().slice(0, 120)
}

function appendGeminiRef(existing: unknown, usedFor: string[]): unknown {
  const geminiRef = { type: 'gemini', attribution: 'Gemini', used_for: usedFor }
  if (!Array.isArray(existing)) return [geminiRef]
  return [...existing, geminiRef]
}
