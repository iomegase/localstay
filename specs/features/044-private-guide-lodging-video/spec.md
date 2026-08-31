# Spec — 044 Private Guide Lodging Video

## Metadata

```yaml
id: 044-private-guide-lodging-video
title: "Vidéo du logement sur la home privée"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-08-31
updated_at: 2026-08-31
depends_on:
  - 012-guide-customization
  - 034-private-guide-app
bounded_context: private-guide
implementation_gate: "Design validé par le Product Owner le 2026-08-31"
```

## Context

L'Owner peut déjà enregistrer une URL YouTube de présentation dans
`LodgingCustomization.presentation_video_url`. Cette vidéo est disponible dans
le dashboard et sur l'ancienne page privée `/le-logement`, mais elle n'est pas
exposée sur la home canonique `/sejour`.

La home privée doit proposer un accès direct à cette vidéo avant le bouton
« Découvrir le livret d'accueil », sans ajouter de donnée, de route ou de
lecteur concurrent.

## Glossary References

- **Guide**
- **Lodging**
- **Owner**
- **Tourist**

## User Stories

### US-01 — Regarder la vidéo du logement depuis la home privée

**As a** Tourist disposant d'un séjour actif
**I want to** ouvrir la vidéo de présentation du logement depuis `/sejour`
**So that** je découvre rapidement le logement sans quitter le guide privé

#### Acceptance Criteria

- **AC-01-01**: Given un Lodging actif dont la personnalisation contient une
  URL YouTube valide, When `/sejour` s'affiche, Then un bouton
  « Voir la vidéo du logement » est rendu immédiatement au-dessus de
  « Découvrir le livret d'accueil ».
- **AC-01-02**: Given le bouton vidéo visible, When le Tourist l'active, Then
  une fenêtre superposée s'ouvre sur la page et affiche le lecteur YouTube
  MyStay existant avec le titre « Vidéo du logement ».
- **AC-01-03**: Given la fenêtre vidéo ouverte, When le Tourist active
  « Fermer », clique sur l'arrière-plan ou appuie sur Échap, Then la fenêtre se
  ferme et la home privée reste affichée à son état précédent.
- **AC-01-04**: Given une URL absente, vide ou non reconnue comme URL YouTube,
  When `/sejour` s'affiche, Then aucun bouton ni emplacement vidéo vide n'est
  rendu.
- **AC-01-05**: Given la vidéo disponible, When la home privée s'affiche sans
  interaction, Then aucun iframe YouTube n'est chargé ; le lecteur sans cookies
  existant n'est activé qu'après une action explicite du Tourist.

## Business Rules

- **BR-01**: La source unique est le champ existant
  `LodgingCustomization.presentation_video_url`, édité dans le dashboard de
  personnalisation du Lodging.
- **BR-02**: Aucune valeur de démonstration, URL de secours ou vidéo générique
  n'est utilisée lorsque le champ est absent ou invalide.
- **BR-03**: `getPrivateGuideData` lit l'URL côté serveur et l'adapte dans
  `GuideLodging`. `GuideHome` ne lit ni Prisma, ni cookie, ni paramètre privé.
- **BR-04**: La validité de l'URL repose sur le parseur YouTube partagé
  `extractYouTubeId`. Une URL invalide est traitée comme une absence de vidéo.
- **BR-05**: Le rendu réutilise `YouTubeEmbed` et son URL
  `youtube-nocookie.com`. Aucun second lecteur YouTube n'est créé.
- **BR-06**: Le nouveau bouton reprend le langage visuel des accès rapides de
  `GuideHome` et ne modifie pas l'ordre ni la destination des trois modules
  existants.
- **BR-07**: La fenêtre est accessible au clavier, expose un nom de dialogue,
  possède un bouton « Fermer » et restaure l'interface sans navigation.
- **BR-08**: La fonctionnalité reste strictement privée et soumise au contrôle
  de séjour existant de `/sejour`.

## Data Model

Aucune migration Prisma. Le champ existant est lu sans modification :

```prisma
model LodgingCustomization {
  lodging_id                String  @id
  presentation_video_url    String?
}
```

L'adaptateur ajoute uniquement la propriété de présentation suivante au type
TypeScript partagé :

```typescript
type GuideLodging = {
  presentationVideoUrl?: string
}
```

## API Contract

Aucune nouvelle route et aucune modification du contrat HTTP. `/sejour` reste
un Server Component privé et utilise la query existante
`getPrivateGuideData(lodgingId)`.

## UI Behaviour

### Bouton vidéo

- Position : premier accès rapide de la zone de navigation de `GuideHome`,
  immédiatement avant « Découvrir le livret d'accueil ».
- Libellé : `Voir la vidéo du logement`.
- Présentation : bouton bleu nuit arrondi cohérent avec les autres accès
  rapides, icône vidéo dans une pastille colorée et flèche à droite.
- Le bouton est entièrement omis si l'URL ne fournit pas d'identifiant YouTube
  valide.

### Fenêtre superposée

- Fond sombre superposé à la home privée.
- Dialogue centré dans la largeur mobile du guide, avec le titre accessible
  `Vidéo du logement`.
- Lecteur `YouTubeEmbed` partagé, miniature avant lecture et iframe
  `youtube-nocookie.com` après activation du bouton de lecture.
- Bouton visible `Fermer`.
- Fermeture par bouton, clic sur l'arrière-plan ou touche Échap.
- Un clic dans le contenu du dialogue ne ferme pas la fenêtre.

### États

- URL valide : bouton visible, fenêtre fermée par défaut.
- URL absente ou invalide : aucun rendu vidéo.
- Fermeture : retour immédiat à la home, sans navigation ni rechargement.

## Acceptance Criteria

| Criterion | Test type |
|---|---|
| AC-01-01 | unit + integration |
| AC-01-02 | integration |
| AC-01-03 | integration |
| AC-01-04 | unit + integration |
| AC-01-05 | integration |
| BR-03 | unit |
| BR-04 | unit |
| BR-05 | unit + integration |

## Out of Scope

- Ajout ou modification du champ vidéo dans le dashboard Owner.
- Upload ou hébergement de fichiers vidéo.
- Prise en charge de Vimeo, Dailymotion ou d'autres plateformes.
- Lecture automatique au chargement de `/sejour`.
- Modification de l'ancienne page `/le-logement`.
- Migration Prisma, nouvelle API ou modification du contrôle d'accès séjour.
- Changement des destinations ou du contenu des modules existants de la home.

## Open Questions

Aucune question ouverte.
