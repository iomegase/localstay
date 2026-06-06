import {
  extractOfficialWebsiteSourceContext,
  fetchOfficialWebsiteSourceContext,
} from '@/features/poi-acquisition/services/official-website-source'

const pageUrl = 'https://restaurant.example.com/'

describe('018 official website source context', () => {
  it('extracts useful verified text from meta, JSON-LD and visible content', () => {
    const context = extractOfficialWebsiteSourceContext(
      `
        <html>
          <head>
            <title>Table des Alpes | Cuisine locale</title>
            <meta name="description" content="Restaurant familial à Saint-Gervais avec produits savoyards et terrasse panoramique." />
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Restaurant",
                "name": "Table des Alpes",
                "description": "Spécialités maison, vins de Savoie et accueil des familles."
              }
            </script>
          </head>
          <body>
            <nav>Accueil Carte Contact</nav>
            <h1>Table des Alpes</h1>
            <p>Notre chef travaille des produits de saison issus de producteurs locaux.</p>
            <p>Une salle chaleureuse accueille les groupes après une journée en montagne.</p>
            <footer>Mentions légales</footer>
          </body>
        </html>
      `,
      pageUrl,
    )

    expect(context).toEqual({
      source_url: pageUrl,
      attribution: 'restaurant.example.com',
      text: expect.stringContaining('Restaurant familial à Saint-Gervais'),
    })
    expect(context.text).toContain('Spécialités maison, vins de Savoie')
    expect(context.text).toContain('Notre chef travaille des produits de saison')
    expect(context.text).not.toContain('Accueil Carte Contact')
    expect(context.text).not.toContain('Mentions légales')
  })

  it('returns text context from a candidate website fetch without storing raw HTML', async () => {
    const originalFetch = global.fetch
    global.fetch = jest.fn().mockResolvedValue(
      new Response('<html><body><h1>Maison Arbois</h1><p>Pâtisseries artisanales et salon de thé.</p></body></html>', {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      }),
    )

    await expect(fetchOfficialWebsiteSourceContext(pageUrl)).resolves.toEqual({
      source_url: pageUrl,
      attribution: 'restaurant.example.com',
      text: expect.stringContaining('Pâtisseries artisanales'),
    })

    global.fetch = originalFetch
  })
})
