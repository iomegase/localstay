/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AdminBlogEditor } from '@/features/blog/components/AdminBlogEditor'

describe('029 blog admin editor validation feedback', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('shows field-level validation errors when draft save is rejected', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Paramètre manquant ou invalide',
          details: {
            fieldErrors: {
              title: ['Le titre doit contenir entre 5 et 90 caractères.'],
              excerpt: ['L’extrait doit contenir entre 40 et 220 caractères.'],
            },
          },
        },
      }),
    }) as jest.Mock

    render(<AdminBlogEditor cities={[]} />)

    fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'abc' } })
    fireEvent.change(screen.getByLabelText('Excerpt'), { target: { value: 'court' } })
    fireEvent.click(screen.getByRole('button', { name: /Créer le brouillon/i }))

    expect((await screen.findAllByText(/Titre - Le titre doit contenir entre 5 et 90 caractères\./i)).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('textbox')[0]).toHaveAttribute('aria-invalid', 'true')
    expect((screen.getAllByText(/Excerpt - L’extrait doit contenir entre 40 et 220 caractères\./i)).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('textbox')[2]).toHaveAttribute('aria-invalid', 'true')
  })

  it('does not upload the cover photo immediately on file selection', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'photo-1',
        kind: 'cover',
        url: 'https://img.test/cover.webp',
        alt: 'Art à Saint-Nicolas',
        sort_order: 0,
      }),
    }) as jest.Mock

    const { container } = render(
      <AdminBlogEditor
        cities={[]}
        initialArticle={{
          id: 'article-1',
          status: 'draft',
          title: 'Guide local Saint-Nicolas',
          slug: 'guide-local-saint-nicolas',
          excerpt:
            'Un guide éditorial complet pour préparer un séjour à Saint-Nicolas avec des repères utiles et une lecture claire.',
          content_markdown: 'a'.repeat(320),
          category: 'local_guide',
          tags: [],
          city_id: null,
          seo_title: 'Guide local Saint-Nicolas — Blog MyStay',
          seo_description:
            'Préparez un séjour à Saint-Nicolas avec un guide éditorial local, des repères utiles et une lecture claire.',
          photos: [],
        }}
      />,
    )

    fireEvent.change(screen.getByLabelText('Alt couverture'), { target: { value: 'Art à Saint-Nicolas' } })
    const coverFileInput = container.querySelector('input[type="file"]')
    expect(coverFileInput).not.toBeNull()
    fireEvent.change(coverFileInput as HTMLInputElement, {
      target: {
        files: [new File(['cover'], 'art.png', { type: 'image/png' })],
      },
    })

    expect(global.fetch).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /Uploader la couverture/i })).toBeInTheDocument()
  })

  it('clears the cover publication error after a successful cover upload', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: {
            code: 'PUBLISH_REQUIREMENTS',
            message: 'PUBLISH_REQUIREMENTS',
            details: {
              fields: ['cover_photo'],
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'photo-1',
          kind: 'cover',
          url: 'https://img.test/cover.webp',
          alt: 'Art à Saint-Nicolas',
          sort_order: 0,
        }),
      }) as jest.Mock

    const { container } = render(
      <AdminBlogEditor
        cities={[]}
        initialArticle={{
          id: 'article-1',
          status: 'draft',
          title: 'Guide local Saint-Nicolas',
          slug: 'guide-local-saint-nicolas',
          excerpt:
            'Un guide éditorial complet pour préparer un séjour à Saint-Nicolas avec des repères utiles et une lecture claire.',
          content_markdown: 'a'.repeat(320),
          category: 'local_guide',
          tags: [],
          city_id: null,
          seo_title: 'Guide local Saint-Nicolas — Blog MyStay',
          seo_description:
            'Préparez un séjour à Saint-Nicolas avec un guide éditorial local, des repères utiles et une lecture claire.',
          photos: [],
        }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Publier/i }))
    expect(await screen.findByText(/Photo de couverture - Champ requis avant publication\./i)).toBeInTheDocument()

    const coverAltField = screen.getByText('Alt couverture').closest('label')?.querySelector('input')
    expect(coverAltField).not.toBeNull()
    fireEvent.change(coverAltField as HTMLInputElement, { target: { value: 'Art à Saint-Nicolas' } })

    const fileInputs = Array.from(container.querySelectorAll('input[type="file"]'))
    const coverInput = fileInputs[0]
    fireEvent.change(coverInput, {
      target: {
        files: [new File(['cover'], 'art.png', { type: 'image/png' })],
      },
    })
    fireEvent.click(screen.getByRole('button', { name: /Uploader la couverture/i }))

    expect(await screen.findByAltText('Art à Saint-Nicolas')).toBeInTheDocument()
    expect(screen.queryByText(/Photo de couverture - Champ requis avant publication\./i)).not.toBeInTheDocument()
  })
})
