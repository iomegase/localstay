import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage, type LegalSection } from '@/features/marketing/components/LegalPage'

export const metadata: Metadata = {
  title: 'Conditions générales d’utilisation',
  description: 'Les conditions d’utilisation du site et du guide MyStay : accès, informations locales et formulaires de contact.',
  alternates: { canonical: '/cgu' },
}

const sections: LegalSection[] = [
  { id: 'objet', title: 'Le rôle de MyStay', content: <>
    <p>MyStay est un site de présentation et d’information consacré à la conciergerie locale, aux logements, aux séminaires et à la découverte du territoire. Il propose également un guide de séjour réservé aux voyageurs disposant d’un accès valide.</p>
    <p>Ces conditions expliquent les règles d’utilisation de ces espaces. L’éditeur est David Devillers, dont les coordonnées figurent dans les <Link href="/mentions-legales">mentions légales</Link>.</p>
  </> },
  { id: 'acces', title: 'Accéder au site et au guide', content: <>
    <p>Les pages de présentation sont accessibles sans compte. Certaines fonctionnalités nécessitent une connexion ou un accès au guide de séjour, transmis notamment par un lien ou un QR code.</p>
    <p>Un accès privé est destiné aux personnes autorisées pour le logement concerné. Ne diffusez pas les codes, mots de passe ou informations d’accès au logement. Les espaces propriétaires et administrateurs sont réservés aux comptes habilités.</p>
    <p>Les frais de connexion et l’équipement nécessaires à la consultation restent à votre charge. Des opérations de maintenance ou des incidents peuvent interrompre temporairement le service.</p>
  </> },
  { id: 'messages', title: 'Nous envoyer une demande', content: <>
    <p>Les formulaires permettent de demander un renseignement, de présenter un projet de logement ou de séminaire, ou de nous contacter. Merci de transmettre des coordonnées exactes et les seules informations utiles à votre demande.</p>
    <p><strong>L’envoi d’un formulaire ne constitue ni une commande, ni une réservation, ni un contrat de prestation.</strong> Le site ne propose pas de vente ou de paiement en ligne. Tout engagement éventuel fait l’objet d’un échange et de conditions distinctes.</p>
  </> },
  { id: 'usage', title: 'Un usage respectueux', content: <>
    <p>Vous vous engagez à utiliser le site dans le respect des personnes et des règles applicables. Les messages illicites, les envois automatisés abusifs, l’usurpation d’identité et les tentatives d’accès non autorisé sont interdits.</p>
    <p>Il est également interdit de chercher à compromettre le fonctionnement du site, à extraire des données privées ou à contourner les protections des espaces réservés.</p>
  </> },
  { id: 'informations', title: 'Informations locales et liens externes', content: <>
    <p>Nous prenons soin de présenter des informations utiles. Les horaires, conditions d’accès et services des établissements peuvent évoluer : vérifiez les informations essentielles directement auprès du lieu concerné avant votre déplacement.</p>
    <p>Les cartes, suggestions et informations de randonnée ne remplacent pas la signalisation, les consignes officielles ou votre appréciation des conditions sur place. En cas d’urgence, appelez les services de secours.</p>
    <p>Les liens vers d’autres sites vous conduisent vers des services exploités par leurs propres responsables et soumis à leurs conditions. MyStay ne maîtrise pas leur contenu ou leurs évolutions.</p>
  </> },
  { id: 'droits', title: 'Contenus et responsabilités', content: <>
    <p>La consultation du site ne transfère aucun droit sur ses textes, images ou autres éléments protégés. Respectez les droits des titulaires et les crédits affichés ; les usages autorisés par la loi restent possibles.</p>
    <p>La responsabilité de chaque partie s’apprécie selon le droit applicable et les circonstances. Ces conditions ne limitent pas les droits impératifs dont vous bénéficiez et ne constituent pas une exclusion générale de la responsabilité de l’éditeur.</p>
  </> },
  { id: 'vie-privee', title: 'Vos données', content: <p>Les données des formulaires, les cookies et les fonctionnalités techniques sont décrits dans la <Link href="/confidentialite">politique de confidentialité</Link>. Pour toute question, écrivez à <a href="mailto:bonjour@mystay.city">bonjour@mystay.city</a>.</p> },
  { id: 'evolution', title: 'Évolution et droit applicable', content: <>
    <p>Ces conditions peuvent évoluer avec le site. La date indiquée en haut de cette page permet de repérer la dernière mise à jour.</p>
    <p>Le droit français s’applique, sous réserve des dispositions impératives applicables à votre situation. En cas de difficulté, vous pouvez nous contacter pour rechercher une solution amiable, sans renoncer à vos voies de recours.</p>
  </> },
]

export default function TermsPage() {
  return <LegalPage pathname="/cgu" title="Conditions d’utilisation" intro="Un cadre clair pour découvrir MyStay, consulter votre guide et échanger avec nous." sections={sections} />
}
