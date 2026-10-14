import type { Metadata } from 'next'
import Link from 'next/link'
import {
  LegalPage,
  type LegalSection,
} from '@/features/marketing/components/LegalPage'

export const metadata: Metadata = {
  title: 'Conditions générales d’utilisation',
  description:
    'Consultez les conditions générales d’utilisation de MyStay : accès au guide de séjour, conciergerie, séminaires, coordination événementielle et protection des données.',
  alternates: {
    canonical: '/cgu',
  },
}

const sections: LegalSection[] = [
  {
    id: 'objet',
    title: 'Le rôle de MyStay',
    content: (
      <>
        <p>
          MyStay est un site de présentation et d’information
          consacré à la conciergerie locale, aux logements,
          aux séminaires professionnels et à la découverte
          du territoire du Mont-Blanc.
        </p>

        <p>
          Il propose également un guide numérique de séjour
          réservé aux voyageurs disposant d’un accès valide.
        </p>

        <p>
          Les présentes conditions définissent les modalités
          d’utilisation du site et de ses services numériques.
          L’éditeur est David Devillers, dont les coordonnées
          figurent dans les{' '}
          <Link href="/mentions-legales">
            mentions légales
          </Link>.
        </p>
      </>
    ),
  },

  {
    id: 'acces',
    title: 'Accéder au site et au guide',
    content: (
      <>
        <p>
          Les pages de présentation sont accessibles librement,
          sans création de compte. Certaines fonctionnalités
          nécessitent une connexion ou un accès privé au guide
          de séjour, notamment au moyen d’un lien personnalisé
          ou d’un QR code.
        </p>

        <p>
          Ces accès sont exclusivement destinés aux personnes
          autorisées pour le logement concerné. Les codes,
          mots de passe et informations permettant d’accéder
          au logement ne doivent pas être communiqués à des
          tiers non autorisés.
        </p>

        <p>
          Les espaces réservés aux propriétaires et aux
          administrateurs sont accessibles uniquement
          aux comptes habilités.
        </p>

        <p>
          Les frais de connexion et les équipements nécessaires
          à la consultation du site restent à la charge
          de l’utilisateur. MyStay peut être amené à interrompre
          temporairement l’accès à certaines fonctionnalités
          pour des raisons de maintenance, de sécurité
          ou en cas d’incident technique.
        </p>
      </>
    ),
  },

  {
    id: 'messages',
    title: 'Nous envoyer une demande',
    content: (
      <>
        <p>
          Les formulaires du site permettent de demander
          des renseignements, de présenter un logement,
          de soumettre un projet de séminaire ou de contacter
          MyStay.
        </p>

        <p>
          L’utilisateur s’engage à transmettre des informations
          exactes et pertinentes, limitées à ce qui est
          nécessaire au traitement de sa demande.
        </p>

        <p>
          <strong>
            L’envoi d’un formulaire ne constitue ni une commande,
            ni une réservation, ni un contrat de prestation.
          </strong>
        </p>

        <p>
          Le site ne propose pas de vente ou de paiement
          en ligne. Toute prestation éventuelle fait l’objet
          d’échanges préalables et, lorsque cela est nécessaire,
          d’un devis ou d’un contrat distinct établi
          par le professionnel concerné.
        </p>
      </>
    ),
  },

  {
    id: 'conciergerie',
    title: 'Conciergerie des logements',
    content: (
      <>
        <p>
          MyStay accompagne les propriétaires dans la gestion
          de leur location saisonnière : préparation du logement,
          accueil des voyageurs, suivi du bien et coordination
          des prestations sur place.
        </p>

        <p>
          MyStay intervient en qualité de co-hôte sur le compte
          du propriétaire auprès des plateformes de location.
          Le propriétaire reste titulaire de son annonce
          et conserve la pleine jouissance de son bien.
        </p>

        <p>
          <strong>
            MyStay n’encaisse pas les loyers.
          </strong>{' '}
          Ils sont versés directement au propriétaire
          par les plateformes. Les frais de ménage réglés
          par les voyageurs sont également perçus
          par le propriétaire.
        </p>

        <p>
          L’accompagnement ne comporte aucune clause
          d’exclusivité.
        </p>

        <p>
          Le ménage et l’entretien du linge peuvent être assurés
          par des prestataires indépendants, coordonnés
          par MyStay, qui interviennent dans le cadre
          de leurs propres engagements.
        </p>

        <p>
          Le contenu de l’accompagnement, les frais de service
          et les conditions d’intervention sont définis
          dans un accord conclu avec chaque propriétaire
          et ne relèvent pas des présentes conditions
          d’utilisation du site.
        </p>
      </>
    ),
  },

  {
    id: 'seminaires',
    title: 'Séminaires et coordination événementielle',
    content: (
      <>
        <p>
          MyStay propose un accompagnement dans la conception,
          la préparation et la coordination de séminaires
          professionnels, notamment à Saint-Gervais-les-Bains
          et dans le massif du Mont-Blanc.
        </p>

        <p>
          Cet accompagnement peut comprendre les missions
          suivantes :
        </p>

        <ul>
          <li>
            La recherche d’hébergements adaptés aux besoins
            des entreprises et la mise en relation avec
            les propriétaires partenaires.
          </li>
          <li>
            La conception de programmes de séminaires
            personnalisés, en fonction des objectifs,
            des participants et du budget envisagé.
          </li>
          <li>
            La recherche et la coordination de prestataires
            spécialisés dans les activités professionnelles,
            sportives, culturelles ou de loisirs.
          </li>
          <li>
            La planification des réunions, des activités,
            des repas et des différents temps du séminaire.
          </li>
          <li>
            L’accompagnement logistique, la coordination
            des intervenants et le suivi du déroulement
            de l’événement.
          </li>
        </ul>

        <p>
          <strong>
            Contractualisation et facturation
          </strong>
        </p>

        <p>
          Dans le cadre du fonctionnement présenté sur le site,
          les propositions commerciales, devis et contrats
          relatifs aux séjours sont établis directement
          par les propriétaires des hébergements partenaires,
          pour les prestations qu’ils sont légalement
          autorisés à commercialiser.
        </p>

        <p>
          Les propriétaires assurent la facturation
          et l’encaissement des prestations contractualisées
          avec leurs clients.
        </p>

        <p>
          Certains services complémentaires peuvent également
          faire l’objet d’un contrat et d’une facturation
          directement auprès des prestataires concernés.
        </p>

        <p>
          MyStay intervient dans une mission de conseil,
          de mise en relation et de coordination événementielle.
          Dans ce cadre, MyStay n’adresse aucune facture
          aux entreprises et n’encaisse pas les règlements
          correspondant aux hébergements ou aux activités
          proposés par les partenaires. Ses frais
          de coordination sont facturés au propriétaire
          partenaire.
        </p>

        <p>
          Les estimations transmises par MyStay ont une valeur
          indicative. Seuls les devis et contrats établis
          par les propriétaires et les prestataires engagent
          les parties.
        </p>

        <p>
          <strong>
            Prestataires et responsabilités
          </strong>
        </p>

        <p>
          Les propriétaires et les prestataires partenaires
          interviennent dans le cadre de leurs propres
          engagements contractuels et restent soumis
          aux obligations légales et professionnelles
          applicables à leurs activités.
        </p>

        <p>
          La mission de coordination de MyStay ne se substitue
          pas à l’exécution des prestations d’hébergement,
          de restauration, de transport ou d’activités
          assurées par les professionnels concernés.
        </p>

        <p>
          Cette répartition des rôles s’applique sans préjudice
          des responsabilités légalement applicables
          à chacun des intervenants.
        </p>

        <p>
          Les prestations susceptibles de relever
          de la réglementation relative à la vente
          de voyages et de séjours demeurent soumises
          aux dispositions du Code du tourisme.
        </p>

        <p>
          La présentation des missions de MyStay
          sur ce site ne constitue pas une dérogation
          aux obligations légales applicables
          à l’organisation ou à la commercialisation
          de ces prestations.
        </p>
      </>
    ),
  },

  {
    id: 'facturation',
    title: 'Qui facture nos prestations',
    content: (
      <>
        <p>
          Les prestations de conciergerie, de conseil,
          de conception et de coordination événementielle
          sont réalisées par David Devillers dans le cadre
          du portage salarial, auprès de la société
          JUMP GREEN, dont les coordonnées figurent dans les{' '}
          <Link href="/mentions-legales">
            mentions légales
          </Link>.
        </p>

        <p>
          MyStay ne facture que ses clients partenaires,
          c’est-à-dire les propriétaires des logements
          accompagnés. JUMP GREEN leur adresse les factures
          correspondantes et assure la rémunération
          du consultant, conformément aux dispositions légales
          applicables au portage salarial.
        </p>

        <p>
          MyStay n’adresse aucune facture aux voyageurs
          ni aux entreprises organisatrices de séminaires.
        </p>
      </>
    ),
  },

  {
    id: 'usage',
    title: 'Un usage respectueux',
    content: (
      <>
        <p>
          Vous vous engagez à utiliser le site dans le respect
          des personnes et des règles applicables.
          Les messages illicites, les envois automatisés
          abusifs, l’usurpation d’identité et les tentatives
          d’accès non autorisé sont interdits.
        </p>

        <p>
          Il est également interdit de chercher à compromettre
          le fonctionnement du site, à extraire des données
          privées ou à contourner les protections
          des espaces réservés.
        </p>
      </>
    ),
  },

  {
    id: 'informations',
    title: 'Informations locales et liens externes',
    content: (
      <>
        <p>
          MyStay s’efforce de présenter des informations
          locales utiles et régulièrement actualisées.
          Les horaires, tarifs, conditions d’accès
          et services des établissements peuvent toutefois
          évoluer indépendamment de notre volonté.
        </p>

        <p>
          Nous vous recommandons de vérifier les informations
          essentielles directement auprès des établissements
          et prestataires concernés avant votre déplacement.
        </p>

        <p>
          Les cartes, suggestions d’activités et informations
          de randonnée ne remplacent pas la signalisation,
          les consignes officielles ni l’appréciation
          des conditions météorologiques et du terrain.
          En cas d’urgence, contactez les services de secours.
        </p>

        <p>
          Les liens externes peuvent vous conduire vers
          des sites et services exploités par des tiers,
          soumis à leurs propres conditions d’utilisation.
          MyStay n’en maîtrise ni les contenus
          ni les évolutions.
        </p>
      </>
    ),
  },

  {
    id: 'droits',
    title: 'Contenus et responsabilités',
    content: (
      <>
        <p>
          Les textes, photographies, illustrations, éléments
          graphiques et autres contenus présents sur le site
          peuvent être protégés par des droits
          de propriété intellectuelle.
        </p>

        <p>
          Leur consultation ne confère aucun droit
          de reproduction, de modification ou d’exploitation
          au-delà des utilisations autorisées par la loi
          ou par les titulaires des droits concernés.
        </p>

        <p>
          MyStay s’efforce d’assurer le bon fonctionnement
          et la fiabilité des informations publiées,
          sans garantir l’absence permanente d’erreurs,
          d’indisponibilités ou d’interruptions techniques.
        </p>

        <p>
          La responsabilité de chaque partie s’apprécie
          selon le droit applicable et les circonstances.
          Les présentes conditions ne limitent pas les droits
          impératifs dont vous bénéficiez et ne constituent
          pas une exclusion générale de la responsabilité
          de l’éditeur.
        </p>
      </>
    ),
  },

  {
    id: 'vie-privee',
    title: 'Vos données',
    content: (
      <>
        <p>
          Les données personnelles transmises par les
          formulaires, ainsi que les informations relatives
          aux cookies et aux fonctionnalités techniques,
          sont traitées conformément à notre{' '}
          <Link href="/confidentialite">
            politique de confidentialité
          </Link>.
        </p>

        <p>
          Pour toute question relative au traitement
          de vos données personnelles, vous pouvez écrire
          à{' '}
          <a href="mailto:bonjour@mystay.city">
            bonjour@mystay.city
          </a>.
        </p>
      </>
    ),
  },

  {
    id: 'evolution',
    title: 'Évolution et droit applicable',
    content: (
      <>
        <p>
          Les présentes conditions peuvent évoluer
          afin de tenir compte des modifications du site,
          de ses fonctionnalités ou du cadre réglementaire.
        </p>

        <p>
          La date de mise à jour indiquée sur cette page
          permet d’identifier la version en vigueur.
        </p>

        <p>
          Le droit français s’applique, sous réserve
          des dispositions impératives applicables
          à votre situation.
        </p>

        <p>
          En cas de difficulté, vous pouvez nous contacter
          afin de rechercher une solution amiable,
          sans renoncer à vos voies de recours.
        </p>
      </>
    ),
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      pathname="/cgu"
      updatedOn="2026-10-14"
      title="Conditions d’utilisation"
      intro="Un cadre clair pour découvrir MyStay, consulter votre guide de séjour et organiser vos projets avec nous."
      sections={sections}
    />
  )
}
