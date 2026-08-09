# Spec — 034 Private Guide App

## Metadata

```yaml
id: 034-private-guide-app
title: "Application privée de séjour MyStay"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-08-01
updated_at: 2026-08-01
depends_on:
  - 001-city-guide
  - 004-poi-detail
  - 005-map
  - 006-qr-code
  - 012-guide-customization
  - 021-trail-navigation
  - 031-public-marketing-site
  - 033-guide-featured-bento
bounded_context: private-guide
implementation_gate: "Demande explicite du Product Owner du 2026-08-01"
```

## Context

Le guide privé historique est réparti entre `/nos-recommandations`,
`/le-logement`, `/map`, `/mes-favoris` et les routes POI. La démonstration
publique dispose désormais d'un `GuideApp` mobile cohérent. Le guide privé doit
adopter ce langage visuel et cette navigation sans dupliquer l'interface, sans
affaiblir le contrôle d'accès par séjour et sans perdre les données réelles.

La hiérarchie canonique cible est `/sejour`, avec les enfants
`/sejour/coups-de-coeur`, `/sejour/logement/*`, `/sejour/carte` et
`/sejour/favoris`. Le premier incrément couvert par cette implémentation crée
uniquement la home `/sejour` ; les enfants continuent temporairement à utiliser
les routes privées historiques existantes.

## Glossary References

- **Guide**
- **Lodging**
- **Owner**
- **Owner Recommendation Comment**
- **POI**
- **QR Code**
- **Tourist**
- **Trail Navigation**

## User Stories

### US-01 — Ouvrir la home privée du séjour

**As a** Tourist disposant d'un séjour actif  
**I want to** ouvrir une home `/sejour` qui reprend l'interface MyStay de démonstration  
**So that** j'accède clairement au guide logement, aux recommandations locales et à la carte

#### Acceptance Criteria

- **AC-01-01**: Given un cookie `lodging_id` valide, When `/sejour` s'affiche,
  Then la page rend le `GuideApp` partagé en `mode="private"` avec le nom et la
  ville du Lodging actif.
- **AC-01-02**: Given aucun séjour valide, When `/sejour` est demandé, Then le
  contrôle d'accès privé existant affiche l'écran d'accès réservé sans charger
  de données de logement.
- **AC-01-03**: Given la home privée, When elle s'affiche à 375 px, Then elle
  conserve le header MyStay, le titre de bienvenue, trois accès rapides et la
  navigation basse sans débordement horizontal. En production, le bouton menu
  est absent ; hors production, il reste disponible pour les vérifications.
- **AC-01-04**: Given la home privée, When le Tourist active « Explorer », Then
  il atteint temporairement `/nos-recommandations`. When il active « Découvrir
  le livret d'accueil », Then il atteint temporairement `/le-logement`.
- **AC-01-05**: Given la home privée, When les POI réels sont chargés, Then le
  compteur d'adresses correspond aux recommandations actives du Lodging et
  aucune donnée de démonstration n'est rendue.
- **AC-01-06**: Given les informations partielles d'un Lodging, When `/sejour`
  s'affiche, Then des valeurs de présentation non sensibles et explicites sont
  utilisées uniquement pour les champs visuels manquants ; aucun secret, mot de
  passe ou code d'accès n'est inventé.

### US-02 — Conserver l'entrée QR et les anciennes URLs

**As a** Tourist utilisant un QR code déjà imprimé  
**I want to** arriver sur la nouvelle home sans perdre mon accès  
**So that** la migration soit transparente

#### Acceptance Criteria

- **AC-02-01**: Given `/guide/{city}?lodging={uuid}` avec un Lodging valide,
  When le lien est ouvert, Then le cookie séjour est posé et la redirection
  cible `/sejour?lodging={uuid}`.
- **AC-02-02**: Given un ancien lien `/nos-recommandations`, When il est ouvert
  avec un séjour actif pendant ce premier incrément, Then la liste historique
  des recommandations reste accessible. Sa redirection vers `/sejour` ne sera
  activée qu'après la livraison de `/sejour/coups-de-coeur`.
- **AC-02-03**: Given les anciennes routes `/le-logement`, `/map` et
  `/mes-favoris`, When ce premier incrément est livré, Then elles restent
  fonctionnelles et protégées jusqu'à la livraison de leurs remplacements.

## Business Rules

- **BR-01**: `/sejour` est une route privée soumise au même cookie
  `lodging_id` et au même écran d'accès réservé que les surfaces historiques.
- **BR-02**: Le QR code reste l'autorité d'activation du séjour. Le paramètre
  `lodging` transporte uniquement l'UUID vers l'enregistrement analytics et le
  cookie existant.
- **BR-03**: La home privée réutilise `GuideApp`, `GuideHeader`, `GuideHome`,
  `GuideNavigation` et `GuideMenuOverlay`. Une seconde interface visuelle ne
  doit pas être créée.
- **BR-04**: Un adaptateur serveur transforme les données Prisma réelles en
  `GuideLodging` et `GuidePoi`. Le composant client ne réalise aucune query
  Prisma et ne lit aucun cookie.
- **BR-05**: Les POI de la home sont les `LodgingFeaturedPoi` actifs, non
  supprimés et triés par `sort_order`, puis `created_at`. Les POI inactifs ou
  supprimés sont absents.
- **BR-06**: La première image exploitable de la galerie réelle est prioritaire ;
  le fallback de catégorie existant est utilisé si la galerie est vide.
- **BR-07**: Les heures d'arrivée et de départ restent `16:00` et `10:00` dans
  ce premier incrément, car le modèle privé historique ne possède pas encore de
  champs configurables dédiés. Elles sont des libellés de présentation, jamais
  des règles de réservation.
- **BR-08**: L'activation GPS reste volontaire et côté navigateur. La home ne
  déclenche jamais `navigator.geolocation` au chargement.
- **BR-09**: Les nouvelles pages enfants ne sont pas implémentées dans ce
  premier incrément. Les CTA et onglets utilisent les routes privées historiques
  correspondantes jusqu'à leur remplacement.
- **BR-10**: Les routes POI et randonnée `/guide/{city}/{category}/{poi}` et
  `/guide/{city}/{category}/{poi}/start` restent inchangées.
- **BR-11**: Le proxy QR redirige immédiatement vers `/sejour`, mais
  `/nos-recommandations` reste temporairement une page privée fonctionnelle pour
  servir de destination aux coups de cœur. Son alias de compatibilité vers
  `/sejour` appartient à l'incrément `/sejour/coups-de-coeur`.
- **BR-12**: La largeur privée historique reste limitée à 430 px hors modal de
  démonstration. Aucun `zoom` ni `transform: scale()` n'est autorisé.
- **BR-13**: Dans le `GuideApp` partagé par le guide privé et le guide démo, le
  bouton burger et `GuideMenuOverlay` ne sont pas rendus lorsque
  `NODE_ENV === 'production'`. Ils restent disponibles hors production. Les
  autres menus publics ne sont pas concernés.

## Data Model

Aucune migration Prisma n'est requise. Les modèles existants sont lus sans
modification :

```prisma
model Lodging {
  id        String
  name      String
  city      City
  owner     Owner
  is_active Boolean
  deleted_at DateTime?
}

model LodgingCustomization {
  lodging_id          String
  cover_photo_url     String?
  welcome_message     String?
  lodging_address     String?
  lodging_latitude    Float?
  lodging_longitude   Float?
}

model LodgingFeaturedPoi {
  lodging_id String
  poi_id     String
  owner_note String?
  sort_order Int
  deleted_at DateTime?
}
```

## API Contract

Aucune nouvelle route API n'est créée. `/sejour` est un Server Component qui
lit les données via Prisma après résolution du contexte privé. Les contrats API
des specs 001, 004, 005, 012 et 021 restent inchangés.

## UI Behaviour

### Page `/sejour`

- Surface mobile privée `max-w-[430px]`, hauteur dynamique et fond blanc.
- Header partagé : logo MyStay approuvé ; le bouton menu est rendu uniquement
  hors production.
- Titre : `Bienvenue au {nom du logement sans article initial}`.
- CTA 1 : `Explorer {ville courte}` avec le nombre de recommandations réelles ;
  destination temporaire `/nos-recommandations` vers la vue historique.
- CTA 2 : `Découvrir le livret d'accueil` vers `/le-logement`.
- Carte GPS : consentement explicite, aucun démarrage automatique.
- Bottom navigation : `Accueil`, `Guide`, cœur, `Carte`. Dans ce premier
  incrément, les trois destinations non actives ouvrent respectivement
  `/le-logement`, `/nos-recommandations` et `/map`.
- Le menu reprend les entrées privées existantes et utilise de vrais liens en
  mode privé ; le mode démo conserve ses actions internes et inactives.

### États

- Chargement serveur : rendu Next.js habituel sans squelette client ajouté.
- Aucun POI recommandé : compteur `0 adresse sélectionnée`, home toujours
  utilisable.
- Données logement absentes ou inactives : écran d'accès réservé existant.
- Erreur Prisma transitoire lors de la résolution du contexte : repli existant
  sans exposition d'erreur interne au Tourist.

## Acceptance Criteria

| Criterion | Test type |
|---|---|
| AC-01-01 | integration |
| AC-01-02 | unit + integration |
| AC-01-03 | integration + e2e |
| AC-01-04 | integration |
| AC-01-05 | unit + integration |
| AC-01-06 | unit |
| AC-02-01 | unit + e2e |
| AC-02-02 | unit + integration |
| AC-02-03 | regression |

## Out of Scope

- Implémentation des pages enfants `/sejour/coups-de-coeur`,
  `/sejour/logement/*`, `/sejour/carte` et `/sejour/favoris`.
- Refonte des fiches POI privées.
- Modification du suivi randonnée ou de ses seuils GPS.
- Nouvelle donnée Prisma, nouvelle API ou nouvelle authentification.
- Suppression physique immédiate des anciennes routes.

## Open Questions

Aucune question ouverte pour le premier incrément `/sejour`.
