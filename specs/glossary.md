# Glossaire — StayLocal

> Tout terme utilisé dans une spec, dans le code ou dans les tests
> doit être défini ici. En cas de doute, ce fichier fait foi.

---

## Entités métier

### City (Ville)
Ville ou commune référencée dans l'application. Identifiée par son nom et son code postal. Périmètre géographique de référence pour un Guide.

### Guide
Ensemble des contenus (catégories + POI) affichés pour une City donnée. Dans le MVP 1, un QR code pointe vers un Guide.

### POI (Point of Interest / Point d'Intérêt)
Lieu, établissement, activité ou service référencé dans l'application. Appartient à une City, une Category et une SubCategory. Contient : nom, adresse, coordonnées GPS, horaires, téléphone, site web, note, photos.

### Trail (Randonnée)
Parcours de randonnée publiable dans le Guide. Apparaît publiquement comme un POI de catégorie `Rando`, mais ses données spécialisées (tracé, distance, dénivelé, durée, difficulté, source) vivent dans un modèle dédié.

### Trail Candidate (Randonnée candidate)
Randonnée détectée par une source d'acquisition ou créée manuellement, mais pas encore publiée. Doit être revue par un Admin avant d'être visible dans le Guide.

### Trail Import Run (Run d'acquisition randonnée)
Exécution d'un pipeline d'acquisition randonnée pour une City, une zone et une ou plusieurs sources : site officiel, Overpass, IGN / Géoplateforme, Gemini descriptif, GPX ou saisie manuelle.

### Trail Detail (Détail randonnée)
Extension métier liée à un POI randonnée publié. Contient les données propres au parcours : difficulté, distance, dénivelé, durée, départ, géométrie, source et attribution.

### Trail Source (Source randonnée)
Référence de source utilisée pour une randonnée ou une randonnée candidate. Peut être un site officiel, Overpass, IGN / Géoplateforme, Gemini, un GPX ou une saisie manuelle. Chaque source précise son attribution et son usage : contenu, géométrie, dénivelé, description ou validation manuelle.

### Trail Navigation (Navigation randonnée)
Mode de guidage randonnée côté navigateur. Affiche une carte Mapbox outdoor, le tracé publié, le point de départ, la position GPS du Tourist après consentement et des indicateurs locaux de suivi du tracé.

### Trail Navigation Session (Session de navigation randonnée)
Session temporaire locale démarrée quand le Tourist clique "Démarrer ici" avec un GPS actif et une position fiable. Le clic "Commencer la rando" ouvre seulement le mode de navigation. En MVP 2, la session n'est pas persistée en base et s'arrête quand le Tourist clique "Stop" ou quitte le mode randonnée.

### Category (Catégorie)
Regroupement thématique de POI (ex : Manger, Explorer, Sport). Ne s'affiche que si elle contient au moins un POI visible.

### SubCategory (Sous-catégorie)
Subdivision d'une Category (ex : sous Manger → Restaurant, Café, Marché).

### Lodging (Logement)
Hébergement touristique associé à une City. Génère un QR code pointant vers le Guide de la ville.

### Owner Recommendation Comment (Commentaire de recommandation Owner)
Commentaire personnel facultatif qu'un Owner associe à un POI recommandé pour un Lodging précis. Il est visible uniquement dans les recommandations personnelles de ce logement.

### Lodging Public Profile (Profil public logement)
Extension publiable d'un Lodging utilisée pour la vitrine SEO publique. Contient les textes, photos, équipements, capacité, lien de réservation externe et règles de publication visibles hors mode séjour.

### Lodging Photo (Photo logement)
Image associée à un Lodging Public Profile. Chaque photo possède un ordre d'affichage, un texte alternatif et peut être marquée comme photo de couverture.

### Lodging Amenity (Équipement logement)
Équipement normalisé affichable sur une fiche logement publique, par exemple Wi-Fi, parking, cuisine, lave-linge ou terrasse.

### External Booking Link (Lien de réservation externe)
URL sortante vers une plateforme tierce de réservation, par exemple Airbnb ou Booking. Dans le chantier vitrine, ce lien ne crée pas de réservation MyStay.

### External Listing Source (Source d'annonce externe)
Annonce tierce fournie par l'Owner comme point de départ d'une fiche MyStay. MyStay peut stocker l'URL et détecter la plateforme, mais ne copie pas automatiquement les contenus tiers sans apport explicite de l'Owner.

### Content Rights Confirmation (Confirmation de droits contenus)
Attestation explicite de l'Owner indiquant qu'il possède les droits nécessaires ou les autorisations pour utiliser les photos, textes et informations qu'il importe dans MyStay.

### Lodging Rewrite Draft (Brouillon réécrit logement)
Proposition éditoriale générée ou préparée par MyStay à partir d'un texte fourni par l'Owner, afin de produire une version plus SEO, premium et locale. Le texte doit être relu et accepté avant publication.

### Contact Message (Message de contact)
Message envoyé par un Tourist depuis la page Contact d'un séjour. Il peut être destiné au Propriétaire ou à la Conciergerie, mais reste toujours visible dans l'inbox Super-admin globale.

### Analytics Snapshot
Agrégat journalier normalisé utilisé comme source de vérité d'un cockpit analytics. Il résume des métriques de visibilité, trafic, engagement ou conversion sur une période donnée sans exposer les événements bruts source par source.

### Analytics Source Sync
Trace d'une synchronisation entre StayLocal et une source analytics externe ou interne. Elle conserve au minimum la source, la période importée, le statut, le dernier succès et l'erreur éventuelle.

### Analytics Interaction Event
Événement first-party append-only capturant une interaction publique mesurable côté produit, par exemple un clic email hôte, un clic contact logement ou un clic réservation externe.

### Analytics Vercel Live Event
Événement récent issu d'un flux supporté Vercel Web Analytics, stocké côté serveur dans StayLocal pour alimenter le bloc `live` admin sans modifier les snapshots journaliers.

### Blog Article (Article de blog)
Contenu éditorial public géré par un Admin. Peut être global ou rattaché à une City optionnelle. Il possède un statut de publication, une catégorie, des tags, une photo de couverture, un contenu Markdown et des champs SEO.

### Blog Category (Catégorie blog)
Catégorie simple obligatoire utilisée pour organiser un Blog Article, par exemple guide local, hébergement, restaurants, activités ou conseils voyage.

### Blog Photo (Photo blog)
Image associée à un Blog Article. Une photo de couverture est obligatoire avant publication ; les photos de galerie sont optionnelles.

### Blog Generation Draft (Brouillon blog généré)
Suggestion éditoriale produite par Gemini depuis un brief Admin et des faits vérifiés. Elle doit être relue, acceptée et publiée manuellement par un Admin.

### Owner (Hébergeur)
Propriétaire ou gestionnaire d'un ou plusieurs Lodgings. Accède au dashboard hébergeur (MVP 2+).

### Merchant (Commerçant)
Professionnel local gérant une fiche POI revendiquée. Accède au dashboard commerçant (MVP 3+).

### Tourist (Touriste)
Utilisateur final. Dans le MVP 1, sans compte. Accède au Guide via QR code ou saisie manuelle.

### QR Code
Code QR généré pour une City (MVP 1). Redirige vers l'URL du Guide correspondant.

### Reservation (Réservation)
Demande de réservation d'un Tourist auprès d'un Merchant (MVP 4). Associée à une garantie Stripe.

### Subscription (Abonnement)
Contrat plateforme / Owner ou Merchant. Définit plan, dates, fonctionnalités. Statut `trial` la première année.

### Plan
Offre tarifaire (free, basic, pro, concierge pour hébergeurs ; free, verified, featured, booking pour commerçants).

---

## Termes techniques

### Gemini Fetch
Flux legacy ou descriptif utilisant Gemini API. En MVP2, Gemini ne découvre plus librement les POI généralistes : il rédige ou reformule une description depuis des données déjà vérifiées.

### Locale
Langue d'affichage supportée par StayLocal, représentée par un code court stable (`fr`, `en`, `it`, `es`, `nl`). Le français (`fr`) est la locale source canonique du contenu éditorial.

### Source Content
Texte canonique en français utilisé comme base des traductions. Une modification du Source Content invalide uniquement les traductions du champ concerné.

### Translatable Field
Champ texte explicitement déclaré comme traduisible par une spec. Les champs non déclarés traduisibles ne doivent jamais être envoyés à un prestataire de traduction.

### Content Translation
Version traduite d'un Translatable Field pour une Locale cible. Elle conserve le hash du Source Content qui a servi à la produire afin de détecter les contenus obsolètes.

### Markdown Content
Contenu texte structuré en Markdown, stocké en base puis rendu publiquement après nettoyage afin d'empêcher l'exécution de HTML ou scripts dangereux.

### Source Hash
Empreinte déterministe calculée à partir du texte source normalisé d'un Translatable Field. Elle permet de savoir si une traduction est encore synchronisée avec le contenu français.

### Translation Job
Tâche serveur asynchrone qui traduit ou retraduit un Translatable Field pour une Locale cible. Elle porte les tentatives, erreurs et verrous nécessaires au traitement incrémental.

### GEO (Generative Engine Optimization)
Optimisation éditoriale et technique visant à rendre les pages publiques compréhensibles, citables et utiles dans les expériences de recherche générative. Dans MyStay, GEO reste une extension du SEO : contenu visible, factuel, structuré et indexable.

### Google Analytics 4 (GA4)
Source analytics orientée site et événements, utilisée dans StayLocal pour mesurer sessions, engagement et micro-conversions côté client, uniquement après consentement explicite quand la mesure dépend d'un script tiers dans le navigateur.

### Google Search Console
Source de métriques d'acquisition SEO depuis Google Search : impressions, clics, CTR, position moyenne, requêtes et pages d'atterrissage.

### VacationRental Structured Data
Balisage JSON-LD basé sur Schema.org `VacationRental`, utilisé uniquement quand une fiche logement publique contient les champs requis et que les informations balisées sont visibles sur la page.

### Google Places Primary Acquisition
Mode d'acquisition des POI généralistes où Google Places fournit les candidats d'existence, Mapbox confirme les coordonnées, le site officiel enrichit le contenu et le Super-admin valide avant publication.

### Cache TTL
Durée de validité d'un résultat Gemini en base. Passé ce délai, un nouveau Gemini Fetch est déclenché.

### Map Load
Chargement d'une carte Mapbox dans le navigateur. Unité de facturation Mapbox (50 000 gratuits/mois).

### Consent Banner
Composant public qui demande au visiteur son choix analytics avant d'activer des scripts ou événements tiers côté client. Son état minimal est `unset`, `accepted` ou `refused`.

### Soft Delete
Suppression logique : champ `deleted_at` renseigné. Aucune suppression physique dans ce projet.

### Server Action
Fonction Next.js App Router exécutée côté serveur, appelée depuis un composant React. Utilisée pour toutes les mutations.

### Server Component
Composant React rendu côté serveur (défaut App Router). Utilisé pour les pages sans interactivité.

### Client Component
Composant React rendu côté client (`"use client"`). Uniquement si la spec requiert de l'interactivité.

### Vercel Analytics
Source de trafic et d'usage web fournie par Vercel, utilisée pour des métriques comme visiteurs, pages vues, referrers et dimensions web récentes.

### Vercel Speed Insights
Source de performance web fournie par Vercel, basée notamment sur les Core Web Vitals, utilisée pour surveiller l'expérience réelle des visiteurs.

### Vercel Drain
Mécanisme supporté par Vercel pour envoyer des événements de logs, traces ou analytics vers une destination HTTP configurée côté projet ou équipe.

---

## Statuts

| Domaine | Valeurs |
|---|---|
| Spec | `draft` \| `review` \| `approved` \| `implemented` \| `deprecated` |
| Réservation | `pending` \| `confirmed` \| `refused` \| `cancelled` \| `no_show` |
| Abonnement | `trial` \| `active` \| `past_due` \| `cancelled` |
| Rôles | `tourist` \| `owner` \| `merchant` \| `admin` |

---

## Abréviations

| Abréviation | Signification |
|---|---|
| POI | Point of Interest |
| SDD | Spec Driven Development |
| ADR | Architecture Decision Record |
| DAT | Dossier d'Architecture Technique |
| TTL | Time To Live |
| MVP | Minimum Viable Product |
| AC | Acceptance Criterion |
| BR | Business Rule |

---

## Notes de design — Mockups v1

> Charte visuelle extraite des mockups fournis (Mai 2026).
> Claude Code doit s'y référer pour la génération des composants.

| Token | Valeur |
|---|---|
| Fond principal | `#FAF9F6` |
| Noir texte | `#121212` |
| Or accent | `#A68E69` |
| Vert forêt | `#455E4C` |
| Largeur mobile | `max-w-[430px]` |
| Hero image | `h-[450px]` plein largeur |
| Sheet radius | `rounded-t-[40px] -mt-8` |
| Boutons flottants | glassmorphism `glass` |
| Icônes | Lucide React |
| Titres | serif italic |

### Mockup favoris.html
Reporté en **MVP 2**. Nécessite un compte Tourist ou localStorage persistant.
Fichier de référence : à placer dans `docs/DAT/diagrams/mockups/` lors de la spec MVP 2.
