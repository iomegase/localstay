# Mutualisation des landings conciergerie locales

## Objectif

Toutes les pages publiées sous `/conciergerie/[city-slug]` utilisent la même
architecture de conversion MyStay, sans dupliquer le JSX ni uniformiser leurs
textes locaux.

## Architecture

Le composant spécialisé Saint-Nicolas devient `LocalConciergeLanding`. Il reçoit :

- la destination et son contenu conciergerie validé ;
- au plus trois logements réellement publiés ;
- une collection facultative d'avis voyageurs vérifiés ;
- la route du guide public local dérivée du slug de la destination.

La route serveur charge les logements une seule fois pour toute destination
conciergerie publiée, puis rend le composant partagé. Les destinations non
publiées conservent leur réponse 404 actuelle.

## Contenu partagé et contenu local

La structure, les styles, les six prestations, le fonctionnement en quatre
étapes, le guide MyStay et les CTA sont communs. Les éléments SEO et locaux
restent propres à chaque destination : H1, metadata, promesse, paragraphes,
secteurs géographiques et FAQ.

Saint-Gervais mentionne ses secteurs réels déjà documentés : centre, Le Fayet et
Le Bettex. Saint-Nicolas conserve le village et les Chattrix. Les futures pages
de Megève et Combloux utiliseront automatiquement le composant lorsqu'elles
seront explicitement publiées, mais restent en 404 dans cette livraison.

## Données et avis

Les cartes proviennent uniquement de `listPublishedLodgings({ limit: 3 })`.
Aucun logement fictif n'est affiché. Les avis sont sélectionnés par slug depuis
un catalogue structuré ; une collection vide ne produit ni section visible ni
markup d'avis.

## SEO et maillage

Chaque page garde une seule balise H1, ses metadata et son `Service` JSON-LD
avec `provider`, `serviceType`, `areaServed` et URL canonique. Les liens pointent
vers `/confier-mon-logement`, `/logements`, `/concept` et
`/decouvrir/[city-slug]`.

## Responsive et accessibilité

Le composant reste Server Component. Il conserve la composition mobile-first,
les composants `MarketingShell`, `MarketingPropertyCard`, `next/image`, les
liens natifs, les détails FAQ accessibles et les styles sans serif MyStay.

## Tests

Un test d'intégration rend Saint-Gervais et Saint-Nicolas avec le même composant
et vérifie leurs contenus locaux distincts. Les tests existants couvrent les
404, le JSON-LD, l'absence de faux avis et les CTA.
