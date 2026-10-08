# Spec — 067 Refonte UX de la partie Admin

## Metadata

```yaml
id: 067-admin-ux-redesign
title: "Refonte ergonomique et visuelle du cockpit Super-Admin"
status: review
mvp: 2
owner: "Product Owner"
created_at: 2026-10-06
updated_at: 2026-10-06
depends_on:
  - 016-dashboard-superadmin
  - 017-admin-taxonomy
  - 018-poi-acquisition-pipeline
  - 022-admin-poi-management
  - 024-contact-messages
  - 030-admin-analytics-dashboard
  - 048-admin-local-landing-management
  - 062-google-reviews
bounded_context: admin-ui
amends:
  - "016 US-01 (layout et navigation admin), US-02 (page cockpit /admin)"
```

---

## Context

Le back-office Super-Admin (`/admin/*`) a grandi de manière incrémentale à mesure de l'ajout de nouvelles capacités métier (POI, Randonnées, Avis Google, Journal, Acquisition, Landing pages, etc.). 

Cette croissance rapide a créé plusieurs irritants ergonomiques majeurs :

1. **Navigation saturée et à plat** : 15 liens alignés verticalement dans la sidebar sans hiérarchie ni catégories thématiques, obligeant l'utilisateur à chercher visuellement parmi une longue liste.
2. **Éléments factices / placeholders obsolètes** : Le header desktop intègre des résidus statiques issus d'un ancien template (champ de recherche factice sans moteur de recherche, cloche de notification inactive avec point rouge fixe, sélecteur de langue « EN » alors que l'interface est en français, profil statique « John Doe » avec un avatar Dicebear externe).
3. **Navigation mobile dégradée** : Sur mobile (375px), la navigation consiste en une ligne de 15 boutons en défilement horizontal (`overflow-x-auto`), très peu ergonomique et sans vue d'ensemble.
4. **Accueil (`/admin`) pollué par des éléments non fonctionnels** : Présence d'un CTA « View Details » inactif, d'un encart « Illustration » vide, d'une boîte « Billing / Purchase Now » factice (rappelant qu'il n'y a pas de facturation en MVP 2), et d'un basculeur « Weekly / Monthly » inopérant sur le graphique des scans QR.

Cette spec formalise la refonte UX du shell et de la page d'accueil du Super-Admin afin de fournir une interface professionnelle, sobre, fluide et orientée efficacité opérationnelle.

---

## Glossary References

- **Admin** : membre de l'équipe StayLocal authentifié avec `role = admin`.
- **MerchantClaim** : demande de revendication d'un POI par un commerçant local.
- **POI** : fiche publique d'un point d'intérêt touristique.
- **Run d'acquisition** : exécution de pipeline d'import de données externes.
- **Contact Message** : message voyageur envoyé depuis un séjour.
- **Cockpit** : page de synthèse `/admin`.

---

## User Stories

### US-01 — Navigation latérale hiérarchisée et catégorisée (Desktop)

**As an** Admin  
**I want to** parcourir une navigation latérale organisée en rubriques thématiques claires  
**So that** je retrouve instantanément les modules selon mon activité (pilotage, contenu, acquisition, marketing, configuration)

#### Acceptance Criteria

- **AC-01-01**: Given l'affichage desktop (`md+`), When le layout s'affiche, Then les 15 modules sont organisés en 5 rubriques thématiques explicites avec sous-titres :
  1. **Pilotage** : Vue globale (`/admin`), Analytics SEO/GEO (`/admin/analytics`), Revendications (`/admin/merchant-claims`).
  2. **Offre & Tourisme** : POI par ville (`/admin/pois`), Nouveau POI (`/admin/pois/new`), Randonnées (`/admin/trails`), Sorties culturelles (`/admin/events`), Logements (`/admin/lodgings`).
  3. **Acquisition & Territoire** : Acquisition POI (`/admin/poi-acquisition`), Avis Google (`/admin/google-reviews`), Villes (`/admin/cities`), Taxonomie (`/admin/taxonomy`).
  4. **Marketing & Éditorial** : Journal (`/admin/blog`), Landing pages (`/admin/landing-pages`).
  5. **Plateforme** : Utilisateurs (`/admin/users`).
- **AC-01-02**: Given l'élément de menu « Revendications », When des revendications `pending` existent, Then un badge numérique ou indicateur d'attention réel est affiché à côté de l'intitulé.
- **AC-01-03**: Given la sidebar desktop en mode replié (`isCollapsed = true`), When l'Admin la consulte, Then les icônes restent centrées, distinctes, et chaque élément affiche son intitulé au survol ou dans un état compact clair.
- **AC-01-04**: Given la sidebar desktop, When l'Admin clique sur le bouton de bascule replier/déplier, Then la transition est fluide et conserve l'accès au bouton de déconnexion au bas du menu.

---

### US-02 — Header desktop nettoyé et contextualisé

**As an** Admin  
**I want to** un en-tête épuré affichant le contexte de navigation et mon identité réelle  
**So that** l'espace soit professionnel et débarrassé de composants trompeurs

#### Acceptance Criteria

- **AC-02-01**: Given le header desktop, When la page s'affiche, Then les éléments factices suivants sont totalement retirés :
  - le champ de recherche factice sans backend ;
  - la fausse icône de cloche de notification ;
  - le sélecteur factice « EN » ;
  - le profil fictif « John Doe » et l'avatar Dicebear externe.
- **AC-02-02**: Given le header desktop, When une page admin est consultée, Then le header affiche un indicateur contextuel discret (titre de la section ou fil d'Ariane court ex: `Admin › Villes`).
- **AC-02-03**: Given le header desktop, When l'Admin est authentifié, Then son adresse email ou son statut `Super-Admin` est affiché dans un badge sobre avec un accès direct à la déconnexion ou au profil.

---

### US-03 — Navigation mobile réactive via Drawer (Mobile)

**As an** Admin sur smartphone  
**I want to** accéder à l'ensemble des modules via un menu tiroir (Drawer / Sheet)  
**So that** je n'ai plus à faire défiler horizontalement 15 badges tronqués

#### Acceptance Criteria

- **AC-03-01**: Given un écran mobile (`< 768px`), When le layout admin s'affiche, Then le bandeau horizontal de 15 badges à défilement est remplacé par une barre d'en-tête compacte avec le logo MyStay, le titre de la section courante, et un bouton d'ouverture de menu (icône menu / hamburger).
- **AC-03-02**: Given un écran mobile, When l'Admin clique sur le bouton menu, Then un tiroir latéral (Sheet / Dialog accessible) s'ouvre avec la liste complète des rubriques thématiques et leurs liens.
- **AC-03-03**: Given le menu mobile ouvert, When l'Admin clique sur un lien de navigation ou sur le bouton fermer, Then le tiroir se ferme et la page ciblée se charge.
- **AC-03-04**: Given le tiroir mobile ouvert, When l'Admin le consulte, Then le bouton de déconnexion est accessible au bas du tiroir.

---

### US-04 — Cockpit d'accueil opérationnel et orienté action (`/admin`)

**As an** Admin  
**I want to** une page d'accueil concentrée sur les indicateurs réels, les alertes et les raccourcis d'action  
**So that** je gagne du temps sur mes tâches de pilotage quotidiennes

#### Acceptance Criteria

- **AC-04-01**: Given la page `/admin`, When elle s'affiche, Then le bandeau supérieur présente un titre sobre sans bouton fictif « View Details » ni carré d'illustration vide.
- **AC-04-02**: Given la page `/admin`, When elle s'affiche, Then les 6 KPI (Villes actives, POI actifs, Owners actifs, Merchants actifs, Revendications pending, Scans QR 30j) sont mis en avant avec une hiérarchie visuelle claire.
- **AC-04-03**: Given la carte du graphique des scans QR, When elle s'affiche, Then le faux sélecteur « Weekly / Monthly » est retiré au profit d'un intitulé explicite (« Activité QR des 30 derniers jours »).
- **AC-04-04**: Given le bloc facturation factice (« Billing / Purchase Now »), When la page s'affiche, Then il est remplacé par un panneau utile « Raccourcis opérationnels » donnant accès direct à :
  - Lancer une acquisition POI (`/admin/poi-acquisition`)
  - Créer un POI manuellement (`/admin/pois/new`)
  - Gérer la taxonomie (`/admin/taxonomy`)
  - Modérer les avis Google (`/admin/google-reviews`)
- **AC-04-05**: Given les alertes d'exploitation (revendications pending et messages de contact récents), When elles sont présentes, Then elles sont clairement identifiables dans des cartes dédiées avec lien direct vers leur traitement.

---

## Business Rules

- **BR-01**: Toutes les URLs de routes existantes sous `/admin/*` demeurent strictement inchangées.
- **BR-02**: La vérification d'autorisation `getPageAdmin()` et la protection d'accès aux routes API restent la source de vérité.
- **BR-03**: Aucun composant d'interface factice (« mock », données fictives non interactives) ne doit subsister dans l'interface finale.
- **BR-04**: Le badge d'alerte pour les revendications de commerçants (`MerchantClaim`) doit refléter le compte réel de revendications en attente.
- **BR-05**: L'ergonomie doit être pensée pour une utilisation de terrain mobile (375px+) tout en offrant une densité adaptée aux grands écrans desktop (1280px+).
- **BR-06**: L'implémentation doit respecter la charte MyStay, Tailwind CSS et Shadcn/ui (Radix UI pour le Drawer/Sheet mobile).

---

## Data Model

Cette spec n'introduit aucun nouveau modèle de base de données et ne modifie aucun modèle existant.

---

## API Contract

Cette spec ne crée aucune nouvelle route API. Les Server Actions et Server Components existants continuent d'alimenter les vues avec les contrats existants.

---

## UI Behaviour

### Structure Globale & Thème
- Thème **Glassmorphism / Apple-like** : Fonds gris clair (`#D6DADB`), panneaux translucides (`backdrop-blur`), bordures blanches subtiles (`border-white/50`), et ombres douces internes/externes.
- Rayons de courbure généreux (`rounded-[24px]` à `rounded-[32px]`) pour les grands conteneurs.

### Sidebar Double (Desktop `md+`)
1. **Dock Principal (Extrême gauche)** : 
   - Barre flottante sombre et étroite (`bg-[#1e1e1e]`, largeur ~60px).
   - Contient uniquement des icônes pour les grandes applications/rubriques (Dashboard, Base Touristique, Data, Réglages).
2. **Panneau Secondaire (Milieu)** :
   - Panneau translucide rattaché au contenu principal.
   - Affiche le profil administrateur en haut.
   - Contient la navigation textuelle détaillée de la rubrique sélectionnée.

### Main Content (Cockpit)
- Typographie : Très épurée, titres fins et gigantesques pour les KPI (`font-light text-[72px]`).
- Cartes KPI : Effet "Frosted Glass" (`background: rgba(227, 229, 228, 0.5)` + bordure blanche).
- Les boutons d'action et badges de statut utilisent des effets d'enfoncement (Inner shadow).

### Mobile Shell (`< md`)
- Barre supérieure avec menu hamburger.
- Le dock principal sombre devient une bottom-bar sur mobile, et le panneau secondaire devient un tiroir (Sheet) coulissant.

---

## Acceptance Criteria Summary

| ID | Description | Type de test |
|---|---|---|
| AC-01-01 | Architecture à double sidebar (Dock primaire sombre + Menu secondaire glassmorphism) | Integration |
| AC-01-02 | Effets de flou (backdrop-blur) appliqués sur les panneaux translucides | Unit |
| AC-02-01 | Cartes KPI du dashboard avec typographie allégée (`font-light`) et ombres douces | Integration |
| AC-03-01 | Menu mobile adaptant le dock en bottom-bar et le menu secondaire en tiroir | Integration |

---

## Out of Scope

- Modification des formulaires internes complexes (ils seront simplement wrappés dans le nouveau layout Glassmorphism).
- Ajout de nouveaux modèles de facturation ou Stripe dans le Super-Admin.

---

## Open Questions

- **OQ-01 — Technologie CSS Glassmorphism** : Validez-vous l'utilisation intensive des filtres CSS (`backdrop-filter: blur()`) sachant que cela peut avoir un léger impact de performance sur les très vieux navigateurs ?
- **OQ-02 — Séparation du menu** : Le passage à un "Dock principal + Menu secondaire" implique de diviser nos 15 liens actuels. Êtes-vous d'accord pour que le Dock principal n'affiche que 4 icônes (Accueil, Catalogue, Opérations, Paramètres) qui rechargent le menu secondaire ?
