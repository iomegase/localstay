// Spec 082 : bibliothèque de FAQ génériques, issue des questions rédigées par le PO (« Le 305 »).
// Jetons remplis par logement : {ville}, {voyageurs}, {chambres}.
// Les passages entre crochets sont à adapter par le propriétaire (badge « À adapter »).

export type FaqLibraryItem = { id: string; question: string; answer: string }

export const FAQ_LIBRARY: FaqLibraryItem[] = [
  {
    id: 'capacite',
    question: 'Quelle est la capacité maximale du logement ?',
    answer: 'Le logement peut accueillir confortablement {voyageurs}. Cette capacité correspond au nombre maximal de voyageurs pouvant occuper les couchages prévus.\n\nLes enfants en bas âge dormant dans un lit bébé ou un lit d’appoint adapté peuvent faire exception.',
  },
  {
    id: 'couchages',
    question: 'Comment sont répartis les couchages ?',
    answer: 'Le logement dispose de {chambres}, avec la configuration suivante : [détail des couchages : lit double, lits simples, canapé-lit…].\n\nChaque espace nuit est pensé pour offrir confort et intimité, en famille comme entre amis. Les lits bébé et lits d’appoint ne sont pas comptés dans les couchages standards.',
  },
  {
    id: 'horaires',
    question: 'À quelle heure peut-on arriver et repartir ?',
    answer: 'Le logement est disponible à partir de **16 h** le jour de votre arrivée. Le départ doit être effectué avant **10 h**.\n\nCes horaires permettent de préparer soigneusement le logement entre chaque séjour. Selon les réservations, une arrivée anticipée (**early check-in**) ou un départ tardif (**late check-out**) peuvent parfois être proposés : la conciergerie vous en informe directement.',
  },
  {
    id: 'arrivee-autonome',
    question: 'L’arrivée est-elle autonome ?',
    answer: 'Oui. Vous recevez avant votre séjour toutes les informations nécessaires pour rejoindre le logement et y accéder facilement.\n\nLes instructions détaillées d’arrivée sont également disponibles dans votre guide numérique MyStay.',
  },
  {
    id: 'linge',
    question: 'Le linge de lit et les serviettes sont-ils fournis ?',
    answer: 'Oui. Le linge de lit et les serviettes de toilette sont préparés en fonction du nombre de voyageurs indiqué dans votre réservation.\n\nLes lits sont faits à votre arrivée, pour que vous profitiez de votre séjour dès votre installation.',
  },
  {
    id: 'menage',
    question: 'Le ménage de fin de séjour est-il inclus ?',
    answer: 'Le ménage de fin de séjour est [inclus / facturé séparément].\n\nNous vous demandons simplement de laisser le logement en bon état avant votre départ : vaisselle rangée, réfrigérateur vidé et déchets déposés au point de tri. Notre équipe prépare ensuite intégralement le logement pour les voyageurs suivants.',
  },
  {
    id: 'parking',
    question: 'Le logement dispose-t-il d’un parking ?',
    answer: '[Oui, une place de stationnement est disponible / Non, mais des parkings se trouvent à proximité].\n\nLes informations précises sur l’accès, le stationnement et les éventuelles restrictions vous sont communiquées avant votre arrivée dans votre guide numérique.',
  },
  {
    id: 'hiver',
    question: 'L’accès au logement est-il facile en hiver ?',
    answer: 'Oui, le logement reste accessible pendant la saison hivernale. En montagne, les conditions de circulation peuvent toutefois évoluer rapidement en cas de fortes chutes de neige.\n\nNous vous recommandons un véhicule équipé pour l’hiver et de prévoir des chaînes ou des chaussettes à neige. Les informations particulières d’accès en hiver figurent dans votre guide d’arrivée.',
  },
  {
    id: 'animaux',
    question: 'Les animaux sont-ils acceptés ?',
    answer: 'Les animaux [ne sont pas acceptés / sont acceptés sur demande] dans ce logement.',
  },
  {
    id: 'bebes',
    question: 'Quels équipements sont disponibles pour les bébés ?',
    answer: 'Un lit bébé et une chaise haute peuvent être mis à votre disposition, sur demande au moment de la réservation.\n\nSignalez-nous la présence d’un bébé avant votre arrivée afin que nous préparions les équipements dans les meilleures conditions.',
  },
  {
    id: 'pistes',
    question: 'À quelle distance se trouvent les pistes et les remontées mécaniques ?',
    answer: 'Les remontées mécaniques les plus proches se trouvent à environ [X minutes à pied / en voiture] du logement.',
  },
  {
    id: 'centre',
    question: 'Peut-on rejoindre le centre et les commerces à pied ?',
    answer: 'Le centre de {ville} se trouve à environ [X minutes à pied]. Vous y trouverez les principaux commerces et services : boulangeries, restaurants, supermarchés, pharmacie et commerces locaux.\n\nVotre guide numérique vous propose aussi une sélection d’adresses recommandées à proximité du logement.',
  },
  {
    id: 'services',
    question: 'Quels services MyStay peut-on réserver pendant le séjour ?',
    answer: 'MyStay peut organiser différents services pour faciliter votre séjour : courses livrées avant votre arrivée, petit-déjeuner, chef à domicile, réservations de restaurants, transferts, location de matériel ou organisation d’activités, selon les disponibilités.\n\nNous pouvons également vous conseiller des adresses et des expériences autour de votre lieu de séjour. Certains services nécessitent une réservation préalable.',
  },
]

export type FaqLodgingContext = { cityName: string | null; maxGuests: number | null; bedroomCount: number | null }

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count > 1 ? pluralForm : singular}`
}

/** Spec 082 AC-01-02 : remplace les jetons par les informations du logement. */
export function fillFaqTemplate(item: FaqLibraryItem, context: FaqLodgingContext): { question: string; answer: string } {
  const fill = (text: string) => text
    .replaceAll('{ville}', context.cityName?.trim() || 'la station')
    .replaceAll('{voyageurs}', context.maxGuests && context.maxGuests > 0 ? `jusqu’à ${plural(context.maxGuests, 'personne', 'personnes')}` : '[X] personnes')
    .replaceAll('{chambres}', context.bedroomCount && context.bedroomCount > 0 ? plural(context.bedroomCount, 'chambre', 'chambres') : '[X chambres]')
  return { question: fill(item.question), answer: fill(item.answer) }
}

/** Spec 082 AC-01-03 : un passage entre crochets reste à adapter. */
export function needsAdaptation(text: string): boolean {
  return /\[[^\]]+\]/.test(text)
}

const questionKey = (question: string) => question.normalize('NFC').trim().toLowerCase().replace(/\s+/g, ' ')

/** Spec 082 AC-02-02 : questions de la bibliothèque absentes de la FAQ du logement. */
export function missingLibraryItems(present: Array<{ question: string }>): FaqLibraryItem[] {
  const existing = new Set(present.map(row => questionKey(row.question)))
  return FAQ_LIBRARY.filter(item => !existing.has(questionKey(item.question)))
}
