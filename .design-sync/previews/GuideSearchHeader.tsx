import { GuideSearchHeader, GuideLocationToggle } from '@mystay/design-system'

export const Empty = () => (
  <div className="w-[375px] bg-[#F6F6F4] px-3 py-5">
    <GuideSearchHeader city="Saint-Gervais-les-Bains" query="" onQueryChange={() => {}} />
  </div>
)

export const WithQuery = () => (
  <div className="w-[375px] bg-[#F6F6F4] px-3 py-5">
    <GuideSearchHeader city="Saint-Gervais-les-Bains" query="pâtisserie" onQueryChange={() => {}} />
  </div>
)

export const WithLocationControl = () => (
  <div className="w-[375px] bg-[#F6F6F4] px-3 py-5">
    <GuideSearchHeader
      city="Saint-Gervais-les-Bains"
      query=""
      onQueryChange={() => {}}
      locationControl={<GuideLocationToggle active={false} loading={false} denied={false} onRequest={() => {}} onClear={() => {}} />}
    />
  </div>
)
