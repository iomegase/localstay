# Photo & vidéo YouTube sur les infos pratiques du logement

**Date :** 2026-07-03
**Statut :** Design validé — prêt pour plan d'implémentation
**Surface concernée :** Page invité pendant le séjour `/le-logement` (derrière le cookie logement)

## Contexte & objectif

Aujourd'hui l'owner ne peut illustrer le logement qu'avec des **photos** (upload Supabase). Il
n'existe aucun support vidéo. L'owner veut pouvoir enrichir la page infos pratiques
(`/le-logement`) avec des **vidéos YouTube** (lien collé, pas de fichier hébergé) et rendre visible
une photo de présentation déjà saisie au backoffice mais jamais affichée au front.

Scope volontairement resserré après cadrage :

- **Inclus :** section Présentation, section Parking, blocs personnalisés — sur `/le-logement`.
- **Exclus explicitement :** les recommandations (`/nos-recommandations`) — aucun média ajouté.
- **Exclus :** la fiche vitrine publique `/guide/[ville]/logements/[slug]`.
- **Source vidéo :** YouTube uniquement (pas de Vimeo, pas d'upload de fichier).

## Décisions de cadrage (issues du brainstorming)

| Question | Décision |
|---|---|
| Sections fixes concernées | **Présentation + Parking uniquement** (pas Wifi/Départ/Poubelles/etc.) |
| Média sur les recommandations | **Non** — abandonné |
| Sources vidéo | **YouTube uniquement** |
| Rendu de l'embed | **Façade click-to-load** (option A) |

## Modèle de données

Quatre champs `String?` nullable. Tous optionnels → aucune donnée existante impactée, pas de
backfill nécessaire.

| Modèle | Champ ajouté | Rôle |
|---|---|---|
| `LodgingCustomization` | `presentation_video_url` | URL YouTube de présentation du logement |
| `LodgingCustomization` | `parking_photo_url` | URL photo du parking (upload Supabase) |
| `LodgingCustomization` | `parking_video_url` | URL YouTube du parking |
| `LodgingPracticalBlock` | `video_url` | URL YouTube d'un bloc personnalisé |

`LodgingCustomization.cover_photo_url` existe déjà et sert de **photo de présentation** : on ne fait
que l'afficher au front (elle est actuellement saisie au backoffice mais absente de `/le-logement`).

Les URL YouTube sont stockées **brutes** (telles que collées). L'extraction d'ID et la construction
de l'URL d'embed se font au moment du rendu, jamais à la persistance.

### Migration

Une migration Prisma additive (`ALTER TABLE ... ADD COLUMN`). Contrainte d'environnement connue :
la base Supabase peut être en pause et le sandbox ne peut pas appliquer de DDL en prod. Livrable :
le fichier de migration + la commande `prisma migrate` à exécuter manuellement par l'utilisateur
après réactivation du projet Supabase.

## Brique YouTube partagée

### `lib/youtube.ts`

- `extractYouTubeId(url: string): string | null`
  Gère les formes : `youtube.com/watch?v=ID`, `youtu.be/ID`, `youtube.com/shorts/ID`,
  `youtube.com/embed/ID`, avec ou sans paramètres additionnels (`&t=`, `?si=`, etc.).
  Retourne `null` pour toute URL non-YouTube ou malformée.
- `youTubeEmbedUrl(id: string): string`
  Retourne `https://www.youtube-nocookie.com/embed/<id>` (domaine sans cookie, confidentialité).
- `youTubeThumbnailUrl(id: string): string`
  Retourne `https://i.ytimg.com/vi/<id>/hqdefault.jpg` pour la façade.
- Helper de validation Zod réutilisable : union `URL YouTube valide | chaîne vide → null | null`,
  refine via `extractYouTubeId`.

### Composant `<YouTubeEmbed videoId title>` — façade click-to-load (option A)

- Rendu initial : miniature (`youTubeThumbnailUrl`) + bouton play, ratio 16:9, aucun JS/cookie
  YouTube chargé.
- Au clic : remplace la façade par l'iframe `youTubeEmbedUrl` en `autoplay=1`.
- Composant client (`'use client'`) minimal ; accessible (bouton avec label).

## Backoffice — édition owner

Écran `/dashboard/lodgings/[id]/customize`.

### `CustomizationForm`

- **Présentation :** l'upload de `cover_photo_url` existe déjà → ajouter un champ texte
  « Vidéo de présentation (lien YouTube) » avec validation inline (message d'erreur si l'URL n'est
  pas reconnue comme YouTube) et aperçu miniature quand l'ID est extractible.
- **Parking :** ajouter (a) un upload photo réutilisant l'endpoint d'upload existant
  (`/api/dashboard/lodgings/[id]/cover-photo` — même flux que les blocs perso) pour
  `parking_photo_url`, et (b) un champ vidéo YouTube pour `parking_video_url`.

### `PracticalBlocksEditor`

- Ajouter un champ « Vidéo (lien YouTube) » sous l'upload photo existant de chaque bloc, alimentant
  `video_url`. Même validation inline.

## Rendu front — `/le-logement`

- **Nouvelle section « Présentation »** en tête de page : affiche `cover_photo_url` (image) et/ou la
  vidéo `presentation_video_url` (`<YouTubeEmbed>`). Si aucun des deux n'est renseigné, la section
  ne s'affiche pas (dégradation propre — cohérent avec le comportement actuel des sections vides).
- **Parking :** quand `parking_photo_url` ou `parking_video_url` est présent, la carte Parking passe
  en pleine largeur (comportement type `PracticalBlockCard`) pour afficher la photo puis la vidéo.
  Sans média, elle conserve son rendu actuel.
- **Blocs personnalisés (`PracticalBlockCard`) :** la vidéo `video_url` s'affiche via `<YouTubeEmbed>`
  sous la photo existante.

## Validation / API / types

- `customizationSchema` (route `POST /api/dashboard/lodgings/[id]/customization`) : ajouter
  `presentation_video_url` et `parking_video_url` (helper YouTube), `parking_photo_url` (union URL
  comme `cover_photo_url`).
- `practicalBlockSchema` : ajouter `video_url` (helper YouTube).
- `types.ts` : étendre `PracticalInfoFields` (+ la liste des clés), `PracticalBlockInput`,
  `PracticalBlockResponse`, `LodgingCustomizationResponse`.
- `normalizePracticalBlocks` (validation.ts) : propager `video_url` (nulle si vide).
- `queries/customization.ts` : ajouter les nouveaux champs au `select` et à la persistance.

## Découpage en unités

| Unité | Responsabilité | Dépend de |
|---|---|---|
| `lib/youtube.ts` | Parse URL → ID, construit embed/thumbnail, helper Zod | — |
| `<YouTubeEmbed>` | Rendu façade → iframe | `lib/youtube.ts` |
| Migration + schema | Champs de stockage | — |
| API + validation + types | Accepter/normaliser/persister les nouveaux champs | `lib/youtube.ts`, schema |
| Backoffice (formulaires) | Saisie owner (photo + vidéo) | API, `<YouTubeEmbed>` (aperçu) |
| Front `/le-logement` | Affichage invité | `<YouTubeEmbed>`, query |

## Stratégie de test (TDD)

- **Unitaires :** `extractYouTubeId` sur toutes les formes d'URL (watch, youtu.be, shorts, embed,
  avec params, cas invalides) ; `youTubeEmbedUrl` / `youTubeThumbnailUrl` ; helper de validation
  Zod (accepte/rejette) ; `normalizePracticalBlocks` propage `video_url`.
- **Composant :** `<YouTubeEmbed>` rend la façade puis révèle l'iframe au clic ;
  `PracticalBlockCard` affiche la vidéo quand `video_url` est présent.
- **Intégration :** round-trip de l'API customization (POST puis relecture) sur les quatre nouveaux
  champs, y compris le rejet d'une URL non-YouTube.

## Hors scope

- Recommandations (`/nos-recommandations`) — aucun média.
- Fiche vitrine publique.
- Vimeo / autres plateformes.
- Upload/hébergement de fichiers vidéo.
- Médias sur les autres sections fixes (Wifi, Départ, Poubelles, Équipements, Règlement, Services,
  Urgences).
