# Recommandations — Créer une expérience type TheFork pour votre site

## Objectif

Créer une fonctionnalité de réservation de restaurants inspirée du modèle TheFork, sans copier TheFork, sans scraper ses données et sans utiliser son identité de marque.

L’objectif est de construire une plateforme propriétaire permettant :

- aux visiteurs de trouver un restaurant local ;
- de consulter les disponibilités en temps réel ;
- de réserver une table ;
- aux restaurateurs de gérer leurs réservations ;
- à l’administrateur du site de piloter les établissements ;
- au super administrateur de gérer la plateforme, les rôles, les commissions et les règles globales.

---

## Référence fonctionnelle : ce que fait une plateforme type TheFork

Une plateforme type TheFork repose sur quatre couches principales :

```txt
Utilisateur final
→ recherche restaurant
→ consultation fiche
→ disponibilité temps réel
→ réservation
→ confirmation
→ avis éventuel

Restaurateur
→ gestion des tables
→ gestion des horaires
→ gestion des réservations
→ gestion des offres
→ gestion clients
→ statistiques

Admin plateforme
→ validation restaurants
→ modération
→ support
→ suivi réservations
→ gestion éditoriale
→ suivi des commissions

Super admin
→ configuration globale
→ rôles et permissions
→ plans commerciaux
→ commissions
→ facturation
→ sécurité
→ logs d’audit
```

---

## Points observés sur TheFork

TheFork met en avant :

- une plateforme de réservation de restaurants ;
- des avis vérifiés ;
- des offres promotionnelles ;
- une disponibilité en temps réel ;
- un outil professionnel appelé TheFork Manager ;
- la centralisation des réservations ;
- la gestion des tables et du plan de salle ;
- la réduction des no-shows ;
- des outils marketing ;
- des statistiques de performance ;
- des intégrations avec plusieurs canaux de réservation.

Pour votre site, il faut reprendre la logique métier, mais créer votre propre modèle :

```txt
Réservation locale
→ restaurants partenaires
→ dashboard restaurateur
→ validation admin
→ commission ou abonnement
→ avis et fidélisation
```

---

## Ne pas faire

Ne pas scraper TheFork.

Raisons :

- risque juridique ;
- violation potentielle des conditions d’utilisation ;
- données non propriétaires ;
- blocage technique possible ;
- aucune valeur différenciante ;
- dépendance fragile à une plateforme concurrente.

La bonne stratégie est de construire une base propriétaire de restaurants partenaires.

---

## Positionnement recommandé pour votre site

Votre site peut se positionner comme une plateforme locale premium :

```txt
Découvrir les meilleures adresses locales
→ réserver une table
→ bénéficier d’offres locales
→ centraliser les demandes
→ donner de la visibilité aux restaurateurs indépendants
```

### Différenciation possible

- sélection locale éditorialisée ;
- restaurants validés manuellement ;
- recommandations par quartier ou station ;
- expérience mobile très simple ;
- approche premium, locale, touristique ;
- dashboard restaurateur plus simple que les gros outils ;
- offre adaptée aux petites structures ;
- réservation sans friction ;
- option sans commission pour les réservations directes ;
- commission uniquement sur réservation générée par la plateforme.

---

## Architecture globale recommandée

```txt
Frontend public
→ recherche restaurants
→ fiches restaurants
→ réservation
→ avis

Dashboard restaurateur
→ gestion restaurant
→ horaires
→ tables
→ disponibilités
→ réservations
→ offres
→ clients
→ statistiques

Admin plateforme
→ validation restaurants
→ modération
→ support
→ réservations globales
→ contenus SEO
→ campagnes locales

Super admin
→ rôles
→ plans
→ commissions
→ facturation
→ sécurité
→ logs
→ paramètres globaux
```

---

## Stack technique recommandée

```txt
Next.js App Router
TypeScript
Tailwind CSS
shadcn/ui
Framer Motion
Prisma
PostgreSQL
PostGIS si besoin géographique avancé
Stripe / Stripe Connect
Resend ou Nodemailer
Zod
React Hook Form
NextAuth ou Auth.js
Upload images via Cloudinary, S3 ou Cloudflare R2
Cron jobs pour rappels et no-show
```

### Pourquoi PostgreSQL plutôt que MongoDB pour cette partie

Pour la réservation restaurant, PostgreSQL est fortement recommandé car le modèle contient beaucoup de relations :

```txt
Restaurant
→ Tables
→ Services
→ Disponibilités
→ Réservations
→ Clients
→ Offres
→ Paiements
→ Commissions
```

PostgreSQL permet aussi de mieux gérer :

- les contraintes ;
- les transactions ;
- les conflits de disponibilité ;
- les jointures ;
- les statistiques ;
- les historiques ;
- les exports comptables.

MongoDB reste possible, mais PostgreSQL + Prisma est plus robuste pour cette brique.

---

## Rôles utilisateurs

### 1. Utilisateur public

Peut :

- rechercher un restaurant ;
- consulter une fiche ;
- filtrer par cuisine, lieu, prix, note, disponibilité ;
- réserver une table ;
- modifier ou annuler sa réservation ;
- recevoir une confirmation ;
- déposer un avis après validation ;
- créer un compte client facultatif.

### 2. Restaurateur

Peut :

- gérer son établissement ;
- gérer ses horaires ;
- gérer ses services ;
- gérer ses tables ;
- accepter ou bloquer des créneaux ;
- consulter ses réservations ;
- marquer une réservation comme honorée, annulée ou no-show ;
- gérer ses offres ;
- consulter ses statistiques ;
- répondre aux avis ;
- exporter ses réservations ;
- gérer son équipe.

### 3. Admin plateforme

Peut :

- valider les restaurants ;
- modérer les fiches ;
- modérer les avis ;
- gérer les réservations problématiques ;
- gérer les catégories ;
- gérer les villes et zones ;
- gérer les pages SEO ;
- gérer les campagnes ;
- suivre les commissions ;
- assister les restaurateurs.

### 4. Super admin

Peut :

- gérer tous les rôles ;
- gérer les permissions ;
- gérer les plans commerciaux ;
- gérer les règles de commission ;
- gérer Stripe Connect ;
- configurer les emails ;
- configurer les paramètres globaux ;
- consulter les logs d’audit ;
- gérer les feature flags ;
- désactiver un compte ;
- accéder aux métriques globales.

---

## Pages publiques recommandées

```txt
/
→ page d’accueil locale

/restaurants
→ listing restaurants

/restaurants/[slug]
→ fiche restaurant

/restaurants/cuisine/[slug]
→ listing par type de cuisine

/restaurants/ville/[slug]
→ listing par ville

/reservation/[restaurantSlug]
→ tunnel de réservation

/reservation/confirmation
→ confirmation réservation

/mes-reservations
→ espace client

/avis/[reservationId]
→ dépôt d’avis après repas
```

---

## Fiche restaurant

Chaque fiche doit contenir :

```txt
Nom du restaurant
Slug
Description courte
Description longue
Adresse
Ville
Coordonnées GPS
Téléphone
Email professionnel
Site web
Photos
Type de cuisine
Prix moyen
Horaires
Services disponibles
Capacité
Offres actives
Menu ou carte
Équipements
Conditions d’annulation
Avis
Note moyenne
Disponibilités temps réel
Bouton réserver
```

### Structure UX recommandée

```txt
Hero image
→ nom
→ cuisine
→ ville
→ note
→ bouton réserver

Section réservation sticky
→ date
→ heure
→ nombre de couverts
→ disponibilités

Section description
→ histoire du lieu
→ spécialités
→ ambiance

Section informations pratiques
→ adresse
→ horaires
→ prix moyen
→ accès
→ stationnement

Section avis
→ note moyenne
→ commentaires vérifiés

Section restaurants similaires
→ même ville
→ même cuisine
→ même gamme de prix
```

---

## Tunnel de réservation

### Étapes recommandées

```txt
1. Choix du nombre de personnes
2. Choix de la date
3. Choix de l’heure disponible
4. Saisie des coordonnées
5. Acceptation des conditions
6. Confirmation
7. Email client
8. Email restaurateur
9. Ajout au dashboard restaurateur
```

### Champs client

```txt
Prénom
Nom
Email
Téléphone
Nombre de personnes
Date
Heure
Message optionnel
Allergies ou demandes spéciales
Consentement RGPD
```

Attention : les allergies peuvent être considérées comme des données sensibles. Il faut les traiter avec prudence, les conserver uniquement si nécessaire et éviter de les exposer inutilement.

---

## Statuts de réservation

```txt
PENDING
→ réservation créée, en attente de confirmation si validation manuelle

CONFIRMED
→ réservation confirmée

SEATED
→ client arrivé / table attribuée

COMPLETED
→ repas terminé

CANCELLED_BY_CUSTOMER
→ annulée par le client

CANCELLED_BY_RESTAURANT
→ annulée par le restaurant

NO_SHOW
→ client non venu

EXPIRED
→ créneau expiré sans confirmation
```

### Machine d’état recommandée

```txt
PENDING → CONFIRMED
PENDING → CANCELLED_BY_RESTAURANT
CONFIRMED → SEATED
CONFIRMED → CANCELLED_BY_CUSTOMER
CONFIRMED → CANCELLED_BY_RESTAURANT
CONFIRMED → NO_SHOW
SEATED → COMPLETED
```

---

# Dashboard restaurateur

## Objectif

Permettre au restaurateur de piloter son établissement sans complexité.

Le dashboard restaurateur doit être simple, mobile-first, utilisable pendant le service et orienté action rapide.

---

## Routes recommandées

```txt
/dashboard/restaurant
/dashboard/restaurant/reservations
/dashboard/restaurant/calendar
/dashboard/restaurant/floor-plan
/dashboard/restaurant/tables
/dashboard/restaurant/opening-hours
/dashboard/restaurant/offers
/dashboard/restaurant/profile
/dashboard/restaurant/photos
/dashboard/restaurant/reviews
/dashboard/restaurant/customers
/dashboard/restaurant/analytics
/dashboard/restaurant/team
/dashboard/restaurant/settings
/dashboard/restaurant/billing
```

---

## 1. Vue d’ensemble

La page d’accueil restaurateur doit afficher :

```txt
Réservations du jour
Nombre de couverts attendus
Prochain service
Taux d’occupation
No-show récents
Demandes spéciales
Avis récents
Offres actives
Alertes importantes
```

### Exemple de blocs

```txt
Aujourd’hui
→ 24 couverts
→ 8 réservations
→ 2 demandes spéciales

Ce soir
→ 18 couverts
→ 6 tables occupées
→ 3 créneaux restants

Alertes
→ 1 réservation à confirmer
→ 1 avis à traiter
→ 1 photo manquante sur la fiche
```

---

## 2. Gestion des réservations

Le restaurateur doit pouvoir :

- voir les réservations par jour ;
- filtrer par service ;
- filtrer par statut ;
- rechercher un client ;
- confirmer une réservation ;
- annuler une réservation ;
- déplacer une réservation ;
- modifier le nombre de couverts ;
- ajouter une note interne ;
- marquer no-show ;
- marquer client arrivé ;
- marquer service terminé.

### Vue recommandée

```txt
Vue liste
→ pratique sur mobile

Vue calendrier
→ pratique pour la semaine

Vue service
→ pratique pendant le déjeuner ou le dîner

Vue plan de salle
→ pratique pour placer les tables
```

---

## 3. Gestion des tables

Le restaurateur doit pouvoir définir :

```txt
Nom de table
Nombre de places
Zone de salle
Statut
Priorité
Combinable ou non
```

### Exemple

```txt
Table 1
→ 2 places
→ Salle principale

Table 2
→ 4 places
→ Terrasse

Table 3 + Table 4
→ combinables
→ capacité 8 personnes
```

---

## 4. Plan de salle

Fonctionnalité recommandée en MVP avancé.

### MVP simple

```txt
Liste des tables
→ capacité
→ disponibilité
→ affectation manuelle
```

### Version avancée

```txt
Plan de salle visuel
→ drag and drop
→ attribution réservation
→ couleur par statut
→ zones : salle, terrasse, étage
```

### Couleurs de statut

```txt
Libre
Occupée
Réservée
Arrivée
Retard
No-show
Bloquée
```

---

## 5. Horaires et services

Le restaurateur doit gérer :

```txt
Jours d’ouverture
Jours de fermeture
Services
Heures de début
Heures de fin
Durée moyenne d’un repas
Capacité par créneau
Délai minimum de réservation
Délai maximum de réservation
Fermetures exceptionnelles
```

### Exemple

```txt
Lundi
→ fermé

Mardi à samedi
→ déjeuner : 12:00 - 14:00
→ dîner : 19:00 - 22:00

Dimanche
→ déjeuner uniquement
```

---

## 6. Disponibilités

La disponibilité ne doit pas être seulement une heure ouverte.

Elle doit prendre en compte :

```txt
Horaires
Services
Nombre de tables
Capacité
Réservations existantes
Durée estimée du repas
Tables combinables
Fermetures exceptionnelles
Blocages manuels
```

### Règle métier

```txt
Une réservation est disponible si :
- le restaurant est ouvert ;
- le service existe ;
- le créneau respecte les délais ;
- une table compatible est libre ;
- la capacité maximale n’est pas dépassée ;
- aucune fermeture exceptionnelle n’est active.
```

---

## 7. Offres et promotions

Le restaurateur peut créer des offres.

### Types d’offres

```txt
Pourcentage de réduction
Menu spécial
Offre déjeuner
Offre heures creuses
Offre groupe
Offre événement local
```

### Champs d’une offre

```txt
Titre
Description
Type
Valeur
Dates de validité
Jours applicables
Services applicables
Nombre minimum de couverts
Nombre maximum de couverts
Conditions
Statut
```

### Exemple

```txt
-20% sur le déjeuner
Applicable du mardi au vendredi
Hors boissons
Réservation obligatoire
```

---

## 8. Profil restaurant

Le restaurateur doit pouvoir modifier :

```txt
Nom
Description
Adresse
Téléphone
Email
Site web
Type de cuisine
Prix moyen
Photos
Logo
Menu PDF
Réseaux sociaux
Conditions de réservation
Informations d’accès
```

Les modifications importantes peuvent être soumises à validation admin.

---

## 9. Avis clients

Le restaurateur doit pouvoir :

- consulter les avis ;
- répondre aux avis ;
- signaler un avis abusif ;
- voir la note moyenne ;
- filtrer par note ;
- identifier les réservations liées.

Règle recommandée :

```txt
Un utilisateur ne peut laisser un avis que s’il a une réservation marquée COMPLETED.
```

---

## 10. Clients et CRM simple

Le restaurateur peut voir :

```txt
Nom client
Email masqué ou complet selon consentement
Téléphone si nécessaire à la réservation
Nombre de visites
Dernière réservation
No-show éventuels
Préférences
Notes internes
```

### Attention RGPD

Le restaurateur ne doit voir que les données nécessaires à la gestion de la réservation.

---

## 11. Statistiques restaurateur

Indicateurs recommandés :

```txt
Nombre de réservations
Nombre de couverts
Taux d’occupation
Taux d’annulation
Taux de no-show
Réservations par canal
Réservations par jour
Réservations par service
Revenu estimé
Performance des offres
Note moyenne
Avis reçus
```

---

## 12. Équipe restaurateur

Le propriétaire du restaurant peut inviter des membres.

### Rôles internes

```txt
OWNER
→ accès complet au restaurant

MANAGER
→ réservations, horaires, offres, avis

STAFF
→ lecture réservations, statut arrivée, notes internes

ACCOUNTING
→ factures, commissions, exports
```

---

# Admin plateforme

## Objectif

L’admin plateforme gère la qualité, les restaurants, le support et l’exploitation quotidienne.

---

## Routes recommandées

```txt
/admin
/admin/restaurants
/admin/restaurants/pending
/admin/restaurants/[id]
/admin/reservations
/admin/users
/admin/reviews
/admin/offers
/admin/categories
/admin/locations
/admin/support
/admin/seo
/admin/content
/admin/commissions
/admin/reports
```

---

## 1. Validation des restaurants

L’admin doit pouvoir :

- consulter les demandes d’inscription ;
- vérifier les informations ;
- approuver un restaurant ;
- rejeter une demande ;
- demander des corrections ;
- suspendre une fiche ;
- publier ou dépublier un restaurant.

### Statuts restaurant

```txt
DRAFT
PENDING_REVIEW
APPROVED
PUBLISHED
REJECTED
SUSPENDED
ARCHIVED
```

---

## 2. Modération des contenus

L’admin doit contrôler :

```txt
Photos
Descriptions
Menus
Offres
Avis
Réponses restaurateur
Signalements
```

---

## 3. Gestion des réservations globales

L’admin doit voir :

```txt
Toutes les réservations
Réservations annulées
No-shows
Réservations litigieuses
Réservations avec acompte
Réservations liées à une offre
```

Actions possibles :

```txt
Rechercher
Filtrer
Exporter
Annuler
Corriger
Contacter restaurant
Contacter client
```

---

## 4. Gestion des catégories

L’admin peut gérer :

```txt
Types de cuisine
Ambiances
Gammes de prix
Labels
Équipements
Villes
Quartiers
Zones touristiques
Tags SEO
```

Exemples :

```txt
Cuisine française
Bistronomique
Italien
Montagne
Terrasse
Vue panoramique
Restaurant familial
Groupe
Romantique
```

---

## 5. Gestion SEO

L’admin doit pouvoir créer ou éditer :

```txt
Pages villes
Pages catégories
Pages cuisine + ville
Balises title
Meta descriptions
Textes éditoriaux
FAQ
Données structurées
URLs canoniques
Redirections
```

### Routes SEO recommandées

```txt
/restaurants/saint-gervais-les-bains
/restaurants/chamonix
/restaurants/megeve
/restaurants/cuisine/italien
/restaurants/cuisine/francais
/restaurants/saint-gervais-les-bains/terrasse
```

---

## 6. Support

L’admin doit disposer d’un module support :

```txt
Tickets restaurateurs
Tickets clients
Signalements d’avis
Problèmes de réservation
Demandes de remboursement
Demandes de modification
```

---

## 7. Commissions et facturation

L’admin peut consulter :

```txt
Réservations commissionnables
Montant des commissions
Statut de facturation
Factures mensuelles
Restaurants en retard de paiement
Plan commercial appliqué
```

---

# Super admin

## Objectif

Le super admin contrôle la plateforme au niveau global.

Il ne gère pas seulement les contenus : il gère le système.

---

## Routes recommandées

```txt
/super-admin
/super-admin/users
/super-admin/roles
/super-admin/permissions
/super-admin/plans
/super-admin/commissions
/super-admin/billing
/super-admin/stripe
/super-admin/settings
/super-admin/feature-flags
/super-admin/audit-logs
/super-admin/security
/super-admin/integrations
/super-admin/system-health
```

---

## 1. Gestion des rôles et permissions

Le super admin doit pouvoir configurer finement les droits.

### Rôles globaux

```txt
SUPER_ADMIN
ADMIN
RESTAURANT_OWNER
RESTAURANT_MANAGER
RESTAURANT_STAFF
CUSTOMER
SUPPORT
ACCOUNTING
```

### Permissions

```txt
restaurant.read
restaurant.create
restaurant.update
restaurant.delete
restaurant.approve
restaurant.suspend

reservation.read
reservation.update
reservation.cancel
reservation.export

review.read
review.moderate
review.reply

billing.read
billing.update

user.read
user.update
user.disable

settings.update
audit.read
```

---

## 2. Plans commerciaux

Le super admin peut créer plusieurs plans.

### Exemple

```txt
FREE_DIRECT
→ réservation directe sans commission
→ visibilité limitée

STANDARD
→ visibilité plateforme
→ commission par réservation

PRO
→ visibilité renforcée
→ analytics avancées
→ offres promotionnelles

ENTERPRISE
→ multi-établissements
→ support prioritaire
→ exports avancés
```

---

## 3. Règles de commission

La plateforme peut appliquer différentes règles :

```txt
Commission fixe par couvert
Commission fixe par réservation
Commission en pourcentage
Abonnement mensuel
Modèle hybride
Commission uniquement sur nouveau client
Commission uniquement sur réservation issue de la plateforme
Aucune commission sur widget direct
```

### Recommandation MVP

Pour démarrer :

```txt
Option 1 :
Abonnement mensuel simple

Option 2 :
Commission fixe par réservation confirmée

Option 3 :
Gratuit au lancement puis passage en abonnement
```

Éviter une logique de commission trop complexe au MVP.

---

## 4. Stripe / Paiements

Stripe peut servir à :

```txt
Abonnements restaurateurs
Acomptes client
Empreinte bancaire anti no-show
Paiement d’événements
Facturation des commissions
Remboursements
```

### Avec Stripe Connect

Utile si la plateforme encaisse pour le compte des restaurants.

```txt
Client paie
→ plateforme
→ commission prélevée
→ reversement restaurant
```

### Sans Stripe Connect

Plus simple au MVP.

```txt
Réservation gratuite
→ commission facturée au restaurateur en fin de mois
```

---

## 5. Logs d’audit

Chaque action sensible doit être journalisée.

### Exemples

```txt
Restaurant approuvé
Restaurant suspendu
Réservation annulée par admin
Commission modifiée
Rôle utilisateur modifié
Connexion super admin
Export de données
Accès à une fiche client
```

### Modèle recommandé

```ts
type AuditLog = {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
};
```

---

## 6. Feature flags

Les feature flags permettent d’activer progressivement :

```txt
Paiement acompte
Plan de salle visuel
Avis clients
Offres promotionnelles
Stripe Connect
Widget externe
Programme fidélité
Automatisation no-show
```

---

# Modèle de données recommandé

## User

```ts
type User = {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: "SUPER_ADMIN" | "ADMIN" | "RESTAURANT_OWNER" | "RESTAURANT_MANAGER" | "RESTAURANT_STAFF" | "CUSTOMER";
  status: "ACTIVE" | "DISABLED" | "INVITED";
  createdAt: Date;
  updatedAt: Date;
};
```

---

## Restaurant

```ts
type Restaurant = {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  cuisineTypes: string[];
  priceRange: "€" | "€€" | "€€€" | "€€€€";
  averagePrice?: number;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  lat?: number;
  lng?: number;
  phone?: string;
  email?: string;
  website?: string;
  images: string[];
  status: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "PUBLISHED" | "SUSPENDED" | "ARCHIVED";
  planId?: string;
  createdAt: Date;
  updatedAt: Date;
};
```

---

## RestaurantTable

```ts
type RestaurantTable = {
  id: string;
  restaurantId: string;
  name: string;
  capacity: number;
  zone?: string;
  isCombinable: boolean;
  isActive: boolean;
};
```

---

## OpeningHour

```ts
type OpeningHour = {
  id: string;
  restaurantId: string;
  dayOfWeek: number;
  isClosed: boolean;
  lunchStart?: string;
  lunchEnd?: string;
  dinnerStart?: string;
  dinnerEnd?: string;
};
```

---

## ServiceSlot

```ts
type ServiceSlot = {
  id: string;
  restaurantId: string;
  name: "LUNCH" | "DINNER" | "BRUNCH" | "CUSTOM";
  startTime: string;
  endTime: string;
  slotIntervalMinutes: number;
  averageMealDurationMinutes: number;
  maxCovers?: number;
};
```

---

## Reservation

```ts
type Reservation = {
  id: string;
  restaurantId: string;
  customerId?: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  partySize: number;
  date: string;
  time: string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "SEATED"
    | "COMPLETED"
    | "CANCELLED_BY_CUSTOMER"
    | "CANCELLED_BY_RESTAURANT"
    | "NO_SHOW"
    | "EXPIRED";
  specialRequest?: string;
  internalNote?: string;
  assignedTableIds: string[];
  source: "PLATFORM" | "WIDGET" | "PHONE" | "WALK_IN" | "ADMIN";
  offerId?: string;
  createdAt: Date;
  updatedAt: Date;
};
```

---

## Offer

```ts
type Offer = {
  id: string;
  restaurantId: string;
  title: string;
  description: string;
  type: "PERCENTAGE" | "FIXED_MENU" | "EVENT" | "CUSTOM";
  value?: number;
  validFrom: Date;
  validTo: Date;
  applicableDays: number[];
  applicableServices: string[];
  minPartySize?: number;
  maxPartySize?: number;
  conditions?: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "EXPIRED";
};
```

---

## Review

```ts
type Review = {
  id: string;
  restaurantId: string;
  reservationId: string;
  customerId: string;
  rating: number;
  comment?: string;
  status: "PENDING" | "PUBLISHED" | "REJECTED" | "REPORTED";
  restaurantReply?: string;
  createdAt: Date;
};
```

---

## CommissionRule

```ts
type CommissionRule = {
  id: string;
  planId: string;
  type: "PER_COVER" | "PER_BOOKING" | "PERCENTAGE" | "MONTHLY_SUBSCRIPTION" | "HYBRID";
  amount?: number;
  percentage?: number;
  appliesTo: "PLATFORM_ONLY" | "ALL_CONFIRMED" | "NEW_CUSTOMERS_ONLY";
  isActive: boolean;
};
```

---

# API routes recommandées

## Public

```txt
GET /api/restaurants
GET /api/restaurants/[slug]
GET /api/restaurants/search
GET /api/restaurants/nearby
GET /api/restaurants/[slug]/availability
POST /api/reservations
GET /api/reservations/[id]
PATCH /api/reservations/[id]/cancel
POST /api/reviews
```

---

## Restaurateur

```txt
GET /api/dashboard/restaurant/summary
GET /api/dashboard/restaurant/reservations
PATCH /api/dashboard/restaurant/reservations/[id]
POST /api/dashboard/restaurant/reservations/[id]/confirm
POST /api/dashboard/restaurant/reservations/[id]/no-show
POST /api/dashboard/restaurant/reservations/[id]/seat
POST /api/dashboard/restaurant/reservations/[id]/complete

GET /api/dashboard/restaurant/tables
POST /api/dashboard/restaurant/tables
PATCH /api/dashboard/restaurant/tables/[id]
DELETE /api/dashboard/restaurant/tables/[id]

GET /api/dashboard/restaurant/opening-hours
PATCH /api/dashboard/restaurant/opening-hours

GET /api/dashboard/restaurant/offers
POST /api/dashboard/restaurant/offers
PATCH /api/dashboard/restaurant/offers/[id]

GET /api/dashboard/restaurant/reviews
POST /api/dashboard/restaurant/reviews/[id]/reply

GET /api/dashboard/restaurant/analytics
```

---

## Admin

```txt
GET /api/admin/restaurants
GET /api/admin/restaurants/pending
POST /api/admin/restaurants/[id]/approve
POST /api/admin/restaurants/[id]/reject
POST /api/admin/restaurants/[id]/suspend

GET /api/admin/reservations
GET /api/admin/reviews
POST /api/admin/reviews/[id]/moderate

GET /api/admin/users
GET /api/admin/reports
GET /api/admin/commissions
```

---

## Super admin

```txt
GET /api/super-admin/users
PATCH /api/super-admin/users/[id]/role
POST /api/super-admin/users/[id]/disable

GET /api/super-admin/plans
POST /api/super-admin/plans
PATCH /api/super-admin/plans/[id]

GET /api/super-admin/commission-rules
POST /api/super-admin/commission-rules
PATCH /api/super-admin/commission-rules/[id]

GET /api/super-admin/audit-logs
GET /api/super-admin/settings
PATCH /api/super-admin/settings

GET /api/super-admin/system-health
```

---

# Calcul de disponibilité

## Principe

La disponibilité doit être calculée côté serveur.

Ne jamais se fier uniquement au frontend.

### Entrées

```txt
restaurantId
date
partySize
time souhaitée
durée moyenne du repas
tables actives
réservations confirmées
fermetures exceptionnelles
blocages manuels
```

### Sortie

```txt
available: true / false
suggestedSlots: ["12:00", "12:30", "13:00"]
availableTables: [...]
reason if unavailable
```

### Pseudo-logique

```txt
1. Vérifier que le restaurant est publié
2. Vérifier que le jour est ouvert
3. Identifier le service correspondant
4. Générer les créneaux
5. Charger les réservations existantes
6. Identifier les tables compatibles
7. Exclure les tables déjà prises
8. Retourner les créneaux disponibles
```

---

# Notifications

## Emails client

```txt
Confirmation de réservation
Modification de réservation
Annulation de réservation
Rappel avant réservation
Demande d’avis après repas
```

## Emails restaurateur

```txt
Nouvelle réservation
Annulation
Modification
Rappel service du jour
Résumé quotidien
```

## Notifications dashboard

```txt
Réservation à confirmer
Client en retard
No-show à traiter
Avis reçu
Offre expirée
Profil incomplet
```

---

# Gestion des no-shows

## MVP simple

```txt
Le restaurateur marque manuellement NO_SHOW.
Le client reçoit éventuellement un email.
La statistique est enregistrée.
```

## Version avancée

```txt
Rappel automatique par email/SMS.
Empreinte bancaire optionnelle.
Acompte obligatoire pour certains restaurants.
Score de fiabilité client.
Politique d’annulation par restaurant.
```

---

# Widget de réservation directe

Un widget permet au restaurant d’intégrer la réservation sur son propre site.

## Exemple

```html
<script src="https://votre-site.fr/widget/booking.js" data-restaurant-id="restaurant_id"></script>
```

## Avantages

```txt
Le restaurant reçoit des réservations directes
La plateforme collecte les données
Le restaurateur garde son dashboard
Le site augmente sa valeur B2B
```

## Règle commerciale possible

```txt
Réservation venue du site plateforme
→ commission possible

Réservation venue du widget direct restaurant
→ sans commission ou incluse dans l’abonnement
```

---

# Sécurité

## Règles obligatoires

```txt
Authentification robuste
RBAC strict
Vérification restaurantId sur toutes les routes restaurateur
Validation Zod sur toutes les entrées
Protection CSRF si nécessaire
Rate limiting sur réservation
Logs d’audit sur actions sensibles
Aucune donnée sensible exposée inutilement
Séparation admin / restaurateur / super admin
```

---

## Vérification d’accès restaurateur

Un restaurateur ne doit jamais pouvoir accéder aux données d’un autre restaurant.

Chaque route doit vérifier :

```txt
user.id
user.role
restaurant.ownerId
restaurantTeam.userId
permission
```

---

# RGPD

## Données personnelles traitées

```txt
Nom
Prénom
Email
Téléphone
Historique de réservation
Avis
Demandes spéciales
```

## Règles recommandées

```txt
Consentement clair
Politique de confidentialité
Durée de conservation définie
Droit de suppression
Droit d’accès
Export des données
Suppression ou anonymisation des anciennes réservations
Masquage des données sensibles côté staff
```

---

# MVP recommandé

## MVP 1 — Réservation simple

```txt
Objectif :
Permettre à un utilisateur de réserver une table dans un restaurant partenaire.

Fonctionnalités :
- listing restaurants
- fiche restaurant
- horaires simples
- formulaire de réservation
- email client
- email restaurateur
- dashboard restaurateur basique
- admin validation restaurant
```

---

## MVP 2 — Dashboard restaurateur complet

```txt
Objectif :
Permettre au restaurateur de gérer son activité.

Fonctionnalités :
- calendrier réservations
- gestion des statuts
- gestion des tables
- horaires et services
- profil restaurant
- photos
- offres simples
- statistiques basiques
```

---

## MVP 3 — Admin plateforme

```txt
Objectif :
Permettre au site de gérer plusieurs restaurants.

Fonctionnalités :
- validation restaurants
- modération avis
- suivi réservations
- gestion catégories
- gestion villes
- pages SEO
- support
```

---

## MVP 4 — Super admin et monétisation

```txt
Objectif :
Piloter le modèle économique.

Fonctionnalités :
- rôles avancés
- plans commerciaux
- commissions
- facturation Stripe
- logs d’audit
- paramètres globaux
- feature flags
```

---

## MVP 5 — Fonctions avancées

```txt
Objectif :
Se rapprocher d’une plateforme complète.

Fonctionnalités :
- acompte Stripe
- empreinte bancaire
- widget externe
- plan de salle visuel
- CRM client
- programme fidélité
- campagnes email
- avis vérifiés
- analytics avancées
```

---

# Recommandation UX

## Public

Design :

```txt
Mobile-first
Recherche rapide
Filtres clairs
Carte optionnelle
Fiches visuelles
Bouton réserver sticky
Confirmation rassurante
```

Filtres utiles :

```txt
Ville
Type de cuisine
Prix
Disponibilité
Note
Offre
Terrasse
Groupe
Famille
Romantique
```

---

## Dashboard restaurateur

Design :

```txt
Interface sobre
Actions rapides
Peu de texte
Statuts visibles
Mobile/tablette compatible
Vue service du jour prioritaire
```

Boutons prioritaires :

```txt
Confirmer
Annuler
Client arrivé
No-show
Modifier
Ajouter note
```

---

## Admin

Design :

```txt
Tableaux filtrables
Recherche globale
Statuts visibles
Actions groupées
Exports CSV
Historique des actions
```

---

## Super admin

Design :

```txt
Interface système
Permissions très claires
Alertes sécurité
Logs détaillés
Configurations verrouillées
Double confirmation sur actions critiques
```

---

# SEO / GEO

## Pages importantes

```txt
/restaurants
/restaurants/saint-gervais-les-bains
/restaurants/chamonix
/restaurants/megeve
/restaurants/cuisine/francaise
/restaurants/cuisine/italienne
/restaurants/terrasse-saint-gervais
/restaurants/romantique-chamonix
```

## Données structurées

Utiliser schema.org :

```txt
Restaurant
LocalBusiness
AggregateRating
Review
Offer
PostalAddress
OpeningHoursSpecification
BreadcrumbList
FAQPage
```

---

# Critères d’acceptation

## Côté utilisateur

```txt
Un utilisateur peut chercher un restaurant.
Un utilisateur peut consulter une fiche.
Un utilisateur peut voir les créneaux disponibles.
Un utilisateur peut réserver.
Un utilisateur reçoit une confirmation.
Le restaurateur reçoit une notification.
```

## Côté restaurateur

```txt
Le restaurateur peut voir ses réservations.
Le restaurateur peut confirmer ou annuler.
Le restaurateur peut modifier ses horaires.
Le restaurateur peut gérer ses tables.
Le restaurateur ne voit que ses propres données.
```

## Côté admin

```txt
L’admin peut valider un restaurant.
L’admin peut suspendre une fiche.
L’admin peut modérer un avis.
L’admin peut suivre toutes les réservations.
```

## Côté super admin

```txt
Le super admin peut gérer les rôles.
Le super admin peut gérer les plans.
Le super admin peut configurer les commissions.
Le super admin peut consulter les logs d’audit.
```

---

# Sources à consulter

## TheFork

- https://about.thefork.com/
- https://www.theforkmanager.com/en/
- https://www.theforkmanager.com/en/restaurant-management-software
- https://www.theforkmanager.com/en/restaurant-booking-management
- https://www.theforkmanager.com/en/restaurant-software-price
- https://support.theforkmanager.com/

## Technique

- https://nextjs.org/docs
- https://www.prisma.io/docs
- https://authjs.dev/
- https://stripe.com/docs
- https://ui.shadcn.com/
- https://zod.dev/
- https://schema.org/Restaurant

---

# Conclusion

Pour votre site, la bonne approche est de créer une plateforme locale de réservation restaurant avec une architecture propriétaire.

Le modèle recommandé :

```txt
Site public
→ découverte restaurants
→ réservation simple

Dashboard restaurateur
→ gestion opérationnelle

Admin plateforme
→ contrôle qualité et support

Super admin
→ configuration globale et monétisation
```

La valeur ne vient pas seulement du formulaire de réservation.

Elle vient de la combinaison :

```txt
restaurants locaux validés
+ fiches SEO propres
+ réservation simple
+ dashboard restaurateur utile
+ données propriétaires
+ visibilité locale
+ modèle économique clair
```
