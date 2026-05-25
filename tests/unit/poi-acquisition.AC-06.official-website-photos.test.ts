import {
  extractOfficialWebsitePhotoEnrichment,
  fetchOfficialWebsitePhotoEnrichment,
  mergeOfficialWebsitePhotos,
} from '@/features/poi-acquisition/services/official-website-photos'

const pageUrl =
  'https://www.saintgervais.com/je-minspire/vie-culturelle/pile-pont-expo-saint-gervais-les-bains-fr-4247353/'

describe('018 official website photo enrichment', () => {
  it('AC-06-01: extracts normalized official photo URLs from JSON-LD, meta tags and image markup', () => {
    const enrichment = extractOfficialWebsitePhotoEnrichment(
      `
        <html>
          <head>
            <meta property="og:image" content="https://api.cloudly.space/resize/crop/1200/627/60/encoded/image.jpg" />
            <meta name="thumbnail" content="https://api.cloudly.space/resize/crop/1200/1200/60/encoded/image.jpg" />
            <script>
              window.globals = {
                post_image: "https:\\/\\/api.cloudly.space\\/resize\\/crop\\/1024\\/512\\/60\\/encoded\\/image.jpg"
              };
            </script>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@graph": [
                  {
                    "@type": "Place",
                    "name": "Pile Pont Expo",
                    "url": "${pageUrl}",
                    "image": [
                      "https://static.apidae-tourisme.com/filestore/objets-touristiques/images/149/169/32876949.jpeg",
                      "https://static.apidae-tourisme.com/filestore/objets-touristiques/images/38/75/30624550.jpg"
                    ]
                  }
                ]
              }
            </script>
          </head>
          <body>
            <img src="/favicon.png" />
            <img data-src="https://static.apidae-tourisme.com/filestore/objets-touristiques/images/79/91/19356495.jpg" />
            <img srcset="https://static.apidae-tourisme.com/filestore/objets-touristiques/images/90/247/8976218.jpg 640w, https://static.apidae-tourisme.com/filestore/objets-touristiques/images/90/247/8976218.jpg 1200w" />
          </body>
        </html>
      `,
      pageUrl,
    )

    expect(enrichment).toEqual({
      attribution: 'www.saintgervais.com',
      canonical_url: pageUrl,
      photos: [
        'https://static.apidae-tourisme.com/filestore/objets-touristiques/images/149/169/32876949.jpeg',
        'https://static.apidae-tourisme.com/filestore/objets-touristiques/images/38/75/30624550.jpg',
        'https://api.cloudly.space/resize/crop/1200/627/60/encoded/image.jpg',
        'https://api.cloudly.space/resize/crop/1200/1200/60/encoded/image.jpg',
        'https://api.cloudly.space/resize/crop/1024/512/60/encoded/image.jpg',
        'https://static.apidae-tourisme.com/filestore/objets-touristiques/images/79/91/19356495.jpg',
        'https://static.apidae-tourisme.com/filestore/objets-touristiques/images/90/247/8976218.jpg',
      ],
    })
  })

  it('AC-06-02/06-04: merges official photos without duplicates, caps at 12 and tolerates empty enrichment', () => {
    const existing = ['https://cdn.staylocal.test/manual.webp']
    const photos = Array.from({ length: 20 }, (_, index) => `https://static.apidae-tourisme.com/photo-${index}.jpg`)

    expect(mergeOfficialWebsitePhotos(existing, photos)).toEqual([
      'https://cdn.staylocal.test/manual.webp',
      ...photos.slice(0, 11),
    ])

    expect(mergeOfficialWebsitePhotos(existing, [])).toEqual(existing)
  })

  it('AC-06-04: returns null when official website fetch fails', async () => {
    const originalFetch = global.fetch
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'))

    await expect(fetchOfficialWebsitePhotoEnrichment(pageUrl)).resolves.toBeNull()

    global.fetch = originalFetch
  })
})
