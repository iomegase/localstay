import { getLodgingAvailability } from '../queries/availability'
import { LodgingAvailabilityCalendar } from './LodgingAvailabilityCalendar'

/** Spec 089 : rien sans lien iCal ou si le calendrier est illisible (AC-02-03). */
export async function LodgingAvailability({ profileId }: { profileId: string }) {
  const availability = await getLodgingAvailability(profileId)
  if (!availability) return null
  return <LodgingAvailabilityCalendar today={availability.today} busy={availability.busy} />
}
