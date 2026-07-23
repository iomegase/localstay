# Remove Redundant Wi-Fi Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retirer la vignette Wi-Fi du récapitulatif supérieur de `/le-logement` tout en conservant la carte détaillée et les données backend.

**Architecture:** La requête et `hasWifi` restent inchangés pour piloter la carte détaillée. Seul le troisième `FactCard` est retiré du JSX ; un test d'intégration distingue explicitement le libellé récapitulatif `Wi-Fi` du titre détaillé `Réseau Wi-Fi`.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Tailwind CSS, Jest et Testing Library.

---

### Task 1: Supprimer le résumé Wi-Fi

**Files:**
- Modify: `tests/integration/le-logement.practical-blocks.test.tsx`
- Modify: `src/app/(public)/le-logement/page.tsx`
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Écrire le test RED**

Dans le scénario riche contenant `wifi_ssid: 'MyStay-305'`, ajouter :

```tsx
expect(screen.queryByText('Wi-Fi')).not.toBeInTheDocument()
expect(screen.getByRole('heading', { name: 'Réseau Wi-Fi' })).toBeInTheDocument()
expect(screen.getByText('MyStay-305')).toBeInTheDocument()
expect(screen.getByText('secret-wifi')).toBeInTheDocument()
```

Remplacer l'ancienne assertion `getAllByText('MyStay-305')` par `getByText('MyStay-305')`, puisqu'il ne doit rester qu'une occurrence dans la carte détaillée.

- [ ] **Step 2: Vérifier RED**

Run: `npm test -- tests/integration/le-logement.practical-blocks.test.tsx --runInBand`  
Expected: FAIL parce que le `FactCard` Wi-Fi rend encore le libellé `Wi-Fi` et duplique le SSID.

- [ ] **Step 3: Retirer uniquement le `FactCard` redondant**

Dans `src/app/(public)/le-logement/page.tsx`, conserver les deux cartes horaires et supprimer cette ligne :

```tsx
{hasWifi && <FactCard icon={<Wifi className="h-5 w-5" />} label="Wi-Fi" value={customization?.wifi_ssid ?? 'Disponible'} color="green" />}
```

Ne pas modifier `hasWifi`, le `select` Prisma ni la carte `Réseau Wi-Fi`.

- [ ] **Step 4: Vérifier GREEN**

Run: `npm test -- tests/integration/le-logement.practical-blocks.test.tsx tests/unit/le-logement.interactions.test.tsx tests/unit/public-menu.lodging-guide-menu.test.tsx tests/unit/public-layout.mockup-menu.test.tsx --runInBand`  
Expected: 4 suites PASS.

Run: `npx tsc --noEmit`  
Expected: exit 0.

- [ ] **Step 5: Mettre à jour la traçabilité**

Ajouter `BR-21` à la ligne `/le-logement` et préciser que le Wi-Fi est rendu uniquement dans la carte détaillée.

- [ ] **Step 6: Commit**

```bash
git add src/app/'(public)'/le-logement/page.tsx \
  tests/integration/le-logement.practical-blocks.test.tsx \
  docs/traceability-matrix.md
git commit -m "fix: remove redundant wifi summary"
```
