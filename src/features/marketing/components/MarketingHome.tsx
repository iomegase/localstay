import Link from 'next/link'

import type { MarketingLodgingCard } from '@/features/lodging-showcase/queries/public-lodgings'
import { GuideDemoLauncher } from '@/features/guide-demo/components/GuideDemoLauncher'

import { MarketingPropertyCard } from './MarketingPropertyCard'

import {
  MarketingEyebrow,
  MarketingShell,
  marketingContainerClass,
  marketingDarkButtonClass,
  marketingPrimaryButtonClass,
} from './MarketingShell'

const localHighlights = [
  {
    number: '01',
    label: 'Présence locale',
    copy: 'Une équipe présente autour de Saint-Gervais et du Pays du Mont-Blanc.',
  },
  {
    number: '02',
    label: 'Suivi du logement',
    copy: 'Contrôles, préparation et coordination des interventions entre les séjours.',
  },
  {
    number: '03',
    label: 'Accueil voyageurs',
    copy: 'Des informations claires avant l’arrivée et un interlocuteur pendant le séjour.',
  },
  {
    number: '04',
    label: 'Conseils locaux',
    copy: 'Des recommandations adaptées au logement, à la saison et au profil des voyageurs.',
  },
] as const

const conciergeServices = [
  {
    number: '01',
    title: 'Gestion locative',
    copy:
      'Coordination des séjours, échanges avec les voyageurs, calendrier et suivi des réservations.',
  },
  {
    number: '02',
    title: 'Accueil voyageurs',
    copy:
      'Préparation de l’arrivée, informations pratiques et assistance pendant toute la durée du séjour.',
  },
  {
    number: '03',
    title: 'Ménage & linge',
    copy:
      'Préparation du logement, ménage entre les séjours et organisation du linge.',
  },
  {
    number: '04',
    title: 'Intendance',
    copy:
      'Contrôle du logement, petites interventions et coordination des prestataires locaux.',
  },
  {
    number: '05',
    title: 'Guide digital MyStay',
    copy:
      'Informations du logement et recommandations locales accessibles depuis un lien ou un QR code.',
  },
] as const

const guideBenefits = [
  {
    number: '01',
    label: 'Avant l’arrivée',
    title: 'Une arrivée déjà préparée',
    copy:
      'Accès, stationnement, horaires et informations pratiques sont disponibles avant même le départ du voyageur.',
  },
  {
    number: '02',
    label: 'Pendant le séjour',
    title: 'Les bonnes informations au bon moment',
    copy:
      'Équipements, consignes et recommandations locales restent accessibles à tout moment, sans application à installer.',
  },
  {
    number: '03',
    label: 'Pour le propriétaire',
    title: 'Moins de questions répétitives',
    copy:
      'Les informations essentielles sont centralisées. Nous restons disponibles pour les demandes qui nécessitent réellement une présence humaine.',
  },
] as const

const destinations = [
  {
    name: 'Saint-Gervais-les-Bains',
    description: 'Montagne, thermalisme, ski et vallée du Mont-Blanc.',
    href: '/decouvrir/saint-gervais-les-bains',
  },
  {
    name: 'Les Contamines-Montjoie',
    description: 'Randonnées, réserve naturelle et grands espaces.',
    href: null,
  },
  {
    name: 'Saint-Nicolas-de-Véroce',
    description: 'Alpages, Mont-Joly et versant sauvage du massif.',
    href: null,
  },
  {
    name: 'Megève',
    description: 'Village alpin, gastronomie et domaine skiable.',
    href: null,
  },
  {
    name: 'Chamonix',
    description: 'Haute montagne et accès au massif du Mont-Blanc.',
    href: null,
  },
] as const

const discoveryItems = [
  {
    eyebrow: 'Randonnée',
    title: 'Les plus belles randonnées autour de Saint-Gervais',
    copy:
      'Miage, Porcherey, Mont-Joly, Lacs Jovet… notre sélection selon votre niveau et le temps dont vous disposez.',
    href: '/blog/randonnees-saint-gervais',
  },
  {
    eyebrow: 'Sélection locale',
    title: 'Découvrir Saint-Gervais autrement',
    copy:
      'Restaurants, commerces, activités et lieux que nous recommandons autour de votre séjour.',
    href: '/decouvrir/saint-gervais-les-bains',
  },
  {
    eyebrow: 'Idées séjour',
    title: 'Que faire quand la météo change ?',
    copy:
      'Quelques alternatives aux activités de montagne lorsque la pluie s’invite dans la vallée.',
    href: '/blog',
  },
] as const

const faqs = [
  {
    question: 'Dans quelles communes MyStay intervient-il ?',
    answer:
      'MyStay accompagne principalement des logements à Saint-Gervais-les-Bains et dans le Pays du Mont-Blanc. La zone d’intervention dépend du logement, de sa localisation et du niveau de gestion recherché.',
  },
  {
    question: 'Que comprend la gestion d’un logement ?',
    answer:
      'Selon les besoins du propriétaire, MyStay peut prendre en charge la préparation du logement, les échanges voyageurs, l’accueil, le ménage, le linge, le suivi du bien et la coordination des interventions.',
  },
  {
    question: 'MyStay s’occupe-t-il du ménage et du linge ?',
    answer:
      'Oui. La préparation du logement entre deux séjours peut inclure le ménage, le contrôle du bien et l’organisation du linge.',
  },
  {
    question: 'Comment fonctionne le guide digital MyStay ?',
    answer:
      'Chaque guide est associé à un logement. Le voyageur y accède depuis un lien personnel ou un QR code transmis pour son séjour. Il y retrouve les informations du logement, les équipements, les consignes utiles et une sélection de recommandations locales.',
  },
  {
    question: 'Puis-je confier seulement certaines prestations ?',
    answer:
      'L’accompagnement peut être adapté au logement et au niveau de délégation souhaité. Le fonctionnement est défini avec le propriétaire avant la mise en place de la gestion.',
  },
] as const

export function MarketingHome({
  lodgings,
}: {
  lodgings: MarketingLodgingCard[]
}) {
  return (
    <MarketingShell>
      {/* =========================================================
          HERO
      ========================================================== */}
      <section
        data-testid="editorial-hero-shell"
        className={`${marketingContainerClass} relative mt-0 sm:mt-8 xl:mt-0 xl:max-w-[944px]`}
      >
        <div
          data-testid="editorial-hero"
          className="relative min-h-[580px] bg-white"
        >
          <div
            data-testid="editorial-hero-content"
            className="
              relative
              flex min-h-[580px] flex-col
              px-7 pb-14 pt-16
              text-slate-800
              sm:px-10
              min-[761px]:px-[46px]
              min-[761px]:pt-[76px]
              min-[1051px]:px-16
              xl:px-[52px]
              xl:pb-[48px]
              xl:pt-[64px]
            "
          >
            <div className="max-w-[760px] xl:max-w-[690px]">
              <MarketingEyebrow>
                Conciergerie locale en Haute-Savoie
              </MarketingEyebrow>

              <h1
                className="
                  max-w-[760px]
                  text-[42px]
                  font-bold
                  leading-[1.05]
                  tracking-[-0.055em]
                  sm:text-5xl
                  lg:text-[52px]
                  xl:text-[54px]
                "
              >
                Votre logement,
                <br />
                géré localement.
                <span
                  className="
                    mt-3 block
                    font-serif
                    font-normal
                    italic
                    tracking-[-0.025em]
                  "
                >
                  Vos voyageurs,
                  <br />
                  mieux accompagnés.
                </span>
              </h1>

              <p
                className="
                  mt-7
                  max-w-[620px]
                  text-[15px]
                  leading-[1.75]
                  text-slate-600
                  xl:max-w-[570px]
                  xl:text-[14px]
                "
              >
                MyStay accompagne les locations saisonnières à
                Saint-Gervais-les-Bains et autour du Pays du Mont-Blanc :
                accueil voyageurs, ménage, linge, intendance et guide digital
                personnalisé.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/confier-mon-logement"
                  className={marketingPrimaryButtonClass}
                >
                  Confier mon logement
                </Link>

                <Link
                  href="/concept"
                  className={marketingDarkButtonClass}
                >
                  Découvrir MyStay
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          PRESENCE LOCALE
      ========================================================== */}
      <section
        className={`
          ${marketingContainerClass}
          pb-16 pt-20
          sm:pb-24 sm:pt-28
          xl:pb-[88px] xl:pt-[80px]
        `}
      >
        <div className="max-w-[690px]">
          <MarketingEyebrow>
            Une présence locale en Haute-Savoie
          </MarketingEyebrow>

          <h2
            className="
              max-w-[680px]
              text-3xl
              font-bold
              leading-[1.15]
              tracking-[-0.05em]
              sm:text-[44px]
              xl:text-[40px]
              xl:leading-[1.1]
            "
          >
            Nous connaissons les logements que nous accompagnons.
          </h2>

          <p
            className="
              mt-7
              max-w-[620px]
              text-sm
              leading-7
              text-slate-500
              xl:text-[13px]
              xl:leading-[1.75]
            "
          >
            Appartements, chalets ou résidences secondaires : chaque bien
            demande une organisation adaptée aux contraintes de la montagne,
            à sa localisation et aux attentes des voyageurs.
          </p>
        </div>

        <div
          className="
            mt-12
            grid grid-cols-1 gap-4
            sm:grid-cols-2
            xl:mt-[58px]
            xl:grid-cols-4
          "
        >
          {localHighlights.map((item) => (
            <article
              key={item.number}
              className="
                group
                relative
                min-h-[168px]
                overflow-hidden
                rounded-[22px]
                bg-[#f8f7f5]
                px-5
                py-[20px]
                transition-all
                duration-300
                hover:-translate-y-[3px]
                hover:bg-white
                hover:shadow-[0_14px_32px_rgba(15,23,42,0.07)]
              "
            >
              <span
                aria-hidden="true"
                className="
                  absolute left-5 top-0
                  h-[3px] w-10
                  rounded-b-full
                  bg-[#bd9254]
                "
              />

              <span
                aria-hidden="true"
                className="
                  pointer-events-none
                  absolute
                  -bottom-[26px]
                  -right-[3px]
                  select-none
                  text-[100px]
                  font-bold
                  leading-none
                  tracking-[-0.09em]
                  text-slate-900/[0.03]
                "
              >
                {item.number}
              </span>

              <div className="relative z-10">
                <h3 className="text-[15px] font-bold text-slate-900">
                  {item.label}
                </h3>

                <p className="mt-5 max-w-[210px] text-[12.5px] leading-[1.6] text-slate-500">
                  {item.copy}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* =========================================================
          SERVICES
      ========================================================== */}
      <section
        id="services"
        className={`
          ${marketingContainerClass}
          pb-20 pt-10
          sm:pb-28 sm:pt-16
          xl:pb-[88px] xl:pt-[72px]
        `}
      >
        <div className="max-w-[690px]">
          <MarketingEyebrow>Nos services</MarketingEyebrow>

          <h2
            className="
              text-3xl
              font-bold
              leading-[1.15]
              tracking-[-0.05em]
              sm:text-[44px]
              xl:text-[40px]
              xl:leading-[1.1]
            "
          >
            Une gestion concrète,
            <br className="hidden sm:block" />
            avant, pendant et après chaque séjour.
          </h2>

          <p
            className="
              mt-7
              max-w-[590px]
              text-sm
              leading-7
              text-slate-500
              xl:text-[13px]
              xl:leading-[1.75]
            "
          >
            Nous adaptons notre accompagnement au logement et au niveau de
            délégation recherché par son propriétaire.
          </p>
        </div>

        <div
          className="
            mt-12
            grid grid-cols-1 gap-4
            sm:grid-cols-2
            lg:grid-cols-3
            xl:grid-cols-5
          "
        >
          {conciergeServices.map((service) => (
            <article
              key={service.number}
              className="
                group
                relative
                min-h-[178px]
                overflow-hidden
                rounded-[22px]
                bg-[#f8f7f5]
                px-5
                py-[20px]
                transition-all
                duration-300
                hover:-translate-y-[3px]
                hover:bg-white
                hover:shadow-[0_14px_32px_rgba(15,23,42,0.07)]
              "
            >
              <span
                aria-hidden="true"
                className="
                  absolute left-5 top-0
                  h-[3px] w-10
                  rounded-b-full
                  bg-[#bd9254]
                "
              />

              <span
                aria-hidden="true"
                className="
                  pointer-events-none
                  absolute
                  -bottom-[26px]
                  -right-[3px]
                  select-none
                  text-[100px]
                  font-bold
                  leading-none
                  tracking-[-0.09em]
                  text-slate-900/[0.03]
                "
              >
                {service.number}
              </span>

              <div className="relative z-10">
                <h3
                  className="
                    text-[15px]
                    font-bold
                    leading-[1.15]
                    tracking-[-0.025em]
                    text-slate-900
                  "
                >
                  {service.title}
                </h3>

                <p className="mt-5 text-[12.5px] leading-[1.6] text-slate-500">
                  {service.copy}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* =========================================================
          GUIDE DIGITAL
      ========================================================== */}
      <section
        data-testid="editorial-process"
        className={`
          ${marketingContainerClass}
          pb-20 pt-10
          sm:pb-28
          xl:pb-[96px] xl:pt-[72px]
        `}
      >
        <div className="max-w-[700px]">
          <MarketingEyebrow>Ce qui distingue MyStay</MarketingEyebrow>

          <h2
            className="
              max-w-[680px]
              text-3xl
              font-bold
              leading-[1.15]
              tracking-[-0.05em]
              sm:text-[44px]
              xl:text-[40px]
              xl:leading-[1.1]
            "
          >
            Une conciergerie prolongée par le digital.
          </h2>

          <p
            className="
              mt-7
              max-w-[620px]
              text-sm
              leading-7
              text-slate-500
              xl:text-[13px]
              xl:leading-[1.75]
            "
          >
            Le voyageur retrouve dans son guide MyStay les informations de son
            logement, les consignes d’arrivée, les équipements et une sélection
            de recommandations locales. Toutes ces informations restent
            accessibles depuis un simple lien ou un QR code.
          </p>

          <div className="mt-7">
            <GuideDemoLauncher />
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {guideBenefits.map((item) => (
            <article
              key={item.number}
              className="
                group
                relative
                min-h-[190px]
                overflow-hidden
                rounded-[22px]
                bg-[#f8f7f5]
                px-5
                py-[20px]
                transition-all
                duration-300
                hover:-translate-y-[3px]
                hover:bg-white
                hover:shadow-[0_14px_32px_rgba(15,23,42,0.07)]
              "
            >
              <span
                aria-hidden="true"
                className="
                  absolute left-5 top-0
                  h-[3px] w-10
                  rounded-b-full
                  bg-[#bd9254]
                "
              />

              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {item.label}
              </span>

              <h3 className="mt-4 text-[17px] font-bold leading-[1.2] tracking-[-0.035em] text-slate-900">
                {item.title}
              </h3>

              <p className="mt-4 max-w-[250px] text-[12.5px] leading-[1.6] text-slate-500">
                {item.copy}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* =========================================================
          LOGEMENTS
      ========================================================== */}
      <section
        className={`
          ${marketingContainerClass}
          grid gap-10
          pb-20 pt-10
          sm:pb-28
          lg:grid-cols-[0.8fr_1.7fr]
          lg:items-start
          xl:grid-cols-[0.7fr_1.8fr]
          xl:gap-[50px]
          xl:py-[88px]
        `}
      >
        <div className="xl:sticky xl:top-7">
          <MarketingEyebrow>
            Les logements confiés à MyStay
          </MarketingEyebrow>

          <h2
            className="
              text-3xl
              font-bold
              leading-[1.15]
              tracking-[-0.05em]
              sm:text-[44px]
              xl:text-[40px]
              xl:leading-[1.1]
            "
          >
            Des logements que nous connaissons réellement.
          </h2>

          <p
            className="
              mt-7
              text-sm
              leading-7
              text-slate-500
              xl:max-w-[560px]
              xl:text-[13px]
              xl:leading-[1.75]
            "
          >
            Chaque logement accompagné par MyStay bénéficie d’un suivi dédié,
            de ses propres informations d’arrivée et de recommandations
            adaptées à son environnement.
          </p>

          <Link
            href="/logements"
            className={`${marketingDarkButtonClass} mt-7`}
          >
            Voir les logements
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {lodgings.length > 0 ? (
          <div
            className="
              no-scrollbar
              -mx-6 -my-8
              flex min-w-0
              snap-x snap-mandatory
              gap-5
              overflow-x-auto
              px-6 py-8
              lg:mx-0
              lg:my-0
              lg:grid
              lg:snap-none
              lg:grid-cols-2
              lg:overflow-visible
              lg:px-0
              lg:py-0
              lg:pt-8
              xl:gap-x-[18px]
              xl:gap-y-[22px]
              xl:pt-[64px]
            "
          >
            {lodgings.map((lodging, index) => (
              <div
                key={lodging.id}
                className="w-[280px] shrink-0 snap-start lg:w-auto"
              >
                <MarketingPropertyCard
                  lodging={lodging}
                  priority={index < 2}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[26px] border border-dashed border-slate-300 bg-slate-50 p-8 text-sm leading-7 text-slate-500">
            Aucun logement public n’est encore disponible. Revenez bientôt
            pour découvrir les nouvelles adresses MyStay.
          </div>
        )}
      </section>

      {/* =========================================================
          DESTINATIONS
      ========================================================== */}
      <section
        className={`
          ${marketingContainerClass}
          pb-20 pt-10
          sm:pb-28
          xl:py-[92px]
        `}
      >
        <div className="max-w-[700px]">
          <MarketingEyebrow>Notre territoire</MarketingEyebrow>

          <h2
            className="
              max-w-[650px]
              text-3xl
              font-bold
              leading-[1.15]
              tracking-[-0.05em]
              sm:text-[44px]
              xl:text-[40px]
              xl:leading-[1.1]
            "
          >
            Le Pays du Mont-Blanc,
            <br className="hidden sm:block" />
            notre terrain de jeu.
          </h2>

          <p
            className="
              mt-7
              max-w-[610px]
              text-sm
              leading-7
              text-slate-500
              xl:text-[13px]
              xl:leading-[1.75]
            "
          >
            Notre connaissance du territoire nous permet d’accompagner les
            voyageurs au-delà du logement et de leur proposer des informations
            adaptées à leur lieu de séjour.
          </p>
        </div>

        <div className="mt-12 grid gap-3">
          {destinations.map((destination, index) => {
            const content = (
              <>
                <span className="text-[11px] font-semibold text-slate-400">
                  {String(index + 1).padStart(2, '0')}
                </span>

                <div>
                  <h3 className="text-[17px] font-bold tracking-[-0.025em] text-slate-900">
                    {destination.name}
                  </h3>

                  <p className="mt-1 text-[12.5px] leading-6 text-slate-500">
                    {destination.description}
                  </p>
                </div>

                {destination.href ? (
                  <span
                    aria-hidden="true"
                    className="ml-auto text-slate-400"
                  >
                    →
                  </span>
                ) : null}
              </>
            )

            if (destination.href) {
              return (
                <Link
                  key={destination.name}
                  href={destination.href}
                  className="
                    group
                    grid grid-cols-[32px_1fr_auto]
                    items-center gap-4
                    rounded-[18px]
                    bg-[#f8f7f5]
                    px-5 py-4
                    transition-all
                    duration-300
                    hover:bg-white
                    hover:shadow-[0_10px_30px_rgba(15,23,42,0.06)]
                  "
                >
                  {content}
                </Link>
              )
            }

            return (
              <div
                key={destination.name}
                className="
                  grid grid-cols-[32px_1fr]
                  items-center gap-4
                  rounded-[18px]
                  bg-[#f8f7f5]
                  px-5 py-4
                "
              >
                {content}
              </div>
            )
          })}
        </div>
      </section>

      {/* =========================================================
          PROPRIETAIRES / VOYAGEURS
      ========================================================== */}
      <section
        className={`
          ${marketingContainerClass}
          grid gap-4
          pb-20 pt-10
          sm:pb-28
          lg:grid-cols-2
          xl:py-[88px]
        `}
      >
        <article className="rounded-[26px] bg-slate-900 px-7 py-9 text-white sm:px-9 sm:py-10">
          <MarketingEyebrow light>
            Pour les propriétaires
          </MarketingEyebrow>

          <h2 className="max-w-[420px] text-3xl font-bold leading-[1.12] tracking-[-0.05em]">
            Vous souhaitez confier votre logement ?
          </h2>

          <p className="mt-6 max-w-[420px] text-sm leading-7 text-slate-300">
            Résidence secondaire, chalet ou appartement en location
            saisonnière : nous définissons avec vous le niveau
            d’accompagnement adapté à votre bien.
          </p>

          <Link
            href="/confier-mon-logement"
            className={`${marketingPrimaryButtonClass} mt-7`}
          >
            Confier mon logement
          </Link>
        </article>

        <article className="rounded-[26px] bg-[#f8f7f5] px-7 py-9 sm:px-9 sm:py-10">
          <MarketingEyebrow>
            Pour les voyageurs
          </MarketingEyebrow>

          <h2 className="max-w-[420px] text-3xl font-bold leading-[1.12] tracking-[-0.05em] text-slate-900">
            Vous séjournez dans un logement MyStay ?
          </h2>

          <p className="mt-6 max-w-[430px] text-sm leading-7 text-slate-500">
            Votre hôte vous transmet un lien personnel ou un QR code donnant
            accès au guide de votre logement. Vous y retrouvez les informations
            d’arrivée, les équipements, les consignes utiles et nos
            recommandations locales.
          </p>

          <p className="mt-6 text-[12px] leading-6 text-slate-400">
            Vous avez perdu votre lien ? Contactez votre hôte ou la personne en
            charge de votre séjour.
          </p>
        </article>
      </section>

      {/* =========================================================
          DECOUVRIR / CONTENU EDITORIAL
      ========================================================== */}
      <section
        className={`
          ${marketingContainerClass}
          pb-20 pt-10
          sm:pb-28
          xl:py-[92px]
        `}
      >
        <div className="max-w-[700px]">
          <MarketingEyebrow>Autour de Saint-Gervais</MarketingEyebrow>

          <h2
            className="
              max-w-[640px]
              text-3xl
              font-bold
              leading-[1.15]
              tracking-[-0.05em]
              sm:text-[44px]
              xl:text-[40px]
            "
          >
            Quelques idées pour profiter du séjour.
          </h2>

          <p className="mt-7 max-w-[580px] text-sm leading-7 text-slate-500">
            Randonnées, bonnes adresses et activités : nous partageons
            progressivement une partie des recommandations que nous utilisons
            dans les guides MyStay.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {discoveryItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="
                group
                flex min-h-[220px]
                flex-col
                rounded-[22px]
                bg-[#f8f7f5]
                p-6
                transition-all
                duration-300
                hover:-translate-y-[3px]
                hover:bg-white
                hover:shadow-[0_14px_32px_rgba(15,23,42,0.07)]
              "
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#bd9254]">
                {item.eyebrow}
              </span>

              <h3 className="mt-5 text-[19px] font-bold leading-[1.2] tracking-[-0.04em] text-slate-900">
                {item.title}
              </h3>

              <p className="mt-4 text-[12.5px] leading-[1.65] text-slate-500">
                {item.copy}
              </p>

              <span className="mt-auto pt-8 text-[12px] font-semibold text-slate-700">
                Découvrir
                <span
                  aria-hidden="true"
                  className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1"
                >
                  →
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* =========================================================
          FAQ
      ========================================================== */}
      <section
        className={`
          ${marketingContainerClass}
          pb-20 pt-10
          sm:pb-28
          xl:py-[92px]
        `}
      >
        <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
          <div>
            <MarketingEyebrow>Questions fréquentes</MarketingEyebrow>

            <h2
              className="
                max-w-[430px]
                text-3xl
                font-bold
                leading-[1.15]
                tracking-[-0.05em]
                sm:text-[44px]
                xl:text-[40px]
              "
            >
              Comprendre simplement notre fonctionnement.
            </h2>
          </div>

          <div className="divide-y divide-slate-200">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group py-5"
              >
                <summary
                  className="
                    flex
                    cursor-pointer
                    list-none
                    items-center
                    justify-between
                    gap-5
                    text-[15px]
                    font-bold
                    leading-6
                    tracking-[-0.02em]
                    text-slate-900
                  "
                >
                  {faq.question}

                  <span
                    aria-hidden="true"
                    className="
                      text-xl
                      font-normal
                      text-slate-400
                      transition-transform
                      duration-300
                      group-open:rotate-45
                    "
                  >
                    +
                  </span>
                </summary>

                <p className="max-w-[620px] pb-2 pt-4 text-[13px] leading-7 text-slate-500">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          CTA FINAL
      ========================================================== */}
      <section
        className={`${marketingContainerClass} pb-20 sm:pb-28 xl:pb-5`}
      >
        <div
          data-testid="editorial-cta"
          className="
            grid gap-9
            rounded-[28px]
            bg-gradient-to-r
            from-[#30253f]
            to-slate-800
            px-6 py-12
            text-white
            sm:px-12
            lg:grid-cols-[1.1fr_0.9fr]
            lg:items-center
            xl:gap-16
            xl:rounded-[24px]
            xl:px-[52px]
            xl:py-[53px]
          "
        >
          <div>
            <MarketingEyebrow light>Votre projet</MarketingEyebrow>

            <h2 className="text-4xl font-bold leading-[1.12] tracking-[-0.05em] xl:text-[40px] xl:leading-[1.03]">
              Parlons de votre logement.
              <br />
              Nous nous occupons du reste.
            </h2>
          </div>

          <div>
            <p className="max-w-md text-sm leading-7 text-slate-300 xl:max-w-[360px] xl:text-[13px] xl:leading-[1.7]">
              Présentez-nous votre bien, sa localisation et vos attentes. Nous
              définirons ensemble le niveau d’accompagnement adapté.
            </p>

            <Link
              href="/confier-mon-logement"
              className={`${marketingPrimaryButtonClass} mt-6`}
            >
              Échanger sur mon projet
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}