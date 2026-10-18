import { z } from 'zod'

export type YouTubeOrientation = 'portrait' | 'landscape'

const OEMBED_TIMEOUT_MS = 3_000
const OEMBED_REVALIDATE_SECONDS = 86_400

const oEmbedSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
})

/**
 * Spec 044 BR-09 — format réel d'une vidéo YouTube via l'oEmbed public.
 * Seule la forme `/shorts/<id>` renvoie les dimensions réelles (113×200 pour un
 * Short, 200×113 pour une vidéo paysage) ; `watch?v=` répond toujours 16:9.
 * Toute erreur ou réponse inattendue → `portrait` (format historique).
 */
export async function fetchYouTubeOrientation(videoId: string): Promise<YouTubeOrientation> {
  const target = encodeURIComponent(`https://www.youtube.com/shorts/${videoId}`)
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=${target}&format=json`, {
      signal: AbortSignal.timeout(OEMBED_TIMEOUT_MS),
      next: { revalidate: OEMBED_REVALIDATE_SECONDS },
    })
    if (!response.ok) return 'portrait'
    const parsed = oEmbedSchema.safeParse(await response.json())
    if (!parsed.success) return 'portrait'
    return parsed.data.width > parsed.data.height ? 'landscape' : 'portrait'
  } catch {
    return 'portrait'
  }
}
