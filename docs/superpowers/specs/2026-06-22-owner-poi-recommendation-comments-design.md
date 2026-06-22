# Commentaires Owner sur les recommandations POI

## Statut

Validé par le Product Owner le 2026-06-22.

## Contexte

La personnalisation d'un logement permet à un Owner de sélectionner jusqu'à cinq POI par catégorie. Une ancienne version permettait aussi de rédiger un commentaire personnel sur chaque recommandation. Cette donnée et son interface ont été retirées lorsque la spec 012 a interdit `owner_note`.

Le besoin validé consiste à restaurer uniquement le commentaire personnel. La notation Owner par étoiles ne revient pas.

## Décisions produit

- Le commentaire est facultatif.
- Il appartient au couple `Lodging`–`PointOfInterest`, pas au POI global.
- Il est limité à 300 mots.
- Le formulaire Owner affiche un compteur `X / 300 mots`.
- La sauvegarde est impossible lorsqu'au moins un commentaire dépasse la limite.
- Le commentaire est visible uniquement sur `/nos-recommandations`, dans le contexte du logement actif.
- Il n'apparaît pas dans les listes du Guide, les fiches POI générales ou les pages SEO logement.
- Le contenu est rendu comme texte simple. Aucun Markdown ni HTML n'est interprété.

## Architecture

`LodgingFeaturedPoi` reçoit un champ nullable `owner_note String?`. Ce modèle est la bonne frontière métier puisqu'une recommandation et son commentaire varient selon le logement.

Le contrat GET/PUT de `/api/dashboard/lodgings/{id}/customization` expose `owner_note` dans chaque élément `featured_pois`. La validation Zod contrôle la limite de 300 mots. La validation est également appliquée dans la couche métier avant persistance.

Le formulaire de personnalisation conserve le commentaire dans l'état de chaque POI sélectionné. Le textarea n'est affiché qu'après sélection du POI. Désélectionner puis sauvegarder applique le soft delete existant à la recommandation.

La page `/nos-recommandations` sélectionne `owner_note` avec le POI et l'affiche lorsqu'il est non vide. Les autres queries publiques ne doivent pas propager ce champ.

## Affichage

Dans le dashboard Owner, le champ porte le libellé "Votre mot pour les voyageurs" et se situe sous le POI sélectionné. Le compteur est mis en erreur au-delà de 300 mots.

Dans `/nos-recommandations`, le commentaire est visuellement distinct de la description générale du POI et apparaît avant celle-ci. Un commentaire absent ne réserve aucun espace.

## Erreurs

Un payload contenant un commentaire de plus de 300 mots retourne une erreur `400 INVALID_BODY` conforme au contrat existant. Le serveur ne tronque jamais silencieusement le texte.

## Tests attendus

- Test unitaire du comptage des mots et de la limite.
- Test composant du textarea, du compteur et du blocage de sauvegarde.
- Test contrat GET/PUT avec commentaire valide, nul et supérieur à 300 mots.
- Test métier de persistance du commentaire sur le bon logement et le bon POI.
- Test d'intégration vérifiant l'affichage sur `/nos-recommandations`.
- Test de non-régression vérifiant l'absence du commentaire sur les cards et fiches POI générales.

## Hors périmètre

- Rating Owner.
- Commentaire public hors mode séjour.
- Markdown, HTML, traduction ou génération assistée du commentaire.
- Commentaires multiples ou historique des modifications.
