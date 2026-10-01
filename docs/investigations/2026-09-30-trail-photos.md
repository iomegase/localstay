# Photos des randonnées — récupération du 30 septembre 2026

## Cause constatée

La publication ne lisait les images que pour un candidat dont la source principale était `camptocamp`, via `raw_payload.associations.images`, avec un plafond de huit images. Les photos des sources secondaires étaient perdues lors du dédoublonnage. Les pages officielles ne fournissaient aucune galerie au modèle candidat et les imports GPX de récupération ne conservaient pas les galeries de leurs pages sources. Un GPX téléchargé ne transporte pas cette galerie. La revue admin ne présentait pas les photos avant publication.

## Correction locale — spec 019, AC-02-06 à AC-02-08

- Format commun `raw_payload.acquired_photos` validé par Zod : URL, page source, attribution, légende et licence si fournie.
- Compatibilité avec les anciennes associations Camptocamp, sans plafond de huit images.
- Extraction des galeries HwSheet et des galeries officielles Combloux, avec repli sur l'image Open Graph. Les recommandations extérieures à la galerie sont exclues.
- Conservation des photos des sources secondaires lors du dédoublonnage.
- Publication quelle que soit la source principale ; fusion ajoutant les photos sans remplacer celles de la fiche existante. Crédits conservés dans `TrailDetail.source_refs`.
- Galerie consultable dans la table admin et hôtes d'images autorisés.

Ces modifications de code ne sont pas déployées. La récupération ponctuelle ci-dessous a en revanche été appliquée à la base et au stockage réels.

## Récupération exécutée

- 751 URL d'images distinctes téléchargées, décodées et copiées dans le bucket Supabase existant `guide-photos`, préfixe `trails/acquired/` ; aucun téléchargement en échec.
- Copies WebP optimisées, largeur maximale 1600 px ; URL originales et dimensions d'origine conservées.
- Galeries des offices de tourisme, Geotrek et Camptocamp ; pour Camptocamp, consultation également des sorties et lieux associés et récupération des crédits au niveau de chaque image.
- 123 des 128 candidats actifs complétés, soit 879 associations photo–candidat. Une image peut servir à plusieurs candidats issus d'une même source.
- Les cinq POI déjà publiés ont reçu des photos : Plan glacier depuis la Gruvaz (4), Plateau d'Assy au Lac Vert (6), Boucle de Miage (3), Aiguillette des Houches (1), Aiguille Croche (3).
- Aucune nouvelle randonnée publiée. Les candidats supprimés n'ont pas été restaurés. Transactions avec contrôle de `updated_at` et `deleted_at` pour préserver les éditions concurrentes ; journal d'audit de récupération.
- Cinq candidats restent sans photo identifiée dans les sources consultées : Du Leutaz à Javen par l'Alpette ; Tour entre Vervex et Combloux ; Sulle strade dei valdesi ; Boucle vers Combloux ; RandoVol « Les Trois de Passy ». Cela ne démontre pas qu'aucune photo n'existe ailleurs.

La validation éditoriale reste au propriétaire. Les pages et associations sources sont conservées pour distinguer les images directement rattachées au parcours de celles provenant d'une sortie ou d'un lieu associé. Les photos de sources sans candidat actif restent disponibles dans l'archive.

## Vérification et livrables

- Jest ciblé : 18 suites, 65 tests réussis.
- TypeScript `tsc --noEmit` et ESLint sur les fichiers modifiés : réussis.
- Vérification indépendante en base et accès HTTP aux images publiées : `artifacts/trail-photos-2026-09-30/verification.json`.
- Galerie locale : `artifacts/trail-photos-2026-09-30/index.html`.
- Inventaire CSV et JSON, crédits, sources et résultat de récupération : même dossier.
- Archive complète : `artifacts/photos-randonnees-2026-09-30.zip`.

Les prochains imports officiels/Camptocamp pourront conserver leurs URL avec le correctif. La copie systématique en stockage de toutes les futures acquisitions n'est pas ajoutée au pipeline : l'hébergement Supabase décrit ici correspond à cette opération de récupération.
