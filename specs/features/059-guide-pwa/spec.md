# Spec — 059 Guide PWA

## Metadata

```yaml
id: 059-guide-pwa
title: "Installer le guide de séjour comme application (PWA), hors-ligne, 7 jours"
status: review
mvp: 2
owner: "Product Owner"
created_at: 2026-10-04
updated_at: 2026-10-04
depends_on:
  - 054-private-guide-stay-redesign
  - 045-public-demo-private-guide-reference
bounded_context: guide-app
implementation_gate: "Décisions du PO du 2026-10-04 : solution robuste (manifest propre au séjour), pages logement disponibles hors-ligne, installation désactivée 7 jours après l'installation. Amende 054 / 045 AC-01-08 (le modal « Installer le guide » cesse d'être purement informatif hors démo)."
```

## Context

La carte « Installer le guide » de l'écran Réglages et infos (054 AC-01-08)
ouvre un modal informatif annonçant « l'installation est à venir, avec une
désactivation prévue après 7 jours ». Le manifest racine (`src/app/manifest.ts`)
ouvre l'app installée sur `/` (accueil marketing) : un voyageur qui installe le
guide ne retrouve pas son séjour, et l'accès au guide repose sur un cookie
`httpOnly` qui n'est pas garanti dans une app installée (stockage séparé sur iOS).

Le PO veut que le guide s'installe sur l'écran d'accueil, rouvre toujours le
séjour du voyageur, reste lisible sans réseau pour les pages du logement, et se
désactive 7 jours après l'installation.

## Glossary References

- **Lodging** (logement), **Guest** / voyageur, **Guide privé** (`/sejour`, spec 054).
- **Cookie logement** : cookie `httpOnly` portant l'identifiant du logement
  (`LODGING_COOKIE_NAME`, durée 7 jours).
- **Guide installé** : le guide ouvert en mode `display-mode: standalone`.

## User Stories

### US-01 — Installer le guide de mon séjour

En tant que voyageur, je veux installer le guide sur mon écran d'accueil pour le
rouvrir directement sur mon séjour.

- **AC-01-01**: Given un séjour actif sur `/sejour/*`, When la page est servie,
  Then elle déclare un manifest propre au logement dont `id` et `start_url`
  valent `/sejour?lodging=<lodgingId>&source=pwa`, `scope` `/`, `display`
  `standalone`, nom « <SITE.name> — <nom du logement> », nom court SITE.name,
  icônes et couleurs du manifest racine. Hors `/sejour/*`, le manifest racine
  est inchangé.
- **AC-01-02**: Given une requête `/sejour?lodging=<uuid valide>`, When le proxy
  la traite, Then il pose le cookie logement et redirige vers `/sejour` sans le
  paramètre `lodging` (le paramètre `source` est conservé). Un `lodging`
  invalide est ignoré (comportement actuel : écran d'accès).
- **AC-01-03**: Given Android / Chrome (événement `beforeinstallprompt` reçu),
  When le voyageur touche « Installer le guide », Then l'invite native
  d'installation s'ouvre directement.
- **AC-01-04**: Given iOS Safari (pas d'invite native), When il touche la
  carte, Then le modal explique les étapes : « Partager », puis « Sur l'écran
  d'accueil », puis « Ajouter ».
- **AC-01-05**: Given un navigateur sans installation possible (navigateur
  intégré d'une app, ex. lecteur QR / Instagram), When il touche la carte, Then
  le modal l'invite à ouvrir le guide dans Safari (iOS) ou Chrome (Android).
- **AC-01-06**: Given le guide déjà ouvert en mode installé, When l'écran
  Réglages s'affiche, Then la carte n'est plus un bouton : elle indique
  « Guide installé » et « Disponible jusqu'au <date de fin> ».

### US-02 — Consulter mon logement sans réseau

- **AC-02-01**: Given le guide installé, ouvert une première fois en ligne,
  When le voyageur l'ouvre sans réseau, Then `/sejour`, `/sejour/logement`,
  `/sejour/logement/arrivee`, `/sejour/logement/consignes`,
  `/sejour/logement/informations-pratiques` et `/sejour/logement/depart`
  s'affichent depuis le cache avec leurs styles et scripts.
- **AC-02-02**: Given le réseau disponible, When une page du guide est
  demandée, Then la version réseau est servie (réseau d'abord) et remplace la
  version en cache.
- **AC-02-03**: Given une page hors liste AC-02-01 (carte, POI, coups de cœur,
  navettes…) demandée sans réseau, When elle n'est pas en cache, Then une page
  hors-ligne « Vous êtes hors-ligne. Les informations de votre logement restent
  disponibles. » propose un lien vers `/sejour/logement`.

### US-03 — Désactivation après 7 jours

- **AC-03-01**: Given la première ouverture en mode installé pour un logement,
  When elle a lieu, Then la date de début est enregistrée sur l'appareil pour
  ce logement ; la date de fin = début + 7 jours.
- **AC-03-02**: Given le guide installé ouvert après la date de fin, When il
  s'affiche, Then aucun contenu du séjour n'est visible : l'écran « Votre séjour
  est terminé. Pour un nouveau séjour, scannez le QR code du logement. »
  s'affiche et le cache hors-ligne du guide est vidé.
- **AC-03-03**: Given le guide installé, When la vérification de validité n'est
  pas terminée, Then le contenu du séjour n'est pas affiché (pas de flash).
- **AC-03-04**: Given un logement dont l'installation est expirée sur
  l'appareil, When le voyageur entre à nouveau par le QR code dans le
  navigateur (`?lodging=`), Then la date de début de ce logement est effacée :
  la prochaine ouverture en mode installé démarre une nouvelle période de 7 jours.

## Business Rules

- **BR-01**: Un manifest par logement ; l'identifiant du logement dans
  `start_url` est le même porteur d'accès que le QR code existant (pas de
  nouvelle surface d'accès).
- **BR-02**: Le service worker ne met en cache que : les 6 pages de AC-02-01,
  la page hors-ligne, `/_next/static/*`, les icônes et polices du site. Jamais
  `/api/*`, `/dashboard*`, `/merchant*`, `/admin*`, `/auth*`, ni les tuiles
  Mapbox.
- **BR-03**: Le cache du guide ne contient qu'un seul séjour : changer de
  logement (cookie logement différent) vide le cache avant d'en remplir un nouveau.
- **BR-04**: L'expiration 7 jours s'applique au guide installé uniquement ; le
  guide dans le navigateur garde le comportement actuel (cookie 7 jours, QR).
  L'expiration est une règle produit côté appareil, pas une barrière de
  sécurité (le QR reste valide).
- **BR-05**: Aucune donnée personnelle nouvelle : rien n'est envoyé au serveur
  (dates d'installation stockées sur l'appareil uniquement).
- **BR-06**: Démo (spec 045) : le comportement actuel est conservé (modal
  informatif, aucune installation, aucun service worker).

## Data Model

Aucun changement de schéma Prisma.

Stockage appareil (`localStorage`, clé `mystay:pwa:<lodgingId>`) :
`{ startedAt: ISO8601 }`. Cache Storage : `mystay-guide-v1` (pages),
`mystay-static-v1` (assets).

## API Contract

```yaml
/sejour/manifest.webmanifest:
  get:
    parameters:
      - { name: lodging, in: query, required: true, schema: { type: string, format: uuid } }
    responses:
      '200':
        content:
          application/manifest+json:
            schema: { $ref: 'MetadataRoute.Manifest' }   # cf. AC-01-01
      '400':
        content:
          application/json:
            schema: { error: { code: INVALID_LODGING, message: string, details: {} } }
      '404':
        content:
          application/json:
            schema: { error: { code: LODGING_NOT_FOUND, message: string, details: {} } }
```

`/sw.js` : fichier statique (`public/sw.js`), en-tête `Cache-Control: no-cache`,
`Service-Worker-Allowed: /`.

## UI Behaviour

Carte « Installer le guide » (054, design inchangé : icône Download, trait 1,
palette ardoise) :

- **Invite native disponible** : le toucher ouvre l'invite native ; après
  installation acceptée, la carte passe à l'état « installé ».
- **iOS Safari** : modal « Installer le guide », 3 étapes numérotées avec les
  icônes Lucide `Share`, `SquarePlus`, `Check` ; texte final « Le guide reste
  disponible 7 jours, même sans réseau. » ; bouton « J'ai compris ».
- **Navigateur intégré / non compatible** : modal « Ouvrez le guide dans
  Safari (iPhone) ou Chrome (Android) pour l'installer. »
- **Déjà installé** : carte non cliquable, titre « Guide installé », sous-titre
  « Disponible jusqu'au 11 octobre » (format `d MMMM`, fr).
- Modal : accessibilité de 054 conservée (Escape, voile, focus restauré).

Écran « Séjour terminé » : plein écran, logo MyStay, texte AC-03-02, aucun
autre contenu ni navigation.

Page hors-ligne : texte AC-02-03, bouton « Voir mon logement ».

## Acceptance Criteria

| Criterion | Test type |
|---|---|
| AC-01-01 | contract + unit |
| AC-01-02 | unit (proxy) |
| AC-01-03, AC-01-04, AC-01-05, AC-01-06 | integration (composant) |
| AC-02-01, AC-02-02, AC-02-03 | unit (stratégie de cache du SW) + e2e |
| AC-03-01, AC-03-02, AC-03-03, AC-03-04 | unit (règle d'expiration) + integration |

## Out of Scope

- Notifications push, synchronisation en arrière-plan, badge.
- Hors-ligne de la carte, des POI, coups de cœur, agenda, navettes.
- Plusieurs séjours hors-ligne simultanés sur un même appareil.
- Installation depuis la démo (BR-06) et depuis les pages marketing.
- Expiration côté serveur ou liée à des dates de séjour réelles.

## Open Questions

Aucune.
