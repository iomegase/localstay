# Spec — 046 Local SEO City Cluster

## Metadata

```yaml
id: 046-local-seo-city-cluster
title: "Pages locales conciergerie, séminaires et locations de vacances"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-09-07
updated_at: 2026-09-08
depends_on:
  - 028-lodging-showcase-seo
  - 031-public-marketing-site
  - 042-seo-public-private-architecture
  - 043-seo-content-quality
bounded_context: marketing-seo
implementation_gate: "Architecture et déploiement progressif validés explicitement par le Product Owner le 2026-09-07"
```

---

## Context

MyStay doit être trouvé par trois publics dont les intentions de recherche sont
distinctes : les propriétaires cherchant une conciergerie locale, les entreprises
cherchant un séminaire dans une commune précise et les voyageurs cherchant une
location de vacances, éventuellement publiée sur Airbnb.

La homepage et les hubs `/seminaires` et `/logements` ne suffisent pas à répondre
précisément aux requêtes locales. Cette feature crée un cluster de pages canoniques
par commune, tout en empêchant la publication de pages vides, dupliquées ou
présentant un service qui n'est pas encore réellement proposé.

Le déploiement est progressif : MyStay est actuellement présent à
Saint-Gervais-les-Bains et Saint-Nicolas-de-Véroce. Megève et Combloux sont
préparées dans le catalogue de destinations, mais leurs pages de conciergerie et de
séminaires restent non publiées jusqu'à une validation métier ultérieure. Une page
de locations de vacances n'est indexable que lorsqu'elle contient au moins un
Lodging Public Profile publié et éligible.

---

## Glossary References

- **City**
- **Lodging**
- **Lodging Public Profile**
- **External Booking Link**
- **Owner**
- **Tourist**
- **GEO**

---

## User Stories

### US-01 — Trouver une conciergerie locale

**As a** Owner

**I want to** consulter une page dédiée à la conciergerie dans ma commune

**So that** je comprenne l'accompagnement MyStay et puisse confier mon logement

#### Acceptance Criteria

- **AC-01-01**: Given Saint-Gervais-les-Bains ou Saint-Nicolas-de-Véroce,
  When `/conciergerie/[city-slug]` est ouverte, Then la page répond 200 avec un
  contenu local unique, un CTA vers `/confier-mon-logement`, des metadata
  indexables et un canonical propre.
- **AC-01-02**: Given Megève, Combloux ou une destination inconnue, When la route
  conciergerie est demandée avant validation de présence MyStay, Then elle répond
  404 et n'apparaît pas dans le sitemap.
- **AC-01-03**: Given une page conciergerie publiée, When elle est rendue, Then
  elle décrit uniquement les services déjà proposés par MyStay, sans statistique,
  promesse de revenu, tarif ou couverture géographique inventés.

### US-02 — Trouver un séminaire local

**As a** organisateur d'entreprise

**I want to** consulter une page dédiée aux séminaires dans une commune précise

**So that** je puisse évaluer le cadre et contacter MyStay avec mon brief

#### Acceptance Criteria

- **AC-02-01**: Given Saint-Gervais-les-Bains ou Saint-Nicolas-de-Véroce,
  When `/seminaires/[city-slug]` est ouverte, Then la page répond 200 avec un
  contenu local unique, un CTA e-mail, des metadata indexables et un canonical
  propre.
- **AC-02-02**: Given Megève, Combloux ou une destination inconnue, When la route
  séminaires est demandée avant validation de présence MyStay, Then elle répond
  404 et n'apparaît pas dans le sitemap.
- **AC-02-03**: Given une page séminaires publiée, When elle est rendue, Then
  elle ne publie ni prix, ni disponibilité, ni capacité non issue des contenus
  MyStay déjà validés.

### US-03 — Trouver une location de vacances par commune

**As a** Tourist

**I want to** consulter les logements réellement publiés dans la destination

**So that** je puisse ouvrir leur fiche MyStay puis poursuivre vers la plateforme
de réservation configurée

#### Acceptance Criteria

- **AC-03-01**: Given une destination du catalogue contenant au moins un Lodging
  Public Profile publié, actif et non supprimé, When
  `/locations-vacances/[city-slug]` est ouverte, Then la page répond 200, affiche
  uniquement ces logements et possède des metadata `index, follow`.
- **AC-03-02**: Given une destination du catalogue sans logement publié, When sa
  page locations est ouverte, Then elle répond 200 avec un contenu local utile,
  aucun faux logement et des metadata `noindex, follow`.
- **AC-03-03**: Given une destination inconnue, When sa page locations est
  demandée, Then elle répond 404.
- **AC-03-04**: Given un logement doté d'un External Booking Link Airbnb HTTPS
  validé, When sa carte locale est rendue, Then un CTA `Voir sur Airbnb` ouvre
  cette URL dans un nouvel onglet avec `rel="noopener noreferrer"`.
- **AC-03-05**: Given un logement sans External Booking Link Airbnb validé, When
  sa carte locale est rendue, Then aucun CTA Airbnb n'est affiché et la fiche
  MyStay reste accessible.

### US-04 — Comprendre le cluster dans les moteurs de recherche

**As a** moteur de recherche ou système génératif

**I want to** recevoir des pages canoniques, reliées et factuelles

**So that** chaque intention locale soit comprise sans confusion avec les autres

#### Acceptance Criteria

- **AC-04-01**: Given une page locale indexable, When ses metadata sont générées,
  Then son title, sa description, son canonical et son Open Graph nomment
  explicitement l'intention et la commune.
- **AC-04-02**: Given une page locale publique, When elle est rendue, Then elle
  expose un `BreadcrumbList` et un schéma `Service` ou `ItemList` composé
  uniquement de faits visibles.
- **AC-04-03**: Given le sitemap, When il est généré, Then il contient les pages
  conciergerie et séminaires des deux communes actives et les pages locations des
  seules communes possédant des logements publiés.
- **AC-04-04**: Given les hubs `/logements`, `/seminaires` et
  `/confier-mon-logement`, When ils sont rendus, Then ils proposent des liens
  internes vers les pages locales publiées pertinentes.
- **AC-04-05**: Given les pages locales, When elles sont comparées, Then leur
  contenu principal reste spécifique à chaque commune et à chaque intention ; le
  même paragraphe SEO n'est pas dupliqué entre plusieurs routes.

### US-05 — Consulter les pages sur mobile

**As a** visiteur mobile

**I want to** lire et utiliser ces pages sans débordement

**So that** je puisse contacter MyStay ou choisir un logement depuis mon téléphone

#### Acceptance Criteria

- **AC-05-01**: Given un viewport de 375 px, When une page locale est rendue,
  Then elle utilise le `MarketingShell`, la police sans serif, les boutons MyStay,
  une seule colonne par défaut et aucun défilement horizontal.
- **AC-05-02**: Given un écran plus large, When la page est rendue, Then les
  sections deviennent multi-colonnes sans `zoom` ni `transform: scale()`.

---

## Business Rules

- **BR-01**: Le catalogue initial contient exactement quatre destinations :
  `saint-gervais-les-bains`, `saint-nicolas-de-veroce`, `megeve` et `combloux`.
- **BR-02**: Les pages conciergerie et séminaires sont publiées uniquement pour
  `saint-gervais-les-bains` et `saint-nicolas-de-veroce` dans cette version.
- **BR-03**: Activer Megève ou Combloux pour la conciergerie ou les séminaires
  exige une nouvelle validation explicite du Product Owner.
- **BR-04**: Une route locale de service non publiée retourne 404. Elle ne rend
  pas une page `noindex` accessible et n'entre jamais dans le sitemap.
- **BR-05**: Une page locations d'une destination connue est indexable si et
  seulement si sa query retourne au moins un Lodging Public Profile `published`,
  non soft-deleted, rattaché à une City et un Lodging actifs.
- **BR-06**: Une page locations connue mais vide reste utile et accessible en 200,
  porte `noindex, follow` et reste absente du sitemap.
- **BR-07**: Les fiches et cartes logement conservent l'URL canonique courte
  `/logements/[lodging-slug]` de la spec 042.
- **BR-08**: Le mot Airbnb peut décrire une option de réservation uniquement si
  `external_booking_platform = airbnb` et si l'URL HTTPS a déjà été validée par le
  workflow de la spec 028. MyStay ne revendique aucune affiliation officielle.
- **BR-09**: Aucun scraping Airbnb, import automatique, prix, disponibilité,
  avis, note, commission ou condition de réservation n'est ajouté.
- **BR-10**: Les contenus sont saisis comme constantes TypeScript revues et
  propres à chaque couple intention/destination. Aucun texte n'est généré au
  runtime.
- **BR-11**: Les pages sont des Server Components. Aucun état client n'est ajouté
  en dehors des composants interactifs existants.
- **BR-12**: Le design réutilise `MarketingShell`, les conteneurs, couleurs,
  boutons, rayons et typographie sans serif MyStay. Aucun nouveau système de
  design n'est créé.
- **BR-13**: Le JSON-LD décrit uniquement le contenu visible. Les pages de service
  utilisent `Service` avec l'Organization MyStay comme provider ; les pages
  locations utilisent `ItemList` avec les URL courtes des logements.
- **BR-14**: Chaque page possède exactement un H1, des headings descriptifs et
  des liens internes cohérents avec son intention.
- **BR-15**: Les pages locales indexables sont reliées depuis au moins un hub
  public et vers au moins deux autres surfaces publiques utiles.
- **BR-16**: Le sitemap ne contient aucune destination future de service ni page
  locations vide.
- **BR-17**: Cette feature ne modifie ni Prisma, ni les règles de publication, ni
  l'authentification, ni les routes privées.
- **BR-18**: Aucune suppression physique de données n'est effectuée.

---

## Data Model

Aucune migration Prisma.

Le catalogue éditorial est un contrat TypeScript statique. La présence réelle de
logements continue de provenir de `LodgingPublicProfile`, `Lodging`, `City`,
`LodgingPhoto` et `LodgingAmenity` selon les specs 028 et 042.

---

## API Contract

Aucune nouvelle route API.

Les pages Server Components lisent directement les queries publiques du bounded
context `lodging-showcase`. Les routes de service consomment uniquement le catalogue
statique approuvé.

---

## UI Behaviour

### `/conciergerie/[city-slug]`

- Hero clair avec eyebrow local, H1 `Conciergerie à [City]`, promesse factuelle et
  CTA `Confier mon logement`.
- Sections : besoins propriétaires, accompagnement MyStay, fonctionnement, zone
  locale, questions fréquentes et CTA final.
- Liens vers `/confier-mon-logement`, `/logements` et la page locations de la
  commune lorsque celle-ci est indexable.
- Toutes les destinations conciergerie publiées utilisent une landing propriétaire
  mutualisée : promesse de gestion concrète, au plus trois logements réellement
  publiés, six prestations, aperçu réel du guide MyStay, expertise locale,
  processus en quatre étapes, FAQ transactionnelle et CTA final unique.
- Le JSX, les prestations, le processus et les CTA sont partagés. Le H1, la
  promesse, les paragraphes, les secteurs géographiques, la FAQ et la route du
  guide restent propres à chaque destination et proviennent du catalogue
  éditorial statique validé.
- La section d'avis voyageurs consomme une collection structurée séparée,
  limitée à trois entrées et reste totalement absente lorsque cette collection
  est vide. Aucun avis, note ou source n'est inventé et aucun markup `review` ou
  `aggregateRating` n'est émis.
- Le guide local est lié par `/decouvrir/[city-slug]` et le visuel du guide
  réutilise un asset ou composant MyStay existant.

### `/confier-mon-logement`

- Le formulaire propriétaire utilise l'API persistante de la spec 024, avec
  validation navigateur et serveur, état d'envoi, succès, erreur et honeypot.
- Un envoi réussi affiche exactement : « Merci. Votre demande a bien été
  envoyée. Nous vous recontacterons personnellement. »
- Le formulaire ne déclenche plus de `mailto:` et ne confirme jamais un échec.

### `/seminaires/[city-slug]`

- Hero clair avec eyebrow local, H1 `Séminaire à [City]`, bénéfice principal et
  CTA `Parler de mon séminaire`.
- Sections : formats, organisation, cadre local, hébergement et logistique,
  questions fréquentes et CTA final.
- Liens vers `/seminaires`, `/logements` et la page locations de la commune
  lorsqu'elle est indexable.

### `/locations-vacances/[city-slug]`

- Hero clair avec H1 `Locations de vacances à [City]` et texte local.
- Liste mobile-first de cartes `MarketingPropertyCard` issues de la query publiée.
- Chaque carte mène à `/logements/[slug]`.
- Un CTA Airbnb séparé est rendu uniquement pour un lien Airbnb HTTPS validé.
- En l'absence de logement, un état éditorial local est rendu sans fausse carte,
  avec liens vers `/logements` et `/decouvrir` ; la page est `noindex, follow`.

### Hubs

- `/logements` expose les destinations de location du catalogue.
- `/seminaires` expose les deux pages séminaires publiées.
- `/confier-mon-logement` expose les deux pages conciergerie publiées.
- Les nouveaux blocs restent compacts et réutilisent les styles MyStay existants.

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Pages conciergerie actives, uniques et canoniques | unit + integration |
| AC-01-02 | Destinations service futures ou inconnues en 404 | unit + integration |
| AC-01-03 | Contenu conciergerie factuel | unit + editorial review |
| AC-02-01 | Pages séminaires actives, uniques et canoniques | unit + integration |
| AC-02-02 | Destinations séminaires futures ou inconnues en 404 | unit + integration |
| AC-02-03 | Aucun prix/capacité/disponibilité inventé | unit |
| AC-03-01 | Page locations indexable avec profils publiés | unit + integration |
| AC-03-02 | Page locations vide en 200 noindex follow | unit + integration |
| AC-03-03 | Destination locations inconnue en 404 | integration |
| AC-03-04 | CTA Airbnb validé et sécurisé | unit + integration |
| AC-03-05 | Aucun faux CTA Airbnb | unit + integration |
| AC-04-01 | Metadata locales uniques | unit |
| AC-04-02 | Breadcrumb et JSON-LD visibles/factuels | unit + integration |
| AC-04-03 | Sitemap progressif et conditionné à l'inventaire | unit |
| AC-04-04 | Liens internes depuis les hubs | integration |
| AC-04-05 | Aucun paragraphe principal dupliqué | unit |
| AC-05-01 | Rendu 375 px sans serif et sans débordement | integration + e2e |
| AC-05-02 | Responsive sans mise à l'échelle artificielle | integration + e2e |
| AC-06-01 | Landing mutualisée pour chaque destination conciergerie publiée et alimentée par les logements publiés | integration |
| AC-06-02 | Contenu local distinct, guide local réel, expertise locale, processus 4 étapes et FAQ transactionnelle | integration |
| AC-06-03 | Avis structurés masqués à vide et absents du JSON-LD | unit + integration |
| AC-06-04 | Formulaire propriétaire persistant, validé et protégé par honeypot | contract + integration |

---

## Out of Scope

- Garantie de positionnement ou de délai d'indexation dans Google.
- Soumission Search Console, achat de liens ou campagne publicitaire.
- Publication des pages conciergerie ou séminaires de Megève et Combloux.
- Création automatique de logements ou de contenus locaux.
- Réservation native, prix, calendrier ou disponibilités.
- Intégration officielle Airbnb ou Booking.
- Scraping de plateformes tierces.
- Nouvelle table, nouvelle collecte ou nouvelle API : le formulaire propriétaire
  réutilise exclusivement `ContactMessage` et `/api/public/contact-messages`.
- Migration Prisma ou nouvelle API.
- Refonte du header, du footer, des fiches logement ou des routes privées.

---

## Open Questions

Aucune question ouverte. Décisions Product Owner du 2026-09-07 :

- publication immédiate des pages de service uniquement pour
  Saint-Gervais-les-Bains et Saint-Nicolas-de-Véroce ;
- préparation de Megève et Combloux sans indexation de leurs pages de service ;
- indexation d'une page locations uniquement avec au moins un logement publié ;
- CTA Airbnb uniquement lorsqu'un lien Airbnb validé existe ;
- trois intentions et trois namespaces distincts pour éviter la cannibalisation.
