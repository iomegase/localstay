# Plan — Spec 054 : refonte du guide privé voyageur (option B)

Exécution inline en TDD (pas de subagents : permissions bloquées en arrière-plan).

## Phase 1 — Données
1. Prisma : enum `ArrivalStepKind`, champs `kind/tip/substeps/facts` sur `LodgingArrivalInstruction`,
   `key_box_code` sur `LodgingCustomization`, enum `StayEventType` + modèle `LodgingStayEvent`.
2. Migration additive, `prisma generate`, `migrate deploy` (DIRECT_URL pooler session).
3. Types `GuideArrivalInstruction` / `GuideLodging` étendus + mapping dans `getPrivateGuideData`.

## Phase 2 — API événements de séjour (AC-03-01, 03-03, 03-04, 03-05)
1. Tests contrat `tests/contract/private-guide-stay.AC-03.stay-events-api.test.ts`.
2. Route `src/app/api/guide/stay-events/route.ts` (Zod, session `lodging_id`, anti-doublon 10 min).
3. `sendStayEventNotificationEmail` dans `src/shared/lib/resend.ts`.

## Phase 3 — Saisie (AC-05-01, 05-02)
1. Validation + types guide-customization, éditeur d'étapes (type, intro, sous-étapes, repères, conseil).
2. Champ code boîte à clés dans `CustomizationForm` ; persistance dans la query de sauvegarde.

## Phase 4 — Écrans du guide (AC-01-*, 02-*, 03-02, 04-*)
1. `GuideNavigation` : 4 onglets Séjour · Guide · Carte · Aide (+ vue `help`).
2. `GuideHome` : hero, stats, tuiles, carrousel coups de cœur.
3. `GuideWifiSheet` (feuille basse).
4. `GuideArrivalFlow` (onglets d'étapes, médias, code, adresse, « Je suis arrivé·e »).
5. Guide logement (équipements + accordéon règles), Départ (checklist + « Je suis parti·e »).
6. `GuideHelpView` (conciergerie → contact, urgences, adresse).
7. Carte : aucune modification.

## Phase 5 — Démo (AC-06-01)
Aligner `DemoGuideApp` sur les nouveaux écrans, sans appel à l'API d'événements.

## Phase 6 — Vérifications
Suite Jest, tsc, lint ciblé, rendu Playwright 375 px, matrice de traçabilité.
