import { ImageResponse } from 'next/og'
import { ogCard, OG_SIZE } from '@/features/seo/lib/og-image'

const IVORY = '#FAF9F6'
const CHARCOAL = '#2B2B2B'
const GOLD = '#bd9254'
const MUTED = '#6B6B6B'

/**
 * Génère l'image Open Graph (carte de marque) à partir du modèle texte pur `ogCard`.
 * Satori (next/og) impose `display: flex` sur tout conteneur à plusieurs enfants.
 */
export function renderOgCardImage(input: { title?: string | null; subtitle?: string | null }) {
  const card = ogCard(input)
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: IVORY,
          padding: 80,
          borderLeft: `24px solid ${GOLD}`,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 28,
              letterSpacing: 8,
              textTransform: 'uppercase',
              color: GOLD,
              fontWeight: 700,
            }}
          >
            {card.eyebrow}
          </div>
          <div
            style={{
              marginTop: 32,
              fontSize: 84,
              lineHeight: 1.05,
              color: CHARCOAL,
              fontWeight: 700,
            }}
          >
            {card.title}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 32,
            color: MUTED,
            lineHeight: 1.35,
            maxWidth: 920,
          }}
        >
          {card.subtitle}
        </div>
      </div>
    ),
    { ...OG_SIZE },
  )
}
