import { Check } from 'lucide-react'
import { SeminarLeadDialog } from '@/features/contact-messages/components/SeminarLeadDialog'
import { MarketingEyebrow, marketingContainerClass } from './MarketingShell'

// Spec 031 AC-01-09 (amendement du 2026-10-13) : formats détaillés.
const formats = [
  {
    title: 'Comité de direction',
    facts: '6 à 12 personnes · 1 à 2 nuits',
    copy: 'Un cadre confidentiel pour décider, arbitrer et aligner les priorités.',
    inclusions: [
      'Chalet privatisé, sans autre groupe sur place',
      'Espace de réunion aménagé en plénière',
      'Repas servis au chalet pour ne pas couper les échanges',
    ],
    day: [
      { moment: 'Matin', copy: 'Plénière stratégique dans l’espace de réunion' },
      { moment: 'Après-midi', copy: 'Ateliers d’arbitrage, puis marche au grand air' },
      { moment: 'Soirée', copy: 'Dîner au chalet préparé par un chef' },
    ],
  },
  {
    title: 'Séminaire résidentiel',
    facts: '12 à 26 personnes · 2 à 3 nuits',
    copy: 'Deux à trois jours de travail et de vie commune dans un même lieu.',
    inclusions: [
      'Hébergement de toute l’équipe sous le même toit',
      'Alternance de plénières et d’ateliers en sous-groupes',
      'Repas, transferts et une activité d’équipe en montagne',
    ],
    day: [
      { moment: 'Matin', copy: 'Plénière d’ouverture et ateliers en sous-groupes' },
      { moment: 'Après-midi', copy: 'Activité d’équipe en montagne' },
      { moment: 'Soirée', copy: 'Dîner partagé et temps libre au chalet' },
    ],
  },
  {
    title: 'Retraite d’équipe',
    facts: '8 à 20 personnes · 2 à 4 nuits',
    copy: 'Renforcer les liens et réfléchir ensemble, loin du bureau.',
    inclusions: [
      'Temps de travail allégés, en matinée ou en demi-journée',
      'Activités au grand air : ski ou raquettes l’hiver, randonnée l’été',
      'Thermes et repas partagés pour les temps informels',
    ],
    day: [
      { moment: 'Matin', copy: 'Session de réflexion collective' },
      { moment: 'Après-midi', copy: 'Ski ou raquettes l’hiver, randonnée l’été' },
      { moment: 'Soirée', copy: 'Thermes, puis repas partagé' },
    ],
  },
] as const

/**
 * Section « À chaque équipe son format. », partagée par `/seminaires` et les
 * landings séminaire de ville (spec 031 AC-01-09, spec 046 AC-02-04).
 */
export function SeminarFormats({
  cityName,
  className = 'pb-[54px] pt-[82px] sm:pb-[72px] sm:pt-24',
}: {
  /** Commune de la landing ; absente sur la page générale. */
  cityName?: string
  /** Espacement vertical de la section. */
  className?: string
}) {
  return (
    <section className={`${marketingContainerClass} ${className}`}>
      <div className="mb-12 max-w-[760px]">
        <MarketingEyebrow>
          Formats de séminaire
        </MarketingEyebrow>

        <h2
          className="
            m-0
            max-w-[720px]
            text-[clamp(34px,4vw,40px)]
            font-bold
            leading-[1.02]
            tracking-[-0.05em]
          "
        >
          À chaque équipe son format.
        </h2>
      </div>

      <div
        className="
          grid
          gap-3

          min-[761px]:grid-cols-3
          min-[761px]:gap-4
        "
      >
        {formats.map(format => (
          <article
            key={format.title}
            className="
              relative
              flex
              min-w-0
              flex-col
              rounded-[22px]
              bg-[radial-gradient(circle_at_100%_0,rgba(219,39,119,0.055),transparent_34%)]
              bg-[#f7f6f4]
              px-5
              py-7

              before:absolute
              before:left-5
              before:top-0
              before:h-[3px]
              before:w-10
              before:rounded-b-full
              before:bg-pink-600

              min-[761px]:rounded-[24px]
              min-[761px]:px-7
              min-[761px]:py-[30px]
              min-[761px]:before:left-7
              min-[761px]:before:w-[50px]
            "
          >
            <h3
              className="
                m-0
                text-[20px]
                font-bold
                leading-[1.15]
                tracking-[-0.035em]

                min-[761px]:text-[22px]
              "
            >
              {format.title}
            </h3>

            <p className="mb-0 mt-2 text-[11px] font-bold uppercase tracking-[0.08em] text-pink-600">
              {format.facts}
            </p>

            <p className="mb-0 mt-4 text-[13px] leading-[1.65] text-slate-500">
              {format.copy}
            </p>

            <ul className="m-0 mt-5 flex list-none flex-col gap-2.5 p-0">
              {format.inclusions.map(inclusion => (
                <li key={inclusion} className="grid grid-cols-[16px_1fr] gap-2.5 text-[13px] leading-[1.5] text-slate-800">
                  <Check aria-hidden="true" className="mt-[3px] h-4 w-4 text-pink-600" />
                  {inclusion}
                </li>
              ))}
            </ul>

            <h4 className="mb-0 mt-6 border-t border-slate-200 pt-5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Journée type
            </h4>
            <ol className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
              {format.day.map(({ moment, copy }) => (
                <li key={moment} className="text-[13px] leading-[1.5] text-slate-500">
                  <span className="font-bold text-slate-800">{moment}</span> — {copy}
                </li>
              ))}
            </ol>

            <div className="mt-auto pt-6">
              <SeminarLeadDialog
                label="Demander un devis"
                cityName={cityName}
                triggerClassName="inline-flex min-h-11 items-center text-[13px] font-bold text-pink-600 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
