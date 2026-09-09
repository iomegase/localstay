import type { LocalLandingIntent, PublicLocalLandingDto } from '@/features/local-seo/types/landing-pages'

export function publicLocalLanding(
  intent: LocalLandingIntent = 'CONCIERGE',
  city = { id: 'city-megeve', slug: 'megeve', name: 'Megève' },
): PublicLocalLandingDto {
  const label = { CONCIERGE: 'Conciergerie', SEMINAR: 'Séminaire', VACATION_RENTAL: 'Locations de vacances' }[intent]
  return {
    id: `destination-${city.slug}`,
    city,
    publication: { concierge: true, seminar: true, vacationRental: true },
    publicLodgingCount: 1,
    page: {
      intent,
      seo_title: `${label} : notre accompagnement à ${city.name}`,
      meta_description: `Une description enregistrée pour ${label} à ${city.name}.`,
      eyebrow: `Votre destination ${city.name}`,
      h1: `${label} à ${city.name}`,
      hero_title: `Votre projet à ${city.name}`,
      hero_copy: `Un accueil personnalisé à ${city.name}.`,
      reassurance: 'Un premier échange personnalisé.',
      section_title: `Notre accompagnement à ${city.name}`,
      section_copy: `Des services préparés avec vous à ${city.name}.`,
      process_title: `Les étapes à ${city.name}`,
      local_title: `Sur place à ${city.name}`,
      local_copy: `Des conseils locaux pour découvrir ${city.name}.`,
      cta_label: { CONCIERGE: 'Confier mon logement', SEMINAR: 'Parler de mon séminaire', VACATION_RENTAL: 'Voir tous les logements' }[intent],
      cta_href: { CONCIERGE: '/confier-mon-logement', SEMINAR: 'mailto:bonjour@mystay.city', VACATION_RENTAL: '/logements' }[intent],
      empty_copy: 'Aucun logement publié pour le moment.',
      highlights: [{ title: `Un point fort à ${city.name}`, copy: 'Le contenu du point fort enregistré.' }],
      steps: [{ title: `Une étape à ${city.name}`, copy: 'Le contenu de l’étape enregistrée.' }],
      faq: [{ question: `Comment préparer ${city.name} ?`, answer: 'La réponse enregistrée pour cette destination.' }],
    },
  }
}
