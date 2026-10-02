# Notes /design-sync — MyStay

## Montage (repo = app Next.js, pas une librairie)
- Pas de `dist/` : le « paquet » est `.design-sync/pkg/` (barrel `entry.ts` + `package.json`
  nommé `@mystay/design-system`). `cfg.entry` pointe le barrel ; `cfg.srcDir` = `../../src`.
- `cfg.buildCmd` (`node .design-sync/build-ds.mjs`) DOIT tourner avant le convertisseur :
  - `tsc -p .design-sync/tsconfig.ds.json` émet les `.d.ts` dans `pkg/types/`, puis les alias
    `@/…` sont réécrits en relatif (ts-morph du convertisseur n'a pas les `paths`) ;
  - Tailwind compile `src/**` + `.design-sync/previews/*.tsx` → `pkg/css/mystay.css`
    (`cfg.cssEntry`, doit être DANS le paquet, sinon « resolves outside the package — skipped »).
- **Relancer `build-ds.mjs` après toute édition d'un aperçu** : une classe arbitraire présente
  seulement dans un aperçu (ex. `w-[300px]`) n'existe pas dans le CSS sinon → carte mal dimensionnée.
- Polices : `next/font` n'existe pas hors Next → `.design-sync/fonts.css` importe Google Fonts
  (Plus Jakarta Sans, Playfair Display, Story Script, Big Shoulders Inline) et pose les variables
  `--font-jakarta` / `--font-playfair` / `--font-story` / `--font-big-shoulders` (`[FONT_REMOTE]` attendu).
- Sous-parties Shadcn (CardHeader, SelectItem…) et primitives Recharts (BarChart, XAxis…) sont
  exportées par le bundle mais exclues des cartes via `componentSrcMap: null`.
- Écrans du guide : props écrites à la main dans `cfg.dtsPropsFor` (les types internes
  `GuideLodging`, `GuidePoi`… ne sont pas résolubles par l'agent) — à tenir à jour si les types
  `src/features/guide-app/types.ts` changent.
- Exclus volontairement : logo (`next/image`), composants qui appellent l'API au montage
  (prochaines navettes, page Navette, carte MapBox), formulaires admin.

## Aperçus
- Recharts : `isAnimationActive={false}` sinon capture en pleine animation.
- Overlays (Dialog, AlertDialog, Select ouvert) : `cfg.overrides` `cardMode: single` + viewport.

- Écrans hauts (arrivée, départ, aide) : `cardMode: column` + viewport haut (sinon cellules coupées).
- Composants trop larges pour la grille (Card, ChartContainer, Textarea, GuideNavigation,
  GuideSearchHeader, GuideFavoriteBentoCard) : `cardMode: column` (suite à `[GRID_OVERFLOW]`).
- Images d'aperçu : URLs absolues `https://www.mystay.city/...` (public/marketing, public/demo,
  public/fallback) — elles doivent rester servies en prod.

## Known render warns
- (aucun après les overrides ci-dessus)

## Re-sync risks
- `cfg.dtsPropsFor` recopie à la main les formes `GuideLodging` / `GuidePoi` / départs : à
  re-synchroniser si `src/features/guide-app/types.ts` ou `src/features/transport/types.ts` changent
  (sinon l'agent de design reçoit des props périmées).
- Le barrel `.design-sync/pkg/entry.ts` liste les composants à la main : un nouveau composant
  de l'app n'apparaît pas tant qu'il n'y est pas ajouté (+ aperçu dans `.design-sync/previews/`).
- Polices servies par Google Fonts (réseau) ; tailles/graisses limitées à celles de `fonts.css`.
- CSS = utilitaires réellement présents dans `src/**` + aperçus : une classe arbitraire que l'agent
  invente n'existe pas (l'en-tête de conventions le dit).
- Build validé avec Node 22.15, Next 16.2, Tailwind 3.4, React 19.2, Playwright 1.60 (chromium-1223).
