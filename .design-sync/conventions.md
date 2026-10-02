# MyStay design system — conventions

MyStay is a French, mobile-first (375 px) traveller guide for holiday rentals. Write all UI copy in French.

## Setup
- No provider or theme wrapper is needed: every component is styled by `styles.css` (Tailwind utilities compiled from the MyStay app + shadcn CSS variables + fonts). Import components from `window.MyStay`.
- Fonts load from Google Fonts in `styles.css`: body = Plus Jakarta Sans (`font-sans`), display = Playfair Display (`font-serif`, used italic for the lodging name).
- Overlays (`Dialog`, `AlertDialog`, `Select`) portal to `document.body`. `GuideWifiSheet`, `MediaLightbox` and `GuideNavigation` are `absolute` — put them in a `relative` container the size of the phone screen.

## Styling idiom — Tailwind utility classes
Only classes already compiled into `styles.css` exist; arbitrary values not used by the app will not resolve (use inline `style` for anything else).
- **Back office (shadcn tokens)**: `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-muted`, `bg-card`, `bg-primary`/`text-primary-foreground` (near-black), `bg-secondary`, `bg-destructive`, `border-input`; brand `text-charcoal`, `bg-ivory`.
- **Traveller guide (MyStay palette)**: page `bg-[#F6F6F4]`, ink `text-[#111111]`/`bg-[#111111]`, pink accent `bg-[#DB2777]`/`text-[#DB2777]`, dark pink `text-[#BE185D]`, pale pink `bg-[#FCE7F3]`, secondary text `text-[#697386]`, inactive `text-[#9CA3AF]`, cards `bg-white rounded-[20px]`, hero/sheets `rounded-[28px]`, icon tiles `rounded-[14px]`.
- Type scale: `text-[12px]` meta, `text-[13px]` secondary, `text-[15px]` strong body, `text-[22px]` card title, `text-[28px]` screen title, `text-[30px]` tab title; eyebrows `uppercase tracking-[0.12em] text-[#DB2777]`.
- Spacing: screen gutter `px-5`, gaps `gap-2.5`; touch targets `min-h-11` / `h-11` (44 px). Icons: lucide-react, `strokeWidth={1.8}`.

## Where the truth lives
- `styles.css` → `_ds_bundle.css` (all classes and `--background`, `--primary`, `--radius`… tokens).
- Each component's `<Name>.d.ts` (exact props, incl. the full `lodging` / `poi` data shapes for guide screens) and `<Name>.prompt.md`.
- Shadcn parts are exported too: `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`, `DialogContent`, `SelectTrigger`, `SelectItem`, `TableRow`, `TableCell`…; charts use `ChartContainer` + `BarChart`, `Bar`, `LineChart`, `Line`, `XAxis`, `YAxis`, `CartesianGrid` (set `isAnimationActive={false}` for static renders).
- Guide screens: `GuideStayHome`, `GuideArrivalFlow`, `GuideDepartureView`, `GuideHouseGuide`, `GuideHelpView`, `GuideTransportView`, wrapped by `GuideStayScreen`; tabs `GuideNavigation`; place cards `GuideFavoriteBentoCard`; shuttles `RoutePill`, `FacilibusDepartureRow`, `StationDistance`. Never invent distances or times: pass real values or omit them.

## Example
```jsx
const { Card, CardHeader, CardTitle, CardContent, Button, Badge } = window.MyStay

<div className="min-h-screen bg-[#F6F6F4] px-5 py-6">
  <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#DB2777]">Le guide</p>
  <h1 className="mt-1 text-[30px] font-semibold text-[#111111]">Saint-Gervais</h1>
  <Card className="mt-4">
    <CardHeader><CardTitle>Le 305</CardTitle></CardHeader>
    <CardContent className="flex items-center gap-2.5">
      <Badge>Publié</Badge>
      <Button size="sm">Personnaliser</Button>
    </CardContent>
  </Card>
</div>
```
