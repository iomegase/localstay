/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import BlogListPage from '@/app/(public)/blog/page'

jest.mock('@/features/blog/queries/public-blog', () => ({
  getPublishedBlogArticles: jest.fn(async () => ({ city: null, items: [] })),
}))

describe('029 blog public empty list', () => {
  it('returns 200 with an editorial empty state when no article is published', async () => {
    render(await BlogListPage({ searchParams: Promise.resolve({}) }))

    expect(screen.getByText(/Aucun article/i)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Lire l'article/i })).not.toBeInTheDocument()
  })
})
