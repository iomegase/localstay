# Spec — 098 Estimation de séminaire en ligne

## Metadata

```yaml
id: 098-seminar-online-quote
title: "Estimation automatique en ligne : chalet, taille du groupe, dates et activités"
status: draft
mvp: 2
owner: "Product Owner"
created_at: 2026-10-14
depends_on: [051-seminar-lodging-selection, 052-seminar-lead-modal, 089-lodging-availability-calendar, 097-seminar-activity-menu]
```

## Context

Demande du Product Owner (2026-10-14) : « commencer à réfléchir à un devis en
ligne automatique. L'utilisateur choisit son chalet, la capacité du groupe, les
dates, et coche les activités disponibles, classées par sous-menu de catégorie. »

Spec en réflexion : elle décrit le parcours cible et liste les décisions
nécessaires avant toute approbation.

Décision PO du 2026-10-14 : chantier mis en attente. En attendant, MyStay reste
sous le seuil du forfait touristique (pas d'estimation chiffrée instantanée ; la
demande de la spec 052 est conservée telle quelle). Le PO se rapproche
d'Atout France en vue d'une immatriculation, qui conditionnera la reprise.

### Contraintes existantes à respecter

- Décision PO du 2026-10-14 : MyStay peut émettre un **devis détaillé**
  incluant les activités ; chaque prestataire facture sa prestation
  directement au client (voir OQ-02 pour la validation juridique).
- Correction PO du 2026-10-14 (remplace la décision du 2026-10-13 qui suit) :
  MyStay **ne facture que ses clients partenaires** (les propriétaires). La
  location du chalet est facturée à l'entreprise **par son propriétaire** ; les
  frais de coordination MyStay sont facturés **au propriétaire**, jamais à
  l'entreprise. Un devis émis par MyStay devra donc présenter le chalet comme
  facturé par le propriétaire (à arbitrer avec OQ-02, OQ-03 et OQ-05).
- Décision PO du 2026-10-13 (corrigée ci-dessus) : MyStay ne facture que la
  **location du chalet et ses frais de coordination**. Repas, transferts et activités sont facturés
  **directement par chaque prestataire**, avec un budget récapitulatif. Ne
  jamais écrire « devis global », « facture unique » ni « tout compris » (pour
  ne pas relever du forfait touristique / immatriculation Atout France).
- La même décision prévoit « pas de prix affiché, fonctionnement sur devis »
  pour les séminaires : une estimation automatique en ligne la modifie (OQ-01).
- Aucun tarif de chalet n'existe en base : `Lodging` et `LodgingPublicProfile`
  n'ont ni prix à la nuit, ni saisonnalité, ni durée minimale.
- La disponibilité est connue via le lien iCal de la spec 089 (nuits réservées
  ou bloquées), sur 12 mois.
- Le simulateur de prix des activités (spec 097 BR-08c) fournit déjà le calcul
  HT/TTC par activité pour N participants.

## Glossary References

- **Lodging**, **Lodging Public Profile**, **Seminar Activity** (spec 097)
- Nouveau terme à définir : **Seminar Estimate (Estimation séminaire)**.

## User Stories

### US-01 — Composer son séminaire

En tant que visiteur, je choisis un chalet de la sélection séminaire, le nombre
de participants (select de 1 à 30), mes dates d'arrivée et de départ, puis je
coche les activités qui m'intéressent, classées par catégorie.

### US-02 — Obtenir une estimation immédiate

En tant que visiteur, je vois instantanément une estimation séparée en deux
blocs : la part MyStay (chalet + coordination) et le budget prestataires
(activités, facturées directement par chaque prestataire).

### US-03 — Transmettre ma demande

En tant que visiteur, j'envoie mon estimation avec mes coordonnées pour recevoir
une proposition confirmée.

### US-04 — Traiter la demande

En tant qu'Admin, je retrouve l'estimation (chalet, dates, participants,
activités, montants, prestataires internes associés) pour préparer la
proposition.

## Parcours proposé (à valider)

1. **Chalet** : cartes des logements `seminar_selected` publiés (spec 051).
2. **Groupe** : select de 1 à 30 participants, plafonné à la capacité du chalet
   choisi (OQ-04).
3. **Dates** : calendrier réutilisant la spec 089 ; nuits indisponibles grisées.
4. **Activités** : sous-menu par catégorie (onglets Team building, Hiver, Été,
   Bien-être, Gastronomie, Exception) avec cases à cocher ; prix calculé pour N
   participants à côté de chaque activité (OQ-06).
5. **Récapitulatif — « Estimation »** : bloc « MyStay » (location +
   coordination, HT/TTC, sous-total) et bloc « Activités » (une ligne par
   activité, HT/TTC, sous-total). Pas de total général (OQ-02 a).
6. **Envoi** : coordonnées (formulaire de la spec 052 réutilisé), enregistrement,
   e-mail au client et notification Admin (Resend).

## Business Rules

TODO — à rédiger après résolution des questions ouvertes. Pistes :

- calcul serveur uniquement (le client n'envoie que ses choix, jamais de prix) ;
- montants figés dans l'estimation enregistrée (prix au moment de la demande) ;
- les noms des prestataires ne sont jamais affichés au visiteur (spec 097 BR-02) ;
- dates refusées si une nuit est indisponible au moment de l'envoi.

## Data Model

TODO — dépend de OQ-03 (tarification du chalet) et OQ-05 (enregistrement).
Pistes : `LodgingSeminarRate` (tarif par nuit, saisons, durée minimale),
`SeminarEstimate` et `SeminarEstimateLine` (montants figés).

## API Contract

TODO — pistes : `POST /api/public/seminar-estimates/preview` (calcul sans
enregistrement), `POST /api/public/seminar-estimates` (envoi), lecture Admin.

## UI Behaviour

TODO — maquette requise dans `docs/DAT/diagrams/mockups/098-seminar-online-quote/`
avant approbation (parcours mobile-first en étapes).

## Acceptance Criteria

TODO — à dériver des Business Rules.

## Out of Scope

- Paiement en ligne, acompte, signature électronique.
- Réservation ferme du chalet sur la plateforme.
- Repas, transferts et hébergements multiples (à ajouter plus tard comme
  « activités » ou lignes dédiées).

## Open Questions

- OQ-01 (resolved 2026-10-14) — le PO accepte un chiffrage en ligne : MyStay
  peut fournir un **devis détaillé** (chalet, coordination et activités), et
  les prestataires facturent leurs prestations directement au client.
- OQ-02 (pending) — **juridique, avant approbation** : facturer séparément ne
  suffit pas forcément à écarter la qualification de forfait touristique
  (Code du tourisme, art. L211-2). Un hébergement et une autre prestation
  touristique choisis sur un même parcours avant que le client s'engage, ou
  présentés avec un prix total, peuvent constituer un forfait, même si chaque
  prestataire facture de son côté. Piste d'exclusion à vérifier : les voyages
  d'affaires achetés dans le cadre d'une convention générale entre
  professionnels (art. L211-1). À faire valider par un conseil ou par
  Atout France. Décisions PO du 2026-10-14 :
  (a) un sous-total par bloc (MyStay / activités), pas de total général ;
  (b) libellé « estimation » ;
  (c) pas de mention « facturé directement par le prestataire » sur les lignes ;
  (d) convention générale B2B : en attente (explication fournie au PO le
      2026-10-14 ; portée de l'exclusion pour un séminaire ponctuel à faire
      confirmer par un conseil).
  La validation juridique globale reste requise avant approbation.
- OQ-03 (pending) — **tarif du chalet** : prix par nuit fixe, par saison, par
  jour de semaine, durée minimale ? Prix par personne ou par chalet ?
- OQ-04 (pending) — le select va jusqu'à 30 alors que le Chalet Rémy accueille
  26 personnes : plafonner à la capacité du chalet, ou permettre plus en
  hébergement complémentaire ?
- OQ-05 (pending) — **frais de coordination MyStay** : montant fixe, pourcentage
  du total, par personne ? Affichés ou ajoutés à la proposition finale ?
- OQ-06 (pending) — afficher le prix de chaque activité au visiteur dans le
  configurateur (alors que les cartes vitrine n'en montrent pas) ?
- OQ-07 (pending) — « activités disponibles » : toutes les activités publiées,
  ou seulement celles attribuées à la commune du chalet ? Filtrer selon la
  saison des dates choisies (nécessite des saisons structurées en plus du texte
  libre `season_label`) ?
- OQ-08 (pending) — l'estimation est-elle envoyée par e-mail au client (PDF ou
  lien), ou seulement transmise à MyStay qui répond sous 48 h ?
