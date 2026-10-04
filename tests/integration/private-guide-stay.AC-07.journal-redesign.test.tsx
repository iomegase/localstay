/** @jest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react'
import { GuideBlogView } from '@/features/guide-app/components/GuideBlogView'
import { GuideBlogDetailView } from '@/features/guide-app/components/GuideBlogDetailView'
import { GuideBlogMarkdown } from '@/features/guide-app/components/GuideBlogMarkdown'
import type { GuideBlogPost } from '@/features/guide-app/types'

const post: GuideBlogPost = { id: 'article-1', slug: 'montagne', title: 'Une journée en montagne', excerpt: 'Découvrez les paysages.', categoryLabel: 'Guide local', cityName: 'Saint-Gervais', coverUrl: '/cover.jpg' }

it('AC-07-01: opens the selected article inside the guide', () => {
  const onOpen = jest.fn()
  const { container } = render(<GuideBlogView posts={[post]} onOpen={onOpen} />)
  fireEvent.click(screen.getByRole('button', { name: post.title }))
  expect(onOpen).toHaveBeenCalledWith(post)
  expect(screen.getByText(post.excerpt!)).toBeInTheDocument()
  expect(screen.getByText('Saint-Gervais')).toBeInTheDocument()
  expect(container.querySelector('a')).toBeNull()
})
it('AC-07-01: handles an empty list and missing optional card content', () => {
  const { rerender, container } = render(<GuideBlogView posts={[]} onOpen={jest.fn()} />)
  expect(container.querySelector('button')).toBeNull()
  expect(container.textContent!.length).toBeGreaterThan(10)
  rerender(<GuideBlogView posts={[{ ...post, coverUrl: null, excerpt: null, cityName: null, categoryLabel: null }]} onOpen={jest.fn()} />)
  expect(screen.getByRole('button', { name: post.title })).toBeInTheDocument()
  expect(container.querySelector('img')).toBeNull()
})
it('AC-07-02: keeps return usable while loading and renders the dedicated article', () => {
  const onBack = jest.fn()
  const { rerender } = render(<GuideBlogDetailView detail={null} onBack={onBack} />)
  const back = screen.getByRole('button')
  expect(back).toHaveClass('min-h-11')
  fireEvent.click(back)
  expect(onBack).toHaveBeenCalledTimes(1)
  rerender(<GuideBlogDetailView detail={{ ...post, contentMarkdown: 'Le contenu de votre séjour.' }} onBack={onBack} />)
  expect(screen.getByRole('article')).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 1, name: post.title })).toBeInTheDocument()
  expect(screen.getByText('Le contenu de votre séjour.')).toBeInTheDocument()
})
it('AC-07-02: reads an article without cover or location', () => {
  const { container } = render(<GuideBlogDetailView detail={{ title: post.title, coverUrl: null, categoryLabel: null, cityName: null, contentMarkdown: 'Texte' }} onBack={jest.fn()} />)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(post.title)
  expect(container.querySelector('img')).toBeNull()
})
it('AC-07-03: uses mobile reading typography and normalized content', () => {
  const { container } = render(<GuideBlogMarkdown source="Texte du guide" />)
  expect(container.firstChild).toHaveClass('text-[14px]', 'leading-7', 'break-words')
  expect(screen.getByText('Texte du guide')).toBeInTheDocument()
})
