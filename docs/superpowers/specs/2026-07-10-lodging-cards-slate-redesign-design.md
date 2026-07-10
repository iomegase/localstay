# Refonte cards guide logement — maquette « slate-800 »

Date : 2026-07-10
Fichier principal : `src/app/(public)/le-logement/page.tsx`
Nouveau composant : `src/app/(public)/le-logement/_components/WifiCredentials.tsx` (client)

## Objectif

Refondre les cartes de la page `/le-logement` pour coller à la maquette fournie
(CSS uniquement, pas le contenu), avec ces contraintes :
- **Pas de serif** : titres en police sans (`font-semibold`).
- **slate-800** comme accent sombre unique (icônes, titres, trait, pill, épingle).
- Carte Adresse : image de fond `= /fallback/fallback-transport.png` (placeholder).

## Décisions validées

1. Boutons copier Wi-Fi **fonctionnels** (presse-papier + retour ✓).
2. Carte Urgences **garde son fond rouge**, reçoit le nouveau chrome.
3. Vidéo de présentation (`presentation_video_url`) devient une **carte** « Vidéo du
   logement » dans la grille ; retirée du haut de page (la photo de couverture reste).
4. Nouveau style sur **toutes** les cartes : `PracticalCard` + `PracticalBlockCard`.
5. **Trait signature** sous le titre sur **toutes** les cartes (y compris Adresse).

## Langage visuel commun

- Carte : `bg-white rounded-[28px]` + ombre douce `shadow-[0_10px_40px_rgba(0,0,0,0.06)]`,
  suppression de la bordure `#EBEBEB` (chrome Airbnb précédent).
- Tuile d'icône : `h-12 w-12 rounded-2xl bg-[#F1F3F5]`, icône `text-slate-800`.
- Titre : `font-semibold text-2xl text-slate-800` (jamais serif).
- Trait signature : `mt-2 h-1 w-8 rounded-full bg-slate-800` sous le titre
  (variante blanche sur la carte rouge).
- Texte secondaire : gris `text-slate-500/600`.

## Thèmes

- `light` (défaut) : tokens ci-dessus, accent = slate-800.
- `red` (Urgences) : fond rouge plein conservé ; tuile `bg-white/15`, trait blanc,
  pill blanche, texte blanc.

## Carte Adresse

- Image de fond : `<Image src="/fallback/fallback-transport.png">` en position
  absolue à droite (`object-cover object-right`) + dégradé blanc→transparent
  (`bg-gradient-to-r from-white via-white/80`) pour lisibilité de l'adresse.
- Pill « **Ouvrir dans Maps** » en haut à droite : `bg-slate-800 text-white
  rounded-full px-4 py-2.5`, casse normale, `ArrowUpRight`. Remplace « Google Maps »
  sur toutes les cartes disposant d'un lien maps.

## Carte Wi-Fi — `WifiCredentials` (client)

- Props : `{ ssid: string | null, password: string | null }`.
- 2 lignes (Nom du réseau / Mot de passe) : label gris + valeur `font-mono
  font-bold text-slate-800` + bouton copier.
- Bouton copier : `navigator.clipboard.writeText(value)` ; icône `Copy` → `Check`
  pendant ~1,5 s ; `aria-label` explicite.
- Séparateur `border-t border-slate-100` entre les lignes.
- Footer « Connexion sécurisée » : `ShieldCheck` + texte gris discret.
- Remplace la branche `format: 'wifi'` de `renderValue` (aujourd'hui inline server).

## Carte Vidéo du logement

- Nouvelle section synthétique `{ key: 'video', title: 'Vidéo du logement',
  icon: Film, videoUrl: presentation_video_url }` insérée en tête de grille quand
  `presentation_video_url` existe.
- Le bloc vidéo est retiré de la section de présentation du haut ; la photo de
  couverture (`cover_photo_url`) y reste inchangée.

## Tests (TDD)

- **Unit** `WifiCredentials` : rend SSID/mot de passe ; clic sur copier appelle
  `navigator.clipboard.writeText` avec la bonne valeur et bascule l'icône en ✓.
  (mock de `navigator.clipboard`).
- Pas de test sur le CSS pur (chrome, image de fond, trait).

## Hors périmètre

- Aucune modification du contenu, des requêtes Prisma (au-delà de champs déjà
  chargés), du pager, ni d'une autre page.
