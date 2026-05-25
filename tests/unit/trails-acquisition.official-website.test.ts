import { extractOfficialWebsiteTrailCandidates } from '@/features/trails-acquisition/services/official-website'

describe('019 official website trail extraction', () => {
  it('extracts randonnée candidates from official local HTML', () => {
    const candidates = extractOfficialWebsiteTrailCandidates(
      `
        <article>
          <h2>Randonnée du Mont Joly</h2>
          <p>Un itinéraire panoramique au départ de Saint-Gervais.</p>
          <a href="/je-minspire/randonnee-mont-joly">Voir la fiche</a>
        </article>
      `,
      'https://www.saintgervais.com/je-minspire/randonnee-toutes-saisons/',
    )

    expect(candidates).toEqual([
      {
        primary_source_type: 'official_website',
        source_refs: [
          {
            type: 'official_website',
            url: 'https://www.saintgervais.com/je-minspire/randonnee-toutes-saisons/',
            attribution: 'www.saintgervais.com',
            used_for: ['content'],
          },
        ],
        title: 'Randonnée du Mont Joly',
        description: 'Un itinéraire panoramique au départ de Saint-Gervais.',
        raw_payload: {
          source_url: 'https://www.saintgervais.com/je-minspire/randonnee-toutes-saisons/',
          extracted_from: 'html',
        },
      },
    ])
  })

  it('creates one candidate from an admin-provided official detail page even without trail keyword in title', () => {
    const candidates = extractOfficialWebsiteTrailCandidates(
      `
        <html>
          <head>
            <meta property="og:title" content="Le Nid d'Aigle au départ de Bionnassay - Saint-Gervais-les-Bains" />
            <meta name="description" content="Une randonnée pour mettre ses pas dans ceux des premiers chasseurs de chamois." />
          </head>
          <body>
            <h1>Le Nid d'Aigle au départ de Bionnassay</h1>
          </body>
        </html>
      `,
      'https://www.saintgervais.com/je-minspire/randonnee-toutes-saisons/le-nid-daigle-au-depart-de-bionnassay-saint-gervais-les-bains-fr-4304009/',
    )

    expect(candidates).toHaveLength(1)
    expect(candidates[0]).toMatchObject({
      primary_source_type: 'official_website',
      title: "Le Nid d'Aigle au départ de Bionnassay",
      description: 'Une randonnée pour mettre ses pas dans ceux des premiers chasseurs de chamois.',
      raw_payload: {
        source_url: 'https://www.saintgervais.com/je-minspire/randonnee-toutes-saisons/le-nid-daigle-au-depart-de-bionnassay-saint-gervais-les-bains-fr-4304009/',
        extracted_from: 'html',
      },
    })
  })

  it('extracts structured metrics and geometry from a Saint-Gervais official trail detail page', () => {
    const candidates = extractOfficialWebsiteTrailCandidates(
      `
        <html>
          <head>
            <meta property="og:title" content="Mont Joux en passant par la Crête du Mont d'Arbois - Saint-Gervais-les-Bains" />
            <meta name="description" content="Une balade idéale en famille pour s'initier aux joies de la randonnée, et profiter de panoramas sur les montagnes !" />
            <script type="application/ld+json">
              {
                "@type": "LocalBusiness",
                "geo": { "latitude": "45.855037", "longitude": "6.668734" }
              }
            </script>
          </head>
          <body>
            <h1>Mont Joux en passant par la Crête du Mont d'Arbois</h1>
            <small>Durée journalière</small><span class="value">1h </span>
            <div class="criterion"><small>Niveau de difficulté</small><div class="value">Facile</div></div>
            <div class="criterion"><small>Départ</small><span>Saint-Gervais-les-Bains</span></div>
            <div class="criterion"><small>Distance</small><span>2.7 km</span></div>
            <div class="criterion"><small>Dénivelé positif</small><span>166 m</span></div>
            <script>
              const HwSheet = {
                "businessName": "Mont Joux en passant par la Crête du Mont d'Arbois",
                "geolocations": [{ "longitude": "6.668734", "latitude": "45.855037", "altitude": "1500" }],
                "itineraryLength": { "value": "2.7", "unit": "km" },
                "locomotions": [{ "difficulty": "Facile", "duration": "1h " }],
                "trace": {
                  "_typeTraceItinerary": { "label": "Aller / Retour" },
                  "points": [
                    { "lat": 45.855037, "lng": 6.668734, "elevation": 1500 },
                    { "lat": 45.856, "lng": 6.67, "elevation": 1666 }
                  ]
                },
                "sfThematicDescription": [
                  { "name": "Topo/pas à pas", "value": "Départ : Arrivée de la télécabine Bettex/Mont d'Arbois (1833 m)" }
                ]
              };
            </script>
          </body>
        </html>
      `,
      'https://www.saintgervais.com/je-minspire/randonnee-toutes-saisons/mont-joux-en-passant-par-la-crete-du-mont-darbois-saint-gervais-les-bains-fr-4303981/',
    )

    expect(candidates).toHaveLength(1)
    expect(candidates[0]).toMatchObject({
      title: "Mont Joux en passant par la Crête du Mont d'Arbois",
      description: "Une balade idéale en famille pour s'initier aux joies de la randonnée, et profiter de panoramas sur les montagnes !",
      difficulty: 'easy',
      distance_km: 2.7,
      elevation_gain_m: 166,
      estimated_duration_min: 60,
      loop_type: 'out_and_back',
      start_label: "Arrivée de la télécabine Bettex/Mont d'Arbois (1833 m)",
      start_latitude: 45.855037,
      start_longitude: 6.668734,
      geometry_status: 'valid',
      elevation_status: 'valid',
      metric_source: 'official_website',
      data_quality_status: 'complete',
    })
    expect(candidates[0].geometry_geojson).toEqual({
      type: 'LineString',
      coordinates: [
        [6.668734, 45.855037, 1500],
        [6.67, 45.856, 1666],
      ],
    })
  })
})
