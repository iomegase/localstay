import { parseAdminPoiDiscoveryPublicationResponse } from '@/features/admin-pois/lib/discovery-publication-response'
import type { AdminPoiDiscoveryEligibility } from '@/features/admin-pois/types'

const poiId = '44444444-4444-4444-8444-444444444444'

const completeEligibility: AdminPoiDiscoveryEligibility = {
  eligible: true,
  checks: {
    active: true,
    city: true,
    category: true,
    subcategory: true,
    description: true,
    photo: true,
    address: true,
    geocode: true,
    contact: true,
  },
}

function publishedData(overrides: Record<string, unknown> = {}) {
  return {
    id: poiId,
    discovery_status: 'PUBLISHED',
    discovery_published_at: '2026-08-20T15:00:00.000Z',
    public_url: '/decouvrir/saint-gervais/culture/le-musee',
    eligibility: completeEligibility,
    ...overrides,
  }
}

function draftData(overrides: Record<string, unknown> = {}) {
  return {
    id: poiId,
    discovery_status: 'DRAFT',
    discovery_published_at: null,
    public_url: null,
    eligibility: completeEligibility,
    ...overrides,
  }
}

describe('Admin discovery publication response parser', () => {
  it('accepts the exact consistent PUBLISHED and DRAFT DTOs', () => {
    expect(parseAdminPoiDiscoveryPublicationResponse({ data: publishedData() }, poiId)).toEqual({
      status: 'PUBLISHED',
      publishedAt: '2026-08-20T15:00:00.000Z',
      publicUrl: '/decouvrir/saint-gervais/culture/le-musee',
      eligibility: completeEligibility,
    })
    expect(parseAdminPoiDiscoveryPublicationResponse({ data: draftData() }, poiId)).toEqual({
      status: 'DRAFT',
      publishedAt: null,
      publicUrl: null,
      eligibility: completeEligibility,
    })

    const incompleteEligibility = {
      eligible: false,
      checks: { ...completeEligibility.checks, photo: false },
    }
    expect(parseAdminPoiDiscoveryPublicationResponse({
      data: draftData({ eligibility: incompleteEligibility }),
    }, poiId)).toEqual({
      status: 'DRAFT',
      publishedAt: null,
      publicUrl: null,
      eligibility: incompleteEligibility,
    })
  })

  it.each([
    ['missing envelope', publishedData()],
    ['wrong POI id', { data: publishedData({ id: 'another-poi' }) }],
    ['unknown status', { data: publishedData({ discovery_status: 'PUBLIC' }) }],
    ['DRAFT with publication date', { data: draftData({ discovery_published_at: '2026-08-20T15:00:00.000Z' }) }],
    ['DRAFT with public URL', { data: draftData({ public_url: '/decouvrir/saint-gervais/culture/le-musee' }) }],
    ['PUBLISHED without publication date', { data: publishedData({ discovery_published_at: null }) }],
    ['PUBLISHED with malformed date', { data: publishedData({ discovery_published_at: 'not-a-date' }) }],
    ['PUBLISHED without public URL', { data: publishedData({ public_url: null }) }],
    ['PUBLISHED with ineligible flag', { data: publishedData({ eligibility: { ...completeEligibility, eligible: false } }) }],
    ['eligible true with a missing check', {
      data: publishedData({
        eligibility: {
          eligible: true,
          checks: { ...completeEligibility.checks, photo: false },
        },
      }),
    }],
    ['eligible false with every check satisfied', {
      data: draftData({ eligibility: { ...completeEligibility, eligible: false } }),
    }],
    ['missing checklist key', {
      data: publishedData({
        eligibility: {
          eligible: true,
          checks: { ...completeEligibility.checks, contact: undefined },
        },
      }),
    }],
  ])('rejects %s', (_label, payload) => {
    expect(parseAdminPoiDiscoveryPublicationResponse(payload, poiId)).toBeNull()
  })

  it.each([
    'https://evil.example/decouvrir/ville/categorie/poi',
    'javascript:alert(1)',
    '//evil.example/decouvrir/ville/categorie/poi',
    '/decouvrir/ville/categorie\\poi',
    '/decouvrir/ville/categorie/poi?next=/admin',
    '/decouvrir/ville/categorie/poi#fragment',
    '/decouvrir/ville/categorie/poi%2Fadmin',
    '/decouvrir/ville/categorie/%2e%2e',
    '/decouvrir/ville//poi',
    '/decouvrir/ville/categorie',
    '/decouvrir/ville/categorie/poi/extra',
    '/decouvrir/Ville/categorie/poi',
    '/decouvrir/ville/categorie/poi_slug',
    '/decouvrir/ville/categorie/.',
  ])('rejects unsafe or non-canonical public URL %s', publicUrl => {
    expect(parseAdminPoiDiscoveryPublicationResponse(
      { data: publishedData({ public_url: publicUrl }) },
      poiId,
    )).toBeNull()
  })
})
