import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage, type LegalSection } from '@/features/marketing/components/LegalPage'

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Éditeur, coordonnées et hébergement du site MyStay : les informations utiles en toute clarté.',
  alternates: { canonical: '/mentions-legales' },
}

const sections: LegalSection[] = [
  { id: 'editeur', title: 'Éditeur du site', content: <>
    <p>Le site MyStay, accessible à l’adresse www.mystay.city, est édité par <strong>David Devillers</strong>, qui en assure également la direction de la publication. MyStay est le nom utilisé pour présenter son activité et son guide local.</p>
    <p><strong>Adresse :</strong> 1094 route de la Croix, 74170 Saint-Gervais-les-Bains, France.<br /><strong>E-mail :</strong> <a href="mailto:bonjour@mystay.city">bonjour@mystay.city</a>.<br /><strong>Téléphone :</strong> <a href="tel:+33607859058">+33 6 07 85 90 58</a>.</p>
  </> },
  { id: 'objet', title: 'Un site de présentation et de contact', content: <>
    <p>MyStay présente un accompagnement local des logements et des voyageurs en Haute-Savoie, des informations sur les séminaires, des logements et des contenus de découverte locale.</p>
    <p>Aucune vente, réservation ou opération de paiement n’est réalisée en ligne sur ce site. Les formulaires servent à nous transmettre un message ou une demande. Les conditions d’une éventuelle prestation sont définies séparément.</p>
  </> },
  { id: 'hebergement', title: 'Hébergement', content: <>
    <p>Le site est hébergé par <strong>Vercel Inc.</strong>, 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis.</p>
    <p>Site de l’hébergeur : <a href="https://vercel.com">vercel.com</a>. Pour contacter l’hébergeur : <a href="https://vercel.com/help">centre d’aide Vercel</a>. Ses coordonnées officielles figurent dans sa <a href="https://vercel.com/legal/privacy-notice">notice de confidentialité</a>.</p>
  </> },
  { id: 'contenus', title: 'Contenus et propriété intellectuelle', content: <>
    <p>Les textes, photographies, illustrations, signes distinctifs et éléments du site sont protégés par les droits applicables et appartiennent à leurs titulaires respectifs. Leur présence sur MyStay n’autorise pas leur réutilisation commerciale.</p>
    <p>Toute reproduction ou utilisation nécessitant une autorisation doit faire l’objet d’un accord préalable du titulaire des droits. Les usages permis par la loi restent autorisés. Les crédits et attributions affichés doivent être respectés.</p>
  </> },
  { id: 'donnees', title: 'Données personnelles et utilisation', content: <>
    <p>David Devillers est responsable des traitements des données recueillies par les formulaires MyStay. Pour comprendre leur utilisation et exercer vos droits, consultez la <Link href="/confidentialite">politique de confidentialité</Link>.</p>
    <p>Les modalités d’accès au site et au guide sont précisées dans les <Link href="/cgu">conditions générales d’utilisation</Link>. Une erreur ou un contenu à corriger ? Écrivez-nous à <a href="mailto:bonjour@mystay.city">bonjour@mystay.city</a>.</p>
  </> },
]

export default function LegalNoticePage() {
  return <LegalPage pathname="/mentions-legales" title="Mentions légales" intro="Les informations utiles pour savoir qui se trouve derrière MyStay et comment nous contacter." sections={sections} />
}
