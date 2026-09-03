# Spec — 045 Public Demo From Private Guide Reference

## Metadata

```yaml
id: 045-public-demo-private-guide-reference
title: "Démo publique fidèle au guide privé complet"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-09-01
updated_at: 2026-09-01
depends_on:
  - 031-public-marketing-site
  - 034-private-guide-app
  - 035-private-guide-favorites
  - 036-private-guide-lodging-home
  - 037-private-guide-arrival
  - 038-private-guide-practical-info
  - 039-private-guide-departure-frame
  - 040-private-guide-contained-maps
  - 044-private-guide-lodging-video
bounded_context: guide-demo
implementation_gate: "Design intégral validé par le Product Owner le 2026-09-01"
supersedes:
  - "031 US-05 pour la présentation interne de la démo ; le modal et ses déclencheurs restent inchangés"
```

## Context

La démo publique actuelle présente une interprétation du Guide qui diffère du
guide privé réellement utilisé par les voyageurs, particulièrement dans la
partie consacrée au logement. Cette divergence fausse la démonstration du
produit et crée deux langages visuels concurrents.

Le Product Owner décide que le guide privé complet devient une référence
visuelle et fonctionnelle en lecture seule. La démo publique doit reproduire
son parcours et son contenu fonctionnel avec des données fictives, tout en
restant une mini-application autonome dans le modal marketing existant.

Ce chantier ne modifie strictement aucun design, composant, comportement,
contrôle d'accès ni route du guide privé.

## Glossary References

- **Guide**
- **Lodging**
- **Owner**
- **POI**
- **Tourist**
- **Trail Navigation**

## User Stories

### US-01 — Découvrir fidèlement le guide privé

**As a** visiteur public

**I want to** parcourir une démonstration fidèle au guide privé complet

**So that** je comprenne précisément l'expérience proposée aux voyageurs

#### Acceptance Criteria

- **AC-01-01**: Given le modal de démonstration ouvert, When sa home est
  rendue, Then elle reproduit la hiérarchie, les accès et la navigation de la
  home privée, avec un logement et des contenus explicitement fictifs.
- **AC-01-02**: Given la démo, When le visiteur ouvre le guide logement, Then il
  retrouve le design privé complet avec hero, faits du séjour, accès, vidéo,
  Wi-Fi, équipements, règlement, informations pratiques, urgences, recyclage
  et départ, dans le même ordre fonctionnel que la référence privée.
- **AC-01-03**: Given la démo, When le visiteur navigue, Then les coups de cœur,
  la carte, les fiches POI, la randonnée, les logements, le blog et le contact
  possèdent chacun une vue de démonstration cohérente avec leur référence
  privée.
- **AC-01-04**: Given une vue de détail ou une sous-section, When le visiteur
  utilise un retour, le menu ou la navigation basse, Then il revient à la vue
  attendue sans quitter le modal ni perdre l'état de la démo.
- **AC-01-05**: Given le modal à 320 px, 375 px ou sur desktop, When il est
  utilisé, Then le contenu reste lisible, scrollable verticalement et sans
  débordement horizontal.

### US-02 — Garantir une démonstration publique autonome

**As a** responsable produit

**I want to** isoler totalement la démo des données et routes privées

**So that** aucun séjour réel ne soit accessible depuis le site marketing

#### Acceptance Criteria

- **AC-02-01**: Given toute interaction de la démo, When elle est exécutée,
  Then l'URL du navigateur ne change pas et aucune route `/sejour`,
  `/le-logement`, `/nos-recommandations`, `/map`, `/mes-favoris`, `/guide` ou
  `/api/internal/guide` n'est demandée.
- **AC-02-02**: Given le bundle client de la démo, When ses imports sont
  inspectés, Then il n'importe ni Prisma, ni query privée, ni lecteur de cookie,
  ni identifiant réel de Lodging, Tourist ou POI.
- **AC-02-03**: Given les contenus fictifs, When ils sont inspectés, Then ils ne
  contiennent aucune adresse privée exacte, aucun code, mot de passe réel,
  numéro privé, document, plaque, serrure, digicode ou média d'accès sensible.
- **AC-02-04**: Given une action susceptible de produire un effet externe,
  When elle est activée dans la démo, Then elle est simulée, désactivée ou
  limitée à une ressource publique explicitement autorisée.
- **AC-02-05**: Given le modal fermé puis rouvert, When la démo est remontée,
  Then elle repart de sa home sans persister d'état dans un cookie, le stockage
  navigateur ou une base de données.

### US-03 — Préserver intégralement le guide privé

**As a** Tourist disposant d'un séjour actif

**I want to** conserver exactement mon guide existant

**So that** la création de la démo ne provoque aucune régression privée

#### Acceptance Criteria

- **AC-03-01**: Given le diff du chantier depuis son commit de base, When il est
  inspecté, Then aucun fichier sous `src/features/guide-app/`,
  `src/app/(public)/sejour/`, `src/app/(public)/le-logement/`,
  `src/app/(public)/nos-recommandations/`, `src/app/(public)/map/` ou
  `src/app/(public)/mes-favoris/` n'est modifié, créé, déplacé ou supprimé.
- **AC-03-02**: Given les routes privées et QR existantes, When leurs tests de
  régression sont exécutés, Then leurs destinations, leur contrôle d'accès et
  leurs metadata restent identiques à la baseline.
- **AC-03-03**: Given les composants privés de navigation et le proxy, When le
  diff est inspecté, Then `PublicMenu`, `PublicBottomNav` et `src/proxy.ts`
  restent inchangés.
- **AC-03-04**: Given un séjour privé actif, When ses écrans sont rendus, Then
  aucune donnée, mention ou dépendance de démonstration n'est chargée.

### US-04 — Retirer les artefacts publics obsolètes

**As a** mainteneur

**I want to** supprimer les composants de l'ancienne démo qui ne servent plus

**So that** le dépôt ne conserve pas plusieurs implémentations publiques

#### Acceptance Criteria

- **AC-04-01**: Given la nouvelle démo fonctionnelle, When les imports du dépôt
  sont audités, Then tout ancien composant ou jeu de données du bounded context
  `guide-demo` sans consommateur actif est supprimé.
- **AC-04-02**: Given un fichier candidat à la suppression, When au moins un
  import actif, test requis ou lien de traçabilité courant existe, Then il est
  conservé ou migré avant toute suppression.
- **AC-04-03**: Given le nettoyage, When le diff est inspecté, Then aucune route
  `/guide` ou `/decouvrir`, aucun composant marketing actif et aucun fichier du
  guide privé n'est supprimé.

## Business Rules

- **BR-01**: Le guide privé est une référence en lecture seule. Le chantier ne
  peut pas le refactoriser, même pour partager un composant avec la démo.
- **BR-02**: Toute nouvelle présentation fonctionnelle vit sous
  `src/features/guide-demo/`. Les déclencheurs marketing existants peuvent
  uniquement être adaptés pour monter cette démo.
- **BR-03**: La démo reste un `Dialog` sans route publique dédiée et sans
  changement d'URL.
- **BR-04**: La navigation de démonstration est un état client local. Elle
  n'utilise ni `router.push`, ni `Link` vers une route privée, ni navigation
  directe par `window.location`.
- **BR-05**: Les données de démonstration sont des constantes TypeScript
  statiques, déterministes et révisables dans le dépôt.
- **BR-06**: Les POI de démonstration restent des POI publics réels autorisés,
  sans UUID Prisma. Toutes les données de séjour sont fictives.
- **BR-07**: Aucun appel réseau n'est nécessaire pour obtenir des données du
  guide. Mapbox et les médias publics autorisés restent les seules ressources
  externes de présentation admises.
- **BR-08**: La géolocalisation ne démarre jamais automatiquement. La
  démonstration ne persiste ni consentement ni position.
- **BR-09**: Les actions de randonnée exposent les informations publiques mais
  ne démarrent aucun suivi GPS ni route `/start` privée.
- **BR-10**: Le guide logement de démonstration présente toutes les sections de
  la référence privée, même lorsque leur valeur fictive doit être explicitement
  libellée comme démonstration.
- **BR-11**: Le modal conserve son accessibilité : focus contenu, fermeture par
  `Escape` et overlay, restauration du focus au déclencheur et verrouillage du
  scroll de la page marketing.
- **BR-12**: Le nettoyage repose sur une recherche d'imports avant suppression.
  Il est limité aux artefacts obsolètes du bounded context `guide-demo`.
- **BR-13**: `GuideDemoLauncher`, `GuideDemoPhoneButton` et le contrat du modal
  restent disponibles tant qu'ils sont consommés par les surfaces marketing.
- **BR-14**: Les deux échecs de baseline
  `blog.AC-02-01.article-detail.test.tsx` et
  `public-marketing.AC-03-03.lodgings-page.test.tsx` sont hors périmètre. Le
  chantier ne doit introduire aucun nouvel échec.

## Data Model

Aucune migration Prisma et aucune lecture de base de données.

Le modèle de démonstration est un contrat TypeScript statique propre au bounded
context `guide-demo`. Il couvre au minimum :

```typescript
type DemoGuideData = {
  lodging: DemoLodging
  favoritePois: readonly DemoPoi[]
  lodgingCards: readonly DemoLodgingCard[]
  blogPosts: readonly DemoBlogPost[]
  contact: DemoContact
}
```

Les identifiants sont des slugs préfixés `demo-` et ne respectent jamais le
format UUID. Aucun champ ne référence une ligne Prisma.

## API Contract

Aucune route API n'est ajoutée ou modifiée.

Le bundle de démonstration ne doit appeler aucune route `/api/*` pour charger
son contenu. Les données sont importées localement. Une erreur de média utilise
un fallback local ; elle ne déclenche pas de récupération privée.

## UI Behaviour

### Déclencheurs et modal

- Les boutons marketing existants continuent d'ouvrir le modal smartphone.
- Le modal conserve son overlay, son focus, ses dimensions maximales et ses
  mécanismes de fermeture existants.
- La fermeture puis la réouverture réinitialise la démo sur l'accueil.

### Navigation interne

- Une navigation basse reproduit les destinations du guide privé.
- Le menu de démonstration donne accès aux surfaces complémentaires du guide
  complet sans créer de lien vers le site privé.
- Chaque retour restaure la vue parente attendue.
- Les fiches et sous-pages partagent un conteneur vertical scrollable.

### Guide logement complet

- Hero du logement fictif et localisation générique.
- Faits de séjour et horaires d'arrivée/départ.
- Accès au logement et média de présentation non sensible.
- Wi-Fi explicitement fictif.
- Équipements, règlement, informations pratiques et contacts publics.
- Urgences françaises publiques.
- Recyclage et point de tri générique.
- Checklist et préparation du départ.
- Même hiérarchie, même ordre et mêmes états interactifs que la référence
  privée, sans importer ses composants.

### Autres vues

- Coups de cœur : données publiques statiques, filtres et détails internes.
- Carte : marqueurs statiques, aucune géolocalisation automatique.
- Randonnée : métriques publiques et action de démarrage désactivée.
- Logements et blog : cartes et détails fictifs chargés localement.
- Contact : contenu fictif ou public, aucune soumission persistée.

### Erreurs et fallbacks

- Média absent ou invalide : fallback local approuvé.
- Collection vide : état vide utile sans sortie du modal.
- Carte indisponible : état informatif avec retour fonctionnel.
- Action interdite en démo : contrôle désactivé avec libellé explicite.

## Acceptance Criteria

| Criterion | Test type |
|---|---|
| AC-01-01 | integration + e2e |
| AC-01-02 | integration + visual regression |
| AC-01-03 | integration + e2e |
| AC-01-04 | integration + e2e |
| AC-01-05 | e2e responsive |
| AC-02-01 | unit + integration + e2e |
| AC-02-02 | security regression |
| AC-02-03 | security regression |
| AC-02-04 | integration |
| AC-02-05 | integration |
| AC-03-01 | diff inspection |
| AC-03-02 | regression + e2e |
| AC-03-03 | diff inspection |
| AC-03-04 | regression |
| AC-04-01 | unit + import audit |
| AC-04-02 | import audit |
| AC-04-03 | diff inspection |

## Out of Scope

- Toute modification du design, du contenu, des composants, des queries, des
  routes ou du contrôle d'accès du guide privé.
- Modification de `src/proxy.ts`, `PublicMenu` ou `PublicBottomNav`.
- Suppression ou redirection de `/sejour/*`, `/le-logement`,
  `/nos-recommandations`, `/map`, `/mes-favoris` ou `/guide/*`.
- Création d'une route publique dédiée à la démo.
- Partage de composants par refactor du guide privé.
- Données Prisma, API de démonstration, CMS ou dashboard de configuration.
- Persistance des interactions de la démo.
- Réparation des deux tests éditoriaux déjà rouges dans la baseline.
- Refonte des pages marketing, `/decouvrir`, `/logements` ou du blog.

## Open Questions

Aucune question ouverte. Décisions du Product Owner du 2026-09-01 :

- tout le guide privé sert de modèle de design et de contenu fonctionnel ;
- aucun fichier, design ou route privé ne peut être modifié ;
- la démo est autonome, fictive et reste dans le modal public ;
- le nettoyage supprime uniquement les artefacts de démo devenus orphelins ;
- les deux tests éditoriaux rouges avant le chantier restent une baseline connue.
