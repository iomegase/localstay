# Administration des avis des landings locales

## Objectif

Le Super-admin dispose d'un onglet `Landing pages` pour consulter les villes du
catalogue SEO local et administrer les avis voyageurs affichés sur leurs pages
`/conciergerie/[city-slug]`.

## Architecture retenue

Les avis quittent le catalogue TypeScript statique et sont persistés dans une
table Prisma dédiée au bounded context `local-seo`. Ils sont rattachés au slug
canonique d'une destination du catalogue afin que les quatre villes préparées
restent visibles dans l'Admin, même lorsque leur landing de service n'est pas
encore publiée.

L'Admin liste les destinations, choisit une ville puis crée ou modifie un avis.
Chaque enregistrement contient l'auteur affiché, le témoignage, une date de
séjour facultative, une source `Airbnb` ou `Direct`, une note facultative et un
ordre d'affichage. Il devient public dès l'enregistrement. Aucune confirmation
de droit ni étape brouillon n'est demandée, conformément à la décision du
Product Owner du 8 septembre 2026.

## Publication et suppression

La query publique retourne au plus trois avis actifs et non supprimés, triés par
ordre puis par date de création. Une mutation revalide immédiatement la landing
conciergerie concernée. Archiver renseigne `deleted_at` et masque l'avis ;
restaurer annule cet archivage. Aucune suppression physique n'existe.

## Interface

Le menu latéral Admin reçoit l'entrée `Landing pages`. La page est mobile-first :
cartes de villes, formulaire compact et liste d'avis deviennent une grille sur
écran large. Les champs et actions reprennent le langage visuel du dashboard et
les icônes Lucide.

## Sécurité et validation

Toutes les routes sont réservées au rôle `admin` via le mécanisme de session
existant. Zod valide le slug contre le catalogue, les longueurs de texte, la note
de 1 à 5 et l'ordre entier positif. Les réponses d'erreur utilisent le contrat
JSON commun.

## Alternatives écartées

- Écrire dans un fichier TypeScript depuis l'Admin : non durable sur Vercel.
- Stocker un JSON générique : validation, tri, audit et restauration fragiles.
- Rattacher les avis à un logement : hors du besoin des landings par ville.

