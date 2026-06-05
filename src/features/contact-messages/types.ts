export type ContactMessageDestination = 'owner' | 'concierge'
export type ContactMessageStatus = 'new' | 'replied' | 'archived'

export type AdminContactMessageRow = {
  id: string
  created_at: string
  lodging_name: string
  destination: ContactMessageDestination
  status: ContactMessageStatus
  sender_name: string
  sender_email: string
  sender_phone: string | null
  subject: string
  message: string
  archived_at: string | null
  reply_body: string | null
  replied_at: string | null
}

export type OwnerContactMessageRow = {
  id: string
  created_at: string
  lodging_name: string
  status: ContactMessageStatus
  sender_name: string
  sender_email: string
  sender_phone: string | null
  subject: string
  message: string
}
