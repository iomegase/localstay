import { GuideStayScreen } from '@mystay/design-system'

export const SecondaryScreen = () => (
  <div className="w-[375px]">
    <GuideStayScreen title="Infos pratiques" subtitle="Tout ce qu’il faut savoir pendant le séjour" onBack={() => {}}>
      <div className="grid gap-3">
        <div className="rounded-[20px] bg-white p-4 text-[14px] text-[#111111] shadow-[0_1px_2px_rgba(17,17,17,0.06)]">Wi-Fi : Le305_5G</div>
        <div className="rounded-[20px] bg-white p-4 text-[14px] text-[#111111] shadow-[0_1px_2px_rgba(17,17,17,0.06)]">Point de tri : parking de la télécabine</div>
      </div>
    </GuideStayScreen>
  </div>
)
