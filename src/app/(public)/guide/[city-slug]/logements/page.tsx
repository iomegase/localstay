import { permanentRedirect } from 'next/navigation'

export default function LegacyLodgingListPage() {
  permanentRedirect('/logements')
}
