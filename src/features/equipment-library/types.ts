export type EquipmentTemplateStatus = 'pending' | 'approved' | 'rejected'

export type EquipmentTemplate = {
  id: string
  title: string
  icon: string
  body: string | null
  status: EquipmentTemplateStatus
  created_at: string
}
