/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AdminBlogEditor } from '@/features/blog/components/AdminBlogEditor'

function getInputFromField(label: string) {
  const field = screen.getByText(label).closest('label')?.querySelector('input')
  expect(field).not.toBeNull()
  return field as HTMLInputElement
}

function getTextareaFromField(label: string) {
  const field = screen.getByText(label).closest('label')?.querySelector('textarea')
  expect(field).not.toBeNull()
  return field as HTMLTextAreaElement
}

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

    fireEvent.change(getInputFromField('Titre'), { target: { value: 'abc' } })
    fireEvent.change(getTextareaFromField('Excerpt'), { target: { value: 'court' } })
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
    expect((await screen.findAllByText(/Photo de couverture - Champ requis avant publication\./i)).length).toBeGreaterThan(0)

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

  it('does not attach the cover photo publication error to the cover alt field', async () => {
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
      }) as jest.Mock

    render(
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

    expect((await screen.findAllByText(/Photo de couverture - Champ requis avant publication\./i)).length).toBeGreaterThan(0)
    expect(screen.queryByText(/Alt couverture - Champ requis avant publication\./i)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Alt couverture')).not.toHaveAttribute('aria-invalid', 'true')
  })

  it('clears stale text field validation errors when the user edits the field', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        error: {
          code: 'GEMINI_INVALID_RESPONSE',
          message: 'La proposition Gemini reçue est invalide.',
          details: {
            fieldErrors: {
              excerpt: ['L’extrait doit contenir entre 40 et 220 caractères.'],
              seo_description: ['La meta description doit contenir entre 80 et 180 caractères.'],
            },
          },
        },
      }),
    }) as jest.Mock

    render(
      <AdminBlogEditor
        cities={[]}
        initialArticle={{
          id: 'article-1',
          status: 'draft',
          title: 'Guide local Saint-Nicolas',
          slug: 'guide-local-saint-nicolas',
          excerpt: 'a'.repeat(45),
          content_markdown: 'mot '.repeat(80).trim(),
          category: 'local_guide',
          tags: [],
          city_id: null,
          seo_title: 'b'.repeat(35),
          seo_description: 'c'.repeat(90),
          photos: [],
        }}
      />,
    )

    fireEvent.change(screen.getByLabelText('Brief'), {
      target: { value: 'Rédige un article clair et utile sur la vie en Haute-Savoie en 1900.' },
    })
    fireEvent.change(screen.getByLabelText('Faits vérifiés'), {
      target: { value: 'Le contenu doit rester factuel, local et ancré dans des éléments vérifiés fournis par l’admin.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Générer un brouillon/i }))

    expect((await screen.findAllByText(/Excerpt - L’extrait doit contenir entre 40 et 220 caractères\./i)).length).toBeGreaterThan(0)
    expect(screen.queryAllByText(/SEO description - La meta description doit contenir entre 80 et 180 caractères\./i).length).toBeGreaterThan(0)

    fireEvent.change(getTextareaFromField('Excerpt'), { target: { value: 'a'.repeat(46) } })
    expect(screen.queryByText(/Excerpt - L’extrait doit contenir entre 40 et 220 caractères\./i)).not.toBeInTheDocument()
    expect(screen.queryAllByText(/SEO description - La meta description doit contenir entre 80 et 180 caractères\./i).length).toBeGreaterThan(0)

    fireEvent.change(getTextareaFromField('SEO description'), { target: { value: 'c'.repeat(91) } })
    expect(screen.queryByText(/SEO description - La meta description doit contenir entre 80 et 180 caractères\./i)).not.toBeInTheDocument()
  })

  it('shows live character and word counters for constrained editorial fields', () => {
    render(
      <AdminBlogEditor
        cities={[]}
        initialArticle={{
          id: 'article-1',
          status: 'draft',
          title: 'a'.repeat(12),
          slug: 'guide-local-saint-nicolas',
          excerpt: 'b'.repeat(45),
          content_markdown: 'mot mot mot',
          category: 'local_guide',
          tags: [],
          city_id: null,
          seo_title: 'c'.repeat(35),
          seo_description: 'd'.repeat(90),
          photos: [],
        }}
      />,
    )

    expect(screen.getByText('12 / 90 caractères')).toBeInTheDocument()
    expect(screen.getByText('45 / 220 caractères')).toBeInTheDocument()
    expect(screen.getByText('35 / 70 caractères')).toBeInTheDocument()
    expect(screen.getByText('90 / 180 caractères')).toBeInTheDocument()
    expect(screen.getByText('3 mots • 11 caractères')).toBeInTheDocument()

    fireEvent.change(getTextareaFromField('Excerpt'), { target: { value: 'e'.repeat(46) } })
    expect(screen.getByText('46 / 220 caractères')).toBeInTheDocument()
  })
})
