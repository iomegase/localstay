/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { LocalConciergeLanding } from '@/features/local-seo/components/LocalConciergeLanding'
import { LocalServiceLanding } from '@/features/local-seo/components/LocalServiceLanding'
import { LocalVacationRentalLanding } from '@/features/local-seo/components/LocalVacationRentalLanding'
import { publicLocalLanding } from '../fixtures/public-local-landing'
import type { LocalLandingIntent, PublicLocalLandingDto } from '@/features/local-seo/types/landing-pages'

const cases: Array<[LocalLandingIntent, (landing: PublicLocalLandingDto) => React.ReactElement]> = [
  ['CONCIERGE', landing => <LocalConciergeLanding landing={landing} lodgings={[]} reviews={[]} />],
  ['SEMINAR', landing => <LocalServiceLanding landing={landing} />],
  ['VACATION_RENTAL', landing => <LocalVacationRentalLanding landing={landing} lodgings={[]} />],
]

function faqSchemas(container: HTMLElement) {
  return [...container.querySelectorAll('script[type="application/ld+json"]')]
    .map(node => JSON.parse(node.textContent ?? '{}') as Record<string, unknown>)
    .filter(schema => schema['@type'] === 'FAQPage')
}

describe('046 AC-04-09 landing FAQ structured data', () => {
  it.each(cases)('%s describes exactly the displayed questions and answers', (intent, component) => {
    const landing = publicLocalLanding(intent)
    landing.page.faq.push({ question: 'Comment nous contacter ?', answer: 'Écrivez-nous pour préparer votre séjour.' })
    const { container } = render(component(landing))
    expect(faqSchemas(container)).toEqual([{
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: landing.page.faq.map(item => ({
        '@type': 'Question', name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    }])
    for (const item of landing.page.faq) {
      expect(screen.getByText(item.question).closest('details')).not.toBeNull()
      expect(screen.getByText(item.answer).closest('details')).not.toBeNull()
    }
  })

  it.each(cases)('%s emits no FAQPage for an empty FAQ', (intent, component) => {
    const landing = publicLocalLanding(intent)
    landing.page.faq = []
    const { container } = render(component(landing))
    expect(faqSchemas(container)).toEqual([])
  })
})
