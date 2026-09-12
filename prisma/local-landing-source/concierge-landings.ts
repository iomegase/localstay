// Frozen legacy import source for spec 048. Runtime reads persisted landing pages.
import type { LocalSeoDestination } from './destinations'

type ConciergeFaq = {
  question: string
  answer: string
}

export type LocalConciergeLandingContent = {
  promise: string
  heroCopy: string
  reassurance: string
  ownerTitle: string
  ownerCopy: string
  localHeading: string
  localCopy: string
  faq: readonly ConciergeFaq[]
}

const localContentBySlug: Readonly<Record<string, LocalConciergeLandingContent>> = {
  'saint-gervais-les-bains': {
    promise: 'Confiez-nous votre logement. Nous organisons chaque séjour.',
    heroCopy:
      'Gestion des voyageurs, préparation du logement, ménage, linge, suivi des séjours et accompagnement local : MyStay prend soin de votre location saisonnière à Saint-Gervais-les-Bains.',
    reassurance: 'Présence locale · Gestion personnalisée · Guide voyageur MyStay',
    ownerTitle: 'Profitez de votre logement. Nous gérons les séjours.',
    ownerCopy:
      'MyStay organise avec vous la gestion quotidienne de votre appartement, chalet ou résidence secondaire. Vous gardez un interlocuteur identifié et un suivi adapté au fonctionnement réel de votre logement.',
    localHeading: 'Gérer un logement à Saint-Gervais-les-Bains',
    localCopy:
      'Du centre de Saint-Gervais au Fayet et au Bettex, les accès, le stationnement, l’altitude et le rythme des séjours diffèrent. Le fonctionnement est défini selon le secteur et les particularités de chaque adresse.',
    faq: [
      {
        question: 'Quels services votre conciergerie prend-elle en charge ?',
        answer:
          'La gestion des voyageurs, les arrivées et départs, la préparation, le ménage et le linge selon l’organisation retenue, le suivi du logement et le guide MyStay.',
      },
      {
        question: 'Intervenez-vous au Fayet et au Bettex ?',
        answer:
          'Oui, ces secteurs font partie du périmètre actuellement étudié par MyStay. Chaque adresse reste vérifiée selon son accès et son fonctionnement.',
      },
      {
        question: 'Pouvez-vous gérer une location diffusée sur Airbnb ?',
        answer:
          'Oui, lorsque le fonctionnement du logement et le périmètre confié le permettent. MyStay n’est pas présenté comme partenaire officiel d’Airbnb.',
      },
      {
        question: 'Prenez-vous en charge le ménage et le linge ?',
        answer:
          'Oui, leur organisation est définie avec le propriétaire selon le logement et le rythme des séjours.',
      },
      {
        question: 'Comment préparez-vous les informations d’arrivée ?',
        answer:
          'Les accès, consignes et informations utiles sont structurés avant le séjour puis réunis dans le guide voyageur MyStay.',
      },
      {
        question: 'Puis-je vous déléguer seulement une partie de la gestion ?',
        answer:
          'Oui. Le niveau de délégation est défini avec le propriétaire après l’étude du logement et de ses besoins.',
      },
      {
        question: 'Comment se déroule la mise en gestion d’un nouveau logement ?',
        answer:
          'Un premier échange est suivi d’une visite, de la préparation du fonctionnement et du guide, puis de la mise en gestion.',
      },
    ],
  },
  'saint-nicolas-de-veroce': {
    promise: 'Confiez-nous votre chalet. Nous nous occupons du reste.',
    heroCopy:
      'Gestion des voyageurs, préparation du logement, ménage, linge, suivi des séjours et accompagnement local : MyStay prend soin de votre location saisonnière à Saint-Nicolas-de-Véroce.',
    reassurance: 'Présence locale · Gestion personnalisée · Guide voyageur MyStay',
    ownerTitle: 'Profitez de votre logement. Nous gérons les séjours.',
    ownerCopy:
      'MyStay prend en charge la gestion quotidienne définie avec vous. Vous gardez un interlocuteur identifié et un suivi adapté au fonctionnement réel de votre logement.',
    localHeading: 'Gérer un logement à Saint-Nicolas-de-Véroce',
    localCopy:
      'Chalet au village, secteur des Chattrix ou logement plus isolé : les accès, le stationnement et les conditions de montagne demandent une préparation adaptée à chaque adresse.',
    faq: [
      {
        question: 'Quels services votre conciergerie prend-elle en charge ?',
        answer:
          'La gestion des voyageurs, les arrivées et départs, la préparation, le ménage et le linge selon l’organisation retenue, le suivi du logement et le guide MyStay.',
      },
      {
        question: 'Pouvez-vous gérer une location diffusée sur Airbnb ?',
        answer:
          'Oui, lorsque le fonctionnement du logement et le périmètre confié le permettent. MyStay n’est pas présenté comme partenaire officiel d’Airbnb.',
      },
      {
        question: 'Prenez-vous en charge le ménage et le linge ?',
        answer:
          'Oui, leur organisation est définie avec le propriétaire selon le logement et le rythme des séjours.',
      },
      {
        question: 'Intervenez-vous sur les chalets éloignés du village ?',
        answer:
          'Chaque logement est étudié individuellement, notamment selon son accès, son stationnement et son éloignement.',
      },
      {
        question: 'Comment gérez-vous les arrivées lorsque les accès sont difficiles ?',
        answer:
          'Les informations d’accès sont préparées en amont et adaptées aux particularités connues du logement et aux conditions du séjour.',
      },
      {
        question: 'Puis-je vous déléguer seulement une partie de la gestion ?',
        answer:
          'Oui. Le niveau de délégation est défini avec le propriétaire après l’étude du logement et de ses besoins.',
      },
      {
        question: 'Comment se déroule la mise en gestion d’un nouveau logement ?',
        answer:
          'Un premier échange est suivi d’une visite, de la préparation du fonctionnement et du guide, puis de la mise en gestion.',
      },
    ],
  },
}

export function getLocalConciergeLandingContent(
  destination: LocalSeoDestination,
): LocalConciergeLandingContent {
  const localContent = localContentBySlug[destination.slug]
  if (localContent) return localContent

  const concierge = destination.services.concierge
  return {
    promise: concierge.sectionTitle,
    heroCopy: concierge.intro,
    reassurance: 'Gestion personnalisée · Guide voyageur MyStay',
    ownerTitle: concierge.sectionTitle,
    ownerCopy: concierge.sectionCopy,
    localHeading: concierge.localTitle,
    localCopy: concierge.localCopy,
    faq: concierge.faq,
  }
}
