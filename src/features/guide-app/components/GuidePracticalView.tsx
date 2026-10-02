import { MapPin, Phone, Recycle, Siren } from 'lucide-react'
import { FRENCH_EMERGENCY_NUMBERS } from '@/features/guide-app/lib/emergency-numbers'
import { formatFrenchPhone, frenchPhoneHref } from '@/shared/lib/french-phone'
import { GuideDarkMarkdown } from '@/features/guide-app/components/GuideDarkMarkdown'
import { GuideWifiCard } from '@/features/guide-app/components/GuideWifiCard'
import {
  GUIDE_CARD,
  GuideCardHeading,
  GuideInfoCard,
  GuideSectionTitle,
} from '@/features/guide-app/components/GuideCard'
import { GuideStayScreen } from '@/features/guide-app/components/stay/GuideStayScreen'
import type { GuideLodging } from '@/features/guide-app/types'

/** Lien du point de tri : URL directe si déjà un lien, sinon recherche Google Maps. */
function trashLocationHref(location: string): string {
  return /^https?:\/\//i.test(location)
    ? location
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
}

/** Point de tri : lien configuré par l'Owner, sinon recherche « point de tri <ville> ». */
function trashPointHref(lodging: GuideLodging): string {
  return lodging.trashLocation
    ? trashLocationHref(lodging.trashLocation)
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `point de tri ${lodging.city.replace(/-/g, ' ')}`,
      )}`
}

function trashPointHint(lodging: GuideLodging): string {
  if (lodging.trashLocation && !/^https?:\/\//i.test(lodging.trashLocation)) {
    return lodging.trashLocation
  }
  return lodging.trashLocation ? 'Voir sur Google Maps' : 'Rechercher à proximité sur Google Maps'
}

/** Infos pratiques (Wi-Fi, urgences, numéros utiles, tri), ouvertes depuis le Guide logement (spec 054). */
export function GuidePracticalView({
  lodging,
  onBack,
}: {
  lodging: GuideLodging
  onBack: () => void
}) {
  const recyclingCards = lodging.practicalCards.filter(
    card => card.icon === 'recycle',
  )
  const showTrashPoint =
    Boolean(lodging.trashLocation) ||
    lodging.trashBins.length > 0 ||
    recyclingCards.length > 0

  return (
    <GuideStayScreen title="Infos pratiques" onBack={onBack}>
      <div className="grid gap-4">
        <GuideWifiCard name={lodging.wifiName} password={lodging.wifiPassword} />

        <section className="grid gap-3">
          <GuideSectionTitle>Urgences</GuideSectionTitle>
          {FRENCH_EMERGENCY_NUMBERS.map(item => (
            <GuideInfoCard
              key={item.number}
              testId="guide-practical-emergency"
              href={frenchPhoneHref(item.number)}
              icon={Siren}
              tone="emergency"
              title={item.label}
              trailing={<PhoneLabel value={item.number} />}
            />
          ))}
        </section>

        {lodging.usefulNumbers.length > 0 && (
          <section className="grid gap-3">
            <GuideSectionTitle>Numéros utiles</GuideSectionTitle>
            {lodging.usefulNumbers.map(item => (
              <GuideInfoCard
                key={item.label}
                testId="guide-practical-useful-number"
                href={frenchPhoneHref(item.number)}
                icon={Phone}
                tone="phone"
                title={item.label}
                trailing={<PhoneLabel value={formatFrenchPhone(item.number)} />}
              />
            ))}
          </section>
        )}

        {(recyclingCards.length > 0 || showTrashPoint) && (
          <section className="grid gap-3">
            <GuideSectionTitle>Tri des déchets</GuideSectionTitle>
            {recyclingCards.map(card => (
              <article
                key={card.id}
                data-testid="guide-practical-recycling"
                data-guide-card="true"
                className={GUIDE_CARD}
              >
                <GuideCardHeading icon={Recycle} tone="location" as="h3" title={card.title} />
                <div className="mt-3">
                  <GuideDarkMarkdown source={card.description} />
                </div>
              </article>
            ))}
            {showTrashPoint && (
              <GuideInfoCard
                testId="guide-practical-trash-location"
                href={trashPointHref(lodging)}
                external
                icon={MapPin}
                tone="location"
                title="Point de tri"
                hint={trashPointHint(lodging)}
              />
            )}
          </section>
        )}
      </div>
    </GuideStayScreen>
  )
}

function PhoneLabel({ value }: { value: string }) {
  return <span className="whitespace-nowrap text-sm font-bold">{value}</span>
}
