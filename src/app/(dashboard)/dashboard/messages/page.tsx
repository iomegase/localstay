import { getPageOwner } from '@/features/dashboard-owner/lib/get-page-owner'
import { listOwnerContactMessages } from '@/features/contact-messages/queries/contact-messages'
import { OwnerContactMessagesPanel } from '@/features/contact-messages/components/OwnerContactMessagesPanel'

export default async function OwnerMessagesPage() {
  const owner = await getPageOwner()
  const messages = await listOwnerContactMessages(owner.id)

  return <OwnerContactMessagesPanel messages={messages} />
}
