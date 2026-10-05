import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage, type LegalSection } from '@/features/marketing/components/LegalPage'

export const metadata: Metadata = {
  title: 'Confidentialité',
  description: 'Comment MyStay utilise les données des formulaires, les cookies et les services techniques, et comment exercer vos droits.',
  alternates: { canonical: '/confidentialite' },
}

const sections: LegalSection[] = [
  { id: 'responsable', title: 'Votre interlocuteur', content: <>
    <p><strong>David Devillers</strong> est responsable du traitement des données du site MyStay. Vous pouvez le contacter à <a href="mailto:bonjour@mystay.city">bonjour@mystay.city</a> ou au 1094 route de la Croix, 74170 Saint-Gervais-les-Bains, France.</p>
    <p>Cette page explique les données utilisées pour les demandes de contact et les fonctionnalités du site. Les informations sur l’éditeur figurent dans les <Link href="/mentions-legales">mentions légales</Link>.</p>
  </> },
  { id: 'formulaires', title: 'Les informations que vous nous confiez', content: <>
    <p>Les formulaires de contact, de demande propriétaire et de projet de séminaire recueillent votre nom, votre adresse e-mail, l’objet et le contenu de votre message. Le numéro de téléphone est facultatif. Les champs signalés comme obligatoires sont nécessaires pour recevoir et traiter votre demande ; sans eux, le formulaire ne peut pas être envoyé.</p>
    <p>Selon le formulaire, le message peut être associé au logement concerné et à son destinataire, la conciergerie ou le propriétaire. Nous conservons également la date de réception, le statut de traitement et les réponses apportées.</p>
    <p>Merci de ne pas transmettre de données sensibles ou de documents personnels inutiles dans les champs libres. Le champ de protection anti-robot sert à écarter les envois automatisés.</p>
  </> },
  { id: 'finalites', title: 'Pourquoi nous les utilisons', content: <>
    <ul>
      <li><strong>Préparer une prestation à votre demande :</strong> comprendre votre projet et vous répondre, sur la base des mesures précontractuelles prises à votre initiative.</li>
      <li><strong>Répondre aux autres messages :</strong> traiter une question ou une demande d’aide, sur la base de notre intérêt légitime à assurer ces échanges.</li>
      <li><strong>Faire fonctionner et protéger le site :</strong> gérer les accès, les erreurs et les abus, sur la base de notre intérêt légitime à fournir un service fiable et sécurisé.</li>
      <li><strong>Mesurer l’audience avec Google Analytics :</strong> comprendre les pages consultées et certaines interactions, lorsque vous y avez consenti.</li>
    </ul>
    <p>Le site ne réalise aucune vente ni aucun paiement en ligne et ne recueille pas de coordonnées bancaires dans ses formulaires. Les messages ne sont pas utilisés pour vous inscrire automatiquement à une newsletter.</p>
  </> },
  { id: 'destinataires', title: 'Qui peut accéder aux données', content: <>
    <p>Les demandes sont accessibles à David Devillers et aux personnes habilitées à les traiter. Lorsqu’un formulaire du guide est explicitement destiné au propriétaire du logement, ce propriétaire peut accéder au message correspondant.</p>
    <p>Des prestataires techniques interviennent pour assurer le fonctionnement du site :</p>
    <ul>
      <li><a href="https://vercel.com/legal/privacy-notice">Vercel</a> : hébergement, diffusion du site, données techniques de connexion, outils d’audience et de performance.</li>
      <li><a href="https://supabase.com/privacy">Supabase</a> : base de données des messages, stockage des contenus et authentification des espaces réservés.</li>
      <li><a href="https://resend.com/legal/privacy-policy">Resend</a> : envoi des notifications et des e-mails liés aux demandes. Les coordonnées et le contenu du message peuvent être inclus dans ces e-mails.</li>
      <li><a href="https://policies.google.com/privacy?hl=fr">Google</a> : mesure d’audience avec Google Analytics, après votre accord.</li>
      <li><a href="https://www.mapbox.com/legal/privacy">Mapbox</a> : cartes et fonctions de localisation lorsque vous les utilisez.</li>
    </ul>
    <p>Ces prestataires peuvent traiter certaines données hors de l’Espace économique européen. Leurs notices et documents contractuels précisent les lieux de traitement et les mécanismes de transfert proposés, notamment les clauses contractuelles types lorsqu’elles s’appliquent. Vous pouvez nous demander des précisions sur les garanties applicables à votre situation à <a href="mailto:bonjour@mystay.city">bonjour@mystay.city</a>.</p>
  </> },
  { id: 'conservation', title: 'Combien de temps nous les conservons', content: <>
    <p>Les messages transmis via nos formulaires sont conservés pendant le traitement de votre demande, puis <strong>au maximum 12 mois après le dernier échange</strong>, sauf nécessité de conservation liée à une obligation légale ou à un litige.</p>
    <p>Cette règle concerne les messages et leurs copies dans la messagerie. Les éléments nécessaires à un dossier contractuel ou à la défense de droits peuvent faire l’objet d’une conservation distincte, limitée au besoin concerné. Vous pouvez demander l’effacement de vos données avant cette échéance, sous réserve des exceptions prévues par la réglementation.</p>
  </> },
  { id: 'cookies', title: 'Cookies et mesure d’audience', content: <>
    <p>Le site utilise des mécanismes nécessaires aux fonctionnalités choisies : cookies de connexion des espaces réservés, cookie d’accès au séjour <strong>lodging_id</strong> d’une durée standard de sept jours, et stockage local de préférences ou de progression du guide. Ces éléments ne servent pas à vous inscrire à une campagne publicitaire.</p>
    <p>Votre choix de mesure d’audience est enregistré dans votre navigateur sous <strong>mystay_analytics_consent</strong>. Google Analytics n’est chargé que si vous acceptez la mesure d’audience et si ce service est configuré. Il peut alors traiter des pages consultées, des interactions et des informations sur votre navigateur ou appareil.</p>
    <p>Vercel Web Analytics et Speed Insights sont également intégrés pour les statistiques de navigation et les performances techniques. Leur chargement est actuellement indépendant du choix relatif à Google Analytics. Refuser Google Analytics ne désactive donc pas ces deux services.</p>
    <p>Vous pouvez modifier les permissions de votre navigateur et effacer les cookies ainsi que le stockage du site dans ses paramètres. Pour choisir à nouveau sur la bannière, effacez les données du site puis rechargez la page ; cela peut aussi réinitialiser vos préférences et votre accès au séjour. Pour toute demande relative au retrait de votre consentement, contactez-nous.</p>
  </> },
  { id: 'guide', title: 'Le guide et votre localisation', content: <>
    <p>L’accès au guide de séjour repose sur le logement associé à votre lien ou QR code. Les espaces propriétaires et administrateurs utilisent une authentification distincte.</p>
    <p>Les fonctions de localisation demandent l’autorisation de votre navigateur. Vous pouvez la refuser ou la retirer dans ses paramètres. Les cartes s’appuient sur Mapbox ; des informations techniques sont transmises au fournisseur lors de leur affichage. La position que vous autorisez à utiliser peut être enregistrée localement dans votre navigateur pour faciliter la navigation et le calcul des distances. Les favoris et certaines étapes du séjour sont également conservés localement. Ces données locales restent jusqu’à leur effacement ou à la suppression des données du site dans votre navigateur.</p>
  </> },
  { id: 'droits', title: 'Vos droits, simplement', content: <>
    <p>Selon les conditions prévues par le RGPD, vous pouvez demander l’accès à vos données, leur rectification, leur effacement ou la limitation de leur traitement. Vous pouvez vous opposer à un traitement fondé sur l’intérêt légitime, retirer votre consentement et exercer votre droit à la portabilité lorsqu’il s’applique.</p>
    <p>Écrivez à <a href="mailto:bonjour@mystay.city">bonjour@mystay.city</a> en précisant votre demande. Une vérification d’identité peut être nécessaire en cas de doute raisonnable. Nous vous répondons dans le délai prévu par la réglementation, en principe un mois ; toute prolongation justifiée vous sera expliquée.</p>
    <p>Vous pouvez également adresser une réclamation à la <a href="https://www.cnil.fr/fr/adresser-une-plainte">CNIL</a>. Pour en savoir plus sur les traitements et vos droits, consultez <a href="https://www.cnil.fr/fr/informer-les-personnes">les informations de la CNIL</a>.</p>
  </> },
]

export default function PrivacyPage() {
  return <LegalPage pathname="/confidentialite" title="Confidentialité" intro="Vos données, expliquées simplement. Ce que vous nous confiez, pourquoi nous l’utilisons et comment garder la main." sections={sections} />
}
