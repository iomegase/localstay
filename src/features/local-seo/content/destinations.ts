export type LocalSeoIntent = 'concierge' | 'seminar' | 'vacation-rental'
export type LocalServiceIntent = Extract<LocalSeoIntent, 'concierge' | 'seminar'>

type LocalHighlight = {
  title: string
  copy: string
}

type LocalStep = {
  title: string
  copy: string
}

type LocalFaq = {
  question: string
  answer: string
}

export type LocalServiceContent = {
  published: boolean
  eyebrow: string
  h1: string
  metaDescription: string
  intro: string
  sectionTitle: string
  sectionCopy: string
  highlights: readonly LocalHighlight[]
  processTitle: string
  steps: readonly LocalStep[]
  localTitle: string
  localCopy: string
  faq: readonly LocalFaq[]
  ctaLabel: string
  ctaHref: string
}

export type LocalVacationRentalContent = {
  eyebrow: string
  h1: string
  metaDescription: string
  intro: string
  localTitle: string
  localCopy: string
  emptyCopy: string
}

export type LocalSeoDestination = {
  slug: string
  name: string
  services: {
    concierge: LocalServiceContent
    seminar: LocalServiceContent
    vacationRental: LocalVacationRentalContent
  }
}

const conciergeContactPath = '/confier-mon-logement'
const seminarContactPath =
  'mailto:bonjour@mystay.city?subject=Organisation%20d%27un%20s%C3%A9minaire%20MyStay'

export const localSeoDestinations = [
  {
    slug: 'saint-gervais-les-bains',
    name: 'Saint-Gervais-les-Bains',
    services: {
      concierge: {
        published: true,
        eyebrow: 'Conciergerie locale · Pays du Mont-Blanc',
        h1: 'Conciergerie à Saint-Gervais-les-Bains',
        metaDescription:
          'Conciergerie à Saint-Gervais-les-Bains : accueil voyageurs, ménage, linge, intendance et guide digital avec un interlocuteur MyStay.',
        intro:
          'MyStay accompagne les propriétaires de Saint-Gervais-les-Bains dans le suivi quotidien de leur location saisonnière, de la préparation du logement à l’accueil des voyageurs.',
        sectionTitle: 'Un logement prêt, un séjour bien accompagné.',
        sectionCopy:
          'L’organisation s’adapte au logement et au niveau de délégation recherché. Chaque intervention est préparée avec un interlocuteur identifié, sans ajouter de service qui ne correspond pas à votre besoin.',
        highlights: [
          {
            title: 'Accueil des voyageurs',
            copy: 'Des arrivées préparées et les informations utiles réunies dans le guide digital MyStay.',
          },
          {
            title: 'Ménage et linge',
            copy: 'La remise en état et la rotation du linge sont coordonnées entre les séjours.',
          },
          {
            title: 'Intendance locale',
            copy: 'Un suivi du logement et des besoins pratiques depuis Saint-Gervais-les-Bains.',
          },
        ],
        processTitle: 'Comment démarre l’accompagnement ?',
        steps: [
          {
            title: 'Découvrir le logement',
            copy: 'Nous échangeons sur son fonctionnement, son accès et vos priorités.',
          },
          {
            title: 'Définir les interventions',
            copy: 'Accueil, ménage, linge, intendance et guide sont cadrés selon votre situation.',
          },
          {
            title: 'Coordonner les séjours',
            copy: 'Les informations utiles sont centralisées pour faciliter chaque rotation.',
          },
        ],
        localTitle: 'Une présence au cœur de Saint-Gervais-les-Bains',
        localCopy:
          'Du centre de Saint-Gervais aux secteurs du Bettex et du Fayet, les accès et les rythmes de séjour diffèrent. L’accompagnement tient compte de ces réalités locales et de la configuration de chaque logement.',
        faq: [
          {
            question: 'Quels types de logements accompagnez-vous ?',
            answer:
              'MyStay étudie les appartements, chalets et maisons situés dans son secteur d’intervention actuel.',
          },
          {
            question: 'Puis-je choisir seulement certains services ?',
            answer:
              'Oui. Le périmètre est défini après un premier échange sur le logement et vos besoins.',
          },
          {
            question: 'Le guide digital est-il inclus dans l’accompagnement ?',
            answer:
              'Il peut réunir les informations d’arrivée, le fonctionnement du logement et les recommandations utiles au séjour.',
          },
        ],
        ctaLabel: 'Confier mon logement',
        ctaHref: conciergeContactPath,
      },
      seminar: {
        published: true,
        eyebrow: 'Séminaires · Pays du Mont-Blanc',
        h1: 'Séminaire à Saint-Gervais-les-Bains',
        metaDescription:
          'Organisez un séminaire à Saint-Gervais-les-Bains avec MyStay : hébergements, lieux de travail, repas, transferts et activités coordonnés.',
        intro:
          'Saint-Gervais-les-Bains permet de réunir travail et respiration en montagne. MyStay coordonne les éléments du séjour à partir de votre brief et des lieux disponibles.',
        sectionTitle: 'Un format construit autour de votre équipe.',
        sectionCopy:
          'Réunion, hébergement, repas, déplacements et temps collectifs sont pensés dans un même déroulé. Le programme reste adapté à vos objectifs, à vos dates et aux solutions réellement disponibles.',
        highlights: [
          {
            title: 'Hébergements',
            copy: 'Des logements MyStay ou plusieurs adresses coordonnées selon la composition du groupe.',
          },
          {
            title: 'Temps de travail',
            copy: 'Des salles et configurations recherchées selon le format de vos réunions.',
          },
          {
            title: 'Logistique locale',
            copy: 'Repas, transferts et activités sont articulés pour préserver le rythme du séjour.',
          },
        ],
        processTitle: 'De votre brief au séjour',
        steps: [
          {
            title: 'Partager les objectifs',
            copy: 'Dates, rythme, besoins de travail et attentes de l’équipe servent de point de départ.',
          },
          {
            title: 'Composer le programme',
            copy: 'MyStay recherche les hébergements, lieux et partenaires adaptés au format.',
          },
          {
            title: 'Coordonner sur place',
            copy: 'Les différentes étapes sont reliées par un interlocuteur et un déroulé communs.',
          },
        ],
        localTitle: 'Saint-Gervais, entre village et montagne',
        localCopy:
          'La commune offre plusieurs ambiances entre le centre, Le Fayet et les hauteurs. Ce relief permet de construire un séminaire alternant sessions de travail, repas partagés et moments en extérieur.',
        faq: [
          {
            question: 'Pouvez-vous coordonner plusieurs hébergements ?',
            answer:
              'Oui, lorsqu’un groupe doit être réparti, MyStay peut organiser un déroulé commun entre plusieurs logements.',
          },
          {
            question: 'Les repas et transferts peuvent-ils être intégrés ?',
            answer:
              'Ils peuvent être coordonnés selon le programme, les partenaires disponibles et les besoins transmis.',
          },
          {
            question: 'Comment recevoir une proposition ?',
            answer:
              'Envoyez vos dates, objectifs et principales contraintes par e-mail pour commencer le cadrage.',
          },
        ],
        ctaLabel: 'Parler de mon séminaire',
        ctaHref: seminarContactPath,
      },
      vacationRental: {
        eyebrow: 'Séjours · Pays du Mont-Blanc',
        h1: 'Locations de vacances à Saint-Gervais-les-Bains',
        metaDescription:
          'Découvrez les locations de vacances publiées par MyStay à Saint-Gervais-les-Bains et accédez à leur fiche détaillée.',
        intro:
          'Retrouvez les logements actuellement publiés par MyStay à Saint-Gervais-les-Bains, avec leurs équipements, leurs espaces et leur lien de réservation lorsqu’il est configuré.',
        localTitle: 'Séjourner à Saint-Gervais-les-Bains',
        localCopy:
          'La commune relie le village, les thermes, Le Fayet et les secteurs d’altitude. Chaque fiche précise le secteur public du logement pour vous aider à choisir votre point de départ.',
        emptyCopy:
          'Les logements de Saint-Gervais-les-Bains apparaîtront ici après validation de leur fiche publique.',
      },
    },
  },
  {
    slug: 'saint-nicolas-de-veroce',
    name: 'Saint-Nicolas-de-Véroce',
    services: {
      concierge: {
        published: true,
        eyebrow: 'Conciergerie locale · Village de montagne',
        h1: 'Conciergerie à Saint-Nicolas-de-Véroce',
        metaDescription:
          'Confiez votre location saisonnière à MyStay à Saint-Nicolas-de-Véroce : voyageurs, arrivées, ménage, linge, suivi et guide personnalisé.',
        intro:
          'À Saint-Nicolas-de-Véroce, MyStay suit les locations saisonnières avec une organisation attentive aux accès, aux équipements et au rythme particulier d’un village de montagne.',
        sectionTitle: 'Une intendance adaptée à chaque adresse.',
        sectionCopy:
          'Chalet familial, appartement ou résidence secondaire : le fonctionnement est défini avec le propriétaire. Les consignes du logement et les informations de séjour restent claires pour chaque arrivée.',
        highlights: [
          {
            title: 'Préparation des arrivées',
            copy: 'Les accès, consignes et informations indispensables sont vérifiés avant le séjour.',
          },
          {
            title: 'Suivi entre deux séjours',
            copy: 'Ménage, linge et points pratiques sont organisés selon le périmètre convenu.',
          },
          {
            title: 'Informations locales',
            copy: 'Le guide MyStay aide les voyageurs à comprendre le logement et son environnement.',
          },
        ],
        processTitle: 'Un cadre simple pour votre logement',
        steps: [
          {
            title: 'Faire le point sur place',
            copy: 'Nous recensons les accès, équipements, consignes et particularités de l’adresse.',
          },
          {
            title: 'Préparer le parcours voyageur',
            copy: 'Les informations d’arrivée et d’usage sont structurées avant la mise en service.',
          },
          {
            title: 'Suivre les rotations',
            copy: 'Les interventions retenues sont coordonnées autour du calendrier transmis.',
          },
        ],
        localTitle: 'Connaître les contraintes du village',
        localCopy:
          'Les distances, les accès en pente et les conditions de montagne demandent une préparation précise. MyStay prend ces éléments en compte lors du cadrage de l’accompagnement.',
        faq: [
          {
            question: 'Intervenez-vous bien à Saint-Nicolas-de-Véroce ?',
            answer:
              'Oui, Saint-Nicolas-de-Véroce fait partie du secteur d’intervention actuel de MyStay.',
          },
          {
            question: 'Comment sont transmises les consignes du chalet ?',
            answer:
              'Elles peuvent être réunies dans le guide digital, avec les informations pratiques utiles à l’arrivée et au séjour.',
          },
          {
            question: 'L’accompagnement est-il identique pour chaque logement ?',
            answer:
              'Non. Il est défini à partir de l’adresse, des équipements et du niveau de délégation souhaité.',
          },
        ],
        ctaLabel: 'Confier mon logement',
        ctaHref: conciergeContactPath,
      },
      seminar: {
        published: true,
        eyebrow: 'Séminaires · Retraite en montagne',
        h1: 'Séminaire à Saint-Nicolas-de-Véroce',
        metaDescription:
          'Préparez un séminaire à Saint-Nicolas-de-Véroce avec MyStay : hébergement, travail, repas, déplacements et expériences locales coordonnés.',
        intro:
          'Saint-Nicolas-de-Véroce offre un cadre calme pour réunir une équipe au même endroit. MyStay compose le séjour autour des temps de travail et des moments partagés.',
        sectionTitle: 'Se retrouver dans un cadre plus confidentiel.',
        sectionCopy:
          'Le village convient aux formats qui privilégient la proximité entre participants. L’hébergement, les repas et les déplacements sont étudiés ensemble pour limiter les ruptures dans le programme.',
        highlights: [
          {
            title: 'Séjour regroupé',
            copy: 'Les solutions d’hébergement sont recherchées pour conserver une dynamique collective.',
          },
          {
            title: 'Programme équilibré',
            copy: 'Travail, repas et temps de respiration s’organisent sans surcharger les journées.',
          },
          {
            title: 'Coordination',
            copy: 'MyStay relie les lieux et partenaires retenus dans un déroulé partagé.',
          },
        ],
        processTitle: 'Préparer une retraite d’équipe',
        steps: [
          {
            title: 'Qualifier le format',
            copy: 'Nous partons de la durée, des objectifs et des temps collectifs attendus.',
          },
          {
            title: 'Vérifier les solutions locales',
            copy: 'Les lieux sont sélectionnés selon les besoins et leur disponibilité réelle.',
          },
          {
            title: 'Construire le fil du séjour',
            copy: 'Chaque déplacement et rendez-vous trouve sa place dans un programme lisible.',
          },
        ],
        localTitle: 'Un village face au massif du Mont-Blanc',
        localCopy:
          'Le cadre de Saint-Nicolas-de-Véroce favorise des séjours où l’équipe reste proche de son lieu de vie. Les activités et partenaires sont choisis selon la saison et le projet.',
        faq: [
          {
            question: 'Ce lieu convient-il à un séminaire résidentiel ?',
            answer:
              'Le village se prête aux formats résidentiels lorsque les hébergements et espaces adaptés sont disponibles aux dates demandées.',
          },
          {
            question: 'Pouvez-vous intégrer une activité de montagne ?',
            answer:
              'Une activité peut être recherchée selon la saison, le niveau du groupe et les conditions du moment.',
          },
          {
            question: 'Par quoi commencer ?',
            answer:
              'Transmettez le contexte, les dates et le rythme souhaité afin que MyStay puisse étudier le format.',
          },
        ],
        ctaLabel: 'Parler de mon séminaire',
        ctaHref: seminarContactPath,
      },
      vacationRental: {
        eyebrow: 'Séjours · Village de montagne',
        h1: 'Locations de vacances à Saint-Nicolas-de-Véroce',
        metaDescription:
          'Consultez les locations de vacances publiées par MyStay à Saint-Nicolas-de-Véroce et leurs informations de séjour.',
        intro:
          'Découvrez les logements MyStay publiés à Saint-Nicolas-de-Véroce, un village de montagne où les chalets et appartements s’inscrivent dans un environnement préservé.',
        localTitle: 'Choisir Saint-Nicolas-de-Véroce',
        localCopy:
          'Le village s’étend sur plusieurs secteurs. Les fiches indiquent la zone publique du logement et les caractéristiques validées pour préparer votre séjour.',
        emptyCopy:
          'Aucune fiche publique n’est disponible pour le moment dans le village ; cette page sera complétée lorsqu’un logement aura été validé.',
      },
    },
  },
  {
    slug: 'megeve',
    name: 'Megève',
    services: {
      concierge: {
        published: false,
        eyebrow: 'Conciergerie locale',
        h1: 'Conciergerie à Megève',
        metaDescription: 'Page de conciergerie MyStay à Megève non publiée.',
        intro: 'Le service de conciergerie MyStay à Megève n’est pas encore publié.',
        sectionTitle: 'Service non publié',
        sectionCopy: 'Cette destination reste en préparation.',
        highlights: [],
        processTitle: 'Service non publié',
        steps: [],
        localTitle: 'Service non publié',
        localCopy: 'Cette destination reste en préparation.',
        faq: [],
        ctaLabel: 'Confier mon logement',
        ctaHref: conciergeContactPath,
      },
      seminar: {
        published: false,
        eyebrow: 'Séminaires',
        h1: 'Séminaire à Megève',
        metaDescription: 'Page séminaire MyStay à Megève non publiée.',
        intro: 'Le service séminaire MyStay à Megève n’est pas encore publié.',
        sectionTitle: 'Service non publié',
        sectionCopy: 'Cette destination reste en préparation.',
        highlights: [],
        processTitle: 'Service non publié',
        steps: [],
        localTitle: 'Service non publié',
        localCopy: 'Cette destination reste en préparation.',
        faq: [],
        ctaLabel: 'Parler de mon séminaire',
        ctaHref: seminarContactPath,
      },
      vacationRental: {
        eyebrow: 'Séjours · Mont-Blanc',
        h1: 'Locations de vacances à Megève',
        metaDescription:
          'Découvrez les locations de vacances publiées par MyStay à Megève et ouvrez leurs fiches détaillées.',
        intro:
          'Cette sélection réunit uniquement les logements dont la fiche MyStay est publiée à Megève, sans prix ni disponibilité ajoutés.',
        localTitle: 'Préparer un séjour à Megève',
        localCopy:
          'Chaque adresse possède son propre environnement, du village aux secteurs plus résidentiels. Consultez la fiche du logement pour connaître ses caractéristiques publiques.',
        emptyCopy:
          'MyStay ne présente pas encore de logement public à Megève. Les futures fiches apparaîtront ici après leur validation.',
      },
    },
  },
  {
    slug: 'combloux',
    name: 'Combloux',
    services: {
      concierge: {
        published: false,
        eyebrow: 'Conciergerie locale',
        h1: 'Conciergerie à Combloux',
        metaDescription: 'Page de conciergerie MyStay à Combloux non publiée.',
        intro: 'Le service de conciergerie MyStay à Combloux n’est pas encore publié.',
        sectionTitle: 'Service non publié',
        sectionCopy: 'Cette destination reste en préparation.',
        highlights: [],
        processTitle: 'Service non publié',
        steps: [],
        localTitle: 'Service non publié',
        localCopy: 'Cette destination reste en préparation.',
        faq: [],
        ctaLabel: 'Confier mon logement',
        ctaHref: conciergeContactPath,
      },
      seminar: {
        published: false,
        eyebrow: 'Séminaires',
        h1: 'Séminaire à Combloux',
        metaDescription: 'Page séminaire MyStay à Combloux non publiée.',
        intro: 'Le service séminaire MyStay à Combloux n’est pas encore publié.',
        sectionTitle: 'Service non publié',
        sectionCopy: 'Cette destination reste en préparation.',
        highlights: [],
        processTitle: 'Service non publié',
        steps: [],
        localTitle: 'Service non publié',
        localCopy: 'Cette destination reste en préparation.',
        faq: [],
        ctaLabel: 'Parler de mon séminaire',
        ctaHref: seminarContactPath,
      },
      vacationRental: {
        eyebrow: 'Séjours · Balcon du Mont-Blanc',
        h1: 'Locations de vacances à Combloux',
        metaDescription:
          'Retrouvez les locations de vacances publiées par MyStay à Combloux et consultez leurs équipements validés.',
        intro:
          'La page rassemble les logements MyStay réellement publiés à Combloux, avec un accès direct à leur description complète.',
        localTitle: 'Découvrir Combloux depuis votre logement',
        localCopy:
          'Entre le centre du village et les versants ouverts sur le Mont-Blanc, la localisation influence le séjour. Les informations affichées restent celles validées sur chaque fiche.',
        emptyCopy:
          'Vous pouvez parcourir la sélection générale en attendant la validation d’une première fiche locale.',
      },
    },
  },
] as const satisfies readonly LocalSeoDestination[]

export function getLocalSeoDestination(slug: string): LocalSeoDestination | null {
  return localSeoDestinations.find(destination => destination.slug === slug) ?? null
}

export function listPublishedServiceDestinations(
  intent: LocalServiceIntent,
): LocalSeoDestination[] {
  return localSeoDestinations.filter(destination => destination.services[intent].published)
}
