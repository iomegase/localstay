/**
 * Titre « [Libellé] à [Commune] » sur deux lignes : la commune en serif italique
 * 34 px (spec 046 AC-03-16, AC-02-05). Coupe au dernier « à » ; sans « à », le
 * titre reste sur une ligne. Le texte accessible est inchangé.
 */
export function splitCityTitle(title: string): [string | null, string] {
  const index = title.lastIndexOf(' à ')
  if (index === -1) return [null, title]
  return [title.slice(0, index + 2), title.slice(index + 3)]
}

export function CityTitle({ title, testId }: { title: string; testId: string }) {
  const [lead, city] = splitCityTitle(title)
  if (!lead) return <>{title}</>
  return (
    <>
      <span className="block">{lead}</span>{' '}
      <span data-testid={testId} className="mt-3 block font-serif text-[34px] font-normal italic leading-[1.1] tracking-[-0.025em]">
        {city}
      </span>
    </>
  )
}
