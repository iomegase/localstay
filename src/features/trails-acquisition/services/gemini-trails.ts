import { GoogleGenerativeAI, type Tool } from '@google/generative-ai'
import { z } from 'zod'
import { rejectGeminiGeoMetrics } from '../lib/source-policy'
import { DESCRIPTION_LENGTH_INSTRUCTION, DESCRIPTION_MAX_CHARS, limitToWords } from '@/shared/lib/description-length'
import { sanitizeDescriptionSources, type DescriptionSource } from '@/shared/lib/description-sources'

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

// ADR-006: Gemini is limited to discovery and editorial text.
const DiscoverySchema = z.object({
  trails: z.array(z.object({
    title: z.string().min(2).max(120),
    description: z.string().min(20).max(600),
    start_label: z.string().min(2).max(120).nullable().optional(),
  })).max(20),
})

const DescriptionSchema = z.object({
  // Spec 093 : marge avant la coupe à 300 mots (AC-03 / AC-04).
  description: z.string().min(20).max(DESCRIPTION_MAX_CHARS * 2),
  start_label: z.string().min(2).max(120).nullable().optional(),
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
      "start_label": "Lieu/hameau/parking où démarre habituellement la randonnée d'après les sources (ex: 'Parking du Bettex'). null si introuvable."
    }
  ]
}

Maximum 10 randonnées. Pas de doublons. Pas de coordonnées GPS. Ne fournis aucune coordonnée GPS, distance, durée, dénivelé ou métrique géographique, même trouvée sur le web. Limite la réponse au contenu éditorial.`

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
  }))
}

type DescriptionResult = {
  description: string
  start_label: string | null
  description_sources: DescriptionSource[]
}

export async function generateTrailDescription(title: string, city: CityRef): Promise<DescriptionResult> {
  const prompt = `Utilise Google Search pour trouver des informations factuelles sur la randonnée "${title}" située autour de ${city.name} (Haute-Savoie, France).

Cherche sur visorando.com, altituderando.com, camptocamp.org, l'office de tourisme local, Wikipedia. Combine plusieurs sources pour une synthèse fiable.

IMPORTANT : Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, sans markdown, sans backticks. Structure exacte :

{
  "description": "Description éditoriale : paysages traversés, intérêt (sommet, lac, alpage, refuge), difficulté générale, période favorable. Synthèse factuelle des sources trouvées. ${DESCRIPTION_LENGTH_INSTRUCTION} Paragraphes séparés par \\n\\n dans la chaîne JSON.",
  "start_label": "Lieu/hameau/parking de départ d'après les sources (ex: 'Parking du Bettex'). null si introuvable."
}

Ne fournis aucune coordonnée GPS, distance, durée, dénivelé ou métrique géographique, même trouvée sur le web. Limite la réponse au contenu éditorial.`

  const model = getModel()
  // 30s : descriptions avec grounding sont plus rapides que discovery mais laissent de la marge
  const result = await withTimeout(model.generateContent(prompt), 50_000)
  const json = parseJsonResponse(result.response.text())
  const parsed = DescriptionSchema.safeParse(json)
  if (!parsed.success) throw new Error(`Gemini description validation failed: ${parsed.error.message}`)
  // Spec 094 AC-03 : pages citées par la recherche Google de Gemini.
  const chunks = (result.response.candidates?.[0]?.groundingMetadata as { groundingChunks?: Array<{ web?: { uri?: string; title?: string } }> } | undefined)?.groundingChunks ?? []
  return {
    description: limitToWords(parsed.data.description),
    start_label: parsed.data.start_label ?? null,
    description_sources: sanitizeDescriptionSources(chunks.map(chunk => ({ url: chunk.web?.uri, title: chunk.web?.title }))),
  }
}

type EnrichableCandidate = {
  title: string
  geometry_status?: string | null
  description: string | null
  description_sources?: DescriptionSource[] | null
  start_label?: string | null
  source_refs: unknown
  distance_km?: number | null
  elevation_gain_m?: number | null
  elevation_status?: string
  estimated_duration_min?: number | null
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert' | 'unknown' | string | null
  metric_source?: string | null
}

// 2026-10-08 : textes de 120 à 300 mots en Markdown, plus longs à générer.
const GEMINI_DESCRIPTION_TIMEOUT_MS = 60_000  // marge pour grounding lent (la fct interne timeout à 50 s)
const GEMINI_DESCRIPTION_CONCURRENCY = 12     // ~30 s par texte : 35 tracés tiennent en 3 vagues (Gemini Tier 1)

function hasGeometry(candidate: { geometry_status?: string | null }): boolean {
  return candidate.geometry_status === 'valid'
}

export async function enrichCandidatesWithGeminiDescriptions<T extends EnrichableCandidate>(
  candidates: T[],
  city: CityRef,
  signal?: AbortSignal,
): Promise<{ enriched: number; errors: number }> {
  let enriched = 0
  let errors = 0

  // Audit 2026-10-08 : les candidats déjà décrits (Camptocamp) passaient en premier pour le seul
  // lieu de départ — chacun rédigeait 300 mots pour rien et l'étape expirait avant les tracés OSM
  // sans description. On ne traite que les candidats sans description, tracés d'abord.
  const toEnrich = candidates
    .filter(c => !c.description?.trim())
    .sort((a, b) => Number(hasGeometry(b)) - Number(hasGeometry(a)))

  await mapWithConcurrency(toEnrich, GEMINI_DESCRIPTION_CONCURRENCY, async candidate => {
    signal?.throwIfAborted()
    const needsDescription = !candidate.description?.trim()
    const needsStart = !candidate.start_label
    try {
      const result = await withTimeout(
        generateTrailDescription(candidate.title, city),
        GEMINI_DESCRIPTION_TIMEOUT_MS,
      )
      const usedFor: string[] = []
      if (needsDescription) {
        candidate.description = result.description
        candidate.description_sources = result.description_sources
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
