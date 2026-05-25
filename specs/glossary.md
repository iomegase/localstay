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
Session temporaire locale ouverte quand le Tourist clique "Commencer la rando". En MVP 2, elle n'est pas persistée en base et s'arrête quand le Tourist quitte ou termine le mode randonnée.

### Category (Catégorie)
Regroupement thématique de POI (ex : Manger, Explorer, Sport). Ne s'affiche que si elle contient au moins un POI visible.

### SubCategory (Sous-catégorie)
Subdivision d'une Category (ex : sous Manger → Restaurant, Café, Marché).

### Lodging (Logement)
Hébergement touristique associé à une City. Génère un QR code pointant vers le Guide de la ville.

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
Action de récupérer et structurer les POI d'une City + Category via Gemini API. Résultat mis en cache selon Cache TTL.

### Cache TTL
Durée de validité d'un résultat Gemini en base. Passé ce délai, un nouveau Gemini Fetch est déclenché.

### Map Load
Chargement d'une carte Mapbox dans le navigateur. Unité de facturation Mapbox (50 000 gratuits/mois).

### Soft Delete
Suppression logique : champ `deleted_at` renseigné. Aucune suppression physique dans ce projet.

### Server Action
Fonction Next.js App Router exécutée côté serveur, appelée depuis un composant React. Utilisée pour toutes les mutations.

### Server Component
Composant React rendu côté serveur (défaut App Router). Utilisé pour les pages sans interactivité.

### Client Component
Composant React rendu côté client (`"use client"`). Uniquement si la spec requiert de l'interactivité.

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
