import { GuideNavigation } from '@mystay/design-system'

export const StayActive = () => (
  <div className="relative h-[110px] w-[375px] bg-[#F6F6F4]">
    <GuideNavigation activeView="home" onNavigate={() => {}} />
  </div>
)

export const GuideActive = () => (
  <div className="relative h-[110px] w-[375px] bg-[#F6F6F4]">
    <GuideNavigation activeView="favorites" onNavigate={() => {}} />
  </div>
)

export const HelpActive = () => (
  <div className="relative h-[110px] w-[375px] bg-[#F6F6F4]">
    <GuideNavigation activeView="help" onNavigate={() => {}} />
  </div>
)
