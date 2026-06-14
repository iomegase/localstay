# Spec — 028 Lodging Showcase SEO

## Metadata

```yaml
id: 028-lodging-showcase-seo
title: "Vitrine publique SEO/GEO des logements"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-06-12
updated_at: 2026-06-13
depends_on:
  - 001-city-guide
  - 003-poi-list
  - 004-poi-detail
  - 010-dashboard-owner
  - 012-guide-customization
  - 024-contact-messages
  - 027-multilingual-content
bounded_context: lodging
related_adr:
  - ADR-006-trails-data-source
  - ADR-009-gemini-lodging-editorial-assistance
implementation_gate: "Code generation allowed only after status becomes approved"
```

---

## Context

MyStay doit faire évoluer le Guide local vers une expérience capable de mettre en avant les logements, puis de les rendre réservables dans un chantier ultérieur.

Le produit possède déjà un socle logement : `Lodging`, QR code par logement, personnalisation séjour, recommandations Owner, page `/le-logement` en mode séjour et formulaire de contact. Ce socle est privé ou contextualisé par un séjour actif. Il ne répond pas encore au besoin d'acquisition SEO, car les logements ne disposent pas de pages publiques indexables, structurées et rattachées aux recherches locales.

Cette spec introduit une vitrine publique SEO/GEO des logements :

1. une liste indexable de logements par City ;
2. une fiche logement publique premium inspirée des codes Airbnb, adaptée à l'identité MyStay ;
3. une contribution SEO/GEO forte sur les pages ville ;
4. un lien de réservation externe, d'abord vers Airbnb ou une autre plateforme ;
5. un CTA de contact sans compte Tourist ;
6. un workflow Owner + Super-admin pour préparer, contrôler et publier les fiches.

La réservation native MyStay, les paiements, la synchronisation de calendriers, les disponibilités et l'automatisation iCal/API restent exclus de cette spec. Ils feront l'objet d'un chantier séparé.

---

## Glossary References

- **City** : ville ou commune référencée dans l'application.
- **Guide** : ensemble des contenus affichés pour une City.
- **Lodging** : hébergement touristique associé à une City et à un Owner.
- **Lodging Public Profile** : extension publiable d'un Lodging utilisée pour la vitrine SEO publique.
- **Lodging Photo** : image associée à un Lodging Public Profile.
- **Lodging Amenity** : équipement normalisé affichable sur une fiche logement publique.
- **External Booking Link** : URL sortante vers une plateforme tierce de réservation.
- **External Listing Source** : annonce tierce fournie par l'Owner comme point de départ d'une fiche MyStay.
- **Content Rights Confirmation** : attestation explicite de droits sur les photos, textes et informations importés.
- **Lodging Rewrite Draft** : proposition éditoriale MyStay produite depuis un texte fourni par l'Owner.
- **Owner** : propriétaire ou gestionnaire d'un ou plusieurs Lodgings.
- **Tourist** : utilisateur final sans compte.
- **Contact Message** : message envoyé depuis la page Contact ou depuis une fiche logement.
- **Locale** : langue d'affichage supportée par MyStay.
- **GEO** : optimisation pour les expériences de recherche générative.
- **VacationRental Structured Data** : balisage JSON-LD Schema.org `VacationRental`.
- **Soft Delete** : suppression logique via `deleted_at`.

---

## User Stories

### US-01 — Découvrir les logements d'une ville

**As a** Tourist arrivant depuis Google ou depuis un Guide ville  
**I want to** voir les logements disponibles à proximité de la ville consultée  
**So that** je puisse choisir un hébergement sans quitter l'univers MyStay

#### Acceptance Criteria

- **AC-01-01**: Given une City active avec au moins un Lodging Public Profile publié, When le Tourist ouvre `/guide/[city-slug]/logements`, Then la page affiche une liste de logements publiés avec photo, nom, type, capacité, équipements clés, zone de localisation et CTA vers la fiche.
- **AC-01-02**: Given une City sans logement publié, When le Tourist ouvre `/guide/[city-slug]/logements`, Then la page retourne 200 avec un contenu éditorial utile sur le séjour dans la City et aucun faux logement.
- **AC-01-03**: Given des filtres de capacité ou équipements, When le Tourist les applique, Then la liste conserve uniquement les logements publiés correspondant aux filtres sans afficher de logement `draft`, `review` ou `archived`.
- **AC-01-04**: Given une City inexistante, inactive ou soft-deleted, When la route `/guide/[city-slug]/logements` est demandée, Then Next.js retourne 404.

### US-02 — Consulter une fiche logement premium

**As a** Tourist  
**I want to** consulter une fiche logement détaillée et rassurante  
**So that** je comprenne l'ambiance, les équipements, la localisation et les options de réservation

#### Acceptance Criteria

- **AC-02-01**: Given un Lodging Public Profile publié, When le Tourist ouvre `/guide/[city-slug]/logements/[lodging-slug]`, Then la page affiche hero photo, galerie, titre, description, capacité, chambres, couchages, salles de bain, équipements, localisation approximative, recommandations Owner, CTA contact et CTA de réservation externe si configuré.
- **AC-02-02**: Given une fiche sans lien de réservation externe, When la page s'affiche, Then le CTA externe est absent et le CTA contact reste disponible si `public_contact_enabled = true`.
- **AC-02-03**: Given un slug logement inconnu ou non publié, When la route fiche est demandée, Then Next.js retourne 404 et aucun contenu privé du Lodging n'est exposé.
- **AC-02-04**: Given une fiche publiée avec moins de 5 photos, When la page s'affiche, Then elle reste consultable mais le dashboard signale une qualité SEO insuffisante pour la publication optimale.
- **AC-02-05**: Given une fiche publiée avec des recommandations Owner, When les recommandations s'affichent, Then elles réutilisent uniquement des POI actifs, non supprimés, non rejetés et situés dans le périmètre du Guide.

### US-03 — Réserver ou demander des informations

**As a** Tourist intéressé par un logement  
**I want to** contacter l'hôte ou ouvrir la réservation Airbnb  
**So that** je puisse poursuivre mon intention sans friction

#### Acceptance Criteria

- **AC-03-01**: Given `external_booking_url` est configuré et validé, When le Tourist clique sur le CTA de réservation externe, Then le lien s'ouvre dans un nouvel onglet avec `rel="noopener noreferrer"` et un événement analytics `lodging_external_booking_click` est enregistré.
- **AC-03-02**: Given `public_contact_enabled = true`, When le Tourist clique sur le CTA contact, Then il accède à un formulaire public prérempli avec `lodging_id` et destination `owner`, en conservant le contexte `/guide/[city-slug]` quand la fiche logement est ouverte depuis ce périmètre.
- **AC-03-03**: Given `public_contact_enabled = false`, When la fiche s'affiche, Then aucun CTA contact Owner n'est affiché.
- **AC-03-04**: Given un formulaire de contact public valide depuis une fiche logement, When il est soumis, Then un `ContactMessage` est créé selon les règles de `024-contact-messages`.

### US-04 — Découvrir les logements depuis le menu du Guide ville

**As a** Tourist consultant un Guide ville  
**I want to** accéder à une page dédiée aux logements sans surcharger la page Guide ville  
**So that** la découverte des logements reste claire et le SEO se concentre sur une route dédiée

#### Acceptance Criteria

- **AC-04-01**: Given un Guide ville ou une route publique rattachée à une City, When le Tourist ouvre le menu burger, Then une entrée dédiée `Logements` permet d'accéder à `/guide/[city-slug]/logements`.
- **AC-04-02**: Given `/guide/[city-slug]` s'affiche, When la page est rendue, Then aucun bloc logements n'est injecté dans le flux principal du Guide ville.
- **AC-04-03**: Given le Tourist clique sur l'entrée `Logements` du menu burger, When la navigation se déclenche, Then il est redirigé vers `/guide/[city-slug]/logements`.
- **AC-04-04**: Given la page City contient événements, météo et catégories, When elle s'affiche sur mobile 375px, Then aucun bloc ne chevauche un autre et aucun scroll horizontal n'apparaît.

### US-05 — Préparer une fiche publique depuis le dashboard Owner

**As an** Owner  
**I want to** renseigner les informations publiques de mon logement  
**So that** MyStay puisse présenter mon logement de manière attractive et indexable

#### Acceptance Criteria

- **AC-05-01**: Given un Owner authentifié, When il ouvre `/dashboard/lodgings/[id]/showcase`, Then il peut créer ou modifier le Lodging Public Profile de son propre Lodging.
- **AC-05-02**: Given le formulaire Owner, When il sauvegarde titre, descriptions, capacité, pièces, équipements, lien Airbnb, photos et SEO fields, Then les données sont validées avec Zod et sauvegardées en statut `draft`.
- **AC-05-03**: Given un Owner tente de modifier un Lodging qui ne lui appartient pas, When la route API est appelée, Then l'API retourne 404 ou 403 sans exposer les données.
- **AC-05-04**: Given un Owner estime la fiche prête, When il clique "Demander publication", Then `publication_status` passe à `review` si les champs minimaux sont présents.
- **AC-05-05**: Given les champs minimaux sont incomplets, When l'Owner demande publication, Then l'API refuse la transition avec une erreur structurée listant les champs manquants.
- **AC-05-06**: Given l'Owner colle une URL Airbnb ou Booking valide, When il la sauvegarde, Then MyStay stocke l'URL, détecte la plateforme et extrait uniquement les métadonnées dérivables de l'URL sans scraper la plateforme.
- **AC-05-07**: Given l'URL externe est invalide, non HTTPS ou appartient à une plateforme non autorisée, When l'Owner la sauvegarde, Then l'API retourne une erreur Zod structurée et aucun lien externe n'est publié.
- **AC-05-08**: Given l'Owner souhaite utiliser des photos ou textes issus de son annonce externe, When il les importe ou les colle dans MyStay, Then il doit confirmer qu'il possède les droits nécessaires avant sauvegarde publiable.
- **AC-05-09**: Given l'Owner téléverse des photos depuis son ordinateur, When l'upload réussit, Then MyStay stocke les photos comme `LodgingPhoto` avec `alt`, `room_type` et ordre d'affichage sans télécharger automatiquement les images depuis Airbnb.
- **AC-05-10**: Given l'Owner colle son texte Airbnb dans le champ source et que Gemini est configuré côté serveur, When il demande une réécriture MyStay, Then MyStay propose un Lodging Rewrite Draft plus SEO, premium et local, sans modifier automatiquement la fiche publiée.
- **AC-05-11**: Given un Lodging Rewrite Draft est généré, When l'Owner l'accepte, Then le texte accepté remplit les champs MyStay (`short_description`, `description`, `seo_title`, `seo_description`) en brouillon et reste soumis à validation Admin avant publication.
- **AC-05-12**: Given Gemini n'est pas configuré ou retourne une erreur, When l'Owner demande une réécriture MyStay, Then l'API retourne une erreur structurée et conserve le texte source en brouillon.

### US-06 — Contrôler la publication côté Super-admin

**As a** Super-admin  
**I want to** relire les fiches logement avant indexation  
**So that** MyStay évite les pages pauvres, les contenus dupliqués, les photos insuffisantes ou les données sensibles exposées

#### Acceptance Criteria

- **AC-06-01**: Given un Admin authentifié, When il ouvre `/admin/lodgings`, Then il voit les fiches filtrables par City, Owner et `publication_status`.
- **AC-06-02**: Given une fiche en `review`, When l'Admin l'approuve, Then `publication_status = published`, `published_at` est renseigné et la page devient indexable.
- **AC-06-03**: Given une fiche en `review`, When l'Admin demande correction, Then `publication_status = draft`, une note admin est enregistrée et la fiche n'est pas indexable.
- **AC-06-04**: Given une fiche publiée, When l'Admin l'archive, Then `publication_status = archived`, la page publique retourne 404 et la fiche est retirée du sitemap.

### US-07 — Renforcer le SEO/GEO logement

**As a** Product Owner  
**I want to** produire des pages logement indexables, utiles et structurées  
**So that** MyStay gagne du trafic qualifié sur les recherches locales et les expériences de recherche générative

#### Acceptance Criteria

- **AC-07-01**: Given une fiche logement publiée, When `generateMetadata` s'exécute, Then la page expose title, description, canonical, Open Graph image, robots index/follow et une URL stable sans query canonical.
- **AC-07-02**: Given une liste logements City publiée, When `generateMetadata` s'exécute, Then la page expose une title et une description orientées recherche locale, par exemple "Logements à [City]".
- **AC-07-03**: Given des logements publiés, When le sitemap est généré, Then seules les routes liste City et fiches `published` sont incluses.
- **AC-07-04**: Given une fiche publiée avec les champs requis pour Schema.org `VacationRental`, When la page s'affiche, Then elle émet un JSON-LD `VacationRental` conforme aux données visibles.
- **AC-07-05**: Given une fiche publiée sans les champs requis pour `VacationRental`, When la page s'affiche, Then elle émet uniquement un JSON-LD plus prudent (`LodgingBusiness` ou `Place`) et n'émet pas de balisage `VacationRental` incomplet.
- **AC-07-06**: Given une page logement publique, When le contenu est rendu, Then elle contient des blocs factuels visibles, structurés par headings, répondant à des intentions locales : type de séjour, proximité avec le Guide, équipements, recommandations et informations pratiques non sensibles.
- **AC-07-07**: Given une page localisée future via `027-multilingual-content`, When la couverture de traduction critique est insuffisante, Then la page localisée reçoit `noindex, follow` selon les règles de la spec 027.

---

## Business Rules

- **BR-01**: Un Lodging Public Profile appartient à un seul Lodging et un Lodging possède au maximum un Lodging Public Profile actif.
- **BR-02**: Seuls les Lodgings `is_active = true`, `deleted_at = null` et rattachés à une City active peuvent avoir une fiche publique publiée.
- **BR-02a**: `LodgingPublicProfile.city_id` est dénormalisé pour les routes SEO et doit toujours correspondre à `lodging.city_id`.
- **BR-03**: Les pages publiques affichent uniquement les fiches `publication_status = published`, `deleted_at = null`.
- **BR-04**: Les statuts autorisés sont `draft`, `review`, `published`, `archived`.
- **BR-05**: Un Owner peut créer et modifier uniquement les profils publics de ses propres Lodgings.
- **BR-06**: Un Owner ne peut pas publier directement une fiche ; il peut seulement demander la publication (`review`).
- **BR-07**: Seul un Admin peut passer une fiche en `published` ou `archived`.
- **BR-08**: Une fiche ne peut passer en `review` que si les champs minimaux sont présents : `title`, `short_description`, `description`, `property_type`, `max_guests`, au moins 1 photo, au moins 3 équipements, et une City active.
- **BR-09**: La qualité SEO éditoriale requiert au moins 5 photos, dont une couverture, un titre unique, une description principale de 400 caractères minimum, une meta description de 120 à 160 caractères et au moins un lien interne vers le Guide ville.
- **BR-10**: Le lien de réservation externe est optionnel. S'il existe, il doit utiliser `https://` et appartenir à une plateforme autorisée (`airbnb`, `booking`, `other_verified`).
- **BR-11**: Le lien externe ne crée aucune réservation MyStay et ne bloque aucune date.
- **BR-12**: Aucun prix, disponibilité, frais, acompte, commission, taxe ou condition d'annulation transactionnelle n'est géré par cette spec.
- **BR-12a**: L'URL Airbnb ou Booking sert de source externe déclarée et de CTA sortant. MyStay ne doit pas présenter cette URL comme une intégration officielle Airbnb ou Booking.
- **BR-12b**: MyStay ne scrape pas Airbnb, Booking ou toute autre plateforme tierce. La détection automatique est limitée à la validation d'URL, au domaine, à la plateforme et à un identifiant dérivable de l'URL si présent.
- **BR-12c**: Toute collecte automatisée de titre, description, prix, photos, avis, disponibilité ou coordonnées depuis Airbnb/Booking est interdite sauf API officielle, accord explicite ou politique plateforme compatible documentée dans une spec/ADR dédiée.
- **BR-12d**: Les photos doivent être téléversées par l'Owner ou importées depuis un fichier qu'il fournit. MyStay ne télécharge pas automatiquement les photos depuis l'URL Airbnb.
- **BR-12e**: Les textes collés depuis Airbnb sont stockés comme brouillon source Owner. Ils ne sont jamais publiés tels quels sans confirmation de droits et validation Admin.
- **BR-12f**: L'Owner doit confirmer les droits contenus avant toute soumission en `review` si la fiche contient des photos téléversées, un texte source externe ou une réécriture dérivée.
- **BR-12g**: La réécriture MyStay est une suggestion éditoriale. Elle ne peut pas inventer d'équipements, de capacité, de localisation, de prix, de disponibilité ou de règles non fournis par l'Owner.
- **BR-12h**: Gemini est autorisé pour la réécriture éditoriale des fiches logement selon `ADR-009`, car ce métier est distinct de l'acquisition POI cadrée par `ADR-006`.
- **BR-12i**: Le prompt Gemini doit recevoir uniquement le texte source fourni par l'Owner et les faits structurés déjà saisis ou validés dans MyStay. Il doit interdire toute invention de faits.
- **BR-12j**: La réponse Gemini doit être validée avec Zod et sauvegardée comme brouillon. Elle ne peut jamais passer directement en `published`.
- **BR-13**: La localisation publique affiche par défaut une zone approximative : City, quartier, hameau ou rayon textuel. L'adresse exacte n'est pas affichée publiquement par défaut.
- **BR-14**: Les coordonnées précises (`public_latitude`, `public_longitude`) ne sont publiables que si `precise_location_public = true`, renseigné explicitement par un Admin.
- **BR-15**: Les données géographiques mesurables viennent de Mapbox ou d'une source spécialisée. Gemini ne doit jamais générer coordonnées, distances ou métriques géographiques.
- **BR-16**: Gemini n'est pas utilisé pour créer des faits logement ni enrichir automatiquement depuis une plateforme externe. Il peut uniquement reformuler des textes Owner en brouillon éditorial selon `ADR-009`.
- **BR-17**: Les recommandations Owner affichées sur une fiche logement réutilisent `LodgingFeaturedPoi` de la spec 012 ou une query compatible. Elles ne peuvent pas ajouter de POI inexistants.
- **BR-18**: Un POI recommandé doit respecter les règles de périmètre des specs 003 et 008 : primary `≤ 15 km`, nearby `15–30 km`, rejet `> 30 km`.
- **BR-19**: La liste logements City trie d'abord les fiches `is_featured = true`, puis par `published_at desc`, puis par `created_at desc`.
- **BR-20**: La découverte des logements depuis le Guide ville passe par une entrée dédiée `Logements` dans le menu burger ; le flux principal de `/guide/[city-slug]` n'affiche aucun bloc logements.
- **BR-21**: Les photos logement sont validées côté serveur, limitées à 5 Mo, converties si nécessaire via le service d'upload existant et stockées dans le bucket `guide-photos`.
- **BR-22**: Chaque Lodging Photo doit avoir un `alt` public non vide avant publication.
- **BR-23**: Les textes libres sont validés avec Zod : `title` 5–90 caractères, `short_description` 40–180, `description` 80–4000, `seo_title` 30–70, `seo_description` 80–180.
- **BR-23a**: Le passage en `review` n'exige pas 200 caractères minimum pour `description`. Une description entre 80 et 199 caractères est autorisée pour la revue, mais reste sous-optimale sur le plan éditorial et SEO.
- **BR-24**: Aucune fiche `draft`, `review` ou `archived` ne doit être présente dans le sitemap, dans les listes publiques ou dans les JSON-LD publics.
- **BR-25**: Les pages non publiées retournent 404 plutôt que `noindex` pour éviter l'exposition de contenu privé.
- **BR-26**: Les données structurées JSON-LD doivent décrire uniquement des informations visibles sur la page.
- **BR-27**: Le JSON-LD `VacationRental` est autorisé uniquement si les champs requis sont complets : identifiant stable, nom, au moins 8 photos visibles dont au moins une chambre, une salle de bain et un espace commun, capacité, latitude/longitude publiques avec précision suffisante, et informations visibles correspondantes.
- **BR-28**: Si les champs requis `VacationRental` sont incomplets ou si la localisation précise n'est pas publiable, utiliser un balisage plus prudent (`LodgingBusiness` ou `Place`) sans sur-déclarer la donnée.
- **BR-29**: Les pages publiques doivent conserver une structure mobile-first 375px+ et ne pas casser le layout public existant.
- **BR-30**: Les routes publiques doivent être Server Components par défaut. Les composants Client sont limités aux interactions nécessaires : galerie, filtres, upload dashboard et formulaires.
- **BR-31**: Les erreurs API suivent le format standard du projet : `{ "error": { "code": "...", "message": "...", "details": {} } }`.
- **BR-32**: Toutes les mutations utilisent des Server Actions ou routes API validées avec Zod, jamais de logique métier dans les composants React.
- **BR-33**: Toutes les suppressions sont logiques via `deleted_at` ou `publication_status = archived`; aucune suppression physique de modèle métier n'est autorisée.
- **BR-34**: Les routes localisées futures suivent les règles de `027-multilingual-content`; cette spec définit les champs traduisibles du profil public.
- **BR-35**: Les contenus dupliqués entre la fiche publique et `/le-logement` doivent être évités par séparation d'intention : fiche publique = acquisition ; page séjour = informations pratiques privées.

---

## Data Model

```prisma
enum LodgingPublicationStatus {
  draft
  review
  published
  archived
}

enum ExternalBookingPlatform {
  airbnb
  booking
  other_verified
}

enum LodgingSourceMetadataStatus {
  not_checked
  url_only
  unavailable
  blocked
}

enum LodgingRewriteStatus {
  not_requested
  requested
  generated
  accepted
  rejected
  failed
}

model Lodging {
  // ...champs existants spec 010...
  public_profile LodgingPublicProfile?
}

model City {
  // ...champs existants...
  lodging_public_profiles LodgingPublicProfile[]
}

model LodgingPublicProfile {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  lodging_id  String  @unique
  lodging     Lodging @relation(fields: [lodging_id], references: [id])
  city_id     String
  city        City    @relation(fields: [city_id], references: [id])

  slug                  String
  publication_status    LodgingPublicationStatus @default(draft)
  is_featured           Boolean @default(false)
  published_at          DateTime?
  submitted_for_review_at DateTime?
  admin_review_note     String?

  title                 String
  short_description     String
  description           String
  property_type         String
  max_guests            Int
  bedroom_count         Int?
  bathroom_count        Float?
  bed_count             Int?
  surface_m2            Int?

  public_area_label     String?
  precise_location_public Boolean @default(false)
  public_latitude       Float?
  public_longitude      Float?

  external_booking_url      String?
  external_booking_platform ExternalBookingPlatform?
  public_contact_enabled    Boolean @default(true)

  source_listing_url        String?
  source_listing_platform   ExternalBookingPlatform?
  source_listing_identifier String?
  source_metadata_status    LodgingSourceMetadataStatus @default(not_checked)
  source_metadata_detected  Json?
  source_description_text   String?

  content_rights_confirmed_at DateTime?
  content_rights_confirmed_by_user_id String?
  content_rights_statement_version String?

  rewrite_status            LodgingRewriteStatus @default(not_requested)
  rewrite_source_text_hash  String?
  rewrite_suggestion        String?
  rewrite_generated_at      DateTime?
  rewrite_provider          String?

  seo_title             String?
  seo_description       String?

  photos                LodgingPhoto[]
  amenities             LodgingAmenity[]

  @@unique([city_id, slug])
  @@index([publication_status, deleted_at])
  @@index([city_id, publication_status, deleted_at])
  @@index([published_at])
}

model LodgingPhoto {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  profile_id  String
  profile     LodgingPublicProfile @relation(fields: [profile_id], references: [id])

  url          String
  alt          String
  room_type    String? // bedroom | bathroom | common_area | exterior | kitchen | other
  sort_order   Int @default(0)
  is_cover     Boolean @default(false)

  @@index([profile_id, deleted_at])
}

model LodgingAmenity {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  profile_id  String
  profile     LodgingPublicProfile @relation(fields: [profile_id], references: [id])

  code         String
  label        String
  sort_order   Int @default(0)

  @@unique([profile_id, code])
  @@index([profile_id, deleted_at])
}

model Analytics {
  // event_type accepte aussi :
  // lodging_card_click
  // lodging_detail_view
  // lodging_external_booking_click
  // lodging_contact_click
}
```

### Translatable Fields

Ces champs sont déclarés traduisibles via `027-multilingual-content` :

- `LodgingPublicProfile.title`
- `LodgingPublicProfile.short_description`
- `LodgingPublicProfile.description`
- `LodgingPublicProfile.source_description_text`
- `LodgingPublicProfile.rewrite_suggestion`
- `LodgingPublicProfile.public_area_label`
- `LodgingPublicProfile.seo_title`
- `LodgingPublicProfile.seo_description`
- `LodgingPhoto.alt`
- `LodgingAmenity.label`

Ces champs ne sont pas traduisibles :

- `slug`
- URLs
- source metadata
- coordonnées
- capacités numériques
- compteurs
- statuts
- identifiants

---

## API Contract

```yaml
openapi: 3.1.0
info:
  title: Lodging Showcase SEO
  version: 1.0.0
paths:
  /api/cities/{slug}/lodgings:
    get:
      summary: "Liste publique des logements publiés d'une City"
      tags: [lodging-showcase]
      parameters:
        - name: slug
          in: path
          required: true
          schema: { type: string }
        - name: guests
          in: query
          required: false
          schema: { type: integer, minimum: 1, maximum: 30 }
        - name: amenities
          in: query
          required: false
          schema: { type: string, description: "Codes séparés par virgule" }
        - name: page
          in: query
          required: false
          schema: { type: integer, minimum: 1, default: 1 }
        - name: limit
          in: query
          required: false
          schema: { type: integer, minimum: 1, maximum: 30, default: 12 }
      responses:
        "200":
          description: Liste des logements publiés
          content:
            application/json:
              schema:
                type: object
                required: [items, meta]
                properties:
                  items:
                    type: array
                    items:
                      $ref: "#/components/schemas/PublicLodgingCard"
                  meta:
                    $ref: "#/components/schemas/PaginationMeta"
        "400":
          $ref: "#/components/responses/BadRequest"
        "404":
          $ref: "#/components/responses/NotFound"

  /api/cities/{slug}/lodgings/{lodgingSlug}:
    get:
      summary: "Détail public d'un logement publié"
      tags: [lodging-showcase]
      parameters:
        - name: slug
          in: path
          required: true
          schema: { type: string }
        - name: lodgingSlug
          in: path
          required: true
          schema: { type: string }
      responses:
        "200":
          description: Fiche logement publique
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PublicLodgingDetail"
        "404":
          $ref: "#/components/responses/NotFound"

  /api/dashboard/lodgings/{id}/public-profile:
    get:
      summary: "Récupérer le profil public d'un Lodging Owner"
      tags: [lodging-showcase-owner]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        "200":
          description: Profil public Owner
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/OwnerLodgingPublicProfile"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
        "404":
          $ref: "#/components/responses/NotFound"
    put:
      summary: "Créer ou modifier le profil public d'un Lodging Owner"
      tags: [lodging-showcase-owner]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/OwnerLodgingPublicProfileInput"
      responses:
        "200":
          description: Profil sauvegardé en brouillon
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/OwnerLodgingPublicProfile"
        "400":
          $ref: "#/components/responses/BadRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
        "404":
          $ref: "#/components/responses/NotFound"

  /api/dashboard/lodgings/{id}/public-profile/submit:
    post:
      summary: "Soumettre une fiche logement à validation"
      tags: [lodging-showcase-owner]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        "200":
          description: Fiche passée en review
          content:
            application/json:
              schema:
                type: object
                required: [id, publication_status]
                properties:
                  id: { type: string }
                  publication_status: { type: string, enum: [review] }
        "400":
          $ref: "#/components/responses/BadRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
        "404":
          $ref: "#/components/responses/NotFound"

  /api/dashboard/lodgings/{id}/public-profile/source-url:
    post:
      summary: "Enregistrer et analyser une URL d'annonce externe"
      tags: [lodging-showcase-owner]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [source_listing_url]
              properties:
                source_listing_url: { type: string, format: uri }
      responses:
        "200":
          description: URL validée et plateforme détectée
          content:
            application/json:
              schema:
                type: object
                required: [source_listing_url, source_listing_platform, source_metadata_status]
                properties:
                  source_listing_url: { type: string }
                  source_listing_platform: { type: string, enum: [airbnb, booking, other_verified] }
                  source_listing_identifier: { type: string, nullable: true }
                  source_metadata_status: { type: string, enum: [url_only, unavailable, blocked] }
        "400":
          $ref: "#/components/responses/BadRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
        "404":
          $ref: "#/components/responses/NotFound"

  /api/dashboard/lodgings/{id}/public-profile/rights-confirmation:
    post:
      summary: "Confirmer les droits sur les contenus importés"
      tags: [lodging-showcase-owner]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [confirmed, statement_version]
              properties:
                confirmed: { type: boolean, const: true }
                statement_version: { type: string }
      responses:
        "200":
          description: Confirmation enregistrée
          content:
            application/json:
              schema:
                type: object
                required: [content_rights_confirmed_at]
                properties:
                  content_rights_confirmed_at: { type: string, format: date-time }
        "400":
          $ref: "#/components/responses/BadRequest"

  /api/dashboard/lodgings/{id}/public-profile/rewrite:
    post:
      summary: "Créer une proposition de réécriture MyStay depuis un texte Owner"
      tags: [lodging-showcase-owner]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [source_description_text]
              properties:
                source_description_text: { type: string, minLength: 80, maxLength: 6000 }
                tone: { type: string, enum: [seo_premium_local], default: seo_premium_local }
      responses:
        "200":
          description: Suggestion de réécriture créée
          content:
            application/json:
              schema:
                type: object
                required: [rewrite_status, rewrite_suggestion]
                properties:
                  rewrite_status: { type: string, enum: [generated] }
                  rewrite_suggestion: { type: string }
        "400":
          $ref: "#/components/responses/BadRequest"
        "503":
          description: Gemini indisponible ou non configuré
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

  /api/dashboard/lodgings/{id}/public-profile/photos:
    post:
      summary: "Uploader une photo de fiche logement"
      tags: [lodging-showcase-owner]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required: [file, alt]
              properties:
                file: { type: string, format: binary }
                alt: { type: string, minLength: 5, maxLength: 160 }
                room_type: { type: string, enum: [bedroom, bathroom, common_area, exterior, kitchen, other] }
      responses:
        "201":
          description: Photo créée
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/LodgingPhoto"
        "400":
          $ref: "#/components/responses/BadRequest"

  /api/admin/lodgings/public-profiles:
    get:
      summary: "Liste admin des fiches logement"
      tags: [lodging-showcase-admin]
      security:
        - bearerAuth: []
      parameters:
        - name: city_id
          in: query
          required: false
          schema: { type: string, format: uuid }
        - name: owner_id
          in: query
          required: false
          schema: { type: string, format: uuid }
        - name: publication_status
          in: query
          required: false
          schema: { type: string, enum: [draft, review, published, archived] }
      responses:
        "200":
          description: Liste admin paginée
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"

  /api/admin/lodgings/public-profiles/{profileId}/publish:
    post:
      summary: "Publier une fiche logement"
      tags: [lodging-showcase-admin]
      security:
        - bearerAuth: []
      parameters:
        - name: profileId
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        "200":
          description: Fiche publiée

  /api/admin/lodgings/public-profiles/{profileId}/request-changes:
    post:
      summary: "Demander correction Owner"
      tags: [lodging-showcase-admin]
      security:
        - bearerAuth: []
      parameters:
        - name: profileId
          in: path
          required: true
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [admin_review_note]
              properties:
                admin_review_note: { type: string, minLength: 5, maxLength: 1000 }
      responses:
        "200":
          description: Fiche repassée en draft

  /api/admin/lodgings/public-profiles/{profileId}/archive:
    post:
      summary: "Archiver une fiche logement"
      tags: [lodging-showcase-admin]
      security:
        - bearerAuth: []
      parameters:
        - name: profileId
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        "200":
          description: Fiche archivée

components:
  schemas:
    PublicLodgingCard:
      type: object
      required: [id, slug, title, city_slug, cover_photo_url, max_guests, property_type, href]
      properties:
        id: { type: string }
        slug: { type: string }
        title: { type: string }
        city_slug: { type: string }
        cover_photo_url: { type: string, nullable: true }
        short_description: { type: string }
        property_type: { type: string }
        max_guests: { type: integer }
        bedroom_count: { type: integer, nullable: true }
        public_area_label: { type: string, nullable: true }
        amenities:
          type: array
          items: { type: string }
        href: { type: string }
    PublicLodgingDetail:
      allOf:
        - $ref: "#/components/schemas/PublicLodgingCard"
        - type: object
          required: [description, photos, amenities, public_contact_enabled]
          properties:
            description: { type: string }
            photos:
              type: array
              items:
                $ref: "#/components/schemas/LodgingPhoto"
            bathroom_count: { type: number, nullable: true }
            bed_count: { type: integer, nullable: true }
            surface_m2: { type: integer, nullable: true }
            external_booking_url: { type: string, nullable: true }
            external_booking_platform: { type: string, nullable: true }
            public_contact_enabled: { type: boolean }
    LodgingPhoto:
      type: object
      required: [id, url, alt, sort_order, is_cover]
      properties:
        id: { type: string }
        url: { type: string }
        alt: { type: string }
        room_type: { type: string, nullable: true }
        sort_order: { type: integer }
        is_cover: { type: boolean }
    PaginationMeta:
      type: object
      required: [page, limit, total, total_pages]
      properties:
        page: { type: integer }
        limit: { type: integer }
        total: { type: integer }
        total_pages: { type: integer }
```

Toutes les erreurs utilisent le format standard :

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

---

## UI Behaviour

### Page publique : `/guide/[city-slug]/logements`

- Page Server Component, indexable uniquement si la City existe et si la route canonical est la version sans query.
- Header cohérent avec le Guide public : nom de la City, promesse "Où dormir à [City]", lien retour Guide.
- Intro éditoriale courte, utile et spécifique à la City.
- Liste mobile-first de cards logement :
  - photo de couverture ;
  - titre ;
  - type ;
  - capacité ;
  - zone approximative ;
  - 10 équipements clés maximum ;
  - CTA "Voir le logement".
- Filtres Client Component limités :
  - nombre de voyageurs ;
  - équipements ;
  - type de logement si plusieurs types existent.
- Empty state SEO utile si aucun logement publié : texte éditorial, liens vers Guide, restaurants, randonnées, événements.
- Aucun logement non publié dans le DOM.

### Page publique : `/guide/[city-slug]/logements/[lodging-slug]`

- Hero plein écran mobile avec photo de couverture et overlay lisible.
- Galerie photos accessible, avec textes alternatifs.
- Bloc facts compact : voyageurs, chambres, lits, salles de bain, surface si disponible.
- Description structurée avec headings courts.
- Équipements en grille d'icônes Lucide.
- Localisation approximative :
  - City et zone textuelle par défaut ;
  - mini-carte uniquement si coordonnées publiques autorisées ;
  - pas d'adresse exacte par défaut.
- Bloc "Les recommandations de votre hôte" réutilisant les POI favoris de la spec 012.
- Bloc "Autour du logement" avec liens internes vers Guide, restaurants, randonnées, météo et agenda quand disponibles.
- Bloc CTA dans le flux de la page :
  - "Réserver sur Airbnb" ou libellé plateforme configurée si lien externe présent ;
  - "Contacter l'hôte" si contact public autorisé ;
  - aucun bandeau `fixed` en bas d'écran ne doit chevaucher la navigation publique ou le contenu de la fiche.
- JSON-LD placé via `JsonLd`, uniquement depuis les données visibles.

### Page publique : `/guide/[city-slug]`

- Aucun bloc logements injecté dans le flux principal du Guide ville.
- Le menu burger expose une entrée `Logements` pointant vers `/guide/[city-slug]/logements` quand une City est résolue dans le contexte courant.
- Le SEO lié aux logements est concentré sur la liste dédiée `/guide/[city-slug]/logements` et sur les fiches logement publiques, pas sur le contenu de `/guide/[city-slug]`.

### Dashboard Owner : `/dashboard/lodgings/[id]/showcase`

- Interface Shadcn/ui.
- Sections :
  - publication status ;
  - assistant d'import depuis annonce externe ;
  - contenu principal ;
  - caractéristiques ;
  - équipements ;
  - galerie ;
  - lien externe ;
  - SEO preview ;
  - demande de publication.
- Assistant d'import externe :
  - champ URL Airbnb/Booking ;
  - validation HTTPS et plateforme ;
  - affichage clair "MyStay ne copie pas automatiquement les photos ou textes Airbnb" ;
  - champ pour coller le texte source si l'Owner souhaite le réutiliser ;
  - confirmation obligatoire des droits avant soumission en review ;
  - upload manuel des photos depuis l'ordinateur ;
  - bouton "Proposer une version MyStay" qui crée un brouillon de réécriture non publié.
- Sauvegarde en `draft`.
- Affichage des erreurs de complétude avant soumission en `review`.

### Admin : `/admin/lodgings`

- Table Shadcn/ui filtrable.
- Colonnes : logement, City, Owner, status, photos, qualité SEO, updated_at, actions.
- Actions : prévisualiser, publier, demander correction, archiver.
- La publication affiche les critères de complétude et les avertissements SEO avant confirmation.

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Liste logements City avec cards publiées | integration |
| AC-01-02 | City sans logement publié → 200 éditorial sans faux logement | integration |
| AC-01-03 | Filtres capacité/équipements sur logements publiés | integration |
| AC-01-04 | City absente/inactive → 404 | integration |
| AC-02-01 | Fiche logement premium complète | integration |
| AC-02-02 | Absence lien externe → CTA externe absent | unit |
| AC-02-03 | Fiche inconnue/non publiée → 404 | integration |
| AC-02-04 | Moins de 5 photos → consultable avec signal qualité SEO dashboard | unit |
| AC-02-05 | Recommandations Owner réutilisent POI valides du Guide | unit |
| AC-03-01 | Clic réservation externe ouvre nouvel onglet et analytics | e2e |
| AC-03-02 | CTA contact préremplit lodging_id | integration |
| AC-03-03 | Contact désactivé → CTA absent | unit |
| AC-03-04 | Contact fiche crée ContactMessage selon spec 024 | contract |
| AC-04-01 | Entrée `Logements` visible dans le menu burger de la City | unit |
| AC-04-02 | Guide City sans bloc logements dans le flux principal | integration |
| AC-04-03 | Entrée `Logements` du menu redirige vers la liste dédiée | unit |
| AC-04-04 | Rendu mobile 375px sans chevauchement ni scroll horizontal | e2e |
| AC-05-01 | Owner accède à sa page showcase | integration |
| AC-05-02 | Sauvegarde Owner validée Zod en draft | contract |
| AC-05-03 | Isolation Owner | contract |
| AC-05-04 | Demande publication → review si complet | contract |
| AC-05-05 | Demande publication incomplète → erreur structurée | contract |
| AC-05-06 | URL Airbnb/Booking validée sans scraping | contract |
| AC-05-07 | URL externe invalide refusée | contract |
| AC-05-08 | Confirmation droits contenus obligatoire | contract |
| AC-05-09 | Photos téléversées manuellement, jamais téléchargées depuis Airbnb | integration |
| AC-05-10 | Réécriture MyStay proposée depuis texte Owner | contract |
| AC-05-11 | Acceptation du rewrite remplit les champs en brouillon | integration |
| AC-05-12 | Gemini absent/indisponible → erreur structurée sans perte du texte source | contract |
| AC-06-01 | Admin liste et filtre les fiches | integration |
| AC-06-02 | Admin publie une fiche | contract |
| AC-06-03 | Admin demande correction | contract |
| AC-06-04 | Admin archive et retire du public/sitemap | contract |
| AC-07-01 | Metadata fiche publique canonical/OG/robots | unit |
| AC-07-02 | Metadata liste City orientée recherche locale | unit |
| AC-07-03 | Sitemap inclut uniquement routes published | unit |
| AC-07-04 | JSON-LD VacationRental seulement si complet | unit |
| AC-07-05 | Fallback JSON-LD prudent si données incomplètes | unit |
| AC-07-06 | Contenu GEO visible, structuré et factuel | integration |
| AC-07-07 | Pages localisées incomplètes → noindex follow | unit |
| BR-13/14 | Localisation publique approximative par défaut | unit |
| BR-21/22 | Photos validées, alt requis | unit |
| BR-24/25 | Non publiés absents public/sitemap et retournent 404 | contract |

---

## Out of Scope

- Réservation native MyStay.
- Paiement en ligne, Stripe Checkout, Stripe Connect, acomptes, remboursements ou commissions.
- Synchronisation iCal, Airbnb API, Booking API ou channel manager.
- Scraping Airbnb, Booking ou autre plateforme tierce.
- Téléchargement automatique des photos depuis une URL Airbnb ou Booking.
- Copie automatique du titre, de la description, des prix, des avis ou disponibilités Airbnb.
- Gestion des disponibilités, calendrier, prix par nuit, minimum stay, dates bloquées.
- Création automatique de contrats, factures ou taxes de séjour.
- Avis voyageurs et notes publiques.
- Messagerie temps réel Tourist/Owner.
- Géocodage automatique public précis des logements sans validation Admin.
- Génération autonome des descriptions logement par Gemini sans texte source Owner.
- Pages programmatiques par combinaison artificielle de filtres SEO.
- Modification du fonctionnement privé `/le-logement`, sauf liens internes éventuels vers la fiche publique.

---

## Open Questions

| ID | Question | Owner | Due | Resolution |
|---|---|---|---|---|
| OQ-01 | La vitrine doit-elle être publique SEO, privée séjour ou les deux progressivement ? | Product Owner | 2026-06-12 | Les deux progressivement : vitrine publique SEO/GEO d'abord, expérience séjour privée conservée et enrichie plus tard. |
| OQ-02 | La localisation exacte doit-elle être affichée publiquement par défaut ? | Product Owner | 2026-06-12 | Non. Localisation approximative par défaut ; coordonnées précises seulement si `precise_location_public = true` après validation Admin. |
| OQ-03 | La réservation MyStay est-elle incluse dans ce chantier ? | Product Owner | 2026-06-12 | Non. Chantier séparé après la vitrine, avec paiement, disponibilités et synchronisation calendrier. |
| OQ-04 | Le lien Airbnb est-il une intégration API ? | Product Owner | 2026-06-12 | Non. Chantier 1 utilise uniquement un External Booking Link validé. |
| OQ-05 | Peut-on partir d'une URL Airbnb pour générer une fiche MyStay ? | Product Owner | 2026-06-12 | Oui, mais uniquement comme source déclarée : validation URL, détection plateforme, import manuel des photos/textes, confirmation de droits et réécriture MyStay en brouillon. Aucun scraping Airbnb. |
