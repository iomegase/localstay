import type { Metadata } from 'next'
import {
  ArrowRight,
  BedDouble,
  Bus,
  Check,
  Heart,
  Mountain,
  Presentation,
  Sparkles,
  Users,
  Waves,
} from 'lucide-react'

import {
  MarketingEyebrow,
  MarketingShell,
  marketingContainerClass,
  marketingPrimaryButtonClass,
} from '@/features/marketing/components/MarketingShell'

export const metadata: Metadata = {
  title: 'Séminaire d’entreprise en Haute-Savoie | MyStay',
  description:
    'MyStay organise vos séminaires à Saint-Gervais-les-Bains et dans le Pays du Mont-Blanc : hébergement, salles de réunion, repas, transferts, activités et bien-être.',
  alternates: {
    canonical: '/seminaires',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: '/seminaires',
    title: 'Séminaire d’entreprise en Haute-Savoie | MyStay',
    description:
      'Hébergement face au Mont-Blanc, salles de réunion, repas, transferts et activités : MyStay coordonne votre séminaire dans le Pays du Mont-Blanc.',
  },
}

const contactHref =
  'mailto:bonjour@mystay.city?subject=Organisation%20d%27un%20s%C3%A9minaire%20MyStay'

const heroFacts = [
  {
    icon: Users,
    title: '14 à 26 personnes',
    copy: 'réunies dans un même lieu',
  },
  {
    icon: BedDouble,
    title: 'Groupes plus importants',
    copy: 'organisation multi-sites',
  },
  {
    icon: Presentation,
    title: 'Salles de réunion',
    copy: 'dans la vallée',
  },
  {
    icon: Bus,
    title: 'Transferts',
    copy: 'aller-retour organisés',
  },
] as const

const seminarRhythm = [
  {
    number: '01',
    title: 'Travailler',
    copy: 'Réunions, ateliers, décisions.',
  },
  {
    number: '02',
    title: 'Échanger',
    copy: 'Créer de vrais temps collectifs.',
  },
  {
    number: '03',
    title: 'Déjeuner',
    copy: 'Partager sans casser le rythme.',
  },
  {
    number: '04',
    title: 'Respirer',
    copy: 'Changer de cadre quelques instants.',
  },
  {
    number: '05',
    title: 'Reprendre',
    copy: 'Revenir au travail autrement.',
  },
  {
    number: '06',
    title: 'Partager',
    copy: 'Prolonger les échanges le soir.',
  },
] as const

const formats = [
  {
    title: 'Comité de direction',
    copy:
      'Décider, aligner les priorités et prendre du recul dans un cadre calme et confidentiel.',
  },
  {
    title: 'Séminaire de travail',
    copy:
      'Avancer sur un projet, organiser des ateliers et concentrer plusieurs temps de travail sur une ou plusieurs journées.',
  },
  {
    title: 'Retraite d’équipe',
    copy:
      'Sortir du quotidien, travailler autrement et prendre davantage de recul sur les projets et les objectifs.',
  },
  {
    title: 'Séminaire de cohésion',
    copy:
      'Créer du lien en équilibrant temps de travail, repas, activités et moments informels.',
  },
] as const

const samePlaceBenefits = [
  'Toute l’équipe réunie dans un même lieu',
  'Espaces communs pour prolonger les échanges',
  'Possibilité d’organiser les repas sur place',
  'Moins de déplacements pendant le séjour',
  'Un environnement face au Mont-Blanc',
] as const

const largeGroupBenefits = [
  'Hébergements répartis à proximité',
  'Salle de réunion adaptée au nombre de participants',
  'Transferts aller-retour entre hébergements et salle',
  'Coordination des horaires et des déplacements',
  'Un interlocuteur MyStay pour l’ensemble de la logistique',
] as const

const meetingRoomPrinciples = [
  {
    number: '01',
    title: 'Un espace adapté à votre format',
    copy:
      'Réunion plénière, atelier en petits groupes, comité de direction ou présentation : le lieu est choisi en fonction de l’usage réel et du nombre de participants.',
  },
  {
    number: '02',
    title: 'Du fonctionnel au plus inspirant',
    copy:
      'Certaines salles privilégient l’efficacité et les équipements. D’autres offrent davantage de calme, de confidentialité ou un environnement remarquable pour prendre du recul.',
  },
  {
    number: '03',
    title: 'Une logistique qui reste fluide',
    copy:
      'Selon le lieu retenu, café d’accueil, pauses et repas peuvent être servis sur place. Pour les groupes hébergés ailleurs, MyStay peut également organiser les transferts aller-retour.',
  },
] as const

const meals = [
  {
    title: 'Petit-déjeuner',
    copy:
      'Au chalet ou sur le lieu du séminaire pour commencer la journée ensemble, sans déplacement inutile.',
  },
  {
    title: 'Café & pauses',
    copy:
      'Café, thé, boissons et collations peuvent être prévus entre les différentes sessions de travail.',
  },
  {
    title: 'Déjeuner',
    copy:
      'Servi sur place lorsque le lieu le permet, pour préserver le rythme et éviter les déplacements.',
  },
  {
    title: 'Dîner',
    copy:
      'Au chalet, au restaurant ou autour d’une formule choisie selon l’ambiance souhaitée pour la soirée.',
  },
] as const

const activities = [
  {
    icon: Waves,
    title: 'Qi Gong',
    copy:
      'Une pratique douce pour respirer, relâcher les tensions et retrouver de la disponibilité avant ou après une session de travail.',
  },
  {
    icon: Heart,
    title: 'Yoga',
    copy:
      'Relaxation, mobilité douce ou temps de récupération peuvent s’intégrer naturellement au programme.',
  },
  {
    icon: Mountain,
    title: 'Randonnée',
    copy:
      'Une sortie en montagne pour prendre l’air, marcher ensemble et changer temporairement de rythme.',
  },
  {
    icon: Sparkles,
    title: 'Découverte locale',
    copy:
      'Gastronomie, patrimoine ou expérience locale selon la saison, les envies et le temps disponible.',
  },
] as const

const steps = [
  {
    number: '01',
    title: 'Vous partagez votre brief',
    copy:
      'Dates, nombre de participants, objectifs, budget, durée et rythme souhaité.',
  },
  {
    number: '02',
    title: 'Nous construisons le séjour',
    copy:
      'Hébergement, salle, repas, transferts et temps collectifs sont organisés autour de vos objectifs.',
  },
  {
    number: '03',
    title: 'Nous coordonnons chaque détail',
    copy:
      'MyStay centralise les échanges avec les lieux, prestataires et partenaires locaux.',
  },
  {
    number: '04',
    title: 'Votre équipe se concentre sur l’essentiel',
    copy:
      'La logistique s’efface pour laisser la place au travail, aux échanges et aux moments collectifs.',
  },
] as const

const faqs = [
  {
    question: 'Combien de personnes pouvez-vous accueillir dans un même lieu ?',
    answer:
      'Nous pouvons réunir des groupes de 14 à 26 personnes dans un même lieu, selon les dates et les disponibilités, avec espaces communs et environnement face au Mont-Blanc.',
  },
  {
    question:
      'Pouvez-vous organiser des séminaires pour des groupes plus importants ?',
    answer:
      'Oui. Pour les groupes de plus de 26 personnes, nous pouvons répartir les participants dans plusieurs hébergements et coordonner l’ensemble de la logistique.',
  },
  {
    question: 'Disposez-vous de salles de réunion ?',
    answer:
      'Nous travaillons avec plusieurs salles dans la vallée. Elles sont sélectionnées selon la taille du groupe, le type de réunion, les équipements nécessaires et l’ambiance recherchée.',
  },
  {
    question: 'Les repas peuvent-ils être servis sur place ?',
    answer:
      'Oui, selon le lieu retenu. Petit-déjeuner, café d’accueil, pauses, déjeuner ou dîner peuvent être organisés directement sur place ou à proximité.',
  },
  {
    question: 'Organisez-vous les transferts ?',
    answer:
      'Oui. Pour les groupes répartis sur plusieurs lieux, MyStay peut coordonner les transferts aller-retour entre les hébergements, la salle de réunion, les repas et les activités.',
  },

  {
    question: 'Intervenez-vous uniquement à Saint-Gervais-les-Bains ?',
    answer:
      'Notre terrain principal est Saint-Gervais-les-Bains et le Pays du Mont-Blanc. Le lieu final dépend du format, du nombre de participants et des disponibilités.',
  },
] as const

export default function SeminarsPage() {
  return (
    <MarketingShell>
      <div className="overflow-hidden">
        {/* =====================================================
            HERO
        ====================================================== */}
        <section className={`${marketingContainerClass} pt-0 sm:pt-8`}>
          <div
            data-testid="seminar-hero"
            className="relative flex min-h-[690px] flex-col overflow-hidden rounded-[26px] px-7 pb-8 pt-12 text-slate-900 min-[761px]:min-h-[590px] min-[761px]:rounded-[30px] min-[761px]:px-[54px] min-[761px]:pb-[42px] min-[761px]:pt-[58px]"
          >
            <div className="relative z-10 my-auto max-w-[680px]">
              <MarketingEyebrow>
                Séminaires d’entreprise en Haute-Savoie
              </MarketingEyebrow>

              <h1 className="m-0 max-w-[640px] text-[clamp(42px,12vw,50px)] font-bold leading-[0.99] tracking-[-0.055em] text-slate-900 lg:text-[clamp(42px,4.8vw,50px)]">
                Réunir vos équipes.
                <br />

                <em className="font-serif font-normal italic tracking-[-0.035em]">
                  Prendre de la hauteur.
                </em>
              </h1>

              <p className="mt-7 max-w-[610px] text-sm leading-[1.72] text-slate-600 lg:text-[15px]">
                MyStay organise des séminaires à Saint-Gervais-les-Bains et
                dans le Pays du Mont-Blanc : hébergement, salles de réunion,
                repas, transferts et temps collectifs.
              </p>

              <p className="mt-3 max-w-[610px] text-sm leading-[1.72] text-slate-600 lg:text-[15px]">
              Un chalet, un lieu pour travailler, de bonnes tables et quelques expériences bien choisies. Nous réunissons tout ce dont votre équipe a besoin dans un séjour simple à organiser et agréable à vivre.
              </p>

              <div className="mt-[30px]">
                <a
                  href={contactHref}
                  className={marketingPrimaryButtonClass}
                >
                  Parler de mon séminaire
                </a>
              </div>
            </div>

            <div
              data-testid="seminar-hero-facts"
              className="relative z-10 grid grid-cols-1 gap-4 pt-10 sm:grid-cols-2 lg:grid-cols-4"
            >
              {heroFacts.map(({ icon: Icon, title, copy }) => (
                <div key={title} className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f7f6f4] text-pink-600">
                    <Icon
                      aria-hidden="true"
                      className="h-[17px] w-[17px]"
                      strokeWidth={1.7}
                    />
                  </span>

                  <div>
                    <strong className="block text-[10px] font-bold uppercase tracking-[0.05em] text-slate-700">
                      {title}
                    </strong>

                    <span className="mt-1 block text-[10px] leading-4 text-slate-500">
                      {copy}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================
            VISION
        ====================================================== */}

<section
  className={`${marketingContainerClass} pb-9 pt-[76px] sm:pb-14 sm:pt-24`}
>
  <div className="max-w-[980px]">
    <MarketingEyebrow>
      Notre vision du séminaire
    </MarketingEyebrow>

    <div className="mt-8 flex flex-col gap-10 lg:flex-row lg:gap-20">
      {/* COLONNE 1 */}
      <div className="flex-1">
        <h2 className="m-0 max-w-[520px] text-[clamp(34px,4vw,40px)] font-bold leading-[1.05] tracking-[-0.05em]">
          Un séminaire n’est pas une succession de prestations.
        </h2>

        <p className="mt-4 max-w-[500px] font-serif text-[26px] italic leading-[1.15] text-pink-600">
          C’est un rythme à construire.
        </p>
      </div>

      {/* COLONNE 2 */}
      <div className="flex-1">
        <p className="max-w-[520px] text-sm leading-[1.85] text-slate-500">
      Un bon séminaire trouve son équilibre entre temps de travail, échanges informels, repas, détente et moments partagés. 
        </p>

        <p className="mt-6 max-w-[520px] text-sm leading-[1.85] text-slate-500">
          Certains formats privilégient la réflexion et les décisions, d’autres la cohésion, le bien-être ou les expériences collectives. Le rythme se construit autour de votre équipe, de vos objectifs et du temps que vous choisissez de passer ensemble. 
        </p>
      </div>
    </div>
  </div>
</section>

        {/* =====================================================
            FORMATS
        ====================================================== */}
    {/* =====================================================
    FORMATS
====================================================== */}
<section
  className={`${marketingContainerClass} pb-[64px] pt-[52px] sm:pb-[82px] sm:pt-[68px]`}
>
  <div className="mb-10 max-w-[760px]">
    <MarketingEyebrow>
      Des formats adaptés à votre équipe
    </MarketingEyebrow>

    <h2 className="m-0 max-w-[700px] text-[clamp(34px,4vw,40px)] font-bold leading-[1.03] tracking-[-0.05em]">
      Quatre façons de se retrouver.
    </h2>

    <p className="mt-5 max-w-[620px] text-sm leading-[1.72] text-slate-500">
      Le bon format dépend moins d’une étiquette que de ce que votre équipe
      doit accomplir ensemble.
    </p>
  </div>

  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {[
      {
        title: 'Comité de direction',
        copy:
          'Prendre du recul, aligner les priorités et décider dans un cadre calme et confidentiel.',
      },
      {
        title: 'Séminaire de travail',
        copy:
          'Avancer sur un projet, organiser des ateliers et concentrer plusieurs temps de travail sur une ou plusieurs journées.',
      },
      {
        title: 'Retraite d’équipe',
        copy:
          'Sortir du quotidien, travailler autrement et prendre de la hauteur sur les projets, les priorités et les prochaines étapes.',
      },
      {
        title: 'Séminaire de cohésion',
        copy:
          'Renforcer les liens en équilibrant temps de travail, repas, activités et moments informels.',
      },
    ].map(format => (
      <article
        key={format.title}
        className="
          relative
          flex min-h-[200px] flex-col
          rounded-[24px]
          bg-[radial-gradient(circle_at_100%_0,rgba(219,39,119,0.055),transparent_34%)]
          bg-[#f7f6f4]
          px-6 py-7
          before:absolute
          before:left-6
          before:top-0
          before:h-[3px]
          before:w-[44px]
          before:rounded-b-full
          before:bg-pink-600
        "
      >
        <h3 className="m-0 text-[19px] font-bold leading-[1.2] tracking-[-0.035em] text-slate-900">
          {format.title}
        </h3>

        <p className="mb-0 mt-5 text-[12.5px] leading-[1.7] text-slate-500">
          {format.copy}
        </p>
      </article>
    ))}
  </div>
</section>

        {/* =====================================================
            CAPACITÉ & HÉBERGEMENT
        ====================================================== */}
  
<section
  data-testid="seminar-place"
  className="relative overflow-hidden bg-[radial-gradient(circle_at_10%_105%,rgba(219,39,119,0.14),transparent_31%)] bg-slate-800 py-12 text-white min-[761px]:py-[58px] min-[1051px]:py-[68px]"
>
  <div
    aria-hidden="true"
    className="pointer-events-none absolute right-[-115px] top-[-240px] aspect-square w-[390px] rounded-full border border-white/10"
  />

  <div className={marketingContainerClass}>
    <div className="mb-12 max-w-[720px]">
      <MarketingEyebrow light>
        Réunir l’équipe
      </MarketingEyebrow>

      <h2 className="m-0 max-w-[680px] font-serif text-[clamp(34px,10.5vw,40px)] font-normal leading-[1.08] tracking-[-0.035em] min-[761px]:text-[clamp(34px,4vw,40px)]">
        Un cadre commun
        <span className="block">
          pour toute l’équipe.
        </span>
      </h2>

      <p className="mt-6 max-w-[650px] text-[13px] leading-[1.75] text-slate-300 min-[761px]:text-sm">
        Jusqu’à 26 personnes dans un même lieu face au Mont-Blanc.
        Pour les groupes plus importants, MyStay coordonne l’ensemble
        des hébergements, des salles et des transferts.
      </p>
    </div>

    <div className="grid gap-5 lg:grid-cols-2">
      {/* 14 À 26 PERSONNES */}
      <article className="rounded-[24px] border border-white/10 bg-white/[0.04] p-7 min-[761px]:p-8">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-pink-400">
          14 à 26 personnes
        </span>

        <h3 className="mt-4 max-w-[460px] text-[25px] font-medium leading-[1.18] tracking-[-0.035em] text-white">
          Toute l’équipe dans un lieu unique, face au Mont-Blanc.
        </h3>

        <p className="mt-5 max-w-[540px] text-[13px] leading-7 text-slate-300">
          Nous pouvons réunir l’ensemble de votre équipe dans un même
          lieu face au Mont-Blanc, avec hébergement, espaces communs
          et temps partagés pensés pour prolonger naturellement les
          échanges.
        </p>

        <ul className="mt-7 space-y-3">
          <li className="flex items-start gap-3 text-[12.5px] leading-6 text-slate-300">
            <Check
              aria-hidden="true"
              className="mt-1 h-3.5 w-3.5 shrink-0 text-pink-400"
            />
            Toute l’équipe réunie sur place
          </li>

          <li className="flex items-start gap-3 text-[12.5px] leading-6 text-slate-300">
            <Check
              aria-hidden="true"
              className="mt-1 h-3.5 w-3.5 shrink-0 text-pink-400"
            />
            Espaces communs pour travailler et échanger
          </li>

          <li className="flex items-start gap-3 text-[12.5px] leading-6 text-slate-300">
            <Check
              aria-hidden="true"
              className="mt-1 h-3.5 w-3.5 shrink-0 text-pink-400"
            />
            Repas possibles sur place
          </li>

          <li className="flex items-start gap-3 text-[12.5px] leading-6 text-slate-300">
            <Check
              aria-hidden="true"
              className="mt-1 h-3.5 w-3.5 shrink-0 text-pink-400"
            />
            Moins de déplacements pendant le séjour
          </li>

          <li className="flex items-start gap-3 text-[12.5px] leading-6 text-slate-300">
            <Check
              aria-hidden="true"
              className="mt-1 h-3.5 w-3.5 shrink-0 text-pink-400"
            />
            Un environnement face au Mont-Blanc
          </li>
        </ul>
      </article>

      {/* GROUPES PLUS IMPORTANTS */}
      <article className="rounded-[24px] border border-white/10 bg-white/[0.04] p-7 min-[761px]:p-8">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-pink-400">
          Groupes plus importants
        </span>

        <h3 className="mt-4 max-w-[460px] text-[25px] font-medium leading-[1.18] tracking-[-0.035em] text-white">
          Plusieurs lieux, une seule organisation.
        </h3>

        <p className="mt-5 max-w-[540px] text-[13px] leading-7 text-slate-300">
          Pour les groupes plus nombreux, nous organisons une
          configuration multi-sites avec des hébergements proches,
          une salle adaptée et des transferts coordonnés pour
          conserver un déroulé fluide du début à la fin.
        </p>

        <ul className="mt-7 space-y-3">
          <li className="flex items-start gap-3 text-[12.5px] leading-6 text-slate-300">
            <Check
              aria-hidden="true"
              className="mt-1 h-3.5 w-3.5 shrink-0 text-pink-400"
            />
            Hébergements sélectionnés à proximité
          </li>

          <li className="flex items-start gap-3 text-[12.5px] leading-6 text-slate-300">
            <Check
              aria-hidden="true"
              className="mt-1 h-3.5 w-3.5 shrink-0 text-pink-400"
            />
            Salle adaptée à la taille du groupe
          </li>

          <li className="flex items-start gap-3 text-[12.5px] leading-6 text-slate-300">
            <Check
              aria-hidden="true"
              className="mt-1 h-3.5 w-3.5 shrink-0 text-pink-400"
            />
            Transferts aller-retour organisés
          </li>

          <li className="flex items-start gap-3 text-[12.5px] leading-6 text-slate-300">
            <Check
              aria-hidden="true"
              className="mt-1 h-3.5 w-3.5 shrink-0 text-pink-400"
            />
            Horaires et déplacements coordonnés
          </li>

          <li className="flex items-start gap-3 text-[12.5px] leading-6 text-slate-300">
            <Check
              aria-hidden="true"
              className="mt-1 h-3.5 w-3.5 shrink-0 text-pink-400"
            />
            Un seul interlocuteur MyStay
          </li>
        </ul>
      </article>
    </div>
  </div>
</section>

        {/* =====================================================
            SALLES DE RÉUNION
        ====================================================== */}
        <section className={`${marketingContainerClass} py-20 sm:py-28`}>
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-start lg:gap-20">
            <div>
              <MarketingEyebrow>
                Salles de réunion
              </MarketingEyebrow>

              <h2 className="m-0 max-w-[500px] text-[clamp(34px,4vw,40px)] font-bold leading-[1.05] tracking-[-0.05em]">
                Le bon espace
                <span className="block font-serif font-normal italic text-slate-400">
                  pour le bon moment.
                </span>
              </h2>

              <p className="mt-6 max-w-[500px] text-sm leading-[1.72] text-slate-500">
                Selon le nombre de participants, le type de travail prévu et la
                localisation de votre hébergement, nous sélectionnons une salle
                adaptée au rythme de votre séminaire.
              </p>
            </div>

            <ol className="m-0 list-none border-t border-slate-200 p-0">
              {meetingRoomPrinciples.map(principle => (
                <li
                  key={principle.number}
                  className="grid grid-cols-[44px_1fr] gap-4 border-b border-slate-200 py-6"
                >
                  <span className="pt-1 text-xs font-extrabold tracking-[0.12em] text-pink-600">
                    {principle.number}
                  </span>

                  <div>
                    <h3 className="m-0 text-[18px] font-bold tracking-[-0.025em] text-slate-900">
                      {principle.title}
                    </h3>

                    <p className="mb-0 mt-3 max-w-[620px] text-[13px] leading-[1.75] text-slate-500">
                      {principle.copy}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

       {/* =====================================================
    REPAS
====================================================== */}
<section className={`${marketingContainerClass} py-20 sm:py-28`}>
  <div className="max-w-[720px]">
    <MarketingEyebrow>
      Le repas fait partie du rythme
    </MarketingEyebrow>

    <h2 className="m-0 max-w-[680px] text-[clamp(34px,4vw,40px)] font-bold leading-[1.05] tracking-[-0.05em]">
      Des repas adaptés
      <span className="block font-serif font-normal italic text-slate-400">
        au rythme de votre équipe.
      </span>
    </h2>

    <p className="mt-6 max-w-[620px] text-sm leading-[1.72] text-slate-500">
      Du petit-déjeuner au dîner, nous organisons les repas en fonction
      du programme. Ils peuvent être servis sur place lorsque le lieu
      s’y prête, ou organisés dans une adresse sélectionnée à proximité.
    </p>
  </div>

  <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {meals.map(item => (
      <article
        key={item.title}
        className="
          relative
          flex min-h-[210px] flex-col
          rounded-[24px]
          bg-[#f7f6f4]
          px-6 py-6
          before:absolute
          before:left-6
          before:top-0
          before:h-[3px]
          before:w-[44px]
          before:rounded-b-full
          before:bg-pink-600
        "
      >
        <h3
          className="
            m-0
            max-w-[190px]
            text-[19px]
            font-bold
            leading-[1.15]
            tracking-[-0.035em]
            text-slate-900
          "
        >
          {item.title}
        </h3>

        <p
          className="
            mt-6
            max-w-[220px]
            text-[13px]
            leading-[1.7]
            text-slate-500
          "
        >
          {item.copy}
        </p>
      </article>
    ))}
  </div>
</section>
   {/* =====================================================
    ACTIVITÉS & BIEN-ÊTRE
====================================================== */}
<section className="bg-slate-50 py-20 sm:py-28">
  <div className={marketingContainerClass}>
    <div className="max-w-[720px]">
      <MarketingEyebrow>
        Activités & bien-être
      </MarketingEyebrow>

      <h2 className="m-0 max-w-[650px] text-[clamp(34px,4vw,40px)] font-bold leading-[1.05] tracking-[-0.05em]">
        Nous pouvons aussi
        <span className="block font-serif font-normal italic text-slate-400">
          organiser le reste.
        </span>
      </h2>

      <p className="mt-6 max-w-[650px] text-sm leading-[1.72] text-slate-500">
        Selon votre programme, MyStay peut coordonner des activités,
        des temps de bien-être ou des expériences locales pour compléter
        le séminaire.
      </p>

      <p className="mt-3 max-w-[650px] text-sm leading-[1.72] text-slate-500">
        Nous sélectionnons les prestataires, organisons les horaires
        et intégrons chaque intervention au déroulé du séjour.
      </p>
    </div>

    <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {activities.map(({ icon: Icon, title, copy }) => (
        <article
          key={title}
          className="
            relative
            flex min-h-[230px] flex-col
            rounded-[24px]
            bg-white
            px-6 py-6
            before:absolute
            before:left-6
            before:top-0
            before:h-[3px]
            before:w-[44px]
            before:rounded-b-full
            before:bg-pink-600
          "
        >
          {/* <span
            className="
              grid h-11 w-11
              place-items-center
              rounded-[14px]
              bg-[#f7f6f4]
              text-pink-600
            "
          >
            <Icon
              aria-hidden="true"
              className="h-5 w-5"
              strokeWidth={1.7}
            />
          </span> */}

          <h3 className="mt-5 text-[17px] font-bold leading-[1.2] tracking-[-0.03em] text-slate-900">
            {title}
          </h3>

          <p className="mt-4 max-w-[230px] text-[12.5px] leading-[1.7] text-slate-500">
            {copy}
          </p>
        </article>
      ))}
    </div>

    <div className="mt-10 max-w-[720px] border-t border-slate-200 pt-7">
      <p className="text-[14px] font-semibold leading-7 text-slate-800">
        Vous nous donnez l’objectif et le rythme souhaité.
        <span className="font-normal text-slate-500">
          {' '}
          Nous nous chargeons de trouver, réserver et coordonner les prestations.
        </span>
      </p>
    </div>
  </div>
</section>

        {/* =====================================================
            ORGANISATION
        ====================================================== */}
        <section
          data-testid="seminar-process"
          className="relative overflow-hidden bg-[radial-gradient(circle_at_92%_112%,rgba(219,39,119,0.12),transparent_29%)] bg-slate-800 py-12 text-white min-[761px]:py-[58px] min-[1051px]:py-[68px]"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[-110px] top-[-260px] aspect-square w-[360px] rounded-full border border-white/10"
          />

          <div
            className={`${marketingContainerClass} grid grid-cols-1 items-start gap-7 min-[1051px]:grid-cols-[0.92fr_1.08fr] min-[1051px]:gap-[clamp(48px,6vw,84px)]`}
          >
            <div className="min-[1051px]:sticky min-[1051px]:top-28">
              <MarketingEyebrow light>
                Une organisation simple
              </MarketingEyebrow>

              <h2 className="m-0 max-w-[470px] font-serif text-[clamp(34px,10.5vw,40px)] font-normal leading-[1.08] tracking-[-0.035em] min-[761px]:text-[clamp(34px,4vw,40px)]">
                Un seul interlocuteur.

                <em className="mt-2 block font-normal not-italic text-pink-300">
                  La logistique s’efface.
                </em>
              </h2>

              <p className="mt-5 max-w-[470px] text-[13px] leading-[1.72] text-slate-300 min-[761px]:mt-6 min-[761px]:text-sm">
                MyStay coordonne les lieux, les partenaires, les repas,
                les déplacements et le déroulé pour que votre équipe puisse
                rester concentrée sur les raisons qui l’ont réunie.
              </p>
            </div>

            <ol className="m-0 list-none border-t border-white/15 p-0">
              {steps.map(step => (
                <li
                  key={step.number}
                  className="grid grid-cols-[40px_1fr] gap-3 border-b border-white/15 py-5 min-[761px]:grid-cols-[54px_1fr] min-[761px]:gap-[18px] min-[761px]:py-[22px]"
                >
                  <span className="pt-1 text-xs font-extrabold tracking-[0.12em] text-pink-400">
                    {step.number}
                  </span>

                  <div>
                    <h3 className="m-0 text-[17px] font-medium tracking-[-0.025em] text-white min-[761px]:text-[19px]">
                      {step.title}
                    </h3>

                    <p className="mb-0 mt-2.5 max-w-[590px] text-[13px] leading-[1.7] text-slate-400">
                      {step.copy}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* =====================================================
            FAQ
        ====================================================== */}
        <section className={`${marketingContainerClass} py-20 sm:py-28`}>
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <div>
              <MarketingEyebrow>
                Questions fréquentes
              </MarketingEyebrow>

              <h2 className="m-0 max-w-[430px] text-[clamp(34px,4vw,40px)] font-bold leading-[1.05] tracking-[-0.05em]">
                Préparer votre séminaire simplement.
              </h2>
            </div>

            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {faqs.map(faq => (
                <details key={faq.question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[14px] font-bold leading-6 text-slate-900">
                    {faq.question}

                    <span
                      aria-hidden="true"
                      className="shrink-0 text-xl font-normal text-slate-400 transition-transform duration-300 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>

                  <p className="max-w-[650px] pb-2 pt-4 text-[13px] leading-7 text-slate-500">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================
            CTA FINAL
        ====================================================== */}
        <section
          className={`${marketingContainerClass} mb-6 grid grid-cols-1 items-center gap-[30px] rounded-[26px] bg-[radial-gradient(circle_at_0_0,rgba(219,39,119,0.12),transparent_34%)] bg-slate-800 px-7 py-[38px] text-white min-[761px]:grid-cols-[1.1fr_0.9fr] min-[761px]:gap-[54px] min-[761px]:rounded-[28px] min-[761px]:px-[54px] min-[761px]:py-[52px]`}
          id="projet"
        >
          <div>
            <MarketingEyebrow light>
              Votre prochain séminaire
            </MarketingEyebrow>

            <h2 className="m-0 text-[clamp(34px,4vw,40px)] font-bold leading-[1.02] tracking-[-0.05em]">
              Parlez-nous de votre équipe.
              <br />
              Nous construisons le cadre.
            </h2>
          </div>

          <div>
            <p className="mb-[22px] mt-0 text-[13px] leading-[1.7] text-slate-300">
              Nombre de participants, dates, durée, objectifs et budget :
              quelques informations suffisent pour commencer à construire
              votre séminaire.
            </p>

            <a
              className={`${marketingPrimaryButtonClass} gap-4`}
              href={contactHref}
            >
              Demander une proposition

              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4"
              />
            </a>
          </div>
        </section>
      </div>
    </MarketingShell>
  )
}