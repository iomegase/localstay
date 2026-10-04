import {
  fetchAllGoogleReviews, GoogleBusinessError, googleBusinessConfigFromEnv, type GoogleBusinessConfig,
} from '@/shared/lib/google-business'

const config: GoogleBusinessConfig = {
  clientId: 'cid', clientSecret: 'secret', refreshToken: 'refresh', accountId: '111', locationId: '222',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

const rawReview = (id: string, overrides: Record<string, unknown> = {}) => ({
  name: `accounts/111/locations/222/reviews/${id}`,
  reviewId: id,
  reviewer: { displayName: 'Julie M.', profilePhotoUrl: 'https://lh3.googleusercontent.com/a/photo' },
  starRating: 'FIVE',
  comment: 'Séjour parfait.',
  createTime: '2026-09-12T10:00:00Z',
  updateTime: '2026-09-13T08:30:00Z',
  ...overrides,
})

function fetchMock(pages: unknown[]): jest.Mock {
  const mock = jest.fn()
  mock.mockResolvedValueOnce(json({ access_token: 'token', expires_in: 3599 }))
  for (const page of pages) mock.mockResolvedValueOnce(json(page))
  return mock
}

describe('062 AC-01-01 — pagination complète', () => {
  it('exchanges the refresh token then follows nextPageToken until the end', async () => {
    const fetchImpl = fetchMock([
      { reviews: [rawReview('a'), rawReview('b')], nextPageToken: 'p2' },
      { reviews: [rawReview('c')] },
    ])
    const reviews = await fetchAllGoogleReviews(config, fetchImpl)

    expect(reviews.map(review => review.google_review_id)).toEqual([
      'accounts/111/locations/222/reviews/a', 'accounts/111/locations/222/reviews/b', 'accounts/111/locations/222/reviews/c',
    ])
    const [tokenUrl, tokenInit] = fetchImpl.mock.calls[0]
    expect(tokenUrl).toBe('https://oauth2.googleapis.com/token')
    expect(String(tokenInit.body)).toContain('grant_type=refresh_token')
    expect(String(tokenInit.body)).toContain('refresh_token=refresh')
    expect(fetchImpl.mock.calls[1][0]).toBe('https://mybusiness.googleapis.com/v4/accounts/111/locations/222/reviews?pageSize=50')
    expect(fetchImpl.mock.calls[2][0]).toBe('https://mybusiness.googleapis.com/v4/accounts/111/locations/222/reviews?pageSize=50&pageToken=p2')
    expect(fetchImpl.mock.calls[1][1].headers).toEqual({ Authorization: 'Bearer token' })
  })

  it('returns an empty list when the location has no review', async () => {
    expect(await fetchAllGoogleReviews(config, fetchMock([{}]))).toEqual([])
  })

  it('stops with an error when Google keeps returning a next page (loop guard)', async () => {
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce(json({ access_token: 'token' }))
      .mockImplementation(async () => json({ reviews: [rawReview('a')], nextPageToken: 'same' }))
    await expect(fetchAllGoogleReviews(config, fetchImpl)).rejects.toMatchObject({ code: 'GOOGLE_API_ERROR' })
  })
})

describe('062 AC-01-02 — normalisation', () => {
  it('maps rating, missing comment, owner reply and dates', async () => {
    const [review] = await fetchAllGoogleReviews(config, fetchMock([{ reviews: [
      rawReview('a', { starRating: 'FOUR', comment: undefined, reviewReply: { comment: 'Merci Julie !' } }),
    ] }]))
    expect(review).toEqual({
      google_review_id: 'accounts/111/locations/222/reviews/a',
      author: 'Julie M.',
      author_photo_url: 'https://lh3.googleusercontent.com/a/photo',
      rating: 4,
      comment: null,
      owner_reply: 'Merci Julie !',
      google_created_at: new Date('2026-09-12T10:00:00Z'),
      google_updated_at: new Date('2026-09-13T08:30:00Z'),
    })
  })

  it('skips reviews whose rating is unspecified', async () => {
    const reviews = await fetchAllGoogleReviews(config, fetchMock([{ reviews: [
      rawReview('a', { starRating: 'STAR_RATING_UNSPECIFIED' }), rawReview('b'),
    ] }]))
    expect(reviews.map(review => review.rating)).toEqual([5])
  })

  // Review Focus 1
  it('uses « Utilisateur Google » for anonymous or nameless reviewers', async () => {
    const reviews = await fetchAllGoogleReviews(config, fetchMock([{ reviews: [
      rawReview('a', { reviewer: { isAnonymous: true } }), rawReview('b', { reviewer: { displayName: '   ' } }),
    ] }]))
    expect(reviews.map(review => review.author)).toEqual(['Utilisateur Google', 'Utilisateur Google'])
  })

  // Review Focus 2
  it('keeps only the original text of Google-translated comments', async () => {
    const reviews = await fetchAllGoogleReviews(config, fetchMock([{ reviews: [
      rawReview('a', { comment: '(Translated by Google) Great stay.\n\n(Original)\nSuper séjour.' }),
      rawReview('b', { comment: 'Super chalet.\n\n(Translated by Google)\nGreat chalet.' }),
    ] }]))
    expect(reviews.map(review => review.comment)).toEqual(['Super séjour.', 'Super chalet.'])
  })
})

describe('062 — erreurs et configuration', () => {
  // Review Focus 4
  it('turns a revoked refresh token into GOOGLE_API_ERROR pointing to the auth script', async () => {
    const fetchImpl = jest.fn().mockResolvedValueOnce(json({ error: 'invalid_grant' }, 400))
    const error = await fetchAllGoogleReviews(config, fetchImpl).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(GoogleBusinessError)
    expect(error).toMatchObject({ code: 'GOOGLE_API_ERROR' })
    expect((error as Error).message).toContain('scripts/google-business-auth.ts')
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it.each([401, 403, 429, 500])('turns a %s on the reviews endpoint into GOOGLE_API_ERROR', async status => {
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce(json({ access_token: 'token' }))
      .mockResolvedValueOnce(json({ error: { message: 'nope' } }, status))
    await expect(fetchAllGoogleReviews(config, fetchImpl)).rejects.toMatchObject({ code: 'GOOGLE_API_ERROR' })
  })

  it('turns a network failure or a malformed payload into GOOGLE_API_ERROR', async () => {
    const network = jest.fn().mockRejectedValueOnce(new TypeError('fetch failed'))
    await expect(fetchAllGoogleReviews(config, network)).rejects.toMatchObject({ code: 'GOOGLE_API_ERROR' })
    await expect(fetchAllGoogleReviews(config, fetchMock([{ reviews: [{ name: 'x' }] }]))).rejects.toMatchObject({ code: 'GOOGLE_API_ERROR' })
  })

  it('reads the five variables and returns null when one is missing', () => {
    const env = {
      GOOGLE_BUSINESS_CLIENT_ID: 'cid', GOOGLE_BUSINESS_CLIENT_SECRET: 'secret', GOOGLE_BUSINESS_REFRESH_TOKEN: 'refresh',
      GOOGLE_BUSINESS_ACCOUNT_ID: '111', GOOGLE_BUSINESS_LOCATION_ID: '222',
    } as NodeJS.ProcessEnv
    expect(googleBusinessConfigFromEnv(env)).toEqual(config)
    expect(googleBusinessConfigFromEnv({ ...env, GOOGLE_BUSINESS_REFRESH_TOKEN: '' })).toBeNull()
  })
})
