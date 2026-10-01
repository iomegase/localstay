/** Liens du bloc « Nos destinations » du footer (spec 046 AC-04-06). */
export type FooterDestinationLink = { name: string; href: string }

export type FooterLocalLandingLinks = {
  vacationRental: FooterDestinationLink[]
  concierge: FooterDestinationLink[]
  seminar: FooterDestinationLink[]
}
