# Spec — 054 Private Guide Stay Redesign

## Metadata

```yaml
id: 054-private-guide-stay-redesign
title: "Refonte du guide privé voyageur (handoff « Le 305 », option B)"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-02
updated_at: 2026-10-03
depends_on:
  - 012-guide-customization
  - 024-contact-messages
  - 045-public-demo-private-guide-reference
  - 050-private-guide-card-design
bounded_context: guide-app
design_reference: "handoff_README_mystay.md + handoff_prototype_mystay.html (fournis par le PO le 2026-10-02)"
implementation_gate: "Décisions du Product Owner du 2026-10-02 : option B ; 1-A, 2-A, 3-A, 4-A, 5-B ; ne pas modifier le design de la carte"
```

## Context

Le Product Owner a fourni un handoff haute fidélité pour le guide privé
voyageur (`/sejour`). Il retient l'option B : refonte visuelle + nouvelles
données d'arrivée + signal « Je suis arrivé·e / parti·e ». Le chat conciergerie,
les conditions montagne/remontées et l'écran « Se déplacer » sont exclus faute
de backend ou de source de données fiable. L'écran Carte existant ne change pas.

Décisions :

1. En-tête sans nom du voyageur ni dates (aucune réservation n'est connue) :
   « Bienvenue au [logement] » + heures d'arrivée / départ.
2. « Je suis arrivé·e » / « Je suis parti·e » : événement anonyme horodaté par
   logement + e-mail à `bonjour@mystay.city`, avec limitation anti-abus.
3. Code de boîte à clés : champ dédié, masqué par défaut, bouton « Afficher ».
4. Guide en français uniquement (l'anglais fera l'objet d'une spec dédiée
   s'appuyant sur la spec 027).
5. Navigation basse remplacée par 4 onglets : Séjour · Guide · Carte · Aide.

Remplace : l'accueil privé à boutons (034 AC-01-03/04, carte GPS comprise), le
hub logement et ses onglets Accès / Infos / Équipements / Départ (036, 039, 050
AC-01-03/08/09) et la vue « Guide logement » de la démo (045 AC-01-07..13). La
les contacts « Infos pratiques » sont déplacés dans Aide et le point de tri
est accessible depuis le Guide logement (amendement PO du 2026-10-03) ; la vidéo de présentation (044) reste sous les tuiles.

## Glossary References

- **Lodging**, **Guide**, **Tourist**, **Owner**, **QR Code** (glossary.md).
- **Étape d'arrivée** : une `LodgingArrivalInstruction` typée.
- **Événement de séjour** : signal anonyme « arrivé » ou « parti » émis depuis le guide.

## User Stories

### US-01 — Naviguer dans le nouveau guide

**As a** voyageur  
**I want to** retrouver mon séjour, le guide local, la carte et l'aide en un geste  
**So that** je trouve l'information sans chercher

#### Acceptance Criteria

- **AC-01-01**: Given le guide privé, When il s'affiche, Then une barre basse fixe
  propose 4 onglets égaux **Séjour · cœur · Carte · Aide** (icônes 24 px, cœur
  28 px, trait 1,8 ; libellés 11 px/600). Le cœur sans texte visible porte le
  nom accessible « Coups de cœur » et ouvre la liste des lieux. La barre blanche
  aux coins supérieurs droits porte une ombre diffuse vers le haut ; une
  pastille gris clair glisse et s’étire entre les onglets en 350 ms. Toutes les
  couleurs de la barre sont neutres (aucun rose). Le cœur est rempli lorsqu’il
  est actif. Les animations sont désactivées avec `prefers-reduced-motion`.
  « Carte » ouvre la carte existante, inchangée. (Amendement PO 2026-10-03.)
- **AC-01-02**: Given l'onglet Séjour, When il s'affiche, Then il présente le logo,
  un hero photo (300 px, rayon 28 px, dégradé sombre) avec la pastille rose
  « Votre guide de séjour », « Bienvenue au » + nom du logement en serif
  italique, la commune, et 3 stats (Voyageurs, Chambres, Surface) quand elles
  sont connues ; puis 4 tuiles 2×2 : **Arrivée** (fond `#111111`, « Dès [heure] »),
  **Wi‑Fi**, **Guide logement**, **Départ** (« n sur m faits »).
- **AC-01-03**: Given l'onglet Séjour, When des lieux sont mis en avant, Then un
  carrousel « Nos coups de cœur » (cartes 160 px, réduites de 20 % le 2026-10-02) affiche les lieux sélectionnés
  et « Tout voir » ouvre l'onglet Guide. *(Amendé par le PO le 2026-10-02 :
  cartes photo de l'onglet Guide — statut d'ouverture, bouton carte, temps de
  trajet spec 057 — et catégories Urgences et Mobilité exclues du carrousel.)*
- **AC-01-04**: Given la tuile Wi‑Fi, When on la touche, Then une feuille basse
  (rayon haut 28 px, voile `rgba(17,17,17,.4)`) montre le réseau et le mot de
  passe ; « Copier le mot de passe » copie la valeur et affiche « Copié ✓ » sur
  fond rose pendant 1,8 s ; un tap sur le voile ferme la feuille.
- **AC-01-05**: Given l'onglet Aide, When il s'affiche, Then il présente la carte
  **Conciergerie MyStay** avec le bouton « Écrire » (vue contact existante,
  spec 024), le bloc **Urgences** (numéros en dur de la spec 050, cliquables
  `tel:`) et le bloc **Adresse** du logement avec « Ouvrir dans Maps ».

### US-02 — Arriver sans aide

**As a** voyageur  
**I want to** suivre un parcours d'arrivée étape par étape  
**So that** j'entre dans le logement sans appeler personne

#### Acceptance Criteria

- **AC-02-01**: Given des étapes d'arrivée, When on ouvre l'écran Arrivée, Then
  des onglets d'étapes (grille, boutons ≥ 64 px, pastille numérotée ou ✓ si
  validée) et une carte d'étape montrent : médias (vidéo 200 px avec bouton
  lecture, photos), titre, introduction, repères clé/valeur,
  sous-étapes numérotées et encart « Le conseil MyStay » ; aucun compteur
  « Étape X sur N » n’est affiché (amendement PO du 2026-10-03).
- **AC-02-05** *(ajout PO du 2026-10-02)*: Given les médias d'une étape, When
  elle s'affiche, Then la première photo est l'image principale (pleine
  largeur) et les autres photos puis la vidéo sont disposées dessous en grille
  de 4 colonnes (vignettes compactes) ; sans photo, la vidéo occupe l'image
  principale.
- **AC-02-06** *(ajout PO du 2026-10-02)*: Given la visionneuse de photos, When
  on glisse (doigt ou souris) ou utilise les flèches du clavier, Then la photo
  voisine s'affiche ; les boutons fléchés ne sont visibles qu'avec une souris.
- **AC-02-02**: Given une étape de type `address`, When elle s'affiche, Then
  l'adresse est montrée avec « Ouvrir dans Maps » et « Copier l'adresse »
  (→ « Copié ✓ » 1,6 s).
- **AC-02-03**: Given une étape de type `access` et un code de boîte à clés
  renseigné, When elle s'affiche, Then le code apparaît masqué (`••••`) avec le
  bouton rose « Afficher le code » / « Masquer ».
- **AC-02-04**: Given la navigation entre étapes, When on avance, Then « Retour »
  (blanc bordé) et l'action principale (`#111111`) sont affichés ; sur l'étape
  `access` l'action principale devient « Je suis arrivé·e ! » (rose) ; à la
  dernière étape seul « Retour » reste.

### US-03 — Prévenir la conciergerie

**As a** conciergerie MyStay  
**I want to** savoir quand les voyageurs arrivent et partent  
**So that** j'organise le ménage et l'accueil

#### Acceptance Criteria

- **AC-03-01**: Given un voyageur dans le guide, When il touche « Je suis
  arrivé·e ! », Then `POST /api/guide/stay-events` enregistre un événement
  `arrived` pour le logement de la session, un e-mail « Arrivée voyageur —
  [logement] » part à `bonjour@mystay.city`, et l'écran affiche « Bienvenue au
  [logement] ! La conciergerie a été prévenue de votre arrivée. ».
- **AC-03-02**: Given l'écran Départ, When le voyageur touche « Je suis
  parti·e », Then un événement `departed` est enregistré, un e-mail « Départ
  voyageur — [logement] » est envoyé, et le bouton est remplacé par une carte
  noire « Merci d'avoir séjourné au [logement] ! » ; le bouton est `#111111`
  tant que la checklist n'est pas complète (aide « Encore n tâche(s) — vous
  pouvez quand même partir ») et rose quand elle l'est (« La conciergerie sera
  prévenue »).
- **AC-03-03**: Given un événement du même type déjà enregistré pour ce logement
  il y a moins de 10 minutes, When un nouveau signal arrive, Then l'API répond
  `201` sans créer de doublon ni renvoyer d'e-mail.
- **AC-03-04**: Given aucune session de logement valide, When l'API est appelée,
  Then elle répond `401 UNAUTHORIZED` au format d'erreur standard.
- **AC-03-05**: Given un échec d'envoi de l'e-mail, When l'événement est créé,
  Then l'échec est journalisé sans bloquer la réponse.

### US-04 — Consulter le guide logement et préparer le départ

#### Acceptance Criteria

- **AC-04-01**: Given l'écran Guide logement, When il s'affiche, Then la section
  « Équipements » liste les blocs pratiques (vignette 76 px, titre, texte) et la
  section « Règles » est un accordéon (un seul élément ouvert, signe +/− rose).
- **AC-04-02**: Given l'écran Départ, When il s'affiche, Then il montre l'heure
  de départ, une barre de progression rose de 8 px et « n sur m faits », et la
  checklist (cases 24 px, cochées : fond rose, texte barré).

### US-05 — Renseigner les nouvelles données

#### Acceptance Criteria

- **AC-05-01**: Given l'éditeur des instructions d'arrivée (Owner et Admin),
  When on édite une étape, Then on peut choisir son type (Adresse, Accès,
  Garage, Local à skis, Autre), saisir une introduction, des sous-étapes
  (titre + détail), des repères (libellé + valeur) et un conseil.
- **AC-05-04** *(ajout PO du 2026-10-02)*: Given l'admin sur l'édition d'un
  logement, When il ouvre la carte « Accès voyageurs », Then il peut saisir,
  afficher/masquer, modifier ou effacer le code de boîte à clés (1 à 20
  caractères) ; le code reste exposé au seul guide privé (BR-03), sur l'étape
  de type « Accès ».
- **AC-05-03** *(ajout PO du 2026-10-02)*: Given l'éditeur d'une étape, When on
  gère ses médias, Then on peut désigner l'image principale (« Définir comme
  image principale ») et l'ajout est bloqué au-delà de 5 médias (1 image
  principale + 4 photos ou vidéo) ; l'API refuse au-delà (`400`). L'envoi
  accepte jusqu'à 4 images sélectionnées en une fois, dans la limite restante.
- **AC-05-02**: Given la personnalisation du logement, When on saisit le code de
  boîte à clés (1 à 20 caractères), Then il est enregistré et exposé
  uniquement au guide privé de ce logement.

### US-06 — Démo publique

- **AC-06-01**: Given la démo publique (spec 045), When elle s'ouvre, Then elle
  reprend la nouvelle navigation et les nouveaux écrans avec les données de
  démonstration ; elle n'émet aucun événement de séjour (boutons « arrivé /
  parti » affichent seulement la confirmation).

## Business Rules

- **BR-01**: Aucun nom de voyageur, aucune date de séjour n'est affiché ni stocké.
- **BR-02**: L'événement de séjour ne contient aucune donnée personnelle :
  logement, type, horodatage.
- **BR-03**: Le code de boîte à clés n'est jamais exposé hors du guide privé
  du logement (ni API publique, ni démo, ni site marketing).
- **BR-04**: L'écran Carte et ses composants ne sont pas modifiés.
- **BR-05**: Les numéros d'urgence restent ceux de la spec 050 (112).
- **BR-06**: Les distances et coordonnées ne sont jamais inventées : elles
  viennent des données existantes.
- **BR-07**: Soft delete pour toutes les nouvelles entités.

## Data Model

```prisma
enum ArrivalStepKind {
  address
  access
  garage
  ski
  custom
}

model LodgingArrivalInstruction {
  // champs existants inchangés
  kind     ArrivalStepKind @default(custom)
  tip      String?
  substeps Json?   // [{ title: string, detail: string }]
  facts    Json?   // [{ label: string, value: string }]
}

model LodgingCustomization {
  // champs existants inchangés
  key_box_code String?
}

enum StayEventType {
  arrived
  departed
}

model LodgingStayEvent {
  id         String        @id @default(uuid())
  created_at DateTime      @default(now())
  updated_at DateTime      @updatedAt
  deleted_at DateTime?
  lodging_id String
  lodging    Lodging       @relation(fields: [lodging_id], references: [id])
  type       StayEventType

  @@index([lodging_id, type, created_at])
}
```

## API Contract

```yaml
/api/guide/stay-events:
  post:
    summary: Signal anonyme d'arrivée ou de départ depuis le guide privé
    requestBody:
      content:
        application/json:
          schema:
            type: object
            required: [type]
            properties:
              type: { type: string, enum: [arrived, departed] }
    responses:
      '201':
        content:
          application/json:
            schema:
              type: object
              properties:
                status: { type: string, enum: [recorded] }
      '400': { description: VALIDATION_ERROR }
      '401': { description: UNAUTHORIZED (aucune session de logement) }
```

Le logement est lu depuis la session du guide (cookie `lodging_id`), jamais
depuis le corps de la requête.

## UI Behaviour

Tokens du handoff : rose `#DB2777`, rose foncé `#BE185D`, rose pâle `#FCE7F3`,
encre `#111111`, fond `#F6F6F4`, texte secondaire `#697386`, inactif `#9CA3AF`,
bordures `rgba(17,17,17,.15)`, séparateurs `rgba(17,17,17,.08)`. Police Plus
Jakarta Sans (déjà en place), titre logement en serif italique. Marges écran
20 px, cibles tactiles ≥ 44 px. Écrans secondaires (Arrivée, Guide logement,
Départ, fiche lieu) : entrée `slideIn` 280 ms, bouton retour rond 44 px.

## Acceptance Criteria

| Criterion | Test type |
|---|---|
| AC-01-01 | integration |
| AC-01-02 | integration |
| AC-01-03 | integration |
| AC-01-04 | integration |
| AC-01-05 | integration |
| AC-02-01 | integration |
| AC-02-02 | integration |
| AC-02-03 | integration |
| AC-02-04 | integration |
| AC-03-01 | contract + integration |
| AC-03-02 | integration |
| AC-03-03 | contract |
| AC-03-04 | contract |
| AC-03-05 | contract |
| AC-04-01 | integration |
| AC-04-02 | integration |
| AC-05-01 | integration |
| AC-05-02 | contract |
| AC-06-01 | integration |

## Out of Scope

- Chat conciergerie temps réel, bouton « Appeler » (aucun numéro de
  conciergerie en base).
- Conditions montagne, prévisions, état des remontées.
- Écran « Se déplacer » (aucune source de contenu).
- Bilingue FR/EN.
- Nom du voyageur, dates de séjour, réservations.
- Toute modification de l'écran Carte.
- Checklist de départ éditable (la liste fixe actuelle est conservée).

## Open Questions

Aucune.

## Amendement approuvé — Carte recyclage (2026-10-04)

Demande explicite du Product Owner : la carte « Trouver le point de recyclage »
reprend la présentation horizontale de « Se déplacer » (pastille d'icône à
gauche, texte central, action à droite). Le bouton visible « Ouvrir dans Maps »
est remplacé par une icône Lucide `Eye` à droite, à la position du chevron de
la carte transport. Le lien conserve sa destination Maps et son nom accessible
« Ouvrir dans Maps ». La démo conserve l'absence de lien externe.
Cette précision complète AC-04-01, sans modification des données.

## Amendement approuvé — Statistique voyageurs (2026-10-02)

Sur l'accueil du guide, les statistiques « Voyageurs », « Chambres » et
« Surface » affichent leurs valeurs sans libellé visible. Pour « Voyageurs » et
« Chambres », les icônes Lucide React `UsersRound` et `BedDouble` sont alignées
horizontalement à droite du nombre. La surface affiche uniquement sa valeur.
Le contenu est centré dans chaque carte. Les libellés restent accessibles aux
lecteurs d'écran. Décisions explicites du Product Owner.

## Amendement approuvé — Cohérence des cartes Séjour (2026-10-03)

Demande explicite du Product Owner : les textes des cartes Arrivée, Wi-Fi,
Guide, Départ, vidéo et Se déplacer partagent le tracking `-0.025em`.
Les cartes utilisent une marge interne horizontale de 12 px, une pastille
de 44 px et un espace icône/texte de 10 px : « Se déplacer » et « Guide »
sont alignés à gauche. Les icônes principales mesurent 28 px avec un trait
de 2,2 ; les chevrons des cartes pleine largeur mesurent 20 px.
Cette précision complète AC-01-02 et le contrat de l'entrée spec 055 AC-01-01,
pour le guide privé et la démo qui réutilise ces composants.

Précision PO du 2026-10-03 : la pastille de l’icône vidéo utilise également
un fond clair `#EEF1F4` et un rayon de 16 px, identiques aux tuiles Séjour.

Précision PO du 2026-10-03 — Navigation basse : hauteur hors zone de sécurité
réduite de 10 %, de 92 px à 83 px (contenu 55 px, padding haut 10 px, bas 18 px).
La zone de sécurité iOS reste ajoutée à cette hauteur et les cibles tactiles
restent supérieures à 44 px.

Précision PO du 2026-10-03 — Navigation basse : nouvelle réduction de 5 %,
de 83 px à 79 px hors zone de sécurité (arrondi au pixel). Le contenu mesure
55 px avec des marges verticales symétriques de 12 px. Chaque bouton occupe
toute la hauteur du contenu et centre verticalement son groupe icône/libellé ;
le cœur seul est centré sur le même axe.

## Amendement approuvé — Aide et guide logement (2026-10-03)

Demande explicite du Product Owner, captures fournies comme contrat visuel :

- **AC-01-05** : Aide a un fond blanc. Le bloc « Infos pratiques » du guide
  logement est déplacé dans Aide : une pastille grise de titre, les cartes
  Urgences 112 et Conciergerie (numéro existant), avec icônes rondes rouge et
  ardoise et numéro à droite. Le contact « Écrire » est conservé.
- Le titre « Adresse » devient une pastille grise. L'adresse est une carte
  blanche arrondie avec ombre, rue puis code postal/ville sur deux lignes,
  bouton de copie rose à droite, identique à Arrivée. Le bouton indépendant
  « Ouvrir dans Maps » reprend la capture : pill blanche, icône carte dans
  un cercle sombre, texte sombre en majuscules.
- **AC-04-01** : Guide logement ne contient plus le bloc de contacts
  « Infos pratiques ». Il affiche les contenus pratiques de type `recycle`
  et un bloc « Point de tri » pour trouver le point de recyclage : lien
  `trashLocation` si URL HTTP(S), sinon recherche Maps de l'indication
  renseignée avec la ville, sinon recherche « point de tri <ville> ».
  Aucune ligne par poubelle. Il affiche aussi l'adresse du logement et le
  bouton Maps suivant le même contrat que dans Aide.
- La démo réutilise le rendu mais ne propose aucun lien externe Maps ou tel.
  La copie d'adresse reste locale, sans persistance. Aucun changement de
  données, API ou schéma.

## Amendement approuvé — Menu minimal (2026-10-03)

Le PO valide la maquette `exec-b300c7ab-d360-4066-a6c0-404014850718.png`.
Le menu privé et la démo présentent uniquement « Les logements » (vue lodgings)
et « Journal » (vue blog). « Nous contacter » est retiré du menu ; l'aide
reste disponible via la navigation basse. Aucun logo, photo, icône de
destination, flèche, slogan ou sous-titre visible dans le menu.
Deux grandes zones se partagent la hauteur restante sous le bouton fermer,
avec texte aligné à gauche et centré verticalement, séparées par un filet
slate-200. « Les logements » est sur deux lignes. Texte normal (aucune
uppercase), 44 px à 375 px, réduit à 36 px sur petits écrans. Fond blanc 98 %.
Bouton fermer rond 56 px, fond slate-50, croix 24 px trait 1,8.
Ouverture : fondu et glissement 320 ms ; fermeture inverse 240 ms.
Croix : rotation de −90° à 0° à l'ouverture, vers 90° à la fermeture.
Les préférences de mouvement réduit désactivent déplacements et rotations.
Les destinations, confinement privé/démo et comportements clavier restent
fonctionnels. Cet amendement remplace les anciens contrats de menu dans
054 US-01 et 045 AC-01-06 ; il autorise cette modification dans les deux guides.

Précision PO du 2026-10-03 — Cartes Séjour : le trait des icônes principales
(vidéo, arrivée, Wi-Fi, guide, départ, transport) et des chevrons est réduit
à 1. Cette décision remplace la valeur 2,2 précédente ; tailles inchangées.

## Amendement approuvé — Retrait du bloc Adresse (2026-10-03)

Le PO demande de retirer la section Adresse illustrée dans sa capture du
guide : titre, carte copiable et bouton Maps associé disparaissent des vues
Aide et Guide logement, en privé et en démo. Cet amendement remplace les
exigences Adresse précédentes de AC-01-05 et AC-04-01. Le parcours Arrivée
conserve son adresse ; le lien Maps du point de tri est conservé.

## Amendement approuvé — Accueil et Aide (2026-10-03)

Le PO demande un trait encore plus fin : les icônes des cartes Accueil
et leurs chevrons utilisent un trait de 0,75 (attribut SVG et utilitaire
Tailwind). L’onglet Séjour est renommé Accueil, destination home inchangée.
Le bloc Conciergerie MyStay (pastille MS, texte et bouton Écrire) est retiré
d’Aide en privé et en démo. Les cartes de numéros utiles restent affichées.

Précision PO du 2026-10-04 : le trait des icônes principales et chevrons
des cartes Accueil revient à 1, remplaçant la valeur 0,75 précédente.

## Amendement approuvé — Réglages et infos (2026-10-04)

Décisions du PO : l’onglet Aide devient une icône Lucide Settings de 24 px,
trait 1, sans libellé visible, nom accessible « Réglages et infos ».
La destination interne help reste inchangée. Titre page « Réglages et infos ».
Deux cartes blanches arrondies avec ombre s’ajoutent avant Infos pratiques :
« Activer votre GPS » (icône LocateFixed, switch) et « Installer le guide »
(icône Download, bouton ouvrant un modal). Traits 1, palette ardoise.
Le switch réutilise useUserLocation : autorisation navigateur uniquement
après activation explicite, position partagée localement entre les écrans,
switch activé uniquement après succès, désactivation effaçant la position
locale, refus/indisponibilité affichés. Demande en cours : switch désactivé.
Cette interaction est autorisée également dans la démo après action explicite,
y compris le stockage existant sur l’appareil ; aucune persistance serveur
ni nouvelle requête réseau. Aucun suivi GPS en arrière-plan.
Le modal affiche dès maintenant le texte validé par le PO : « Votre position
reste sur votre appareil. L’installation est à venir, avec une désactivation
prévue après 7 jours. » Bouton « J’ai compris », fermeture Escape et voile,
focus contenu puis restauré au déclencheur. Aucune installation, service worker,
fonction standalone ou expiration effective n’est implémentée.
AC-01-07 : GPS opt-in, succès, désactivation et erreurs testés.
AC-01-08 : modal informatif sans installation, accessible et fermable.
Cet amendement complète 054 US-01 et 045 AC-01-06 / BR-08, autorise le
réemploi du hook géolocalisation client dans la démo et remplace son
interdiction de persistance locale uniquement pour cette position consentie.

## Amendement approuvé — Départ simplifié (2026-10-04)

Le PO retire les cinq dernières consignes fixes : remise en place des meubles,
fermeture des fenêtres/Velux, extinction des lumières/appareils, chauffage,
vérification des oublis. Les quatre premières consignes restent dans leur
ordre. Le sous-titre horaire « Avant [heure] » est retiré de la page Départ.
Privé et démo utilisent quatre points ; compteurs et progression ignorent
les anciens indices cochés au-delà de la liste restante. AC-04-02 amendé.

## Amendement approuvé — Navigation sans rechargement (2026-10-04)

Correction demandée par le PO : supprimer la latence des onglets et les retours
inattendus vers Accueil après sélection des réglages. Tous les écrans dont les
données sont déjà injectées dans GuideApp changent immédiatement côté client,
sans router.push ni nouvelle résolution serveur du guide. Les routes privées
existantes restent accessibles directement et leurs URLs sont conservées dans
l’historique natif Next.js. Carte et Réglages, sans route dédiée, utilisent
respectivement #carte et #reglages sur la route privée courante. Retour/avance
navigateur et réouverture avec ces fragments restaurent la bonne vue. Les taps
répétés ne créent pas d’entrée d’historique supplémentaire ; une navigation
rapide conserve toujours la dernière vue choisie. Le changement de vue remet
le scroll interne en haut. Les navigations randonnée restent App Router.
Le module JS de la carte est préchargé après hydration à temps perdu ; aucun
Mapbox/WebGL ni demande GPS n’est lancé avant son affichage.
AC-01-09 : premier clic Coups de cœur immédiat, sans navigation serveur.
AC-01-10 : séquence rapide entre onglets stable, sans remonter le guide ni
relancer ses requêtes partagées ; compteur et état séjour conservés.
AC-01-11 : historique retour/avance, fragments et retaps restent cohérents.
AC-01-12 : préchargement du module carte sans montage anticipé.
Aucun changement d’accès privé, données, API, persistance métier ou design.

## Amendement approuvé — Titres à droite du retour (2026-10-04)

Demande explicite du PO : sur Arrivée, Départ, Guide logement et Se déplacer
(spec 055), le bouton retour rond de 44 px et le bloc titre sont disposés
sur une même ligne, bouton à gauche et titre à droite, centrés verticalement
avec un espace de 12 px. Le sous-titre éventuel reste sous le titre dans ce
bloc. Les titres conservent leur typographie de 28 px et peuvent revenir à
la ligne ; le bouton ne rétrécit pas. Le contenu commence sous cet en-tête.
Privé et démo partagent ce rendu. Les actions retour restent inchangées.
AC-01-13 : les quatre titres sont à droite du bouton retour et les sous-titres
éventuels restent sous leur titre.

## Amendement approuvé — Alignement en-tête et menu (PO 2026-10-04)

Décisions du PO : dans l'en-tête du guide (68 px), le bouton menu est centré
verticalement sur la même ligne que le sélecteur FR | GB (spec 061), sans
décalage ; son icône devient Lucide `AlignRight` (nom actuel `TextAlignEnd`, trait 1,8, 24 px) au lieu de
`Menu`. Dans le menu ouvert, le bouton fermer (rond 56 px, fond slate-50,
inchangé) est placé dans une rangée de 68 px identique à l'en-tête, centré au
même point que le bouton menu : il apparaît exactement à la place de l'icône
qu'il remplace.
AC-01-14 : bouton menu aligné, icône `AlignRight` ; bouton fermer au même
emplacement que le bouton menu.

## Amendement approuvé — Bouton fermer du menu sans animation (PO 2026-10-04)

Le bouton fermer du menu ne tourne plus à l'ouverture ni à la fermeture (fin de
la rotation de la croix à 90°) et n'a plus de fond (slate-50 retiré) : croix
24 px trait 1,8 seule, zone tactile 56 px et emplacement AC-01-14 inchangés.
Le fondu du menu lui-même est conservé.
AC-01-15 : bouton fermer sans fond ni animation.

## Amendement approuvé — Journal limité aux guides locaux (PO 2026-10-04)

Demande explicite du PO : dans la section Journal du guide privé, afficher
uniquement les articles de catégorie `local_guide` (« Guide local »).
AC-01-16 : la requête serveur conserve le filtre sur la ville du séjour,
le statut `published`, l’absence de suppression et le tri par publication
décroissante, et ajoute le filtre de catégorie `local_guide`. Sans article
correspondant, l’état vide existant est conservé. La liste publique et la
démo conservent leur sélection actuelle. Aucune modification API ou Prisma.

## Amendement approuvé — Navigation basse compacte sur mobile installé (PO 2026-10-04)

Demande du PO, capture iPhone fournie : réduire la hauteur du menu bas et
centrer son contenu verticalement. AC-01-17 : la barre partagée privé/démo
mesure 56 px sans zone de sécurité (rangée 48 px, marge haute et basse 4 px).
Sur iPhone, la marge basse devient `max(4px, env(safe-area-inset-bottom))`
au lieu de cumuler une marge fixe et la zone de sécurité. Les quatre boutons
occupent les 48 px de la rangée et centrent icône/libellé avec un espace de
2 px. Icônes, libellés, destinations et indicateur restent inchangés.
Cette règle remplace la hauteur de 79 px de AC-01-01. Aucune nouvelle donnée
ou API ; le geste système reste protégé en mode installé et navigateur.

## Précision approuvée — Alignement vertical des icônes (PO 2026-10-04)

AC-01-18 : les quatre icônes de navigation ont le même centre vertical,
y compris cœur et réglages sans texte visible. Chaque bouton centre un groupe
identique : emplacement icône de 28 px, espacement 2 px, emplacement libellé
de 14 px. L’emplacement libellé est vide et aria-hidden pour cœur et réglages ;
leurs noms accessibles restent ceux des boutons. Hauteur et zone de sécurité
de AC-01-17 conservées. Privé et démo partagent la correction.

## Précision approuvée — Cœur centré en contour rose (PO 2026-10-04)

AC-01-19 : le cœur sans libellé est centré horizontalement et verticalement
dans les 48 px du bouton, sans emplacement de texte vide. Il utilise
`text-pink-600 fill-none` dans les états actif et inactif, sans remplissage
noir. L’indicateur gris et le nom accessible « Coups de cœur » restent présents.
Cette demande remplace pour le cœur le remplissage actif AC-01-01 et
l’emplacement libellé AC-01-18. Les autres onglets restent inchangés.

## Précision approuvée — Navigation par icônes seules (PO 2026-10-04)

AC-01-20 : retirer les libellés visibles Accueil/Home et Carte/Map. Les quatre
boutons affichent uniquement leur icône centrée, sans emplacement de libellé
vide. Tous les traits Lucide sont de largeur 1, comme Réglages. Les noms
accessibles localisés, les destinations, la hauteur compacte et le cœur
`pink-600` sans remplissage restent conservés. Cette règle remplace les
emplacements libellés AC-01-18. Privé et démo partagent ce rendu.


## Amendement approuvé — Journal du guide (PO 2026-10-05)

Le PO valide la refonte de la liste et de la lecture, dans la direction des
cartes logement, avec de nouveaux composants propres au guide.

- **AC-07-01** : la liste utilise `GuideBlogCard` : photo 4/3, coque blanche
  arrondie 32 px avec padding 8 px, catégorie sur la photo, titre et court
  extrait dessous, ville optionnelle. Chaque carte ouvre le détail dans le guide
  au clic et au clavier ; état vide localisé conservé. Sans photo, fond neutre
  avec icône Journal. Aucun lien marketing ajouté.
- **AC-07-02** : le détail utilise `GuideBlogArticle` : grande photo 4/3
  arrondie, catégorie, titre, ville optionnelle et corps Markdown avec texte
  14 px, interligne 28 px, paragraphes justifiés et titres hiérarchisés. Le bouton
  retour présente une cible de 44 px ; chargement localisé conservé.
- **AC-07-03** : `GuideBlogMarkdown` est dédié au guide, normalise le Markdown
  existant, ignore le HTML brut et conserve la protection des URL de
  react-markdown. Les listes, liens et titres sont rendus sans modifier le
  composant du blog public.

Tests : intégration pour AC-07-01/02/03. Données, contrats API, sélection des
articles, tri et traductions existants conservés. Pas de migration ni de
nouvelle fonctionnalité éditoriale. Aucune question ouverte pour cet amendement.


### Précision approuvée — Graisse des titres du Journal (PO 2026-10-05)

AC-07-03 : à la demande du PO (« ils sont trop fins »), les titres du corps
Markdown du guide utilisent une graisse bold (700), pour tous les niveaux
rendus h2 à h6. La taille et les espacements existants sont conservés.


### Correction approuvée — Tableaux Markdown du Journal (PO 2026-10-05)

AC-07-04 : les tableaux Markdown GFM sont rendus en tableaux HTML avec
en-têtes, bordures, cellules espacées et défilement horizontal interne
si nécessaire sur mobile. Utiliser remark-gfm dans le lecteur dédié ;
HTML brut et URL dangereuses restent filtrés. Test de rendu réel du moteur.


### Précision approuvée — Paragraphes et sources (PO 2026-10-05)

AC-07-05 : le corps des articles du guide privé utilise 14 px et les
paragraphes sont justifiés. Le contenu des sections Markdown « Sources » ou
« Références » utilise 12 px jusqu’au prochain titre de niveau égal ou
supérieur ; leurs titres conservent la hiérarchie existante. Le lecteur public
reste inchangé. Demande explicite du PO ; aucune question ouverte.
