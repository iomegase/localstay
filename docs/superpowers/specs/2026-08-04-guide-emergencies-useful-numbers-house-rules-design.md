# Design — Urgences, Numéros utiles & Règlement intérieur (guide privé)

- date: 2026-08-04
- specs liées: 037-private-guide-arrival, 038-private-guide-practical-info
- statut: validé (décisions produit prises)

## Contexte

Dans le guide voyageur privé (`GuideLodgingViews`), trois champs propriétaire
existent (`house_rules`, `emergency_contacts`, `useful_services`) mais :

- `emergency_contacts` (texte libre) est le seul affiché, sous le bloc
  « Numéros utiles » de *Informations pratiques*.
- `house_rules` (Règlement intérieur) est **collecté mais jamais affiché** →
  régression : le règlement n'apparaît plus dans le guide.
- `useful_services` est collecté mais **jamais affiché** (champ mort).

## Décisions produit

1. **Règlement intérieur** → affiché dans **Informations pratiques uniquement**.
2. **Numéros utiles** structurés → stockés en **réutilisant une colonne texte**
   (`useful_services`), sérialisés `Catégorie: numéro` (aucune migration DB).
3. **Urgences** → **carte en dur** (France), affichée dans **Informations
   pratiques uniquement**, sans saisie propriétaire.

## Cible

### 1. Urgences (en dur)

Nouveau module `src/features/guide-app/lib/emergency-numbers.ts` :

```
FRENCH_EMERGENCY_NUMBERS = [
  { number: '112', label: "Urgences (numéro européen)" },
  { number: '15',  label: 'SAMU — urgences médicales' },
  { number: '18',  label: 'Pompiers' },
  { number: '17',  label: 'Police / Gendarmerie' },
  { number: '114', label: 'Urgence par SMS (sourds & malentendants)' },
  { number: '115', label: 'Samu social (sans-abri)' },
  { number: '119', label: 'Enfance en danger' },
]
```

Carte « Urgences » (style navy) dans la vue `practical`, chaque numéro
cliquable (`tel:`). Toujours affichée (indépendante des données propriétaire).

### 2. Numéros utiles (structurés, éditables)

- **Rendu** : le bloc « Numéros utiles » existant, alimenté par
  `usefulNumbers` — désormais mappé depuis `useful_services` (au lieu de
  `emergency_contacts`). Le parseur `mapUsefulNumbers` (`label: number`) reste
  inchangé. Affiché seulement si non vide.
- **Édition propriétaire** : le textarea libre `useful_services` est remplacé
  par un éditeur de lignes répétables `{ catégorie (select) + téléphone }`.
  - Catégories preset : Office de tourisme, Mairie, Médecin, Pharmacie, Taxi,
    Contact logement, Supermarché, **Autre (préciser)**.
  - Sérialisation → `useful_services` texte : `Label: numéro` par ligne.
  - Chargement → parse `Label: numéro` en lignes ; label reconnu → preset,
    sinon « Autre » avec label conservé.
- Le champ libre **`emergency_contacts` est retiré du formulaire** (urgences en
  dur). La colonne DB reste (non utilisée, pas de migration).

### 3. Règlement intérieur

Carte « Règlement intérieur » (icône `ScrollText`) dans la vue `practical`,
rendant `lodging.houseRules` (string[]) en liste. Affichée seulement si non
vide. Le lien menu « Consignes du logement » (déjà présent, compte
`houseRules.length`) pointe vers `practical` — inchangé.

### Ordre de la vue *Informations pratiques*

1. Wi-Fi (existant)
2. Cartes pratiques (existant)
3. **Règlement intérieur** (nouveau, si non vide)
4. **Urgences** (nouveau, en dur, toujours)
5. **Numéros utiles** (existant, source `useful_services`, si non vide)

## Fichiers touchés

- `src/features/guide-app/lib/emergency-numbers.ts` (nouveau)
- `src/features/guide-app/components/GuideLodgingViews.tsx` (rendu practical)
- `src/features/guide-app/queries/private-guide-data.ts` (`usefulNumbers` ←
  `useful_services`)
- `src/features/guide-customization/components/CustomizationForm.tsx` (éditeur
  structuré numéros utiles ; retrait du champ Urgences)
- Helper de sérialisation/parse numéros utiles (testable isolément)

## Tests (TDD)

- Unit : sérialisation ↔ parse des numéros utiles (round-trip, Autre, vides).
- Unit : `emergency-numbers` expose le set attendu.
- Intégration `practical` : rend la carte Urgences (112/18…), le Règlement
  (si présent), les Numéros utiles depuis `useful_services`.
- Query : `usefulNumbers` provient de `useful_services`.
- Form : l'éditeur ajoute/retire des lignes et sérialise vers `useful_services` ;
  plus de champ « Urgences ».

## Hors périmètre

- Migration DB / colonne JSON dédiée.
- Édition du règlement/urgences par le voyageur.
- Internationalisation des numéros d'urgence (France uniquement).
