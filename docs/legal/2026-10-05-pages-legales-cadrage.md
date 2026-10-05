# Pages légales MyStay — cadrage éditorial et audit technique

Date : 5 octobre 2026. Statut : préparation, informations juridiques à fournir.
Aucune page publiée. Aucun changement de traitement des données.

## Périmètre confirmé par le Product Owner

Site de présentation et d'information, sans vente, paiement ou réservation en ligne.
Les formulaires permettent de recevoir des demandes de contact, de conciergerie
et de séminaire. Les CGU concernent l'utilisation du site, pas une vente en ligne.

Routes demandées, déjà présentes dans MarketingFooter : `/mentions-legales`,
`/confidentialite`, `/cgu`. Elles réutiliseront MarketingShell : fond blanc,
typographie MyStay, accent rose discret, titres éditoriaux, colonne de lecture
et sections numérotées. Texte français simple, daté, liens entre les trois pages.

## Constat technique vérifié dans le code

- Next.js App Router, React, TypeScript, Tailwind ; déploiement Vercel décrit
  dans docs/DAT/architecture.md. L'identité contractuelle et les coordonnées
  complètes de l'hébergeur restent à vérifier dans une source officielle.
- Formulaires : nom, e-mail, téléphone facultatif, objet, message ; logement et
  destinataire associés pour les contacts du guide. Validation Zod, champ
  honeypot anti-robot. Sources : contact-messages/schemas.ts et
  app/api/public/contact-messages/route.ts.
- Messages stockés dans ContactMessage via Prisma/PostgreSQL Supabase, avec
  dates, statut, archivage, réponse et suppression logique. Aucune durée de
  conservation ou purge des messages identifiée dans les fichiers inspectés.
  Une suppression logique ne démontre pas un effacement RGPD effectif.
- Notifications des formulaires publics envoyées via Resend à
  bonjour@mystay.city. Les messages et coordonnées font partie du contenu
  transmis pour ces notifications. Sources : shared/lib/resend.ts et route POST.
- Contact public existant : bonjour@mystay.city, +33 6 07 85 90 58 ; la mention
  « Haute-Savoie, France » n'est pas une adresse légale de siège.
- Google Analytics : script chargé seulement après acceptation et présence
  de NEXT_PUBLIC_GA4_MEASUREMENT_ID. Les clics suivis sont également soumis
  à acceptation. Le code ne prouve pas la configuration effective en production.
- Choix d'audience stocké dans localStorage sous mystay_analytics_consent,
  sans expiration explicite dans le code inspecté. Bannière accepter/refuser.
- Vercel Analytics et Speed Insights : composants montés dans le layout public
  indépendamment de ce choix. Ne pas affirmer que tous les outils de mesure
  sont désactivés après refus. Vérifier leurs conditions et configuration.
- Cookie lodging_id : accès au guide de séjour, durée standard de sept jours.
  Authentification Supabase pour les espaces propriétaires/admin, avec cookies.
- Le guide comporte des cartes et fonctions facultatives de localisation ;
  préciser leurs traitements après audit détaillé avant de promettre un périmètre
  couvrant toute l'application. La présence de bibliothèques Stripe ou Gemini
  ne signifie pas que les formulaires de contact les utilisent.
- Aucun secret, identifiant de projet ou donnée de voyageur ne doit apparaître
  dans les pages ou ce document.

## Texte et structure proposés

Mentions légales : « Les informations utiles sur MyStay. » Identification de
l'éditeur, contact, directeur de publication, hébergeur, propriété intellectuelle.

Confidentialité : « Vos données, expliquées simplement. » Responsable du
traitement ; données des formulaires et finalités ; bases légales à valider ;
destinataires et prestataires ; conservation à décider ; cookies et audience ;
transferts et garanties à vérifier ; droits, contact et réclamation à la CNIL.
Ne pas promettre une durée de conservation que le fonctionnement ne respecte pas.

CGU : « Un cadre clair pour utiliser MyStay. » Objet informatif ; accès public
et guide privé ; formulaires sans commande ni réservation ; usage respectueux ;
contenus et liens externes ; disponibilité ; responsabilités proportionnées ;
propriété intellectuelle ; données ; modifications et droit applicable.
Ne pas inventer de prix, conditions de vente, médiateur ou clause de compétence.

## Informations nécessaires du Product Owner

Identité de l'éditeur (entreprise ou entrepreneur), forme juridique, adresse
complète, SIREN/SIRET et RCS le cas échéant, capital et TVA le cas échéant,
directeur de publication ; contact pour les droits ; politique de conservation
réellement pratiquée pour les messages. Ces informations et décisions légales
sont absentes des éléments inspectés et ne peuvent pas être déduites du nom MyStay.

## Sources officielles consultées

- https://entreprendre.service-public.gouv.fr/vosdroits/F31228
- https://www.economie.gouv.fr/entreprises/developper-son-entreprise/innover-et-numeriser-son-entreprise/mentions-sur-votre-site-internet-les-obligations-respecter
- https://www.cnil.fr/fr/informer-les-personnes
- https://www.cnil.fr/fr/conformite-rgpd-information-des-personnes-et-transparence

La spec approuvée 031 prévoit les liens du footer ; le contenu juridique des
pages devra être consigné dans une spec validée après résolution de ces points.
