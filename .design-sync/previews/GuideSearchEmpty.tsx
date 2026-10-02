import { GuideSearchEmpty } from '@mystay/design-system'

export const NoResult = () => (
  <div className="w-[375px] bg-[#F6F6F4] pb-8">
    <GuideSearchEmpty query="piscine chauffée" onClear={() => {}} />
  </div>
)
