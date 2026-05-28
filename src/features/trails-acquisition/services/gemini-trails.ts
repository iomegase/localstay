import { GoogleGenerativeAI, type Tool } from '@google/generative-ai'
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

// Schemas étendus depuis l'activation du grounding Google Search : Gemini peut
// désormais extraire des métriques factuelles (distance/dénivelé/durée) depuis
// les sources web (visorando, camptocamp). L'admin valide ces valeurs en revue.
const DifficultyEnum = z.enum(['easy', 'medium', 'hard', 'expert']).nullable().optional()
const PositiveNumber = z.number().positive().nullable().optional()

const DiscoverySchema = z.object({
  trails: z.array(z.object({
    title: z.string().min(2).max(120),
    description: z.string().min(20).max(600),
    start_label: z.string().min(2).max(120).nullable().optional(),
    distance_km: PositiveNumber,
    elevation_gain_m: PositiveNumber,
    estimated_duration_min: PositiveNumber,
    difficulty: DifficultyEnum,
  })).max(20),
})

const DescriptionSchema = z.object({
  description: z.string().min(20).max(600),
  start_label: z.string().min(2).max(120).nullable().optional(),
  distance_km: PositiveNumber,
  elevation_gain_m: PositiveNumber,
  estimated_duration_min: PositiveNumber,
  difficulty: DifficultyEnum,
})

type CityRef = { name: string; latitude: number; longitude: number }

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')
  const modelName = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'
  // Google Search grounding — le modèle interroge Google live pour récupérer
  // des infos fraîches sur les randos (descriptions, points de départ).
  // Gemini 2.0+ utilise `googleSearch: {}` (le SDK v0.24 le typait encore
  // `googleSearchRetrieval`, deprecated côté API depuis 2025).
  // Incompatible avec responseMimeType JSON forcé → on parse le JSON depuis
  // le texte de réponse via parseJsonResponse().
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: modelName,
    tools: [{ googleSearch: {} } as unknown as Tool],
  })
}

function parseJsonResponse(text: string): unknown {
  const cleaned = text.trimStart().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
  return JSON.parse(cleaned)
}

type DiscoveredTrail = {
  title: string
  description: string
  start_label: string | null
  distance_km: number | null
  elevation_gain_m: number | null
  estimated_duration_min: number | null
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | null
}

export async function discoverTrailsWithGemini(city: CityRef): Promise<DiscoveredTrail[]> {
  const prompt = `Utilise Google Search pour trouver les 10 randonnées pédestres les plus emblématiques et accessibles autour de ${city.name} (Haute-Savoie, France, ~${city.latitude.toFixed(4)},${city.longitude.toFixed(4)}).

Cherche sur les sites de référence : office de tourisme local, visorando.com, altituderando.com, camptocamp.org, Wikipedia. Inclus les classiques connus localement (sommets, lacs, alpages, refuges) accessibles à pied sans matériel d'alpinisme.

IMPORTANT : Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, sans markdown, sans backticks. Structure exacte attendue :

{
  "trails": [
    {
      "title": "Nom usuel de la randonnée tel qu'utilisé localement",
      "description": "Description éditoriale 2-4 phrases riches : intérêt, paysages traversés, difficulté générale, période favorable. Synthèse de ce que tu as trouvé via Google Search.",
      "start_label": "Lieu/hameau/parking où démarre habituellement la randonnée d'après les sources (ex: 'Parking du Bettex'). null si introuvable.",
      "distance_km": 12.5,          // distance aller-retour en km, seulement si trouvée sur visorando/camptocamp/etc. null sinon.
      "elevation_gain_m": 800,      // dénivelé positif en m, idem null si non sourcé.
      "estimated_duration_min": 240, // durée estimée en min, idem.
      "difficulty": "medium"        // easy/medium/hard/expert d'après la cotation officielle. null si inconnu.
    }
  ]
}

Maximum 10 randonnées. Pas de doublons. Pas de coordonnées GPS. **N'invente AUCUN chiffre** : mets null si la source ne confirme pas. La précision factuelle prime sur la complétude.`

  const model = getModel()
  // 60s : la discovery avec grounding sur 10 randos peut prendre du temps
  const result = await withTimeout(model.generateContent(prompt), 60_000)
  const json = parseJsonResponse(result.response.text())
  const parsed = DiscoverySchema.safeParse(json)
  if (!parsed.success) throw new Error(`Gemini discovery validation failed: ${parsed.error.message}`)
  return parsed.data.trails.map(t => ({
    title: t.title,
    description: t.description,
    start_label: t.start_label ?? null,
    distance_km: t.distance_km ?? null,
    elevation_gain_m: t.elevation_gain_m ?? null,
    estimated_duration_min: t.estimated_duration_min ?? null,
    difficulty: t.difficulty ?? null,
  }))
}

type DescriptionResult = {
  description: string
  start_label: string | null
  distance_km: number | null
  elevation_gain_m: number | null
  estimated_duration_min: number | null
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | null
}

export async function generateTrailDescription(title: string, city: CityRef): Promise<DescriptionResult> {
  const prompt = `Utilise Google Search pour trouver des informations factuelles sur la randonnée "${title}" située autour de ${city.name} (Haute-Savoie, France).

Cherche sur visorando.com, altituderando.com, camptocamp.org, l'office de tourisme local, Wikipedia. Combine plusieurs sources pour une synthèse fiable.

IMPORTANT : Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, sans markdown, sans backticks. Structure exacte :

{
  "description": "Description éditoriale 2-4 phrases riches : paysages traversés, intérêt (sommet, lac, alpage, refuge), difficulté générale, période favorable. Synthèse factuelle des sources trouvées.",
  "start_label": "Lieu/hameau/parking de départ d'après les sources (ex: 'Parking du Bettex'). null si introuvable.",
  "distance_km": 12.5,             // aller-retour en km, seulement si trouvé sur visorando/camptocamp/etc. null sinon.
  "elevation_gain_m": 800,         // dénivelé positif m, null si non sourcé.
  "estimated_duration_min": 240,   // durée estimée en min.
  "difficulty": "medium"           // easy/medium/hard/expert d'après cotation officielle. null si inconnu.
}

**N'invente AUCUN chiffre** : mets null si la source ne confirme pas. La précision factuelle prime sur la complétude.`

  const model = getModel()
  // 30s : descriptions avec grounding sont plus rapides que discovery mais laissent de la marge
  const result = await withTimeout(model.generateContent(prompt), 30_000)
  const json = parseJsonResponse(result.response.text())
  const parsed = DescriptionSchema.safeParse(json)
  if (!parsed.success) throw new Error(`Gemini description validation failed: ${parsed.error.message}`)
  return {
    description: parsed.data.description,
    start_label: parsed.data.start_label ?? null,
    distance_km: parsed.data.distance_km ?? null,
    elevation_gain_m: parsed.data.elevation_gain_m ?? null,
    estimated_duration_min: parsed.data.estimated_duration_min ?? null,
    difficulty: parsed.data.difficulty ?? null,
  }
}

type EnrichableCandidate = {
  title: string
  description: string | null
  start_label?: string | null
  source_refs: unknown
}

const GEMINI_DESCRIPTION_TIMEOUT_MS = 45_000  // marge pour grounding lent (la fct interne timeout à 30s)
const GEMINI_DESCRIPTION_CONCURRENCY = 5      // OK : Gemini Tier 1 supporte largement 5 RPS

export async function enrichCandidatesWithGeminiDescriptions<T extends EnrichableCandidate>(
  candidates: T[],
  city: CityRef,
): Promise<{ enriched: number; errors: number }> {
  let enriched = 0
  let errors = 0

  const toEnrich = candidates.filter(c => {
    const needsDescription = !c.description || c.description.trim().length === 0
    const needsStart = !c.start_label
    return needsDescription || needsStart
  })

  await mapWithConcurrency(toEnrich, GEMINI_DESCRIPTION_CONCURRENCY, async candidate => {
    const needsDescription = !candidate.description || candidate.description.trim().length === 0
    const needsStart = !candidate.start_label

    try {
      const result = await withTimeout(
        generateTrailDescription(candidate.title, city),
        GEMINI_DESCRIPTION_TIMEOUT_MS,
      )
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
  })

  return { enriched, errors }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout ${ms}ms`)), ms)
    promise.then(value => { clearTimeout(timer); resolve(value) }, err => { clearTimeout(timer); reject(err) })
  })
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = cursor
      cursor += 1
      if (index >= items.length) return
      results[index] = await fn(items[index])
    }
  })
  await Promise.all(workers)
  return results
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
