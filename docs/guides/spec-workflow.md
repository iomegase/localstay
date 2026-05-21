# Spec Workflow — StayLocal

> Ce guide décrit le processus complet du Spec Driven Development
> appliqué à ce projet. À lire avant de créer la moindre feature.

---

## Le principe fondamental

```
SPEC → REVIEW → APPROVE → CODE → TEST → TRACE
```

Le code n'existe que pour satisfaire une spec. Jamais l'inverse.

---

## Étape 1 — Créer la spec

1. Copier `specs/_templates/feature.spec.md`
2. La placer dans `specs/features/NNN-feature-name/spec.md`
3. Remplir **toutes** les sections (aucun `TODO` autorisé)
4. Statut initial : `draft`

### Sections obligatoires

- `metadata` avec statut, MVP, dépendances
- `context` — pourquoi cette feature existe
- `glossary_refs` — termes du glossaire utilisés
- `user_stories` — au format Given/When/Then
- `business_rules` — contraintes non ambiguës
- `data_model` — fragment Prisma
- `api_contract` — fragment OpenAPI 3.1
- `ui_behaviour` — états de l'interface
- `acceptance_criteria` — tableau complet
- `out_of_scope` — ce qui n'est PAS dans cette spec
- `open_questions` — questions ouvertes à résoudre

---

## Étape 2 — Review

1. Passer le statut à `review`
2. Vérifier que toutes les `open_questions` sont résolues
3. Vérifier la cohérence avec `specs/glossary.md`
4. Vérifier la cohérence avec les specs dont cette feature `depends_on`
5. Vérifier que l'`api_contract` est valide OpenAPI 3.1

---

## Étape 3 — Approval

1. Le product owner valide la spec
2. Passer le statut à `approved`
3. **À partir de ce moment, Claude Code peut générer le code**

> ⚠️ Toute modification d'une spec `approved` remet automatiquement
> le statut à `review` et invalide le code correspondant.

---

## Étape 4 — Génération du code avec Claude Code

Dans Claude Code, donner l'instruction suivante :

```
Lis AGENTS.md.
Lis specs/glossary.md.
Lis docs/DAT/architecture.md.
Lis specs/features/NNN-feature-name/spec.md.
Vérifie que le statut est `approved`.
Génère le code selon les règles de AGENTS.md.
```

Claude Code doit :
- Respecter exactement le contrat API de la spec
- Utiliser les types du modèle de données
- Implémenter toutes les business rules
- Ne rien ajouter qui ne soit pas dans la spec

---

## Étape 5 — Génération des tests

```
Génère les tests pour specs/features/NNN-feature-name/spec.md.
Chaque critère d'acceptation doit avoir au moins un test.
```

Mapping critère → type de test (défini dans AGENTS.md) :
- Business rule → unit test
- API contract → contract test
- Data integrity → integration test
- User flow → e2e test

---

## Étape 6 — Mise à jour de la traçabilité

Après code + tests :
1. Mettre à jour `docs/traceability-matrix.md`
2. Renseigner `Source File` et `Test File` pour chaque AC
3. Passer le statut des AC à ✅
4. Passer le statut de la spec à `implemented`

---

## Règles de nommage

### Features
```
NNN-feature-name/     → 001-city-guide, 002-categories...
```

### Fichiers source
```
src/features/feature-name/
  components/FeatureName.tsx
  hooks/useFeatureName.ts
  actions/featureNameActions.ts
  queries/featureNameQueries.ts
  types.ts
```

### Fichiers de test
```
tests/unit/feature-name.BR-01.description.test.ts
tests/integration/feature-name.AC-01-01.description.test.ts
tests/e2e/feature-name.AC-02-01.description.test.ts
tests/contract/feature-name.api-route.contract.test.ts
```

---

## Checklist avant de passer en `approved`

- [ ] Toutes les sections de la spec sont complètes
- [ ] Aucune `open_question` en statut `pending`
- [ ] Les termes utilisés sont dans `glossary.md`
- [ ] Les dépendances (`depends_on`) sont en statut `approved` ou `implemented`
- [ ] Le modèle de données est cohérent avec les specs dépendantes
- [ ] Le contrat API ne crée pas de conflit avec les routes existantes
- [ ] L'`out_of_scope` est explicite sur ce qui sera fait plus tard
- [ ] Les critères d'acceptation sont testables (Given/When/Then)

---

## Que faire si la spec change ?

1. Ouvrir une discussion avant de modifier
2. Documenter le changement dans la spec (section `changelog` à ajouter)
3. Repasser en `review`
4. Mettre à jour le code et les tests impactés
5. Mettre à jour la traceability matrix
